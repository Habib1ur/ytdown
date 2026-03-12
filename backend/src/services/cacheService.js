const crypto = require("crypto");
const connection = require("../queue/redis");

function hashKey(url) {
  return crypto.createHash("sha1").update(url).digest("hex");
}

async function getAnalyzeCache(url) {
  const key = `analyze:${hashKey(url)}`;
  const raw = await connection.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setAnalyzeCache(url, data, ttlSeconds = 60 * 15) {
  const key = `analyze:${hashKey(url)}`;
  await connection.set(key, JSON.stringify(data), "EX", ttlSeconds);
}

module.exports = {
  getAnalyzeCache,
  setAnalyzeCache,
};
