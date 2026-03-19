import { Router } from "express";
import { pool } from "../db/db";

export const pipelinesRouter = Router();

pipelinesRouter.post("/", async (req, res) => {
  try {
    const { name, action_type, subscribers } = req.body;

    if (!name || !action_type) {
      return res.status(400).json({ error: "name and action_type are required" });
    }

    const result = await pool.query(
      "INSERT INTO pipelines (name, action_type) VALUES ($1,$2) RETURNING *",
      [name, action_type]
    );

    const pipeline = result.rows[0];

    if (subscribers && Array.isArray(subscribers) && subscribers.length > 0) {
      for (const url of subscribers) {
        if (typeof url === 'string' && url.trim() !== '') {
          await pool.query(
            "INSERT INTO subscribers (pipeline_id,url) VALUES ($1,$2)",
            [pipeline.id, url.trim()]
          );
        }
      }
    } else {
      console.log("No subscribers provided for pipeline:", pipeline.id);
    }

    res.status(201).json(pipeline);
  } catch (error) {
    console.error("Error creating pipeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

pipelinesRouter.get("/", async (req, res) => {
  try {
    const pipelines = await pool.query(
      "SELECT * FROM pipelines ORDER BY id DESC"
    );
    res.json(pipelines.rows);
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});