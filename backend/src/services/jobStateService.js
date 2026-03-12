const path = require("path");
const fs = require("fs");

// In-memory job state store: jobId -> state object
const store = new Map();

function writeState(jobId, partialState) {
  const existing = store.get(jobId) || {};
  store.set(jobId, { ...existing, ...partialState, updatedAt: Date.now() });
}

function setQueued(jobId, payload) {
  writeState(jobId, {
    status: "queued",
    progress: 0,
    url: payload.url,
    outputType: payload.outputType,
    quality: payload.quality,
  });
}

function setProgress(jobId, progress) {
  writeState(jobId, {
    status: "processing",
    progress: Math.max(0, Math.min(100, Math.round(progress))),
  });
}

function setCompleted(jobId, data) {
  writeState(jobId, {
    status: "completed",
    progress: 100,
    filePath: data.filePath,
    fileName: data.fileName,
    mimeType: data.mimeType,
    size: data.size || 0,
    expiresAt: data.expiresAt,
  });
}

function setFailed(jobId, error) {
  writeState(jobId, {
    status: "failed",
    error: error || "Unknown error",
  });
}

function getState(jobId) {
  return store.get(jobId) || null;
}

async function deleteJobFile(jobId) {
  const state = getState(jobId);
  if (!state || !state.filePath) return false;

  const safeRoot = path.resolve(process.cwd(), "tmp");
  const target = path.resolve(state.filePath);
  if (!target.startsWith(safeRoot)) return false;

  try {
    await fs.promises.rm(path.dirname(target), {
      recursive: true,
      force: true,
    });
    writeState(jobId, { status: "expired" });
    return true;
  } catch {
    return false;
  }
}

function listTrackedFileJobIds() {
  const ids = [];
  for (const [id, state] of store) {
    if (state.filePath) ids.push(id);
  }
  return ids;
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
