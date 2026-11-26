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
        
        response = {
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
        
        self.wfile.write(json.dumps(response).encode())
        return
