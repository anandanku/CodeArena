import express from "express"; 
import redis from "./redisconnection.js"; 
 
const router = express.Router(); 


router.get("/", async (req, res) => { 
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
      return { 
        number:      i + 1, 
        title:       p.title, 
        difficulty:  p.difficulty, 
        description: p.description, 
        constraints: p.constraints || [], 
        snippets:    p.snippets    || {}, 
        examples:    p.examples,
        testcases:  p.testcases
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
