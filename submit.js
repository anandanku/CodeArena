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

        const response = await axios.post(
            "https://api.onlinecompiler.io/api/run-code-sync/",
            {
                compiler: "g++-15",
                code: snippets,
                input: ""
            },
            {
                headers: {
                    Authorization: process.env.ONLINECOMPILER_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.status(200).json({
            success: true,
            output: response.data.output,
            error: response.data.error,
            status: response.data.status,
            exitCode: response.data.exit_code,
            executionTime: response.data.time,
            totalTime: response.data.total,
            memory: response.data.memory
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
