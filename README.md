# 🤖 OpenClaw WhatsApp Lead Automation

**Complete automation system using OpenClaw for WhatsApp lead qualification**

Automatically detects new leads in Google Sheets → Sends WhatsApp message → AI qualifies lead → Hands over to human agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 **What This Does**

```
Meta Ads Lead Form
      ↓ (via Zapier/Make)
Google Sheets (Status="New")
      ↓ (30-second detection)
WhatsApp Message Sent
      ↓ (lead responds)
Filter Agent (AI qualification)
      ↓ (questions answered)
Human Agent (qualified leads)
```

---

## ✨ **Features**

- ✅ **Automatic lead detection** from Google Sheets
- ✅ **WhatsApp automation** via OpenClaw
- ✅ **AI-powered qualification** (Claude 4.5)
- ✅ **Multi-agent system** (filter → human handover)
- ✅ **Prose workflows** for complex logic
- ✅ **Rate limiting** (WhatsApp compliant)
- ✅ **Session isolation** (each lead separate)
- ✅ **Status tracking** (automatic updates)
- ✅ **24/7 operation** (daemon/PM2)
- ✅ **Production ready**

---

## 📦 **What's Included**

### **Core Files:**
```
openclaw-whatsapp-complete/
├── workspace/
│   └── skills/
│       └── spreadsheet-trigger/
│           ├── SKILL.md              # Skill documentation
│           └── trigger.js            # Implementation
│
├── workspace-filter/
│   ├── AGENTS.md                     # Filter agent instructions
│   ├── SOUL.md                       # Agent personality
│   └── .prose/
│       └── filter-handover.prose     # Qualification workflow
│
├── config/
│   └── openclaw.json                 # Complete OpenClaw config
│
└── docs/
    ├── SETUP_GUIDE.md                # Step-by-step setup
    ├── ARCHITECTURE.md               # System architecture
    └── TROUBLESHOOTING.md            # Common issues
```

---

## 🚀 **Quick Start (5 Steps)**

### **1. Install OpenClaw**
```bash
curl -fsSL https://openclaw.bot/install.sh | bash
openclaw onboard --install-daemon
```

### **2. Link WhatsApp**
```bash
openclaw channels login
# Scan QR with WhatsApp Business app
```

### **3. Setup Google Sheets**
- Create sheet with columns: Name, Phone, Status
- Get Google Cloud credentials
- Share sheet with service account

### **4. Install This System**
```bash
# Copy files to OpenClaw workspace
cp -r workspace/* ~/.openclaw/workspace/
cp -r workspace-filter ~/.openclaw/
cp config/openclaw.json ~/.openclaw/

# Install dependencies
cd ~/.openclaw/workspace/skills/spreadsheet-trigger
npm install google-spreadsheet
```

### **5. Configure & Start**
```bash
# Edit config
nano ~/.openclaw/openclaw.json
# Add: API keys, Sheet ID, phone numbers

# Enable Prose
openclaw plugins enable open-prose

# Start gateway
openclaw gateway --daemon

# Test skill
openclaw skills run spreadsheet-trigger
```

**Full setup guide**: See [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)

---

## 🏗️ **Architecture**

### **Components:**

**1. Spreadsheet Trigger Skill**
- Monitors Google Sheets every 30 seconds
- Finds rows with Status="New"
- Sends WhatsApp via OpenClaw CLI
- Updates Status to "Contacted"

**2. Filter Agent**
- Receives WhatsApp messages
- Asks qualification questions:
  - Name confirmation
  - Primary need
  - Urgency
  - Company/personal
  - Budget range
- Collects structured data
- Hands over to human agent

**3. Prose Workflow** (Optional)
- Multi-step conversation flow
- Wait for user replies
- Branching logic
- State management

**4. Human Agent**
- Receives qualified leads
- Full conversation context
- Handles complex inquiries

### **Data Flow:**

```
┌─────────────────────────────────────────────────────┐
│              Meta Ads / Lead Forms                  │
│                      ↓                              │
│                 Zapier/Make                         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│               Google Sheets                         │
│  • Status: New                                      │
│  • Name, Phone, Interest                            │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│        Spreadsheet Trigger Skill                    │
│  • Polls every 30 seconds                           │
│  • Tracks processed leads                           │
│  • Rate limiting (2s delay)                         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│            OpenClaw Gateway                         │
│  • Routes to Filter Agent                           │
│  • Manages WhatsApp connection                      │
│  • Session management                               │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│         WhatsApp (via Baileys)                      │
│  • Sends message to lead                            │
│  • Lead receives + responds                         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│           Filter Agent (Claude 4.5)                 │
│  • Asks qualification questions                     │
│  • Validates responses                              │
│  • Collects lead data                               │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│       Human Agent (if qualified)                    │
│  • Receives qualified lead                          │
│  • Full context available                           │
│  • Handles complex inquiries                        │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 **Configuration**

### **Key Settings** (`~/.openclaw/openclaw.json`)

```json
{
  "agents": {
    "list": [
      { "id": "filter", "workspace": "~/.openclaw/workspace-filter" },
      { "id": "human", "workspace": "~/.openclaw/workspace-human" }
    ]
  },
  "bindings": [
    { "agentId": "filter", "match": { "channel": "whatsapp", "peer": { "kind": "dm" } } }
  ],
  "channels": {
    "whatsapp": {
      "dmPolicy": "pairing",
      "allowFrom": ["+31612345678"]
    }
  },
  "skills": {
    "spreadsheet-trigger": {
      "googleSheetId": "YOUR_SHEET_ID",
      "checkInterval": 30
    }
  }
}
```

---

## 📊 **Usage Examples**

### **Test Manually**
```bash
# Run skill once
openclaw skills run spreadsheet-trigger

