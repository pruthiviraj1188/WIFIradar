from http.server import BaseHTTPRequestHandler
from datetime import datetime
import json
import random
import math

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Get room_id from query params
        room_id = 1
        if hasattr(self, 'path'):
            parts = self.path.split('/')
            if len(parts) > 0:
                try:
                    room_id = int(parts[-1]) if parts[-1].isdigit() else 1
                except:
                    room_id = 1
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Generate CSI data
        activity = random.choice(["walk", "stand", "sit", "Jump"])
        
        csi_data = []
        for i in range(52):
            phase = i * (2 * math.pi / 52)
            val = 0.3 * math.sin(2 * math.pi * 1.0 * random.random() + phase) + random.gauss(0, 0.03)
            csi_data.append(round(val, 4))
        
        # Generate breathing rate
        base_bpm = {"walk": 18.0, "stand": 14.5, "sit": 14.5, "Jump": 22.0}.get(activity, 15.5)
        breathing_bpm = round(base_bpm + random.gauss(0, 1.5), 1)
        
        response = {
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
        
        self.wfile.write(json.dumps(response).encode())
        return
