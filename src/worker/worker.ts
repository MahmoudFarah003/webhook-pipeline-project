import { pool } from "../db/db";

async function processJobs() {

  while (true) {

    const res = await pool.query(
      "SELECT * FROM jobs WHERE status='pending' LIMIT 1"
    );

    const job = res.rows[0];

    if (!job) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    console.log("Processing job:", job.id);

    let result = job.payload;

    if (job.payload.text) {
      result = {
        text: job.payload.text.toUpperCase()
      };
    }

    await pool.query(
      "UPDATE jobs SET status='done', result=$1, processed_at=NOW() WHERE id=$2",
      [result, job.id]
    );

  }

}

processJobs();