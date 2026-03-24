import axios from "axios";
import { pool } from "../db/db";

export interface DeliveryResult {
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
}

export async function sendResult(
  url: string, 
  data: any, 
  jobId?: number,
  maxRetries: number = 3
): Promise<DeliveryResult> {
  
  const result: DeliveryResult = {
    url,
    success: false,
    attempts: 0
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    result.attempts = attempt;
    
    try {
      const response = await axios.post(url, data, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhook-Pipeline/1.0'
        }
      });

      result.success = true;
      result.statusCode = response.status;

      if (jobId) {
        await pool.query(
          `INSERT INTO delivery_attempts (job_id, subscriber_url, attempt_number, status, response_code) 
           VALUES ($1, $2, $3, $4, $5)`,
          [jobId, url, attempt, 'success', response.status]
        );
      }

      console.log(`  [SUCCESS] Delivered to ${url} (attempt ${attempt})`);
      break;

    } catch (error: any) {
      const errorMessage = error.code === 'ECONNREFUSED' ? 'Connection refused' :
                          error.code === 'ETIMEDOUT' ? 'Timeout' :
                          error.response?.status ? `HTTP ${error.response.status}` :
                          error.message || 'Unknown error';

      result.error = errorMessage;

      if (jobId) {
        await pool.query(
          `INSERT INTO delivery_attempts (job_id, subscriber_url, attempt_number, status, error) 
           VALUES ($1, $2, $3, $4, $5)`,
          [jobId, url, attempt, 'failed', errorMessage]
        );
      }

      console.log(`  [FAILED] Failed to deliver to ${url} (attempt ${attempt}): ${errorMessage}`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`    Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return result;
}

export async function sendResultToAllSubscribers(
  pipelineId: number,
  jobId: number,
  data: any
): Promise<DeliveryResult[]> {
  
  const subscribers = await pool.query(
    "SELECT * FROM subscribers WHERE pipeline_id = $1",
    [pipelineId]
  );

  console.log(`Found ${subscribers.rows.length} subscribers for pipeline ${pipelineId}`);

  if (subscribers.rows.length === 0) {
    return [];
  }

  const results: DeliveryResult[] = [];

  for (const sub of subscribers.rows) {
    console.log(`Delivering to subscriber: ${sub.url}`);
    const result = await sendResult(sub.url, data, jobId);
    results.push(result);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Delivered to ${successCount}/${results.length} subscribers for job ${jobId}`);

  return results;
}