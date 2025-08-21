const Redis = require("ioredis");

const redisConfig = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
};

const redis = new Redis(redisConfig);

redis.on("connect", () => {
  console.log("Redis: Successfully connected to Redis server.");
});

redis.on("error", (err) => {
  console.error("Redis: Connection error:", err);
});

module.exports = redis;
