const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ffmpegStatic = require("ffmpeg-static");
const { Worker } = require("bullmq");
const config = require("../config");
const connection = require("../queue/redis");
const logger = require("../utils/logger");
const {
  getVideoProfile,
  getAudioProfile,
} = require("../services/transcodeProfiles");
const { analyzeSource } = require("../services/mediaProbeService");
const jobState = require("../services/jobStateService");

function parseFfmpegTime(line) {
  const match = /time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(line);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  const ss = Number(match[3]);
  return hh * 3600 + mm * 60 + ss;
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

async function transcode(job) {
  const { sourceUrl, outputType, quality } = job.data;
  if (!sourceUrl || !outputType) {
    throw new Error("Invalid job payload");
  }

  const meta = await analyzeSource(sourceUrl);
  const duration = Math.max(1, Number(meta.duration || 1));

  let ext = "mp4";
  let args = [];

  if (outputType === "video") {
    const profile = getVideoProfile(quality);
    ext = "mp4";
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

  const output = buildOutputPath(job.id, ext);
  await fs.promises.mkdir(output.dir, { recursive: true });

  const ffmpegPath = ffmpegStatic || "ffmpeg";
  const child = spawn(ffmpegPath, [...args, output.filePath], {
    stdio: ["ignore", "ignore", "pipe"],
  });

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
    await job.updateProgress(progress);
    await jobState.setProgress(job.id, progress);
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`ffmpeg failed (${exitCode}): ${stderr.slice(-500)}`);
  }

  const stat = await fs.promises.stat(output.filePath);
  const expiresAt = Date.now() + config.storage.fileTtlMinutes * 60 * 1000;

  await jobState.setCompleted(job.id, {
    filePath: output.filePath,
    fileName: output.fileName,
    mimeType: mimeByExt(ext),
    size: stat.size,
    expiresAt,
  });

  await job.updateProgress(100);

  return {
    filePath: output.filePath,
    fileName: output.fileName,
    size: stat.size,
    mimeType: mimeByExt(ext),
  };
}

const worker = new Worker(config.queue.name, transcode, {
  connection,
  concurrency: config.queue.concurrency,
});

worker.on("ready", () => {
  logger.info(`Worker ready with concurrency=${config.queue.concurrency}`);
});

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed");
});

worker.on("failed", async (job, err) => {
  const jobId = job ? job.id : "unknown";
  await jobState.setFailed(jobId, err ? err.message : "Unknown failure");
  logger.error({ jobId, err }, "Job failed");
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
