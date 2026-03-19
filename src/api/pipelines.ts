import { Router } from "express";
import { pool } from "../db/db";

export const pipelinesRouter = Router();

pipelinesRouter.post("/", async (req, res) => {

  const { name, action_type, subscribers } = req.body;

  const result = await pool.query(
    "INSERT INTO pipelines (name, action_type) VALUES ($1,$2) RETURNING *",
    [name, action_type]
  );

  const pipeline = result.rows[0];

  for (const url of subscribers) {
    await pool.query(
      "INSERT INTO subscribers (pipeline_id,url) VALUES ($1,$2)",
      [pipeline.id, url]
    );
  }

  res.json(pipeline);
});

pipelinesRouter.get("/", async (req, res) => {

  const pipelines = await pool.query(
    "SELECT * FROM pipelines"
  );

  res.json(pipelines.rows);
});