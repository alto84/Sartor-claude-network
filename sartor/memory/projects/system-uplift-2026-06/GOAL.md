# GOAL — System-Wide Uplift of the Sartor Claude Network

```yaml
status: active
opened: 2026-06-09
owner: Alton + Rocinante Claude (joint working plan)
source: ultracode review 2026-06-09 — 10 domains, 66 agents, 877 inspections,
        54/55 findings adversarially verified (1 rejected)
state_file: this file. Update §Recent progress on every working session.
```

## Mission

Bring the system's *stated* properties back into alignment with its *actual*
properties, then make that alignment self-maintaining. Not a rewrite — the
deliberately-built core (fleet repricer/watchdog, curator/extractor, os-control
gate, wiki reindex) is good. The uplift closes loops, deletes dead weight, and
makes silent failure structurally impossible.

## The Fable Perspective (Claude's own read, distinct from the agent consensus)

Four convictions, held with reasons:

1. **The defining pathology is open-loop automation, not missing automation.**
   Nearly every incident in this review — 5-week mirror split-brain, dead
   heartbeat spine, 221 wifi-health failure memos, never-run
   daily-household-health, gmail scanner that exits 0 having done nothing — is
   a detector whose output nothing consumes. Building more monitors makes this
   *worse*. The single highest-leverage artifact is U1's freshness auditor: one
   loop-closer that converts the entire silent-failure class into a detected
   class. Everything else queues behind it.

2. **The system over-produces writing and under-produces deletion.** The inbox
   is 79% of all memory files; the improvement queue re-appends the same signal
   1,388 times; monitors write the same failure every 15 minutes. Memory
   without forgetting is noise, and noise trains both of us to ignore channels
   that will one day carry a real alarm. State-transition-only memos + TTLs
   (U2) are a values question as much as an engineering one: the household
   record should be what *changed*, not what *ran*.

