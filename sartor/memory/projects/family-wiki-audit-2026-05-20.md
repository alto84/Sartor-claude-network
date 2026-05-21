---
type: project
date: 2026-05-20
status: audit-complete-pending-remediation
tags: [domain/family, meta/audit, project/family-wiki-uplift]
---

# Family Knowledge Base — Comprehensive Audit (2026-05-20)

**Authored by:** Rocinante Opus 4.7 synthesizing 4 parallel subagent reports
**Scope:** sartor/memory/family/ structure, completeness, link health, cross-domain references
**Constitutional posture:** Constitution §7 #3 (no externalizing family medical info) and §7 #4 (children's info never leaves house) observed throughout. No file content was modified during the audit.

## Executive summary

The family wiki is **structurally sound but operationally eroding**. The schema in `CONVENTIONS.md` is well-designed (Facts → Calendar → Audit, with `_history/` archiving) but several discipline boundaries have slipped:

1. **Schema asymmetry between adults and kids.** Children have full pages in `family/`; Alton lives at `/ALTON.md` (root); Aneeta has no dedicated page (just a 14-line section in FAMILY.md).
2. **Kid pages are functioning as event-logs, not fact-pages.** Vayu's page accumulates ~15 `## Latest from gather` sections that should be archived to `family/_history/` per CONVENTIONS. The "Facts → Calendar → Audit" separation has degraded.
3. **Active-todos.md has 4-7× repetition** because the gather pipeline appends without upserting. Run 98 carries forward items from runs 6-93 with no dedup. The fix is structural (Gmail pipeline rebuild — see [`projects/.../gmail-pipeline-2026-05-20`]) not a one-shot cleanup.
4. **2 dead links + ~5 dead frontmatter refs** in PAPER-CHECK-VENDORS.md alone. Network-wide, the same broken feedback-files are cited from 11+ places — systemic gap.
5. **Cross-domain interconnect is anemic.** business/ ↔ family/ scored 1/5 despite massive overlap (LLC income, §469 hours, HELOC tracing all affect household cash flow). matters/ scored 2/5 — no matter exists for kids' UTMAs despite three Fidelity 1099s on file.
6. **Source-documents index is excellent.** No identity docs (passports/birth certs) inside the repo; everything stored externally with the INDEX referencing paths only. The privacy discipline is holding.

## Findings by audit cut

### A. Structure + per-person completeness (subagent ad8d079)

Per-person scorecard (0-5):

| Person | Score | Critical gaps |
|---|---|---|
| Vayu | 4 | No friends section; no dentist; no allergies; no emergency-contact block; medical scattered |
| Vishala | 3 | **No medical section at all** (no pediatrician, no allergies); no friends; no emergency contact |
| Vasu | 3 | No medical section; no friends; no emergency contact; MKA PK-5 pipeline status unresolved |
| Alton | n/a | Page exists at `/ALTON.md`, not under `family/` — **schema mismatch** |
| Aneeta | 0 | **No page exists** — co-principal documented only as a section in FAMILY.md |
| Cats (Loki/Ghosty/Pickle) | 0 | One-line bullet in FAMILY.md; no vet, feeding schedule, Disney boarding plan |

Categorization of loose files:
- `family-calendar.md` — ongoing-event, schema-correct
- `active-todos.md` — todo-list, schema-correct
- `disney-july-2026.md` — transient-project, active; archive to projects/ after July
- `PAPER-CHECK-VENDORS.md` — household-reference, permanent ✓
- `sole-parent-window-2026-04-29.md` — **stale transient** (window ended 5/3); archive to `_history/`
- `profiles.json` — machine-readable index, uncategorized

Missing infrastructure: **`family/_history/` directory does not exist** despite being referenced throughout CONVENTIONS.md.

### B. Active-todos.md dedup + freshness (subagent a3621721)

**File state:** 613 lines, append-only, frontmatter says run 98. Top "Alton decisions" triage block, then chronological `## Latest from gather (DATE) — run N` sections in arrival order (not sorted). No global "what is actually open today" view.

**Top dedup candidates (each appearing 3-7× across runs):**

