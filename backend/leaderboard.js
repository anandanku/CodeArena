import redis from "./redisconnection.js";

const POINTS = {
    easy: 20,
    medium: 40,
    hard: 60
};

export async function updateLeaderboard(req, roomCode) {
    try {
        const { googleId, name, problemId } = req.body;
        const compilerror = req.compilerror;

        // Get room
        const roomData = await redis.get(`room:${roomCode}`);

        if (!roomData) {
            console.log("Room not found");
            return;
        }

        const room = JSON.parse(roomData);

        // Find problem
        const problem = room.problems.find(
            p => String(p._id) === String(problemId)
        );

        if (!problem) {
            console.log("Problem not found");
            return;
        }

        const basePoints = POINTS[problem.difficulty];

        const leaderboardKey = `leaderboard:${roomCode}`;

        // Find existing member of this player
        const members = await redis.zRange(
            leaderboardKey,
            0,
            -1
        );

        let oldMember = null;
        let currentPoints = 0;

        for (const member of members) {
            const parts = member.split(":");
            const memberGoogleId = parts[parts.length - 1];

            if (memberGoogleId === googleId) {
                oldMember = member;

                const oldScore = await redis.zScore(
                    leaderboardKey,
                    member
                );

                currentPoints = -Number(oldScore);
                break;
            }
        }

        // Calculate new points
        if (compilerror === "") {
            // Accepted
            currentPoints += basePoints;
        } else {
            // Wrong submission
            currentPoints -= basePoints / 10;

            if (currentPoints < 0) {
                currentPoints = 0;
            }
        }

        // Time since room creation
        const completionTime = Date.now() - room.createdAt;

        const paddedTime = String(completionTime)
            .padStart(16, "0");

        const newMember =
            `${paddedTime}:${name}:${googleId}`;

        // Remove old entry
        if (oldMember) {
            await redis.zRem(
                leaderboardKey,
                oldMember
            );
        }

        // Add updated entry
        await redis.zAdd(
            leaderboardKey,
            {
                score: -currentPoints,
                value: newMember
            }
        );

    } catch (err) {
        console.error("[leaderboard]", err);
    }
}
