#!/usr/bin/env bash

# LifeLink Production Deployment Script
# This script guides you through deploying LifeLink to Railway + Vercel

set -e

echo "🚀 LifeLink Deployment Script"
echo "=============================="
echo ""

# Step 1: Verify git status
echo "📝 Step 1: Checking git status..."
git status

echo ""
echo "✅ Ensure all changes are committed before proceeding!"
echo ""
read -p "Press Enter to continue..."

# Step 2: Create accounts
echo ""
echo "📝 Step 2: Creating accounts (manual steps)"
echo "=========================================="
echo ""
echo "1️⃣  Go to https://railway.app"
echo "   - Sign up with GitHub"
echo "   - Create a new project"
echo "   - Connect your GitHub repository"
echo ""
echo "2️⃣  Go to https://vercel.com"
echo "   - Sign up with GitHub"
echo "   - Import your project"
echo "   - Root directory: 'client'"
echo ""
read -p "Press Enter once both accounts are created and repos connected..."

# Step 3: Get Railway domain
echo ""
echo "📝 Step 3: Railway Configuration"
echo "================================"
echo ""
echo "On Railway Dashboard:"
echo "1. Go to your project settings"
echo "2. Set BUILD COMMAND: cd server && npm install"
echo "3. Set START COMMAND: cd server && node server.js"
echo ""
read -p "Enter your Railway domain (e.g., https://lifelink-prod.railway.app): " RAILWAY_DOMAIN

# Remove trailing slash if present
RAILWAY_DOMAIN="${RAILWAY_DOMAIN%/}"

echo ""
echo "📝 Step 4: Add Railway Environment Variables"
echo "============================================="
echo ""
echo "In Railway Dashboard > Project > Variables, add:"
echo ""
echo "FIREBASE_PROJECT_ID=lifelink-355bc"
echo "FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDaUlZ271dgQM7B\nGs/AZ9F67GqM2aIQrxYZSHiebZWNcJn6cehEmkO6CjvckGU2G4+cNRoF8GK3eo7t\n4R53JjGVCiy0BagqI0Mf2tIXXn5bC8ZjzwR7wyUpr60ESXdhe3MqdvocORJP5XOw\nql7rutFIfdWpMiIRn7UD1gguSArAViHhJbLPsL76aaPWVvR+gq0sfA0XmsujE4lv\nQpfZBcbuHXLu3whIJzHLsaeiteUDwsVSYn6XPQ26v4n0uKATdYbwnzgqhMXMnhjo\nj9yRxRfoqScHbPmMon8QfVOFhpZ62zLb4ACTiL/AFJ4aRhjNfJKQFJvxm4JWXUSm\n9nS8oFuTAgMBAAECggEAFzY1iDFROQ7FjLAPkjWCMaS3fWCELmxBwrq69vPQDeOA\nvikPLgANdFcIifOg4dGoq/h/WvigXkE9t1qTH82OlvnSdT9muOLajPqkZ09TdYBO\nfafHImtwj4/kgCCu0c1Lb3ff2/v7ZPA7I8zcCQm/R4r4Gk7rYrP4Db+F9iRltDt3\nLFzT0guk+n1FHOI+jKA4j+UbAx/Gl90uy6Po8PwFElkMXWF56sIqyTeMXY2bfHDa\n2dKekGZbT2D3VxzB25nX4hd5ZOX8uCCeisxTJcvEONVTmXuwmX5DiyfVUB86fPH7\n5Ngp8zejRjdNbEMbyQ4xym7TWHQcPiQ0//OcGcoJYQKBgQDyW39oMywm7E0Maajr\n619UVxPvUfsSHWmb/mbUV2VGPRmqK4waofr+dN1wHej0bwQzdZs93fq2pN6MztCW\nSSygjeocIRTuOab1RGgNdH/80lWCViOys0ZRv5crbxch6hK3TeI+mj4ZFo95lsdp\nfFGCyj8H/ij3CPqsZfYNRd8Q4QKBgQDmnHir9AjW8xSBQJQRFCqCtQa4pfF4TAIX\nlqNlH9/zeQ+jLJcy+0pmPz9wtqbmYLIH11LQmpvCHQoILGMxU/Fwui9k1ILCTaq8\n3Qc3X2SwhLeZAP1eS3yIFfW/c/l8BHeMvK4Lhqo2dnqa9j1aT/y1Cbz+nbWknPqH\nZYRyXHAW8wKBgQCMSrzg46ZuTaF4Sv2Wu6RuXQ3UHl+5J7+Hpmd+Ca09UIc3w4eR\nryxs+ddpXFcKj+0doLmhwYqtCZkuZ1XFeUxVEHFxoRDNqh/koJmfGE4yWstW7Ggz\nvKU7Ey393YvFfQsigvoxhPXnbfDV0JtUi7tfe5WrGcw63D7HZypcmpK64QKBgQDC\nzrdZeuLkwZ82uJjb/I8Ur1uoK/ZZysuRpZ0N1elXQZMmIorvdDwbN56d1o4S2uhJ\nm2nH8nNVfTZ2RRjeGK1CruVOZf63qOhsdsKb0ie6vcJiq+Vc/KOMShC41H2SeCuN\nZe4Yqn+rVlaoBQ869YriXAGdjRheoIU6T1WdTd0aZQKBgQDbtfnk5rd42FrdDy+g\nVC5xvAHnQFa9M/+qlRvp+C8H+nsQDvNCxIW2IhmAAYpUuOrzsBdm9u7mnZsmsk7w\naTbuA0pS5HEiNNjnQqDX7KeC+U9ligOsRw1Dg1lvSYCdGN+M2DKiP4ztUxcqHCZg\n75xFruu17dfvhlNl8l/9rjsYUw==\n-----END PRIVATE KEY-----\n"
echo "FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@lifelink-355bc.iam.gserviceaccount.com"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "NODE_ENV=production"
echo ""
read -p "Press Enter once environment variables are set on Railway..."

