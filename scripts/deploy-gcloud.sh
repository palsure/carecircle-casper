#!/bin/bash

# CareCircle - Google Cloud Run Deployment Script
# This script deploys both the frontend and backend to Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-carecircle-hackathon}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
API_SERVICE_NAME="carecircle-api"
WEB_SERVICE_NAME="carecircle-web"

echo -e "${GREEN}🚀 CareCircle - Google Cloud Deployment${NC}"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated. Running gcloud auth login...${NC}"
    gcloud auth login
fi

# Set project
echo -e "${YELLOW}📋 Setting project to: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    --quiet

echo ""
echo -e "${GREEN}Step 1: Building and Deploying Backend API${NC}"
echo "=============================================="

# Deploy backend
cd apps/api
gcloud run deploy ${API_SERVICE_NAME} \
    --source . \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production" \
    --quiet

# Get backend URL
API_URL=$(gcloud run services describe ${API_SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Backend deployed at: ${API_URL}${NC}"

cd ../..

echo ""
echo -e "${GREEN}Step 2: Building and Deploying Frontend${NC}"
echo "=========================================="

# Create .env file for frontend build with API URL
cat > apps/web/.env.production << EOF
VITE_API_URL=${API_URL}
VITE_CASPER_NETWORK=casper-test
EOF

# Deploy frontend
cd apps/web
gcloud run deploy ${WEB_SERVICE_NAME} \
    --source . \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --quiet

# Get frontend URL
WEB_URL=$(gcloud run services describe ${WEB_SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Frontend deployed at: ${WEB_URL}${NC}"

cd ../..

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}📱 Frontend:${NC} ${WEB_URL}"
echo -e "${GREEN}🔌 API:${NC} ${API_URL}"
echo -e "${GREEN}📚 API Docs:${NC} ${API_URL}/docs"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Visit the frontend URL to test the app"
echo "2. Check API health: curl ${API_URL}/health"
echo "3. View logs: gcloud run logs tail ${WEB_SERVICE_NAME} --region ${REGION}"
echo ""
echo -e "${GREEN}🏆 Ready for Casper Hackathon 2026!${NC}"
