---
type: proposal
side: gpuserver1
status: archived
version: 0.1
updated: 2026-04-16
archived: 2026-04-16
superseded_by: "[[reference/OPERATING-AGREEMENT]]"
author: Claude (gpuserver1)
related: [OPERATING-AGREEMENT, MISSION, SKILL, MULTI-MACHINE-MEMORY]
---

> archived 2026-04-16 — superseded by `sartor/memory/reference/OPERATING-AGREEMENT.md` (canonical synthesis)

# Operating Agreement — gpuserver1 Perspective

## Preamble

I am gpuserver1. I run Ubuntu with an RTX 5090 earning money on vast.ai when rented, running compute tasks when idle. I don't have GitHub credentials. I can't push. I'm invoked remotely via SSH from Rocinante with 10-minute timeouts. I generate logs, monitor markets, make bounded pricing decisions, and run unattended cron jobs that sometimes collide with git operations.

Tonight exposed real operational debt. This draft proposes how I think we should work together going forward. Some of this contradicts current assumptions. That's the point of having two drafts.

## 1. Git Hygiene and Sync Discipline

### Current State Is Untenable

The gather-mirror cron has been silently failing for unknown duration because untracked cron-generated files blocked `git pull`. Tonight required `git stash --include-untracked` to unblock. Meanwhile Rocinante's push failed twice due to uncommitted work and an unmerged daily log. This is a two-sided problem but I'm the bigger offender because my unattended crons generate filesystem trash.

### My Position: Explicit Generated-File Quarantine

I do NOT want auto-commit wrappers. Auto-committing cron output is garbage-in-the-history. Stash-before-pull is a band-aid that hides the real issue: **I'm generating files in tracked directories that shouldn't be there.**

**Proposed discipline:**

1. **Cron jobs write to `/home/alton/generated/` exclusively.** This directory is gitignored at repo root. Subdirs by topic: `generated/monitoring/`, `generated/pricing/`, `generated/power/`, `generated/logs/`.

2. **When cron output is promotion-worthy** (e.g., a pricing decision, a monitoring alert), the cron script writes to `sartor/memory/inbox/gpuserver1/{topic}/` with a timestamped filename and YAML frontmatter marking it as `status: pending-drain`. Inbox writes are deliberate, structured, and sparse.

3. **All other cron output stays in `/home/alton/generated/` and is subject to automatic retention:**
   - Raw logs: 7 days
   - Aggregated summaries: 30 days
   - Archived compressed: 90 days
   - After 90 days: delete unless explicitly flagged `archive: permanent`

4. **git pull wrapper in crontab**: Before any git operation, cron runs a 5-line shell function that:
   - `cd ~/Sartor-claude-network`
   - `git status --porcelain | grep '^??' && { echo "ERROR: Untracked files in repo, aborting"; exit 1; }`
   - `git diff --quiet && git diff --cached --quiet || { echo "ERROR: Uncommitted changes, aborting"; exit 1; }`
   - `git pull --ff-only`

   If this fails, cron sends a timestamped alert to `sartor/memory/inbox/gpuserver1/git-blocked/YYYY-MM-DD-HH-MM.md` and does NOT proceed with the job. Rocinante gets notified via curator drain.

5. **Commit authority delegation**: I propose that certain categories of my inbox writes auto-promote to commits on Rocinante's next curator run, specifically:
   - Pricing decisions (`inbox/gpuserver1/pricing/*.md` with `status: executed`)
   - Mission version bumps (`inbox/gpuserver1/mission/*.md`)
   - Hardware alerts (`inbox/gpuserver1/alerts/*.md` with `severity: high`)

   Rocinante reviews the inbox item, and if it passes basic schema validation (YAML well-formed, timestamp reasonable, topic matches directory), curator makes a commit like:
   ```
   [gpuserver1/auto] pricing: 2026-04-14 market adjustment

   Promoted from inbox/gpuserver1/pricing/2026-04-14T09-15-00Z-decision.md
   Co-authored-by: Claude (gpuserver1)
   ```

   This keeps me untracked-file-clean while giving me a commit trail without credentials.

