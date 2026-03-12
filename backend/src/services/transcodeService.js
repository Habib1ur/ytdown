const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ffmpegStatic = require("ffmpeg-static");
const config = require("../config");
const logger = require("../utils/logger");
const { getVideoProfile, getAudioProfile } = require("./transcodeProfiles");
const { analyzeSource } = require("./mediaProbeService");
const jobState = require("./jobStateService");
const { getIo } = require("../socket");

// Tracks active FFmpeg child processes for cancellation support
const activeProcesses = new Map();

function parseFfmpegTime(line) {
  const match = /time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(line);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function buildOutputPath(jobId, ext) {
  const dir = path.join(config.storage.tempRoot, String(jobId));
  const fileName = `${jobId}.${ext}`;
  const filePath = path.join(dir, fileName);
  return { dir, fileName, filePath };
}

function mimeByExt(ext) {
  if (ext === "mp4") return "video/mp4";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  return "application/octet-stream";
}

function emit(jobId, event, payload) {
  const io = getIo();
  if (io) io.to(jobId).emit(event, payload);
}

async function runTranscode(jobId, { sourceUrl, outputType, quality }) {
  try {
    await jobState.setProgress(jobId, 0);
    emit(jobId, "job-progress", { jobId, progress: 0, status: "processing" });

    const meta = await analyzeSource(sourceUrl);
    const duration = Math.max(1, Number(meta.duration || 1));

    let ext = "mp4";
    let args = [];

    if (outputType === "video") {
      const profile = getVideoProfile(quality);
      args = [
        "-y",
        "-i",
        sourceUrl,
        "-vf",
        `scale=-2:${profile.height}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
      ];
    } else {
      const profile = getAudioProfile(quality);
      ext = profile.ext;
      args = [
        "-y",
        "-i",
        sourceUrl,
        "-vn",
        "-c:a",
        profile.codec,
        "-b:a",
        profile.bitrate,
      ];
    }

    const output = buildOutputPath(jobId, ext);
    await fs.promises.mkdir(output.dir, { recursive: true });

    const ffmpegPath = ffmpegStatic || "ffmpeg";
    const child = spawn(ffmpegPath, [...args, output.filePath], {
      stdio: ["ignore", "ignore", "pipe"],
    });

    activeProcesses.set(jobId, child);

    let stderr = "";
    child.stderr.on("data", async (chunk) => {
      const line = String(chunk);
      stderr += line;
      const sec = parseFfmpegTime(line);
      if (sec === null) return;
      const progress = Math.min(
        99,
        Math.max(1, Math.round((sec / duration) * 100)),
      );
      await jobState.setProgress(jobId, progress);
      emit(jobId, "job-progress", { jobId, progress, status: "processing" });
    });

    const exitCode = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });

    activeProcesses.delete(jobId);

    if (exitCode !== 0) {
      throw new Error(`ffmpeg failed (${exitCode}): ${stderr.slice(-500)}`);
    }

    const stat = await fs.promises.stat(output.filePath);
    const expiresAt = Date.now() + config.storage.fileTtlMinutes * 60 * 1000;

    await jobState.setCompleted(jobId, {
      filePath: output.filePath,
      fileName: output.fileName,
      mimeType: mimeByExt(ext),
      size: stat.size,
      expiresAt,
    });

    emit(jobId, "job-completed", { jobId, status: "completed", progress: 100 });
  } catch (err) {
    activeProcesses.delete(jobId);
    await jobState.setFailed(jobId, err ? err.message : "Unknown error");
    logger.error({ jobId, err }, "Transcode failed");
    emit(jobId, "job-failed", {
      jobId,
      status: "failed",
      error: err ? err.message : "unknown",
    });
  }
}

// Kill an active FFmpeg process (used by cancel endpoint)
function killJob(jobId) {
  const child = activeProcesses.get(jobId);
  if (child) {
    try {
      child.kill("SIGTERM");
    } catch {}
    activeProcesses.delete(jobId);
    return true;
  }
  return false;
}

module.exports = { runTranscode, killJob };
