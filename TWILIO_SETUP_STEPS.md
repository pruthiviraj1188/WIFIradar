# 🚀 Twilio Setup - Final Steps

## ✅ You Have (Already):
- Account SID: `ACfb8cb1077525a21156c79c536dd312de757000`
- Auth Token: `e9258dd279a9875791c86dc016c14ca0`

## 📞 Step 1: Get Your Twilio Phone Number

### Option A: Get Free Trial Number
1. Go to: https://console.twilio.com/
2. Click **"Get a Trial Number"** (big red button)
3. It will give you a number like: `+15017122661`
4. Click **"Choose this Number"**
5. **SAVE THIS NUMBER!**

### Option B: Buy a Number ($1/month)
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Search for a number in your country
3. Buy number (~$1/month)

---

## ⚠️ Important Trial Limitations:

**Trial accounts can ONLY call:**
- Numbers you have verified in Twilio console
- You cannot call random numbers until you upgrade

### To Verify Your Phone Number:
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"+ Add a new number"**
3. Enter YOUR phone number (the one you want to test with)
4. Verify via SMS code
5. Now you can call that number!

---

## 🔧 Step 2: Add to Vercel Environment Variables

Once you have your Twilio phone number, add these to Vercel:

1. Go to: https://vercel.com/pruthiviraj1188s-projects/wifi-master/settings/environment-variables

2. Add these THREE variables:

**Variable 1:**
- Name: `TWILIO_ACCOUNT_SID`
- Value: `ACfb8cb1077525a21156c79c536dd312de757000`

**Variable 2:**
- Name: `TWILIO_AUTH_TOKEN`
- Value: `e9258dd279a9875791c86dc016c14ca0`

**Variable 3:**
- Name: `TWILIO_PHONE_NUMBER`
- Value: `+15017122661` (use YOUR number from Step 1)

3. Click **Save** for each

---

## 🚀 Step 3: Redeploy

```bash
cd /Users/pruthiviraj/Downloads/wifi-master
vercel --prod
```

Wait 1-2 minutes for deployment.

---

## 🧪 Step 4: Test

1. **Verify your phone number first** (Trial limitation!)
   https://console.twilio.com/us1/develop/phone-numbers/manage/verified

2. Add emergency contact in WiFi Radar:
   - Name: Your Name
   - Phone: +YOUR_VERIFIED_NUMBER (must match verified number)
   - Relation: Self

3. Click **"Trigger Test Fall"**

4. Wait 30 seconds

5. **YOUR PHONE SHOULD RING!** 📞

---

## 🎯 What You'll Hear:

```
"Emergency alert! This is WiFi Radar automated emergency system.
A fall has been detected in Living Room.
The person has not recovered for 30 seconds.
Please check on them immediately.
Press 1 to confirm you received this alert."
```

---

## ⚠️ Troubleshooting:

### "Call failed" or "Invalid phone number"
- Make sure phone number has + prefix: `+1234567890`
- Verify number in Twilio console first (trial limitation)

### "Credentials not configured"
- Check all 3 environment variables are in Vercel
- Make sure you redeployed after adding them

### "twilio library not installed"
- I'll add it to requirements.txt now

---

## 💰 Upgrade to Production (Optional)

Your $15 credit is enough for ~1150 calls!

To call ANY number (not just verified):
1. Go to: https://console.twilio.com/billing
2. Click "Upgrade"
3. Add payment method
4. Can now call any phone number

---

## 📊 Monitor Usage

Check your usage at:
https://console.twilio.com/us1/monitor/logs/calls

You'll see:
- Each call made
- Duration
- Cost
- Status (completed, failed, etc.)

---

**Next: Get your Twilio phone number and add all 3 variables to Vercel!**
