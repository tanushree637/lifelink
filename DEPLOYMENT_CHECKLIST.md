# LifeLink Deployment Checklist

## Pre-Deployment
- [ ] Code is committed and pushed to GitHub
- [ ] All sensitive data is in `.env` files (not in code)
- [ ] `client/.env.example` and `server/.env.example` are up-to-date
- [ ] Firebase project is set up and credentials are ready
- [ ] Have Railway account created
- [ ] Have Vercel account created

## Railway Backend Deployment

### Create Railway Project
- [ ] Go to https://railway.app
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Select repository and branch to deploy

### Configure Environment Variables
- [ ] Add `FIREBASE_PROJECT_ID`
- [ ] Add `FIREBASE_PRIVATE_KEY` (use literal `\n` in the string)
- [ ] Add `FIREBASE_CLIENT_EMAIL`
- [ ] Add `JWT_SECRET` (generate a strong random string)
- [ ] Add `NODE_ENV=production`
- [ ] Add `FRONTEND_URL=https://[your-vercel-domain].vercel.app`

### Configure Build/Start
- [ ] Build Command: `cd server && npm install`
- [ ] Start Command: `cd server && npm start`
- [ ] Check deployment status in Railway dashboard
- [ ] Copy the Railway domain URL (e.g., `https://lifelink-prod.railway.app`)

## Vercel Frontend Deployment

### Create Vercel Project
- [ ] Go to https://vercel.com
- [ ] Import project from GitHub
- [ ] Select repository

### Configure Build Settings
- [ ] Set root directory to `client`
- [ ] Framework: React
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`

### Add Environment Variables
- [ ] Add `REACT_APP_API_BASE_URL=[Railway URL]/api`
- [ ] Add all Firebase configuration variables
- [ ] Deploy and verify

## Post-Deployment Testing

### Test Backend
- [ ] Health check: `GET [Railway URL]/health`
- [ ] Test auth endpoints: `POST [Railway URL]/api/auth/login`
- [ ] Check CORS headers are correct

### Test Frontend
- [ ] Home page loads
- [ ] Can log in with existing user
- [ ] Can register new user
- [ ] Blood request flow works
- [ ] Geocoding/maps display correctly
- [ ] Firebase realtime updates working

### Test Integration
- [ ] Frontend API calls reach backend successfully
- [ ] Authentication tokens work across requests
- [ ] Admin dashboard displays data
- [ ] Notifications/updates work in real-time

## Production Monitoring
- [ ] Set up Railway error logging
- [ ] Set up Vercel analytics
- [ ] Monitor Firebase quota usage
- [ ] Check both app performance dashboards

## Emergency
- [ ] Known how to rollback on Railway
- [ ] Know how to hotfix and redeploy
- [ ] Have backup Firebase credentials stored securely

---

## URLs After Deployment
- **Backend API**: https://[railway-domain].railway.app/api
- **Frontend App**: https://[vercel-domain].vercel.app
- **Health Check**: https://[railway-domain].railway.app/health

---

## Quick Redeployment
If you need to redeploy after code changes:
1. Push changes to GitHub
2. Railway auto-deploys from main branch
3. Vercel auto-deploys from main branch (if using automatic deployments)
4. Verify changes in staging URLs first if available
