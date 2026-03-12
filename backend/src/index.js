const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const { setIo } = require("./socket");
const {
  ensureTempRoot,
  startCleanupScheduler,
} = require("./services/cleanupService");

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

  setIo(io); // expose io to transcodeService for real-time progress events

  io.on("connection", (socket) => {
    socket.on("subscribe-job", (jobId) => {
      if (typeof jobId === "string" && jobId.length <= 100) {
        socket.join(jobId);
      }
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
