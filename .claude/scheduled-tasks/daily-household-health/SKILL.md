---
name: scheduled-daily-household-health
description: Scheduled daily household-health check at 05:30 ET — invokes the daily-household-health skill which aggregates peer self-steward state, classifies severity, writes a dated report, and pings Alton via Google Calendar event on yellow-or-worse anomalies. The detection-latency closer for the machine-self-stewardship project, in response to the 2026-04-22 48h-network-cable-incident.
model: sonnet
schedule: "30 9 * * *"
schedule_tz: UTC
---

# Scheduled Daily Household Health

Runs daily at 05:30 ET (09:30 UTC) — early enough to land in Alton's calendar before his morning routine, late enough that all peer self-steward crons (which fire at 03:00 ET / 07:00 UTC) have completed and committed their state.

## Steps

1. Invoke the `daily-household-health` skill (full spec at `.claude/skills/daily-household-health/SKILL.md`).
2. The skill will:
   - `git pull --rebase origin main` to drain peer commits
   - Read each peer's `machines/{hostname}/STATE.md` + `JOURNAL.md` + `INDEX.md` heartbeat
   - Classify severity per the wellness-checker bands
   - Write `sartor/memory/daily/health-YYYY-MM-DD.md`
   - On yellow-or-worse: create a Google Calendar event for today 06:00-06:30 ET in Alton's primary calendar with the report as the description (this is the ping)
   - On red specifically: also create a Gmail draft (does NOT send; the principal stays in control)
3. Commit the dated report to git.
4. Push to origin.

## Severity-aware behavior

- **green** day: write the report to `daily/`, commit, exit. No calendar event, no Gmail draft, no ping. The principal's morning isn't interrupted by non-news.
- **yellow** day: write report + create calendar event titled `⚠ Household: <hostname> attention needed`. The event description carries the full report so Alton can read it off his phone notification.
- **orange** day: same as yellow with title `⚠⚠ Household: <hostname> escalating`. Skill should also attempt SSH liveness checks against any orange peer.
- **red** day: same as orange + create Gmail draft (subject `🚨 Household red - <hostname> - YYYY-MM-DD`) for archived record.

## Failure modes

- **Git pull fails** (Rocinante can't reach origin): the skill writes a degraded report from local state and classifies as yellow; the calendar event surfaces "can't reach origin" as the headline. The principal's network being out is itself a signal.
- **Google Calendar MCP fails**: the skill writes the report file anyway, classifies as yellow if not already higher, and adds a marker `ping_sent: false  # MCP failure` to the report frontmatter. Next morning Alton sees the missed ping in the report tail.
- **The skill itself fails**: the scheduled-task wrapper logs the failure to `data/scheduled-tasks/daily-household-health.log`. The next morning's run picks up. If two consecutive runs fail, the day-3 run should treat that as orange.

## Manual invocation

`/daily-household-health` invokes on demand. Use it to spot-check after a deploy, after fixing a flagged peer, or just to confirm the green-day quiet behavior.

## History

- 2026-04-25: Registered in response to Alton's instruction to build the daily-ping mechanism for machine-self-stewardship.
