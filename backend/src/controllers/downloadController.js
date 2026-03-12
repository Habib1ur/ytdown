const fs = require("fs");
const { mediaQueue } = require("../queue/mediaQueue");
const { downloadSchema, isAllowedUrl } = require("../utils/validation");
const jobState = require("../services/jobStateService");

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

    const job = await mediaQueue.add("transcode", {
      sourceUrl: url,
      outputType: format,
      quality,
    });

    await jobState.setQueued(job.id, {
      url,
      outputType: format,
      quality,
    });

    return res.status(202).json({ jobId: job.id, status: "queued" });
  } catch (error) {
    return next(error);
  }
}

async function getProgressController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = await jobState.getState(jobId);
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
    const state = await jobState.getState(jobId);
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
    const job = await mediaQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    await job.remove();
    await jobState.setFailed(jobId, "Cancelled by user");

    return res.json({ jobId, status: "cancelled" });
  } catch (error) {
    return next(error);
  }
}

async function streamFileController(req, res, next) {
  try {
    const { jobId } = req.params;
    const state = await jobState.getState(jobId);
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
