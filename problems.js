import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

// ── Convert ANY value into a clean readable string ────────────────
// Handles:
//   "hello"              → "hello"
//   42                   → "42"
//   ["a", "b"]           → "a\nb"           (1D array)
//   [["a","b"],["c","d"]]→ "a b\nc d"       (2D array)
//   [["1",2], "three"]   → "1 2\nthree"     (mixed)
//   null / undefined     → ""
function toString(val) {
  if (val === null || val === undefined) return "";

  // plain string or number
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);

  // 1D array
  if (Array.isArray(val)) {
    return val.map(item => {
      // each item in the array could itself be an array (2D)
      if (Array.isArray(item)) {
        return item.map(v => (v === null || v === undefined ? "" : String(v))).join(" ");
      }
      return (item === null || item === undefined) ? "" : String(item);
    }).join("\n");
  }

  // fallback for objects etc.
  return JSON.stringify(val);
}

router.get("/problems", async (req, res) => {
  try {
    const { room } = req.query;

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

    const roomData = await redis.get(`room:${sanitizedCode}`);

    if (!roomData) {
      return res.status(404).json({
        success: false,
        error: "Room not found or has expired."
      });
    }

    const parsedRoom = JSON.parse(roomData);

    const problems = parsedRoom.problems.map((p, i) => {

      // ── Iterate examples[] and exampleoutput[] ────────────────
      const examples = [];
      for (let j = 0; j < (p.examples || []).length; j++) {
        examples.push({
          input:  toString(p.examples[j]),
          output: toString((p.exampleoutput || [])[j]),
        });
      }

      // ── Iterate testcases[] and output[] ─────────────────────
      const testcases = [];
      for (let j = 0; j < (p.testcases || []).length; j++) {
        testcases.push({
          input:    toString(p.testcases[j]),
          expected: toString((p.output || [])[j]),
        });
      }

      return {
        number:      i + 1,
        title:       p.title,
        difficulty:  p.difficulty,
        description: p.description,
        constraints: p.constraints || [],
        snippets:    p.snippets    || {},
        examples,
        testcases,
      };
    });

    res.json({
      success:          true,
      roomCode:         sanitizedCode,
      contestDuration:  parsedRoom.contestDuration,
      contestStartTime: parsedRoom.contestStartTime || null,   // set by new createroom.js
      createdAt:        parsedRoom.createdAt        || null,   // fallback for old rooms
      waitingTime:      parsedRoom.waitingTime      || null,   // fallback for old rooms
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
