import express from "express";
import { pipelinesRouter } from "./api/pipelines";
import { webhookRouter } from "./api/webhooks";
import { jobsRouter } from "./api/jobs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/pipelines", pipelinesRouter);
app.use("/webhook", webhookRouter);
app.use("/jobs", jobsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});