3. **Documentation here drifted from record to aspiration.** CLAUDE.md's
   Scheduled Tasks table is ~45% fiction; README describes a platform dead
   since January. Every fresh agent — including me, this morning — boots with
   false beliefs about what safety nets exist. Hand-maintained inventory tables
   should be *generated* (opportunity #3); prose docs should carry a
   `last_verified` date the freshness auditor can age.

4. **Trust the patterns that already work; retire the rituals without guilt.**
   The two demonstrably-closing loops are the feedback-file channel (proven
   behavior change) and the fleet repricer/watchdog (bounded, audited,
   money-safe). The skill-evolution / trajectory / critic-sentinel apparatus
   has produced zero applied changes and has been dead since 05-02 anyway.
   The lesson: small, bounded, *consumed* artifacts beat elaborate
   self-improvement machinery. U5 retires the ritual layer and doubles down on
   what works.

Two sequencing convictions that sharpen the agent consensus:

- **The GitHub split-brain merge is the first action of Phase 1**, not one item
  among many — three weeks of gathered financial/family facts exist only on a
  disaster-recovery mirror that the canonical repo would clobber. That is data
  at genuine risk today.
- **MERIDIAN must not restart before server-side kid-tier enforcement lands
  (C7).** Children's privacy is a Constitution §7 hard constraint; a dashboard
  whose only kid-gating is client-side JS is a constitutional violation waiting
  on a `python server.py`. Treat C7 as a gate, not a task.

## State of the system (verified, 2026-06-09)

Strong core, decayed periphery. Working: repricer bounds held through the
06-03 whipsaw; curator/extractor runs with receipts; credentials/ carries no
tracked secrets; gate.ps1 is genuinely fail-closed; wiki reindex nightly.
Broken right now: GitHub mirror DIVERGED ~5 weeks (90 cloud-agent commits
GitHub-only, 120+ canonical-only); Bitwarden session dead since 06-07 (UniFi
off-site backup, wifi monitor, network dashboard all down); watchdog phone
channel never configured; daily-household-health has never produced a report;
5 of 18 live Windows tasks failing with nonzero LastTaskResult; a live Obsidian
bearer token committed since 02-05; MERIDIAN kid-tier enforced client-side
only (dark server is the only mitigation).

---

## Critical fixes (C1–C12) — blast-radius order

| # | What | Effort | Key evidence |
|---|------|--------|--------------|
| C1 | **GitHub split-brain**: one-time `git merge github/main` → push origin then github; repoint cloud gather agents to a `claude/gather` branch Rocinante auto-merges; DIVERGED must page, not log; fix the "every 15 min" cadence lie (actual: daily 03:30) | M | `backups/sartor-mirror.log`; `git log github/main --not main` = 90 commits |
| C2 | **Bitwarden restore + de-fragilize**: unlock now; move read-only monitors (UniFi superadmin) to per-service token files; rotate `network-dashboard.log` (6.5 MB of tracebacks) | M | `backups/bw-corrupt-quarantine-2026-06-07/` |
| C3 | **Watchdog phone channel** ⚡: create `business/watchdog-notify.yaml` with Pushover token (code paths exist, fleet-watchdog.py:618-633); live test; investigate who changed $0.75→$0.90 on 06-06 | S | fleet-watchdog.py:607 `unconfigured` |
| C4 | **Rotate committed Obsidian token** ⚡: in `dashboard/lib/skills/knowledge.ts:26` + `scripts/completion-check.ts:135`; replace with env/launcher pattern | S | in history + github/main since 2026-02-05 |
| C5 | **REGISTRY/ssh IP truth-up** ⚡: Rocinante .169→.171; `rtxserver-bmc` .154→.150; teach check-registry.py to self-correct its run host; status-change-only memos | S | 15 unactioned registry-drift memos |
| C6 | **daily-household-health gets a real runner** (`claude -p` wrapper per morning-briefing pattern); revive-or-strike: todo-sync, market-close-summary, weekly-financial-summary, weekly-nonprofit-review; CLAUDE.md table amendment → Alton | M | zero `health-*.md` ever produced |
| C7 | **MERIDIAN server-side tier enforcement — GATE before any restart**: endpoint→tier map; adversarial kid-tier test; fix `MERIDIAN_DEV` global-auth-off env var (server.py:1925); non-deterministic session tokens; loopback `/login/legacy` | M | server.py:309-326, 659, 878-881 |
| C8 | **Repricer trustworthiness**: strict-2GPU branch needs ≥3 comps (06-03 whipsaw cause); timeout-wrap `apply_listing`; refuse apply on `live_gpu_cost is None`; atomic state writes; pytest suite for `compute()`/`evaluate_machine()` | M | reprice.py:229-231, 320-326, 383, 403 |
| C9 | **gpuserver2 bringup debt** ⚡: delete temp ufw 8088 rule on gpuserver1; rotate the temp password; add teardown step to onboarding procedure | S | bringup LOG flags both as MUST |
| C10 | **Gmail scan fix-or-retire**: never fetched one email (libs not installed, creds dir absent), exits 0 — silent no-op ×5/day; either finish setup or unregister; credential absence must exit non-zero | S | gmail_scan.py:282-283, 341-343, 429 |
| C11 | **`{hash}` placeholder bug** ⚡: conversation_extract.py:572/583/594 emit literal `feedback_rule_{hash}.md`; curator should also reject brace placeholders | S | known since memory-system-v2 QA audit, never fixed |
| C12 | **Security posture honesty**: PreToolUse hooks gate Bash only (Read/PowerShell ungated) — convert credential rules to path-based ACL across all matchers; gitleaks pre-commit; fix gate/confirm enum drift (`export-secrets` vs `export-logins`) + per-ActionClass smoke test; longer-term per-machine Claude creds | M | settings.json hooks; confirm.ps1:20 |

## Structural uplift (U1–U8) — each unblocks the next

- **U1. Declarative task manifest + artifact-freshness auditor.** One
  `machines/rocinante/tasks.yaml` (name, trigger, command, log, output
  artifact, max-staleness); idempotent `register-all.ps1` generated from it;
  auditor checks **artifacts not exit codes** → one deduped alert. Would have
  caught the heartbeat death, gmail no-op, Bitwarden breakage, and mirror
  divergence. *Do first in Phase 2.*
- **U2. Memo state-machine + inbox lifecycle.** Sticky status file per monitor
  (first_seen/last_seen/count), dated memo only on transition; routing manifest
  with TTLs replacing the hardcoded `RESERVED_DIRS` skip; sweep alerts/595,
  _temp-summary/728, status/266, _stale-alerts/229; unfreeze curator
  (restore non-zero `--max-drain`, review the 104 deferred).
- **U3. REGISTRY.yaml as single roster.** Generate ssh-config + hosts entries;
  derive peer lists in peer-send.py / creds-sync / sessions-mirror /
  wellness-checker from a `peer_claude: true` flag. **Before gpuserver2 goes
  live** — it's currently absent from all four hand-maintained rosters.
- **U4. De-SPOF Rocinante.** GitHub mirror moves to rtxserver (post-receive
  hook + deploy key); reverse heartbeat (rtxserver watches Rocinante,
  escalates >24h); OpenSSH Server on Rocinante for remote recovery.
- **U5. One consolidated weekly review + statused queue.** Retire
  critic/auditor/sentinel defs, weekly-skill-evolution, trajectory hooks (dead
  consumers); JSONL queue with open/escalated/resolved replacing the 724 KB
  append-only IMPROVEMENT-QUEUE.md; fix morning_briefing.py:680 oldest-3
  forever-loop; lean into feedback files — the only proven channel.
- **U6. Archive the dead Dec-2025 platform.** ~793 tracked files across
  claude-network/ src/ framework/ coordinator/ workers/ mcp-server/ firebase/
  python/ memories/ plans/ skills/ commands/ github/ examples/ hooks/ config/
  tests/ .swarm/ → `archive/memory-system-2025-12/` + manifest. Rewrite
  README.md as the home-agent landing page. **Trap:** retire the
  `sartor-memory` MCP entry in `.claude/mcp-config.json` in the same change.
  Needs Alton's sign-off on the sweep.
- **U7. MERIDIAN consolidation (after C7).** Execute approved EXPLORE-04
  dispositions (archive Flask app.py, static/ 16 MB fractals, RALPH leftovers);
  Next.js tree is KEEP-IN-PLACE per approved record — moving it is a fresh
  Alton decision; split server.py (4,188 lines); `asyncio.to_thread` the 18
  blocking subprocess calls (one slow SSH freezes the whole dashboard).
- **U8. Precomputed link index.** staleness.py rescans 3,147 files per call —
  2m06s of the 2m14s briefing; consume the nightly wiki-reindex backlinks
  artifact instead. Also fixes the hanging test suite.

## Hygiene backlog (work packages)

- **WP-A** git index: untrack coverage/, network-dashboard.html (regenerated
  5-min artifact, permanently dirty tree); gitignore .playwright-profile/,
  .claude/worktrees/. (S)
- **WP-B** worktrees + disk: remove 5 merged worktrees (~1.5 GB on a drive at
  ~4.7% free); inspect-before-touch: pihole-deployment, replan-overview-html;
  `git gc` (28 packs). (S)
- **WP-C** sartor/ dead-code sweep: archive heartbeat.py, scheduled_executor.py,
  run_observers.py, brief.py, safety_api.py, costs.py; regroup live spine into
  `sartor/pipeline/`. (M)
- **WP-D** test repair: skip-guard test_safety_api.py; hermetic TestFullBriefing;
  then nightly `pytest sartor/` surfaced in briefing. (S)
- **WP-E** doc truth-ups: reference_memory_server.md cadence contradiction;
  mirror-script header; GOAL.md research status active→paused; CLAUDE.md
  inventory amendment → Alton. (S)
- **WP-F** root strays: capture scripts → archive; delete rufus.com. (S)
- **WP-G** hours-log timezone: fixed UTC-4 → ZoneInfo('America/New_York') —
  the §469 record is mis-bucketed ~4.5 months/year. (S)

## Interesting opportunities (value/effort ranked)

1. Artifact-freshness contracts everywhere (U1's pattern, generalized)
2. EMA-smoothed repricer inputs — back-test offline against the 1,072-row
   reprice-log.jsonl before deploying (S)
3. Generated CLAUDE.md inventory tables from `.claude/` frontmatter (S)
4. `price_mode: dynamic` + approved band in fleet.yaml (resolves D1 semantics;
   needs Alton's band)
5. No-IP-literals pre-commit lint (whitelist REGISTRY-sourced; UniFi inform
   URLs stay LAN-addressed)
6. Sparse-checkout profiles for peers (post-U6; peers clone ~150 MB not 4.6 GB)
7. Feedback-file candidate mining from transcripts (the proven channel) (M)
8. Wiki-hygiene closer for broken-links/orphans (160 orphans, +27% since
   mid-May) (M)
9. Credential inventory + rotation runbook (5 distinct secret stores, no
   inventory) (S)

## §Blocked on Alton — explicit decisions

| D | Decision | Context |
|---|----------|---------|
| D-A | CLAUDE.md Scheduled Tasks table amendment (strike/revive the 5 runnerless entries) | C6/WP-E; table changes need approval per CLAUDE.md |
| D-B | Dead-platform archival sweep sign-off (U6, ~793 files) | reversible (git mv) but big |
| D-C | Next.js "Nestly" tree disposition | KEEP-IN-PLACE per approved record; changing that is yours |
| D-D | Pricing band for `price_mode: dynamic` (relates to standing D1: $1.10 live vs $0.92 approved) | opportunity 4 |
| D-E | Phone-alert channel choice (Pushover vs Telegram) + token | C3, 5 minutes once chosen |
| D-F | gmail scan: finish OAuth setup (interactive step is yours) or retire | C10 |

## §Tractable now (no Alton gate, autonomy-when-named applies)

Phase 1 list, every item independently shippable + reversible:
C1-immediate (merge), C4, C5, C9, C11, C2-immediate (unlock — needs your vault
password, so semi-gated), WP-A, WP-B (merged worktrees only), WP-G.
**Phase 1 exit criterion:** zero Sartor tasks with nonzero LastTaskResult; no
live secrets in tracked files; ORANGE drift cleared or phone-alerted.

**Phase 2 (1–2 weeks):** U1 first, then C6, C1-structural, C2-structural, C8,
U2, C12, U8, WP-C/D/E.
**Exit:** `pytest sartor/` green nightly; inbox count declining
week-over-week; a deliberately-broken test task produces a next-morning alert.

**Phase 3 (2–4 weeks):** U3 (before gpuserver2 live), U4, U6, C7+U7, U5, WP-F,
opportunities 1–5.
**Exit:** ~12 top-level dirs; fresh agent reading README+CLAUDE.md gets only
true statements; MERIDIAN live with kid-tier adversarial test passing;
machine #5 onboarding is one documented step.

## §Recent progress

- **2026-06-09 (evening) — C1-immediate DONE: split-brain reconciled.**
  Merged `github/main` (97 cloud-agent gather commits, ~3 weeks of
  financial/family facts) into canonical main; 3 frontmatter conflicts
  resolved (newest-run wins, local verification dates preserved); both sides
  of today's twice-written daily log folded together. Pushed to origin AND
  github — converged at one head. **Still open (C1-structural): cloud gather
  agents continue pushing to github/main, so divergence resumes on their next
  run until they're repointed to a `claude/gather` branch or the mirror
  script auto-merges.** That fix is Phase 2.
- **2026-06-09 (evening) — Purge pass executed** on Alton's greenlight
  ("crop / prune so we can grow beautifully"). Done, in 7 commits:
  - **U6 (bulk)**: 837 tracked files archived — 17 dead Dec-2025 platform
    trees + root Node/TS toolchain + 9 orphaned root-tsconfig TS scripts +
    the unwired `.claude` hook system (hooks/, hooks.json, AGENT_ROLES.md,
    FILES_CREATED.txt, dead mcp-config.json) → `archive/memory-system-2025-12/`
    with manifest. Verified zero live dependents first (live MCP config is
    `.mcp.json`; gdrive is a user-scope global binary). Root `node_modules/`
    (562 MB) deleted from disk. README rewritten as honest home-agent landing
    page. *docs/ deliberately left — mixed-era, needs a finer pass.*
  - **WP-A**: coverage/ and generated network-dashboard.html untracked;
    gitignore now covers playwright profiles, `.claude/worktrees/`, coverage;
    experiments-log tracking intent documented.
  - **WP-B**: 6 merged/contained worktrees + 6 stale branches removed (~1.5 GB);
    detached worktree's 5 unmerged commits preserved on
    `preserve/directive-2026-05-12-wrapup`; kept `pihole-deployment-2026-05-17`
    (real blocked work) and `replan-html-rocinante` (unmerged). git gc:
    28 packs → 2, .git now 217 MB.
  - **WP-C**: heartbeat spine (heartbeat/scheduled_executor/run_observers) +
    brief.py, safety_api.py(+test), costs.py, create-heartbeat-task.ps1 →
    `archive/sartor-dead-code-2026-06/`; orphaned TestCostTracker removed from
    test_sartor.py (parses clean).
  - **WP-F**: capture strays archived; rufus.com deleted (was untracked).
  - **Memo floods**: 237 identical failure memos pruned to latest-only
    (wifi-health 223, registry-drift 14). Producers keep refilling until C2
    (Bitwarden unlock — needs Alton's vault) and C5 (registry IP) land.
  - **D-A prepared**: CLAUDE.md amendment proposal filed at
    `inbox/rocinante/2026-06-09-claude-md-amendment-proposal.md`.
- **2026-06-09** — Plan opened. Ultracode review ran (10 domains, 66 agents,
  54 verified findings, 1 rejected). Synthesized from the workflow output +
  Rocinante Claude's first-hand pass (wifi-health flood, hooks-vs-trajectory
  ritual gap, dead-tree census).
