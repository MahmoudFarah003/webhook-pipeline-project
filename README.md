# Webhook Pipeline System

service that receives webhooks, processes them through a job queue, and delivers results to registered subscribers. Built with TypeScript, PostgreSQL, and Docker.

[![CI/CD](https://github.com/MahmoudFarah003/webhook-pipeline-project/actions/workflows/ci.yml/badge.svg)](https://github.com/MahmoudFarah003/webhook-pipeline-project/actions/workflows/ci.yml)

---

##  Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Action Types](#action-types)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Design Decisions](#design-decisions)
- [Future Improvements](#future-improvements)

---

##  Overview

This service lets users create **pipelines**. A pipeline connects three things:

1. **A source** — a unique URL that accepts incoming webhooks
2. **A processing action** — something that happens to the incoming data
3. **Subscribers** — one or more URLs where the processed result gets delivered

When a webhook hits a pipeline's source URL, the service queues it as a job and processes it in the background, ensuring reliability and scalability.

---

##  Architecture
                         ┌───────────────────────────┐
                         │       Client / User       │
                         │ (sends webhook requests)  │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │        API Server         │
                         │   (Express - Port 3000)   │
                         │                           │
                         │ - Create Pipelines        │
                         │ - Receive Webhooks        │
                         │ - Store Jobs in DB        │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │        PostgreSQL         │
                         │         Database          │
                         │                           │
                         │ - pipelines               │
                         │ - jobs                    │
                         │ - subscribers             │
                         │ - delivery_attempts       │
                         └─────────────┬─────────────┘
                                       │
                          (polls pending jobs)
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │          Worker           │
                         │     (Background Loop)     │
                         │                           │
                         │ - Fetch pending jobs      │
                         │ - Process data            │
                         │ - Apply action (e.g. UPPERCASE)
                         │ - Update job status       │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │      Subscribers          │
                         │ (External Webhook URLs)   │
                         │                           │
                         │ - Receive processed data  │
                         │ - Retry on failure        │
                         └───────────────────────────┘

### Data Flow

1. **Client** creates a pipeline with an action type and subscribers
2. **Webhook** is sent to `POST /webhook/:pipelineId`
3. **API** creates a job with status `pending` in the database
4. **Worker** picks up the job, processes it, and updates status to `processing`
5. **Processor** executes the action (uppercase, wordcount, etc.)
6. **Delivery** sends the result to all subscribers with retry logic
7. **Job** status updates to `done` or `failed`

---

##  Features

### Core Requirements (All Completed )

| Feature | Status | Description |
|---------|--------|-------------|
| **CRUD API for pipelines**  | Create, Read, Update, Delete pipelines |
| **Webhook ingestion** | Asynchronous webhook processing |
| **Background worker**  | Polls and processes jobs |
| **5+ action types**  | uppercase, wordcount, timestamp, reverse, echo |
| **Subscriber delivery**  | HTTP POST to subscriber URLs |
| **Retry logic**  | Exponential backoff (3 attempts) |
| **Job status API**  | Query jobs and delivery attempts |
| **Docker Compose**  | One-command setup |
| **CI/CD Pipeline**  | GitHub Actions automation |
| **README**  | Complete documentation |

### Stretch Goals (Optional Enhancements)

- [ ] Authentication & API Keys
- [ ] Webhook Signature Verification
- [ ] Rate Limiting
- [ ] Dashboard UI
- [ ] Metrics & Monitoring
- [ ] Pipeline Chaining

---

##  Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Git](https://git-scm.com/downloads)

### Installation

```bash
# Clone the repository
git clone https://github.com/MahmoudFarah003/webhook-pipeline-project.git
cd webhook-pipeline-project

# Start the services
docker-compose up --build  

    Wait for the logs to show:

db-1     | database system is ready to accept connections
api-1    | API running on port 3000

    Test the API
Open another terminal and run:

# Health check
curl http://localhost:3000/health

# Create a pipeline
curl -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{"name": "My Pipeline", "action_type": "uppercase"}'

# Send a webhook
curl -X POST http://localhost:3000/webhook/1 \
  -H "Content-Type: application/json" \
  -d '{"text": "hello world"}'

# Check jobs
curl http://localhost:3000/jobs

 API Documentation
Base URL : http://localhost:3000
Endpoints:

Health Check
Method	Endpoint	Description
GET	    /health	   Check if API is running

Response:

{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0"
}

Pipelines
Method	Endpoint	Description
GET	   /pipelines	List all pipelines
GET	   /pipelines/:id	Get pipeline details with subscribers
POST   /pipelines	    Create new pipeline
PUT	   /pipelines/:id	    Update pipeline
DELETE /pipelines/:id	Delete pipeline and related data
POST   /pipelines         (Create Pipeline)

Request Body:
{
  "name": "My Pipeline",
  "action_type": "uppercase",
  "subscribers": [
    "https://webhook.site/xxx",
    "https://example.com/webhook"
  ]
}
Response:
{
  "id": 1,
  "name": "My Pipeline",
  "action_type": "uppercase",
  "created_at": "2026-03-23T17:23:11.402Z"
}

GET /pipelines (List All Pipelines)

Response:
[
  {
    "id": 1,
    "name": "My Pipeline",
    "action_type": "uppercase",
    "created_at": ""
  }
]

Webhooks
Method	Endpoint	Description
POST	/webhook/:pipelineId	Send webhook to pipeline
POST /webhook/1

Request Body:
{
  "text": "hello world",
  "any": "data"
}
Response:
{
  "message": "Webhook received and job created",
  "jobId": 1,
  "status": "pending",
  "job": {
    "id": 1,
    "pipeline_id": 1,
    "payload": { "text": "hello world" },
    "status": "pending",
    "created_at": ""
  }

Jobs
Method	Endpoint	Description
GET	/jobs	List all jobs
GET	/jobs/:id	Get job details with delivery attempts
GET /jobs (List All Jobs)

Response:
[
  {
    "id": 1,
    "pipeline_id": 1,
    "payload": { "text": "hello world" },
    "status": "done",
    "result": { "text": "HELLO WORLD" },
    "created_at": "",
    "processed_at": "",
    "pipeline_name": "My Pipeline"
  }
]
GET /jobs/1 (Get Job Details)

Response :
{
  "id": 1,
  "pipeline_id": 1,
  "payload": { "text": "hello world" },
  "status": "done",
  "result": { "text": "HELLO WORLD" },
  "created_at": "",
  "processed_at": "",
  "pipeline_name": "My Pipeline",
  "delivery_attempts": [
    {
      "id": 1,
      "job_id": 1,
      "subscriber_url": "https://webhook.site/xxx",
      "attempt_number": 1,
      "status": "success",
      "response_code": 200,
      "duration_ms": 123,
      "created_at": "2026-01-01T00:00:01.000Z"
    }
  ]
}

 ##  Action Types

The system supports multiple processing actions that can be applied to incoming webhook data:

- **uppercase**: Converts text to uppercase.  
  Input: `{"text": "hello"}` → Output: `{"text": "HELLO"}`

- **wordcount**: Counts the number of words and characters in the text.  
  Input: `{"text": "hello world"}` → Output: `{"words": 2, "characters": 11}`

- **timestamp**: Adds a processing timestamp to the payload.  
  Input: `{"data": "value"}` → Output: `{"data": "value", "timestamp": "2026-..."}`

- **reverse**: Reverses the input text.  
  Input: `{"text": "hello"}` → Output: `{"text": "olleh"}`

- **echo**: Returns the same payload with additional metadata.  
  Input: Any payload → Output: Adds fields like `processed: true` and `receivedAt`

Adding New Actions
To add a new action type, update src/services/processor.ts:
case 'newaction':
  return {
    ...payload,
    result: yourLogic(payload),
    processed: true,
    action: 'newaction'
  };

  Database Schema:
  -- Pipelines: Stores pipeline configurations
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscribers: URLs that receive processed results
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);

-- Jobs: Tracks each webhook processing task
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  payload JSONB,
  status TEXT DEFAULT 'pending',  -- pending, processing, done, failed
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Delivery Attempts: Logs each delivery attempt
CREATE TABLE delivery_attempts (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  subscriber_url TEXT,
  attempt_number INTEGER,
  status TEXT,  -- success, failed
  response_code INTEGER,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

Testing:
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

CI/CD Pipeline
The project uses GitHub Actions for continuous integration and deployment.

Pipeline Stages
Checkout - Clone repository

Setup Node.js - Install Node.js 18

Install Dependencies - Run npm ci

Build - Run npm run build

Test - Run npm test

Docker Build - Test Docker build

Pipeline Configuration
Check this File: .github/workflows/ci.yml

Troubleshooting
Port 3000 Already in Use
    ports:
  - "3001:3000"
  Database Connection Error

# Wait 10 seconds after starting
docker-compose down
docker-compose up --build
Worker Not Processing Jobs

# Check worker logs
docker-compose logs -f worker
