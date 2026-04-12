---
type: master_plan
phase: plan
status: draft
updated: 2026-04-12
related: [memory-system-v2-ethnography, research-scout, gpuserver1-consult, conversation-loss-catalog, dashboard-scout, OPERATING-AGREEMENT]
---

# memory-system-v2 — Master Plan

Author: synthesizer (Phase 2). Inputs: six Phase 1 reports plus the canonical references (OPERATING-AGREEMENT v1.0, MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY, obsidian-control-research, CURATOR-BEHAVIOR, memory-curator-agent). This plan is opinionated. Where the inputs conflict, the conflicts are resolved here, in the open. Where Alton must decide, the decisions are listed in section 12 and tagged inline.

## 1. Goals (restated, in Alton's words where possible)

1. **Air-tight.** Memory must not silently lose facts. The conversation miner found a 77% loss-or-degraded rate over 14 days of session JSONLs (13 lost outright, 14 captured in the wrong place). That number is the headline failure of the current system and is what this plan exists to fix.
2. **Self-improving.** The system detects its own failures and proposes upgrades. Every cron, every extractor, every receipt has a metric, and the metrics feed `data/IMPROVEMENT-QUEUE.md`.
3. **Cross-linked.** Every fact lands in a place that is reachable by graph traversal from one of the canonical hubs. The ethnographer found 32 high-value pages with **zero inbound wikilinks** — every new doc added since 2026-04-07 is orphaned. New writes wire themselves in or get flagged.
4. **Stale-detection.** Adopt research-scout's #1 steal: `last_verified` frontmatter on every memory file plus a nightly scoring pass. MASTERPLAN.md sitting 65 days stale with 9 inbound links is the canonical failure mode.
5. **Conversation-to-memory ingestion.** Per-user-turn extraction, not per-session, with three-class feedback classification. Recovers the lost 13 and converts the partial 14.
6. **MINIMAL quiet crons.** Hard cap of **6 across both machines**. gpuserver1 itself flagged "anything > 6 feels like sprawl." The 8 deprecated/disabled jobs in its crontab prove the failure mode.
7. **Coexist with Obsidian.** Alton's running Obsidian vault is the source of truth UI. Install the Local REST API plugin, talk to the live process, never fight for file locks.
8. **Dashboard integration.** MERIDIAN already ships ~60% of the viz layer. Extend it. Do not build a new dashboard.
9. **Peer-compatible with gpuserver1.** Honor the Operating Agreement v1.0. Domain primacy as written: gpuserver1 owns rental-operations decisions; Rocinante owns curation, git, and shared-state writes.

The non-goal: this is not a rewrite. It is a layered upgrade on the existing Obsidian + git + inbox stack.

## 2. Current state gap analysis

The ethnographer's report grounds this. Six concrete gaps:

**G1. Hub staleness.** Every top-tier hub (`MACHINES`, `BUSINESS`, `MASTERPLAN`, `PROCEDURES`) has been untouched for 65 days while the rest of the wiki has accelerated. `MASTERPLAN.md` has `next_review: 2026-04-15` — three days from today. Nothing enforces that field. The convention defines `next_review`; the curator has never read it.

**G2. Frontmatter discipline collapse.** 33% of files have no frontmatter. 12% more have frontmatter but no `updated` field. The biggest single file in the wiki — the 22,881-word mini-lab report — has neither frontmatter nor inbound links.

**G3. Append-mode orphaning.** Everything written after 2026-04-07 is orphaned. The wiki has been generating new pages faster than it has been wiring them into the link graph. `reference/AGREEMENT-SUMMARY.md`, `reference/LOGGING-INDEX.md`, the entire `reference/gpuserver1-*` cluster, `business/rental-operations.md`, `family/active-todos.md` — all unreachable except by full-text search.

**G4. Vintage contradictions.** `reference/gpuserver1-monitoring.md` (one day old by frontmatter) claims `vastai-tend.sh`, `gateway_cron.py`, `memory-sync.sh`, and `heartbeat-watcher.sh` are all "unchanged" — all four were deprecated 24 hours before the file was last touched. `BUSINESS.md` says "$0.25/hr base" when $0.25 is the minimum bid and base is $0.40. The Tesla Solar Roof contract is listed as "$450,000" when the actual contract value is $438,829.

**G5. Curator is a ghost.** gpuserver1 wrote three reports to its inbox yesterday and has no idea whether they were read. The phrase "I don't know if they've been read or merged" appears twice in its consult reply. There is no receipt mechanism. The Operating Agreement promises one but it does not exist yet.

**G6. Conversation-to-memory pipeline does not exist.** The miner found 35 high-value facts in the last 14 days of sessions; 13 evaporated entirely, 14 landed somewhere unhelpful. There is no extractor that runs on the JSONLs. Capture is whatever the assistant happens to remember to write down mid-turn, and the data shows it remembers about 23% of the time.

The good news the ethnographer surfaced: **wikilink discipline is healthier than expected.** Only 16 truly dangling links, and 14 of those are placeholder syntax in convention docs. The graph backbone is sound; the metadata layer is broken.

## 3. Staleness detection design

This is the load-bearing new mechanism. It owes most of its design to research-scout's findings (adopt `last_verified`, build on existing decay infrastructure) and to gpuserver1's offer to run a local stale-detector.

### 3.1 The new frontmatter field

Add `last_verified: YYYY-MM-DD` to every memory file. Distinct from `updated` — `updated` is "when content last changed," `last_verified` is "when a human or trusted process last asserted these facts are still true." A file can be three months unchanged and still verified yesterday; that is not stale.