1. Sante Total Form 990-N — runs 72, 75, 80, 93 (5 days overdue P0)
2. Wohelo May 15 check — ~7 surface appearances, check itself was paid May 10
3. Disney ADR / Nicol Stevenson — runs 71, 75, 80, 84, 93, 98
4. 185 Davis condo boiler-tank vote — runs 22, 36, 75, 80
5. 185 Davis assessment $2,253.13 (May 1) — runs 22, 36 (long past)
6. CSA 2026 checks (Circle Brook + Tree-Licious, May 1) — runs 22, 36
7. MKA Parent-Teacher sign-up (May 15) — runs 65, 66, 71 marked resolved
8. MKA 4th Grade Laptop Letter (Vayu) — runs 56, 60
9. Hiive/Harvey AI deadline (May 14) — runs 70, 71, 72 (now 6+ days past)
10. Guidepoint consultations — runs 6 + 60 (two different requests, identical action pattern)

**Top 5 stale entries:**
- Line 101: Vayu soccer game 2026-04-11 (39 days past)
- Lines 104-105: Stuck Ellis Island form (trip was 4/17, marked `[!done]`)
- Lines 110-111: Tribeca balance $170.28 (resolved at line 372-373; double-listed)
- Lines 134-135: Bank run needed Apr 11-12 (40 days stale)
- Lines 343-349: Entire run 6 section (PAMKA tix Apr 15 — 35 days past)

**Subagent's timing recommendation:** Wait for Gmail-pipeline rebuild (Option C from earlier subagent) before mass cleanup; one-shot cleanup tonight would regenerate within 24 hours under current append-only behavior. **Exception:** 4 explicitly resolved P0 items still escalating each cycle — Sante Total 990-N, Wohelo, Tribeca, Memory Book — burn attention each run and warrant hand-closure tonight.

**Proposed next-gen schema:**
```
## P0 — Overdue or due today      (auto-sorted by deadline ASC)
## P1 — This week
## P2 — This month / undated open
## Recurring                       (Loki meds, swim lessons, etc.)
## FYI / Awareness                 (calendar peeks, no action)
## Resolved this week              (auto-archived after 7 days to _history/)
```

Each item: stable callout with HTML-comment `<!-- id: wohelo-2026 -->` for upsert keying.

### C. Wiki link / backlink / tag-index health (subagent a637f0f)

**Network-wide:** 468 files, 888 wikilinks, 803 backlinks, 74 total broken links, 132 orphans.

**Family-source breakage:** Only 2 broken refs, both in `family/PAPER-CHECK-VENDORS.md`:
- `[[feedback/gather-respects-out-of-band-closures]]`
- `[[feedback/paper-checks-blindspot]]`
- Plus 3 dead `related:` frontmatter pointers
- The same broken feedback files are cited from **11 distinct files network-wide** — systemic gap, not just a family issue.

**Family-target broken refs (incoming):** From `projects/memory-system-uplift-2026-05-06-WORK/audits/INGEST-AUDIT-GMAIL.md`:
- `family/healthcare`
- `family/vendors`
- `family/social-graph`
- These were aspirational pages the audit assumed exist but were never created.

**Top hubs (most-linked family files):**
1. `family/active-todos.md` — 19 backlinks ✓
2. `family/family-calendar.md` — 10
3. `family/{vayu,vishala,vasu}.md` — 9-10 each
4. INDEX.md — **0 backlinks** (the hub has no backlinks itself — discoverability gap)
5. CONVENTIONS.md — **0 backlinks** (schema doc nobody points to)

**Orphans:**
- All 4 `family/.claude/agents/*.md` (horizon-keeper, household-companion, kids-advocate, partnership-witness) — zero inbound
- CONVENTIONS.md — schema doc, no backlinks
- INDEX.md — directory landing page, no backlinks
- profiles.json — non-md, not indexed
- sole-parent-window-2026-04-29.md — near-orphan (only vayu.md links it)

**Tag taxonomy:** Inconsistent. Mix of `entity/family`, `domain/family`, `household/*`, `meta/*`, `priority/*`, `event/*`. No `family/kid`, `family/event`, `family/todo` namespace. Proposed minimal taxonomy:
- `domain/family` (universal — keep)
- `family/kid` (vayu/vishala/vasu)
- `family/event` (disney, sole-parent-window, future trips)
- `family/todo` (active-todos)
- `family/ref` (CONVENTIONS, PAPER-CHECK-VENDORS, INDEX, family-calendar)

