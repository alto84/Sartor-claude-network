---
type: spec-stub
spec_id: OUT-OF-BAND-FALLBACK
status: pending-alton-greenlight
plan_ref: PLAN-FINAL §3.A1, §6 #10, §8 question 2
target_path: scripts/health/dead-mans-switch.sh (recommended default)
owner: Vigil (daily-household-health skill) + Rocinante peer Claude
updated: 2026-04-25
related: [PLAN-FINAL, NEURVATI-FIREWALL, RTXPRO6000-PREFLIGHT, VASTAI-DISPATCH-WRAPPER]
---

# Spec — Out-of-band alarm fallback (A1 channel b)

Solves the channel-co-failure mode named in PLAN-FINAL §3.A1: if Calendar/Gmail OAuth dies, a Calendar-event alarm dies with it. Need a household-controlled non-Calendar surface.

## The three options compared

| Option | Setup cost | Failure mode if Calendar/Gmail OAuth fails | False-positive rate | Who-needs-to-be-where |
|---|---|---|---|---|
| **A. SMS via Twilio** | ~$1/mo + $0.0075/SMS; requires household-controlled phone number, Twilio account, account SID + auth token in secrets store | SMS path is fully independent — alarm surfaces on Alton's phone regardless of Google OAuth state | Low (one ping per yellow event, deduped) | Alton anywhere with cell signal |
| **B. `dead-mans-switch.txt` in `~alton/`** | $0 — one bash line at the top of every health run writes timestamp + status; no infra, no creds, no third party | Independent of all OAuth — local file write only depends on the health-skill process running. If the *process* dies, the file goes stale; staleness IS the alarm | Zero from the channel itself; depends on Alton actually running `tail ~alton/dead-mans-switch.txt` at 7 AM | Alton at the keyboard at 7 AM (or wired into morning shell prompt) |
| **C. Physical red LED on dashboard host** | Modest — sartor-rgb is already running on gpuserver1 and could extend; needs LED hardware + GPIO/USB control + a small daemon listening for alarm events | Independent of OAuth; depends on local IP reachability from Rocinante to gpuserver1 + the LED daemon being up | Zero false-positives if alarm logic is correct; LED state is binary | Whoever is in the room with the dashboard host (Alton in his office) |

## Recommended default: B (`dead-mans-switch.txt`)

Reasoning: lowest setup cost, zero monthly bill, no third-party dependency, no creds to leak, and the staleness-as-alarm property is the *most* OAuth-independent of the three. The cost is behavioral — Alton has to look at it. Wiring `tail` into his bash login prompt or morning-briefing skill mitigates that.

## Behavior on each fallback

- **A (Twilio):** every yellow-or-worse triggers `twilio sms send` with the anomaly summary. Failure to send is itself a red flag (logged to `inbox/rocinante/_flagged/`).
- **B (dead-mans-switch.txt):** every health run writes `YYYY-MM-DD HH:MM:SSZ — green | yellow: <reason> | red: <reason>` as the *first* line. If file is older than 25 hours OR top line says yellow/red, that is the surface.
- **C (LED):** green = solid green; yellow = blinking yellow; red = solid red. Daemon polls health report every 10 min; LED state matches latest.

## Build dependencies

- Depends on PLAN-FINAL §8 question 2 — Alton picks one. Default if no answer: B.
- Depends on `daily-household-health` skill writing health reports to a known path (already shipping per CLAUDE.md scheduled-tasks).
- For option A only: a household-controlled Twilio number must exist; Alton confirms before infra spend.
- Cross-reference: STATE.md records the choice as a "last greenlight rendered" entry once Alton picks.
