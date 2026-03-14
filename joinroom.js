import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

router.post("/joinroom", async (req, res) => {
  try {
    const { code, googleId } = req.body;

    // ── Validate inputs ──────────────────────────────────────
    if (!code || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Room code and googleId are required."
      });
    }

    const sanitizedCode = code.trim().toUpperCase();

    if (sanitizedCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: "Room code must be exactly 6 characters."
      });
    }

    // ── Fetch room ───────────────────────────────────────────
    const roomData = await redis.get(`room:${sanitizedCode}`);

    if (!roomData) {
      return res.status(404).json({
        success: false,
        error: "Room not found or has expired."
      });
    }

    const room = JSON.parse(roomData);

    // ── Enforce waiting time window ──────────────────────────
    // createdAt is in ms, waitingTime is in minutes
    const waitingWindowMs = room.waitingTime * 60 * 1000;
    const elapsedMs       = Date.now() - room.createdAt;

    if (elapsedMs > waitingWindowMs) {
      return res.status(403).json({
        success: false,
        error:   "The waiting window for this room has closed. No new players can join."
      });
    }

    // ── Add player if not already present ───────────────────
    if (!room.players.includes(googleId)) {
      room.players.push(googleId);

      // Preserve remaining TTL — do NOT wipe it
      const remainingTTL = await redis.ttl(`room:${sanitizedCode}`);

      if (remainingTTL > 0) {
        await redis.set(
          `room:${sanitizedCode}`,
          JSON.stringify(room),
          { EX: remainingTTL }
        );
      } else {
        // TTL already expired between get and set — treat as gone
        return res.status(404).json({
          success: false,
          error: "Room has just expired. Please try a different room."
        });
      }
    }

    // ── Return how much waiting time is left ─────────────────
    const waitingTimeLeftMs = Math.max(0, waitingWindowMs - elapsedMs);

    res.json({
      success:          true,
      roomCode:         sanitizedCode,
      players:          room.players.length,
      waitingTimeLeftMs,             // frontend can use this to show a countdown
    });

  } catch (err) {
    console.error("[joinroom]", err);
    res.status(500).json({
      success: false,
      error: "Failed to join room."
    });
  }
});

export default router;
