# LifeLink Deployment Guide - Vercel + Render

## Deployment Architecture
- **Frontend**: Vercel (React)
- **Backend**: Render (Node.js/Express)
- **Database**: Firebase Firestore (unchanged)

---

## STEP 1: Deploy Backend on Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Click **"Sign up"** → Choose **"Sign up with GitHub"**
3. Authorize Render to access your GitHub account

### 1.2 Create Web Service
1. Click **"New +"** → Select **"Web Service"**
2. Select your GitHub repository: `lifelink`
3. Click **"Connect"**

### 1.3 Configure Service
Fill in the following settings:

**Name**: `lifelink-backend` (or your choice)

**Environment**: `Node`

**Region**: Choose closest to your users (e.g., `Oregon` or `Frankfurt`)

**Branch**: `main`

**Root Directory**: `server`

**Build Command**: 
```
npm install
```

**Start Command**: 
```
node server.js
```

**Plan**: Free tier is fine for testing, upgrade as needed

### 1.4 Add Environment Variables
Before deploying, add your environment variables:

Click **"Advanced"** at the bottom, then **"Add Environment Variable"**

Add each variable:
```
FIREBASE_PROJECT_ID=lifelink-355bc

FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDaUlZ271dgQM7B\nGs/AZ9F67GqM2aIQrxYZSHiebZWNcJn6cehEmkO6CjvckGU2G4+cNRoF8GK3eo7t\n4R53JjGVCiy0BagqI0Mf2tIXXn5bC8ZjzwR7wyUpr60ESXdhe3MqdvocORJP5XOw\nql7rutFIfdWpMiIRn7UD1gguSArAViHhJbLPsL76aaPWVvR+gq0sfA0XmsujE4lv\nQpfZBcbuHXLu3whIJzHLsaeiteUDwsVSYn6XPQ26v4n0uKATdYbwnzgqhMXMnhjo\nj9yRxRfoqScHbPmMon8QfVOFhpZ62zLb4ACTiL/AFJ4aRhjNfJKQFJvxm4JWXUSm\n9nS8oFuTAgMBAAECggEAFzY1iDFROQ7FjLAPkjWCMaS3fWCELmxBwrq69vPQDeOA\nvikPLgANdFcIifOg4dGoq/h/WvigXkE9t1qTH82OlvnSdT9muOLajPqkZ09TdYBO\nfafHImtwj4/kgCCu0c1Lb3ff2/v7ZPA7I8zcCQm/R4r4Gk7rYrP4Db+F9iRltDt3\nLFzT0guk+n1FHOI+jKA4j+UbAx/Gl90uy6Po8PwFElkMXWF56sIqyTeMXY2bfHDa\n2dKekGZbT2D3VxzB25nX4hd5ZOX8uCCeisxTJcvEONVTmXuwmX5DiyfVUB86fPH7\n5Ngp8zejRjdNbEMbyQ4xym7TWHQcPiQ0//OcGcoJYQKBgQDyW39oMywm7E0Maajr\n619UVxPvUfsSHWmb/mbUV2VGPRmqK4waofr+dN1wHej0bwQzdZs93fq2pN6MztCW\nSSygjeocIRTuOab1RGgNdH/80lWCViOys0ZRv5crbxch6hK3TeI+mj4ZFo95lsdp\nfFGCyj8H/ij3CPqsZfYNRd8Q4QKBgQDmnHir9AjW8xSBQJQRFCqCtQa4pfF4TAIX\nlqNlH9/zeQ+jLJcy+0pmPz9wtqbmYLIH11LQmpvCHQoILGMxU/Fwui9k1ILCTaq8\n3Qc3X2SwhLeZAP1eS3yIFfW/c/l8BHeMvK4Lhqo2dnqa9j1aT/y1Cbz+nbWknPqH\nZYRyXHAW8wKBgQCMSrzg46ZuTaF4Sv2Wu6RuXQ3UHl+5J7+Hpmd+Ca09UIc3w4eR\nryxs+ddpXFcKj+0doLmhwYqtCZkuZ1XFeUxVEHFxoRDNqh/koJmfGE4yWstW7Ggz\nvKU7Ey393YvFfQsigvoxhPXnbfDV0JtUi7tfe5WrGcw63D7HZypcmpK64QKBgQDC\nzrdZeuLkwZ82uJjb/I8Ur1uoK/ZZysuRpZ0N1elXQZMmIorvdDwbN56d1o4S2uhJ\nm2nH8nNVfTZ2RRjeGK1CruVOZf63qOhsdsKb0ie6vcJiq+Vc/KOMShC41H2SeCuN\nZe4Yqn+rVlaoBQ869YriXAGdjRheoIU6T1WdTd0aZQKBgQDbtfnk5rd42FrdDy+g\nVC5xvAHnQFa9M/+qlRvp+C8H+nsQDvNCxIW2IhmAAYpUuOrzsBdm9u7mnZsmsk7w\naTbuA0pS5HEiNNjnQqDX7KeC+U9ligOsRw1Dg1lvSYCdGN+M2DKiP4ztUxcqHCZg\n75xFruu17dfvhlNl8l/9rjsYUw==\n-----END PRIVATE KEY-----\n

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@lifelink-355bc.iam.gserviceaccount.com

JWT_SECRET=lifelink-secret-key-2026

NODE_ENV=production

PORT=10000
```

