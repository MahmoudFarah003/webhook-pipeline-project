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

pipelinesRouter.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, action_type } = req.body;

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid pipeline ID" });
    }

    const validActions = ['uppercase', 'wordcount', 'timestamp', 'reverse', 'echo'];
    if (action_type && !validActions.includes(action_type)) {
      return res.status(400).json({ 
        error: `action_type must be one of: ${validActions.join(', ')}` 
      });
    }

    const result = await pool.query(
      `UPDATE pipelines 
       SET name = COALESCE($1, name), 
           action_type = COALESCE($2, action_type)
       WHERE id = $3 
       RETURNING *`,
      [name || null, action_type || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Pipeline with ID ${id} not found` });
    }

    res.json({
      message: "Pipeline updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating pipeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

pipelinesRouter.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid pipeline ID" });
    }

    await pool.query("DELETE FROM subscribers WHERE pipeline_id = $1", [id]);
    
    await pool.query("DELETE FROM jobs WHERE pipeline_id = $1", [id]);
    
    const result = await pool.query(
      "DELETE FROM pipelines WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Pipeline with ID ${id} not found` });
    }

    res.json({
      message: "Pipeline deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting pipeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET single pipeline by ID
pipelinesRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid pipeline ID" });
    }

    const pipeline = await pool.query(
      `SELECT p.*, 
        COALESCE(
          (SELECT json_agg(s.*) FROM subscribers s WHERE s.pipeline_id = p.id),
          '[]'::json
        ) as subscribers
       FROM pipelines p 
       WHERE p.id = $1`,
      [id]
    );

    if (pipeline.rows.length === 0) {
      return res.status(404).json({ error: `Pipeline with ID ${id} not found` });
    }

    res.json(pipeline.rows[0]);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});