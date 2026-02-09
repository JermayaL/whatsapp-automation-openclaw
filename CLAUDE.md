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
```
Meta Ads / Lead Forms → Google Sheets (Status="New")
  → Spreadsheet Trigger (30s polling) → OpenClaw Gateway (:18789)
  → WhatsApp Channel (Baileys) → Lead ontvangt bericht
  → Lead response → Filter Agent (priority 100, Claude Sonnet 4.5)
  → 5 kwalificatievragen → Prose Workflow → Human Agent (priority 200)
```

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

# Controleer OpenClaw gateway status
openclaw status --all
openclaw health --verbose
```

## Security Notes
- Never commit `.env` or `google-credentials.json`
- Use E.164 format for phone numbers
- Use `execFile` instead of `exec` for shell commands (no shell interpolation)
- Gateway auth token must be replaced before deployment
- Sanitize lead name/interest data van Google Sheets voor gebruik in berichten
- Agent tools beperkt tot `sessions_send` en `sessions_list` — `bash`, `file_*`, `browser` zijn geblokkeerd
- `allowFrom` whitelist in channel config beperkt inkomende nummers

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
- Missing env vars → Script faalt later met cryptische fout; valideer vars bij startup
- Duplicate berichten → Check `processed-leads.json` integriteit; verwijder niet handmatig
- Google Sheets API errors → Controleer service account permissions en sheet ID

---

## Best Practices: WhatsApp Automation

### Berichten & Rate Limiting
- Respecteer de 2-seconde delay tussen berichten (`delayBetweenMessages: 2000`)
- Nieuwe WhatsApp accounts hebben een limiet van ~50-100 berichten/dag; bouw volume geleidelijk op
- Gebruik `dmPolicy: "pairing"` — stuur alleen berichten naar contacten die eerder interactie hadden
- Houd berichten kort (1-3 zinnen) voor hogere engagement; lange berichten worden niet gelezen
- Stuur geen berichten buiten kantooruren (9:00-21:00 lokale tijd van de ontvanger)

### Phone Number Handling
- Valideer ALTIJD E.164 format voor verzending: `/^\+[1-9]\d{1,14}$/`
- Sla nummers op in E.164 format in de database/sheet (niet `06...` maar `+316...`)
- Gebruik `allowFrom` whitelist in `openclaw.json` om onbekende nummers te blokkeren
- Log nooit volledige telefoonnummers in publieke logs; mask als `+316****5678`

### Session Management
- Sessions verlopen na 48 uur (`ttl: "48h"`) — houd hier rekening mee bij follow-ups
- Maximum 30 turns per sessie (`maxTurns: 30`) voorkomt eindeloze loops
- Elke lead krijgt een geïsoleerde sessie (per-account-channel-peer)
- Sla conversatie-context op buiten de sessie voor langetermijnhistorie

### Foutafhandeling WhatsApp
- WhatsApp-connectie kan verbreken; implementeer reconnect-logica
- Berichten kunnen falen door: ongeldig nummer, geblokkeerd nummer, netwerk timeout
- Update sheet status naar "Failed" met foutdetails bij verzendfouten
- Ga door met volgende lead bij individuele fouten (non-blocking loop)

### Compliance & Privacy
- Vraag altijd toestemming voor je berichten stuurt (opt-in via lead form)
- Bied een opt-out mogelijkheid in elk bericht ("Stuur STOP om te stoppen")
- Bewaar berichten max 30 dagen conform AVG/GDPR
- Versleutel persoonsgegevens (namen, nummers) at rest waar mogelijk

---

## Best Practices: OpenClaw Development

### Agent Configuratie
- Definieer agent prompts in `AGENTS.md` (instructies) en `SOUL.md` (persoonlijkheid) apart
- Beperk agent tools tot het minimum: alleen `sessions_send` en `sessions_list` tenzij meer nodig
- Blokkeer gevaarlijke tools expliciet: `"deny": ["bash", "file_*", "browser"]`
- Gebruik specifieke model-versies (bijv. `anthropic/claude-sonnet-4-5-20250929`) in plaats van aliassen

### Routing & Bindings
- Lagere priority-nummers worden EERST geëvalueerd (100 vóór 200)
- Filter agent op priority 100 vangt alle DMs; specifieke peer-routes op hogere priorities
- Test routing met `openclaw logs --follow` om te zien welke agent berichten ontvangt
- Gebruik `peer.id` matching voor specifieke nummers, `peer.kind: "dm"` voor alle DMs

### Prose Workflows
- Gebruik `{{variable_name}}` templating voor dynamische waarden in steps
- Definieer altijd een `input` en `output` blok in `.prose` bestanden
- Houd workflows lineair waar mogelijk; complexe branching maakt debugging moeilijk
- Test workflows stap-voor-stap met `openclaw logs` voordat je de volledige flow activeert

### Skills Development
- Plaats skill code in `workspace/skills/<skill-name>/`
- Documenteer elke skill in een `SKILL.md` naast de implementatie
- Gebruik `execFile()` (NOOIT `exec()`) voor CLI-aanroepen vanuit skills
- Valideer alle configuratie en environment variables bij skill startup:
  ```javascript
  const required = ['GOOGLE_SHEET_ID', 'GOOGLE_CREDS_PATH'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`);
      process.exit(1);
    }
  }
  ```

### Config Management (`openclaw.json`)
- Dit bestand moet GELDIGE JSON zijn — geen comments, geen trailing comma's
- Gebruik `${ENV_VAR}` syntax voor secrets (bijv. `"apiKey": "${ANTHROPIC_API_KEY}"`)
- Vervang `GENERATE_SECURE_TOKEN_HERE` met een sterk token vóór deployment
- Valideer config na elke wijziging: `python3 -c "import json; json.load(open('config/openclaw.json'))"`

### Monitoring & Debugging
- Live logs: `openclaw logs --follow`
- Gateway status: `openclaw status --all`
- Health check: `openclaw health --verbose`
- PM2 monitoring in productie: `pm2 monit`
- Log op `info` level standaard; gebruik `debug` alleen tijdelijk voor troubleshooting

### Error Handling Patterns
- Gebruik try-catch met graceful degradation (return lege array bij API-fouten)
- Implementeer non-blocking loops: ga door met volgende item bij individuele fouten
- Log fouten met context maar zonder secrets: `console.error('Sheets error:', error.message)`
- Gebruik `process.exit(1)` alleen bij fatale fouten die het hele proces stoppen

### Production Checklist
Controleer vóór deployment:
- [ ] `GENERATE_SECURE_TOKEN_HERE` vervangen in `openclaw.json`
- [ ] `allowFrom` bijgewerkt met productienummers
- [ ] Environment variables geconfigureerd op server
- [ ] `google-credentials.json` aanwezig maar NIET in git
- [ ] PM2 of systemd geconfigureerd voor process management
- [ ] WhatsApp sessie gelinkt via QR-code op de server
- [ ] Rate limits afgestemd op verwacht volume
- [ ] Monitoring en alerts geconfigureerd
