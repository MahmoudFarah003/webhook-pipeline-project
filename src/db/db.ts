import { Pool } from "pg";

export const pool = new Pool({
  host: "db",
  user: "postgres",
  password: "postgres",
  database: "pipeline",
  port: 5432,
});