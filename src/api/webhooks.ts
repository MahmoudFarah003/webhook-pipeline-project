 import { Router } from "express";
import { pool } from "../db/db";

export const webhooksRouter = Router();

webhooksRouter.post("/:pipelineId", async (req, res) => {

  const payload = req.body;
  const { pipelineId } = req.params;

  const job = await pool.query(
    "INSERT INTO jobs (pipeline_id,payload) VALUES ($1,$2) RETURNING *",
    [pipelineId, payload]
  );

  res.json({
    message: "job queued",
    job: job.rows[0],
  });

});