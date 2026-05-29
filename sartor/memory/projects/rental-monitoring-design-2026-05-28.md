---
type: design-doc
entity: rental-monitoring
created: 2026-05-28
created_by: Rocinante Opus 4.8 (rental monitoring audit synthesis)
status: proposed
motivating_incident: rtxserver power-off 2026-05-28 18:54 EDT — host down ~3h, ~29h rental killed, reliability 0.9748→0.9696, listing price reverted $0.92→$1.00/GPU silently, nothing alerted, Alton found it manually
related: [rental-ops-audit-2026-05-26, daily-household-health, check-registry.py, vastai-tend.sh]
---

# Rental Fleet Monitoring — Design (2026-05-28)

## Motivating incident

On 2026-05-28 at 18:54 EDT (22:54 UTC) rtxserver (machine 124192, dual RTX PRO 6000)
was powered off by a physical power-button press. The box was down ~3 hours. An active
~29h rental was killed; reliability dropped 0.9748→0.9696. On reboot (~01:52 UTC
2026-05-29) the listing price silently reverted from the approved **$0.92/GPU** to the
default **$1.00/GPU**. Nothing alerted the household. Alton discovered it manually.

Three things should have alerted and did not: (a) host went down, (b) rental dropped,
(c) price reverted. None reached Alton for ~3h — in fact for as long as it took him to
look. This document designs the monitor that closes those three holes with the minimum
new code, reusing the plumbing that already exists.

---

## 1. Consolidated inventory

De-duplicated across all five readers. "Alerts how" describes where output lands, not
whether Alton ever sees it (most paths terminate in git-tracked files nobody forwards).

| Artifact | Status | Watches | Runs how | Alerts how |
|---|---|---|---|---|
| `sartor/memory/machines/check-registry.py` | active | Ping + SSH liveness of every REGISTRY host (rocinante, gpuserver1, rtxserver) | Windows Scheduled Task `Sartor Registry Drift Check`, every 4h | inbox file `_memos/registry-drift/*.md`; non-zero exit on STALE/UNREACHABLE |
| `scripts/rental-watch.py` | one-shot | Machine 124192 offer presence, rented flag, dph_total, reliability2 | Manual background process, 60s poll, **exits on first rental or 12h cap** | inbox file `rtxserver-rental-detected-*.md`; log |
| `scripts/peer-send.py` | active | Peer SSH/tmux liveness + OAuth expiry — only at send time | Manual CLI | stderr; peer-sends audit jsonl; non-zero exit if no ack |
| gpuserver1 `vastai-tend.sh` | active | Machine 52271 listed/rented state-change (docker ps C.*) | cron `*/30 * * * *` | inbox `gpuserver1/_vastai/*.md` on transition only — **no price field** |
| gpuserver1 `stale-detect.sh` | active | vastai reachability, GPU temp >80C, disk >85%, heartbeat >5h, idle-rental >72h | cron `0 * * * *` | inbox `gpuserver1/_stale-alerts/*.md`; URGENT-idle.md; TODAY.md append |
| gpuserver1 `gather_mirror.sh` | active | git pull success, GPU/vastai snapshot, heartbeat | cron `0 */4 * * *` | inbox `status/` each run; `alerts/` on pull fail |
| gpuserver1 `rgb_status.py` | active | docker C.* presence, GPU util/temp, who | cron `*/5 * * * *` | local HID only (ARGB), no inbox |
| gpuserver1 `gpu-temp-logger.service` + `gpu-temp-summary.sh` | active | GPU0 temp ~30s CSV; hourly digest | systemd user svc + cron `7 * * * *` | inbox `_temp-summary/` hourly; no alert |
| rtxserver `stale-detect.sh` | active | same as gpuserver1, for 124192 | cron `33 * * * *` | inbox `rtxpro6000server/_stale-alerts/*.md` — **cannot run while host is off** |
| rtxserver `sartol-claude-peer.service` | active | peer tmux session liveness | systemd --user, auto-restart | none (journalctl only) |
| rtxserver `CRONS.md` full suite (gather/stale/vastai-tend/docker-prune) | staged-not-installed | thermal, BMC SEL, power.limit drift, min_chunk invariant | intended cron | intended inbox; NOT installed |
| `.claude/skills/daily-household-health/SKILL.md` | **staged-not-installed** | peer heartbeat age, STATE anomalies, JOURNAL severity, Rocinante services | intended Windows task 05:30 ET | **Google Calendar event on yellow+** — the only path that actually reaches Alton, never registered |
| `.claude/scheduled-tasks/gpu-utilization-check/SKILL.md` | active (spec) | listing active, end_date, rentals, 4h util, GPU health | cron every 4h | file |
| `.claude/agents/self-steward.md` | active on gpuserver1, **not on rtxserver** | hardware/services/rentals/anomalies, BMC sensors+SEL | cron | inbox file |
| `.claude/agents/wellness-checker.md` | active (manual) | peer heartbeat freshness bands, SSH on red | manual / nightly curator | inbox file |
| `.claude/agents/gpu-ops.md` | active (manual) | listing, end_date, rentals, temps, earnings, vastai-alert | manual | inbox file |
| `.claude/agents/sentinel.md` | active (manual) | scheduled-task output, hook health, staleness | manual | file |
| `.claude/agents/gpu-pricing.md` / skills `gpu-pricing-optimizer`, `vastai-market-scan`, `gpu-fleet-check`, `vastai-management`, `rtxserver-management` | active (manual) | market comps, pricing percentile, fleet status | manual | none / analysis only |
| `sartor/memory/machines/{host}/STATE.md, INDEX.md, JOURNAL.md` | **stale/missing** | heartbeat + anomaly trail | self-steward background | none — **rtxserver has no heartbeat files at all** |
| `scripts/sartor-vastai-dispatch.ps1` | staged-not-installed | pricing-action inbox files; autonomy limits | manual, gated on env var | dry-run log / p1 inbox |
| inbox forwarding mechanism | **does-not-exist** | n/a | n/a | **none — nothing forwards inbox files to Alton's devices** |
| `sartor/gateway/gateway_cron.py` | stale/retired | n/a (404 since 2026-04, retired 2026-04-20) | n/a | n/a |

