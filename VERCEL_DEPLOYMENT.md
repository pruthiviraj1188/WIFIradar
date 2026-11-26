# Vercel Deployment Guide for WiFi-Radar

## Overview
This WiFi-Radar system has two components:
- **Frontend**: React + Vite (can be deployed to Vercel)
- **Backend**: FastAPI + Python (requires separate hosting)

## Deployment Architecture

### Recommended Approach
Deploy frontend and backend separately:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Frontend (Vercel)                                      │
│  https://wifi-radar.vercel.app                          │
│                                                         │
│  ↓ API Calls                                            │
│                                                         │
│  Backend (Railway/Render/AWS)                           │
│  https://wifi-radar-api.railway.app                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Prepare Frontend for Production

### 1.1 Update Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_WS_URL=wss://your-backend-url.railway.app
```

### 1.2 Update API Configuration

The frontend will use environment variables for API endpoints instead of localhost.

## Step 2: Deploy Frontend to Vercel

### Method A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your username/org
# - Link to existing project? No
# - Project name? wifi-radar
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

### Method B: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/
2. Click "Add New Project"
3. Import your GitHub repository: `https://github.com/pruthiviraj1188/WIFIradar`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

5. Add Environment Variables:
   ```
   VITE_API_URL = https://your-backend-url.com
   VITE_WS_URL = wss://your-backend-url.com
   ```

6. Click "Deploy"

## Step 3: Deploy Backend (Choose One)

### Option A: Railway (Recommended for Python)

1. Go to https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your WiFi-Radar repository
4. Railway will auto-detect Python
5. Configure:
   - **Root Directory**: Leave blank
   - **Start Command**: `python start_backend_8080.py`
   - Add environment variables if needed

6. Railway will provide a URL like: `https://wifiradar-production-xxxx.up.railway.app`

### Option B: Render

1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: wifi-radar-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r config/requirements.txt`
   - **Start Command**: `python start_backend_8080.py`

### Option C: AWS/Azure/GCP

Deploy backend as a container or VM instance.

## Step 4: Update Frontend with Backend URL

After backend is deployed, update frontend environment:

```bash
# In Vercel dashboard, go to:
# Project Settings → Environment Variables

# Update:
VITE_API_URL = https://your-actual-backend-url.railway.app
VITE_WS_URL = wss://your-actual-backend-url.railway.app

# Then redeploy
vercel --prod
```

## Step 5: Configure CORS in Backend

Update `backend/app/main.py` to allow your Vercel domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://wifi-radar.vercel.app",  # Add your Vercel domain
        "https://*.vercel.app"  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Quick Deploy Commands

### Frontend Only (Vercel)
```bash
cd /Users/pruthiviraj/Downloads/wifi-master

# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Full Stack (Alternative: Vercel for frontend, Railway for backend)

```bash
# 1. Deploy backend to Railway first
railway login
railway init
railway up

# Note the backend URL provided by Railway

# 2. Update frontend .env.production
echo "VITE_API_URL=https://your-railway-url.railway.app" > frontend/.env.production

# 3. Deploy frontend to Vercel
vercel --prod
```

## Important Notes

### Database
- Current setup uses SQLite (`wifi_radar.db`)
- For production, consider:
  - PostgreSQL (Supabase, Railway, or Neon)
  - MongoDB (MongoDB Atlas)
  - Update `backend/app/database.py` accordingly

### WebSockets
- Ensure backend hosting supports WebSocket connections
- Railway and Render support WebSockets
- Update `VITE_WS_URL` to use `wss://` (secure WebSocket)

### Environment Variables Summary

**Frontend** (Vercel):
```env
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

**Backend** (Railway/Render):
```env
DATABASE_URL=postgresql://... (if using PostgreSQL)
CORS_ORIGINS=https://wifi-radar.vercel.app
PORT=8080
```

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify VITE_API_URL is correct
- Check browser console for errors

### WebSocket connection fails
- Ensure backend supports WebSocket
- Use `wss://` protocol for production
- Check firewall/security group settings

### Build fails on Vercel
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify build command is correct

## Post-Deployment

After successful deployment:

1. Test the live site: `https://wifi-radar.vercel.app`
2. Verify API connectivity
3. Test WebSocket connection in Live Monitoring page
4. Check all features work correctly

## Monitoring

- **Vercel**: Analytics available in dashboard
- **Backend**: Add monitoring with services like:
  - Sentry (error tracking)
  - LogRocket (session replay)
  - DataDog (infrastructure monitoring)

## Costs

- **Vercel**: Free tier for personal projects (100GB bandwidth/month)
- **Railway**: $5/month minimum for backend
- **Render**: Free tier available (spins down after inactivity)

## Alternative: All-in-One Vercel Deployment (Limited)

If you want to try deploying everything to Vercel using serverless functions:

⚠️ **Warning**: This approach has limitations:
- No WebSocket support in serverless functions
- Cold starts for API calls
- Limited execution time (10s max)

Not recommended for this real-time monitoring application.

---

**Need help?** Check these resources:
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs
