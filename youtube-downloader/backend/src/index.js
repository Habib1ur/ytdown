const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const { mediaQueueEvents } = require("./queue/mediaQueue");
const {
  ensureTempRoot,
  startCleanupScheduler,
} = require("./services/cleanupService");
const jobState = require("./services/jobStateService");

async function bootstrap() {
  await ensureTempRoot(config.storage.tempRoot);
  startCleanupScheduler(config);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.socketCorsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe-job", (jobId) => {
      if (typeof jobId === "string" && jobId.length <= 100) {
        socket.join(jobId);
      }
    });
  });

  mediaQueueEvents.on("progress", async ({ jobId, data }) => {
    await jobState.setProgress(jobId, Number(data || 0));
    io.to(jobId).emit("job-progress", {
      jobId,
      progress: Number(data || 0),
      status: "processing",
    });
  });

  mediaQueueEvents.on("completed", ({ jobId }) => {
    io.to(jobId).emit("job-completed", {
      jobId,
      status: "completed",
      progress: 100,
    });
  });

  mediaQueueEvents.on("failed", async ({ jobId, failedReason }) => {
    await jobState.setFailed(jobId, failedReason || "Job failed");
    io.to(jobId).emit("job-failed", {
      jobId,
      status: "failed",
      error: failedReason || "Job failed",
    });
  });

  server.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "Failed to bootstrap API");
  process.exit(1);
});
