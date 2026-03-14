import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

router.get("/problems", async (req, res) => {
  try {
    const { room } = req.query;

    // ── Validate query param ─────────────────────────────────
    if (!room) {
      return res.status(400).json({
        success: false,
        error: "Query param 'room' is required. e.g. /problems?room=ABC123"
      });
    }

    const sanitizedCode = room.trim().toUpperCase();

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

    const parsedRoom = JSON.parse(roomData);

    const problems = parsedRoom.problems.map((p, i) => ({
      number:      i + 1,
      title:       p.title,
      difficulty:  p.difficulty,
      description: p.description,

      // examples array (inputs) + exampleoutput array (outputs) are separate
      // in the schema — zip them together into { input, output } objects
      examples: (p.examples || []).map((input, idx) => ({
        input:  input,
        output: (p.exampleoutput || [])[idx] ?? 'N/A',
      })),

      constraints: p.constraints || [],
      snippets:    p.snippets    || {},
    }));

    res.json({
      success:         true,
      roomCode:        sanitizedCode,
      contestDuration: parsedRoom.contestDuration,
      problems,
    });

  } catch (err) {
    console.error("[problems]", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch problems."
    });
  }
});

export default router;
