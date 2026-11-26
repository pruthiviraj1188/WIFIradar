"""
FREE Telegram Bot Emergency Notifications
No payment required - Works immediately!

Setup:
1. Message @BotFather on Telegram
2. Create bot, get token
3. Add token to Vercel environment: TELEGRAM_BOT_TOKEN
4. Get your chat_id by messaging the bot
"""

from http.server import BaseHTTPRequestHandler
import json
import os
try:
    import requests
except ImportError:
    import urllib.request
    import urllib.parse

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            # Extract data
            phone = data.get('phone', '')
            name = data.get('name', 'Emergency Contact')
            room_name = data.get('room_name', 'Unknown Room')
            timestamp = data.get('timestamp', '')
            
            # Phone number is actually the Telegram chat_id
            # Format: telegram:123456789 or just the number
            chat_id = phone.replace('telegram:', '').replace('+', '').strip()
            
            if not TELEGRAM_BOT_TOKEN:
                raise Exception('TELEGRAM_BOT_TOKEN not configured')
            
            if not chat_id:
                raise Exception('No Telegram chat_id provided')
            
            # Create emergency message
            message = f"""
🚨 **EMERGENCY ALERT** 🚨

⚠️ **FALL DETECTED**

👤 Contact: {name}
📍 Location: {room_name}
⏰ Time: {timestamp}

❗ Person has not recovered for 30 seconds
🆘 **IMMEDIATE RESPONSE REQUIRED**

Please check on them NOW!

---
WiFi Radar Safety System
"""
            
            # Send via Telegram
            url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
            
            payload = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            # Try using requests if available, else use urllib
            try:
                import requests
                response = requests.post(url, json=payload, timeout=10)
                result = response.json()
            except:
                # Fallback to urllib
                import urllib.request
                import urllib.parse
                data_encoded = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(
                    url,
                    data=data_encoded,
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode('utf-8'))
            
            if result.get('ok'):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response_data = {
                    "success": True,
                    "message": f"Telegram alert sent to {name}",
                    "chat_id": chat_id,
                    "platform": "telegram"
                }
                
                self.wfile.write(json.dumps(response_data).encode())
            else:
                raise Exception(f"Telegram API error: {result.get('description', 'Unknown error')}")
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                "success": False,
                "error": str(e),
                "message": "Failed to send Telegram alert",
                "hint": "Make sure TELEGRAM_BOT_TOKEN is set and chat_id is correct"
            }
            
            self.wfile.write(json.dumps(error_response).encode())
