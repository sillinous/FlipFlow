#!/bin/bash

# FlipFlow Deployment Script
# Handles pre-deploy checks and Vercel deployment with validation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="${1:-preview}"  # preview or production
PROJECT_NAME="flipflow"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║     FlipFlow Deployment Script        ║
║   Production-Ready Vercel Deploy      ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Deployment Environment: ${DEPLOY_ENV}"
echo ""

# Step 1: Check prerequisites
log_info "Step 1/7: Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "git is not installed."
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

log_success "Prerequisites check passed"
echo ""

# Step 2: Git status check
log_info "Step 2/7: Checking git status..."

if [ -n "$(git status --porcelain)" ]; then
    log_warning "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled. Please commit your changes first."
        exit 1
    fi
else
    log_success "Working directory clean"
fi

CURRENT_BRANCH=$(git branch --show-current)
log_info "Current branch: ${CURRENT_BRANCH}"

if [ "$DEPLOY_ENV" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "You're deploying to production from branch: ${CURRENT_BRANCH}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled."
        exit 1
    fi
fi

echo ""

# Step 3: Install dependencies
log_info "Step 3/7: Installing dependencies..."

if [ ! -d "node_modules" ]; then
    log_info "node_modules not found. Running npm ci..."
    npm ci
else
    log_info "Updating dependencies..."
    npm ci
fi

log_success "Dependencies installed"
echo ""

# Step 4: Lint check
log_info "Step 4/7: Running ESLint..."

if npm run lint; then
    log_success "Lint check passed"
else
    log_error "ESLint found errors. Please fix them before deploying."
    exit 1
fi

echo ""

# Step 5: Type check
log_info "Step 5/7: Running TypeScript type check..."

if npm run type-check; then
    log_success "Type check passed"
else
    log_error "TypeScript errors found. Please fix them before deploying."
    exit 1
fi

echo ""

# Step 6: Build check
log_info "Step 6/7: Testing production build..."

# Set required env vars for build
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-sk-ant-mock-key-for-build-test}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://flipflow.vercel.app}"
export NODE_ENV="production"

if npm run build; then
    log_success "Production build successful"
    # Clean up build artifacts
    rm -rf .next
else
    log_error "Production build failed. Please fix build errors before deploying."
    exit 1
fi

echo ""

# Step 7: Deploy to Vercel
log_info "Step 7/7: Deploying to Vercel..."

if [ "$DEPLOY_ENV" = "production" ]; then
    log_warning "Deploying to PRODUCTION"
    read -p "Are you sure? This will update the live site. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled."
        exit 1
    fi

    log_info "Deploying to production..."
    DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
    DEPLOY_EXIT_CODE=$?
else
    log_info "Deploying preview..."
    DEPLOY_OUTPUT=$(vercel --yes 2>&1)
    DEPLOY_EXIT_CODE=$?
fi

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    log_success "Deployment successful!"

    # Extract deployment URL
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https://[^\s]+vercel\.app' | head -n 1)

    if [ -n "$DEPLOY_URL" ]; then
        echo ""
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                 Deployment Complete!                      ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}URL:${NC} ${DEPLOY_URL}"
        echo ""

        # Post-deployment verification
        log_info "Performing post-deployment verification..."

        sleep 5  # Wait for deployment to be ready

        if curl -f -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}" | grep -q "200"; then
            log_success "Site is responding correctly"
        else
            log_warning "Site may not be fully ready yet. Check manually: ${DEPLOY_URL}"
        fi

        # Health check
        if curl -f -s "${DEPLOY_URL}/api/health" &> /dev/null; then
            log_success "Health check passed"
        else
            log_warning "Health check endpoint not responding (this may be normal if not implemented)"
        fi

        echo ""
        echo -e "${GREEN}Next steps:${NC}"
        echo "  1. Test the deployment: ${DEPLOY_URL}"
        echo "  2. Verify all features work correctly"
        if [ "$DEPLOY_ENV" = "production" ]; then
            echo "  3. Monitor logs in Vercel Dashboard"
            echo "  4. Check error tracking (if Sentry is configured)"
        else
            echo "  3. If everything works, promote to production:"
            echo "     ./scripts/deploy.sh production"
        fi
    fi
else
    log_error "Deployment failed!"
    echo ""
    echo "Error output:"
    echo "$DEPLOY_OUTPUT"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check that Vercel CLI is authenticated: vercel whoami"
    echo "  2. Verify environment variables are set in Vercel Dashboard"
    echo "  3. Check Vercel deployment logs for detailed errors"
    echo "  4. Ensure all required secrets are configured"
    exit 1
fi

echo ""
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment script completed successfully!${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
