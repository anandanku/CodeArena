import express from "express";
import redis from "./redisconnection.js";
import Problem from "./problemschema.js";

const router = express.Router();

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getContestDuration(difficulty) {
  if (difficulty === "easy")   return 3600;
  if (difficulty === "medium") return 5400;
  if (difficulty === "hard")   return 7200;
  return 3600;
}

router.post("/createroom", async (req, res) => {
  try {
    const { difficulty, waitingTime, googleId } = req.body;

    // ── Validate inputs ──────────────────────────────────────
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: "Invalid difficulty. Must be easy, medium, or hard."
      });
    }

    const parsedWait = parseInt(waitingTime);
    if (isNaN(parsedWait) || parsedWait < 1 || parsedWait > 5) {
      return res.status(400).json({
        success: false,
        error: "Waiting time must be between 1 and 5 minutes."
      });
    }

    if (!googleId) {
      return res.status(400).json({
        success: false,
        error: "googleId is required to create a room."
      });
    }

    // ── Generate unique room code ────────────────────────────
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (await redis.exists(`room:${roomCode}`)) {
      roomCode = generateRoomCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({
          success: false,
          error: "Could not generate a unique room code. Try again."
        });
      }
    }

    // ── Fetch problems using $facet (single DB round-trip) ───
    let problems = [];

    if (difficulty === "easy") {
      const [result] = await Problem.aggregate([
        {
          $facet: {
            easy:   [{ $match: { difficulty: "easy" } },   { $sample: { size: 2 } }],
            medium: [{ $match: { difficulty: "medium" } }, { $sample: { size: 1 } }],
          }
        }
      ]);
      problems = [...result.easy, ...result.medium];
    }

    else if (difficulty === "medium") {
      const [result] = await Problem.aggregate([
        {
          $facet: {
            easy:   [{ $match: { difficulty: "easy" } },   { $sample: { size: 1 } }],
            medium: [{ $match: { difficulty: "medium" } }, { $sample: { size: 2 } }],
          }
        }
      ]);
      problems = [...result.easy, ...result.medium];
    }

    else if (difficulty === "hard") {
      const [result] = await Problem.aggregate([
        {
          $facet: {
            easy:   [{ $match: { difficulty: "easy" } },   { $sample: { size: 1 } }],
            medium: [{ $match: { difficulty: "medium" } }, { $sample: { size: 2 } }],
            hard:   [{ $match: { difficulty: "hard" } },   { $sample: { size: 1 } }],
          }
        }
      ]);
      problems = [...result.easy, ...result.medium, ...result.hard];
    }

    // ── Build and store room ─────────────────────────────────
    const contestDuration = getContestDuration(difficulty);
    const waitingSeconds  = parsedWait * 60;
    const totalTTL        = waitingSeconds + contestDuration;

    const roomData = {
      roomCode,
      difficulty,
      waitingTime:      parsedWait,
      contestDuration,
      players:          [googleId],
      problems,                                               // raw from MongoDB
      createdAt:        Date.now(),
      contestStartTime: Date.now() + (waitingSeconds * 1000), // ← contest starts after waiting window
    };

    await redis.set(
      `room:${roomCode}`,
      JSON.stringify(roomData),
      { EX: totalTTL }
    );

    // problems not included in response — frontend fetches via /problems
    res.status(201).json({
      success:         true,
      roomCode,
      difficulty,
      waitingTime:     parsedWait,
      contestDuration,
    });

  } catch (err) {
    console.error("[createroom]", err);
    res.status(500).json({
      success: false,
      error: "Room creation failed."
    });
  }
});

export default router;
