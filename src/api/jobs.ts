import { Router } from "express";
import { pool } from "../db/db";

export const jobsRouter = Router();

jobsRouter.get("/:id", async (req, res) => {

  const { id } = req.params;

  const job = await pool.query(
    "SELECT * FROM jobs WHERE id=$1",
    [id]
  );

  res.json(job.rows[0]);

});