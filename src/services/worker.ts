import { pool } from "../db/db";
import { processPayload } from "../services/processor";
import { sendResult } from "../services/delivery";

async function startWorker() {
  while (true) {
    let job: any = null; // 
  
    try {
      const jobs = await pool.query(
        "SELECT * FROM jobs WHERE status='pending' LIMIT 1"
      );

      if (jobs.rows.length === 0) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      job = jobs.rows[0];
      console.log(`Worker picked up job ${job.id}`);

      await pool.query(
        "UPDATE jobs SET status='processing', processed_at=NOW() WHERE id=$1",
        [job.id]
      );

      const pipeline = await pool.query(
        "SELECT * FROM pipelines WHERE id=$1",
        [job.pipeline_id]
      );

      if (pipeline.rows.length === 0) {
        throw new Error(`Pipeline ${job.pipeline_id} not found`);
      }

      const action = pipeline.rows[0].action_type;
      const result = processPayload(action, job.payload);

      const subs = await pool.query(
        "SELECT * FROM subscribers WHERE pipeline_id=$1",
        [job.pipeline_id]
      );

      const deliveryResults = [];
      for (const sub of subs.rows) {
        try {
          const success = await sendResult(sub.url, result);
          deliveryResults.push({ url: sub.url, success });
        } catch (error) {
          console.error(`Failed to send to ${sub.url}:`, error);
          deliveryResults.push({ url: sub.url, success: false, error: error.message });
        }
      }

      await pool.query(
        "UPDATE jobs SET status='done', result=$1, processed_at=NOW() WHERE id=$2",
        [JSON.stringify({ 
          output: result, 
          deliveries: deliveryResults 
        }), job.id]
      );

      console.log(`Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`Worker error:`, error);
      
      if (job) {
        await pool.query(
          "UPDATE jobs SET status='failed', result=$1 WHERE id=$2",
          [JSON.stringify({ error: error.message }), job.id]
        );
      }
      
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

startWorker();