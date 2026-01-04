#!/usr/bin/env bash
#
# CareCircle Demo Data Seeder
# ===========================
#
# Creates sample data in the API cache for demo/testing purposes.
# Run this after starting the API server.
#
# Usage:
#   ./scripts/seed-demo.sh
#

set -euo pipefail

API_URL="${API_URL:-http://localhost:3005}"

echo "🌱 Seeding CareCircle demo data..."
echo "   API: ${API_URL}"
echo ""

# Check if API is running
if ! curl -s "${API_URL}/health" > /dev/null; then
    echo "❌ Error: API server not running at ${API_URL}"
    echo "   Start it with: cd apps/api && npm run dev"
    exit 1
fi

echo "✓ API is running"
echo ""

# Demo addresses (for testing without real wallet)
OWNER_ADDR="01a5b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234"
MEMBER1_ADDR="02b6c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456"
MEMBER2_ADDR="01c7d0e1f234567890abcdef1234567890abcdef1234567890abcdef12345678"

# Create a demo circle
echo "Creating demo circle..."
curl -s -X POST "${API_URL}/circles/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": 1,
    \"name\": \"Mom's Care Team\",
    \"owner\": \"${OWNER_ADDR}\",
    \"tx_hash\": \"demo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab\"
  }" | jq .

# Add members
echo ""
echo "Adding members..."
curl -s -X POST "${API_URL}/members/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"circle_id\": 1,
    \"address\": \"${OWNER_ADDR}\",
    \"is_owner\": true
  }" | jq .

curl -s -X POST "${API_URL}/members/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"circle_id\": 1,
    \"address\": \"${MEMBER1_ADDR}\",
    \"is_owner\": false
  }" | jq .

curl -s -X POST "${API_URL}/members/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"circle_id\": 1,
    \"address\": \"${MEMBER2_ADDR}\",
    \"is_owner\": false
  }" | jq .

# Create demo tasks
echo ""
echo "Creating demo tasks..."

# Task 1: Open, high priority
curl -s -X POST "${API_URL}/tasks/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": 1,
    \"circle_id\": 1,
    \"title\": \"Pick up medication from pharmacy\",
    \"description\": \"Monthly prescription refill at CVS\",
    \"assigned_to\": \"${MEMBER1_ADDR}\",
    \"created_by\": \"${OWNER_ADDR}\",
    \"priority\": 2,
    \"completed\": false
  }" | jq .

# Task 2: Open, normal priority
curl -s -X POST "${API_URL}/tasks/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": 2,
    \"circle_id\": 1,
    \"title\": \"Grocery shopping for the week\",
    \"description\": \"Get items from the shopping list\",
    \"assigned_to\": \"${MEMBER2_ADDR}\",
    \"created_by\": \"${OWNER_ADDR}\",
    \"priority\": 1,
    \"completed\": false
  }" | jq .

# Task 3: Completed with tx hash
curl -s -X POST "${API_URL}/tasks/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": 3,
    \"circle_id\": 1,
    \"title\": \"Doctor appointment accompaniment\",
    \"description\": \"Drive to and attend appointment\",
    \"assigned_to\": \"${OWNER_ADDR}\",
    \"created_by\": \"${OWNER_ADDR}\",
    \"priority\": 3,
    \"completed\": true,
    \"completed_by\": \"${OWNER_ADDR}\",
    \"completed_at\": $(date +%s)000,
    \"tx_hash\": \"abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ef\"
  }" | jq .

# Task 4: Completed
curl -s -X POST "${API_URL}/tasks/upsert" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": 4,
    \"circle_id\": 1,
    \"title\": \"Morning check-in call\",
    \"description\": \"Daily wellness check\",
    \"assigned_to\": \"${MEMBER1_ADDR}\",
    \"created_by\": \"${OWNER_ADDR}\",
    \"priority\": 1,
    \"completed\": true,
    \"completed_by\": \"${MEMBER1_ADDR}\",
    \"completed_at\": $(date +%s)000,
    \"tx_hash\": \"ef123456789abcdef1234567890abcdef1234567890abcdef1234567890abcd\"
  }" | jq .

echo ""
echo "Getting stats..."
curl -s "${API_URL}/circles/1/stats" | jq .

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Demo data seeded successfully!"
echo ""
echo "Demo Circle: Mom's Care Team (ID: 1)"
echo "Members: 3"
echo "Tasks: 4 (2 open, 2 completed)"
echo ""
echo "To test:"
echo "  1. Open http://localhost:5173"
echo "  2. Connect wallet (use demo address: ${OWNER_ADDR})"
echo "  3. Enter Circle ID: 1"
echo ""
echo "Demo addresses for testing:"
echo "  Owner:   ${OWNER_ADDR}"
echo "  Member1: ${MEMBER1_ADDR}"
echo "  Member2: ${MEMBER2_ADDR}"
echo "════════════════════════════════════════════════════════════════"