# Open dashboard
openclaw dashboard

# View logs
openclaw logs --follow
```

### **Automate with Cron**
```bash
# Every 30 seconds
* * * * * openclaw skills run spreadsheet-trigger
* * * * * sleep 30 && openclaw skills run spreadsheet-trigger
```

### **Automate with PM2**
```bash
pm2 start trigger-cron.js --name spreadsheet-trigger
pm2 save
pm2 startup
```

### **Test Prose Workflow**
```
# In OpenClaw chat
/prose run filter-handover
```

---

## 🔒 **Security**

- ✅ Dedicated WhatsApp Business number
- ✅ Gateway authentication token
- ✅ DM pairing required
- ✅ Allowlist for known numbers
- ✅ Tool restrictions (no bash, no files)
- ✅ Session isolation per lead
- ✅ Rate limiting enabled
- ✅ Credentials not in git

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**Skill not running**
```bash
openclaw skills list
openclaw doctor
```

**WhatsApp not connected**
```bash
openclaw channels status
openclaw channels login
```

**Google Sheets error**
```bash
# Check credentials
ls ~/.openclaw/google-credentials.json

# Test connection
node ~/.openclaw/workspace/skills/spreadsheet-trigger/trigger.js
```

**Filter agent not responding**
```bash
openclaw agents status
openclaw logs --agent filter
```

---

## 📚 **Documentation**

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete step-by-step setup
- **[Architecture](docs/ARCHITECTURE.md)** - System design details
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues
- **[OpenClaw Docs](https://docs.openclaw.ai/)** - Official documentation

---

## 🎓 **Best Practices**

### **Lead Management**
- Use international phone format (+country)
- Validate phone numbers before adding to sheet
- Keep sheet organized (archive old leads)
- Monitor conversation quality

### **Rate Limiting**
- Start with 2-second delay between messages
- Max 50-100 messages/day for new accounts
- Gradually increase volume
- Monitor for WhatsApp warnings

### **Agent Optimization**
- Review conversation logs regularly
- Refine AGENTS.md based on feedback
- A/B test different approaches
- Adjust qualification questions

### **System Monitoring**
- Check logs daily: `openclaw logs`
- Monitor health: `openclaw health`
- Track success rate in sheet
- Set up alerts for failures

---

## 🚀 **Production Deployment**

### **VPS Setup**
```bash
# On DigitalOcean/Hetzner/AWS
ssh root@your-vps-ip

# Install OpenClaw
curl -fsSL https://openclaw.bot/install.sh | bash

# Clone config
git clone YOUR_PRIVATE_REPO
cp -r openclaw-whatsapp-complete/* ~/.openclaw/

# Link WhatsApp (via SSH tunnel)
ssh -L 18789:localhost:18789 root@your-vps-ip
# Open localhost:18789 in browser, scan QR

# Start as daemon
openclaw gateway --daemon
pm2 start trigger-cron.js
pm2 save
pm2 startup
```

### **Monitoring**
```bash
# PM2 monitoring
pm2 monit

# OpenClaw status
openclaw status --all

# Logs
tail -f ~/.openclaw/logs/gateway.log
```

---

## 💰 **Cost Estimate**

### **Monthly Operating Costs:**
- **VPS** (Hetzner): €4-10/month
- **Claude API**: ~€20-50/month (depends on volume)
- **Google Sheets API**: Free (under 100 requests/second)
- **WhatsApp**: Free (Business API costs if scaling)

**Total**: €25-60/month for ~100 leads/day

---

## 🤝 **Contributing**

Contributions welcome! Areas for improvement:
- [ ] Add CRM integration
- [ ] Implement lead scoring
- [ ] Add analytics dashboard
- [ ] Multi-language support
- [ ] A/B testing framework
- [ ] Webhook support (real-time)

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE)

---

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/JermayaL/whatsapp-automation-openclaw/issues)
- **OpenClaw**: [docs.openclaw.ai](https://docs.openclaw.ai/)
- **Community**: OpenClaw Discord

---

## ✅ **Status**

- ✅ Core system working
- ✅ WhatsApp integration complete
- ✅ Filter agent functional
- ✅ Prose workflow ready
- ✅ Production tested
- ✅ Documentation complete

---

**Ready to automate your lead follow-up with OpenClaw? Follow the setup guide!** 🚀

**Previous System**: This repo previously had a simpler `spreadsheet-monitor.js` approach. The new OpenClaw-based system is more powerful and scalable.

**Repository**: https://github.com/JermayaL/whatsapp-automation-openclaw
