# 🚀 Complete Setup Guide - OpenClaw WhatsApp Automation

Complete step-by-step guide to set up the WhatsApp lead automation system with OpenClaw.

---

## 📋 **Overview**

This system automates WhatsApp lead follow-up using OpenClaw:

```
Google Sheets (new row, Status="New")
         ↓
   Spreadsheet Trigger Skill (detects)
         ↓
   WhatsApp Message Sent
         ↓
   Filter Agent (qualifies lead)
         ↓
   Human Agent (handles qualified leads)
```

---

## ⏱️ **Time Estimate**

- **First-time setup**: 2-4 hours
- **Experienced user**: 1-2 hours

---

## 📦 **Prerequisites**

### **System Requirements:**
- Ubuntu 22.04/24.04 (or macOS)
- Node.js 22+
- 2GB RAM minimum
- Internet connection

### **Accounts Needed:**
- Anthropic API key (Claude)
- WhatsApp Business number (dedicated)
- Google Cloud account (for Sheets API)
- VPS/server for 24/7 operation

---

## 🔧 **Step 1: Install OpenClaw (20 minutes)**

### **1.1 Install OpenClaw**

```bash
# Install OpenClaw
curl -fsSL https://openclaw.bot/install.sh | bash

# Verify installation
openclaw --version
```

### **1.2 Run Onboarding Wizard**

```bash
openclaw onboard --install-daemon
```

**What the wizard asks:**

1. **Mode**: Choose "Local"
2. **Auth**: Choose "Anthropic API key"
   - Paste your Anthropic API key
3. **Channels**: Choose "WhatsApp"
4. **Daemon**: Choose "Yes" (systemd/launchd)

### **1.3 Link WhatsApp**

```bash
openclaw channels login
```

- Scan QR code with WhatsApp Business app
- Settings → Linked Devices → Link a Device

### **1.4 Verify Installation**

```bash
openclaw status
openclaw channels status
openclaw health
```

---

## 📊 **Step 2: Setup Google Sheets (15 minutes)**

### **2.1 Create Google Sheet**

1. Go to: https://sheets.google.com
2. Create new sheet: "WhatsApp Leads"
3. Add columns:
   ```
   ID | Timestamp | Name | Phone | Email | Company | Interest | Status | Notes | Last Updated
   ```

4. Copy Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz/edit
                                           ^^^^^^^^^^
   ```

### **2.2 Setup Google Cloud**

1. Go to: https://console.cloud.google.com/
2. Create project: "WhatsApp Automation"
3. Enable Google Sheets API
4. Create Service Account:
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Name: "openclaw-sheets"
   - Download JSON key

5. Share your Google Sheet:
   - Open JSON file
   - Copy `client_email`
   - Share sheet with this email (Editor)

---

## 🏗️ **Step 3: Install Files (10 minutes)**

### **3.1 Download Complete Package**

Download all files from GitHub or the provided archive.

### **3.2 Copy Files to OpenClaw Workspace**

```bash
# Create directories
mkdir -p ~/.openclaw/workspace/skills/spreadsheet-trigger
mkdir -p ~/.openclaw/workspace-filter/.prose

