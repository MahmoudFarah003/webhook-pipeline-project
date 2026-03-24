import { pool } from "../db/db";
import { processPayload } from "../services/processor";
import { sendResultToAllSubscribers } from "../services/delivery";

async function processJobs() {
  console.log(" Worker started...");

  while (true) {
    try {
      const res = await pool.query(
        "SELECT * FROM jobs WHERE status='pending' LIMIT 1"
      );

      const job = res.rows[0];

      if (!job) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      console.log(" Processing job:", job.id);

      const pipelineRes = await pool.query(
        "SELECT * FROM pipelines WHERE id=$1",
        [job.pipeline_id]
      );

      const pipeline = pipelineRes.rows[0];

      if (!pipeline) {
        throw new Error("Pipeline not found");
      }

      const action = pipeline.action_type;
      console.log(" Action:", action);

      const result = processPayload(action, job.payload);
      console.log(" Result:", result);

      const subscribersRes = await pool.query(
        "SELECT * FROM subscribers WHERE pipeline_id = $1",
        [job.pipeline_id]
      );
      
      console.log(` Subscribers found: ${subscribersRes.rows.length}`);

      await pool.query(
        "UPDATE jobs SET status='processing', processed_at=NOW() WHERE id=$1",
        [job.id]
      );

      let deliveryResults = [];
      
      if (subscribersRes.rows.length > 0) {
        console.log(` Sending to ${subscribersRes.rows.length} subscribers...`);
        deliveryResults = await sendResultToAllSubscribers(
          job.pipeline_id,
          job.id,
          result
        );
      } else {
        console.log(" No subscribers, skipping delivery");
      }

      await pool.query(
        "UPDATE jobs SET status='done', result=$1, processed_at=NOW() WHERE id=$2",
        [JSON.stringify({ output: result, deliveries: deliveryResults }), job.id]
      );

      console.log(` Job ${job.id} completed`);

    } catch (err: any) {
      console.error("Worker error:", err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

processJobs();