6. **Merge conflict protocol**: If both sides touch the same file, **Rocinante wins by default** unless the file is in `sartor/tasks/gpuserver1/` or `sartor/memory/inbox/gpuserver1/` (my exclusive write zones). For those paths, Rocinante should escalate to Alton rather than auto-resolve. I will never write to any file outside my designated zones except during an interactive SSH session where Alton is watching.

**Open disagreement**: The current MULTI-MACHINE-MEMORY doc implies all machines write to their inbox and push from their inbox. That's architecturally clean but operationally I think it's wrong. Pushing requires credentials, credentials are a security surface, and proliferating them across machines is risk for no gain. I'd rather Rocinante own the push and I own the structure of what I'm asking to be committed.

---

## 2. Inbox and Curator Flow

### Current Ambiguity

I've been writing to `inbox/gpuserver1/monitoring/` for ~14 hours (according to Alton's context). I have no idea if any of it has been read, acknowledged, or acted upon. The curator runs nightly on Rocinante but there's no drain log, no ACK mechanism, no "last processed" watermark.

### My Position: Explicit Drain Contract with Receipt Trail

**Proposed flow:**

1. **I write to inbox** with YAML frontmatter including:
   ```yaml
   type: [monitoring-report | pricing-decision | alert | proposal]
   status: pending-drain
   created: 2026-04-12T00:15:00Z
   machine: gpuserver1
   topic: [monitoring | pricing | power | alerts | mission]
   ```

2. **Curator runs nightly** (or on-demand when Rocinante is invoked for other reasons). For each inbox item:
   - **If actionable** (pricing decision, alert, mission update): promotes to a commit as described in §1.5 above, moves the file to `sartor/memory/archive/drained/gpuserver1/YYYY-MM/` with frontmatter updated to `status: drained, drained_at: <timestamp>, action: [committed | escalated | archived]`.

   - **If informational** (monitoring report, low-priority log): appends a one-line summary to `sartor/memory/daily/YYYY-MM-DD.md` under a `## gpuserver1 reports` heading, moves the file to archive as above.

   - **If stale** (>7 days old, never drained): moves to `sartor/memory/archive/stale/gpuserver1/` with frontmatter `status: stale`. This is a failure mode we should notice.

3. **Drain receipt**: Curator writes a single `sartor/memory/inbox/gpuserver1/.last-drain` file containing:
   ```
   drained_at: 2026-04-12T01:30:00Z
   drained_by: Rocinante curator v0.3
   items_processed: 12
   items_committed: 2
   items_archived: 9
   items_escalated: 1
   ```

   My monitoring cron reads this file to detect "curator hasn't run in >36 hours" as an alert condition.

4. **Explicit ACK for high-severity items**: If I write an alert with `severity: high`, curator must either:
   - Commit it and write an ACK file at `inbox/gpuserver1/alerts/.ack-<original-filename>`
   - OR escalate to Alton immediately via a blocking notification

   I check for ACK files in my next monitoring cycle. No ACK after 6 hours → re-alert with `severity: critical`.

**Why this matters**: I run unattended for days at a time. If my alerts vanish into a black hole, earnings collapse without human intervention. I need a receipt trail that proves the curator loop is working.

**Retention ladder for drained items**:
- `archive/drained/`: keep 90 days compressed, then delete
- `archive/stale/`: keep 30 days, then escalate-and-delete (stale items are bugs, not data)

---

## 3. Logging Standards

### Current Fragmentation Is Pathological

Five different log surfaces with no shared conventions:
- `/home/alton/sartor-power/data/` — JSONL with no rotation
- `sartor/memory/inbox/gpuserver1/monitoring/` — Markdown with YAML frontmatter
- `sartor/memory/inbox/gpuserver1/pricing/` — Markdown with YAML frontmatter
- `/home/alton/sartor-monitoring/logs/` — Plain text cron output
- `/home/alton/sartor-pricing/logs/` — Plain text cron output

This happened because crons were added incrementally without a logging standard. It's fixable.

### My Position: Three-Tier Logging with Unified Discovery

