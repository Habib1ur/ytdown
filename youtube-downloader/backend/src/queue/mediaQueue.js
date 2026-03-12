const { Queue, QueueEvents } = require("bullmq");
const config = require("../config");
const connection = require("./redis");

const mediaQueue = new Queue(config.queue.name, {
  connection,
  defaultJobOptions: {
    attempts: config.queue.attempts,
    removeOnComplete: 200,
    removeOnFail: 200,
    backoff: {
      type: "exponential",
      delay: config.queue.backoffMs,
    },
  },
});

const mediaQueueEvents = new QueueEvents(config.queue.name, {
  connection,
});

module.exports = { mediaQueue, mediaQueueEvents };
