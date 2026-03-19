import express from "express";
import { pipelinesRouter } from "./api/pipelines";
import { webhooksRouter } from "./api/webhooks";
import { jobsRouter } from "./api/jobs";

const app = express();

app.use(express.json());

app.use("/pipelines", pipelinesRouter);
app.use("/webhooks", webhooksRouter);
app.use("/jobs", jobsRouter);

app.listen(3000, () => {
  console.log("API running on port 3000");
});
