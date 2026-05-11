---
type: agent-brief
entity: memory-builder
status: proposed-not-spawned
date: 2026-05-02
updated: 2026-05-02
updated_by: memory-engineer (family-thread)
related: [memory-improvement-program-v0.1, memory-cartography, pipelines-audit, auto-injection-budget-2026-05-02, inbox-keep-list-2026-05-02]
tags: [meta/agent-brief, domain/memory, household/governance]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# memory-builder — Phase A execution brief (proposed, awaiting team-lead approval to spawn)

> [!warning] **Not spawned.** This document is the brief team-lead reviews before authorizing spawn. memory-engineer designed; team-lead spawns.

## Role

`memory-builder` executes the ratified portions of the Memory Improvement Program v0.1. Trust model: same as `dashboard-engineer` reports to `dashboard-keeper`. Reports to `memory-engineer`. Read-only at agent's discretion. Any move/delete/edit-to-`.claude/scheduled-tasks/`/edit-to-hook-script requires explicit greenlight from memory-engineer (who escalates to team-lead → Alton as needed).

## Scope (Week 1 PR — three items + two diagnostic fixes, all in one PR)

Scope is bounded. Anything outside this list requires a new brief.

### Item 1 — A6 (was B2): feedback-rule JIT loader (`triggers:` frontmatter)

**Biggest single orientation win in the program. Ship first.**

