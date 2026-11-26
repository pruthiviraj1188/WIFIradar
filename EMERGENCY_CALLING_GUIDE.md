# Emergency Contact Calling - Implementation Guide

## 🚨 Current Status

**What Works Now:**
- ✅ Emergency contacts can be added/saved
- ✅ Fall detection triggers 30-second countdown
- ✅ Countdown displays on screen
- ✅ System shows "Auto-Calling" message after 30 seconds
- ✅ Contacts are marked as "dispatched"

**What Does NOT Work:**
- ❌ Actual phone calls are NOT made
- ❌ SMS/Text messages are NOT sent
- ❌ No real telephony integration

---

## 🎯 Why Phone Calls Don't Work

The current system is a **demonstration/simulation**. Making actual phone calls requires:

1. **Telephony Service** (like Twilio, Vonage, AWS SNS)
2. **Backend Integration** with the telephony API
3. **Phone Number Verification** (for regulatory compliance)
4. **Payment Account** (telephony services charge per call/SMS)

---

## 📱 How to Add Real Phone Calling

### Option 1: Twilio Integration (Recommended)

Twilio is the most popular service for making automated phone calls.

#### Step 1: Sign Up for Twilio
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial ($15 credit)
3. Get your **Account SID** and **Auth Token**
4. Buy a Twilio phone number (~$1/month)

#### Step 2: Install Twilio in Backend

```bash
# Add to api/requirements.txt
twilio==8.10.0
```

#### Step 3: Create Twilio Calling Function

**File: `api/emergency/call.py`**

```python
from http.server import BaseHTTPRequestHandler
from twilio.rest import Client
import json
import os

# Twilio credentials (set in Vercel environment variables)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')  # Your Twilio number

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body)
        
        # Extract emergency contact info
        contact_number = data.get('phone')
        contact_name = data.get('name')
        room_name = data.get('room_name', 'Unknown Room')
        
        try:
            # Initialize Twilio client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            # Make the call with automated message
            call = client.calls.create(
                to=contact_number,
                from_=TWILIO_PHONE_NUMBER,
                twiml=f'''
                <Response>
                    <Say voice="alice">
                        Emergency alert! This is WiFi Radar automated system. 
                        A fall has been detected in {room_name}. 
                        The person has not recovered for 30 seconds. 
                        Please check on them immediately. 
                        Repeating: Fall detected in {room_name}. 
                        Please respond immediately.
                    </Say>
                    <Pause length="2"/>
                    <Say voice="alice">
                        Press 1 to confirm you received this alert.
                    </Say>
                    <Gather numDigits="1" action="/api/emergency/confirm" method="POST"/>
                </Response>
                '''
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "success": True,
                "call_sid": call.sid,
                "status": call.status,
                "to": contact_number,
                "message": f"Emergency call initiated to {contact_name}"
            }
            
            self.wfile.write(json.dumps(response).encode())
            
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
```

#### Step 4: Update Frontend to Call Twilio Endpoint

**File: `frontend/src/context/TelemetryContext.jsx`**

Find the escalation logic (around line 418) and update:

```javascript
// Current code (line 418):
if (fallCountdown <= 0) {
  setEscalationState('escalated')
  const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
  setDispatchedContacts(emergencyContacts)
  triggerEmergencyEscalationApi({
    room_name: roomObj.name,
    confidence: currentFrame?.confidence ?? 0.85,
  })
  return
}

// Update to:
if (fallCountdown <= 0) {
  setEscalationState('escalated')
  const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
  setDispatchedContacts(emergencyContacts)
  
  // Call backend API
  triggerEmergencyEscalationApi({
    room_name: roomObj.name,
    confidence: currentFrame?.confidence ?? 0.85,
  })
  
  // Make actual phone calls to all emergency contacts
  emergencyContacts.forEach(async (contact) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/api/emergency/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          name: contact.name,
          room_name: roomObj.name,
          timestamp: new Date().toISOString()
        })
      })
      const result = await response.json()
      console.log(`Call to ${contact.name}:`, result)
    } catch (error) {
      console.error(`Failed to call ${contact.name}:`, error)
    }
  })
  
  return
}
```

#### Step 5: Set Environment Variables in Vercel

