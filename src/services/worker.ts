import { pool } from "../db/db";
import { processPayload } from "../services/processor";
import { sendResult } from "../services/delivery";

async function startWorker() {

  while (true) {

    const jobs = await pool.query(
      "SELECT * FROM jobs WHERE status='pending' LIMIT 1"
    );

    if (jobs.rows.length === 0) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const job = jobs.rows[0];

    await pool.query(
      "UPDATE jobs SET status='processing' WHERE id=$1",
      [job.id]
    );

    const pipeline = await pool.query(
      "SELECT * FROM pipelines WHERE id=$1",
      [job.pipeline_id]
    );

    const action = pipeline.rows[0].action_type;

    const result = processPayload(action, job.payload);

    const subs = await pool.query(
      "SELECT * FROM subscribers WHERE pipeline_id=$1",
      [job.pipeline_id]
    );

    for (const sub of subs.rows) {
      await sendResult(sub.url, result);
    }

    await pool.query(
      "UPDATE jobs SET status='done', result=$1 WHERE id=$2",
      [result, job.id]
    );

  }

}

startWorker();