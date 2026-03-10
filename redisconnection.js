const { createClient } = require("redis");
require("dotenv").config();

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();


export default redis;