1. Go to Vercel Dashboard: https://vercel.com/pruthiviraj1188s-projects/wifi-master
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
TWILIO_ACCOUNT_SID = your_account_sid_here
TWILIO_AUTH_TOKEN = your_auth_token_here
TWILIO_PHONE_NUMBER = +1234567890  (your Twilio number)
```

4. Redeploy: `vercel --prod`

---

### Option 2: SMS Instead of Calls (Cheaper)

If phone calls are too expensive, send SMS text messages instead:

**File: `api/emergency/sms.py`**

```python
from http.server import BaseHTTPRequestHandler
from twilio.rest import Client
import json
import os

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body)
        
        contact_number = data.get('phone')
        contact_name = data.get('name')
        room_name = data.get('room_name', 'Unknown Room')
        
        try:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            # Send SMS
            message = client.messages.create(
                to=contact_number,
                from_=TWILIO_PHONE_NUMBER,
                body=f"🚨 EMERGENCY ALERT 🚨\n\n"
                     f"Fall detected in {room_name}!\n"
                     f"Person has not recovered for 30 seconds.\n"
                     f"Please check on them IMMEDIATELY.\n\n"
                     f"- WiFi Radar Safety System"
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "to": contact_number
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())
```

**Cost**: ~$0.0075 per SMS (much cheaper than calls)

---

### Option 3: Email Notifications (Free Alternative)

Use SendGrid or AWS SES to send emergency emails:

**File: `api/emergency/email.py`**

```python
from http.server import BaseHTTPRequestHandler
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import json
import os

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'alerts@wifiradar.com')

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body)
        
        contact_email = data.get('email')
        contact_name = data.get('name')
        room_name = data.get('room_name', 'Unknown Room')
        
        try:
            message = Mail(
                from_email=FROM_EMAIL,
                to_emails=contact_email,
                subject='🚨 EMERGENCY: Fall Detected - Immediate Response Required',
                html_content=f'''
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #B42318;">🚨 EMERGENCY ALERT</h2>
                    <p><strong>A fall has been detected and requires immediate attention!</strong></p>
                    <div style="background: #FEF3F2; padding: 20px; border-left: 4px solid #B42318;">
                        <p><strong>Location:</strong> {room_name}</p>
                        <p><strong>Status:</strong> Person has not recovered for 30 seconds</p>
                        <p><strong>Time:</strong> {data.get('timestamp', 'Now')}</p>
                    </div>
                    <p style="margin-top: 20px;">
                        <strong>ACTION REQUIRED:</strong> Please check on the person immediately.
                    </p>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated alert from WiFi Radar Safety Monitoring System.
                    </p>
                </body>
                </html>
                '''
            )
            
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "success": True,
                "status_code": response.status_code,
                "to": contact_email
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())
```

**Cost**: Free (100 emails/day with free plan)

---

## 💰 Cost Comparison

| Service | Method | Cost per Alert | Free Trial |
|---------|--------|---------------|------------|
| **Twilio** | Voice Call | $0.013/min | $15 credit |
| **Twilio** | SMS | $0.0075/msg | $15 credit |
| **SendGrid** | Email | Free | 100/day free |
| **AWS SNS** | SMS | $0.00645/msg | Free tier |
| **Vonage** | Voice Call | $0.012/min | €2 credit |

---

## 🔐 Security & Compliance

### Phone Number Verification
- Twilio requires phone number verification for trial accounts
- Production accounts need business verification
- Cannot call unverified numbers in trial mode

### GDPR/Privacy Compliance
- Get consent before storing phone numbers
- Allow users to opt-out
- Encrypt stored contact information
- Log all emergency calls for audit trail

### Testing Without Calling
During development, use Twilio's test credentials:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (Test)
Auth Token: your_test_token
```
This simulates calls without actually making them.

---

## 🧪 Testing the System

### Test with Your Own Number First
1. Add your own phone number as emergency contact
2. Trigger test fall
3. Wait 30 seconds
4. You should receive call/SMS
5. Verify message clarity and accuracy

### Test Checklist
- [ ] Phone call connects successfully
- [ ] Voice message is clear and understandable
- [ ] SMS arrives within 30 seconds
- [ ] Email has correct information
- [ ] Multiple contacts receive notifications
- [ ] System handles failed calls gracefully
- [ ] Logs capture all attempts

---

## 📝 Current System Behavior

**What Happens Now When You Click "Trigger Test Fall":**

1. ✅ Fall alert banner appears
2. ✅ 30-second countdown starts
3. ✅ Message shows: "Fall Detected — Waiting for person to stand up or walk"
4. ✅ After 30 seconds: Changes to "NO RECOVERY IN 30s — Auto-Calling..."
5. ✅ Backend API endpoint `/api/esp32/escalate` is called
6. ❌ **NO actual phone calls are made** (this is the missing piece)
7. ✅ Contacts are marked as "dispatched" in the UI
8. ✅ If you click "Cancel Alert", countdown stops

---

## 🚀 Quick Implementation (5 Steps)

If you want to add real calling NOW:

```bash
# 1. Sign up for Twilio (5 minutes)
https://www.twilio.com/try-twilio

# 2. Create api/emergency directory
mkdir -p api/emergency

# 3. Copy the call.py code above to:
api/emergency/call.py

# 4. Update api/requirements.txt:
echo "twilio==8.10.0" >> api/requirements.txt

# 5. Set environment variables in Vercel and redeploy
vercel --prod
```

---

## 🎯 Recommendation

For a **production elderly safety system**, I recommend:

1. **Primary**: Twilio Voice Calls (most reliable, immediate attention)
2. **Secondary**: Twilio SMS (backup if call fails)
3. **Tertiary**: Email (for record keeping)

**Why this approach:**
- Voice calls get immediate attention
- SMS as backup ensures message delivery
- Email provides audit trail
- Total cost: ~$0.02 per emergency event

---

## 📞 Support

Need help implementing? Here are resources:

- **Twilio Docs**: https://www.twilio.com/docs/voice/make-calls
- **Twilio Node.js**: https://www.twilio.com/docs/libraries/node
- **Twilio Python**: https://www.twilio.com/docs/libraries/python
- **Vercel Env Vars**: https://vercel.com/docs/projects/environment-variables

---

**Current Status**: ✅ System UI complete, ❌ Telephony integration needed  
**Estimated Time**: 1-2 hours to implement with Twilio  
**Cost**: ~$1-5/month for typical usage