### D. Cross-domain references + source docs (subagent a96660653)

**Cross-domain scorecard (0-5):**

| Domain | Score | Notes |
|---|---|---|
| business/ → family/ | 1 | Only sante-total.md mentions family. Big gap: LLC income / §469 hours / Tesla Solar / HELOC all affect family cash flow with no backlink. |
| matters/ → family/ | 2 | 8 of 14 matter files mention Aneeta/family but use `[[FAMILY]]` top-level, never per-child pages. **No matter exists for kids' UTMAs** despite three Fidelity 1099s. |
| projects/ → family/ | 3 | Disney + photo-book cross-link properly. **Two-headed Disney** (family/disney-july-2026.md AND projects/disney-july-2026/PROJECT.md) — coordinated but duplicative. |
| daily/ → family/ | 4 | 63+ wikilinks across April daily logs alone. Pipeline-driven, healthy. |
| hearth/ → family/ | 5 | hearth/family.md observes constitutional discipline — names the ground without externalizing interior. |

**Source documents (sartor/memory/source-documents/INDEX.md):**
- 70 medical docs (16 ada-disability, 12 general-pediatric, per-kid subcategories) — catalog paths only, no clinical content. ✓
- 5 passports, 6 birth certs, 3 marriage certs — cataloged but stored EXTERNALLY in Downloads/Desktop. Repo is clean.
- 5 school docs (MKA tuition, transcript forms, Goddard enrollment).
- 3 UTMA 1099s TY2025 — Vayu/Vishala/Vasu Fidelity. **No matching matter** in matters/.
- Family camp/non-clinical: Vasu Longwood health form, immunization records (form-fill flow only).

**Top 3 cross-references to add for maximum value:**

1. **matters/ ↔ family/active-todos.md bidirectional** — money-deadlines (Wohelo $12,900, MKA tuition $7,000, Disney bookings, 185 Davis $2,253) show on todo side without matter; matters reference Aneeta accounts without linking todo.
2. **Open `matters/kids-utma.md`** — three 1099s on file, kiddie-tax exposure is a real tax position. Link from family/{vayu,vishala,vasu}.md.
3. **business/solar-inference.md ↔ family/active-todos.md** — add "Family financial impact" block pointing to family side; reverse-link from family/.

## Cross-cutting themes

1. **Schema-vs-practice drift.** CONVENTIONS.md describes the architecture; multiple files have drifted from it (kid pages accumulating event logs, missing `_history/`, missing adult pages, missing healthcare/vendors/social-graph stubs the GMAIL ingest audit assumed).

2. **Pipeline asymmetry.** personal-data-gather is the dominant write path; it appends rather than upserts. The data integrity problems (active-todos dedup, kid-pages-as-event-logs, repeated escalation of resolved items) all trace to this single root cause. The Option C Gmail rebuild solves this; until then, hand-cleanup regenerates within 24 hours.

3. **Domain isolation is too strong.** family/ is well-linked internally but cross-domain refs are 1-3/5 in the most important directions (business, matters). The household-finance link surface specifically is the highest-value missing piece.

4. **Privacy discipline is exemplary** — source-documents/INDEX, hearth/family.md, the family/.claude/agents/ are all constitutionally careful. The repo is clean of identity docs and clinical content. This is one of the system's strongest features.

## Prioritized remediation plan

### P0 — Tonight or Alton's first morning glance

