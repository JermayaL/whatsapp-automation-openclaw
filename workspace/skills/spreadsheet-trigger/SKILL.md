---
name: spreadsheet-trigger
description: Reads Google Sheets and sends initial WhatsApp message per new lead
metadata: 
  openclaw:
    os: ["linux", "darwin"]
    requires:
      bins: ["node"]
---

# Spreadsheet Trigger Skill

This skill monitors a Google Sheet and sends WhatsApp messages to new leads.

## How it works

1. Connects to Google Sheets API
2. Finds rows with Status="New"
3. Sends personalized WhatsApp message per lead
4. Updates Status to "Contacted"
5. Respects WhatsApp rate limits (2 seconds between messages)

## Prerequisites

- Google Sheets API credentials (`google-credentials.json`)
- Google Sheet ID in environment
- WhatsApp linked to OpenClaw

## Usage

From OpenClaw Control UI:
```
/skills run spreadsheet-trigger
```

Or via CLI:
```bash
openclaw skills run spreadsheet-trigger
```

## Configuration

Set in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "spreadsheet-trigger": {
      "googleSheetId": "YOUR_SHEET_ID",
      "googleCredsPath": "./google-credentials.json",
      "checkInterval": 30
    }
  }
}
```

## Implementation

The skill uses Node.js to:
- Read Google Sheets via `google-spreadsheet` package
- Send messages via `openclaw message send`
- Track processed leads to avoid duplicates

## Example Message

```
Hi {name}! 👋

Thanks for your interest in {interest}. 
I'd love to help you learn more!

Do you have a few minutes to chat?
```

## Rate Limiting

- 2 second delay between messages
- Respects WhatsApp's ~50-100 messages/day limit for new accounts
- Tracks processed leads in `processed-leads.json`

## Error Handling

- Skips invalid phone numbers
- Logs errors to OpenClaw logs
- Updates Status="Failed" for failed sends
- Continues with next lead on error

## Monitoring

Check logs:
```bash
openclaw logs --follow | grep spreadsheet-trigger
```

View status:
```bash
openclaw skills status spreadsheet-trigger
```
