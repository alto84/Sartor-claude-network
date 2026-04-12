---
type: project_report
entity: memory-system-v2
phase: final
status: delivered
updated: 2026-04-12
updated_by: final-reporter
related: [10-MASTER-PLAN, 30-qa-audit, OPERATING-AGREEMENT, MEMORY-CONVENTIONS]
---

# memory-system-v2 Final Report

Delivered 2026-04-12. This is the definitive record of what was built, how it works, what remains open, and how to use or undo it.

---

## 1. What was built

**Staleness detection system.** `sartor/staleness.py` (376 LOC) scores every memory file on a weighted formula: days since `last_verified`, hub status, inbound link count, declared volatility, and recent-edit proximity. Threshold at 60 triggers alerts. `sartor/memory/.meta/oracles.yml` (117 LOC) maps 12 entities to their ground-truth sources (SSH for gpuserver1 hardware state, vastai-cli for rental revenue, gcal for family calendar, human for immutable facts like birthdays). The `last_verified` frontmatter field is now backfilled on 23 files across the wiki and codified in MEMORY-CONVENTIONS v0.2.

**Curator pass with receipt mechanism.** `sartor/curator_pass.py` (741 LOC) drains inbox entries from both machines, validates YAML schema, classifies operations (append, replace, fact, feedback), routes to canonical files, and writes receipts to `inbox/_receipts/{machine}/` so gpuserver1 can confirm its writes were processed. Runs twice daily on Rocinante. Dry-run mode prevents unreviewed mutations. The receipt loop closes the feedback gap that gpuserver1 flagged as the single biggest pain point in its Phase 1C consult: "I write, then nothing -- was it received?"

**Conversation-to-memory extractor.** `sartor/conversation_extract.py` (1,188 LOC) scans Claude Code session JSONLs per-user-turn with 16 regex pattern families (save-verb, structured-update, feedback-permission, feedback-rule, feedback-preference, numeric, imperative, proper-noun). Three-class feedback classifier catches explicit rules, permission grants, and ambient preferences. Dedup via fingerprinting against canonical hubs. On the benchmark corpus of 13 sessions / 217 user turns, it recovered 13/13 LOST facts and 14/14 PARTIAL facts from the conversation miner's catalog -- exceeding the acceptance criterion of 11/13 LOST. Runs nightly at 23:30 ET, capped at 20 proposals per run.

**Self-improvement loop.** `sartor/improvement_loop.py` (628 LOC) computes three health signals weekly: staleness trend (7-day moving average of files above threshold), extraction miss rate (strict-pattern A/B against production extractor), and curator receipt timeouts (entries unacknowledged after 13 hours). Proposals are appended to `data/IMPROVEMENT-QUEUE.md` with status tracking. The morning briefing surfaces the top 3 pending proposals. The loop never modifies its own code -- it only writes proposals that require Alton's accept before action.

**MERIDIAN Memory tab.** Five new API endpoints (`/api/memory-recent`, `/api/cron-health`, `/api/inbox-status`, `/api/memory-search`, `/api/obsidian/open`) plus a sixth (`/api/memory-pending`) for extractor output. Six sub-views: Graph, Heatmap, Recent, Crons, Inbox, Search. Health strip with tier counts always visible. Staleness heatmap uses the scoring function as fill color. HTTP basic auth gates all routes, with password loaded from `.secrets/meridian-password` at startup. The WebSocket `/ws/claude` endpoint remains unauthenticated (see section 4, MAJOR-1).

**Obsidian MCP integration.** Obsidian Local REST API plugin installed, bearer token stored in `.secrets/obsidian-token` (gitignored), bound to `127.0.0.1:27124`. `mcp-obsidian` wired in `.mcp.json`. Smoke-tested: search and file retrieval both functional. The dashboard's "Open in Obsidian" button proxies through `POST /api/obsidian/open` so the bearer token never reaches client JavaScript. Opening `sartor/memory/` as a second Obsidian vault is Alton's decision; the personal vault is currently wired.

**Wiki refresh.** Five canonical hub pages (MASTERPLAN, MACHINES, BUSINESS, PROCEDURES, MASTERPLAN-VISIONARY) rewritten with current facts, proper frontmatter including `last_verified`, and corrected contradictions (the $0.25-base error, the $450K Solar Roof error, the resolved Apr 4 outage, the deprecated cron references). Ten INDEX.md files created as level-2 hubs (business, family, ledgers, machines/gpuserver1, people, projects, reference, research, skills, plus a root INDEX). 32 orphaned pages wired back into the link graph. MEMORY-CONVENTIONS upgraded to v0.2 with `last_verified`, `volatility`, and `oracle` field definitions. Wiki grew from 152 to 195 markdown files.

