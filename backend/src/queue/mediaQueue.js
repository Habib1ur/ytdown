// In-process concurrency scheduler — no external queue required.
const config = require("../config");

let active = 0;
const pending = [];

/**
 * Schedule a transcode function with concurrency limiting.
 * fn must return a Promise. Does not block the caller (fire-and-forget).
 */
function scheduleTranscode(fn) {
  const run = () => {
    active++;
    Promise.resolve(fn()).finally(() => {
      active--;
      if (pending.length > 0) pending.shift()();
    });
  };

  if (active < config.queue.concurrency) {
    run();
  } else {
    pending.push(run);
  }
}

module.exports = { scheduleTranscode };
