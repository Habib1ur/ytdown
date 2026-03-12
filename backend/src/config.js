const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = process.cwd();
const tempDir = process.env.TEMP_DIR || "./tmp";

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  socketCorsOrigin:
    process.env.SOCKET_CORS_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:3000",
  queue: {
    name: process.env.QUEUE_NAME || "media-transcode",
    concurrency: Number(process.env.QUEUE_CONCURRENCY || 2),
    attempts: Number(process.env.QUEUE_ATTEMPTS || 3),
    backoffMs: Number(process.env.QUEUE_BACKOFF_MS || 2000),
  },
  limits: {
    maxUrlLength: Number(process.env.MAX_URL_LENGTH || 2048),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "32kb",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 60),
    rateLimitDownloadMax: Number(process.env.RATE_LIMIT_DOWNLOAD_MAX || 20),
  },
  storage: {
    tempRoot: path.resolve(rootDir, tempDir),
    fileTtlMinutes: Number(process.env.FILE_TTL_MINUTES || 20),
    cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS || 60000),
  },
  security: {
    enableAllowlist:
      String(process.env.ENABLE_DOMAIN_ALLOWLIST || "false").toLowerCase() ===
      "true",
    allowedDomains: (process.env.ALLOWED_SOURCE_DOMAINS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
    botSharedSecret: process.env.BOT_SHARED_SECRET || "",
  },
};
