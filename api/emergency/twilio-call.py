"""
Twilio Voice Call - Makes REAL phone calls
Requires: Twilio account with phone number

Setup:
1. Sign up at twilio.com/try-twilio (get $15 credit)
2. Get Account SID, Auth Token, Phone Number
3. Add to Vercel environment variables
4. Install: pip install twilio
"""

from http.server import BaseHTTPRequestHandler
import json
import os

# Check if twilio is available
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            if not TWILIO_AVAILABLE:
                raise Exception('Twilio library not installed. Add "twilio==8.10.0" to api/requirements.txt')
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            phone = data.get('phone', '')
            name = data.get('name', 'Emergency Contact')
            room_name = data.get('room_name', 'Unknown Room')
            
            if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
                raise Exception('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in Vercel environment variables')
            
            if not phone:
                raise Exception('No phone number provided')
            
            # Initialize Twilio client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            # Create the call with automated message
            call = client.calls.create(
                to=phone,
                from_=TWILIO_PHONE_NUMBER,
                twiml=f'''
                <Response>
                    <Say voice="alice" language="en-US">
                        Emergency alert! This is WiFi Radar automated emergency system.
                        <break time="0.5s"/>
                        A fall has been detected in {room_name}.
                        <break time="0.5s"/>
                        The person has not recovered for 30 seconds.
                        <break time="0.5s"/>
                        Please check on them immediately.
                        <break time="1s"/>
                        Repeating: Fall detected in {room_name}.
                        <break time="0.5s"/>
                        Please respond immediately.
                        <break time="1s"/>
                        Press 1 to confirm you received this alert.
                    </Say>
                    <Gather numDigits="1" timeout="10">
                        <Say voice="alice">Press 1 now.</Say>
                    </Gather>
                    <Say voice="alice">Thank you. Please check on the person immediately.</Say>
                </Response>
                '''
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {
                "success": True,
                "message": f"Emergency call initiated to {name} at {phone}",
                "call_sid": call.sid,
                "status": call.status,
                "to": phone,
                "platform": "twilio_voice"
            }
            
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                "success": False,
                "error": str(e),
                "message": "Failed to make emergency call"
            }
            
            self.wfile.write(json.dumps(error_response).encode())
