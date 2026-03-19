import { Router } from "express";
import { pool } from "../db/db";

export const jobsRouter = Router();

jobsRouter.get("/", async (req, res) => {
  try {
    const jobs = await pool.query(
      `SELECT j.*, p.name as pipeline_name 
       FROM jobs j 
       LEFT JOIN pipelines p ON j.pipeline_id = p.id 
       ORDER BY j.created_at DESC`
    );
    res.json(jobs.rows);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

jobsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const job = await pool.query(
      `SELECT j.*, p.name as pipeline_name 
       FROM jobs j 
       LEFT JOIN pipelines p ON j.pipeline_id = p.id 
       WHERE j.id = $1`,
      [id]
    );

    if (job.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const attempts = await pool.query(
      `SELECT * FROM delivery_attempts WHERE job_id = $1 ORDER BY attempt_number`,
      [id]
    );

    res.json({
      ...job.rows[0],
      delivery_attempts: attempts.rows
    });

  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});