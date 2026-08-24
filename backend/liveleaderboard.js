import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { room } = req.query;

        if (!room) {
            return res.status(400).json({
                success: false,
                error: "Room code is required."
            });
        }

        const roomCode = room.trim().toUpperCase();

        // Check if room exists
        const roomData = await redis.get(`room:${roomCode}`);

        if (!roomData) {
            return res.status(404).json({
                success: false,
                error: "Room not found or has expired."
            });
        }

        const leaderboardKey = `leaderboard:${roomCode}`;

        // Fetch live leaderboard
        const rawLeaderboard = await redis.zRange(
            leaderboardKey,
            0,
            -1,
            {
                WITHSCORES: true
            }
        );

        const leaderboard = [];

        for (let i = 0; i < rawLeaderboard.length; i += 2) {

            const member = rawLeaderboard[i];
            const redisScore = rawLeaderboard[i + 1];

            // member = time:name:googleId
            const parts = member.split(":");

            const username = parts.slice(1, -1).join(":");

            const score = -Number(redisScore);

            leaderboard.push({
                username,
                score,
                solved: 0
            });
        }

        return res.status(200).json(leaderboard);

    } catch (err) {
        console.error("[leaderboard]", err);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch leaderboard."
        });
    }
});

export default router;