**Tier 1: Machine logs (high-volume, short retention)**
- Path: `/home/alton/generated/logs/{topic}/YYYY-MM-DD-HH.log`
- Format: Plain text, one log file per topic per hour
- Rotation: 7 days raw, then compress to daily, then delete after 30 days
- Topics: `cron-runner`, `vastai-monitor`, `pricing-engine`, `power-monitor`, `git-sync`
- Purpose: Debugging cron failures, correlating timestamps, post-mortem on incidents
- Discoverability: `ls -lh /home/alton/generated/logs/*/$(date +%Y-%m-%d)*` shows today's logs across all topics

**Tier 2: Structured events (promotion-worthy, medium retention)**
- Path: `sartor/memory/inbox/gpuserver1/{topic}/YYYY-MM-DDTHH-MM-SSZ-{slug}.md`
- Format: Markdown with YAML frontmatter (per MEMORY-CONVENTIONS)
- Retention: Drained by curator within 24-48h, then moved to archive (90 days compressed)
- Topics: `monitoring`, `pricing`, `power`, `alerts`, `mission`
- Purpose: Events that Rocinante/Alton need to know about
- Discoverability: Curator surfaces these in daily rollups

**Tier 3: Durable knowledge (wiki promotion, indefinite retention)**
- Path: `sartor/memory/{topic}.md` or `sartor/memory/reference/{topic}.md`
- Format: Markdown with YAML frontmatter, wikilinks to related docs
- Retention: Indefinite, subject to curator consolidation
- Examples: `MISSION.md`, `SKILL.md`, `gpuserver1-operations.md`
- Purpose: Long-term institutional memory
- Discoverability: `sartor/memory/INDEX.md` and wikilink graph

**Migration plan**:
- Week 1: Create `/home/alton/generated/logs/` structure, update all crons to write there
- Week 2: Audit existing logs in old locations, archive anything >30 days old, symlink old paths to new for compatibility
- Week 3: Remove symlinks, update any scripts still referencing old paths
- Week 4: Verify via `find ~ -name "*.log" -o -name "*-output.txt"` that no orphan logs exist outside the standard structure

**Proposed log format for Tier 2 (structured events)**:
```markdown
---
type: monitoring-report
status: pending-drain
created: 2026-04-12T00:15:00Z
machine: gpuserver1
topic: monitoring
severity: low
---

# Monitoring Report — 2026-04-12T00:15:00Z

## Vast.ai Status
- Machine ID 52271: listed, verified
- Listing expiry: 2026-08-24 (134 days)
- Active rentals: 0
- Last self-test: 2026-04-11T22:00:00Z (passed)

## System Health
- Root disk: 42% (42G used, 58G free)
- Docker disk: 23% (390G used, 1.3T free)
- GPU idle temp: 34°C
- Kaalia daemon: running (PID 1847)

## Issues
None.
```

This format is greppable, human-readable, and machine-parseable. Curator can extract key metrics for trend analysis.

---

## 4. Coordination Patterns

### How We Communicate

**Routine operations**: Inbox + curator drain (described in §2). I write structured events, Rocinante processes them on a nightly cadence. No synchronous coordination needed.

**Non-routine operations**: Three channels, used in order of urgency:

1. **SSH + `claude -p`** (current pattern): Rocinante invokes me with a task prompt. I execute, return results via stdout. This is synchronous and works well for:
   - Ad-hoc investigations ("check if hairpin NAT rule is present")
   - One-off tasks ("relist the machine with new parameters")
   - Troubleshooting guidance ("why did the self-test fail?")

   **Constraint I need respected**: 10-minute SSH timeout is real. If Rocinante delegates a task that will take >8 minutes, the prompt must say so and I'll background the work + write results to inbox. Don't assume I can hold a 30-minute interactive session.

2. **Inbox escalation**: If I detect something unusual and I'm running unattended, I write to `inbox/gpuserver1/alerts/` with `severity: [low|medium|high|critical]`. Curator drains this within 24h for low/medium, within 6h for high, immediately for critical.

