import { Router } from "express";
import { pool } from "../db/db";  

export const webhookRouter = Router();

webhookRouter.post('/:pipelineId', async (req, res) => { 
  try {
    const pipelineId = parseInt(req.params.pipelineId);  
    
    if (isNaN(pipelineId)) {
      return res.status(400).json({ error: "Invalid pipeline ID" });
    }

    const payload = req.body;

    const pipelineCheck = await pool.query(
      `SELECT * FROM pipelines WHERE id = $1`,
      [pipelineId]
    );

    if (pipelineCheck.rows.length === 0) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    const jobResult = await pool.query(
      `INSERT INTO jobs (pipeline_id, payload, status) 
       VALUES ($1, $2, 'pending') RETURNING *`,
      [pipelineId, JSON.stringify(payload)]
    );

    res.status(201).json({
      message: "Webhook received and job created",
      job: jobResult.rows[0]
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});