⚠️ **Important**: Render assigns a PORT automatically. The `PORT=10000` is a placeholder - Render will override this.

### 1.5 Deploy
Click **"Create Web Service"**

**Wait 2-5 minutes** for Render to build and deploy

Once live, you'll see a URL like: `https://lifelink-backend.onrender.com`

**Copy this URL** - you'll need it for Vercel!

---

## STEP 2: Deploy Frontend on Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"** → Choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your repository: `lifelink`
3. Click **"Import"**

### 2.3 Configure Project
- **Framework Preset**: React
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

### 2.4 Add Environment Variables
Before clicking **"Deploy"**, go to **"Environment Variables"**

Add these variables:

```
REACT_APP_API_BASE_URL=https://[YOUR-RENDER-URL]/api
REACT_APP_FIREBASE_API_KEY=[your-firebase-api-key]
REACT_APP_FIREBASE_AUTH_DOMAIN=lifelink-355bc.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=lifelink-355bc
REACT_APP_FIREBASE_STORAGE_BUCKET=lifelink-355bc.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=[your-sender-id]
REACT_APP_FIREBASE_APP_ID=[your-app-id]
```

⚠️ **Replace `[YOUR-RENDER-URL]`** with the URL from Step 1.5

### 2.5 Deploy
Click **"Deploy"**

**Wait 2-3 minutes** for Vercel to build

You'll get a URL like: `https://lifelink-production.vercel.app`

---

## STEP 3: Update Render CORS

Now that you have your Vercel domain:

1. Go back to **Render Dashboard**
2. Select your `lifelink-backend` service
3. Click **"Environment"**
4. Add/Update:
   ```
   FRONTEND_URL=https://[YOUR-VERCEL-URL]
   ```
5. Render will **auto-redeploy** with updated CORS

✅ **You're done!**

---

## Testing Your Live App

### Test Backend Health
```
curl https://[YOUR-RENDER-URL]/health
```

Should return:
```json
{"status":"LifeLink Server is running"}
```

### Test Frontend
1. Visit `https://[YOUR-VERCEL-URL]`
2. Try to log in
3. Create a blood request
4. Check browser console (F12) for API errors

### Common Issues

**"Cannot reach API"**
- Check `REACT_APP_API_BASE_URL` in Vercel
- Make sure Render backend is running (check Status in Render dashboard)

**"CORS error"**
- Verify `FRONTEND_URL` is set on Render
- Wait for Render to redeploy after updating

**Slow initial request**
- Free tier Render services spin down after 15 min of inactivity
- First request after inactivity takes ~1-2 min to wake up
- Upgrade to paid plan to keep service always on

---

## Useful Links

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
