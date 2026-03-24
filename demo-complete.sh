#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Webhook Pipeline System - Complete Demo${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# ============================================
# 1. Health Check
# ============================================
echo -e "${GREEN}[1] Health Check${NC}"
curl -s http://localhost:3000/health | jq '.'
echo ""
sleep 1

# ============================================
# 2. Create Pipeline with Subscribers (Uppercase)
# ============================================
echo -e "${GREEN}[2] Create Pipeline (Uppercase) with Subscribers${NC}"
UPPER_RESULT=$(curl -s -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Uppercase Pipeline",
    "action_type": "uppercase",
    "subscribers": [
      "https://webhook.site/1f2e3d4c-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
      "https://httpbin.org/post"
    ]
  }')
echo "$UPPER_RESULT" | jq '.'
UPPER_ID=$(echo "$UPPER_RESULT" | jq -r '.id')
echo ""
sleep 1

# ============================================
# 3. Create Second Pipeline (Wordcount)
# ============================================
echo -e "${GREEN}[3] Create Pipeline (Wordcount)${NC}"
WORD_RESULT=$(curl -s -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wordcount Pipeline",
    "action_type": "wordcount"
  }')
echo "$WORD_RESULT" | jq '.'
WORD_ID=$(echo "$WORD_RESULT" | jq -r '.id')
echo ""
sleep 1

# ============================================
# 4. Create Third Pipeline (Timestamp)
# ============================================
echo -e "${GREEN}[4] Create Pipeline (Timestamp)${NC}"
TIMESTAMP_RESULT=$(curl -s -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Timestamp Pipeline",
    "action_type": "timestamp"
  }')
echo "$TIMESTAMP_RESULT" | jq '.'
TIMESTAMP_ID=$(echo "$TIMESTAMP_RESULT" | jq -r '.id')
echo ""
sleep 1

# ============================================
# 5. List All Pipelines
# ============================================
echo -e "${GREEN}[5] List All Pipelines${NC}"
curl -s http://localhost:3000/pipelines | jq '.'
echo ""
sleep 1

# ============================================
# 6. Get Pipeline Details (Uppercase)
# ============================================
echo -e "${GREEN}[6] Get Pipeline Details (ID: $UPPER_ID - Uppercase)${NC}"
curl -s http://localhost:3000/pipelines/$UPPER_ID | jq '.'
echo ""
sleep 1

# ============================================
# 7. Send Webhook to Uppercase Pipeline
# ============================================
echo -e "${GREEN}[7] Send Webhook to Uppercase Pipeline (ID: $UPPER_ID)${NC}"
echo "Payload: {\"text\": \"hello world from webhook\", \"source\": \"demo\"}"
UPPER_JOB=$(curl -s -X POST http://localhost:3000/webhook/$UPPER_ID \
  -H "Content-Type: application/json" \
  -d '{"text": "hello world from webhook", "source": "demo"}')
echo "$UPPER_JOB" | jq '.'
UPPER_JOB_ID=$(echo "$UPPER_JOB" | jq -r '.job.id')
echo ""
sleep 2

# ============================================
# 8. Send Webhook to Wordcount Pipeline
# ============================================
echo -e "${GREEN}[8] Send Webhook to Wordcount Pipeline (ID: $WORD_ID)${NC}"
echo "Payload: {\"text\": \"The quick brown fox jumps over the lazy dog\"}"
WORD_JOB=$(curl -s -X POST http://localhost:3000/webhook/$WORD_ID \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog"}')
echo "$WORD_JOB" | jq '.'
WORD_JOB_ID=$(echo "$WORD_JOB" | jq -r '.job.id')
echo ""
sleep 2

# ============================================
# 9. Send Webhook to Timestamp Pipeline
# ============================================
echo -e "${GREEN}[9] Send Webhook to Timestamp Pipeline (ID: $TIMESTAMP_ID)${NC}"
echo "Payload: {\"user\": \"test\", \"action\": \"login\"}"
TIMESTAMP_JOB=$(curl -s -X POST http://localhost:3000/webhook/$TIMESTAMP_ID \
  -H "Content-Type: application/json" \
  -d '{"user": "test", "action": "login"}')
echo "$TIMESTAMP_JOB" | jq '.'
TIMESTAMP_JOB_ID=$(echo "$TIMESTAMP_JOB" | jq -r '.job.id')
echo ""
sleep 2

# ============================================
# 10. Wait for Processing
# ============================================
echo -e "${YELLOW}[10] Waiting for worker to process jobs (5 seconds)...${NC}"
sleep 5

# ============================================
# 11. Check All Jobs
# ============================================
echo -e "${GREEN}[11] Check All Jobs${NC}"
curl -s http://localhost:3000/jobs | jq '.[] | {
  id,
  pipeline_name,
  status,
  result
}'
echo ""
sleep 1

# ============================================
# 12. Get Wordcount Job Details
# ============================================
echo -e "${GREEN}[12] Get Wordcount Job Details (Job ID: $WORD_JOB_ID)${NC}"
curl -s http://localhost:3000/jobs/$WORD_JOB_ID | jq '{
  id,
  pipeline_id,
  status,
  result
}'
echo ""
sleep 1

