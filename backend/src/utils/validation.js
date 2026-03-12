const { z } = require("zod");
const { URL } = require("url");
const config = require("../config");

const analyzeSchema = z.object({
  url: z.string().min(1).max(config.limits.maxUrlLength),
  website: z.string().max(100).optional(),
  botToken: z.string().max(200).optional(),
});

const downloadSchema = z.object({
  url: z.string().min(1).max(config.limits.maxUrlLength),
  format: z.enum(["video", "audio"]),
  quality: z.string().min(2).max(20),
  website: z.string().max(100).optional(),
  botToken: z.string().max(200).optional(),
});

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, reason: "Only http/https URLs are allowed" };
    }
    if (!config.security.enableAllowlist) return { ok: true };

    const host = parsed.hostname.toLowerCase();
    const allowed = config.security.allowedDomains.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    if (!allowed) {
      return { ok: false, reason: "Domain is not allowed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }
}

module.exports = {
  analyzeSchema,
  downloadSchema,
  isAllowedUrl,
};