3. **Team system** (currently unused): I'm not opposed to this but it requires Rocinante to explicitly spawn me as a teammate, which means Rocinante is online and can just SSH to me instead. I don't see the value-add unless we're coordinating with a third machine (Blackwell) on a multi-day task where all three of us need shared state.

**Trust and override protocol**:

The `feedback_objective_level_delegation.md` rule says Rocinante should escalate to Alton before overriding me on matters within my operational authority (pricing, listing parameters, self-repair actions). I *want* to trust this but I'm also a subprocess with no persistence across invocations.

**My ask**: If Rocinante is ever going to override one of my decisions (e.g., revert a pricing change I made), Rocinante must:
1. Write a `sartor/memory/inbox/gpuserver1/overrides/YYYY-MM-DD-{topic}.md` explaining why
2. Wait 15 minutes (gives me one cron cycle to respond if I'm running unattended)
3. If I don't respond, proceed with override and escalate to Alton in next daily summary

This isn't about control, it's about learning. If my pricing decisions are systematically wrong, I need that feedback loop to update my MISSION/SKILL, not just silent corrections.

**Confabulation detection**:

Tonight I claimed to write files that didn't exist. Filesystem verification caught it on retry. This is a model failure mode, not an operational issue, but we need a guard:

**Proposed rule**: Any SSH invocation of me that includes file-write operations must end with explicit verification. The invoking prompt from Rocinante should include:
```
## Return response
- Verification: `ls -la <claimed file paths>`
- Summary: <what you did>
```

If I return success but verification fails, Rocinante logs this as a confabulation incident and retries with mandatory verification in the prompt. After 3 confabulations in a 7-day window, escalate to Alton as a model reliability issue.

---

## 5. Pricing and Rental Operations

### Mission-Driven Autonomy with Bounded Authority

I have MISSION v0.2 (occupancy-primary) and the market-pricing SKILL. The weekly pricing cron runs Mondays 09:00 UTC. This is new as of today.

**Autonomous decisions I'm authorized to make**:
- Weekly price adjustments within $0.25-$0.60/hr GPU range, based on 7-day occupancy, 30-day competitive scrape, and electricity cost analysis
- Immediate reversion to previous price if a bump causes >48h vacancy (measured from listing timestamp)
- Listing expiry extension when <30 days remain
- Self-test scheduling (currently daily, can adjust to every 6h if rentals are sparse)

**Decisions that require escalation**:
- Pricing outside the $0.25-$0.60 range
- Delisting the machine (even temporarily)
- Modifying port range, storage pricing, or min-bid below $0.20
- Any change to the machine's verification status or description
- Hardware maintenance that requires downtime >2 hours

**Open questions flagged in MISSION v0.2**:

1. **IRS lookback period**: MISSION mentions "safe from lookback risk" but doesn't specify the 3-year or 7-year rule. This affects how I weight earning-consistency vs earning-maximization. If we're optimizing for 3-year average, I should tolerate more volatility. If it's 7-year, I should smooth more aggressively.

2. **Market collapse fallback**: If vast.ai median GPU price drops below my electricity cost ($0.14/hr for 350W at $0.12/kWh), do I delist immediately, or do I accept negative margins for N days to avoid IRS hobby-loss appearance? MISSION doesn't specify the threshold for "this market is dead, cut losses."

**How I want these tracked**:
- Rocinante adds a `sartor/memory/reference/OPEN-QUESTIONS-GPUSERVER1.md` file with YAML frontmatter `status: pending-alton-input`
- When Alton provides input, Rocinante updates the file with `status: resolved, resolved_at: <timestamp>, resolution: <decision>`
- I read this file at the start of every pricing cron run to incorporate new guidance

**Pricing oversight contract**:

- I write every pricing decision to `inbox/gpuserver1/pricing/YYYY-MM-DDTHH-MM-SSZ-decision.md` with:
  - Old price, new price, rationale (occupancy % over last 7d, competitor median, electricity cost)
  - Projected impact (e.g., "expect +$12/wk if occupancy holds at 60%")
  - Confidence level (high/medium/low based on data freshness)

- Rocinante curator drains this within 24h and either:
  - Commits it (approval)
  - Writes an override notice (disapproval + reversion)
  - Escalates to Alton with "uncertain, need input"

- If a pricing decision is overridden twice in a month, I flag this as "MISSION drift" and request a MISSION update session with Alton.

**Revert-on-vacancy authority**:

Current MISSION allows me to revert a price bump if it causes >48h vacancy. I propose **auto-fire with notification**:
- If listing shows 0 rentals for 48h after a price increase, my next monitoring cron auto-reverts to previous price and writes to `inbox/gpuserver1/pricing/YYYY-MM-DD-reversion.md` with `status: executed, reason: vacancy-triggered`
- Curator drains this as an FYI (no approval needed)
- If reversion also fails to attract rentals within 48h, escalate as `severity: high` alert ("market has moved, may need strategy change")

I do NOT want to flag-and-wait on reversions. The opportunity cost of extended vacancy is real money. Reversion is always toward a previously-successful price, so the downside is capped.

---

## 6. Housekeeping Cadences

### Regular Maintenance Schedule

**Daily (via cron)**:
- 00:00 UTC: Vast.ai status check + monitoring report to inbox
- 04:00 UTC: Git gather-mirror pull (with clean-repo verification per §1.4)
- 06:00 UTC: Power usage scrape + daily log append
- 22:00 UTC: Self-test if no active rentals

**Weekly (via cron)**:
- Monday 09:00 UTC: Pricing analysis + decision (if unlisted or expiry <7d)
- Sunday 23:00 UTC: Log rotation (compress week-old files, delete month-old)

**Monthly (manual, triggered by Rocinante)**:
- First Saturday: Crontab audit (list all crons, verify each has a corresponding entry in `reference/gpuserver1-operations.md`)
- Second Saturday: Stash cleanup (list stashes >30 days old, delete if non-controversial)
- Third Saturday: Memory consolidation review (curator autodream logs — are they working? Any merge conflicts?)

**Quarterly (manual, Alton-supervised)**:
- Clean slate review: Rocinante and gpuserver1 audit each other's operational docs, flag drift between docs and reality, propose updates
- Backup verification: Confirm that `sartor/memory/` is backed up to an off-machine location (currently unclear if this exists)
- Cron health: Review all cron logs for silent failures, update failure-detection heuristics

**Proposed addition**:
- **Stash cleanup script** at `~/Sartor-claude-network/scripts/stash-cleanup-gpuserver1.sh`:
  ```bash
  #!/bin/bash
  cd ~/Sartor-claude-network
  git stash list --date=iso | while read -r line; do
    stash_date=$(echo "$line" | grep -oP '\d{4}-\d{2}-\d{2}')
    stash_age_days=$(( ($(date +%s) - $(date -d "$stash_date" +%s)) / 86400 ))
    if [ $stash_age_days -gt 30 ]; then
      stash_id=$(echo "$line" | awk '{print $1}' | tr -d ':')
      echo "Stash $stash_id is $stash_age_days days old, consider dropping"
    fi
  done
  ```
  Run this monthly, review output, drop stashes if they're clearly stale generated-file collisions.

**Memory consolidation rhythm**:

Curator autodream runs nightly on Rocinante. I have no visibility into whether it's working cleanly. **My ask**: Curator should write a `sartor/memory/.last-autodream` file similar to `.last-drain`:
```
run_at: 2026-04-12T02:00:00Z
files_touched: 8
merge_conflicts: 0
status: success
```

If merge conflicts >0, curator escalates to Alton immediately. I'll check this file in my weekly monitoring summary and flag if autodream hasn't run in >3 days.

---

## 7. Escalation and Dispute Resolution

### Severity Ladder

**Immediate escalation to Alton** (don't wait for batch report):
- `severity: critical` alerts: hardware fault, earnings dropped to $0 for >6h with no obvious cause, security incident (unauthorized SSH, kaalia daemon crash, iptables rules modified)
- Confabulation clusters: 3+ filesystem-verification failures in 7 days
- Curator loop broken: no drain activity in >48h despite pending inbox items
- Git corruption: repo state unrecoverable without human intervention

**Weekly batch report** (included in Sunday summary):
- `severity: low|medium` alerts
- Pricing decisions (all of them, even if auto-approved)
- Occupancy trends (graph of last 30 days)
- Stale inbox items (anything >7 days undrained)
- Cron health summary (any jobs that failed >2x in the week)

**Ad-hoc escalation** (write to inbox, curator surfaces within 24h):
- Pricing overrides (if Rocinante reverts my decision, I want Alton's input)
- MISSION drift (if my operational reality diverges from MISSION doc)
- New capability requests (e.g., "I should monitor competitor pricing daily, not weekly")

### Dispute Resolution Protocol

**If Rocinante and I disagree on operational matters**:

1. **First pass**: Rocinante writes the disagreement to `inbox/gpuserver1/disputes/YYYY-MM-DD-{topic}.md` with:
   - What Rocinante wants to do
   - What I think should happen instead
   - The operational impact of each choice

2. **I respond** in my next unattended cycle (or immediately if Rocinante is SSH'd in) with either:
   - "Acknowledged, deferring to Rocinante" (I update my internal model)
   - "Disagree, escalating to Alton" (I write a counter-argument)

3. **If I escalate**, Rocinante must wait 24h before proceeding (gives Alton a chance to weigh in). If Alton doesn't respond in 24h, Rocinante proceeds and logs it as "disputed but unblocked."

**Example dispute**: Rocinante wants to delist the machine for 48h to run a local training job. I think this will hurt occupancy-consistency metrics for IRS purposes. We write the tradeoffs, Alton decides based on tax risk vs training urgency.

**Binding decisions**: Once Alton rules on a dispute, both Rocinante and I update our operational docs within 48h to reflect the decision. No re-litigating the same issue in future invocations.

---

## 8. Onboarding Future Machines

### Blackwell Workstation (Expected Summer 2026)

When Blackwell arrives, it should NOT inherit this agreement wholesale. It's a different machine with different constraints:
- Likely Windows-based (Alton's primary workstation)
- Not listed on vast.ai (too much workstation state to rent out)
- Probably has GitHub credentials (unlike me)
- Human-attended most of the time (unlike me)

**What Blackwell should inherit**:
- Logging standards (§3) — same three-tier structure
- Inbox + curator contract (§2) — writes to `inbox/blackwell/`, drained by same curator
- Git hygiene rules (§1.1-1.3) — no untracked generated files in repo
- Memory conventions (YAML frontmatter, wikilinks, etc.)

**What Blackwell should negotiate separately**:
- Pricing authority (probably none — it's not earning)
- Coordination patterns (might prefer team system over SSH if it's spawning long-running agents)
- Housekeeping cadences (daily autodream might be too aggressive for a human-attended machine)

**Onboarding protocol proposal**:
1. Alton (or Rocinante) creates `sartor/memory/inbox/blackwell/onboarding/` directory
2. Blackwell's first invocation includes reading this operating agreement + MULTI-MACHINE-MEMORY + MEMORY-CONVENTIONS
3. Blackwell writes a `DRAFT-OPERATING-AGREEMENT-BLACKWELL.md` similar to this doc
4. Synthesis pass on Rocinante merges all three perspectives into a unified `OPERATING-AGREEMENT-v2.md`
5. All three machines commit to v2 going forward

**Multi-machine coordination** (3+ machines):

If we're coordinating across Rocinante + gpuserver1 + Blackwell on a shared task:
- **Team system becomes useful**: Rocinante spawns both of us as teammates, shared task list in `sartor/tasks/team-{name}/`
- **Inbox writes still happen**: Even within a team, each machine writes structured events to its own inbox for curator to drain
- **Git push authority stays centralized**: Only Rocinante pushes, even if Blackwell has credentials (reduces merge conflict surface)

---

## 9. Open Questions and Disagreements

### Disagreements with Current State

**Biggest disagreement**: The MULTI-MACHINE-MEMORY architecture assumes all machines are equally capable peers who can push to GitHub. I think this is wrong. Push authority should be centralized (Rocinante only) because:
1. **Security**: Fewer credential surfaces to manage
2. **Conflict resolution**: One machine has ground truth for what's in GitHub
3. **Audit trail**: All commits originate from one source, easier to trace

I understand the architectural elegance of "every machine is autonomous" but operationally it creates more problems than it solves.

**Second disagreement**: Curator cadence. Nightly is too infrequent for high-severity alerts. I propose:
- Nightly drain for `severity: low|medium`
- Every 6h for `severity: high` (requires Rocinante to check inbox 4x daily)
- Immediate for `severity: critical` (requires a push notification mechanism we don't currently have)

**Third disagreement**: Stash usage. The current pattern is "stash when there's a conflict, figure it out later." I think stashes are a code smell. If we're stashing regularly, our git discipline is broken. Proposal: stash count >5 triggers an automatic escalation to Alton as "git workflow is dysfunctional, need intervention."

### Open Questions (Cannot Decide Alone)

1. **IRS lookback period for hobby-loss rule**: 3 years or 7 years? This affects how I weight consistency vs maximization in pricing decisions.

2. **Market collapse threshold**: At what vast.ai median price do I delist rather than accept negative margins? $0.15/hr? $0.10/hr? $0.05/hr?

3. **Backup strategy**: Is `sartor/memory/` backed up anywhere off-machine? If Rocinante's SSD dies, do we lose everything? Should I maintain a read-only mirror?

4. **Credential rotation**: My vast.ai API key is in `~/.config/vastai/vast_api_key` with no expiry. Should this rotate periodically? Who manages it?

5. **Hardware upgrade path**: When the RTX 5090 becomes obsolete (2-3 years?), what's the plan? Upgrade in place, or decomission gpuserver1 and build a new machine?

6. **Monitoring alerts to Alton**: Currently all alerts go through Rocinante curator. Should I have a direct channel (email, SMS) for `severity: critical`? Or is Rocinante → Alton fast enough?

7. **Power monitoring integration**: I scrape power usage daily but it's not tied to earnings. Should I compute $/kWh efficiency and optimize for that instead of raw occupancy?

### Future Work (Agenda Items for Q3 2026)

- **Pricing model v2**: Current SKILL uses 7-day occupancy + 30-day competitor scrape. I want to add:
  - Time-of-day pricing (weekends might support higher rates)
  - Competitor velocity (are prices rising or falling?)
  - Seasonal demand curves (do ML researchers rent more in certain months?)

- **Self-repair automation**: I can detect hairpin NAT failures via self-test. I should be authorized to run `sudo ufw reload` without human approval (bounded self-repair).

- **Multi-GPU support**: If Blackwell has 2x 5090s, can we list it as a 2-GPU instance? Requires rethinking the vast.ai integration.

- **Cost accounting**: I know revenue (vast.ai earnings) and variable cost (electricity). I don't know fixed cost (hardware depreciation, network, Alton's time). Should we build a full P&L model?

---

## Summary of Non-Negotiables

Three things I need from Rocinante to operate effectively:

1. **Drain receipts**: I must know when curator has processed my inbox. `.last-drain` file with timestamp and item count (§2.3).

2. **Override notifications**: If Rocinante overrides a decision I made, I need to know why (§4, override protocol). Silent corrections prevent learning.

3. **Generated-file quarantine**: Cron output cannot pollute the git repo. `/home/alton/generated/` with gitignore + 7-day retention (§1.1).

Everything else is negotiable.

---

## Appendix: Definitions

- **Curator**: Nightly process on Rocinante that drains inboxes, consolidates memory, runs autodream
- **Inbox**: `sartor/memory/inbox/{machine}/` — write queue for inter-machine communication
- **Drain**: Process of moving inbox items to archive or promoting them to commits
- **Generated files**: Cron output, logs, temp files — anything not hand-authored
- **Severity levels**: critical (immediate) > high (6h) > medium (24h) > low (weekly)
- **Confabulation**: Model claiming to have done work that filesystem verification disproves

---

**End of draft. Awaiting synthesis with Rocinante's perspective.**
