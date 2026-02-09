# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Dit project automatiseert WhatsApp messaging via OpenClaw voor lead management en CRM integratie. Het systeem handelt inkomende berichten af, valideert leads, en synchroniseert met CRM systemen.

## Tech Stack
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3
- **Framework:** OpenClaw (agent orchestration), Lobster (workflow), Baileys (WhatsApp)
- **Validation:** Zod 3.22+
- **LLM:** Claude Sonnet 4.5

## Architecture
WhatsApp message → Plugin hook → Lead Intake Agent → Lobster Workflow → CRM API

## Core Files
- `lead-automation-plugin.ts` - Main plugin entry point
- `lead-workflow.lobster` - Lobster workflow definition
- `lead-agent-config.yaml` - Agent configuration
- `whatsapp-channel-config.yaml` - WhatsApp routing config
- `crm-lead-cli.js` - CLI tool for CRM operations
- `.env.template` - Environment variables template

## Environment Variables
```
OPENCLAW_AUTH_SECRET=your_secret
CRM_API_URL=https://your-crm.com
CRM_API_KEY=your_key
SALES_GROUP_JID=whatsapp_group_id
AUTO_APPROVE_LEADS=true/false
```

## Key Patterns
- **Lead validation:** Zod schemas, phone must be E.164 format
- **Approval gate:** Manual approval for leads scoring >= 70
- **CRM retry:** Exponential backoff (3 attempts, 5s initial delay)
- **Session isolation:** Per-account-channel-peer WhatsApp sessions
- **GDPR compliance:** Session indexing disabled, minimal data in memory

## Infrastructure
- Docker Compose setup (CRM mock, OpenClaw gateway, nginx proxy)
- Rate limiting (10 req/s/IP), TLS 1.2+, WebSocket support

## Coding Guidelines
- Use async/await for all async operations
- Add comprehensive error handling for API calls
- Validate all inputs with Zod schemas
- Follow TypeScript strict mode
- Add JSDoc comments for exported functions
- Test with mock CRM before production

## Testing
```bash
# Test CLI
node crm-lead-cli.js upsert --json '{"name":"Test","phone":"+1234567890"}'

# Check logs
docker-compose logs -f
```

## Security Notes
- Never commit `.env` file
- Use E.164 format for phone numbers
- Enable AUTO_APPROVE_LEADS=false in production
- Review GDPR compliance requirements

## Development Workflow
1. Make changes in TypeScript files
2. Plugin compiles automatically
3. Test with WhatsApp test account
4. Verify CRM integration
5. Check Lobster workflow execution

## Common Issues
- Phone format errors → Use E.164 format
- CRM timeouts → Check network/API limits
- Session problems → Clear WhatsApp auth cache
- Memory leaks → Session isolation is enabled