**The structural fact:** Rocinante's `check-registry.py` already pings AND SSH-probes
rtxserver every 4 hours and exits non-zero when it's unreachable. The host-down signal
is half-built. What's missing is (a) cadence fast enough to matter, (b) a price check,
(c) a rental-state check, and (d) an alert path that reaches Alton — and the alert path
(daily-household-health → Google Calendar) is fully specified but never registered.

---

## 2. Gap analysis

### Tonight-incident gaps (the three that bit, plus the alert hole)

**G1 — Nothing detected the host going down. [CRITICAL]**
rtxserver's own crons (stale-detect at :33, gather_mirror at :17) cannot run on a
powered-off box, so host-self monitoring is structurally blind to its own death.
Rocinante's `check-registry.py` *does* detect unreachability — but only every 4h, and
its non-zero exit goes nowhere a human reads. Power-off at 22:54 UTC fell between the
4h drift runs; even on the next run the result was a file, not a ping to Alton.

**G2 — Nothing detected the rental dropping. [CRITICAL]**
`rental-watch.py` fires only when a rental *starts*; it exits and never watches the
*end*. gpuserver1's `vastai-tend.sh` watches 52271, not 124192. rtxserver's `vastai-tend`
is staged-not-installed. The ~29h rental died with no transition event recorded anywhere.

**G3 — Nothing detected the price reverting $0.92→$1.00. [CRITICAL]**
No monitor anywhere queries `dph_total` / listing price and compares it to an approved
value. `vastai-tend.sh` tracks listed/rented booleans only. The dispatch script that
*could* check price is dormant. Price drift on reboot is invisible by construction.

**G4 — No alert reached Alton for ~3h (in practice, until manual discovery). [CRITICAL]**
Every alert path in the fleet terminates in a git-tracked inbox file. The curator that
drains them runs twice daily (07:30 / 19:30 ET) — and `SartorCuratorPass` is itself
not registered. The one path designed to actually notify Alton (daily-household-health
→ Google Calendar event on yellow+) was specified in April and never registered as a
Windows task. There is no SMS/push/email forwarder of any kind. This is the root cause:
even if G1–G3 had each fired, the signal had nowhere to go.

### Secondary gaps

**G5 — rtxserver invisible to the heartbeat stack. [HIGH]**
No STATE.md / INDEX.md / JOURNAL.md; self-steward not deployed there. wellness-checker
cannot flag a machine with no heartbeat file. (Onboarding blocker: kaalia/self-steward
deploy, historically gated on console input.)