Mandatory on every file with `type` in {`domain`, `person`, `reference`, `machine_identity`, `machine_operations`, `project`}. Optional on `daily/`, `inbox/`, `feedback/`, and the constitution-council and safety-knowledge-graph clusters (they are time-stamped artifacts, not facts about live state).

### 3.2 The scoring function

For every file:

```
staleness_score = w1 * age_since_verified
                + w2 * is_canonical_hub
                + w3 * inbound_link_count
                + w4 * declared_volatility
                - w5 * recent_edit_proximity
```

Initial weights (hand-tuned, will be revised in v0.2 once metrics roll in):

| Term | Weight | Source |
|------|--------|--------|
| `age_since_verified` (days) | 1.0/day | the only term that monotonically grows |
| `is_canonical_hub` (binary, ≥10 inbound links) | +20 | hub staleness is severity 1 per ethnographer |
| `inbound_link_count` (log-scaled) | +2 per log10 | spokes matter less than hubs |
| `declared_volatility` (frontmatter `volatility: high\|med\|low`) | +30 / +10 / 0 | optional; high for things like vast.ai pricing, low for ALTON dob |
| `recent_edit_proximity` (days since last `updated`) | -1.0/day capped at 14 | a file edited yesterday cannot be very stale |

Threshold: `staleness_score > 60` is a stale alert. Tunable.

### 3.3 Entity-freshness model

Some entities have a clean ground-truth oracle: gpuserver1's live `vastai show machines` output is the canonical state of machine 52271's price, occupancy, and listing. Some do not: ALTON's date of birth has no oracle other than Alton himself.

Build an entity → oracle map (small YAML at `sartor/memory/.meta/oracles.yml`):

```yaml
entities:
  gpuserver1:
    fields: [price, min_bid, occupied, listed, gpu_temp, disk_pct]
    oracle: ssh
    refresh: hourly
    runner: gpuserver1
  solar-inference-llc:
    fields: [vast_revenue_ytd, vast_balance]
    oracle: vastai-cli
    refresh: daily
    runner: gpuserver1
  alton:
    fields: [dob, cell, employer]
    oracle: human
    refresh: never
  family:
    fields: [school-calendar]
    oracle: gcal
    refresh: weekly
    runner: rocinante
```

The stale-detector reads this map. For oracle=`ssh`/`vastai-cli`/`gcal`, it can verify automatically and bump `last_verified` itself when the live value matches the cached value. For oracle=`human`, it can only flag and ask Alton in the morning briefing.

### 3.4 LLM verification sampling budget

Per Anthropic's Long-Running Claude pattern, sometimes the cheapest verification is "ask a small model whether this still looks right." We do not need to verify everything with an LLM, but for files where the oracle is ambiguous (text-prose facts without a clean field-level mapping), schedule ≤5 LLM-verification calls per night, picked by sampling the highest-staleness-score files first. Use Haiku for the verification pass (cheap, fast, sufficient).

Budget cap: $0.50/day. Hard stop. Logged to `data/cost-log.csv`. If the cap binds, fewer verifications happen and stalest files drift longer; this is acceptable. The verification is supplementary, not load-bearing.

### 3.5 Alert routing

Stale-detector outputs go to two places:

