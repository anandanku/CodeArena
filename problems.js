router.get("/problems", async (req, res) => {

  try {

    const { room } = req.query;

    const roomData = await redis.get(`room:${room}`);

    if (!roomData) {
      return res.status(404).json({ error: "Room not found" });
    }

    const parsedRoom = JSON.parse(roomData);

    const problems = parsedRoom.problems.map((p, i) => ({
      number: i + 1,
      difficulty: p.difficulty,
      title: p.title,
      description: p.description,
      examples: p.examples,
      constraints: p.constraints,
      snippets: p.snippets
    }));

    res.json({
      problems
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to fetch problems"
    });

  }

});