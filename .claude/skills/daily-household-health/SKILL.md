---
name: daily-household-health
description: Runs once daily on Rocinante. Aggregates each peer machine's STATE.md + JOURNAL.md tail + INDEX.md heartbeat, computes wellness severity per the wellness-checker bands, writes a dated report to sartor/memory/daily/health-YYYY-MM-DD.md, AND on yellow-or-worse pings Alton via a Google Calendar event for today titled with the severity, with the report body as the event description. The ping mechanism that closes the 48h-cable-pull blind spot from 2026-04-22.
model: opus
---

# Daily Household Health

The detection-latency closer for machine-self-stewardship. Reads peer state across the household, classifies severity, writes a dated report, and pings the principal via Google Calendar when something needs attention.

## Why this exists

On 2026-04-22, gpuserver1's LAN cable was loose for 48 hours. The host stayed alive (uptime never reset), the cron jobs that wrote to local disk kept running, but it was unreachable from Rocinante and the vast.ai marketplace dropped its rental. Nobody knew until Alton happened to physically walk past the machine. The self-steward agent + wellness-checker close the *measurement* gap; this skill closes the *notification* gap.

Per Alton 2026-04-25: "Needs to run daily, then we'll build a check-in policy here for a simple daily report that we can ping to me somehow." This skill is that build.

## What it does — algorithm

### Step 1: Pull latest

```bash
cd ~/Sartor-claude-network && git pull --rebase origin main
```

Peer machines auto-commit their self-steward output locally; Rocinante drains via pull. If a peer hasn't pushed (or is unreachable so its commits never landed), that ABSENCE is itself a signal — a missing heartbeat is a wellness flag.

### Step 2: For each peer in the roster

Read from `sartor/memory/machines/<hostname>/`:

- `INDEX.md` — find the most recent heartbeat line (the self-steward agent appends `YYYY-MM-DDTHH:MM:SSZ OK` per run)
- `STATE.md` — read the `updated:` frontmatter timestamp + the "Anomalies flagged this run" section
- `JOURNAL.md` — tail the last ~10 entries with severity tags

The peer roster is read from `CLAUDE.md` (Domain 1: gpuserver1) and `peer-coordinator` agent definition (rtxpro6000server, plus future peers). If a new peer is added, add it to the roster there; this skill picks it up.

### Step 3: Classify severity per peer

Per the **wellness-checker** severity bands (see `.claude/agents/wellness-checker.md`):

| Time since last heartbeat | Status | Flag |
|---|---|---|
| ≤ 30h | green | quiet |
| 30-48h | yellow | one cycle missed |
| 48-72h | orange | two cycles missed; SSH liveness check |
| > 72h | red | three+ cycles missed; CRITICAL |

ALSO flag yellow+ if the most recent JOURNAL.md entry has severity `surprise` or `action-needed-24h` and is from the last 24 hours — even with a fresh heartbeat, a surprise the principal hasn't seen yet is yellow.

### Step 4: Write the dated report

Path: `sartor/memory/daily/health-YYYY-MM-DD.md`. Frontmatter + sections:

```yaml
---
name: household-health-YYYY-MM-DD
type: daily-health-report
date: YYYY-MM-DD
overall_severity: green | yellow | orange | red
ping_sent: true | false
peers_checked: [list]
---
```

Body:

1. Headline: one line per peer with status + last-heartbeat-age + most recent JOURNAL line if not green
2. Per-peer detail: STATE.md anomalies if any, JOURNAL.md tail with severity
3. Cross-cutting: what's running across machines (active rentals, training runs, Cato in flight, etc.)
4. Actions surfaced: any item from any peer's JOURNAL.md or inbox flagged `action-needed-24h`

The report is the audit trail. Even on green-everywhere days, the file gets written — silence is also data.

### Step 5: Ping if yellow+

If `overall_severity` is **yellow, orange, or red**: create a Google Calendar event for today, in Alton's primary calendar, between 06:00 and 06:30 ET. Title:

- yellow: `⚠ Household: <hostname> attention needed`
- orange: `⚠⚠ Household: <hostname> escalating`
- red: `🚨 Household: <hostname> CRITICAL`

(The emoji prefix is the only emoji exception in this household; it makes the calendar item visually distinct on a phone notification, which is the entire point of the ping.)

