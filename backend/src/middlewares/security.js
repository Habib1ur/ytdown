const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const config = require("../config");

const globalRateLimit = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: config.limits.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later." },
});

const downloadRateLimit = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: config.limits.rateLimitDownloadMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many download requests, try again later." },
});

const corsMiddleware = cors({
  origin: config.frontendOrigin,
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
});

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

function botProtection(req, res, next) {
  const website = (req.body && req.body.website) || "";
  if (website) {
    return res.status(400).json({ error: "Bot validation failed" });
  }

  if (!req.headers["user-agent"]) {
    return res.status(400).json({ error: "Missing user agent" });
  }

  if (config.security.botSharedSecret) {
    const supplied =
      (req.body && req.body.botToken) || req.headers["x-bot-token"];
    if (supplied !== config.security.botSharedSecret) {
      return res.status(403).json({ error: "Bot token invalid" });
    }
  }

  return next();
}

module.exports = {
  globalRateLimit,
  downloadRateLimit,
  corsMiddleware,
  helmetMiddleware,
  botProtection,
};
