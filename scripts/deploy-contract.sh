#!/usr/bin/env bash
#
# CareCircle Contract Deployment Script for Casper Testnet
# =========================================================
#
# Prerequisites:
# 1. Rust toolchain with wasm32 target: rustup target add wasm32-unknown-unknown
# 2. Odra CLI installed: cargo install odra-cli
# 3. Casper CLI tools installed
# 4. Testnet CSPR tokens (get from faucet: https://testnet.cspr.live/tools/faucet)
#
# Usage:
#   ./scripts/deploy-contract.sh
#
# Environment variables (set these or create a .env file):
#   CASPER_SECRET_KEY - Path to your secret key file (e.g., ./keys/secret_key.pem)
#   CASPER_NODE_RPC   - Casper node RPC URL (default: testnet)
#   CASPER_CHAIN_NAME - Chain name (default: casper-test)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          CareCircle Contract Deployment                       ║"
echo "║          Casper Hackathon 2026                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment from .env if exists
if [ -f ".env" ]; then
    echo -e "${BLUE}Loading environment from .env...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration with defaults
CASPER_NODE_RPC="${CASPER_NODE_RPC:-https://rpc.testnet.casperlabs.io/rpc}"
CASPER_CHAIN_NAME="${CASPER_CHAIN_NAME:-casper-test}"
CONTRACT_DIR="./contracts/carecircle"
WASM_OUTPUT="${CONTRACT_DIR}/target/wasm32-unknown-unknown/release/carecircle.wasm"

# Check for secret key
if [ -z "${CASPER_SECRET_KEY:-}" ]; then
    echo -e "${YELLOW}⚠️  CASPER_SECRET_KEY not set.${NC}"
    echo ""
    echo "To deploy, you need to:"
    echo "  1. Generate keys: casper-client keygen ./keys"
    echo "  2. Get testnet CSPR from faucet: https://testnet.cspr.live/tools/faucet"
    echo "  3. Set environment variable: export CASPER_SECRET_KEY=./keys/secret_key.pem"
    echo ""
    echo "For now, we'll just build the contract."
    DEPLOY_ENABLED=false
else
    DEPLOY_ENABLED=true
    echo -e "${GREEN}✓ Secret key found: ${CASPER_SECRET_KEY}${NC}"
fi

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Node RPC:    ${CASPER_NODE_RPC}"
echo "  Chain Name:  ${CASPER_CHAIN_NAME}"
echo "  Contract:    ${CONTRACT_DIR}"
echo ""

# Step 1: Build the contract
echo -e "${BLUE}Step 1: Building contract...${NC}"
cd "${CONTRACT_DIR}"

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    echo -e "${RED}Error: Cargo.toml not found in ${CONTRACT_DIR}${NC}"
    exit 1
fi

# Build with Odra (recommended) or standard cargo
if command -v odra &> /dev/null; then
    echo "Using Odra CLI to build..."
    odra build -b casper
else
    echo "Using cargo to build (Odra CLI not found)..."
    cargo build --release --target wasm32-unknown-unknown
fi

# Check if WASM was created
cd - > /dev/null
if [ ! -f "${WASM_OUTPUT}" ]; then
    # Try Odra output path
    WASM_OUTPUT="${CONTRACT_DIR}/wasm/carecircle.wasm"
    if [ ! -f "${WASM_OUTPUT}" ]; then
        echo -e "${YELLOW}Note: WASM file not found at expected paths.${NC}"
        echo "This may be due to build configuration. Check Odra docs for your setup."
    fi
fi

if [ -f "${WASM_OUTPUT}" ]; then
    WASM_SIZE=$(du -h "${WASM_OUTPUT}" | cut -f1)
    echo -e "${GREEN}✓ Contract built successfully!${NC}"
    echo "  WASM file: ${WASM_OUTPUT}"
    echo "  Size: ${WASM_SIZE}"
fi

echo ""

