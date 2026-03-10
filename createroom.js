const express = require("express");
const router = express.Router();

const redis = require("../redis/redisClient");
const Problem = require("../models/Problem");

function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

function getContestDuration(difficulty) {

    if (difficulty === "easy") return 3600;
    if (difficulty === "medium") return 5400;
    if (difficulty === "hard") return 7200;

    return 3600;
}

router.post("/createroom", async (req, res) => {
    try {

        const { difficulty, waitingTime } = req.body;

        let roomCode = generateRoomCode();

        // Prevent room code collision
        while (await redis.exists(`room:${roomCode}`)) {
            roomCode = generateRoomCode();
        }

        let problems = [];

        // EASY ROOM
        if (difficulty === "easy") {

            const easy = await Problem.aggregate([
                { $match: { difficulty: "easy" } },
                { $sample: { size: 2 } }
            ]);

            const medium = await Problem.aggregate([
                { $match: { difficulty: "medium" } },
                { $sample: { size: 1 } }
            ]);

            problems = [...easy, ...medium];
        }

        // MEDIUM ROOM
        else if (difficulty === "medium") {

            const easy = await Problem.aggregate([
                { $match: { difficulty: "easy" } },
                { $sample: { size: 1 } }
            ]);

            const medium = await Problem.aggregate([
                { $match: { difficulty: "medium" } },
                { $sample: { size: 2 } }
            ]);

            problems = [...easy, ...medium];
        }

        // HARD ROOM
        else if (difficulty === "hard") {

            const easy = await Problem.aggregate([
                { $match: { difficulty: "easy" } },
                { $sample: { size: 1 } }
            ]);

            const medium = await Problem.aggregate([
                { $match: { difficulty: "medium" } },
                { $sample: { size: 2 } }
            ]);

            const hard = await Problem.aggregate([
                { $match: { difficulty: "hard" } },
                { $sample: { size: 1 } }
            ]);

            problems = [...easy, ...medium, ...hard];
        }

        const contestDuration = getContestDuration(difficulty);

        const roomData = {
            roomCode: roomCode,
            difficulty: difficulty,
            waitingTime: waitingTime,
            contestDuration: contestDuration,
            players: [],
            problems: problems,
            createdAt: Date.now()
        };

        await redis.set(
            `room:${roomCode}`,
            JSON.stringify(roomData),
            {
                EX: waitingTime + contestDuration
            }
        );

        res.json({
            success: true,
            roomCode: roomCode,
            problems: problems,
            waitingTime: waitingTime,
            contestDuration: contestDuration
        });

    } catch (err) {

        console.log(err);
        res.status(500).json({
            success: false,
            error: "Room creation failed"
        });

    }
});


module.exports = router;