# Copy skill files
cp workspace/skills/spreadsheet-trigger/* ~/.openclaw/workspace/skills/spreadsheet-trigger/

# Copy filter agent files
cp workspace-filter/AGENTS.md ~/.openclaw/workspace-filter/
cp workspace-filter/SOUL.md ~/.openclaw/workspace-filter/
cp workspace-filter/.prose/* ~/.openclaw/workspace-filter/.prose/

# Copy config
cp config/openclaw.json ~/.openclaw/openclaw.json

# Copy Google credentials
cp google-credentials.json ~/.openclaw/
```

### **3.3 Install Dependencies**

```bash
cd ~/.openclaw/workspace/skills/spreadsheet-trigger
npm install google-spreadsheet
```

---

## ⚙️ **Step 4: Configure OpenClaw (15 minutes)**

### **4.1 Edit Configuration**

```bash
nano ~/.openclaw/openclaw.json
```

**Update these values:**

```json
{
  "gateway": {
    "auth": {
      "token": "REPLACE_WITH_SECURE_TOKEN"  // Generate: openssl rand -hex 32
    }
  },
  "models": {
    "providers": {
      "anthropic": {
        "apiKey": "YOUR_ANTHROPIC_API_KEY"
      }
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": [
        "+31612345678"  // Your test number
      ]
    }
  },
  "skills": {
    "spreadsheet-trigger": {
      "googleSheetId": "YOUR_SHEET_ID",
      "googleCredsPath": "~/.openclaw/google-credentials.json"
    }
  }
}
```

### **4.2 Set Environment Variables**

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="your_key_here"
export GOOGLE_SHEET_ID="your_sheet_id"
export GOOGLE_CREDS_PATH="$HOME/.openclaw/google-credentials.json"

# Reload
source ~/.bashrc
```

---

## 🚀 **Step 5: Start Services (5 minutes)**

### **5.1 Enable OpenProse Plugin**

```bash
openclaw plugins enable open-prose
```

### **5.2 Start Gateway**

```bash
openclaw gateway --daemon
```

Or manually:
```bash
openclaw gateway --port 18789 --verbose
```

### **5.3 Verify Services**

```bash
# Check status
openclaw status

# Check agents
openclaw agents list

# Check skills
openclaw skills list

# View logs
openclaw logs --follow
```

---

## 🧪 **Step 6: Test the System (30 minutes)**

### **6.1 Test Spreadsheet Trigger**

1. Open your Google Sheet
2. Add a test row:
   ```
   ID: TEST-001
   Name: Test User
   Phone: +31612345678  (your number)
   Interest: Product Demo
   Status: New
   ```

3. Run the skill:
   ```bash
   openclaw skills run spreadsheet-trigger
   ```

4. Check your WhatsApp - you should receive a message!

### **6.2 Test Filter Agent**

1. Reply to the WhatsApp message
2. Filter agent should ask qualification questions
3. Answer the questions
4. Verify conversation flow

### **6.3 Test Prose Workflow** (Optional)

```bash
# Open Control UI
openclaw dashboard

# In chat, run:
/prose run filter-handover
```

---

## 🔄 **Step 7: Automate with Cron (10 minutes)**

### **7.1 Create Cron Job**

```bash
crontab -e
```

Add:
```bash
# Run spreadsheet trigger every 30 seconds
* * * * * /usr/local/bin/openclaw skills run spreadsheet-trigger
* * * * * sleep 30 && /usr/local/bin/openclaw skills run spreadsheet-trigger
```

Or use PM2:
```bash
npm install -g pm2

# Create PM2 app
cat > ~/.openclaw/trigger-cron.js << 'EOF'
const { exec } = require('child_process');

setInterval(() => {
  exec('openclaw skills run spreadsheet-trigger', (error, stdout, stderr) => {
    if (error) console.error(error);
    else console.log(stdout);
  });
}, 30000);
EOF

pm2 start ~/.openclaw/trigger-cron.js --name spreadsheet-trigger
pm2 save
pm2 startup
```

---

## 🔗 **Step 8: Connect Meta Ads** (Optional, 15 minutes)

### **8.1 Setup Zapier**

1. Go to: https://zapier.com
2. Create Zap:
   - **Trigger**: Facebook Lead Ads
   - **Action**: Google Sheets - Create Spreadsheet Row

3. Map fields:
   - Name → Name
   - Phone → Phone
   - Email → Email
   - Interest → Interest
   - Set Status = "New"

4. Test and activate

### **8.2 Alternative: Make.com**

1. Go to: https://make.com
2. Create scenario with same setup as Zapier
3. Activate scenario

---

## 📊 **Monitoring & Maintenance**

### **Check Health**

```bash
# Overall status
openclaw status --all

# Gateway health
openclaw health --verbose

# Channel status
openclaw channels status

# Agent status
openclaw agents status
```

### **View Logs**

```bash
# Live logs
openclaw logs --follow

# Specific agent
openclaw logs --agent filter

# Specific channel
openclaw logs --channel whatsapp

# Filter by level
openclaw logs --level error
```

### **Troubleshooting**

```bash
# Run doctor (fixes common issues)
openclaw doctor

# Restart gateway
openclaw gateway restart

# Re-link WhatsApp
openclaw channels login

# Check model auth
openclaw models status
```

---

## 🔒 **Security Checklist**

- [ ] Use dedicated WhatsApp Business number
- [ ] Set strong gateway auth token
- [ ] Configure `allowFrom` whitelist
- [ ] Use `dmPolicy: "pairing"` for unknown senders
- [ ] Keep `google-credentials.json` secure (chmod 600)
- [ ] Don't commit secrets to git
- [ ] Regular backups of workspace
- [ ] Monitor logs for suspicious activity
- [ ] Rate limit enabled (2s between messages)
- [ ] Use HTTPS in production (reverse proxy)

---

## 🎯 **Next Steps**

### **Enhance Filter Agent**
- Add more qualification questions
- Implement lead scoring
- Connect to CRM

### **Add More Agents**
- Customer support agent
- Blog content generator
- Analytics reporter

### **Improve Automation**
- Add webhook triggers (real-time)
- Implement A/B testing
- Add analytics dashboard

---

## 📞 **Support Resources**

- **OpenClaw Docs**: https://docs.openclaw.ai/
- **GitHub Issues**: https://github.com/openclaw/openclaw/issues
- **Community**: Discord/Discussions
- **This Project**: See README.md

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] OpenClaw installed and running
- [ ] WhatsApp linked successfully
- [ ] Google Sheets API working
- [ ] Spreadsheet trigger skill functional
- [ ] Filter agent responding correctly
- [ ] Prose workflow (if using) works
- [ ] Cron/PM2 automation active
- [ ] Logs show no errors
- [ ] Test message received successfully
- [ ] Lead qualification flow works
- [ ] Status updates in spreadsheet

---

**Estimated Total Time**: 2-4 hours for complete setup

**Result**: Fully automated WhatsApp lead qualification system! 🎉
