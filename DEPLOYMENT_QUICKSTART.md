# Quick Deployment Start

## 🚀 Your LifeLink app is ready for deployment!

I've configured your application for deployment on **Vercel (Frontend) + Railway (Backend)**.

### What's been prepared:

✅ **Frontend (Client)**
- `client/vercel.json` - Vercel configuration
- `client/.env.example` - Environment variables template
- `client/src/utils/api.js` - Updated to use environment variables

✅ **Backend (Server)**
- `server/Procfile` - Railway process configuration
- `server/.env.example` - Environment variables template
- `server/server.js` - Updated CORS for production
- `railway.json` - Railway deployment configuration

✅ **Documentation**
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist

---

## 🎯 Next Steps (in order):

### 1. **Setup GitHub** (if not done)
```bash
git add .
git commit -m "feat: prepare for production deployment"
git push
```

### 2. **Deploy Backend (Railway)**
1. Go to https://railway.app
2. Sign up / Log in
3. Create new project → Connect GitHub
4. Select your repository
5. Add environment variables (copy from `server/.env.example`):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` 
   - `FIREBASE_CLIENT_EMAIL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-domain.vercel.app` (after step 3)

⚠️ **Important**: For `FIREBASE_PRIVATE_KEY`, Railway will show an editor - paste your key there with literal `\n` characters.

6. Railway auto-deploys → Save your Railway domain (e.g., `https://lifelink-prod.railway.app`)

### 3. **Deploy Frontend (Vercel)**
1. Go to https://vercel.com
2. Sign up / Log in
3. Click "Import Project" → Select your GitHub repo
4. Framework: **React**, Root Directory: **client**
5. Add environment variables:
   - `REACT_APP_API_BASE_URL=https://[railway-domain]/api`
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - Other Firebase variables...

6. Deploy → Get your Vercel domain (e.g., `https://lifelink.vercel.app`)

### 4. **Update Backend CORS**
Go back to Railway:
- Update `FRONTEND_URL=https://your-new-vercel-domain.vercel.app`
- Railway auto-redeploys with updated CORS

### 5. **Test Your App**
- Visit: `https://your-app.vercel.app`
- Test login, blood request flow, admin dashboard
- Check browser console & Railway logs for errors

---

## 📋 For Reference

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Local Dev**: `npm start` in client/, `npm run dev` in server/

---

## ⚠️ Important Reminders

- **Never commit** `.env` files containing real credentials
- **Use environment variables** for all sensitive data
- **Test thoroughly** before marking as production-ready
- **Monitor logs** after deployment to catch issues early

---

**Need help?** Check the `DEPLOYMENT_GUIDE.md` for detailed troubleshooting!
