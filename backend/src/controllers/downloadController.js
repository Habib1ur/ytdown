const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { downloadSchema, isAllowedUrl } = require("../utils/validation");
const jobState = require("../services/jobStateService");
const { scheduleTranscode } = require("../queue/mediaQueue");
const { runTranscode, killJob } = require("../services/transcodeService");

async function enqueueDownloadController(req, res, next) {
  try {
    const parsed = downloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { url, format, quality } = parsed.data;
    const allowed = isAllowedUrl(url);
    if (!allowed.ok) {
      return res.status(400).json({ error: allowed.reason });
    }

    const jobId = uuidv4();
    jobState.setQueued(jobId, { url, outputType: format, quality });

    // Fire-and-forget: schedule with in-process concurrency limiter
    scheduleTranscode(() =>
      runTranscode(jobId, { sourceUrl: url, outputType: format, quality }),
    );

    return res.status(202).json({ jobId, status: "queued" });
  } catch (error) {
    return next(error);
  }
}

async function getProgressController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = jobState.getState(jobId);
    if (!state) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      jobId,
      status: state.status,
      progress: Number(state.progress || 0),
      error: state.error || null,
    });
  } catch (error) {
    return next(error);
  }
}

async function getJobController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = jobState.getState(jobId);
    if (!state) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      jobId,
      ...state,
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelJobController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = jobState.getState(jobId);
    if (!state) {
      return res.status(404).json({ error: "Job not found" });
    }

    killJob(jobId); // kills FFmpeg process if still running
    jobState.setFailed(jobId, "Cancelled by user");

    return res.json({ jobId, status: "cancelled" });
  } catch (error) {
    return next(error);
  }
}

async function streamFileController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = jobState.getState(jobId);
    if (!state) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (state.status !== "completed" || !state.filePath) {
      return res.status(409).json({ error: "File not ready" });
    }

    const stat = await fs.promises.stat(state.filePath).catch(() => null);
    if (!stat) {
      return res.status(410).json({ error: "File expired or missing" });
    }

    res.setHeader("Content-Type", state.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${state.fileName || `${jobId}.bin`}\"`,
    );

    const readStream = fs.createReadStream(state.filePath);
    readStream.on("error", next);
    readStream.pipe(res);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  enqueueDownloadController,
  getProgressController,
  getJobController,
  cancelJobController,
  streamFileController,
};
