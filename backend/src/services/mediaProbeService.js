const { spawn } = require("child_process");
const ffprobeStatic = require("ffprobe-static");
const youtubedl = require("youtube-dl-exec");

function runFfprobe(url) {
  return new Promise((resolve, reject) => {
    const args = [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      url,
    ];

    const child = spawn(ffprobeStatic.path, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed: ${stderr || code}`));
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        reject(new Error("Failed to parse ffprobe output"));
      }
    });
  });
}

async function analyzeSource(url) {
  try {
    // Attempt yt-dlp first for better metadata extraction from streaming sites
    const data = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    return {
      title: data.title || "Untitled Media",
      thumbnail: data.thumbnail || null,
      duration: Number(data.duration || 0),
      width: Number(data.width || 0),
      height: Number(data.height || 0),
      sourceBitrate: Number(data.tbr || 0) * 1000, // yt-dlp uses kbps for tbr
      formats: data.formats, // Keep raw formats for later use if needed
    };
  } catch (err) {
    // Fallback to ffprobe for direct media links
    const data = await runFfprobe(url);
    const streams = data.streams || [];
    const format = data.format || {};
    const videoStream = streams.find((s) => s.codec_type === "video");
    const duration = Number(format.duration || 0);

    return {
      title: (format.tags && format.tags.title) || "Untitled Media",
      thumbnail: null,
      duration,
      width: videoStream ? Number(videoStream.width || 0) : null,
      height: videoStream ? Number(videoStream.height || 0) : null,
      sourceBitrate: Number(format.bit_rate || 0),
    };
  }
}

module.exports = {
  analyzeSource,
};
