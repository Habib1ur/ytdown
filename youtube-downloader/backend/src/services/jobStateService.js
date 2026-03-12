const path = require("path");
const fs = require("fs");
const connection = require("../queue/redis");

const PREFIX = "job:";
const FILE_INDEX_SET = "jobs:file-index";

function key(jobId) {
  return `${PREFIX}${jobId}`;
}

async function writeState(jobId, partialState) {
  const now = Date.now().toString();
  const payload = { ...partialState, updatedAt: now };
  await connection.hset(key(jobId), payload);
  await connection.expire(key(jobId), 24 * 60 * 60);
}

async function setQueued(jobId, payload) {
  await writeState(jobId, {
    status: "queued",
    progress: "0",
    url: payload.url,
    outputType: payload.outputType,
    quality: payload.quality,
  });
}

async function setProgress(jobId, progress) {
  await writeState(jobId, {
    status: "processing",
    progress: String(Math.max(0, Math.min(100, Math.round(progress)))),
  });
}

async function setCompleted(jobId, data) {
  await writeState(jobId, {
    status: "completed",
    progress: "100",
    filePath: data.filePath,
    fileName: data.fileName,
    mimeType: data.mimeType,
    size: String(data.size || 0),
    expiresAt: String(data.expiresAt),
  });
  await connection.sadd(FILE_INDEX_SET, jobId);
}

async function setFailed(jobId, error) {
  await writeState(jobId, {
    status: "failed",
    error: error || "Unknown error",
  });
}

async function getState(jobId) {
  const state = await connection.hgetall(key(jobId));
  return Object.keys(state).length ? state : null;
}

async function deleteJobFile(jobId) {
  const state = await getState(jobId);
  if (!state || !state.filePath) return false;

  const safeRoot = path.resolve(process.cwd(), "tmp");
  const target = path.resolve(state.filePath);
  if (!target.startsWith(safeRoot)) return false;

  try {
    await fs.promises.rm(path.dirname(target), {
      recursive: true,
      force: true,
    });
    await connection.srem(FILE_INDEX_SET, jobId);
    await writeState(jobId, { status: "expired" });
    return true;
  } catch {
    return false;
  }
}

async function listTrackedFileJobIds() {
  return connection.smembers(FILE_INDEX_SET);
}

module.exports = {
  setQueued,
  setProgress,
  setCompleted,
  setFailed,
  getState,
  deleteJobFile,
  listTrackedFileJobIds,
};
