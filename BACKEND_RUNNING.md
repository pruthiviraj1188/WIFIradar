# ✅ WiFi-Radar Backend is Running!

## 🎉 Success!

Your WiFi-Radar backend server is now running and accessible!

---

## 🌐 Access Points

### **API Documentation (Interactive)**
**👉 http://localhost:8080/docs**

This is what you want! It shows:
- All available API endpoints
- Interactive "Try it out" buttons
- Request/response examples
- Authentication options

### Other Endpoints:
- **API Root:** http://localhost:8080/
- **Health Check:** http://localhost:8080/health
- **API Base:** http://localhost:8080/api/

---

## 📚 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Devices (ESP32 Management)
- `GET /api/devices/` - List all ESP32 devices
- `POST /api/devices/register` - Register new device
- `GET /api/devices/{device_id}` - Get device details
- `PUT /api/devices/{device_id}` - Update device
- `DELETE /api/devices/{device_id}` - Remove device

### Rooms (Monitored Spaces)
- `GET /api/rooms/` - List all rooms
- `POST /api/rooms/` - Create new room
- `GET /api/rooms/{room_id}` - Get room details
- `PUT /api/rooms/{room_id}` - Update room
- `DELETE /api/rooms/{room_id}` - Delete room

### Activities (Event Logging)
- `GET /api/activities/` - Get activity history
- `POST /api/activities/` - Log new activity
- `GET /api/activities/{activity_id}` - Get activity details

### Incidents (Fall Alerts)
- `GET /api/incidents/` - List all incidents
- `POST /api/incidents/` - Create incident (fall detected)
- `GET /api/incidents/{incident_id}` - Get incident details
- `POST /api/incidents/{incident_id}/acknowledge` - Acknowledge alert
- `POST /api/incidents/{incident_id}/resolve` - Mark as resolved

### Analytics (Statistics)
- `GET /api/analytics/daily` - Daily activity statistics
- `GET /api/analytics/trends` - Activity trends

### WebSocket (Real-time)
- `WS /ws/room/{room_id}` - Real-time updates for room

---

## 🧪 Try It Out!

### 1. Open API Documentation
Visit: **http://localhost:8080/docs**

### 2. Test Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"healthy"}
```

### 3. Create a User (via API docs)
1. Go to http://localhost:8080/docs
2. Find `POST /api/auth/register`
3. Click "Try it out"
4. Enter user details:
```json
{
  "email": "caregiver@example.com",
  "password": "securepassword123",
  "full_name": "John Caregiver"
}
```
5. Click "Execute"

### 4. Login
1. Find `POST /api/auth/login`
2. Click "Try it out"
3. Enter credentials
4. Copy the returned JWT token

### 5. Use Protected Endpoints
1. Click the "Authorize" button at the top
2. Enter: `Bearer YOUR_JWT_TOKEN`
3. Now you can access protected endpoints!

---

## 🔄 Server Control

### Check if Server is Running
```bash
curl http://localhost:8080/health
```

### View Server Logs
The terminal where you started the server shows real-time logs.

### Stop the Server
Press `CTRL+C` in the terminal where the server is running.

### Restart the Server
```bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
python start_backend_8080.py
```

---

## 📊 Database

The backend uses SQLite database:
- **Location:** `wifi_radar.db` (created automatically)
- **Tables:** users, devices, rooms, activities, incidents, etc.
- **Migration:** Handled automatically by SQLAlchemy

---

## 🔧 Configuration

### Change Port
Edit `start_backend_8080.py` and change the port number:
```python
port=8080,  # Change to any available port
```

### Environment Variables
Create `.env` file:
```bash
cp config/.env.example .env
```

Edit `.env`:
```
DATABASE_URL=sqlite:///./wifi_radar.db
SECRET_KEY=your-secret-key-here
API_PORT=8080
```

---

## 🎯 Why Port 8080 Instead of 8000?

Port 8000 was already in use by another service. Port 8080 works just as well!

To use port 8000, first stop the conflicting service:
```bash
# Find process using port 8000
lsof -ti :8000

# Kill it (replace PID)
kill -9 <PID>

# Then use start_backend.py instead
python start_backend.py
```

---

## 📸 What You'll See in /docs

The interactive API documentation (Swagger UI) shows:

1. **All Endpoints** - Organized by category
2. **Request Examples** - Sample JSON payloads
3. **Response Examples** - What you'll get back
4. **Try It Out** - Test endpoints directly in browser
5. **Authentication** - Lock icon for protected routes
6. **Schemas** - Data model definitions

---

## 🚀 Next Steps

### 1. Create Your First User
Via http://localhost:8080/docs:
- POST /api/auth/register

### 2. Register an ESP32 Device
- POST /api/devices/register

### 3. Create a Room
- POST /api/rooms/

### 4. Log Activities
- POST /api/activities/

### 5. Test Fall Detection
- POST /api/incidents/

---

## 🔗 Integration

### Python Client
```python
import requests

# Health check
response = requests.get("http://localhost:8080/health")
print(response.json())

# Register user
response = requests.post(
    "http://localhost:8080/api/auth/register",
    json={
        "email": "user@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
)
print(response.json())
```

### JavaScript/Frontend
```javascript
// Fetch API
fetch('http://localhost:8080/health')
  .then(response => response.json())
  .then(data => console.log(data));

// With authentication
fetch('http://localhost:8080/api/activities/', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 📚 Documentation References

- **API Docs:** http://localhost:8080/docs (Interactive)
- **API Schema:** http://localhost:8080/openapi.json
- **Architecture:** See `docs/architecture.md`
- **Full Guide:** See `SETUP_GUIDE.md`

---

## ⚠️ Important Notes

1. **SQLite Database** - Created automatically on first run
2. **JWT Tokens** - Required for protected endpoints
3. **CORS Enabled** - Allows frontend at localhost:3000, localhost:5173
4. **Development Mode** - Not for production deployment
5. **No HTTPS** - Use reverse proxy (nginx) for production

---

## 🆘 Troubleshooting

### "Cannot connect to server"
Check if server is running:
```bash
curl http://localhost:8080/health
```

### "401 Unauthorized"
You need to login and use JWT token:
1. POST /api/auth/login
2. Copy the `access_token`
3. Click "Authorize" button
4. Enter: `Bearer YOUR_TOKEN`

### "422 Validation Error"
Check request body format matches the schema shown in /docs

### Port still in use?
Try a different port or kill the conflicting process

---

## 🎉 You're All Set!

**👉 Visit: http://localhost:8080/docs**

The interactive API documentation is your playground - explore all endpoints, test them out, and see the WiFi-Radar backend in action!

---

*WiFi-Radar Backend - FastAPI REST API for Elderly Safety Monitoring*
