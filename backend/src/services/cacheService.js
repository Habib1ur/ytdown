const crypto = require("crypto");

// In-memory cache: url-hash -> { data, expiresAt }
const cache = new Map();

function hashKey(url) {
  return crypto.createHash("sha1").update(url).digest("hex");
}

function getAnalyzeCache(url) {
  const entry = cache.get(hashKey(url));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(hashKey(url));
    return null;
  }
  return entry.data;
}

function setAnalyzeCache(url, data, ttlSeconds = 60 * 15) {
  cache.set(hashKey(url), { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

module.exports = {
  getAnalyzeCache,
  setAnalyzeCache,
};
