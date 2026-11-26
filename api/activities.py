from http.server import BaseHTTPRequestHandler
from datetime import datetime
import json
import random

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Generate sample activities
        activities = []
        for i in range(5):
            activities.append({
                "id": f"act-{random.randint(1000, 9999)}",
                "roomId": random.choice([1, 2]),
                "roomName": random.choice(["Living Room", "Primary Bedroom"]),
                "activity": random.choice(["walk", "sit", "stand", "Jump"]),
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "timestamp": datetime.utcnow().isoformat(),
                "status": "normal"
            })
        
        response = {"activities": activities}
        self.wfile.write(json.dumps(response).encode())
        return
