const IORedis = require("ioredis");
const config = require("../config");

const connection = new IORedis(config.redis);

module.exports = connection;
