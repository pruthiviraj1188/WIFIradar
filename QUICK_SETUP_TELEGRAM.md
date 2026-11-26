# 📱 Quick Setup: FREE Telegram Emergency Alerts (10 Minutes)

## Why Telegram?
- ✅ **COMPLETELY FREE** - No payment ever
- ✅ **INSTANT** notifications (faster than SMS)
- ✅ **WORKS WORLDWIDE** - No regional restrictions
- ✅ **NO PHONE VERIFICATION** needed
- ✅ **10 MINUTES** to set up

---

## Step 1: Create Telegram Bot (3 minutes)

### 1.1 Install Telegram
- Download from: https://telegram.org/
- Or use web version: https://web.telegram.org/

### 1.2 Message BotFather
1. Open Telegram
2. Search for: **@BotFather**
3. Start chat with /start
4. Create bot: Type **/newbot**
5. Enter bot name: `WiFi Radar Emergency Bot`
6. Enter username: `wifiradar_emergency_bot` (must end with 'bot')

### 1.3 Get Your Bot Token
You'll receive a message like:
```
Done! Your token is: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**SAVE THIS TOKEN!** You'll need it in Step 3.

---

## Step 2: Get Your Chat ID (2 minutes)

### 2.1 Start Chat with Your Bot
1. Click the link provided by BotFather
2. Click **START** to activate the bot

### 2.2 Get Your Chat ID
**Method A: Use @userinfobot**
1. Search for: **@userinfobot**
2. Start chat
3. It will show your ID: `Your Telegram ID: 123456789`

**Method B: Use this URL**
1. Replace `YOUR_BOT_TOKEN` with your actual token:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```
2. Open in browser
3. Look for `"chat":{"id":123456789`
4. That number is your Chat ID

**SAVE YOUR CHAT ID!** Example: `123456789`

---

## Step 3: Configure Vercel (3 minutes)

### 3.1 Add Environment Variable
1. Go to: https://vercel.com/pruthiviraj1188s-projects/wifi-master
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` (your token)
4. Click **Save**

### 3.2 Redeploy
```bash
cd /Users/pruthiviraj/Downloads/wifi-master
vercel --prod
```

Wait 1-2 minutes for deployment to complete.

---

## Step 4: Add Contact in WiFi Radar (2 minutes)

### 4.1 Open Your App
Go to: https://wifi-master-gilt.vercel.app

### 4.2 Add Emergency Contact
1. Scroll to **Emergency Contacts** section
2. Fill in:
   - **Name**: `Your Name` (or whoever should be notified)
   - **Phone**: `telegram:123456789` ← Use `telegram:` prefix + your Chat ID
   - **Relation**: `Self` or `Family`
3. Click **Save Emergency Number**

**Example:**
```
Name: John Doe
Phone: telegram:987654321
Relation: Son
```

---

## Step 5: TEST IT! 🎉

### 5.1 Trigger Fall Alert
1. Click **"Trigger Test Fall"** button
2. Wait 30 seconds (countdown will appear)
3. After 30 seconds...

### 5.2 Check Telegram
You should receive a message like:

```
🚨 **EMERGENCY ALERT** 🚨

⚠️ **FALL DETECTED**

👤 Contact: John Doe
📍 Location: Living Room
⏰ Time: 2026-11-26 10:30:45

❗ Person has not recovered for 30 seconds
🆘 **IMMEDIATE RESPONSE REQUIRED**

Please check on them NOW!

---
WiFi Radar Safety System
```

---

## ✅ SUCCESS!

If you received the message, **IT WORKS!** 🎉

Your WiFi Radar system is now making REAL emergency notifications!

---

## 🔧 Troubleshooting

### "TELEGRAM_BOT_TOKEN not configured"
- Make sure you added the token in Vercel settings
- Redeploy after adding: `vercel --prod`

### "No Telegram chat_id provided"
- Make sure phone format is: `telegram:123456789`
- Use the `telegram:` prefix

### Bot not responding
- Make sure you clicked START with your bot
- Try sending `/start` to your bot again

### Still not working?
Check browser console (F12) for errors during test.

---

## 📱 Adding Multiple Contacts

You can add multiple people to get alerts:

**Person 1:**
- Name: `Dad`
- Phone: `telegram:111111111` (Dad's Telegram ID)

**Person 2:**
- Name: `Mom`  
- Phone: `telegram:222222222` (Mom's Telegram ID)

**Person 3:**
- Name: `Doctor`
- Phone: `telegram:333333333` (Doctor's Telegram ID)

All will receive instant Telegram alerts when fall detected!

---

## 💡 Advantages of Telegram

1. **FREE Forever** - No charges, ever
2. **Instant** - Faster than SMS
3. **Rich Messages** - Formatted with emojis and markdown
4. **Multiple Recipients** - Alert as many people as you want
5. **Global** - Works in every country
6. **Reliable** - Telegram servers are very stable
7. **No Phone Required** - Works on computer too

---

## 🚀 Want Voice Calls Instead?

If you need actual phone calls, see:
- `EMERGENCY_CALLING_GUIDE.md` - Twilio voice calls
- `TELEPHONY_ALTERNATIVES.md` - Other options

But Telegram is the **fastest, easiest, and FREE** solution! ✅

---

## 🎯 Summary

1. ✅ Create bot with @BotFather → Get token
2. ✅ Get your Chat ID from @userinfobot
3. ✅ Add token to Vercel environment
4. ✅ Add contact with `telegram:CHAT_ID` format
5. ✅ Test and receive instant alerts!

**Total Time**: 10 minutes  
**Total Cost**: $0 (FREE forever)  
**Difficulty**: ⭐ (Very Easy)

---

**You're done! Start protecting your loved ones NOW!** 🛡️