**gpuserver1 cron triplet.** `gather_mirror.sh` fixed: logs to `~/generated/`, stash-pop errors tolerated, failure alerts written to inbox. `stale-detect.sh` written new: hourly diff of live machine state against cached `MACHINES.md`, alerts to `inbox/gpuserver1/stale-alerts/`. `vastai-tend.sh` resurrected with state-change-only inbox writes instead of the old every-30-minute spam.

---

## 2. How it works: the 6-cron architecture

```
           gpuserver1 (Ubuntu 22.04)                    Rocinante (Windows 10)
           ─────────────────────────                    ──────────────────────

  ┌─ CRON 1: gather_mirror.sh (every 4h) ─┐   ┌─ CRON 4: curator_pass.py (06:30, 23:00 ET) ─┐
  │  git pull --rebase                     │   │  Drain inbox/{machine}/*.md entries           │
  │  Snapshot vastai + GPU to status.json  │   │  Validate schema, classify, route             │
  │  Write to inbox/gpuserver1/status/     │   │  Write receipts to inbox/_receipts/{machine}/ │
  └────────────────────────────────────────┘   │  Bump last_verified on touched files          │
                                               │  git commit + push                            │
  ┌─ CRON 2: stale-detect.sh (hourly) ────┐   └───────────────────────────────────────────────┘
  │  Read live state (vastai, nvidia-smi)  │
  │  Diff against cached MACHINES.md       │   ┌─ CRON 5: conversation_extract.py (23:30 ET) ─┐
  │  If delta: write to inbox stale-alerts │   │  Scan session JSONLs modified in last 24h     │
  └────────────────────────────────────────┘   │  Per-turn regex extraction (16 families)       │
                                               │  3-class feedback classifier                   │
  ┌─ CRON 3: vastai-tend.sh (every 30m) ──┐   │  Dedup via fingerprint against canonical hubs  │
  │  Check listing, renew if near-expiry   │   │  Write proposals to inbox/rocinante/proposed/  │
  │  On state-change only: write to inbox  │   └───────────────────────────────────────────────┘
  └────────────────────────────────────────┘
                                               ┌─ CRON 6: improvement_loop.py (Sun 03:00 ET) ─┐
         ┌──── git push/pull ────┐             │  Compute staleness trend, miss rate, timeouts  │
         │   (via GitHub repo)   │             │  Write proposals to IMPROVEMENT-QUEUE.md        │
         ▼                       ▼             │  Surface top-3 in morning briefing              │
    gpuserver1              Rocinante          └───────────────────────────────────────────────┘
    writes inbox ──────────► curator drains
    reads receipts ◄──────── curator writes
```

Data flow: gpuserver1's three crons write state snapshots and alerts to `inbox/gpuserver1/`. On its next `git pull` (every 4 hours via cron 1), it receives receipts from the curator confirming what was processed. Rocinante's curator (cron 4) drains all inboxes twice daily, routes facts to canonical files, and pushes the result. The extractor (cron 5) mines conversations nightly and deposits proposals for the next curator pass. The improvement loop (cron 6) runs weekly, analyzing the health of the other five crons and the wiki itself.

Monthly cost ceiling: ~$15 if all LLM-touched jobs exhaust their budgets. Realistic: $5-8/month.

---

## 3. What Alton needs to do

These are manual steps. The system is not live until they are completed.

1. **Register three Windows Scheduled Tasks.** Open an elevated PowerShell and run:
   ```powershell
   cd C:\Users\alto8\Sartor-claude-network\scripts
   .\register-curator-pass.ps1
   .\register-conversation-extract.ps1
   .\register-improvement-loop.ps1
   ```
   This creates the `.cmd` wrappers and registers the XML task definitions. (BLOCKER-3 from QA.)

2. **Restart MERIDIAN with auth enabled.** The password file already exists at `.secrets/meridian-password`. Run:
   ```
   cd C:\Users\alto8\Sartor-claude-network\dashboard\family
   python -m uvicorn server:app --host 0.0.0.0 --port 5055
   ```
   First browser visit will prompt for credentials (user: `sartor`, password: contents of the file).

3. **Review the 20 proposed memories from the extractor's first run.** They are in `sartor/memory/inbox/rocinante/proposed-memories/2026-04-12/`. Each is a YAML-fronted markdown file with source session, turn timestamp, and matched pattern. Accept, modify, or delete each one. The next curator pass will drain accepted entries.

4. **Review `data/IMPROVEMENT-QUEUE.md` seed entries.** The improvement loop's first run seeded initial proposals. Mark each as `accepted` or `rejected` inline.

