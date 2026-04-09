# LifeLink Deployment Guide

## Deployment Architecture

- **Frontend**: Vercel (React)
- **Backend**: Railway (Node.js/Express)
- **Database**: Firebase Firestore (unchanged)

## Prerequisites

Before deploying, ensure you have:

1. GitHub account with your repository pushed
2. Vercel account (https://vercel.com)
3. Railway account (https://railway.app)
4. Firebase project set up with credentials

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account & Project

1. Go to https://railway.app and sign up
2. Create a new project
3. Connect your GitHub repository

### 1.2 Configure Environment Variables on Railway

In your Railway dashboard:

1. Click on your project → Settings
2. Go to the **Variables** section
3. Add the following environment variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key-with-literal-\n
FIREBASE_CLIENT_EMAIL=your-client-email
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app-name.vercel.app
```

### 1.3 Configure Build & Start Commands

1. In Railway dashboard, go to **Deployments**
2. Click **Settings**
3. Set:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

### 1.4 Deploy

- Railway automatically deploys when you push to your GitHub repository
- Get your Railway domain from the deployment URL (e.g., `https://lifelink-backend.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to https://vercel.com and sign in
2. Click "Import Project"
3. Select your GitHub repository

### 2.2 Configure Build Settings

1. **Root Directory**: Select `client`
2. **Framework**: React
3. **Build Command**: `npm run build`
4. **Install Command**: `npm install`
5. **Output Directory**: `build`

### 2.3 Add Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```
REACT_APP_API_BASE_URL=https://your-railway-domain.railway.app/api
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 2.4 Deploy

- Click **Deploy**
- Vercel will automatically redeploy on GitHub pushes

---

## Step 3: Update CORS on Backend

Once your Vercel domain is ready, update Railway environment variables:

```
FRONTEND_URL=https://your-app-name.vercel.app
```

This is already configured in `server/server.js` to dynamically use this variable.

---

## Step 4: Update Client API Configuration

Ensure your client is using the environment variable. Check [client/src/utils/api.js](../client/src/utils/api.js):

```javascript
const baseURL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
```

---

## Troubleshooting

### Backend Issues

- **Port conflict**: Railway automatically assigns a port; don't hardcode 5000
- **Firebase connection**: Verify private key formatting (should have literal `\n` not newlines)
- **CORS errors**: Ensure `FRONTEND_URL` in Railway matches your Vercel domain

### Frontend Issues

- **API not connecting**: Check that `REACT_APP_API_BASE_URL` is correct in Vercel
- **Firebase auth failing**: Verify Firebase SDK configuration in environment variables
- **Build errors**: Ensure all dependencies are in `client/package.json`

### Firebase Issues

- Use Firebase Admin SDK for backend (already in `server/package.json`)
- Ensure service account JSON is safely stored as environment variables, not committed to repo

---

## Post-Deployment Checklist

- [ ] Backend deployed on Railway with all environment variables
- [ ] Frontend deployed on Vercel with all environment variables
- [ ] CORS configured correctly in Railway
- [ ] Test user authentication flow on live app
- [ ] Test blood donor matching request flow
- [ ] Monitor Railway/Vercel logs for any errors
- [ ] Set up monitoring and alerts on Railway dashboard

---

## Useful Links

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup

---

## Local Development

To test locally before deployment:

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm start
```
