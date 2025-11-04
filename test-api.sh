#!/bin/bash
# Test script for the external workloads API endpoint
# This script demonstrates how to call the API with proper authentication
#
# Usage:
#   ./test-api.sh
#
# The script will automatically load environment variables from .env file if present.
# You can override any variable by passing it as an environment variable:
#   API_KEY=your-key WORKLOAD_ID=your-id ./test-api.sh

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  # Export variables from .env file (skip comments and empty lines)
  set -a
  source <(grep -v '^#' .env | grep -v '^$')
  set +a
  echo ""
fi

# Configuration
# These can be overridden by environment variables or use defaults
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"

# If NADIKI_API_KEYS is set, use the first key from the comma-separated list
if [ -n "$NADIKI_API_KEYS" ]; then
  API_KEY="${API_KEY:-${NADIKI_API_KEYS%%,*}}"
else
  API_KEY="${API_KEY:-test-api-key}"
fi

WORKLOAD_ID="${WORKLOAD_ID:-550e8400-e29b-41d4-a716-446655440000}"

# Calculate time range (last 24 hours)
TO_TIMESTAMP=$(date +%s)
FROM_TIMESTAMP=$((TO_TIMESTAMP - 86400))

echo "==================================="
echo "Nadiki Workloads API Test Script"
echo "==================================="
echo "API Base URL: $API_BASE_URL"
echo "Workload ID: $WORKLOAD_ID"
echo "From: $FROM_TIMESTAMP ($(date -r $FROM_TIMESTAMP))"
echo "To: $TO_TIMESTAMP ($(date -r $TO_TIMESTAMP))"
echo ""

# Test 1: Request without API key (should fail with 401)
echo "Test 1: Request without API key..."
echo "-----------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query?from=${FROM_TIMESTAMP}&to=${TO_TIMESTAMP}"
echo ""
echo ""

# Test 2: Request with invalid API key (should fail with 401)
echo "Test 2: Request with invalid API key..."
echo "-----------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Api-Key: invalid-key" \
  "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query?from=${FROM_TIMESTAMP}&to=${TO_TIMESTAMP}"
echo ""
echo ""

# Test 3: OPTIONS preflight request
echo "Test 3: OPTIONS preflight request..."
echo "-----------------------------------"
curl -s -X OPTIONS -i \
  "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query"
echo ""
echo ""

# Test 4: Valid request with API key
echo "Test 4: Valid request with API key..."
echo "-----------------------------------"
curl -s -i \
  -H "X-Api-Key: ${API_KEY}" \
  "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query?from=${FROM_TIMESTAMP}&to=${TO_TIMESTAMP}"
echo ""
echo ""

# Test 5: Request with missing parameters
echo "Test 5: Request with missing parameters..."
echo "-----------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Api-Key: ${API_KEY}" \
  "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query"
echo ""
echo ""

# Test 6: Rate limit testing (make multiple requests)
echo "Test 6: Rate limit testing (5 rapid requests)..."
echo "-----------------------------------"
for i in {1..5}; do
  echo "Request $i:"
  curl -s \
    -H "X-Api-Key: ${API_KEY}" \
    -w "\nHTTP Status: %{http_code}\n" \
    "${API_BASE_URL}/api/workloads/${WORKLOAD_ID}/query?from=${FROM_TIMESTAMP}&to=${TO_TIMESTAMP}" \
    | grep -E "(X-RateLimit|HTTP Status)"
  echo ""
done

echo "==================================="
echo "Test script completed"
echo "==================================="
