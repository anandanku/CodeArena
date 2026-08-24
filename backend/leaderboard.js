import redis from "./redisconnection.js";

const POINTS = {
    Easy: 20,
    Medium: 40,
    Hard: 60
};

export async function updateLeaderboard(req, roomCode) {
    try {
        const googleId=req.user.GoogleId
        const compilerror = req.compilerror;
        const name=req.user.displayname;
        const leaderboardKey = `leaderboard:${roomCode}`;
        const leaderboardDataKey = `leaderboard:Data:${roomCode}`;

        // Get room
        const roomData = await redis.get(`room:${roomCode}`);

        if (!roomData) {
            console.log("Room not found");
            return;
        }

        const room = JSON.parse(roomData);        

        const basePoints = POINTS[req.body.difficulty];

        // Check whether player already exists in leaderboard
        const currentMember = await redis.hGet(
            leaderboardDataKey,
            googleId
        );

        let currentPoints = 0;

        // --------------------------------------------------
        // PLAYER ALREADY EXISTS
        // --------------------------------------------------

        if (currentMember) {

            // Get current score from ZSET
            const oldScore = await redis.zScore(
                leaderboardKey,
                currentMember
            );

            if (oldScore !== null) {
                currentPoints = -Number(oldScore);
            }

            // Remove old member because time/member may change
            await redis.zRem(
                leaderboardKey,
                currentMember
            );
        }

        // --------------------------------------------------
        // UPDATE POINTS
        // --------------------------------------------------

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

        // --------------------------------------------------
        // CREATE NEW MEMBER
        // --------------------------------------------------

        const completionTime =Date.now() - room.createdAt;

        const paddedTime = String(completionTime).padStart(16, "0");

        const newMember =`${paddedTime}:${name}:${googleId}`;

        // --------------------------------------------------
        // UPDATE HASH
        // --------------------------------------------------

        await redis.hSet(
            leaderboardDataKey,
            googleId,
            newMember
        );

        // --------------------------------------------------
        // UPDATE / CREATE ZSET
        // --------------------------------------------------

        await redis.zAdd(
            leaderboardKey,
            {
                score: -currentPoints,
                value: newMember
            }
        );

        // --------------------------------------------------
        // SET TTL
        // --------------------------------------------------

        const remainingTTL = await redis.ttl(
            `room:${roomCode}`
        );

        if (remainingTTL > 0) {
            await redis.expire(
                leaderboardKey,
                remainingTTL
            );

            await redis.expire(
                leaderboardDataKey,
                remainingTTL
            );
        }

        console.log(
            `Leaderboard updated for ${googleId}: ${currentPoints} points`
        );

    } catch (err) {
        console.error(
            "[leaderboard]",
            err
        );
    }
}