# Get Vercel domain
echo ""
echo "📝 Step 5: Vercel Configuration"
echo "==============================="
echo ""
echo "On Vercel Dashboard:"
echo "1. Settings > Environment Variables"
echo "2. Add:"
echo ""
echo "REACT_APP_API_BASE_URL=$RAILWAY_DOMAIN/api"
echo "REACT_APP_FIREBASE_API_KEY=<your-export-from-firebase-config>"
echo "REACT_APP_FIREBASE_AUTH_DOMAIN=lifelink-355bc.firebaseapp.com"
echo "REACT_APP_FIREBASE_PROJECT_ID=lifelink-355bc"
echo "REACT_APP_FIREBASE_STORAGE_BUCKET=lifelink-355bc.appspot.com"
echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<from-firebase-config>"
echo "REACT_APP_FIREBASE_APP_ID=<from-firebase-config>"
echo ""
read -p "Enter your Vercel domain (e.g., https://lifelink.vercel.app): " VERCEL_DOMAIN

# Remove trailing slash if present
VERCEL_DOMAIN="${VERCEL_DOMAIN%/}"

# Update Railway with Vercel domain
echo ""
echo "📝 Step 6: Update Railway CORS"
echo "=============================="
echo ""
echo "Back on Railway Dashboard, update:"
echo "FRONTEND_URL=$VERCEL_DOMAIN"
echo ""
read -p "Press Enter once Railway CORS is updated..."

# Testing
echo ""
echo "📝 Step 7: Testing Deployment"
echo "============================="
echo ""
echo "✅ Health Check:"
curl -s "$RAILWAY_DOMAIN/health" | jq . || echo "⚠️  Check backend status in Railway dashboard"

echo ""
echo "✅ Visit your live app:"
echo "   👉 https://$VERCEL_DOMAIN"
echo ""
echo "✅ Quick test steps:"
echo "   1. Try to load the login page"
echo "   2. Test user authentication"
echo "   3. Check that API calls reach the backend"
echo "   4. Test blood request flow"
echo ""

# Summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Backend (Railway):  $RAILWAY_DOMAIN"
echo "Frontend (Vercel):  $VERCEL_DOMAIN"
echo ""
echo "📚 Check these files for more info:"
echo "   - DEPLOYMENT_GUIDE.md (detailed troubleshooting)"
echo "   - DEPLOYMENT_CHECKLIST.md (full verification)"
echo ""