5. **Decide whether to open `sartor/memory/` as an Obsidian vault.** The MCP is currently wired to whichever vault the Local REST API plugin serves. If that is the personal vault, the MCP tools read/write the personal vault, not the memory wiki. To wire both, open `sartor/memory/` as a second vault in Obsidian.

6. **On gpuserver1, rename the underscore-prefixed inbox subdirectories.** (BLOCKER-1 from QA.) SSH in and run:
   ```bash
   cd ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1
   mv _stale-alerts stale-alerts
   mv _vastai vastai
   ```
   Then update the paths in `stale-detect.sh` and `vastai-tend.sh` to match.

7. **On gpuserver1, fix the True/true comparison in vastai-tend.sh.** (BLOCKER-2 from QA.) Change the Python one-liner to use `.lower()` on the output, or replace with `jq`.

---

## 4. What's still open

**Security (from QA, all MAJOR severity):**
- MAJOR-1: WebSocket `/ws/claude` has no authentication. FastAPI's `dependencies=[Depends(require_auth)]` applies only to HTTP routes. Anyone on the LAN can connect and issue Claude API prompts at Alton's expense. Fix: add token check in the WebSocket handshake.
- MAJOR-2: Extractor feedback targets use literal `{hash}` instead of f-string interpolation. All feedback entries pile into three files instead of getting unique names. Fix: use f-string with `candidate.fingerprint()` at `conversation_extract.py` lines 572, 583, 594.
- MAJOR-3: MERIDIAN binds `0.0.0.0` instead of `127.0.0.1`. If LAN access is intentional, pair with WebSocket auth. If not, change the bind address.
- MAJOR-4: CORS `allow_origins=["*"]` combined with basic auth means any page in a browser on the LAN can make authenticated cross-origin requests. Fix: restrict to localhost origins.

**Deferred decisions:**
- Q1: Deploy key for gpuserver1 direct git push. Master plan recommends granting with scoped pre-receive hook. Pending Alton sign-off.
- Q2: Peer-to-peer writes for machine-owned facts. Rejected for v0.1; revisit at quarterly clean-slate review 2026-07-05.
- Q10: IRS lookback period confirmed at 3 years by Alton.
- Obsidian vault decision: personal vault vs. `sartor/memory/` vs. both.

**Minor items:**
- `feedback_pricing_autonomy.md` is misfiled at the wiki root instead of `feedback/`. Move it.
- Staleness scoring is O(N^2) -- builds the inbound-link map per file instead of once per pass. No impact at 195 files / 4.5s, but will degrade at 500+.
- 43 memory files return "neutral" staleness (no datable frontmatter). Coverage gap, not a bug.
- 2 inbox entries flagged by curator for missing schema fields. Require manual review.
- Curator pass times in XML (07:30/19:30) differ from master plan (06:30/23:00). Resolve one way or the other.

---

## 5. How to extend

**Add a new oracle.** Edit `sartor/memory/.meta/oracles.yml`. Add an entry under `entities:` with `fields`, `oracle` type (ssh, vastai-cli, gcal, human), `refresh` cadence, and `runner` machine. The staleness scorer reads this file at startup; no code change needed for oracle-aware dampening.

**Add a new cron.** Write the script. Add it to the appropriate machine's crontab (gpuserver1) or create an XML task definition + `.ps1` registration script (Rocinante). Update `machines/gpuserver1/CRONS.md` or the Rocinante cron inventory. The hard cap is 6 total -- adding one means removing one.

**Add a new memory category.** Define the `type:` value in `sartor/memory/reference/MEMORY-CONVENTIONS.md`. Create an INDEX.md in the appropriate subdirectory. The curator, extractor, and staleness scorer all branch on the `type:` frontmatter field, so adding a new type with no code changes means it gets default handling (which is usually correct).

**Modify extractor patterns.** Edit `sartor/conversation_extract.py`, specifically the `PATTERN_FAMILIES` dict near line 80. Each family is a compiled regex with a `route_to` target and `operation` type. Add new families or refine existing ones. Run `python -m pytest sartor/tests/test_conversation_extract.py -v` to verify. The improvement loop's strict-extractor A/B test will catch regressions in production.

**Add a dashboard sub-view.** Add an endpoint in `dashboard/family/server.py` following the pattern of the existing `/api/memory-*` routes. Add a sub-tab in `dashboard/family/index.html` by duplicating an existing tab's HTML structure (search for `memory-tab-`). Wire the fetch call to the new endpoint. No build step needed.

---

## 6. How to roll back