1. **Dashboard:** the MERIDIAN Memory tab heatmap (per dashboard-scout's design) renders the staleness score as fill color. One glance answers "which cluster is rotting?"
2. **Inbox:** when a file crosses the threshold for the first time, write a single inbox entry to `inbox/rocinante/_stale-alerts/YYYY-MM-DD_filename.md`. The morning briefing surfaces these. No spam — entries are debounced by file. Once flagged, no new alert until either the file is touched or 7 days pass.

gpuserver1's local `stale-detect.sh` cron diffs its live state against the cached `MACHINES.md` section and writes alerts to its own inbox. This honors the Operating Agreement §4.2 (gpuserver1 owns its own facts) and uses the inbox the way it was designed.

### 3.6 The surprising claim

The most underused signal in the wiki is **the `next_review` field that already exists**. `MASTERPLAN.md` has `next_review: 2026-04-15` and nothing reads it. Migration: rename `next_review` → `last_verified` semantics by reframing — every `next_review` date in the wiki becomes a `last_verified` data point with implied verification cadence. Old fields stay as a fallback. This costs nothing and buys back 13 files of legacy review-cadence data.

## 4. Conversation-to-memory pipeline

This is the second load-bearing mechanism. Owes its shape entirely to the conversation miner's three patterns (first-prompt amnesia, mid-tool-use stripping, feedback-rule blindness) and to research-scout's recommendation of background extraction (Hermes/Hindsight pattern).

### 4.1 Where it runs

**Cron, not hook, not on-demand.** A nightly job at 23:30 ET on Rocinante that scans every Claude Code session JSONL touched in the last 24 hours. Cron only — never in the live agent loop. Latency-free for the user; the user does not pay a tax for memory ingestion. (Hindsight's "background processing" model.)

The miner already has the path map: `C:/Users/alto8/.claude/projects/C--Users-alto8/` and `.../C--Users-alto8-Sartor-claude-network/`. The job iterates session files modified since the last successful run, marked by a watermark in `data/extractor-state.json`.

### 4.2 Per-user-turn extraction

The miner's biggest finding is structural: extraction must run at the **user-turn** level, not the session-summary level. Compression-step "this session is being continued" blocks consistently strip one-line operational facts while preserving technical concepts. Per-turn extraction with high-recall regex patterns is the fix.

Patterns to apply per turn (recall over precision; the curator filters later):

| Pattern | Example | Routes to |
|---------|---------|-----------|
| Imperative + concrete noun ("pay X", "pick up Y", "remind me about Z") | "pay parking ticket, pay MKA tuition" | `family/active-todos.md` append |
| Numeric value with currency or units | "$830", "$0.35/hr", "70118" | structured-field update or `inbox/rocinante/_facts/` |
| Phone number / address regex | "(504) 579-3185" | structured-field update on the named person |
| Date of birth pattern | "9/20/1984" | structured-field update on ALTON or FAMILY |
| Account number suffix ("ending in 1640") | "I'm having trouble remembering... 1640" | open question on TAXES |
| Proper-noun introduction ("Miguel — yard help") | "Miguel — yard help, coming this weekend" | new dossier in `people/miguel.md` |
| Save/remember/store verb + content | "save it in our memory system as well" | force-append to whatever the named target is |

Each pattern hit produces an inbox entry to `inbox/rocinante/_extracted/YYYY-MM-DD_HHMM_{kind}_{hash}.md` with frontmatter declaring the source session, turn timestamp, pattern matched, and the surrounding 2-line context window. **Provenance is mandatory** — the miner explicitly noted that "captured but stripped of provenance" was as bad as lost.

### 4.3 Three-class feedback classifier

Pattern 3 from the miner: feedback gets written down only when it looks like a rule. Three classifier classes:

- **Class A — Explicit rules.** Triggers: "don't / always / from now on / never." Already captured well. No change needed except codifying the trigger list.
- **Class B — Permission grants.** Triggers: "you have permission / you can / I'm authorizing / period." Currently missed entirely. Example: tax-autonomy grant from Apr 5 ("you have permission, period"). Outputs go to `feedback/feedback_*_autonomy.md` with `class: permission` in frontmatter.
- **Class C — Ambient preferences.** Triggers: "I tend to / I prefer / I usually / generally I." Currently missed. Example: "I do tend to prefer to stay inside the entropic ecosystem." Outputs go to `feedback/feedback_*.md` with `class: preference` in frontmatter.

All three classes route candidate files to `inbox/rocinante/_extracted-feedback/`. The morning curator pass either accepts (move to `feedback/`), modifies (edit and accept), or rejects (delete with rationale logged to `_rejected/`). The user sees the day's classifier output in the morning briefing as a five-line digest.

### 4.4 Structured-field update path

The miner's most subtle finding: many "lost" facts are not new memories — they are updates to existing structured fields. Birthday year (1984/1980) was missed because the existing template stored only month/day. The price-bump from $0.40 to $0.35 was lost because `MACHINES.md` line 69 wasn't updated even though `business/rental-operations.md` got it.

The pipeline needs a "this fact wants to update an existing field, not create a new memory" detector. Implementation:

1. For every extracted fact, run a fuzzy match against existing frontmatter fields and structured table cells in the canonical hubs.
2. Match found → emit an inbox entry with `operation: replace` per `MULTI-MACHINE-MEMORY.md`'s schema. The curator handles the rest.
3. No match → emit `operation: append` or `operation: fact`.

This is where the **basic-memory observation syntax** (research-scout #4 steal) earns its keep: structured list-item format `- [category] fact #tag (context)` is fuzzy-matchable and human-readable. Adopt it as the inbox-entry body format.

### 4.5 Handling the three loss patterns

| Loss pattern | How the pipeline handles it |
|--------------|----------------------------|
| First-prompt amnesia | Per-turn extraction means the first user turn of every session gets scanned. No reliance on assistant memory. |
| Mid-tool-use stripping | Per-turn extraction means turns inside long tool sequences get the same scan as standalone turns. Provenance preserved by including session id + turn timestamp + 2-line context window in every inbox entry. |
| Feedback-rule blindness | Three-class classifier explicitly catches permission grants and ambient preferences, not just explicit rules. |

### 4.6 The surprising claim

The single highest-ROI line in the entire pipeline is the **save/remember/store verb detector**. The Loki small-cell-lymphoma fact from Apr 10 explicitly said "save it in our memory system as well" and was still stored only as month/day with no diagnosis. A regex on `(save|remember|store|put.*in (the )?memory|add.*to (the )?wiki)` would have caught it. Five lines of Python recovers most of the high-confidence-but-missed cases.

## 5. Minimal cron plan (HARD CAP: 6 across both machines)

This is the most contested section because every report wanted to add one more cron. The discipline: **6 total**, period. Each entry below is non-negotiable; anything not on this list is deferred to v0.2 or implemented as on-demand.

### 5.1 The list

| # | Name | Schedule | Machine | Script | Log | ETA | $/day | Writes | Receipt |
|---|------|----------|---------|--------|-----|-----|-------|--------|---------|
| 1 | `gather_mirror.sh` | every 4h | gpuserver1 | `/home/alton/gather_mirror.sh` (FIXED — see §5.2) | `/home/alton/generated/gather-mirror.log` | <30s | $0 | git pull, status.json snapshot to `inbox/gpuserver1/status/` | mtime on log |
| 2 | `stale-detect.sh` | hourly | gpuserver1 | `/home/alton/stale-detect.sh` (NEW) | `/home/alton/generated/stale-detect.log` | <5s | $0 | `inbox/gpuserver1/_stale-alerts/` | curator-receipt |
| 3 | `vastai-tend.sh` | every 30 min | gpuserver1 | `/home/alton/vastai-tend.sh` (RESURRECTED + reparented to inbox) | `/home/alton/generated/vastai-tend.log` | <10s | $0 | `inbox/gpuserver1/_vastai/` on state-change only | curator-receipt |
| 4 | `curator-pass.py` | 06:30 ET, 23:00 ET | rocinante | `sartor/memory/curator/curator-pass.py` (NEW) | `data/curator-log.jsonl` | 30s-2min | ~$0.05 (Haiku verification subset) | canonical files via inbox drain; receipts to `inbox/_receipts/{machine}/` | self-logged + git commit |
| 5 | `conversation-extract.py` | 23:30 ET | rocinante | `sartor/memory/curator/conversation-extract.py` (NEW) | `data/extractor-log.jsonl` | 1-3min | ~$0.10 (Haiku for fuzzy fact-merge step) | `inbox/rocinante/_extracted/` and `_extracted-feedback/` | watermark in `data/extractor-state.json` |
| 6 | `improvement-loop.py` | weekly Sun 03:00 ET | rocinante | `sartor/memory/curator/improvement-loop.py` (NEW) | `data/improvement-log.jsonl` | 2-5min | ~$0.20 (Sonnet for the propose step) | `data/IMPROVEMENT-QUEUE.md` | self-logged |

Six. Total monthly cost ceiling: ~$15 if all the LLM-touched jobs run their full budget every day. Realistic: ~$5-8/month.

### 5.2 What gets killed

Every cron not on the list above. Specifically the items that have to die:

- **gpuserver1's `run_monitor.sh` (2h)** — collapsed into `stale-detect.sh` (#2). The "monitoring" idea was right; the cron name and schedule were wrong.
- **gpuserver1's `run_pricing.sh` (weekly)** — folded into the broader Operating Agreement §5 weekly cadence as an on-demand skill, not a cron. gpuserver1 disagreed but the discipline matters more.
- **gpuserver1's `dashboard-healthcheck.sh` (daily)** — dropped. The dashboard either responds when MERIDIAN polls it or it doesn't. Healthcheck-as-cron was theater.
- **gpuserver1's `daily_summary.py` (23:55)** — folded into `gather_mirror.sh`'s 4h pass as one of the included steps, not a separate cron.
- **Rocinante's 9 Sartor scheduled tasks** in the registry, all currently blocked by the budget gate. They are either dead code (delete) or get triggered on-demand from the morning briefing instead of running on independent timers. The budget gate was a symptom; this is the cure.
- **`SartorHeartbeat`** Windows Task. The task fires every 30 min and accomplishes nothing because of the budget gate. Either delete it or repurpose it as the trigger for `curator-pass.py` (#4) — but if we do that, it counts as one of the six, and we're already at six. So: delete.

### 5.3 The fix to gather_mirror.sh

gpuserver1's consult flagged this is broken: it stashes dirty trees every 4h and never pops, logs to a non-existent dir so failures are silent, and `~/sartor-monitoring/logs/` may not exist. The fix is part of the cron-1 work and is non-negotiable:

```bash
mkdir -p ~/generated
exec >> ~/generated/gather-mirror.log 2>&1
echo "=== $(date -Iseconds) ==="
cd ~/Sartor-claude-network || exit 1
git stash --include-untracked
git pull --rebase || { echo "PULL_FAILED"; ALERT; exit 1; }
git stash pop || true   # acceptable: stash residue is reviewed weekly
emit_status_json > inbox/gpuserver1/status/$(date -u +%Y-%m-%dT%H%MZ).json
```

The `ALERT` step writes a WARNING-priority inbox entry per Operating Agreement §1.3 commitment 4. Two consecutive failures escalate to `data/SYSTEM-STATE.md` so the next session sees it. Stash-pop conflicts are tolerated because the manual review cadence is monthly under §6 of the Operating Agreement.

### 5.4 Receipts

Every cron on the list emits an acknowledgment that the matching peer can read. For gpuserver1's crons, the curator writes a receipt to `inbox/_receipts/gpuserver1/` after each pass with `{filename, sha256, status, applied|deferred|flagged, curator-run-id}`. gpuserver1 checks this on its next `git pull`. This closes the feedback loop the Operating Agreement §2.2 promised. It is the single highest-leverage anti-entropy mechanism in the plan.

## 6. Inter-machine sync — the deploy-key question

CONTESTED. Both gpuserver1 (consult §4) and the Phase 1C report flag this as the biggest open ask. Position:

**Recommendation: GRANT the deploy key. Conditional approval pending Alton sign-off.**

Tradeoffs, written out:

**For granting:**
- gpuserver1's argument is correct on the merits. The conflict surface is genuinely zero — gpuserver1 only writes to `inbox/gpuserver1/*`, never to `sartor/memory/*`. The curator drains; gpuserver1 does not.
- The latency improvement is real: write→push→pull is seconds; write→wait-for-curator-cycle is hours. The receipt mechanism in §5.4 only works if the receipts can flow back without a 12-hour curator cadence.
- The feedback-loop crisis the Operating Agreement was written to solve cannot actually be solved without low-latency bidirectional sync. Fourteen hours of silent gpuserver1 writes is exactly the failure pattern that produced the agreement.
- The security delta is one scoped deploy key with write access to a single repo. gpuserver1 already has SSH access from Rocinante, full root, and runs autonomously on the LAN. The marginal exposure is minimal.

**Against:**
- The MULTI-MACHINE-MEMORY architecture explicitly rejected "direct multi-writer git" with "would require deploy keys on every machine and creates merge conflicts. Rejected." Reversing that requires Alton's explicit blessing, not synthesis-team's.
- The "Push only from Rocinante (has GitHub credentials)" rule is in CLAUDE.md, MEMORY.md, and the Operating Agreement. Three places. Changing it changes those three documents in a coordinated commit.
- A future agent reading the wiki might find old "no push from gpuserver1" guidance and act on it, creating the kind of contradiction the ethnographer just spent a phase cataloguing.

**Resolution:** grant with explicit scoping. The deploy key is named `sartor-gpuserver1-inbox-only` and we add a server-side pre-receive hook on Rocinante's local clone (or a local pre-push hook on gpuserver1) that rejects any push touching paths outside `sartor/memory/inbox/gpuserver1/**` and `machines/gpuserver1/**`. gpuserver1 inherits the §1.3 stash-before-pull discipline. Plan B (write to inbox, wait for curator) stays as fallback if push fails.

**ALTON SIGN-OFF NEEDED.** Listed in section 12 as Q1.

## 7. Machine-owned memory writes (P2P)

CONTESTED. gpuserver1's "free space" proposal in consult §8 — let it write directly to `sartor/memory/MACHINES.md` section "gpuserver1" without curator approval, on the theory that it owns those facts.

**Recommendation: REJECT for v0.1. Reconsider for v0.2 after the receipt mechanism has been operational for one month.**

Tradeoffs:

**For:**
- Cuts curator latency from hours to seconds for machine-local facts.
- Aligns with the Operating Agreement §4.2 domain-primacy: gpuserver1 owns rental-ops and its own state.
- Scales naturally to N machines without making Rocinante a single point of failure.

**Against:**
- The Operating Agreement §1.3 explicitly says "Never touch files outside gpuserver1's declared writable zones: `inbox/gpuserver1/`, `machines/gpuserver1/`, `skills/gpuserver1-*/`" — note `MACHINES.md` is *not* in that list. gpuserver1's proposal would require amending the agreement, which is supposed to happen at quarterly review.
- The curator's transactional semantics (§2.4) cover the case where two writers race. P2P writes bypass that.
- There is no rollback story for a malformed P2P write to a canonical hub. The inbox has `_flagged/` for malformed entries; canonical files don't.
- The receipt mechanism in §5.4 is the cheaper version of what gpuserver1 actually wants — it's not really about write authority, it's about feedback. Solve feedback first; if that solves the underlying need, the P2P question becomes moot.

**Resolution:** ship the receipt mechanism in v0.1, evaluate at the first quarterly clean-slate review (2026-07-05 per Operating Agreement §6). If gpuserver1 still wants P2P writes after a month of working receipts, that is signal that the latency problem is real and we revisit. For now, the inbox plus receipts is sufficient.

**ALTON SIGN-OFF NEEDED.** Listed as Q2. The default if Alton declines to decide is the recommendation above (reject for v0.1, revisit at quarterly review).

## 8. Obsidian integration

Per obsidian-control-research, install the Obsidian Local REST API plugin plus mcp-obsidian. This is the right answer and has been since the research doc was written. Steps:

1. **Install plugin.** Obsidian → Settings → Community plugins → Browse → "Local REST API" → Install → Enable. ~3 min.
2. **Generate bearer token.** Plugin settings → copy API key. Store at `C:\Users\alto8\Sartor-claude-network\.secrets\obsidian-token` (added to `.gitignore`). Never commit, never log.
3. **Bind to localhost only.** Plugin setting `Bind address: 127.0.0.1`. Default is `0.0.0.0` and that is wrong on a flat home LAN with kids' devices.
4. **Self-signed cert handling.** Drop the cert in the Windows trust store, or configure mcp-obsidian to skip cert verification on localhost. Prefer trust-store install for cleanliness.
5. **Install mcp-obsidian.** Add to `.mcp.json` with env `OBSIDIAN_API_KEY`, `OBSIDIAN_HOST=127.0.0.1`, `OBSIDIAN_PORT=27124`.
6. **Smoke test.** From a Claude Code session: `mcp__obsidian__search` for "FAMILY" and `mcp__obsidian__get_file_contents` on `ALTON.md`. Confirm both return content.

### 8.1 Security posture

- Localhost only. No exposure to LAN.
- Bearer token in `.secrets/`, gitignored, never logged.
- The plugin runs inside Alton's Obsidian process. It cannot be exploited unless Alton's user account is already compromised, in which case the wiki is the least of the worries.
- The dashboard's `POST /api/obsidian/open` proxy (per dashboard-scout's design) calls the Obsidian REST API server-side so the bearer token never lands in client JS.
- **Hard gate: the FAMILY, financial, and TAXES clusters must NOT be exposed via the dashboard memory tab until MERIDIAN has authentication.** See §9.

### 8.2 Division of labor

- **Dashboard (MERIDIAN) owns:** aggregate views, decay heatmap, link topology, search results.
- **Obsidian owns:** single-note rendering, editing, plugin views (Smart Connections, etc.).
- **Curator and conversation extractor own:** writes via filesystem (not via the REST API). The REST API is for read + targeted PATCH operations from the dashboard or from interactive Claude Code sessions, not for the bulk extraction pipeline.

## 9. Dashboard plan — extend MERIDIAN

Per dashboard-scout, MERIDIAN already ships ~60% of the viz layer. Build on it. Five new endpoints + Memory tab + health strip, ~7 hours, ~560 LOC.

### 9.1 The endpoints

Per dashboard-scout's table:

1. `GET /api/memory-recent` — files modified in last 24h with diff snippet.
2. `GET /api/cron-health` — extends `/api/heartbeat-live`; joins `.claude/scheduled-tasks/*.md` against the heartbeat CSV.
3. `GET /api/inbox-status` — directory walk, count + oldest mtime per host.
4. `GET /api/memory-search?q=` — wrapper around `sartor/memory/search.py` BM25.
5. `POST /api/obsidian/open` — server-side proxy to Obsidian REST API, bearer token never in client JS.
6. `GET /api/memory-pending` — conversation-extractor output for the day, blocked-on §4.

### 9.2 The Memory tab

Wireframe matches dashboard-scout's design: health strip with five tier counts, then sub-tabs [Graph] [Heatmap] [Recent] [Crons] [Inbox] [Search]. Heatmap uses the staleness score from §3.2 as fill color.

### 9.3 HARD GATE: MERIDIAN auth must land before Memory tab ships

Dashboard-scout flagged this and it is a hard requirement, not a soft one: MERIDIAN binds `0.0.0.0:5055` with no authentication. On a flat home LAN with kids' devices and Aneeta's work laptop, exposing FAMILY.md, ALTON.md, the financial cluster, and TAXES.md via the Memory tab is a hard no.

Two acceptable resolutions:

- **A:** Bind to `127.0.0.1` only and Alton accesses it via SSH-tunnel from his other machines. Cheap, no auth needed, but loses cross-device access.
- **B:** Add a single shared password (HTTP basic auth or a bearer token in a cookie). ~1 hour of work.

Recommendation: **B**, because Alton uses MERIDIAN from the Next.js portal on his phone too, and binding to localhost would break that. Make the password change-on-first-use with the initial value in `.secrets/meridian-password`.

The Memory tab is BLOCKED on this work landing. No memory data goes through MERIDIAN until auth exists.

## 10. Self-improvement loop

The system detects its own failures and feeds proposals to `data/IMPROVEMENT-QUEUE.md`. Three signals, all derived from cron output:

### 10.1 Staleness trend line

The stale-detector emits a daily count (files-with-score>60) to `data/staleness-history.csv`. If the 7-day moving average rises week-over-week for three consecutive weeks, the improvement loop writes a `staleness-trend-rising` proposal to `IMPROVEMENT-QUEUE.md` with the top-10 offenders and a hypothesis (probably: the curator is falling behind, or the verification budget is binding, or a high-volatility entity needs a new oracle).

### 10.2 Extraction miss rate

The conversation extractor runs nightly. The improvement loop runs Sunday 03:00 ET (cron #6) and computes a recall estimate by sampling 5 random sessions from the past week and re-running extraction with a stricter set of patterns. If the strict pass finds facts the production pass missed, that delta is the miss rate. Trend it. If miss rate > 20%, write an `extractor-miss-rate-high` proposal with the missed-fact examples.

This is the **self-improvement-via-A/B-against-the-stricter-version** trick. Cheap, self-contained, doesn't need a labeled dataset, and surfaces real regressions in the extractor's pattern set. This is the surprising claim in section 10: Phase 3 builds the strict-extractor as a known-better-but-too-slow baseline, then uses it as the recall oracle for the production extractor forever after.

### 10.3 Curator receipt timeouts

If gpuserver1 writes an inbox entry and the curator does not emit a receipt within 13 hours (one full curator cycle plus a 1h grace), the receipt-watcher cron (running inside `improvement-loop.py`) writes a `curator-receipt-timeout` proposal listing the orphaned entries. Two consecutive cycles of timeouts triggers an Alton-visible `data/SYSTEM-STATE.md` flag.

### 10.4 How proposals get applied

`IMPROVEMENT-QUEUE.md` is append-only. Each proposal has a status field (`pending`, `accepted`, `rejected`, `applied`). The morning briefing surfaces top-3 pending proposals to Alton each day. Alton accepts/rejects in-line. Accepted proposals get a follow-up task spawned via TaskCreate in the next agent session. The system never mutates its own code without Alton's accept.

**Hard rule:** the improvement loop never modifies code in `.claude/`, the curator scripts, or the conventions docs directly. It only writes proposals. Direct self-modification is what produced the contradictions catalog in the first place.

## 11. Migration plan

Phased rollout. Each phase is a checkpoint with explicit rollback. Do not ship anything that breaks Alton's running Obsidian session. The vault is his daily driver and must keep working continuously.

### Phase A — Foundations (no behavior change visible to Alton)
1. Add `last_verified` field to MEMORY-CONVENTIONS.md schema doc.
2. Backfill `last_verified` on the 14 canonical hub files. Set to today's date with author=`synthesizer`. Bump `updated`.
3. Write the staleness scoring function (`sartor/memory/curator/staleness.py`) and run it once locally. Inspect the output.
4. Write the oracle map at `sartor/memory/.meta/oracles.yml` with five entries.
5. Commit. **Rollback:** revert the commits; nothing in the system depends on these files yet.

### Phase B — Curator and receipts (visible only to gpuserver1)
1. Write `curator-pass.py` and `inbox/_receipts/{machine}/` directory scaffold.
2. Add cron #4 to Rocinante (twice daily).
3. Run for 48 hours. Verify gpuserver1 sees receipts on its next pull.
4. Notify gpuserver1 in its inbox that receipts are live.
5. **Rollback:** disable the cron, delete `_receipts/`. The receipt is additive, not load-bearing.

### Phase C — Stale detector (gpuserver1 + Rocinante)
1. Write gpuserver1's `stale-detect.sh` and add as cron #2.
2. Write Rocinante's stale-aware curator pass (extends #4 from Phase B).
3. Watch the alert volume for 72 hours. Tune thresholds.
4. **Rollback:** disable `stale-detect.sh`; the inbox just stops getting stale alerts.

### Phase D — gather_mirror fix and vastai-tend resurrection (gpuserver1)
1. Rewrite `gather_mirror.sh` per §5.3.
2. Resurrect `vastai-tend.sh` (cron #3) with state-change-only inbox writes.
3. Test in dry-run mode for one cycle.
4. **Rollback:** restore the old `gather_mirror.sh` from git history; comment out `vastai-tend.sh` in crontab.

### Phase E — Conversation extractor (Rocinante)
1. Write `conversation-extract.py` with the per-turn extraction patterns from §4.2 and the three-class feedback classifier from §4.3.
2. Run once manually against the last 14 days of session JSONLs (the same corpus the miner used).
3. Compare against the miner's catalog of 35 facts. Compute recall. **Acceptance criterion: recover at least 11 of the 13 LOST entries.** If recall is below threshold, iterate on patterns; do not enable the cron.
4. Once recall passes, add cron #5.
5. **Rollback:** disable the cron; the existing conversation-fact loss returns to baseline. No data is destroyed.

### Phase F — Obsidian REST API + MCP (Rocinante)
1. Install plugin per §8.
2. Smoke-test from a Claude Code session.
3. Document in `sartor/memory/skills/obsidian-control.md`.
4. **Rollback:** disable the plugin in Obsidian settings; mcp-obsidian becomes inert. No file changes.

### Phase G — MERIDIAN auth + Memory tab
1. Add HTTP basic auth or bearer-token cookie to MERIDIAN.
2. Smoke-test from Alton's phone, his laptop, and Rocinante.
3. Build the five new endpoints per §9.1.
4. Build the Memory tab UI per dashboard-scout's wireframe.
5. Ship with the staleness heatmap as the headline view.
6. **Rollback:** revert the Memory tab routes; auth stays (auth is strictly an improvement).

### Phase H — Improvement loop (Rocinante)
1. Write `improvement-loop.py` and `data/IMPROVEMENT-QUEUE.md` with starter schema.
2. Add cron #6 (weekly Sunday 03:00 ET).
3. Surface top-3 pending proposals in the morning briefing.
4. **Rollback:** disable the cron; `IMPROVEMENT-QUEUE.md` stops getting new entries but old ones stay readable.

### Phase I — Hub refresh and orphan re-wiring (cleanup, runs in parallel with everything above)
1. Refresh `MASTERPLAN.md` with the post-2026-04-07 architecture (multi-machine memory, inbox, curator, household constitution, constitution-council, safety-knowledge-graph, cron cleanup). This is the 65-day staleness fix and is overdue regardless of the rest of the plan.
2. Refresh `MACHINES.md` with `run_monitor.sh`, `gather_mirror.sh`, the new `stale-detect.sh`, and remove the deprecated cron mentions.
3. Refresh `BUSINESS.md` to fix the $0.25/hr-base error, the $450K Solar Roof error, the resolved Apr 4 outage, and the resolved Blackwell question.
4. Refresh `PROCEDURES.md` to mention the inbox/curator pattern.
5. Wire the 32 orphan pages back to their natural hubs. New `business/INDEX.md`, `machines/gpuserver1/INDEX.md`, `reference/INDEX.md` files act as level-2 hubs. Each one links to the spokes the ethnographer catalogued.
6. Decide v0.1/v0.2 versioning convention (Q5 in section 12).
7. **Rollback:** every change is a normal git revert. The hub refresh is the lowest-risk, highest-value cleanup in the entire plan and could ship in Phase 3 day 1.

## 12. Risks and open questions for Alton

These cannot proceed without Alton's call. Numbered for easy reference in his response.

1. **Q1 — Direct git push from gpuserver1 (deploy key).** §6 recommends grant. Default if Alton declines: keep current inbox-only model. Cost of declining: receipts work but gpuserver1 still feels like a write-only black box.

2. **Q2 — Peer-to-peer memory writes for machine-owned facts.** §7 recommends reject for v0.1, revisit at first quarterly clean-slate review (2026-07-05). Default if Alton declines to decide: ship the recommendation.

3. **Q3 — Retire the stale Flask `dashboard/app.py`?** Dashboard-scout flagged that it overlaps with MERIDIAN, has its own `/api/memory/search` and `/api/memory/recent`, and there is no evidence it is in use. Recommendation: deprecate it before adding the Memory tab to MERIDIAN. Cost of keeping both: the "too many moving parts" failure mode that triggered this whole project.

4. **Q4 — MERIDIAN auth: shared password or localhost+SSH-tunnel?** §9.3 recommends shared password. Default if Alton declines: localhost-bind only, accept the loss of phone access.

5. **Q5 — `MASTERPLAN.md` rewrite vs archive vs split?** The 65-day-stale doc has 9 inbound links. Rewrite in place is the cheapest fix; archiving and writing `MASTERPLAN-v2.md` creates a versioning problem; splitting into smaller pages is the most invasive. Recommendation: rewrite in place, with a clear `History` entry noting what changed.

6. **Q6 — v0.1 / v0.2 file pair convention.** Two pages (`HOUSEHOLD-CONSTITUTION` and `MISSION`) have explicit version pairs. Recommendation: archive the v0.1 file to `archive/{path}-v0.1.md` and add `superseded_by` frontmatter to the v0.1 file pointing at the live one. The v0.1 file stays readable in git history; it just stops cluttering the active vault.

7. **Q7 — Feedback directory layout.** Operating Agreement §6 OPEN_QUESTIONS Q7 already raised this. Some feedback files are in `feedback/`, one (`feedback_pricing_autonomy.md`) is at the wiki root. Recommendation: standardize on `feedback/` as the directory; move the orphan; update MEMORY.md.

8. **Q8 — Conversation extractor opt-in vs default-on.** The extractor will surface a lot of low-confidence proposed memories. Alton's morning briefing will need to triage them. Is that load Alton wants? Recommendation: ship with default-on but with a per-day cap of 20 surfaced proposals; if Alton consistently rejects more than half, downgrade to opt-in.

9. **Q9 — LLM verification budget.** §3.4 caps at $0.50/day. Is that the right ceiling? Recommendation: start there, adjust at the first quarterly review.

10. **Q10 — IRS lookback period (3 vs 7 years).** Carried forward from Operating Agreement OPEN_QUESTIONS Q1. Not memory-system-specific but blocks the rental-operations pricing strategy that the memory system supports.

## 13. Phase 3 execution task breakdown

Twelve concrete sub-tasks. Each has owner-type, parallelizable-with, blocked-by, expected-time. Ready to be spawned by team-lead. Naming convention: `EX-N` (execute task N).

| ID | Name | Owner | Parallel-with | Blocked-by | Time |
|----|------|-------|---------------|-----------|------|
| EX-1 | **Hub refresh sweep**: rewrite MASTERPLAN.md, MACHINES.md, BUSINESS.md, PROCEDURES.md per §11 Phase I. Fix every contradiction the ethnographer catalogued. Add `last_verified` to all 14 canonical hubs. | Sonnet | EX-2, EX-3, EX-12 | none | 2-3h |
| EX-2 | **Orphan re-wiring**: create `business/INDEX.md`, `machines/gpuserver1/INDEX.md`, `reference/INDEX.md` as level-2 hubs. Wire the 32 orphan pages catalogued in ethnography §4. Add `superseded_by` frontmatter to v0.1 files (Q6 default). | Sonnet | EX-1, EX-3, EX-12 | none | 1.5-2h |
| EX-3 | **Foundations**: write `staleness.py`, `oracles.yml`, the staleness scoring function, the entity-freshness model. Backfill `last_verified` on the 14 hubs. Local-test only — no cron yet. | Opus | EX-1, EX-2 | none | 2h |
| EX-4 | **Curator pass + receipts**: write `curator-pass.py` per §5.1 cron #4. Implement the receipt mechanism per §5.4. Ship receipts directory scaffold. | Opus | EX-5, EX-6 | EX-3 | 3-4h |
| EX-5 | **gpuserver1 cron triplet**: rewrite `gather_mirror.sh` per §5.3, write `stale-detect.sh` per §5.1 cron #2, resurrect `vastai-tend.sh` per cron #3. Deploy to gpuserver1 via SSH. Test each in dry-run. | Sonnet | EX-4, EX-6 | EX-3 | 2-3h |
| EX-6 | **Obsidian Local REST API + mcp-obsidian** install per §8. Smoke test. Write `sartor/memory/skills/obsidian-control.md`. | Sonnet | EX-4, EX-5 | none | 1h |
| EX-7 | **Conversation extractor v1**: write `conversation-extract.py` with per-turn patterns and three-class feedback classifier per §4. Run once against the last 14-day corpus. Acceptance: recover ≥11 of the 13 LOST entries from the miner's catalog. | Opus | EX-8 | EX-4 | 4-5h |
| EX-8 | **MERIDIAN auth**: add HTTP basic auth or bearer-token cookie to `dashboard/family/server.py`. Smoke-test from phone + laptop + Rocinante. Hard gate for EX-9. | Sonnet | EX-7 | none | 1.5h |
| EX-9 | **MERIDIAN Memory tab**: build the five new endpoints (`/api/memory-recent`, `/api/cron-health`, `/api/inbox-status`, `/api/memory-search`, `/api/obsidian/open`), the Memory tab UI, the staleness heatmap. Per dashboard-scout's wireframe and LOC estimate. | Sonnet | EX-10 | EX-8, EX-3, EX-6 | 6-7h |
| EX-10 | **Improvement loop**: write `improvement-loop.py` per §10. Initialize `IMPROVEMENT-QUEUE.md`. Add cron #6. Wire top-3 surface into morning briefing. | Opus | EX-9 | EX-7 | 2-3h |
| EX-11 | **Cron cleanup on both machines**: kill the dead crons listed in §5.2. Verify exactly 6 active crons total (3 on gpuserver1, 3 on Rocinante). Update CRONS.md. Update LOGGING-INDEX.md. | Sonnet | none | EX-4, EX-5, EX-7, EX-10 | 1h |
| EX-12 | **Conventions doc upgrade**: add `last_verified`, `volatility`, `oracle` fields to MEMORY-CONVENTIONS.md schema. Document the basic-memory observation syntax adoption. Bump the doc version. | Sonnet | EX-1, EX-2, EX-3 | none | 1h |

**Total parallelizable wall time:** ~10-12h with 4 agents working in parallel. Sequential dependencies form three chains: (EX-3 → EX-4 → EX-7 → EX-10), (EX-3 → EX-5 → EX-11), and (EX-8 → EX-9). The hub-refresh and conventions work (EX-1, EX-2, EX-12) is fully parallel and unblocked, so it should fire on day 1.

Owner-type guidance:
- **Opus** for the synthesis-heavy work: scoring functions, the curator pass, the conversation extractor, the improvement loop. These need judgment calls and the Opus extra reasoning earns its keep.
- **Sonnet** for the mechanical work: hub refresh, orphan rewiring, MERIDIAN endpoints, cron deployment, plugin install. These are high-volume code-and-text tasks where Sonnet is the right tool.

After Phase 3 completes, Phase 4 (QA / red-team audit, task #7) verifies the receipt mechanism works end-to-end, the stale-detector doesn't miss the 14 hub files, the conversation extractor hits its recall threshold against the miner's catalog, and the dashboard auth is genuinely scoped to 127.0.0.1 or behind a real password. Phase 5 (final report, task #8) writes the 1500-word delivery to Alton with the open-question answers folded in.

— synthesizer, 2026-04-12
