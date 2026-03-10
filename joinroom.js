import express from "express";
import redis from "./redisconnection.js";

const router = express.Router();

router.post("/joinroom", async (req, res) => {

  try {

    const { code, googleId } = req.body;

    if (!code || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Room code or GoogleId missing"
      });
    }

    const roomData = await redis.get(`room:${code}`);

    if (!roomData) {
      return res.status(404).json({
        success: false,
        error: "Room not found"
      });
    }

    const room = JSON.parse(roomData);

    // If player not already in room → add them
    if (!room.players.includes(googleId)) {

      room.players.push(googleId);

      await redis.set(`room:${code}`, JSON.stringify(room));

    }

    res.json({
      success: true,
      roomCode: code
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: "Failed to join room"
    });

  }

});


export default router;