# Step 2: Deploy to Testnet (if enabled)
if [ "${DEPLOY_ENABLED}" = true ]; then
    echo -e "${BLUE}Step 2: Deploying to Casper Testnet...${NC}"
    
    if [ ! -f "${WASM_OUTPUT}" ]; then
        echo -e "${RED}Error: WASM file not found. Cannot deploy.${NC}"
        exit 1
    fi
    
    # Get public key from secret key
    PUBLIC_KEY=$(casper-client account-address --public-key "${CASPER_SECRET_KEY}" 2>/dev/null || echo "")
    
    if [ -z "${PUBLIC_KEY}" ]; then
        echo -e "${YELLOW}Could not derive public key. Attempting deployment anyway...${NC}"
    else
        echo "  Deploying from: ${PUBLIC_KEY}"
    fi
    
    # Deploy using casper-client
    echo ""
    echo "Submitting deploy..."
    
    DEPLOY_HASH=$(casper-client put-deploy \
        --node-address "${CASPER_NODE_RPC}" \
        --chain-name "${CASPER_CHAIN_NAME}" \
        --secret-key "${CASPER_SECRET_KEY}" \
        --payment-amount 100000000000 \
        --session-path "${WASM_OUTPUT}" \
        --session-entry-point "init" \
        2>&1 | grep -oP '(?<="deploy_hash": ")[^"]+' || echo "")
    
    if [ -n "${DEPLOY_HASH}" ]; then
        echo -e "${GREEN}✓ Deploy submitted!${NC}"
        echo ""
        echo "  Deploy Hash: ${DEPLOY_HASH}"
        echo "  Explorer:    https://testnet.cspr.live/deploy/${DEPLOY_HASH}"
        echo ""
        echo -e "${YELLOW}Waiting for deploy to be processed...${NC}"
        echo "(This may take 1-2 minutes)"
        
        # Wait and check status
        sleep 30
        
        DEPLOY_STATUS=$(casper-client get-deploy \
            --node-address "${CASPER_NODE_RPC}" \
            "${DEPLOY_HASH}" 2>&1 | grep -oP '(?<="result": ")[^"]+' | head -1 || echo "pending")
        
        echo ""
        echo "  Status: ${DEPLOY_STATUS}"
        echo ""
        
        if [ "${DEPLOY_STATUS}" = "Success" ] || [ "${DEPLOY_STATUS}" = "success" ]; then
            echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║  🎉 CONTRACT DEPLOYED SUCCESSFULLY!                           ║${NC}"
            echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo "Next steps:"
            echo "  1. Get your contract hash from the explorer"
            echo "  2. Update apps/web/.env with VITE_CONTRACT_HASH=<hash>"
            echo "  3. Test the dApp: cd apps/web && npm run dev"
        else
            echo -e "${YELLOW}Deploy is still processing. Check the explorer for final status.${NC}"
        fi
    else
        echo -e "${RED}Deploy submission failed. Check error output above.${NC}"
        echo ""
        echo "Common issues:"
        echo "  - Insufficient CSPR balance (need ~100 CSPR for deployment)"
        echo "  - Invalid secret key format"
        echo "  - Network connectivity issues"
    fi
else
    echo -e "${BLUE}Step 2: Skipping deployment (no secret key configured)${NC}"
    echo ""
    echo "To deploy to Casper Testnet:"
    echo ""
    echo "  1. Generate keys:"
    echo "     casper-client keygen ./keys"
    echo ""
    echo "  2. Get your public key:"
    echo "     cat ./keys/public_key_hex"
    echo ""
    echo "  3. Request testnet CSPR:"
    echo "     Visit: https://testnet.cspr.live/tools/faucet"
    echo "     Paste your public key and request tokens"
    echo ""
    echo "  4. Set environment and deploy:"
    echo "     export CASPER_SECRET_KEY=./keys/secret_key.pem"
    echo "     ./scripts/deploy-contract.sh"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "📚 Resources:"
echo "   Odra Docs:       https://odra.dev/docs"
echo "   Casper Docs:     https://docs.casper.network"
echo "   Testnet Faucet:  https://testnet.cspr.live/tools/faucet"
echo "   Testnet Explorer: https://testnet.cspr.live"
echo ""
echo "🏆 Good luck with Casper Hackathon 2026!"
echo ""
