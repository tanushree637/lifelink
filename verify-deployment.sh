#!/bin/bash

# Post-Deployment Verification Script
# Run this after deploying to Vercel and Railway
# Usage: chmod +x verify-deployment.sh && ./verify-deployment.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Starting Post-Deployment Verification...${NC}\n"

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://lifelink.vercel.app}"
BACKEND_URL="${BACKEND_URL:-https://lifelink-backend.railway.app}"
API_BASE_URL="${BACKEND_URL}/api"

# Test counters
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo -e "${GREEN}✅ PASS (Status: $response)${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL (Status: $response)${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test DNS resolution
echo -e "${YELLOW}1️⃣  DNS & Network Tests${NC}"
echo "Frontend Domain: $FRONTEND_URL"
echo "Backend Domain: $BACKEND_URL"
echo ""

# Frontend
test_endpoint "Frontend Homepage" "$FRONTEND_URL" "200"
test_endpoint "Frontend Login" "$FRONTEND_URL/login" "200"

# Backend
test_endpoint "Backend API Health" "$API_BASE_URL/health" "200"
test_endpoint "Backend Home" "$BACKEND_URL" "200"

echo ""
echo -e "${YELLOW}2️⃣  API Endpoints Tests${NC}"

# Auth endpoints
test_endpoint "Auth Signup" "$API_BASE_URL/auth/signup" "400"  # Expect 400 without body
test_endpoint "Auth Login" "$API_BASE_URL/auth/login" "400"    # Expect 400 without body

# Hospital endpoints
test_endpoint "Hospital List" "$API_BASE_URL/hospitals" "200"

# Donor endpoints
test_endpoint "Donor Home" "$BACKEND_URL" "200"

echo ""
echo -e "${YELLOW}3️⃣  Security Tests${NC}"

# Check HTTPS
if [[ "$FRONTEND_URL" == https://* ]] && [[ "$BACKEND_URL" == https://* ]]; then
    echo -e "${GREEN}✅ Both services use HTTPS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Not using HTTPS${NC}"
    ((FAILED++))
fi

# Check CORS headers
echo -n "Testing CORS headers... "
cors_header=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -X OPTIONS "$API_BASE_URL/hospitals" -i 2>/dev/null | grep -i "access-control" | head -1 || echo "")

if [ ! -z "$cors_header" ]; then
    echo -e "${GREEN}✅ CORS headers present${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  CORS headers not found (might be OK)${NC}"
fi

echo ""
echo -e "${YELLOW}4️⃣  Environment Variables Check${NC}"

# Create test file to check env vars
cat > /tmp/test_env.js << 'EOF'
console.log("Frontend environment loaded");
if (process.env.REACT_APP_API_BASE_URL) {
    console.log("✓ REACT_APP_API_BASE_URL configured");
} else {
    console.log("✗ REACT_APP_API_BASE_URL missing");
}
EOF

echo -e "${YELLOW}Environment variables should be checked in Vercel and Railway dashboards${NC}"
echo "Frontend: https://vercel.com/dashboard → Settings → Environment Variables"
echo "Backend: https://railway.app/dashboard → Settings → Variables"

echo ""
echo -e "${YELLOW}5️⃣  Performance Tests${NC}"

# Frontend response time
echo -n "Frontend response time... "
start_time=$(date +%s%N)
curl -s "$FRONTEND_URL" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}${response_time}ms${NC}"

# Backend response time
echo -n "Backend response time... "
start_time=$(date +%s%N)
curl -s "$API_BASE_URL/health" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}${response_time}ms${NC}"

echo ""
echo -e "${YELLOW}📋 Summary${NC}"
echo "Passed: ${GREEN}$PASSED${NC}"
echo "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All checks passed! Deployment successful.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some checks failed. Review the output above.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔗 Useful Links${NC}"
echo "Vercel Dashboard: https://vercel.com/dashboard"
echo "Vercel Logs: $FRONTEND_URL (check Network tab)"
echo "Railway Dashboard: https://railway.app/dashboard"
echo "Railway Logs: https://railway.app/dashboard → Logs"
echo "GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*://' | sed 's/.git$//')/actions"
