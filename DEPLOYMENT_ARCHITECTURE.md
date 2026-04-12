# Vercel & Railway Deployment Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  (main, develop branches with auto-deploy enabled)           │
└────────────┬────────────────────────────┬────────────────────┘
             │                            │
             │ Automatic Deployment       │ Automatic Deployment
             │ on Push (CI/CD)            │ on Push (CI/CD)
             │                            │
    ┌────────▼──────────┐        ┌────────▼──────────┐
    │  VERCEL Frontend   │        │  RAILWAY Backend   │
    │                    │        │                    │
    │  ✓ Auto-scaling    │        │  ✓ Auto-scaling    │
    │  ✓ CDN + Caching   │        │  ✓ Container       │
    │  ✓ SSL Auto        │        │  ✓ Env Vars        │
    │  ✓ Preview URLs    │        │  ✓ Auto Restarts   │
    │                    │        │                    │
    │ React (Port 3000)  │        │ Node.js (Port 3000)│
    │ https://lifelink   │        │ https://lifelink   │
    │ .vercel.app        │        │ -backend.railway.app
    └────────┬───────────┘        └────────┬───────────┘
             │                            │
             │ API Calls                  │ Query/Update
             │                            │
             └────────┬────────────────────┘
                      │
                      │
            ┌─────────▼──────────┐
            │  Firebase           │
            │  (Firestore + Auth) │
            │                     │
            │  ✓ Real-time DB     │
            │  ✓ Cloud Storage    │
            │  ✓ Authentication   │
            └─────────────────────┘
```

## Deployment Flow

```
1. Developer pushes to GitHub
   ↓
2. GitHub Actions CI Runs
   - Tests
   - Linting
   - Build Verification
   ↓
3a. Vercel Auto-Deploy        3b. Railway Auto-Deploy
    - Builds React App             - Builds Node.js Server
    - Deploys to CDN               - Deploys to Container
    - Updates DNS                  - Updates Environment
    ↓                              ↓
4. Production Live
   ↓
5. GitHub Actions Post-Deploy
   - Health Checks
   - Notifications
   - Monitoring
```

## Environment Configuration

### Frontend (Vercel)

```
Branch: main/develop
Build Command: npm run build
Output: client/build
Env Vars: Firebase config + API URL
Auto-Deploy: ✅ Enabled
Deployments: Automatic on push
```

### Backend (Railway)

```
Branch: main/develop
Build: cd server && npm install
Start: cd server && node server.js
Env Vars: Firebase credentials + JWT
Auto-Deploy: ✅ Enabled
Deployments: Automatic on push
```

## Key Features

✅ **Continuous Integration**

- Automated tests on every push
- Code quality checks (linting)
- Build verification

✅ **Continuous Deployment**

- Automatic deploys to Vercel (Frontend)
- Automatic deploys to Railway (Backend)
- No manual deployment steps needed

✅ **Environment Management**

- Separate variables for main (production) and develop (staging)
- Secure credential storage in platform dashboards
- Zero secrets in Git

✅ **Monitoring & Logs**

- Vercel Analytics Dashboard
- Railway Logs and Metrics
- GitHub Deployment Status

✅ **Rollback & Recovery**

- Vercel: One-click rollback to previous deployment
- Railway: Deployment history with instant rollback
- GitHub: Track which commit caused issues
