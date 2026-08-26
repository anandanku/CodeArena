import express from "express";
import mongoose from "mongoose";
import redis from "./redisconnection.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

router.get("/deep", async (req, res) => {
  const checks = { server: "ok", mongo: "unknown", redis: "unknown" };
  let healthy = true;

  // ── MongoDB check ──────────────────────────────
  try {
    if (mongoose.connection.readyState === 1) {
      // readyState alone can lag behind reality — confirm with a real ping
      await mongoose.connection.db.admin().ping();
      checks.mongo = "ok";
    } else {
      checks.mongo = "down";
      healthy = false;
    }
  } catch (err) {
    checks.mongo = "down";
    healthy = false;
  }

  // ── Redis check ─────────────────────────────────
  try {
    if (redis.isReady) {
      const pong = await redis.ping();
      checks.redis = pong === "PONG" ? "ok" : "down";
      if (pong !== "PONG") healthy = false;
    } else {
      checks.redis = "down";
      healthy = false;
    }
  } catch (err) {
    checks.redis = "down";
    healthy = false;
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: Date.now(),
    checks,
  });
});

export default router;
