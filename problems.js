import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

// ── Safely stringify any value from MongoDB ──────────────────────
// string/number  → returned as string
// array          → elements joined by newline (nulls filtered out)
// null/undefined/empty → returns null (signals "skip this entry")
function normalize(val) {
  if (val === null || val === undefined || val === '') return null;
  if (Array.isArray(val)) {
    const cleaned = val
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(String);
    return cleaned.length > 0 ? cleaned.join('\n') : null;
  }
  return String(val);
}

// ── Zip two parallel arrays into { input, output } pairs ─────────
// Skips any pair where either side is missing/empty so no "N/A"
// or "undefined" ever reaches the frontend
function zipCases(inputs, outputs, inputKey, outputKey) {
  const ins  = inputs  || [];
  const outs = outputs || [];
  const len  = Math.max(ins.length, outs.length);
  const result = [];
  for (let i = 0; i < len; i++) {
    const inp = normalize(ins[i]);
    const out = normalize(outs[i]);
    if (inp !== null && out !== null) {
      result.push({ [inputKey]: inp, [outputKey]: out });
    }
  }
  return result;
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
      constraints: p.constraints || [],
      snippets:    p.snippets    || {},

      // examples[]      = inputs,  exampleoutput[] = outputs
      // Only pairs where BOTH input and output exist are included
      examples: zipCases(p.examples, p.exampleoutput, 'input', 'output'),

      // testcases[]     = inputs,  output[] = expected outputs
      // Only pairs where BOTH exist are included — nulls skipped automatically
      testcases: zipCases(p.testcases, p.output, 'input', 'expected'),
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