- Add `triggers:` field to all 24 `sartor/memory/feedback/*.md` frontmatter. Default `triggers: [always]` (preserves today's behavior; backward-compatible).
- For these 8 files, narrow to specific triggers (memory-engineer's recommended starting set, subject to team-lead review):
  - `feedback_pricing_autonomy.md` → `triggers: [vastai, gpu-pricing-optimizer, gpu-fleet-check, business/rental-operations, machines/gpuserver1]`
  - `feedback_gather_respects_out_of_band_closures.md` → `triggers: [personal-data-gather, family/active-todos]`
  - `trust-but-verify-subagent-reports.md` → `triggers: [Agent, TaskCreate, complex-project, multi-agent-orchestration]`
  - `federation-grep-before-delegation.md` → `triggers: [peer-comms, gpuserver1, rtxpro6000server, ssh]`
  - `feedback_objective_level_delegation.md` → `triggers: [peer-comms, gpuserver1, rtxpro6000server, Agent]`
  - `feedback_protected_paths.md` → `triggers: [.claude/, scheduled-tasks/, hooks.json, settings.json]`
  - `feedback_preserve_frontmatter.md` → `triggers: [Edit, Write, .md]` (keep nearly-always for safety)
  - `feedback_no_permissions.md` → `triggers: [Agent, bypassPermissions]`
- Modify `Sartor-claude-network/scripts/home-agent/memory/inject-user-context.sh` to read each feedback file's `triggers:` frontmatter and skip non-matching ones. Trigger context: SessionStart hook gets the cwd and skill list; richer context (last user prompt, last tool call) is post-MVP. For now, `triggers: [always]` AND `triggers: <skill-name>` work; full action-time JIT requires Phase B1-β (skill-prelude) which is out of scope.
- **Acceptance test (memory-engineer verifies)**: hook output for a fresh session in `C:\Users\alto8` is ≤30 KB (down from ~88 KB). MEMORY.md and QUICK-REFERENCE.md still present. Feedback files marked `[always]` still present. Feedback files with specific triggers absent.
- **Reversibility**: revert the bash conditional + remove `triggers:` field from 24 frontmatter blocks via one `git checkout`.

### Item 2 — A1: MEMORY.md trim swap

- `git mv sartor/memory/MEMORY.md sartor/memory/MEMORY.md.bak`
- `git mv sartor/memory/MEMORY.md.proposed sartor/memory/MEMORY.md`
- `MEMORY.md.proposed` was drafted by memory-cartographer; preserves frontmatter, critical-rules text, and adds a compressed History section that wikilinks to topic files.
- **Acceptance test**: new MEMORY.md is ≤8 KB; the auto-memory system loads it without truncation warning.
- **Reversibility**: swap back via `git mv`. The .bak survives in git history forever.

### Item 3 — A2: inbox poisoning drain (cartographer's keep-list is the source of truth)

Three sub-steps and four diagnostic fixes:

**Drain (data side):**

3a. **Bulk-discard ~210 files via `git rm`.** Predicate: any file in `sartor/memory/inbox/` with frontmatter `dedup_status: already_landed`. Use cartographer's `inbox-bodyhash-table-2026-05-02.tsv` as the canonical file list. Do NOT use `rm` — files must remain recoverable from git history.

3b. **Write `sartor/memory/inbox/.drained/2026-05-02/extractor-bulk/SUMMARY.md`** with per-category counts (numbers come from cartographer's TSV).

3c. **Hand-review 8 singletons** flagged in `inbox-keep-list-2026-05-02.md` as "REVIEW." Predicate: `dedup_status: new` AND `extractor_subclass ∈ {explicit_memorize, task_batch, rule, preference, entity_vishala, entity_aneeta, dollar_amount}`. For each: either drain to `_processed/` (if landed in topic file) or keep (if action pending) or discard (if noise). memory-engineer reviews verdicts before commit.

3d. **Cross-check 23 peer files** flagged KEEP-IF-OPEN in cartographer's table. Each gets cross-checked against `_processed/` companion + relevant project doc (e.g., `PHONE-HOME-cato-003-charges.md` ↔ `projects/sartor-agent-os/`). No moves; just a verdict in the SUMMARY.md ("still open" / "completed; can drain" / "stale; discard").

**Diagnostic fixes (pipeline side, same PR):**

3e. **Upstream extractor fix.** Likely substrate: `SartorConversationExtract` Windows Scheduled Task (per `pipelines-audit.md` §F, daily 11:30 PM). Find the extractor script (memory-builder identifies via Task Scheduler XML or by tracing the `_processed/` directory's mtime/owner). Add a one-line eligibility filter: skip writing a proposal when `dedup_status: already_landed` would be the result. Document the change in the PR description.

3f. **Catchup-skill fix.** Verified live in this session via `<system-reminder>` skill list: catchup description "Read all Sartor memory files to get full context on Alton…" is the extractor's Source-quote trigger. Two options, memory-builder picks based on extractor architecture: (a) the catchup skill's invocation context is excluded from extractor eligibility scans, or (b) the extractor ignores source quotes that match a known-skill-template fingerprint. Pick the lower-blast-radius option.

3g. **`docs/USER.md` investigation.** A4 found the SessionStart hook silently `cat`s `docs/USER.md` to stderr but the file does not exist. Either restore the curator pipeline that produces it (find the curator's USER.md output target — likely `nightly-memory-curation/SKILL.md` configured with the wrong path) OR remove the dead reference from `inject-user-context.sh`. Pick whichever is correct. Document in the PR.

3h. **Re-run baseline + verify.** Cartographer's `_inbox_analysis.py` + `_singletons_and_peers.py` are pinned at `projects/family-thread-dossier/`. Run BEFORE the cleanup commit (snapshot to `family-thread-dossier/inbox-baseline-pre-cleanup-2026-05-02.tsv`). Schedule the verify-after-7-days re-run as a calendar reminder for memory-engineer; verify states `extractor_proposed ≤ 30 files` and `0 dedup_status: already_landed survivors` after the upstream fix.

## What memory-builder MUST NOT do

- **Not** modify any file under `sartor/memory/family/` (family-curator owns it).
- **Not** modify `MEMORY.md` content beyond the A1 swap (cartographer's `.proposed` is the agreed text).
- **Not** modify `HOUSEHOLD-CONSTITUTION.md`.
- **Not** modify any skill under `.claude/skills/` except for the catchup-skill fix (3f), and that requires explicit memory-engineer + team-lead greenlight before commit because skill edits affect every session.
- **Not** modify any agent definition under `.claude/agents/`.
- **Not** push to `github` remote (per CLAUDE.md: peers push to `origin` = rtxserver bare).
- **Not** spawn additional sub-agents without memory-engineer approval.
- **Not** start Phase B / C / D / E work; this brief is Phase A only.

## Greenlight gates (memory-builder pauses for explicit yes)

1. After 3a's discard candidate list is computed (before `git rm` runs): show the count and predicate match-rate to memory-engineer for sanity check.
2. After 3c hand-review verdicts: memory-engineer reviews each before commit.
3. After 3e identifies the extractor script and proposed patch: memory-engineer reviews the diff before applying.
4. After 3f picks option (a) or (b): memory-engineer + team-lead review (skill-edit blast radius).
5. Before commit + push: memory-engineer reviews the full PR diff (file count, byte delta, hook-output measurement).

## Tools required

- Read, Write, Edit, Bash, Grep, Glob (standard).
- Git (for `git mv`, `git rm`, commit, push to `origin`).
- Python (to run cartographer's `_inbox_analysis.py` and `_singletons_and_peers.py`).
- TaskUpdate / TaskList (status reporting back to memory-engineer).
- SendMessage (to memory-engineer for greenlight gates).
- No Agent tool; no TeamCreate; no peer-machine SSH.

## Working directory

`C:\Users\alto8\` (cwd resets between bash calls; use absolute paths).

## Estimated effort

- 3a + 3b: 30 min (mechanical script).
- 3c: 30 min (8 files, hand review).
- 3d: 1 hr (23 files, cross-checks).
- 3e: 30 min (find extractor + apply 1-line patch).
- 3f: 30 min once option chosen (15 min to identify; 15 min to patch).
- 3g: 15 min (one of: restore pipeline OR remove hook line).
- 3h: 5 min (run script, save TSV).
- Item 1 (A6): 30 min hook script edit + 4 hr per-file trigger declarations (24 files × 10 min mean).
- Item 2 (A1): 5 min (`git mv` swap).
- **Total: ~7-8 hours of focused work** plus memory-engineer review cycles at each gate.

Sequence within the brief: **A1 first** (5 min, deterministic, immediate orientation win); **A6 second** (biggest lever, can interleave per-file work with A2 review); **A2 third** (largest blast radius, gated heaviest).

## Spec metadata

- `originSessionId`: family-thread (memory-engineer)
- `model_recommendation`: sonnet (Phase A execution is mechanical-with-judgment, not novel design; opus reserved for future Phase B / C work)
- `concurrent`: yes — A1 (5 min) and A6's per-file frontmatter edits can interleave with A2's hand-review cycles. memory-engineer sequences.

## History

- 2026-05-02: drafted by memory-engineer after Alton's auto-mode / team-lead's A2-greenlight + A4 audit + cartographer's keep-list. Status: proposed-not-spawned. Awaiting team-lead approval before spawn.