**G6 — No reliability-score regression monitor. [HIGH]**
Reliability is the metric vast.ai customers sort on; <0.95 hurts discoverability. The
0.9748→0.9696 drop tonight went unflagged. No cron watches reliability2.

**G7 — No error_description / verification-state monitor. [HIGH]**
Per MEMORY.md, a sticky `error_description` filters the machine out of renter search and
is hard to clear. Nothing watches for it going non-null. Same for verification regression.

**G8 — No idle-rental / zero-earnings detector on rtxserver in practice. [MEDIUM]**
Logic exists in stale-detect (72h marker) but depends on the host's own cron, which is
dead during exactly the outages that cause idleness.

**G9 — No outage-duration / lost-revenue timer. [MEDIUM]**
Nothing records outage start/end or estimates revenue lost. Useful for postmortem and
for deciding whether the box needs a UPS or BIOS power-button lockout.

**G10 — Curator/forwarder pipeline not registered. [HIGH]**
`SartorCuratorPass` and the daily-household-health task both exist as specs and are
unregistered. Until one of them runs, inbox alerts are write-only.

**G11 — Thermal / BMC-SEL / power-cap-drift on rtxserver. [MEDIUM]**
Staged in rtxserver CRONS.md, not installed. The 450W cap is not BIOS-persistent; a
silent drift to default would be invisible.

**G12 — No UPS / power-event capture on rtxserver. [MEDIUM — hardware]**
A physical button press or AC fail has no battery to ride through and no event to send.
Out of software scope but the durable fix for G1's *cause*.

---

## 3. Redundancy / cleanup plan

Scope-discipline applies: recommend, do not delete. Flag overlaps and dead weight; leave
load-bearing or ambiguous items for Alton to call.

**`scripts/rental-watch.py` is NOT a durable monitor — and must not be mistaken for one.**
It is a one-shot 12h watcher that **exits on the first rental detection** (line 153) or
after 720 iterations. It cannot catch a rental *ending*, a host going *down*, or a price
*reverting* — by design it has already exited by then. It was the right tool for its job
(watch for first rental while Alton was away on 2026-05-26) and its state/log files are a
useful record. **Recommendation:** keep it as a manual one-shot tool; explicitly demote it
in docs from "monitor" to "first-rental spot-watcher"; do NOT extend it into the durable
watchdog — the polling-loop-that-exits shape is wrong for durability. The new watchdog
(§4) supersedes its monitoring role.

**Overlapping host-liveness checks.** `check-registry.py` (ping + SSH, 4h) and the
new watchdog (§4) both probe reachability. These are *complementary*, not redundant:
keep check-registry as the slow, REGISTRY-writing-back, whole-fleet drift detector;
the watchdog is the fast rental-focused one. Avoid duplicating the REGISTRY write-back —
the watchdog should be read-only against REGISTRY.

**Overlapping vastai state-change watchers.** `vastai-tend.sh` (gpuserver1, installed)
and the staged rtxserver `vastai-tend.sh` overlap with the watchdog's rental-state check.
**Recommendation:** the watchdog covers rtxserver's rental+price+reliability from the
Rocinante side; do NOT also install the staged rtxserver `vastai-tend.sh` purely for
rental state — that would double-alert. Keep the staged rtxserver suite's *thermal /
BMC / docker-prune* pieces (those are host-local and not covered by a Rocinante watcher);
drop or defer its `vastai-tend.sh` to avoid duplication.

**Dead / retired.** `sartor/gateway/gateway_cron.py` is retired (404 since 2026-04,
cron commented since 2026-04-12). **Recommendation:** safe-delete candidate — flag to
Alton, do not remove unilaterally; it's referenced in retirement notes that may want the
file present for provenance.

**Stale heartbeat templates vs. reality.** `STATE.md/INDEX.md/JOURNAL.md` are missing
for both peers despite templates existing. Not redundant — *unbuilt*. Folds into G5/G10
(deploy self-steward), not cleanup.

**Many manual agents/skills observe the same fleet** (gpu-ops, gpu-fleet-check,
gpu-pricing, vastai-management, sentinel, wellness-checker). These are on-demand analysis
tools, not monitors, and don't conflict. No cleanup needed; just don't expect them to alert.

Net deletes proposed (all flagged-to-Alton, none unilateral): `gateway_cron.py`. Net
demotes: `rental-watch.py` reclassified to spot-watcher. Net "do-not-install": staged
rtxserver `vastai-tend.sh` (keep the rest of that suite).

