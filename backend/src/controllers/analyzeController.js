const { analyzeSchema, isAllowedUrl } = require("../utils/validation");
const { analyzeSource } = require("../services/mediaProbeService");
const { listFormats } = require("../services/transcodeProfiles");
const {
  getAnalyzeCache,
  setAnalyzeCache,
} = require("../services/cacheService");

async function analyzeController(req, res, next) {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { url } = parsed.data;
    const allowed = isAllowedUrl(url);
    if (!allowed.ok) {
      return res.status(400).json({ error: allowed.reason });
    }

    const cached = getAnalyzeCache(url);
    if (cached) {
      return res.json(cached);
    }

    const meta = await analyzeSource(url);
    const response = {
      title: meta.title,
      thumbnail: meta.thumbnail,
      duration: meta.duration,
      formats: listFormats(meta),
    };

    setAnalyzeCache(url, response);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeController,
};
