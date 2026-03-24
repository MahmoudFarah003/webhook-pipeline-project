#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Manual Retry Logic Test${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo -e "${YELLOW}[1] Creating pipeline with failing URL...${NC}"
RESULT=$(curl -s -X POST http://localhost:3000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Retry Test",
    "action_type": "uppercase",
    "subscribers": ["http://localhost:9999/nonexistent-endpoint"]
  }')
echo "$RESULT" | jq '.'
PIPELINE_ID=$(echo "$RESULT" | jq -r '.id')
echo "Pipeline ID: $PIPELINE_ID"
echo ""

echo -e "${YELLOW}[2] Sending webhook...${NC}"
WEBHOOK=$(curl -s -X POST http://localhost:3000/webhook/$PIPELINE_ID \
  -H "Content-Type: application/json" \
  -d '{"text": "testing retry manually"}')
echo "$WEBHOOK" | jq '.'
JOB_ID=$(echo "$WEBHOOK" | jq -r '.job.id')
echo "Job ID: $JOB_ID"
echo ""

echo -e "${YELLOW}[3] Waiting for job to process (15 seconds)...${NC}"
for i in {1..15}; do
    sleep 1
    STATUS=$(curl -s http://localhost:3000/jobs/$JOB_ID | jq -r '.status' 2>/dev/null)
    if [ "$STATUS" = "done" ] || [ "$STATUS" = "failed" ]; then
        echo "   Job completed with status: $STATUS"
        break
    fi
    if [ $((i % 5)) -eq 0 ]; then
        echo "   Still waiting... ($i seconds)"
    fi
done
echo ""

echo -e "${YELLOW}[4] Final job details...${NC}"
curl -s http://localhost:3000/jobs/$JOB_ID | jq '{
  id,
  status,
  result: .result
}'
echo ""

echo -e "${YELLOW}[5] Delivery attempts from database...${NC}"
docker exec webhook-pipeline-project_db_1 psql -U postgres -d pipeline -c "
  SELECT attempt_number, status, response_code, created_at 
  FROM delivery_attempts 
  WHERE job_id = $JOB_ID 
  ORDER BY attempt_number;
" 2>/dev/null

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Test Complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