---

## 4. Proposed watchdog design

**Name:** `scripts/fleet-watchdog.py` (Python 3, stdlib + PyYAML, lives in `scripts/`
alongside the existing Rocinante scripts).

**Where it runs:** **Rocinante**, as a Windows Scheduled Task. This is the established
durable pattern (registry-drift, mirror, creds-sync all run this way) and — decisively —
**a Rocinante-side watcher survives an rtxserver outage; an rtxserver-self cron does
not.** Tonight's incident is the proof: rtxserver's own crons went dark the instant the
box lost power. The watchdog must live on the witness, not the patient. It reaches the
vast.ai API the same way `rental-watch.py` does: `ssh alton@gpuserver1 "~/.local/bin/vastai ..."`
(gpuserver1 holds the authenticated CLI; this also means vast.ai queries survive an
rtxserver outage). It pings/SSH-probes rtxserver directly from Rocinante for host-down.

**Cadence:** every **10 minutes**. Fast enough that the worst-case host-down blind window
is ~10 min instead of ~4h (drift) / ~30 min (vastai-tend) / unbounded (tonight). Cheap:
one ping + two SSH-mediated vastai calls per run.

**What it checks each run** (machine 124192 = rtxserver; trivially generalizable to 52271):

1. **Host-down:** ping `current_ip` from REGISTRY (reuse `check-registry.py:ping()`),
   plus a 5s `ssh BatchMode` probe (reuse `ssh_probe()`). Two consecutive failures = DOWN
   (one missed ping shouldn't page).
2. **Rental state:** `vastai show machines --raw`, read `current_rentals_running` /
   `current_rentals_on_demand` (same fields `rental-watch.py` already parses). Transition
   ≥1→0 = rental dropped; 0→≥1 = rental started.
3. **Listing price drift:** `vastai search offers 'machine_id=124192' --raw`, read
   `dph_total`. Compare to an **approved-price file** (`sartor/memory/business/approved-pricing.yaml`,
   new, one line per machine: `124192: 2.76  # $0.92/GPU × 3 ... revert tolerance ±$0.05`).
   Any deviation beyond tolerance = PRICE DRIFT. (Tonight: $2.76 approved vs $3.00 default.)
4. **Reliability regression:** read `reliability2` from the offer. Alert on crossing
   below **0.95** (warn) or **0.90** (critical), and on any single-run drop >0.01.
5. **error_description non-null:** read it from the machine record; non-null = alert
   (per MEMORY.md, this silently delists the machine and is a support-ticket path).
6. **Thermal (best-effort):** if host is up, read GPU temp via the existing offer/machine
   fields; alert >85C. (Deep BMC/SEL stays host-local — that's the staged rtxserver suite.)

**State-change-only, like vastai-tend.sh.** Persist last-seen values to
`sartor/memory/projects/fleet-watchdog-state.json`. Alert **only on transitions** — no
spam on steady state. Down-debounce (2 consecutive fails) and recovery events both fire
(DOWN, then RECOVERED with outage duration → closes G9).

**Alert thresholds → severity bands** (reuse daily-household-health's green/yellow/orange/red):
- **RED (page now):** host DOWN ≥2 runs while a rental was active; reliability <0.90;
  error_description non-null.
- **ORANGE:** host DOWN with no active rental; rental dropped unexpectedly; price drift;
  reliability <0.95; GPU >85C.
- **YELLOW:** rental started (informational-positive); price drift within tolerance edge.
- **GREEN:** all nominal — write state, no alert.

**Alert transport — reuse existing plumbing, two channels:**
1. **Inbox file** (always, for the record): write a transition note to
   `sartor/memory/inbox/rocinante/fleet-watchdog/<UTC>.md` with severity frontmatter.
   This is what curator/morning-briefing already know how to read.
2. **Google Calendar event** (orange+ only, the path that reaches Alton's phone):
   create a same-day event titled `[ORANGE] rtxserver rental drop` / `[RED] rtxserver DOWN`
   with the transition detail in the description — **exactly the mechanism daily-household-health
   already specifies.** Reuse that skill's calendar-ping helper rather than writing new
   notification code. Because the watchdog runs every 10 min on Rocinante (which has the
   Calendar MCP / OAuth), the event lands within ~10 min of onset, not next morning.

**Reuse vs. new code:**
- Reuse: `ping()` and `ssh_probe()` from `check-registry.py`; the vastai-query +
  field-parsing pattern from `rental-watch.py`; the state-JSON + transition-only pattern
  from `vastai-tend.sh`; the GCal-ping from daily-household-health.
- New: ~150 lines gluing those together in a *durable loop-less* script (one pass per
  scheduled invocation — the Windows task provides the cadence, the script does NOT
  `sleep`-loop like rental-watch.py; that's what makes it survive reboots and not pin a
  process). Plus the small `approved-pricing.yaml`.

This is deliberately the minimum that closes G1–G4, G6, G7, G9. It does not attempt G5
(self-steward deploy), G11 (host-local thermal/BMC), or G12 (UPS) — those are separate
tracks noted in the build plan.

---

## 5. Build plan

Ordered. Steps flagged **[DECISION]** need Alton's call before proceeding; the rest are
build-forward per scope-discipline (investigation→construction, no second "should we").

1. **Write `sartor/memory/business/approved-pricing.yaml`** seeded with `124192: 2.76`
   (the approved $0.92/GPU) and `52271:` gpuserver1's current approved rate, with a
   tolerance field. Source of truth for the price-drift check. *(15 min, no decision.)*

2. **Write `scripts/fleet-watchdog.py`** per §4: import-and-reuse ping/ssh_probe, vastai
   query, state-JSON transition logic, severity banding, inbox-file writer. *(2–3h.)*

3. **Add the GCal-ping** by extracting daily-household-health's calendar-event helper into
   a tiny shared function the watchdog imports (so there is one notification implementation,
   not two). *(30–60 min.)*

4. **Dry-run** the watchdog manually for several passes against live state: confirm it
   reads 124192's rental/price/reliability correctly, confirm transition detection (toggle
   the approved-price file to force a drift alert and verify the GCal event appears).
   Evidence-based-validation: do not claim it works until a forced-drift run produces a
   real calendar event. *(30 min.)*

5. **[DECISION] Cadence + task-fold choice.** Two options:
   (a) **New Windows Scheduled Task** `SartorFleetWatchdog`, every 10 min — cleanest, my
   recommendation; or (b) **fold into the existing 4h `gpu-utilization-check`** — reuses a
   task but keeps the 4h blind window, which is the exact thing tonight proved too slow.
   I recommend (a) at 10-min cadence. Alton to confirm cadence and new-vs-fold.

6. **Register the task** (XML in `scripts/`, `Register-ScheduledTask` per the rocinante
   CRONS.md pattern). Run as `alton` (interactive token) so the Calendar MCP/OAuth is
   available, matching SartorGmailScan/MorningBriefing. *(15 min once decision made.)*

7. **Register the missing forwarder backbone — [DECISION] which one.** Independent of the
   watchdog's own GCal ping, the inbox alerts from *every* source still need draining.
   Either register `SartorCuratorPass` (twice-daily drain) or finally register the
   `daily-household-health` Windows task (05:30 ET, GCal on yellow+). I recommend
   registering **daily-household-health** now (it's the designed escalation backbone and
   one PowerShell command away) AND noting curator-pass remains blocked on its missing
   `.cmd`/module files. Alton to confirm. *(15 min + the dependency fixes for curator.)*

8. **Demote `rental-watch.py` in docs** to "first-rental spot-watcher" and add a one-line
   header note that it is not a durable monitor (superseded by fleet-watchdog for
   monitoring). *(10 min, no decision.)*

9. **[DECISION — hardware/BIOS] Power-button + UPS.** The watchdog detects the *symptom*;
   it does not prevent the *cause*. Two durable fixes need Alton: (a) disable/lock the
   rtxserver front power button in BIOS (or physically guard it) so an accidental press
   can't kill a rental; (b) add a small UPS so brief power events ride through and an
   event can be logged. Both out of software scope; flagged for Alton's decision.

10. **Defer / separate track:** deploy self-steward + heartbeat files on rtxserver (G5);
    install the *thermal/BMC/docker-prune* pieces of the staged rtxserver cron suite (G11),
    explicitly NOT its duplicative `vastai-tend.sh`. These improve depth but are not on the
    critical path for tonight's three holes.

**Success criterion:** a forced price-drift or simulated host-down produces a Google
Calendar event on Alton's calendar within ~10 minutes, and a transition note in
`inbox/rocinante/fleet-watchdog/`. Until that round-trip is demonstrated, the gap is not
closed.