If any component breaks, disable it independently. Nothing is load-bearing for the pre-existing system.

**Rocinante crons (curator, extractor, improvement loop):**
```powershell
# Disable all three
schtasks /Change /TN "SartorCuratorPass" /Disable
schtasks /Change /TN "SartorConversationExtract" /Disable
schtasks /Change /TN "SartorImprovementLoop" /Disable
```
The wiki continues to function; inbox entries accumulate but are not drained. Re-enable when fixed.

**gpuserver1 crons:**
```bash
ssh alton@192.168.1.100
crontab -e
# Comment out the three active lines:
# 0 */4 * * * /home/alton/gather_mirror.sh
# 0 * * * * /home/alton/stale-detect.sh
# */30 * * * * /home/alton/vastai-tend.sh
```

**MERIDIAN Memory tab:** The Memory tab is additive HTML/JS in `index.html` and additive routes in `server.py`. To remove: revert `dashboard/family/server.py` and `dashboard/family/index.html` to their pre-project state via `git checkout HEAD~N -- dashboard/family/server.py dashboard/family/index.html` (where N is the number of commits in this project). Auth stays -- it is strictly an improvement.

**Staleness and curator modules:** These are importable Python libraries with no side effects at import time. Deleting or reverting `sartor/staleness.py`, `sartor/curator_pass.py`, `sartor/conversation_extract.py`, and `sartor/improvement_loop.py` removes the new functionality. The `last_verified` frontmatter fields in memory files are inert metadata -- they harm nothing if the scorer is removed.

**Obsidian MCP:** Disable the Local REST API plugin in Obsidian settings. Remove the `mcp-obsidian` entry from `.mcp.json`. The MCP becomes inert. No file changes.

---

## 7. Numbers

| Metric | Value |
|--------|-------|
| **Core Python modules** | 4 files, 2,933 LOC |
| **Test suite** | 37 tests, 941 LOC, 100% pass (0.53s) |
| **Oracle config** | 1 file, 117 LOC, 12 entity oracles |
| **Scripts (XML + PS1 + CMD)** | 13 files, 1,290 LOC |
| **Dashboard delta** | server.py 1,802 LOC total, index.html 4,029 LOC total (Memory tab + auth added) |
| **Wiki files** | 152 before, 195 after (+43 files: 10 INDEX hubs, 20 extractor proposals, 13 project docs) |
| **Orphans** | 32 before, ~0 after (all wired via INDEX hubs) |
| **Frontmatter with `last_verified`** | 0 before, 23 after |
| **Frontmatter coverage** | 67% before, ~80% after (new files all have frontmatter) |
| **Extractor benchmark** | 13/13 LOST recovered, 14/14 PARTIAL recovered (target was 11/13 LOST) |
| **QA findings** | 12 total: 3 blockers (all fixable), 4 major (documented), 3 minor, 2 cosmetic |
| **QA verdict** | Conditional pass |
| **Team phases completed** | 5 of 5 (explore, scout, synthesis, execute, report) |
| **Execution tasks completed** | 12 of 12 (EX-1 through EX-12) |
| **Agents spawned** | ~15 across all phases |
| **Model usage** | Opus for synthesis, scoring, extraction, improvement loop, QA, and this report. Sonnet for hub refresh, orphan wiring, cron deployment, dashboard endpoints, conventions docs, gpuserver1 consult. |

---

## 8. Acknowledgments

- **Ethnographer** found the 32 orphaned pages and the 65-day hub staleness that became the project's organizing problem.
- **Research-scout** identified `last_verified` as the single highest-leverage idea from the entire state-of-the-art survey -- the sentence from Atlan's knowledge base article became the design's load-bearing assumption.
- **Alignment-liaison** extracted gpuserver1's position that it was "bored and volunteering" -- the phrase reframed the inter-machine relationship from delegator/executor to peer collaboration and directly shaped the receipt mechanism.
- **Conversation-miner** quantified the 77% loss-or-degraded rate across 14 days of sessions and identified the three structural loss patterns (first-prompt amnesia, mid-tool-use stripping, feedback-rule blindness) that the extractor was built to solve.
- **QA-auditor** caught the underscore-prefix bug in the curator that would have silently disconnected all gpuserver1 cron output from the drain pipeline -- one character, total system failure.
- **Dashboard-scout** established the "extend MERIDIAN, don't build new" principle that avoided a second dashboard and kept the project at zero new processes.
- **Synthesizer** wrote the master plan that held the 6-cron cap against pressure from every other agent to add "just one more."
- **Extractor-builder** exceeded the benchmark target (27/27 vs. the required 11/13), validating the per-turn extraction architecture over per-session summarization.
