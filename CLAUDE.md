# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Dit project automatiseert WhatsApp messaging via OpenClaw voor lead management. Het systeem kwalificeert inkomende leads via een filter agent en stuurt ze door naar een menselijke agent.

## Tech Stack
- **Runtime:** Node.js 18+
- **Language:** JavaScript (CommonJS)
- **Framework:** OpenClaw (agent orchestration), Open Prose (workflow)
- **LLM:** Claude Sonnet 4.5

## Architecture
WhatsApp message → OpenClaw binding → Filter Agent → Prose Workflow → Human Agent handover

## Core Files
- `config/openclaw.json` - OpenClaw gateway and agent configuration
- `workspace/skills/spreadsheet-trigger/trigger.js` - Google Sheets trigger skill
- `workspace/skills/spreadsheet-trigger/SKILL.md` - Skill documentation
- `workspace-filter/AGENTS.md` - Filter agent prompt and qualification flow
- `workspace-filter/SOUL.md` - Filter agent personality and tone
- `workspace-filter/.prose/filter-handover.prose` - Lead qualification workflow

## Environment Variables
```
ANTHROPIC_API_KEY=your_api_key
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_CREDS_PATH=./google-credentials.json
```

## Key Patterns
- **Lead qualification:** Filter agent asks 5 questions before handover
- **Phone validation:** E.164 format required (`+` followed by 1-15 digits)
- **Rate limiting:** 2 second delay between WhatsApp messages
- **Session isolation:** Per-account-channel-peer WhatsApp sessions
- **Routing:** DMs go to filter agent (priority 100), qualified numbers route to human agent (priority 200)

## Coding Guidelines
- Use async/await for all async operations
- Add error handling for external API calls
- Validate phone numbers as E.164 before sending
- Use `execFile` (not `exec`) for shell commands to prevent injection
- Test with WhatsApp test account before production

## Testing
```bash
# Run spreadsheet trigger manually
node workspace/skills/spreadsheet-trigger/trigger.js

# Validate openclaw.json
python3 -c "import json; json.load(open('config/openclaw.json'))"
```

## Security Notes
- Never commit `.env` or `google-credentials.json`
- Use E.164 format for phone numbers
- Use `execFile` instead of `exec` for shell commands (no shell interpolation)
- Gateway auth token must be replaced before deployment

## Development Workflow
1. Edit agent prompts in `workspace-filter/`
2. Edit skill logic in `workspace/skills/`
3. Update routing in `config/openclaw.json`
4. Test with WhatsApp test account
5. Check OpenClaw logs

## Common Issues
- Phone format errors → Use E.164 format (`+31612345678`)
- Invalid config → Ensure `openclaw.json` has no comments (must be valid JSON)
- Session problems → Clear WhatsApp auth cache
