"""
Vercel Serverless API for WiFi-Radar
Note: WebSockets are not supported in Vercel serverless functions.
This provides REST API endpoints for the frontend.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random
import math

app = FastAPI(title="WiFi-Radar API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (use database in production)
activities_store = []
incidents_store = []
contacts_store = []

class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str = "Family"
    email: Optional[str] = None

class IncidentAcknowledge(BaseModel):
    notes: Optional[str] = None

class IncidentResolve(BaseModel):
    notes: Optional[str] = None
    is_false_alarm: bool = False

@app.get("/")
async def root():
    return {"message": "WiFi-Radar API", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Activities endpoints
@app.get("/api/activities")
async def get_activities(limit: int = 50):
    """Get recent activities"""
    return {
        "activities": activities_store[:limit] if activities_store else [
            {
                "id": f"act-{i}",
                "roomId": 1,
                "roomName": "Living Room",
                "activity": random.choice(["walk", "sit", "stand"]),
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "timestamp": datetime.utcnow().isoformat(),
                "status": "normal"
            } for i in range(5)
        ]
    }

# Incidents endpoints
@app.get("/api/incidents")
async def get_incidents(status: Optional[str] = None):
    """Get incidents, optionally filtered by status"""
    filtered = incidents_store
    if status:
        filtered = [i for i in incidents_store if i.get("status") == status]
    
    return {
        "incidents": filtered if filtered else []
    }

@app.post("/api/incidents/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: int, payload: IncidentAcknowledge):
    """Acknowledge an incident"""
    return {
        "incident": {
            "id": incident_id,
            "status": "acknowledged",
            "acknowledged_at": datetime.utcnow().isoformat(),
            "notes": payload.notes
        }
    }

@app.post("/api/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: int, payload: IncidentResolve):
    """Resolve an incident"""
    return {
        "incident": {
            "id": incident_id,
            "status": "false_alarm" if payload.is_false_alarm else "resolved",
            "resolved_at": datetime.utcnow().isoformat(),
            "notes": payload.notes,
            "is_false_alarm": payload.is_false_alarm
        }
    }

# ESP32 / Hardware endpoints
@app.get("/api/esp32/status")
async def get_esp32_status():
    """Get ESP32 hardware status"""
    return {
        "logger": {
            "mode": "SIMULATED",
            "com_port": "AUTO",
            "records_saved": random.randint(1000, 5000),
            "records_received": random.randint(1000, 5000),
            "last_rssi": random.randint(-75, -30),
            "last_amplitudes": [random.uniform(-0.5, 0.5) for _ in range(52)],
            "last_packet_at": datetime.utcnow().isoformat()
        },
        "inference": {
            "system_state": "NORMAL_MONITORING",
            "predicted_label": "stand",
            "confidence": 0.85,
            "buffer_fill": random.randint(50, 150),
            "window_size": 200,
            "model_error": None
        }
    }

@app.get("/api/esp32/contacts")
async def get_emergency_contacts():
    """Get emergency contacts"""
    return {"contacts": contacts_store}

@app.post("/api/esp32/contacts")
async def add_emergency_contact(contact: EmergencyContact):
    """Add emergency contact"""
    new_contact = {
        "id": len(contacts_store) + 1,
        **contact.dict()
    }
    contacts_store.append(new_contact)
    return {"contacts": contacts_store}

@app.delete("/api/esp32/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: int):
    """Delete emergency contact"""
    global contacts_store
    contacts_store = [c for c in contacts_store if c.get("id") != contact_id]
    return {"contacts": contacts_store}

@app.post("/api/esp32/escalate")
async def trigger_escalation(payload: dict):
    """Trigger emergency escalation"""
    return {
        "escalation": {
            "triggered": True,
            "timestamp": datetime.utcnow().isoformat(),
            "contacts_notified": len(contacts_store),
            "incident_id": random.randint(1000, 9999)
        }
    }

# Analytics endpoint
@app.get("/api/analytics/daily")
async def get_daily_analytics():
    """Get daily analytics summary"""
    return {
        "date": datetime.utcnow().date().isoformat(),
        "total_activities": random.randint(500, 1500),
        "falls_detected": random.randint(0, 3),
        "false_alarms": random.randint(0, 2),
        "average_confidence": 0.87,
        "hourly_activity": [
            {"hour": i, "count": random.randint(10, 100)}
            for i in range(24)
        ]
    }

# Simulated CSI data endpoint (since WebSockets don't work in Vercel)
@app.get("/api/csi/poll/{room_id}")
async def poll_csi_data(room_id: int):
    """Poll for latest CSI data (alternative to WebSocket)"""
    activity = random.choice(["walk", "stand", "sit", "Jump"])
    
    # Generate CSI data
    csi_data = []
    for i in range(52):
        phase = i * (2 * math.pi / 52)
        val = 0.3 * math.sin(2 * math.pi * 1.0 * random.random() + phase) + random.gauss(0, 0.03)
        csi_data.append(round(val, 4))
    
    # Generate breathing rate
    base_bpm = {"walk": 18.0, "stand": 14.5, "sit": 14.5, "Jump": 22.0}.get(activity, 15.5)
    breathing_bpm = round(base_bpm + random.gauss(0, 1.5), 1)
    
    return {
        "type": "csi_update",
        "room_id": room_id,
        "timestamp": datetime.utcnow().isoformat(),
        "activity": activity,
        "confidence": round(random.uniform(0.75, 0.95), 3),
        "csi_data": csi_data,
        "rssi": random.randint(-75, -30),
        "frame": random.randint(1000, 9999),
        "breathing_bpm": breathing_bpm
    }

# Devices/Rooms endpoints
@app.get("/api/devices")
async def get_devices():
    """Get all monitoring devices"""
    return {
        "devices": [
            {
                "id": 1,
                "name": "Living Room",
                "location": "Ground Floor · North",
                "deviceName": "ESP32-S3-01",
                "mac": "A4:CF:12:8E:31:04",
                "status": "online",
                "rssi": random.randint(-65, -45)
            },
            {
                "id": 2,
                "name": "Primary Bedroom",
                "location": "First Floor · East",
                "deviceName": "ESP32-S3-02",
                "mac": "A4:CF:12:8E:31:09",
                "status": "online",
                "rssi": random.randint(-70, -50)
            }
        ]
    }

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

# For Vercel deployment
from mangum import Mangum
handler = Mangum(app)
