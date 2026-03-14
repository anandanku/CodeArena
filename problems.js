import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

// ── Normalize a single testcase value ───────────────────────────
// Handles both flat strings and nested arrays
// e.g. "input1"             → "input1"
// e.g. ["input1", "input2"] → "input1, input2"
function normalizeCase(val) {
  if (Array.isArray(val)) {
    return val.join(", ");
  }
  return val ?? 'N/A';
}

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

      // ── Examples: zip examples (inputs) + exampleoutput (outputs) ──
      // Each entry can itself be a string or an array
      examples: (p.examples || []).map((input, idx) => ({
        input:  normalizeCase(input),
        output: normalizeCase((p.exampleoutput || [])[idx]),
      })),

      constraints: p.constraints || [],

      snippets: p.snippets || {},

      // ── Testcases: zip testcases (inputs) + output (outputs) ────────
      // Supports flat array:       ["input1", "input2"]
      // Supports array of arrays:  [["a", "b"], ["c", "d"]]
      testcases: (p.testcases || []).map((input, idx) => ({
        input:    normalizeCase(input),
        expected: normalizeCase((p.output || [])[idx]),
      })),
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
