# Deploy WiFi-Radar to Vercel - Complete Guide

## ✅ Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Repository**: Your code is already at https://github.com/pruthiviraj1188/WIFIradar
3. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

## 🚀 Quick Deploy (3 Steps)

### Method 1: Using Vercel Dashboard (Easiest)

#### Step 1: Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Enter: `https://github.com/pruthiviraj1188/WIFIradar`
4. Click "Import"

#### Step 2: Configure Build Settings
Vercel will auto-detect, but verify these settings:

```
Framework Preset: Other
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/dist
Install Command: pip install -r requirements.txt && cd frontend && npm install
Root Directory: ./
```

#### Step 3: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for deployment
3. Your site will be live at: `https://wifiradar-<random>.vercel.app`

---

### Method 2: Using Vercel CLI (Faster)

```bash
# 1. Navigate to project directory
cd /Users/pruthiviraj/Downloads/wifi-master

# 2. Login to Vercel
vercel login

# 3. Deploy (follow prompts)
vercel

# Answer prompts:
# - Set up and deploy? Yes
# - Which scope? [Your username]
# - Link to existing project? No
# - Project name? wifi-radar
# - Directory? ./ (press Enter)
# - Override settings? No

# 4. For production deployment
vercel --prod
```

Your site will be live immediately!

---

## 📋 Configuration Files Created

The following files have been created for Vercel deployment:

### ✅ `/vercel.json`
- Configures build process
- Routes API calls to serverless functions
- Serves frontend static files

### ✅ `/requirements.txt`
- Python dependencies for backend API
- Includes FastAPI, Mangum (Lambda adapter)
- Scientific computing libraries

### ✅ `/api/index.py`
- Serverless API backend
- REST endpoints for activities, incidents, contacts
- Polling endpoint for CSI data (WebSocket alternative)

### ✅ `/.vercelignore`
- Excludes unnecessary files from deployment
- Reduces deployment size and time

### ✅ `/frontend/.env.production`
- Production environment variables
- Sets API URL to `/api` (same domain)

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Vercel Deployment                                  │
│  https://wifi-radar.vercel.app                      │
│                                                     │
│  ├── Frontend (Static)                             │
│  │   └── React + Vite                              │
│  │       └── /frontend/dist/                       │
│  │                                                  │
│  └── Backend (Serverless Functions)                │
│      └── Python FastAPI                            │
│          └── /api/index.py                         │
│              ├── GET  /api/health                  │
│              ├── GET  /api/activities              │
│              ├── GET  /api/incidents               │
│              ├── GET  /api/esp32/status            │
│              ├── GET  /api/csi/poll/{room_id}      │
│              └── POST /api/esp32/contacts          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### WebSocket Limitations
- **Vercel serverless functions don't support WebSockets**
- The app automatically uses **polling** in production
- Polling endpoint: `/api/csi/poll/{room_id}`
- Updates every 500ms (similar to WebSocket experience)

### Database
- Currently uses **in-memory storage** (resets on each request)
- For production, integrate:
  - **Vercel Postgres** (recommended)
  - **Supabase** (free tier available)
  - **PlanetScale** (MySQL)
  - **MongoDB Atlas**

### Cold Starts
- First API request may take 1-2 seconds (cold start)
- Subsequent requests are fast (<100ms)
- This is normal for serverless functions

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)
```bash
# Add custom domain via CLI
vercel domains add yourdomain.com

# Or in Vercel Dashboard:
# Project Settings → Domains → Add Domain
```

### 2. Environment Variables
Add via Vercel Dashboard:
- Go to: Project Settings → Environment Variables
- Add variables as needed

### 3. Enable Analytics
- Vercel Dashboard → Your Project → Analytics tab
- View traffic, performance, and usage statistics

---

## 🧪 Testing Deployment

After deployment, test these URLs:

### Frontend
```bash
# Homepage
https://your-deployment.vercel.app

# Dashboard
https://your-deployment.vercel.app/

# Live Monitoring
https://your-deployment.vercel.app/live

# Analytics
https://your-deployment.vercel.app/analytics
```

### Backend API
```bash
# Health check
curl https://your-deployment.vercel.app/api/health

# ESP32 status
curl https://your-deployment.vercel.app/api/esp32/status

# Poll CSI data
curl https://your-deployment.vercel.app/api/csi/poll/1

# Activities
curl https://your-deployment.vercel.app/api/activities
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel Dashboard
# Common issues:
# 1. Missing dependencies → Check requirements.txt and package.json
# 2. Build timeout → Reduce dependencies or split build
# 3. Python version → Vercel uses Python 3.9 by default
```

### API Returns 500
```bash
# Check Function Logs in Vercel Dashboard
# Common issues:
# 1. Missing import → Check api/index.py imports
# 2. Cold start timeout → Optimize function code
# 3. Memory limit → Reduce memory usage
```

### Frontend Can't Connect to API
```bash
# Check:
# 1. CORS settings in api/index.py
# 2. API routes in vercel.json
# 3. Browser console for errors
# 4. Network tab shows /api/* requests
```

---

## 🔄 Updating Deployment

### Auto-Deploy from GitHub
1. Connect your GitHub repo in Vercel Dashboard
2. Every `git push` automatically deploys
3. Preview deployments for each branch/PR

### Manual Redeploy
```bash
# From project directory
vercel --prod
```

---

## 💰 Pricing

**Vercel Free Tier** (Hobby Plan):
- ✅ 100GB bandwidth/month
- ✅ 100GB-hrs serverless function execution
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Perfect for personal projects

**Upgrade** only needed for:
- High traffic (>100GB/month)
- Team collaboration features
- Priority support

---

## 📊 Monitoring

### View Logs
```bash
# Real-time logs via CLI
vercel logs

# Or in Vercel Dashboard:
# Your Project → Deployments → [Latest] → Function Logs
```

### Analytics
- Vercel Dashboard → Analytics
- View page views, top pages, visitors
- Performance metrics (Core Web Vitals)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Build completed successfully
- [ ] Frontend accessible via URL
- [ ] API health check passes
- [ ] Dashboard loads correctly
- [ ] Live monitoring works
- [ ] CSI data polling functional
- [ ] Emergency contacts can be added
- [ ] Analytics page displays data

---

## 🎉 Success!

Your WiFi-Radar system is now deployed to Vercel!

**Next Steps:**
1. Share the URL with users
2. Set up custom domain (optional)
3. Connect production database
4. Enable Vercel Analytics
5. Monitor performance and usage

**Your Deployment URL:**
```
https://wifi-radar-<unique-id>.vercel.app
```

(Find exact URL in Vercel Dashboard or terminal output)

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel CLI**: https://vercel.com/docs/cli
- **Vercel Support**: https://vercel.com/support
- **GitHub Repo**: https://github.com/pruthiviraj1188/WIFIradar

---

## 🆘 Need Help?

Run into issues? Check:
1. Vercel deployment logs
2. Browser console errors
3. Network tab for failed requests
4. GitHub Issues on your repo

---

**Ready to deploy? Run:**
```bash
vercel
```

That's it! 🚀
