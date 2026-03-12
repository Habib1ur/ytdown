const fs = require("fs");
const jobState = require("./jobStateService");
const logger = require("../utils/logger");

function startCleanupScheduler(config) {
  const timer = setInterval(async () => {
    try {
      const jobIds = await jobState.listTrackedFileJobIds();
      const now = Date.now();

      for (const jobId of jobIds) {
        const state = await jobState.getState(jobId);
        if (!state || !state.expiresAt) continue;

        if (Number(state.expiresAt) <= now) {
          await jobState.deleteJobFile(jobId);
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Cleanup scheduler failed");
    }
  }, config.storage.cleanupIntervalMs);

  timer.unref();
}

async function ensureTempRoot(tempRoot) {
  await fs.promises.mkdir(tempRoot, { recursive: true });
}

module.exports = {
  startCleanupScheduler,
  ensureTempRoot,
};
