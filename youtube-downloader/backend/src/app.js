const express = require("express");
const compression = require("compression");
const pinoHttp = require("pino-http");
const config = require("./config");
const logger = require("./utils/logger");
const apiRoutes = require("./routes/apiRoutes");
const {
  globalRateLimit,
  corsMiddleware,
  helmetMiddleware,
} = require("./middlewares/security");

const app = express();

app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression());
app.use(express.json({ limit: config.limits.requestBodyLimit }));
app.use(globalRateLimit);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "media-api", timestamp: Date.now() });
});

app.use("/api", apiRoutes);

app.use((err, _req, res, _next) => {
  logger.error({ err }, "Unhandled server error");
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
