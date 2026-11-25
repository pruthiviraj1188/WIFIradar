# Frontend Troubleshooting Guide

## ✅ Current Status

Your frontend is **running correctly** at http://localhost:3000

The Vite dev server is serving:
- ✅ HTML page loads
- ✅ React scripts load
- ✅ All components exist
- ✅ Tailwind CSS configured
- ✅ Backend connection configured

---

## 🔍 What You Should See

When you open **http://localhost:3000**, you should see:

### **1. The Dashboard Layout:**
- ✅ **Left Sidebar** (desktop) with:
  - WiFi-Radar logo/branding
  - Navigation menu (Overview, Live Telemetry, Incidents, Analytics, Settings)
  - Room selector dropdown
  - Connection status at bottom
  
- ✅ **Top Bar** (mobile) with:
  - Menu button
  - WiFi-Radar title
  - Connection status

- ✅ **Main Content Area** with:
  - System overview cards
  - Recent activities
  - Device status
  - Statistics

### **2. Styling:**
- Paper-colored background (#F6F5F1 - beige/cream)
- Clean, modern interface
- IBM Plex Sans font
- Signal indicators and status badges

---

## 🐛 Common Issues & Solutions

### **Issue 1: Blank White Page**

**Symptoms:**
- Page loads but shows nothing
- White or empty screen

**Solutions:**

1. **Check Browser Console (F12)**
   ```
   Open browser → Press F12 → Click "Console" tab
   Look for red error messages
   ```

2. **Common Errors & Fixes:**

   **Error: "Failed to fetch dynamically imported module"**
   - Solution: Hard refresh → `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

   **Error: "Cannot find module"**
   - Solution: Restart Vite server
   ```bash
   # Stop server (Ctrl+C), then:
   cd /Users/pruthiviraj/Downloads/wifi-master/frontend
   npm run dev
   ```

   **Error: Network/CORS errors**
   - Check backend is running: http://localhost:8080/health
   - Should return: `{"status":"healthy"}`

3. **Clear Browser Cache**
   ```
   Chrome/Edge: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   Select "Cached images and files" → Clear
   ```

4. **Try Incognito/Private Mode**
   ```
   This rules out browser extensions or cached data
   ```

---

### **Issue 2: Styling Missing (No Colors/Layout)**

**Symptoms:**
- Content appears but looks unstyled
- Plain HTML with no design

**Solutions:**

1. **Check Tailwind CSS is working:**
   - View page source (Cmd+U / Ctrl+U)
   - Should see `<style>` tags with Tailwind classes

2. **Restart Vite:**
   ```bash
   # In frontend terminal:
   Ctrl+C
   npm run dev
   ```

3. **Check PostCSS:**
   ```bash
   cd /Users/pruthiviraj/Downloads/wifi-master/frontend
   cat postcss.config.js
   ```

---

### **Issue 3: "Backend Offline" Message**

**Symptoms:**
- Dashboard loads but shows "Backend Offline" or "Paused"
- Status indicator is gray/yellow instead of green

**This is NORMAL if backend isn't running!**

**Solutions:**

1. **Check backend status:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Start backend if not running:**
   ```bash
   cd /Users/pruthiviraj/Downloads/wifi-master
   source venv/bin/activate
   python start_backend_8080.py
   ```

3. **Frontend will auto-detect backend:**
   - Green dot = Connected to backend
   - Yellow dot = Simulation mode (normal without backend)
   - Gray dot = Paused

**Note:** The app works in simulation mode without the backend!

---

### **Issue 4: JavaScript Errors**

**Check Console (F12) for:**

1. **Import errors:**
   - Usually means missing npm package
   - Solution: `cd frontend && npm install`

2. **Syntax errors:**
   - Check terminal for Vite errors
   - Look for file paths in error message

3. **API errors:**
   - These are normal if backend is off
   - App falls back to simulation mode

---

## 🧪 Quick Tests

### **Test 1: Check if Vite is running**
```bash
curl http://localhost:3000
```
Should return HTML with "WiFi-Radar" in title.

### **Test 2: Check if React is loading**
Open http://localhost:3000 and:
1. Right-click → "Inspect" (or F12)
2. Click "Elements" tab
3. Look for `<div id="root">` with content inside

If empty: React not loading
If has content: React is working!

### **Test 3: Check Network Tab**
1. Open DevTools (F12)
2. Click "Network" tab
3. Refresh page (Cmd+R / Ctrl+R)
4. Look for failed requests (red)

### **Test 4: Check Console for Warnings**
1. Open DevTools (F12)
2. Click "Console" tab
3. Look for warnings (yellow) or errors (red)

---

## 📸 What It Should Look Like

### **Desktop View:**
```
┌─────────────┬──────────────────────────────────────┐
│  Sidebar    │  Main Content Area                   │
│             │                                      │
│ WiFi-Radar  │  Dashboard / Overview                │
│ CSI Monitor │                                      │
│             │  [System Status Cards]               │
│ ○ Overview  │  [Activity Feed]                     │
│   Live Tel. │  [Device Status]                     │
│   Incidents │                                      │
│   Analytics │                                      │
│   Settings  │                                      │
│             │                                      │
│ [Room:      │                                      │
│  Living R.▼]│                                      │
│             │                                      │
│ ● Live WS   │                                      │
│ Stream      │                                      │
│ 52 sub.     │                                      │
└─────────────┴──────────────────────────────────────┘
```

### **Mobile View:**
```
┌──────────────────────────────────────┐
│ ☰  WiFi-Radar      Live WS Stream    │
├──────────────────────────────────────┤
│                                      │
│  Dashboard / Overview                │
│                                      │
│  [System Status Cards]               │
│  [Activity Feed]                     │
│  [Device Status]                     │
│                                      │
└──────────────────────────────────────┘
```

---

## 🔧 Diagnostic Commands

### **1. Check if frontend server is running:**
```bash
ps aux | grep vite | grep -v grep
```
Should show a node process running vite.

### **2. Check if port 3000 is in use:**
```bash
lsof -i :3000
```
Should show node/vite process.

### **3. Check Vite logs:**
Look at the terminal where you ran `npm run dev`.
Recent output should show:
```
VITE v5.4.21  ready in 383 ms
➜  Local:   http://localhost:3000/
```

### **4. Check for JavaScript errors:**
```bash
# In frontend terminal, look for:
# - Syntax errors
# - Import errors  
# - Module not found errors
```

---

## 🆘 Nuclear Options (Last Resort)

### **Option 1: Restart Everything**
```bash
# Stop frontend (Ctrl+C in frontend terminal)
# Stop backend (Ctrl+C in backend terminal)

# Restart backend:
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
python start_backend_8080.py

# Restart frontend:
cd /Users/pruthiviraj/Downloads/wifi-master/frontend
npm run dev
```

### **Option 2: Clear Node Modules**
```bash
cd /Users/pruthiviraj/Downloads/wifi-master/frontend
rm -rf node_modules .vite
npm install
npm run dev
```

### **Option 3: Different Browser**
Try:
- Chrome
- Firefox
- Safari
- Edge

### **Option 4: Different Port**
```bash
cd /Users/pruthiviraj/Downloads/wifi-master/frontend
npm run dev -- --port 3001
```
Then open: http://localhost:3001

---

## 📊 Expected Behavior

### **Normal Startup:**
1. Terminal shows: `VITE v5.4.21  ready in 383 ms`
2. Terminal shows: `➜  Local:   http://localhost:3000/`
3. Browser loads page in <2 seconds
4. Dashboard appears with beige background
5. Sidebar/menu visible
6. Content loads immediately

### **Normal Errors (OK to Ignore):**
- Warning about CJS build (doesn't affect functionality)
- Warning about package.json type (cosmetic)
- API connection errors if backend is off (falls back to simulation)

### **Red Flags (Need fixing):**
- Blank white page for >5 seconds
- Console errors about missing modules
- Build errors in terminal
- Port already in use errors

---

## 🎯 Tell Me Exactly What You See

To help diagnose, please check:

1. **What do you see in the browser?**
   - [ ] Completely blank white page
   - [ ] HTML content but no styling
   - [ ] Dashboard with sidebar
   - [ ] Something else: _______________

2. **What's in the browser console? (F12)**
   - [ ] No errors (all clear)
   - [ ] Yellow warnings only
   - [ ] Red errors (copy the first error message)

3. **What's in the terminal?**
   - [ ] "ready in XXX ms" and "Local: http://localhost:3000/"
   - [ ] Errors (copy the error)
   - [ ] Still installing/compiling

4. **Can you access these URLs?**
   - [ ] http://localhost:3000 (frontend)
   - [ ] http://localhost:8080 (backend)
   - [ ] http://localhost:8080/health (health check)

---

## ✅ Working Correctly Checklist

Your system is working if:
- ✅ http://localhost:3000 loads a page
- ✅ You see "WiFi-Radar" somewhere on the page
- ✅ Navigation menu is visible (or hamburger icon on mobile)
- ✅ Background is beige/cream colored (not pure white)
- ✅ No red errors in console (F12)
- ✅ Terminal shows "ready in XXX ms"

---

**Let me know exactly what you see, and I can help diagnose further!**
