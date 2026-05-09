# Memory architecture audit — 2026-04-18

Auditor: memory-auditor subagent (Opus 4.7 1M). Scope: `C:\Users\alto8\Sartor-claude-network\sartor\memory\` and its conventions, feedback, inboxes, projects, machines, and daily logs. No emojis. No em-dashes. Carry-over disciplines applied (interior-report-discipline, completeness-principle). Prosecution is fair but honest because this is the system Alton built himself.

## 1. Architecture snapshot

Concretely: the wiki is 272 markdown files in 19 subdirectories at `sartor/memory/` plus 7 Python modules (`extract_graph.py`, `curator.py`, `wiki.py`, `search.py`, `embeddings.py`, `autodream.py`, `decay.py`). MEMORY.md is the auto-injected index. Conventions live in `reference/MEMORY-CONVENTIONS.md` v0.3 (YAML frontmatter + Obsidian callouts + wikilinks, now with typed `rel:` prefix). Feedback rules are 11 files in `feedback/`. The graph is 157 unique wikilink targets across 980 link occurrences. Inbox pattern is per-hostname (`inbox/rocinante/`, `inbox/gpuserver1/`) with receipts, curator logs, flagged items, and specs. The system is already an Obsidian vault (`.obsidian/` present). The Python curator has been invoked once successfully (2026-04-16T19:04:49Z, dry-run, zero entries processed). This is consistent with the stated fact that the curator agent "was a ghost" until §2 of the OPERATING-AGREEMENT is built out.

## 2. Frontmatter compliance

Across 272 markdown files (excluding `reference/archive/`, `.obsidian/`, `__pycache__/`, `.scratch/`, `.index/`):
- 217 files (79.8%) have YAML frontmatter
- 134 files (49%) have a parseable `updated:` date; distribution peaks at 2026-04-11 (41) and 2026-04-12 (37), trailing to 2026-04-18 (13)
- 103 files have `tags:`; 103 have `related:`; 26 have `last_verified:`
- 55 files have no frontmatter at all. Of these, 27 are daily logs from `daily/2026-02-06.md` through `daily/2026-04-14.md` written before the convention was adopted. This is an incremental-migration outcome from the "migrate on touch" policy in MEMORY-CONVENTIONS.md, not an error.

Spot-check of 25 representative files:
- All 10 core entity files (ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES) are fully compliant with type + updated + updated_by + tags + related + last_verified.
- `reference/OPERATING-AGREEMENT.md` lacks `tags` and `updated_by`.
- 9 of the 11 `feedback/` files lack `updated:` and `tags:`. Only `completeness-principle.md` and `gather-triage-2026-04-16.md` are fully compliant; the other 9 use a minimal `name/description/type` schema that does not match MEMORY-CONVENTIONS v0.3.
- `reference_home_network.md` (orphan at memory root) has no `updated:` at all and mixes Obsidian skill-style frontmatter (`name:`, `description:`) with type-only conventions.

**Headline rate: 79.8% have frontmatter, 49% have `updated:`. Core hub files are clean. The long tail (daily logs pre-adoption, feedback files on an older schema) is where compliance degrades.**

## 3. Wikilink integrity

- 980 wikilink occurrences, 157 unique targets
- 716 resolve to existing files (73.1%); **264 are orphaned (26.9%)**
- 36 unique orphan targets

**Top 5 most-linked targets:** ALTON (74), family/active-todos (71), FAMILY (38), TAXES (32), MACHINES (30). All resolve; these are the load-bearing hubs.

**Top 5 orphaned targets (all from the `mini-lab-2026-04-11` project cluster):**
1. `adverse-events/CRS` (29 occurrences)
2. `mitigations/corticosteroids` (26)
3. `adverse-events/ICANS` (24)
4. `mitigations/tocilizumab` (24)
5. `models/risk-model` (22), tied with `adverse-events/ICAHS` (22)

Every top orphan is a CRS/ICANS cell-therapy-safety link from the mini-lab experiment, pointing at nodes the lab session never actually created. The lab report (22,881 words, largest single file in the wiki) seeded a speculative graph that was never populated. This is the single largest driver of orphan count. The next tier of orphans (`FILE`, `wikilink`, `target`, 16 of them) are verbatim quotes from MEMORY-CONVENTIONS.md's documentation of syntax, not real links. If those are filtered, real orphans are closer to 240.

## 4. Inbox state

`inbox/gpuserver1/`:
- `_heartbeat.md` is the Unix epoch placeholder from 2026-04-16; gpuserver1 has never written a live heartbeat
- `_tasks/` has 3 items: a heartbeat-amendment task (2026-04-16, age 2 days), a pull-fresh task for today (2026-04-18), and a README
- `_inbox-only-log.md` last touched 2026-04-12

`inbox/rocinante/`:
- `proposed-memories/` holds 53 items across 4 date-folders. **20 items from 2026-04-14 are 4 days old and have never been drained.** 20 items from 2026-04-16 contain live Gmail signals (Aneeta employer change, CAQH reattestation, $12.9K Wohelo payment, tax extension payments, Chase Sapphire Reserve fraud reissue) that have real facts waiting to merge into ALTON.md / FAMILY.md / TAXES.md
- `_curator_logs/` has one log: 2026-04-16T19:04:49Z, dry-run, 0 entries processed on either side
- `_flagged/` contains the two stale-heartbeat flags from that run and 4 flagged-triage items from 2026-04-16

**The headline is the curator has run exactly once successfully and processed zero entries. The 53 proposed memories are the backlog this system is supposed to drain.**

## 5. Index coverage

- `reference/INDEX.md` is missing 3 files present in `reference/`: `gstack-review-2026-04-18.md`, `microsoft-store-pua-pattern.md`, and `network.md`. Two non-md artifacts (`nwjs-remote-loader.yar`, `nwjs-remote-loader-msix.yml`) are also uncatalogued. The MEMORY.md "Prior" history section mentions both microsoft-store-pua and nwjs files, but the reference index was not updated when those were added on 2026-04-16.
- MEMORY.md's "Other top-level memory files" list claims the root contains `gpuserver1-monitoring-log.md`, `log.md`, and `reference_home_network.md` alongside the 10 core files. This matches reality.
- MEMORY.md's "Core knowledge" list (ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES) exactly matches the 10 entity files present.
- `projects/INDEX.md` does not list `curator-fixes/`, `hermes-dashboard-upgrade/`, or `2025-photo-book/` subfolders.

## 6. Staleness

No core entity file is `updated:` more than 14 days old. The oldest is QUICK-REFERENCE.md at 11 days (2026-04-07). ASTRAZENECA.md at 8 days (2026-04-10) is second-oldest. Both MASTERPLAN files, MACHINES.md, and PROCEDURES.md all sit at 6 days (2026-04-12). The hub-refresher pass ran on 2026-04-16 and touched most core hubs.

`last_verified:` lag is more concerning: 6 of 10 core hubs were last verified 2026-04-12 (6 days), only FAMILY/BUSINESS/PROJECTS/SELF have 2026-04-16. TAXES.md's last_verified is 2026-04-12 despite a new `updated:` of 2026-04-17 (verified by personal-data-gather); this is correct per the spec (updated is content change, verified is explicit re-confirmation) but suggests the weekly verification pass is not running.

**Recommendation: refresh ASTRAZENECA.md (W-2 DE to NJ admin item, recruiter market signal). QUICK-REFERENCE.md was 11 days, and the Rocinante Chrome path / Vast.ai pricing have both been confirmed stable, so a `last_verified` bump would suffice.**

## 7. Structural issues

- **Duplicated kids data:** FAMILY.md lists Vayu/Vishala/Vasu with DOBs and schools; CLAUDE.md lists the same kids in its Household Context table; `family/vayu.md`, `family/vishala.md`, `family/vasu.md` exist as sub-pages. CLAUDE.md says "age 10 / age 8 / age 4" but FAMILY.md gives DOBs of 2015-08-14 / 2017-07-29 / 2022-01-14 which compute consistently at today's date. No divergence found, but three sources of truth for a mutating field (age) is a drift risk.
- **Orphan at root:** `reference_home_network.md` uses underscore-prefix naming and lives at the root; it should arguably be in `reference/` per its content (Sonos/Google Home network topology).
- **gpuserver1 monitoring log at root:** `gpuserver1-monitoring-log.md` is a rolling log at the memory root; this is inconsistent with machines having their own directories at `machines/gpuserver1/`. Should probably move to `machines/gpuserver1/monitoring-log.md`.
- **`.meta/consolidation-log.md` has no frontmatter** despite being a curator-facing metadata file.
- **`machines/rocinante/` is thin:** only `CRONS.md`. No MISSION.md. gpuserver1 has both. The per-machine convention is asymmetrically applied.
- **9 of 11 feedback files** use an older Obsidian-skill schema (`name:`, `description:`, `type:`) without `updated:` or `tags:` and fail the MEMORY-CONVENTIONS v0.3 frontmatter check.

## 8. The three gstack ports in flight

Reviewed `experiments/2026-04-18-gstack-port/wikilinks-impl.md` and the current extractor.

**Typed wikilinks (port 1):** Extractor runs clean, 21 edges from 5 files across 275 scanned. Vocabulary is locked at 9 relations. Schema is clean. **No schema tweaks needed based on this audit.** One real concern: the extractor preserves target slugs verbatim without path normalization (as documented). Given that 264 existing wikilinks are orphaned, if typed links are seeded aggressively without auditing targets, the graph will carry orphan edges too. Recommendation: add a `--validate` mode to `extract_graph.py` that cross-checks target slugs against a flattened filename set and emits warnings. Low effort, prevents graph pollution.

**PREAMBLE template (port 2):** Inspected `PREAMBLE.tmpl` and `render_skills.py` in the port dir. No conflicts with the wiki spec. This is a `.claude/skills/*` concern, not a memory-wiki concern.

**Completeness Principle (port 3):** `feedback/completeness-principle.md` exists, is fully compliant (type + updated + updated_by + tags + related). The 9 older feedback files around it are not compliant. **Concrete recommendation: bulk-migrate those 9 feedback files to v0.3 frontmatter in a single pass. Low effort, closes the largest single frontmatter-compliance gap in the corpus.**

## 9. Prioritized action list

Impact/effort scale: H/M/L each.

1. **Drain the 53 proposed-memories backlog.** Run the curator with live-apply (not dry-run) against `inbox/rocinante/proposed-memories/2026-04-14/` through `2026-04-18/`. Gmail signals from 2026-04-16 contain real facts already overdue for canonical merge. Impact H, effort M.
2. **Fix curator infrastructure so it runs nightly.** The single curator-log-2026-04-16 is a dry-run. Either the scheduled task is not firing, the curator is not configured for live-apply, or it silently errors. Confirm per `CLAUDE.md` §Scheduled-Tasks that `nightly-memory-curation` actually executes. Impact H, effort M.
3. **Migrate 9 older feedback files to v0.3 frontmatter.** Bulk-add `updated`, `updated_by`, `tags`, `related`. Closes the largest single compliance gap. Impact M, effort L.
4. **Clean up the mini-lab orphan links.** 200+ of 264 orphans come from `projects/mini-lab-2026-04-11/MINI-LAB-REPORT.md` pointing at cell-therapy-safety nodes that were never created. Either create stub files under `research/` or `projects/cell-therapy-safety/`, or strip the speculative links. Impact M, effort M.
5. **Update `reference/INDEX.md` to include `gstack-review-2026-04-18.md`, `microsoft-store-pua-pattern.md`, `network.md`, and the two nwjs YAML/YARA artifacts.** Impact L, effort L.
6. **Add `--validate` mode to `extract_graph.py` to warn on orphan typed-link targets.** Prevents graph-edge pollution as typed links are seeded across the corpus. Impact M, effort L.
7. **Refresh ASTRAZENECA.md (W-2 DE to NJ admin item, recruiter volume note) and QUICK-REFERENCE.md last_verified.** Impact L, effort L.
8. **Reconcile kid-ages three-way duplication.** Make FAMILY.md the source of truth with DOBs; remove ages from CLAUDE.md or compute on read. Impact L, effort M.
9. **Relocate `reference_home_network.md` into `reference/` and `gpuserver1-monitoring-log.md` into `machines/gpuserver1/`.** Impact L, effort L.
10. **Write `machines/rocinante/MISSION.md` to match the gpuserver1 MISSION.md pattern.** Symmetry matters for the MULTI-MACHINE-MEMORY architecture. Impact L, effort M.
