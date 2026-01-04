#!/bin/bash

# CareCircle - Google Cloud Setup Script
# This script helps you set up a Google Cloud project for deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🎯 CareCircle - Google Cloud Project Setup${NC}"
echo "=============================================="
echo ""

# List existing projects
echo -e "${BLUE}Your existing Google Cloud projects:${NC}"
gcloud projects list --format="table(projectId,name)"
echo ""

# Ask user to choose
echo -e "${YELLOW}Choose an option:${NC}"
echo "1. Use an existing project"
echo "2. Create a new project"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    # Use existing project
    read -p "Enter the PROJECT_ID from the list above: " PROJECT_ID
    
    echo -e "${YELLOW}Setting project to: ${PROJECT_ID}${NC}"
    gcloud config set project $PROJECT_ID
    
elif [ "$choice" == "2" ]; then
    # Create new project
    # Generate unique project ID
    TIMESTAMP=$(date +%s)
    DEFAULT_PROJECT_ID="carecircle-${TIMESTAMP}"
    
    echo ""
    read -p "Enter project ID (or press Enter for '${DEFAULT_PROJECT_ID}'): " PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-$DEFAULT_PROJECT_ID}
    
    echo -e "${YELLOW}Creating project: ${PROJECT_ID}${NC}"
    gcloud projects create $PROJECT_ID --name="CareCircle Hackathon"
    
    echo -e "${YELLOW}Setting project to: ${PROJECT_ID}${NC}"
    gcloud config set project $PROJECT_ID
    
    echo ""
    echo -e "${GREEN}✅ Project created!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: You need to enable billing for this project${NC}"
    echo "Visit: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_ID}"
    echo ""
    read -p "Press Enter after you've enabled billing..."
    
else
    echo "Invalid choice. Exiting."
    exit 1
fi

# Export for deployment script
export GOOGLE_CLOUD_PROJECT=$PROJECT_ID

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Project ID:${NC} ${PROJECT_ID}"
echo ""
echo -e "${YELLOW}Next step: Run the deployment script${NC}"
echo "  export GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
echo "  ./scripts/deploy-gcloud.sh"
echo ""
