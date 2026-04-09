# LifeLink Production Deployment Script (PowerShell)
# This script guides you through deploying LifeLink to Railway + Vercel

Write-Host "🚀 LifeLink Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify git status
Write-Host "📝 Step 1: Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "✅ Ensure all changes are committed before proceeding!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue"

# Step 2: Create accounts
Write-Host ""
Write-Host "📝 Step 2: Creating accounts (manual steps)" -ForegroundColor Yellow
Write-Host "=========================================="
Write-Host ""
Write-Host "1️⃣  Go to https://railway.app" -ForegroundColor Cyan
Write-Host "   - Sign up with GitHub"
Write-Host "   - Create a new project"
Write-Host "   - Connect your GitHub repository"
Write-Host ""
Write-Host "2️⃣  Go to https://vercel.com" -ForegroundColor Cyan
Write-Host "   - Sign up with GitHub"
Write-Host "   - Import your project"
Write-Host "   - Root directory: 'client'"
Write-Host ""
Read-Host "Press Enter once both accounts are created and repos connected"

# Step 3: Get Railway domain
Write-Host ""
Write-Host "📝 Step 3: Railway Configuration" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""
Write-Host "On Railway Dashboard:"
Write-Host "1. Go to your project settings"
Write-Host "2. Set BUILD COMMAND: cd server && npm install"
Write-Host "3. Set START COMMAND: cd server && node server.js"
Write-Host ""
$RAILWAY_DOMAIN = Read-Host "Enter your Railway domain (e.g., https://lifelink-prod.railway.app)"
$RAILWAY_DOMAIN = $RAILWAY_DOMAIN.TrimEnd('/')

# Step 4: Add Railway Environment Variables
Write-Host ""
Write-Host "📝 Step 4: Add Railway Environment Variables" -ForegroundColor Yellow
Write-Host "============================================="
Write-Host ""
Write-Host "In Railway Dashboard > Project > Variables, add:"
Write-Host ""
Write-Host "FIREBASE_PROJECT_ID=lifelink-355bc"
Write-Host "FIREBASE_PRIVATE_KEY=(see server/.env for the key)"
Write-Host "FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@lifelink-355bc.iam.gserviceaccount.com"
Write-Host "JWT_SECRET=(generate a random 32+ character string)"
Write-Host "NODE_ENV=production"
Write-Host ""
Read-Host "Press Enter once environment variables are set on Railway"

# Step 5: Vercel Configuration
Write-Host ""
Write-Host "📝 Step 5: Vercel Configuration" -ForegroundColor Yellow
Write-Host "==============================="
Write-Host ""
Write-Host "On Vercel Dashboard:"
Write-Host "1. Settings > Environment Variables"
Write-Host "2. Add:"
Write-Host ""
Write-Host "REACT_APP_API_BASE_URL=$RAILWAY_DOMAIN/api"
Write-Host "REACT_APP_FIREBASE_API_KEY=(Firebase API Key)"
Write-Host "REACT_APP_FIREBASE_AUTH_DOMAIN=lifelink-355bc.firebaseapp.com"
Write-Host "REACT_APP_FIREBASE_PROJECT_ID=lifelink-355bc"
Write-Host "REACT_APP_FIREBASE_STORAGE_BUCKET=lifelink-355bc.appspot.com"
Write-Host "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=(from Firebase config)"
Write-Host "REACT_APP_FIREBASE_APP_ID=(from Firebase config)"
Write-Host ""
$VERCEL_DOMAIN = Read-Host "Enter your Vercel domain (e.g., https://lifelink.vercel.app)"
$VERCEL_DOMAIN = $VERCEL_DOMAIN.TrimEnd('/')

# Step 6: Update Railway with Vercel domain
Write-Host ""
Write-Host "📝 Step 6: Update Railway CORS" -ForegroundColor Yellow
Write-Host "=============================="
Write-Host ""
Write-Host "Back on Railway Dashboard, update:"
Write-Host "FRONTEND_URL=$VERCEL_DOMAIN"
Write-Host ""
Read-Host "Press Enter once Railway CORS is updated"

# Testing
Write-Host ""
Write-Host "📝 Step 7: Testing Deployment" -ForegroundColor Yellow
Write-Host "============================="
Write-Host ""
Write-Host "✅ Health Check:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$RAILWAY_DOMAIN/health" -ErrorAction Stop
    Write-Host $response -ForegroundColor Green
} catch {
    Write-Host "⚠️  Check backend status in Railway dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Visit your live app:" -ForegroundColor Green
Write-Host "   👉 https://$VERCEL_DOMAIN"
Write-Host ""
Write-Host "✅ Quick test steps:" -ForegroundColor Green
Write-Host "   1. Try to load the login page"
Write-Host "   2. Test user authentication"
Write-Host "   3. Check that API calls reach the backend"
Write-Host "   4. Test blood request flow"
Write-Host ""

# Summary
Write-Host ""
Write-Host "🎉 Deployment Summary" -ForegroundColor Cyan
Write-Host "===================="
Write-Host "Backend (Railway):  $RAILWAY_DOMAIN"
Write-Host "Frontend (Vercel):  $VERCEL_DOMAIN"
Write-Host ""
Write-Host "📚 Check these files for more info:" -ForegroundColor Yellow
Write-Host "   - DEPLOYMENT_GUIDE.md (detailed troubleshooting)"
Write-Host "   - DEPLOYMENT_CHECKLIST.md (full verification)"
Write-Host ""

