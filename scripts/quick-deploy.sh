#!/bin/bash

# Quick Deploy to Google Cloud Run
# Uses your Confluent project with billing enabled

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 CareCircle - Quick Deploy${NC}"
echo ""

# Use Confluent project (has billing enabled)
PROJECT_ID="gen-lang-client-0692818755"
REGION="us-central1"

echo -e "${YELLOW}Using project: ${PROJECT_ID} (Confluent)${NC}"
gcloud config set project ${PROJECT_ID}

# Enable APIs
echo -e "${YELLOW}Enabling APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com --quiet

# Deploy backend
echo ""
echo -e "${GREEN}Deploying Backend API...${NC}"
cd apps/api
gcloud run deploy carecircle-api \
    --source . \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --quiet

API_URL=$(gcloud run services describe carecircle-api --region ${REGION} --format 'value(status.url)')
echo -e "${GREEN}✅ API deployed: ${API_URL}${NC}"

# Deploy frontend
echo ""
echo -e "${GREEN}Deploying Frontend...${NC}"
cd ../web

# Create env file with API URL
cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_CASPER_NETWORK=casper-test
EOF

gcloud run deploy carecircle-web \
    --source . \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --quiet

WEB_URL=$(gcloud run services describe carecircle-web --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}📱 Frontend:${NC} ${WEB_URL}"
echo -e "${GREEN}🔌 API:${NC} ${API_URL}"
echo -e "${GREEN}📚 API Docs:${NC} ${API_URL}/docs"
echo ""
echo -e "${YELLOW}🏆 Ready for Casper Hackathon 2026!${NC}"
