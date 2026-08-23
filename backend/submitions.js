import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { snippets } = req.body;

        if (!snippets) {
            return res.status(400).json({
                success: false,
                message: "snippets field is required"
            });
        }

        const response = await fetch(
          "https://api.onlinecompiler.io/api/run-code-sync/",
          {
            method: "POST",
            headers: {
            "Authorization": process.env.ONLINECOMPILER_API_KEY,
            "Content-Type": "application/json"
            },
            body: JSON.stringify({
            compiler: "g++-15",
            code: snippets,
            input: ""
            })
          }
    );
    const data=await response.json();
        return res.status(200).json({
            success: true,
            output: data.output,
            error: data.error,
            status: data.status,
            exitCode: data.exit_code,
            executionTime: data.time,
            totalTime: data.total,
            memory: data.memory
        });

    } catch (err) {
        console.error(err.response?.data || err.message);

        return res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
});

export default router;