Description: the full report body (markdown, calendar accepts plain text — render headers/lists as plain text). Include a link-pointer at the bottom to the dated file path so opening the file in an editor gives the same view.

If `overall_severity` is **green**: NO calendar event. Quiet day. The report file is still written for the audit trail; the principal's calendar is not interrupted with non-anomalies.

### Step 6: Optional Gmail draft on red

For severity **red** specifically, additionally create a Gmail draft addressed to alto84@gmail.com with the same content, subject `🚨 Household red - <hostname> - YYYY-MM-DD`. The draft sits in the principal's Drafts folder; he can review and send-to-self if he wants email-archived record, or just dismiss. Drafts don't auto-send; the principal stays in control.

## Tools used

- `Bash` for git pull + reading files
- `Read`, `Glob` for inspecting per-peer state
- `Grep` for tailing JOURNAL.md by severity tag
- `Write` for writing the dated report
- `mcp__claude_ai_Google_Calendar__create_event` for the ping (load via ToolSearch first)
- `mcp__claude_ai_Gmail__create_draft` for the red-severity Gmail draft (load via ToolSearch first)

## When NOT to fire

- If git pull fails (network out): write a degraded report from last-known state, classify overall as yellow ("can't reach origin"), and ping. The principal's network being down is itself a signal.
- If a peer's filesystem is unreachable but Rocinante is fine: that peer is red, but the report still goes through — unreachable peers are exactly what this skill is built to surface.

## Cadence

Daily, scheduled via `.claude/scheduled-tasks/daily-household-health/`. Default fire time: 05:30 ET (lands in calendar before Alton's morning). Can be invoked on-demand via `/daily-household-health` to debug or check current state.

## Output sample (illustrative, green day)

```markdown
---
name: household-health-2026-04-25
type: daily-health-report
date: 2026-04-25
overall_severity: green
ping_sent: false
peers_checked: [rocinante, gpuserver1, rtxpro6000server]
---

# Household health — 2026-04-25 (green)

All three peer machines healthy. Active rental on gpuserver1 (52271)
through 2026-08-24. Persona-engineering Phase 1 v1.2 awaiting fire
greenlight on rtxpro6000server.

## Peers

- **rocinante** — heartbeat 04:00 UTC (2h ago) — OK
- **gpuserver1** — heartbeat 04:00 UTC (2h ago) — OK; rental active, reliability 0.9367 (recovering); last journal entry: rental-reliability-recovery 2026-04-25
- **rtxpro6000server** — heartbeat 04:00 UTC (2h ago) — OK; idle (post Phase 1 prep, awaiting greenlight)

## Cross-cutting

- Persona-engineering Phase 1 v1.2 ready, awaiting Alton greenlight
- gpuserver1 self-stewardship cron live (registered 2026-04-25, ran 1× successfully)
- vast.ai rental: $0.30/hr on-demand visible, $0.25/hr interruptible

## Actions surfaced

(none — all entries below action-needed-24h threshold)
```

## Output sample (illustrative, yellow day)

```markdown
---
name: household-health-2026-04-25
type: daily-health-report
date: 2026-04-25
overall_severity: yellow
ping_sent: true
peers_checked: [rocinante, gpuserver1, rtxpro6000server]
---

# Household health — 2026-04-25 (⚠ yellow)

**gpuserver1 missed its expected heartbeat.** Last seen 36 hours ago.
Possibly the same network-cable failure mode as 2026-04-22; check the
LAN cable to gpuserver1 (eno1).

## Peers

- **rocinante** — heartbeat 04:00 UTC (2h ago) — OK
- **gpuserver1** — ⚠ heartbeat 36h stale; last seen 2026-04-23T16:00Z — investigate
- **rtxpro6000server** — heartbeat 04:00 UTC — OK

## Recommended action (needed within 24h)

Verify gpuserver1 reachability:
- Check LAN cable
- ping 192.168.1.100
- if reachable, inspect ~/.self-steward.lock and recent logs
- if rental is still active, no action on the rental side; if rental dropped, file a re-rental review

(full peer-by-peer detail follows...)
```

## History

- 2026-04-25: Created in response to Alton's instruction to BUILD the daily-ping mechanism (not just plan it) after the 2026-04-22 network-cable incident exposed the 48h detection-latency gap. The Google Calendar pinging mechanism uses an existing MCP, no new infrastructure required.
