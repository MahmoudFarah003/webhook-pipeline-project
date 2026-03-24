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
./demo-complete.sh
this file includes all things you need to run .

 API Documentation
Base URL : http://localhost:3000
Endpoints:

Health Check
Method	Endpoint	Description
GET	    /health	   Check if API is running

Response:

[1] Health Check
{
  "status": "ok",
  "timestamp": "2026-03-24T02:19:07.756Z",
  "uptime": 540.327744774,
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


[2] Create Pipeline (Uppercase) with Subscribers
{
  "id": 3,
  "name": "Uppercase Pipeline",
  "action_type": "uppercase",
  "created_at": "2026-03-24T02:19:08.783Z"
}

[3] Create Pipeline (Wordcount)
{
  "id": 4,
  "name": "Wordcount Pipeline",
  "action_type": "wordcount",
  "created_at": "2026-03-24T02:19:09.824Z"
}

[4] Create Pipeline (Timestamp)
{
  "id": 5,
  "name": "Timestamp Pipeline",
  "action_type": "timestamp",
  "created_at": "2026-03-24T02:19:10.861Z"
}

[5] List All Pipelines
[
  {
    "id": 5,
    "name": "Timestamp Pipeline",
    "action_type": "timestamp",
    "created_at": "2026-03-24T02:19:10.861Z"
  },
  {
    "id": 4,
    "name": "Wordcount Pipeline",
    "action_type": "wordcount",
    "created_at": "2026-03-24T02:19:09.824Z"
  },
  {
    "id": 3,
    "name": "Uppercase Pipeline",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:19:08.783Z"
  },
  {
    "id": 2,
    "name": "Manual Retry Test",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:10:12.878Z"
  },
  {
    "id": 1,
    "name": "Manual Retry Test",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:06:36.040Z"
  }
]

[6] Get Pipeline Details (ID: 3 - Uppercase)
{
  "id": 3,
  "name": "Uppercase Pipeline",
  "action_type": "uppercase",
  "created_at": "2026-03-24T02:19:08.783Z",
  "subscribers": [
    {
      "id": 3,
      "pipeline_id": 3,
      "url": "https://webhook.site/1f2e3d4c-5b6a-7c8d-9e0f-1a2b3c4d5e6f"
    },
    {
      "id": 4,
      "pipeline_id": 3,
      "url": "https://httpbin.org/post"
    }
  ]
}

[7] Send Webhook to Uppercase Pipeline (ID: 3)
Payload: {"text": "hello world from webhook", "source": "demo"}
{
  "message": "Webhook received and job created",
  "job": {
    "id": 3,
    "pipeline_id": 3,
    "payload": {
      "text": "hello world from webhook",
      "source": "demo"
    },
    "status": "pending",
    "result": null,
    "created_at": "2026-03-24T02:19:13.933Z",
    "processed_at": null
  }
}

[8] Send Webhook to Wordcount Pipeline (ID: 4)
Payload: {"text": "The quick brown fox jumps over the lazy dog"}
{
  "message": "Webhook received and job created",
  "job": {
    "id": 4,
    "pipeline_id": 4,
    "payload": {
      "text": "The quick brown fox jumps over the lazy dog"
    },
    "status": "pending",
    "result": null,
    "created_at": "2026-03-24T02:19:15.970Z",
    "processed_at": null
  }
}

[9] Send Webhook to Timestamp Pipeline (ID: 5)
Payload: {"user": "test", "action": "login"}
{
  "message": "Webhook received and job created",
  "job": {
    "id": 5,
    "pipeline_id": 5,
    "payload": {
      "user": "test",
      "action": "login"
    },
    "status": "pending",
    "result": null,
    "created_at": "2026-03-24T02:19:18.005Z",
    "processed_at": null
  }
}

[10] Waiting for worker to process jobs (5 seconds)...
[11] Check All Jobs
{
  "id": 5,
  "pipeline_name": "Timestamp Pipeline",
  "status": "done",
  "result": {
    "output": {
      "user": "test",
      "action": "login",
      "timestamp": "2026-03-24T02:19:21.558Z"
    },
    "deliveries": []
  }
}
{
  "id": 4,
  "pipeline_name": "Wordcount Pipeline",
  "status": "done",
  "result": {
    "output": {
      "words": 9,
      "characters": 43
    },
    "deliveries": []
  }
}
{
  "id": 3,
  "pipeline_name": "Uppercase Pipeline",
  "status": "done",
  "result": {
    "output": {
      "text": "HELLO WORLD FROM WEBHOOK"
    },
    "deliveries": [
      {
        "url": "https://webhook.site/1f2e3d4c-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
        "error": "HTTP 404",
        "success": false,
        "attempts": 3
      },
      {
        "url": "https://httpbin.org/post",
        "success": true,
        "attempts": 1,
        "statusCode": 200
      }
    ]
  }
}
{
  "id": 2,
  "pipeline_name": "Manual Retry Test",
  "status": "done",
  "result": {
    "output": {
      "text": "TESTING RETRY MANUALLY"
    },
    "deliveries": [
      {
        "url": "http://localhost:9999/nonexistent-endpoint",
        "error": "Connection refused",
        "success": false,
        "attempts": 3
      }
    ]
  }
}
{
  "id": 1,
  "pipeline_name": "Manual Retry Test",
  "status": "processing",
  "result": null
}

[12] Get Wordcount Job Details (Job ID: 4)
{
  "id": 4,
  "pipeline_id": 4,
  "status": "done",
  "result": {
    "output": {
      "words": 9,
      "characters": 43
    },
    "deliveries": []
  }
}

[13] Verify Wordcount Result
✓ Wordcount is working correctly!
{
  "output": {
    "words": 9,
    "characters": 43
  },
  "deliveries": []
}

[14] Update Pipeline (Change name of Uppercase Pipeline)
{
  "message": "Pipeline updated successfully",
  "data": {
    "id": 3,
    "name": "Updated Uppercase Pipeline",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:19:08.783Z"
  }
}

[15] Delete Pipeline (ID: 5 - Timestamp)
{
  "message": "Pipeline deleted successfully",
  "data": {
    "id": 5,
    "name": "Timestamp Pipeline",
    "action_type": "timestamp",
    "created_at": "2026-03-24T02:19:10.861Z"
  }
}

[16] Verify Pipeline Deleted
[
  {
    "id": 4,
    "name": "Wordcount Pipeline",
    "action_type": "wordcount",
    "created_at": "2026-03-24T02:19:09.824Z"
  },
  {
    "id": 3,
    "name": "Updated Uppercase Pipeline",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:19:08.783Z"
  },
  {
    "id": 2,
    "name": "Manual Retry Test",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:10:12.878Z"
  },
  {
    "id": 1,
    "name": "Manual Retry Test",
    "action_type": "uppercase",
    "created_at": "2026-03-24T02:06:36.040Z"
  }
]

[17] Test Retry Logic (Failing URL)
Creating pipeline with failing subscriber...
{
  "id": 6,
  "name": "Retry Test",
  "action_type": "uppercase",
  "created_at": "2026-03-24T02:19:31.200Z"
}
Pipeline ID: 6

Sending webhook to trigger retry logic...
{
  "message": "Webhook received and job created",
  "job": {
    "id": 6,
    "pipeline_id": 6,
    "payload": {
      "text": "testing retry logic"
    },
    "status": "pending",
    "result": null,
    "created_at": "2026-03-24T02:19:31.235Z",
    "processed_at": null
  }
}
Job ID: 6

Waiting for retry attempts (15 seconds)...
Checking delivery attempts for job 6...
{
  "id": 6,
  "status": "done",
  "result": [
    {
      "url": "http://localhost:9999/does-not-exist",
      "error": "Connection refused",
      "success": false,
      "attempts": 3
    }
  ],
  "delivery_attempts": 3
}
 Retry Logic working! 3 attempts recorded

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
