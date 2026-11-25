#!/bin/bash

echo "================================"
echo "WiFi-Radar System Status Check"
echo "================================"
echo ""

# Check backend
echo "🔧 Backend Status:"
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:8080/health)
    echo "✅ Backend is running at http://localhost:8080"
    echo "   Response: $HEALTH"
else
    echo "❌ Backend is NOT running"
    echo "   Start with: cd /Users/pruthiviraj/Downloads/wifi-master && source venv/bin/activate && python start_backend_8080.py"
fi
echo ""

# Check frontend
echo "🎨 Frontend Status:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost:3000"
    if curl -s http://localhost:3000 | grep -q "WiFi-Radar"; then
        echo "✅ HTML contains WiFi-Radar title"
    else
        echo "⚠️  HTML loaded but title not found"
    fi
else
    echo "❌ Frontend is NOT running"
    echo "   Start with: cd /Users/pruthiviraj/Downloads/wifi-master/frontend && npm run dev"
fi
echo ""

# Check ports
echo "🌐 Port Status:"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Port 8080: In use (Backend)"
else
    echo "❌ Port 8080: Not in use"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Port 3000: In use (Frontend)"
else
    echo "❌ Port 3000: Not in use"
fi
echo ""

# Check processes
echo "🔍 Running Processes:"
if ps aux | grep -v grep | grep "start_backend_8080" > /dev/null; then
    echo "✅ Backend process found"
else
    echo "⚠️  Backend process not found"
fi

if ps aux | grep -v grep | grep "vite" > /dev/null; then
    echo "✅ Vite (frontend) process found"
else
    echo "⚠️  Vite process not found"
fi
echo ""

# Summary
echo "================================"
echo "📊 Summary:"
echo "================================"
echo ""
echo "Frontend URL: http://localhost:3000"
echo "Backend API:  http://localhost:8080"
echo "API Docs:     http://localhost:8080/docs"
echo ""
echo "If both are running (✅), open http://localhost:3000 in your browser!"
echo ""