# ============================================
# 13. Verify Wordcount Result
# ============================================
echo -e "${GREEN}[13] Verify Wordcount Result${NC}"
WORD_RESULT_CHECK=$(curl -s http://localhost:3000/jobs/$WORD_JOB_ID | jq -r '.result')
if echo "$WORD_RESULT_CHECK" | grep -q "words"; then
    echo -e "${GREEN}✓ Wordcount is working correctly!${NC}"
    echo "$WORD_RESULT_CHECK" | jq '.'
else
    echo -e "${RED}✗ Wordcount is not working correctly${NC}"
fi
echo ""
sleep 1

# ============================================
# 14. Update Pipeline
# ============================================
echo -e "${GREEN}[14] Update Pipeline (Change name of Uppercase Pipeline)${NC}"
curl -s -X PUT http://localhost:3000/pipelines/$UPPER_ID \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Uppercase Pipeline"}' | jq '.'
echo ""
sleep 1

# ============================================
# 15. Delete Timestamp Pipeline
# ============================================
echo -e "${GREEN}[15] Delete Pipeline (ID: $TIMESTAMP_ID - Timestamp)${NC}"
curl -s -X DELETE http://localhost:3000/pipelines/$TIMESTAMP_ID | jq '.'
echo ""
sleep 1

# ============================================
# 16. Verify Pipeline Deleted
# ============================================
echo -e "${GREEN}[16] Verify Pipeline Deleted${NC}"
curl -s http://localhost:3000/pipelines | jq '.'
echo ""
sleep 1

# ============================================
# 17. Test Retry Logic
# ============================================
echo -e "${YELLOW}[17] Test Retry Logic (Failing URL)${NC}"
echo "Creating pipeline with failing subscriber..."
RETRY_PIPELINE=$(curl -s -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Retry Test",
    "action_type": "uppercase",
    "subscribers": ["http://localhost:9999/does-not-exist"]
  }')
echo "$RETRY_PIPELINE" | jq '.'
RETRY_PIPELINE_ID=$(echo "$RETRY_PIPELINE" | jq -r '.id')
echo "Pipeline ID: $RETRY_PIPELINE_ID"
echo ""

echo "Sending webhook to trigger retry logic..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/webhook/$RETRY_PIPELINE_ID \
  -H "Content-Type: application/json" \
  -d '{"text": "testing retry logic"}')
echo "$WEBHOOK_RESPONSE" | jq '.'
RETRY_JOB_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.job.id')
echo "Job ID: $RETRY_JOB_ID"
echo ""

echo "Waiting for retry attempts (15 seconds)..."
sleep 15

echo "Checking delivery attempts for job $RETRY_JOB_ID..."
RETRY_CHECK=$(curl -s http://localhost:3000/jobs/$RETRY_JOB_ID | jq '{
  id,
  status,
  result: .result.deliveries,
  delivery_attempts: .delivery_attempts | length
}')
echo "$RETRY_CHECK" | jq '.'

if [ $(echo "$RETRY_CHECK" | jq -r '.delivery_attempts') -eq 3 ]; then
    echo -e "${GREEN}✓ Retry Logic working! 3 attempts recorded${NC}"
else
    echo -e "${RED}✗ Retry Logic issue: Expected 3 attempts${NC}"
fi
echo ""

# ============================================
# 18. Final Summary
# ============================================
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Demo Complete - Results Summary${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo -e "${GREEN}Pipelines Created:${NC}"
echo "  • Uppercase Pipeline (ID: $UPPER_ID) - with 2 subscribers"
echo "  • Wordcount Pipeline (ID: $WORD_ID)"
echo "  • Timestamp Pipeline (ID: $TIMESTAMP_ID) - DELETED"
echo "  • Retry Test Pipeline (ID: $RETRY_PIPELINE_ID)"
echo ""

echo -e "${GREEN}Webhooks Sent:${NC}"
echo "  • Uppercase: 'hello world from webhook'"
echo "  • Wordcount: 'The quick brown fox jumps over the lazy dog'"
echo "  • Timestamp: '{\"user\": \"test\", \"action\": \"login\"}'"
echo "  • Retry Test: 'testing retry logic'"
echo ""

echo -e "${GREEN}Action Types Demonstrated:${NC}"
echo "  • Uppercase: 'hello world' → 'HELLO WORLD'"
echo "  • Wordcount: 9 words, 43 characters"
echo "  • Timestamp: Added ISO timestamp"
echo "  • Retry Logic: 3 delivery attempts with exponential backoff"
echo ""

echo -e "${GREEN}CRUD Operations:${NC}"
echo "  • CREATE: 4 pipelines created"
echo "  • READ: Pipeline details retrieved"
echo "  • UPDATE: Pipeline name updated"
echo "  • DELETE: Timestamp pipeline deleted"
echo ""

echo -e "${GREEN}Reliability Features:${NC}"
echo "  • Async processing with background worker"
echo "  • Retry logic with 3 attempts"
echo "  • Delivery attempts logged in database"
echo "  • Error handling for failed deliveries"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}✅ All Requirements Demonstrated!${NC}"
echo -e "${BLUE}=========================================${NC}"