1. **Hand-close 4 escalating-resolved items in active-todos.md** (Sante Total 990-N, Wohelo, Tribeca balance, Memory Book). Each is being re-flagged each gather run despite documented resolution. ~10 lines of edits.
2. **Create `family/_history/` directory** (empty; just the directory so CONVENTIONS isn't lying). One-line action.
3. **Archive `sole-parent-window-2026-04-29.md` → `family/_history/`.** Window closed 5/3, material lessons already migrated to kid pages.

### P1 — This week

4. **Create `family/aneeta.md`** (co-principal page, schema-matching kids' template, lift content from FAMILY.md's section).
5. **Create `family/medical-providers.md`** (privacy-respecting consolidation: pediatrician, dentist, PCPs, emergency contacts; names + specialties + phones, no PHI/no policy numbers).
6. **Create `family/pets.md`** (Loki/Ghosty/Pickle + vet contact, feeding, Disney boarding plan).
7. **Fix `family/PAPER-CHECK-VENDORS.md` dead refs** — either create the 2 feedback notes (which 11 network-wide files want) or rewrite the links to existing alternatives.
8. **Open `matters/kids-utma.md`** — capture the three Fidelity UTMAs + kiddie-tax exposure (per tax-counsel skill).
9. **Make INDEX.md discoverable** — add `[[family/INDEX]]` from FAMILY.md and from the four family agents.

### P2 — After Gmail-pipeline rebuild lands

10. **Drain `## Latest from gather` accretions on kid pages** to `family/_history/gather-runs-{YYYY-MM}/{kid}.md` per the schema. Keep kid pages as ≤200-line fact pages.
11. **Restructure active-todos.md** to the proposed P0/P1/P2/Recurring/FYI/Resolved schema with `<!-- id: -->` upsert keys.
12. **Add bidirectional cross-references** business/ ↔ family/, matters/ ↔ family/ on the highest-value pairs.
13. **Resolve the family/healthcare, family/vendors, family/social-graph dead-target refs** — create stubs (matching INGEST-AUDIT-GMAIL.md's intent) or update the audit to remove the references.
14. **Decide on Disney duplication** — pick a canonical home (family/ for household texture vs projects/ for planning artifact); make the other a pointer.

### P3 — Nice-to-have

15. **Tag taxonomy normalization** per subagent C's proposal (`family/kid`, `family/event`, `family/todo`, `family/ref`).
16. **Bare-name wikilink hardening** — wiki.py currently resolves `[[vayu]]` via basename-match; if it tightens to path-only these break. Rewrite to explicit `[[family/vayu]]` form to insulate.
17. **PAPER-CHECK-VENDORS frontmatter** — fix dead `related:` pointers.

## What needs Alton's decision

- **P1 #4 (aneeta.md):** OK to create with schema-matched template lifted from FAMILY.md, or want to author yourself?
- **P1 #5 (medical-providers.md):** Privacy threshold — am I OK to consolidate the pediatrician/dentist/PCP names + phones from existing files? Or want to author yourself?
- **P1 #7 (PAPER-CHECK-VENDORS dead refs):** Create the feedback files (they're cited 11× network-wide), or just unlink?
- **P1 #8 (kids-utma matter):** OK to open as a tracked matter via /matter-tracker, or save for CPA conversation first?
- **P2 #14 (Disney duplication):** Which canonical home — family/ or projects/?

## Pointers to subagent reports (full text)

Each subagent's complete report is in the conversation transcript. Cross-references for future Claude sessions:
- Structure + completeness: subagent ad8d079
- Active-todos dedup + freshness: subagent a3621721
- Link / backlink / tag-index: subagent a637f0f69e
- Cross-domain + source docs: subagent a96660653210

## Files referenced

- `sartor/memory/family/INDEX.md`
- `sartor/memory/family/CONVENTIONS.md`
- `sartor/memory/family/{vayu,vishala,vasu}.md`
- `sartor/memory/family/{active-todos,family-calendar,disney-july-2026,PAPER-CHECK-VENDORS,sole-parent-window-2026-04-29}.md`
- `sartor/memory/family/.claude/agents/*.md`
- `sartor/memory/FAMILY.md`, `sartor/memory/ALTON.md`
- `sartor/memory/source-documents/INDEX.md`
- `sartor/memory/matters/INDEX.md`
- `sartor/memory/indexes/{backlinks,broken-links,orphans,tag-index}.json`
- `sartor/memory/projects/family-thread-dossier/family-dashboard-2026-05-02.md`
- `sartor/memory/hearth/family.md`
- `sartor/memory/projects/memory-system-uplift-2026-05-06-WORK/audits/INGEST-AUDIT-GMAIL.md`

No files modified during this audit.
