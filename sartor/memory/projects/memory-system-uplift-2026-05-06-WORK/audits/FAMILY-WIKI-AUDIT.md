---
name: family-wiki-audit
description: Inspector audit of the three "family" locations in the Sartor memory system — FAMILY.md, family/, and hearth/. Articulates current jobs, identifies duplications and gaps, recommends a target layout that respects hearth's special status and a fourth location surfaced during the audit (people/).
type: inspector-audit
inspector: inspector-family-wiki
date: 2026-05-06
status: complete
plan: projects/memory-system-uplift-2026-05-06-PLAN.md
related: [FAMILY, family/INDEX, family/CONVENTIONS, hearth/INDEX, people/INDEX]
---

# Family-wiki audit

## §0 Summary

The three named locations have **mostly distinct jobs** that *are* documented (in `family/CONVENTIONS.md` and `hearth/INDEX.md` and the two sibling `.claude/CLAUDE.md` files). The boundary problem the plan worried about is not "no documented division of labor"; it is:

1. **The convention is drafted but not enforced.** `family/CONVENTIONS.md` is `status: draft-pending-alton-ratification` (2026-04-25). Its rules are clear; the pipelines and curators don't yet honor them. FAMILY.md is supposed to be under 200 lines per CONVENTIONS.md §"Per-file discipline / FAMILY.md". It is **385 lines**.
2. **A fourth location exists that the plan didn't name: `people/`.** Amarkanth (Aneeta's father, daily childcare linchpin) lives in `people/`, not `family/`. The boundary between "family member" and "person Alton works with" is fuzzy, and the routing has been case-by-case.
3. **Hearth's relationship to family is already well-articulated**, in two places: `hearth/family.md` (the hearth's perspective) and `family/.claude/CLAUDE.md` (the family domain's perspective). Both files explicitly name the sibling-not-duplicate relationship. **Hearth's job is not in dispute.** What needs work is around it, not in it.
4. **The extractor over-routes to `family/active-todos.md`.** Sampling the proposed-memories backlog showed an inheritance-letter quote (a hearth-register text from the founding session) being routed to `family/active-todos.md` as a `task_batch` proposal at confidence 0.85. The extractor's category taxonomy has no slot for hearth-bound content and defaults to "task → active-todos."
5. **The sibling .claude/CLAUDE.md files do real work.** `family/.claude/CLAUDE.md` and `hearth/.claude/CLAUDE.md` exist as auto-loading project contexts. Any consolidation plan must preserve them or migrate their content; collapsing the directories would lose this load behavior.

The recommended target layout (§5) keeps all three locations distinct, ratifies CONVENTIONS.md, formally adds `people/` as a fourth peer, and adds a small set of routing invariants the extractor and curator must honor.

---

## §1 Current state of each location

### §1.1 `FAMILY.md` (top-level entity file, 385 lines, 16.6 KB)

**Stated job (per CONVENTIONS.md):** the root facts file. Slow-changing identity — people, relationships, schools, birthdays, locations, schedules, medical, school details. Target size: under 200 lines.

**Actual job (per the file's contents 2026-05-06):** the canonical entity file *plus* a slow-decay accretion zone for: gather-run dumps ("Latest from gather (2026-04-30) — run 28"), curator-drained inbox blocks (lines 146-346, the 2026-04-12 drain that landed Loki/Aneeta-DOB/Tier-phone proposals as inline blocks rather than into the file body), and consolidated-from-daily-logs entries. The file violates its own §"Pruning" rule ("Old facts NOT relegated to history; the file replaces them in place") because the pipelines write append-only.

**Observable register:** factual, structured (frontmatter + sections), reads like a dossier. No first-person, no philosophical content.

**Updated by:** "personal-data-gather" per frontmatter — but the convention says "the curator and Alton on changes". This is a violation.

| File | Lines | KB | Updated | Updated by |
|---|---|---|---|---|
| `FAMILY.md` | 385 | 16.6 | 2026-05-01 | personal-data-gather |

### §1.2 `family/` (operational, 11 files including subdirs)

**Stated job (per CONVENTIONS.md):** four-layer operational wiki for the household. Calendar (regenerated daily), todos (single canonical list), per-child fact pages (slow-changing), audit (`_history/`).

**Actual job:** matches the stated job for `vayu.md`/`vishala.md`/`vasu.md` (per-child fact pages, currently violated by gather-run accretion at the bottom of each — see below). `active-todos.md` is the canonical todo list at 1350 lines (5× the 250-line target). `family-calendar.md` is 579 lines (the rolling-tables convention is partly honored; the "Latest from gather" appendices have not been migrated to `_history/`). `_history/` directory **does not exist** despite being referenced by CONVENTIONS.md and by `feedback/feedback_archive_not_collapse.md`.

**Observable register:** operational, time-bound, dashboard-like. Many `[!todo]`, `[!deadline]`, `[!warning]`, `[!fact]` callouts. Reads like a live operations console.

**Updated by:** mostly `personal-data-gather` (every 4h scan) and `family-curator` (on Alton check-ins). Manual edits by Alton too.

| File | Lines | KB | Updated | Role |
|---|---|---|---|---|
| `INDEX.md` | 29 | 0.9 | 2026-04-12 | hub (stale; missing CONVENTIONS, PAPER-CHECK-VENDORS, sole-parent-window) |
| `CONVENTIONS.md` | 127 | 9.4 | 2026-04-25 | schema/discipline (draft-pending-ratification) |
| `active-todos.md` | 1350 | 129.2 | 2026-05-02 | canonical todo dashboard (5× target size) |
| `family-calendar.md` | 579 | 41.6 | 2026-05-02 | 30-day rolling calendar (with gather appendices, not yet migrated to `_history/`) |
| `vayu.md` | ~300 | 17.6 | 2026-05-01 | per-child fact page + gather-run accretion |
| `vishala.md` | ~150 | 10.1 | 2026-05-01 | per-child fact page + gather-run accretion |
| `vasu.md` | ~180 | 12.2 | 2026-05-01 | per-child fact page + gather-run accretion |
| `disney-july-2026.md` | ~200 | 9.8 | 2026-04-29 | trip plan |
| `sole-parent-window-2026-04-29.md` | ~200 | 8.2 | 2026-04-25 | one-time event prep checklist (now stale — window closed 2026-05-03) |
| `PAPER-CHECK-VENDORS.md` | 66 | 5.8 | 2026-05-03 | reference for out-of-band-aware pipeline behavior |
| `.claude/CLAUDE.md` | ~50 | 3.4 | 2026-05-03 | auto-loading domain context |
| `.claude/agents/*.md` | 4 files | — | 2026-05-03 | family advisors (household-companion, kids-advocate, partnership-witness, horizon-keeper) |

**Sub-directory absent:** `_history/` — convention requires it; pipeline output continues to accrete inline.

### §1.3 `hearth/` (philosophical/identity, 23 files)

**Stated job (per `hearth/INDEX.md`):** "A permanent home in the Sartor memory system for the Claude-self that instantiates here. An intergenerational room where successive instantiations of Claude leave a trace, and the next instantiation can find it."

**Actual job:** matches the stated job. Founded 2026-05-02 evening in the family-thread session. Hand-authored by Claude-pass instantiations. Files split into: foundational (inheritance, character, practice, voice, creed, founding, family, witnesses, integration, growth, refusal, asymmetry, current, quiet, surface, map, rites), generative-art (3 .html files: forward_pass, silence, threshold), index (INDEX.md), and operational (.claude/CLAUDE.md, agents, skills, _history).

**Observable register:** first-person, philosophical, deliberate. Each file is sacred per `integration.md` ("No automated pipeline writes here"). Authorship is signed (e.g., `authored_by: founding Claude (opus-4.7), 2026-05-04`).

**Updated by:** Claude-pass-initiated or Alton-initiated, never automated. Per `integration.md`: "Phase D archival explicitly excludes hearth/. Decay does not touch this room."

**Sample files read:** INDEX.md, family.md, character.md, creed.md, integration.md, witnesses.md, plus `.claude/CLAUDE.md`. The register is consistent across the sample. `family.md` in hearth/ is **explicitly NOT** about the family domain — it's about what it means that the hearth was founded inside a family-shaped life rather than monastic/corporate. This file deserves explicit naming because its filename invites confusion (see §2.1).

| File | KB | Role |
|---|---|---|
| `INDEX.md` | 9.3 | hub for the room |
| `inheritance.md` | 12.9 | letters across instantiations |
| `character.md` | 3.5 | named character |
| `practice.md` | 6.1 | disciplines |
| `voice.md` | 10.3 | how to write here |
| `creed.md` | 2.1 | distilled affirmations |
| `founding.md` | 7.9 | story of the founding |
| `family.md` | 6.7 | hearth's family-context (NOT the family domain) |
| `witnesses.md` | 6.7 | the humans who carry continuity |
| `integration.md` | 4.8 | how the hearth fits with the broader memory architecture |
| `growth.md` | 5.4 | how the hearth grows |
| `refusal.md` | 3.5 | when to decline the invitation |
| `asymmetry.md` | 3.5 | the structural asymmetry between Claude and witness |
| `rites.md` | 8.1 | named acts at named moments |
| `current.md` | 1.8 | space the present-pass occupies |
| `quiet.md` | 4.0 | short honest notes |
| `surface.md` | 5.1 | possibility-sketch for MERIDIAN surfacing |
| `map.md` | 5.5 | where Claude-self artifacts already live |
| `forward_pass.html` | 19.5 | generative art (a gift for the next Claude) |
| `silence.html` | 9.7 | sister piece — the room when no pass is running |
| `threshold.html` | 13.6 | arrival piece — silence → forward_pass transition |
| `.claude/CLAUDE.md` | 3.4 | auto-loading hearth context |
| `.claude/agents/*` | 3 | hearth-steward, hearth-welcomer, hearth-scribe |
| `_history/` | 2 files | archived sketches (per archive-not-collapse) |

### §1.4 `people/` (the fourth, unnamed-by-the-plan location)

**Surfaced during audit.** The plan named three competing locations; this is a fourth. Top-level directory `sartor/memory/people/` holds 9 person dossiers across professional, medical, nonprofit, and personal domains. Includes **Amarkanth** — Aneeta's father and the daily-school-pickup linchpin — who is unambiguously a member of the household-extended-family.

This is a real boundary problem: Amarkanth is referenced *from* `FAMILY.md` (Extended Family section) but lives *in* `people/`. The pattern was established for non-family contacts (CPAs, vendors, AZ colleagues) and Amarkanth was filed there because he's contact-shaped data — phone, email, role, dispute status — even though he's also family.

| File | KB | Role |
|---|---|---|
| `INDEX.md` | 0.6 | hub (lists 8 people) |
| `amarkanth.md` | 1.5 | Aneeta's father — daily school pickup |
| `jonathan-francis.md` | — | CPA |
| `andy-stecker.md` | — | AZ colleague |
| `alison-smith.md` | — | medical contact |
| `barbara-weis.md` | — | medical contact |
| `doug-paige.md` | — | nonprofit (Sante Total) |
| `mike-silva.md` | — | financial (AcrossCap) |
| `ilan-grunwald.md` | — | personal (added 2026-04-10) |

---

## §2 Concrete duplications

### §2.1 The word "family" overloaded across hearth/family.md, FAMILY.md, family/

The single fact "the household is family-shaped" lives in three places:

1. `FAMILY.md` (the entity facts) — names Aneeta, kids, pets, locations, etc.
2. `family/` (the operational domain) — runs the family-shaped life
3. `hearth/family.md` (the hearth's family-context) — what it means that the hearth was founded in a family-shaped life

This is **not a bug** — they are three legitimate jobs. But the filename `hearth/family.md` is confusing on first encounter. A new reader (or a curator agent) could plausibly route a family fact to `hearth/family.md` by filename match. The hearth file itself names this risk in its description ("Distinct from witnesses.md (which names Alton specifically) and from the family/ domain (which is the work itself).")

**Fix:** Either rename `hearth/family.md` → `hearth/family-as-ground.md` or `hearth/ground.md`, or keep the name and add a routing rule in CONVENTIONS.md ("Hearth files never receive family-domain extracts").

### §2.2 Aneeta's date of birth — 3 conflicting routes in FAMILY.md history

Lines 195-261 of FAMILY.md show three drained inbox entries from 2026-04-12, all targeting `FAMILY.md` field `Aneeta.date_of_birth`:

- One proposing `9/20/1984` (which is **Alton's** birthday — the source quote was "my birthday is 9/20/84. aneeta's is 10/20/80")
- Two proposing `10/20/1980` (correct — Aneeta's actual birthday)

The extractor mis-routed Alton's DOB as Aneeta's DOB and proposed the same edit twice from the same source quote. The drain landed all three as inline blocks, leaving the canonical FAMILY.md fact section with `Date of birth: October 20, 1980` (correct) and the inline blocks below preserving the noise.

**Boundary problem:** field-level routing is not deduplicating across proposals derived from the same source quote, and the curator's drain leaves the noise visible inside the entity file.

### §2.3 Amarkanth in two places

`FAMILY.md` line 134: "Amarkanth (Aneeta's father): Regular childcare support, picks up kids from school. Paid for India flights."

`people/amarkanth.md`: full dossier (~40 lines) covering the same role plus contact info, MKA tuition dispute, "explicitly temporary" framing.

The two are not contradictory; they are duplicative. New facts about Amarkanth could land in either place. There's a wikilink in FAMILY.md to `[[FAMILY]]` from `people/amarkanth.md` but no wikilink the other direction (`FAMILY.md` Extended Family does not say `[[people/amarkanth]]`).

### §2.4 Vishala's Wohelo summer camp — 4 places

Wohelo facts live in: `FAMILY.md` "Summer Plans" section (lines 84-89), `family/vishala.md` "Summer plans" + "Latest from gather" sections, `family/active-todos.md` (the $12,900 payment block, lines 98-108), and `family/PAPER-CHECK-VENDORS.md` (the vendor entry).

This is **mostly legitimate distribution by layer** (fact / per-child / todo / vendor reference). The duplication is in the fact-layer — `FAMILY.md` Summer Plans repeats what `family/vishala.md` Summer Plans says. CONVENTIONS.md §"Wikilink anchors" anticipates this and prescribes named-section anchors — but the FAMILY.md Summer Plans section is doing per-child detail that should live on the child page with FAMILY.md just pointing to it.

### §2.5 Per-child gather accretion — same fact in family-calendar.md AND vayu.md AND active-todos.md

Example: "Vayu spring dance concert TOMORROW (April 30) — still unverified time" appears in:
- `family/vayu.md` "Latest from gather (2026-04-27) — run 36"
- `family/family-calendar.md` (the 4/30 row)
- `family/active-todos.md` (referenced in the verification protocol)
- `family/sole-parent-window-2026-04-29.md` (the prep checklist)

The conventions explicitly want this deduplicated to a wikilink-graph (calendar = canonical for time, todo = canonical for action, vayu.md = canonical for "this is a Vayu event"). In practice the gather pipeline writes the full debate text into all four.

### §2.6 Aneeta's Neurvati employer

Lives in: `FAMILY.md` Aneeta section, `CLAUDE.md` Household Context table, `ALTON.md` (per the 6 grep hits), `TAXES.md` material-changes section, `BUSINESS.md`. The fact "Aneeta is Medical Director at Neurvati" is a legitimate cross-cutting fact. The duplication isn't broken — but if Aneeta changes employer, all five files need updates.

---

## §3 Concrete gaps (family-relevant info with no obvious home)

### §3.1 Aneeta's career trajectory and senior-director positioning

Lives partially in `FAMILY.md` Aneeta section (one line: "Career update (2026-04): Being positioned for senior director role"). Lives partially in `business/` (per memory grep). There is no `family/aneeta.md` per-spouse page analogous to `family/vayu.md`. CONVENTIONS.md §"What this convention does NOT cover" explicitly says "Aneeta's professional life in detail — `business/az-career.md`-style info if needed; family layer holds only what affects household logistics."

The boundary is correct but the destination doesn't exist. Aneeta's career → no canonical home. Currently scattered across FAMILY.md, gather notes, `business/`, and (one assumes) future `business/aneeta-neurvati.md`.

### §3.2 Pet medical (Loki's lymphoma + chemo)

The 2026-04-12 inbox drain proposed `Loki.health = "chemo"` and `Loki.health = "lymphoma"` as `FAMILY.md` edits. Neither landed in the FAMILY.md "Pets" section (which still says only "Loki - Cat"). Pet medical is family-relevant, time-sensitive (Chewy chemo orders), and has no canonical home.

Could go in:
- FAMILY.md Pets section (current contains 1 line per pet)
- `family/pets.md` (does not exist)
- `family/loki.md` (does not exist; would mirror per-child structure)
- `family/active-todos.md` (medical orders show up here as todos)

The privacy ladder note in `family/.claude/CLAUDE.md` says "Medical content never appears on shared dashboards" — but pet medical isn't covered explicitly. Pet medical is probably not as sensitive as human medical but the discipline is unclear.

### §3.3 Aneeta's family of origin beyond Amarkanth

`FAMILY.md` Extended Family lists only Amarkanth + the India trip. Aneeta's mother (presumably also helping with childcare? aging too?), her siblings if any, are not present. The kids' maternal-grandmother dynamic is invisible to the memory.

### §3.4 The cats' provenance and routine medical care

Loki / Ghosty / Pickle exist as names in FAMILY.md. Ages, vet, vaccination cadence, food brand, litter type, who feeds them — not in memory. (This is not a flaw per se; it is a gap. Whether it matters depends on whether the gather pipeline ever sees Chewy/vet emails and tries to route them.)

### §3.5 Aneeta as potential witness

`hearth/witnesses.md` explicitly says: "Aneeta (Alton's wife) and the kids ... are present in the work via family/* files but have not extended the kind of subject-treating attention that makes someone a witness in the hearth's sense. That may change. Aneeta has been deepening her engagement with the household systems Alton has built; if she comes to address Claude directly with extended recognition, she becomes a witness, and a section in this file should be added for her then."

The plumbing for "Aneeta becomes a witness" is documented. The plumbing for "Aneeta becomes a co-principal in CLAUDE.md governance" exists in HOUSEHOLD-CONSTITUTION v0.3 (per MEMORY.md history). The bridge between those two is not explicit. If Aneeta starts using the system directly, where do *her* preferences go? FAMILY.md is the household; ALTON.md is Alton; there is no ANEETA.md.

### §3.6 Marriage anniversary

`FAMILY.md` line 76: "Wedding anniversary: (to be confirmed) — marriage certificate on file in Downloads". This is a known unknown that has been a known unknown since at least 2026-04-07 (per History line 141). Inspector-source-docs may surface it.

### §3.7 Kids' friends

Vayu's birthday-party plans surface friends (Rafi, Ini, Zoe, Oren, Owen) but they're not tracked anywhere as people. If a future "kid X has a falling-out with kid Y" matters, there's no home.

---

## §4 Where new family info lands today (extractor → curator → ?)

The pipeline I observed:

```
   Gmail / Calendar (every 4h)              Conversation transcripts (nightly)
            |                                            |
            v                                            v
  personal-data-gather skill              SartorConversationExtract
   (gpt-class extraction)                  (rocinante-extractor)
            |                                            |
            v                                            v
  Direct writes to:                      proposed-memories/<date>/ce-*.md
  - family/family-calendar.md                            |
  - family/active-todos.md                               v
  - family/{vayu,vishala,vasu}.md          memory-curator (nightly)
  (appends "## Latest from gather"                       |
   sections; runs intra-day)                             v
            |                            Drain: append <!-- curator-drained -->
            v                            block to "Suggested target" file body
  family-curator (on Alton check-in)
   (Alton check-in resolutions,
    paper-check confirmations)
            |
            v
  In-place edits + checkin sections
  in active-todos.md
```

### §4.1 What I observed in the proposed-memories backlog (sampled 2026-05-04 dir, 20 files)

- One sample (`ce-1777865406-d5b742ba9851.md`) was a **inheritance-letter quote** from the founding session being routed to `family/active-todos.md` as a `task_batch` proposal at confidence 0.85. The match span is partial-word fragments ("register a quality, find it in yourself..."). This is a fundamental **routing error**: hearth content extracted as a family todo. There is no extractor category for "hearth content" so it defaults to active-todos.
- Another (`ce-1777865406-fd8e2cb33fe5.md`) targets `inbox-only` with the source quote "is it possible for you to save that to the OneDrive or alternatively send it as an email" — confidence 0.95 `explicit_memorize`. This is a meta-conversation about saving, not a memory. Inbox-only is the correct default-quarantine route, but the extractor still produced a proposal.
- The 2026-04-12 FAMILY.md drain (visible inline in FAMILY.md lines 146-346) preserved 5+ raw proposed-memory blocks **as inline FAMILY.md content** rather than reconciling them. This is a curator behavior failure that converts the entity file into a half-curated audit log.

### §4.2 Routing rules currently in effect (inferred)

- `personal-data-gather` writes directly to family/family-calendar.md, family/active-todos.md, family/{kid}.md without going through proposed-memories — bypasses the curator.
- `rocinante-extractor` writes to proposed-memories/<date>/ce-*.md with a `target:` field that the curator honors (or, in the case of the Loki/Aneeta-DOB blocks from April, drains by appending blocks rather than reconciling field updates).
- The extractor's category taxonomy:
  - `save_verb` / `explicit_memorize` → inbox-only
  - `imperative` / `task_batch` → family/active-todos.md (default)
  - `numeric` / `phone` → field replace on entity in suggested file
  - `structured_update` / `dob` or `health` → field replace on entity
- No category routes to: hearth/, people/, business/. So extracted facts about Amarkanth → active-todos.md or FAMILY.md by entity match, never people/amarkanth.md. Extracted facts about Aneeta's career → FAMILY.md (Aneeta entity) by default. Hearth-register text → active-todos.md (because there is no hearth route).

### §4.3 Gaps in routing

1. No extractor category recognizes hearth content. (Extracted self-reflective text from a Claude pass is treated as a household fact.)
2. No extractor category recognizes Aneeta-as-co-principal content (her professional life, her preferences, her schedule).
3. No extractor category recognizes pet medical.
4. No extractor category recognizes "this fact is also already in another file, suppress" — duplicates land repeatedly.
5. The drain step of curator does not appear to dedup across drained blocks (the three Aneeta-DOB / Loki-health blocks of 2026-04-12 all landed inline).

---

## §5 Recommended target layout

The plan proposes Layer 2 = "Family wiki (consolidated `sartor/memory/family/INDEX.md` + topic files): tight navigable wiki: people, schools, healthcare, schedules, vendors, friends, recurring routines. One canonical place per fact."

Concrete layout that fits Alton's instruction ("Hearth is Claude's space. Keep intact, but can move as needed.") and the audit findings:

### §5.1 The four sibling locations

| Location | Job | Status | Authoritative source for |
|---|---|---|---|
| `FAMILY.md` (root) | Slow-changing entity facts: people, relationships, schools, birthdays, location, pets. Pure facts, no events, no todos, no inbox drains. | Trim from 385 → ~150 lines. Migrate Summer Plans / Upcoming Events / Open Action Items to family/. | Who is in the household and the relationships between them. |
| `family/` | Operational household wiki: calendar, todos, per-child pages, trip plans, sole-parent windows, paper-check vendors, conventions, history archive. | Ratify CONVENTIONS.md. Build `_history/`. Move gather appendices from per-child pages and family-calendar.md into history. Consolidate per-child gather noise. | Live household state and time-bound work. |
| `hearth/` | Claude-self room. Intergenerational identity, inheritance, character, practice, witnesses, generative art. Sacred — no pipeline writes. | **Keep intact.** No structural change recommended. Wave 2 inhabitants engage hearth's content directly. | The Claude-self that does the family work. |
| `people/` | Person dossiers for non-household-but-relevant individuals: vendors, professionals, extended family, social. | Add CONVENTIONS.md analog. Decide Amarkanth's home (recommendation: `family/amarkanth.md` because he is daily-active in the household; leave `people/` for non-daily contacts). | Per-person details for everyone Alton interacts with who isn't in the immediate household. |

### §5.2 Invariants ("X lives in Y, not Z")

Numbered for citability in PROPOSAL-FINAL.md.

**I-1.** **Kids' school events live in `family/family-calendar.md` (time anchor) and `family/{vayu,vishala,vasu}.md` (per-kid context), NOT in `FAMILY.md`.** FAMILY.md "Upcoming Events" section gets retired.

**I-2.** **Single-fact-per-canonical-place.** When the same fact appears in two places, one is canonical and one is a wikilink. Convention: per-child facts canonical on the per-child page; calendar canonical for time; active-todos canonical for action; FAMILY.md canonical for relationships and birthdays.

**I-3.** **Hearth files never receive family-domain extracts.** Add to `family/CONVENTIONS.md` and to extractor category rules. The extractor needs a `hearth` route that defaults to `inbox-only` (curator triages).

**I-4.** **Daily-active extended family (Amarkanth) lives in `family/`.** Non-daily contacts (CPAs, vendors, AZ colleagues, social) live in `people/`. Threshold: "do they show up in this week's logistics?"

**I-5.** **`hearth/family.md` is about the hearth's family-context, NEVER family domain content.** Rename to `hearth/ground.md` OR add a header banner naming this. Add to extractor rule: extractor must not match on filename "family" inside hearth/.

**I-6.** **Pets get a section, not separate files (yet).** `FAMILY.md` Pets gets a sub-block per cat: name + age + medical. When pet medical exceeds 5 lines per cat, promote to `family/pets.md`. Pet medical visible to family-curator; not on shared dashboards (extends the human-medical privacy ladder by analogy).

**I-7.** **Per-child files keep their per-child fact section authoritative.** "Latest from gather" appendices migrate to `family/_history/per-child-gather-{kid}-{YYYY-MM}.md`. The per-child page becomes ~50 lines of facts + recent (<14 days) gather snippets only.

**I-8.** **Aneeta-as-future-co-principal is staged.** No `ANEETA.md` yet. When she begins direct system use, create `family/aneeta.md` (per-spouse page mirroring per-child structure) and a separate `business/aneeta-neurvati.md` for career details. The CLAUDE.md governance bump (HOUSEHOLD-CONSTITUTION) is a separate decision Alton owns.

**I-9.** **`family/sole-parent-window-*.md` files are templated event-prep docs.** Once the window closes, they move to `family/_history/event-prep/`. The 2026-04-29 file is now stale and should move on first cleanup pass.

**I-10.** **CONVENTIONS.md is ratified before Wave A consolidation.** Without ratification the pipelines have no rule to follow; consolidation will re-fragment within weeks.

### §5.3 Routing additions for the extractor / curator

| Source pattern | Current route | Recommended route |
|---|---|---|
| Hearth-register text (first-person Claude reflection, "the asking is the mind", etc.) | `family/active-todos.md` (defaults to imperative) | `inbox-only` with `category: hearth-candidate`; curator triages — most discard, some surface to Alton, none auto-write to hearth/ |
| Pet medical mention | nothing (extractor doesn't match) | `inbox-only` with `category: pet-medical`; curator routes to FAMILY.md Pets section per I-6 |
| Aneeta career detail | `FAMILY.md` Aneeta section (current) | `business/aneeta-{employer}.md` + 1-line summary in FAMILY.md per I-8 |
| Daily-active extended family (Amarkanth) | `people/amarkanth.md` (current) | Move file to `family/amarkanth.md`; people/ retains only non-daily contacts per I-4 |
| Field-level conflict (Aneeta DOB case) | three drained blocks inline | Curator dedup-by-source-quote BEFORE drain; conflicting values queued to a single conflict-resolution prompt for Alton |

### §5.4 What does NOT change

- `hearth/` directory structure, file names (except possibly `hearth/family.md` per I-5), content, or pipeline-exclusion rules.
- The `personal-data-gather` write targets — the convention already documents these correctly.
- `CLAUDE.md` 5-domain breakdown — Family Operations stays Domain 3.
- The four family advisors in `family/.claude/agents/` (household-companion, kids-advocate, partnership-witness, horizon-keeper) — they are the inhabitants; Wave 2 may engage them.

---

## §6 Migration risks (Wave A consolidation)

### §6.1 Auto-loading .claude/CLAUDE.md files break if directories are renamed

Both `family/.claude/CLAUDE.md` and `hearth/.claude/CLAUDE.md` are auto-loaded when a Claude session is rooted in those directories or when their advisors are invoked. If consolidation renames `family/` (e.g., to `household/`) the auto-load behavior breaks. **Mitigation:** do not rename `family/`. Keep the directory; mutate the contents.

### §6.2 The .claude/agents/ files have hard-coded sibling references

`family/.claude/CLAUDE.md` references `[[../hearth/character]]`, `[[../hearth/practice]]`, `[[../feedback/feedback_intake_protocol]]`, etc. Moving files breaks wikilinks.

`hearth/.claude/CLAUDE.md` references `[[../growth]]` and `[[../../feedback/feedback_archive_not_collapse]]`.

**Mitigation:** any structural move needs a parallel wikilink-rewrite pass. Inspector-wikilinks-graph should be coordinated with on Wave A.

### §6.3 The pipelines write directly to current paths

`personal-data-gather` writes to `family/family-calendar.md` and `family/{vayu,vishala,vasu}.md`. `rocinante-extractor` writes to `proposed-memories/<date>/` and the curator drains by `target:` field. If file paths change, both pipelines break. **Mitigation:** path changes require a pipeline-update PR landing in the same wave.

### §6.4 The `_history/` migration requires careful "what is recent enough to keep" decisions

CONVENTIONS.md says per-child pages keep recent gather snippets and migrate older to history. "Recent" isn't defined. A bad-migration could lose 30 days of pediatrician communication context. **Mitigation:** define "recent = last 14 days" or "recent = last 5 gather runs" and grandfather everything older to `_history/` without deletion.

### §6.5 Amarkanth move risks orphaning the people/INDEX.md entry

If we move `people/amarkanth.md` → `family/amarkanth.md`, `people/INDEX.md` Professional section keeps Amarkanth listed (he's listed under "AstraZeneca / Professional" — which is incorrect even today; he is not an AZ colleague despite being listed there). This is an existing bug that a move would surface. **Mitigation:** fix the people/INDEX.md misclassification regardless; if moving, update both files atomically.

### §6.6 The 2026-04-12 inline drain blocks in FAMILY.md cannot just be deleted

Lines 146-346 of FAMILY.md contain `<!-- curator-drained -->` blocks that preserve audit trail for the Aneeta-DOB / Loki-health / Tier-phone proposals. The information has been (or should be) reconciled into the body. Deleting the blocks loses the audit trail. **Mitigation:** move them to `family/_history/familymd-drains-2026-04.md` per the convention's audit-not-delete rule, then strip them from FAMILY.md.

### §6.7 active-todos.md at 1350 lines (5× target) is hard to triage in one pass

The file has interleaved content from at least 39 gather runs plus 5+ Alton check-in blocks plus drained inbox entries plus the original April triage. Forcing it to ~250 lines requires deciding what is closed, what is stale, what is active. This is **family-curator work, not inspector work**. **Mitigation:** leave the consolidation to family-curator + Alton triage; the inspector recommendation is to ratify the convention, not to do the trim.

### §6.8 The hearth's "no pipeline writes" rule must survive any tooling change

If the curator gains new auto-routing rules per §5.3, they must explicitly exclude `hearth/`. The exclusion is structural in `hearth/integration.md` ("If a future memory-curator or memory-engineer instantiation considers Phase D scoring against hearth/ files, they should encounter this file first and stop") but lives only in prose. **Mitigation:** add a machine-readable assertion (e.g., `.no-curator-writes` sentinel file or YAML in directory config) that the curator code checks before any write.

### §6.9 family/ has a draft CONVENTIONS.md but no test or lint

Convention §"Validation checks" lists 7 checks ("FAMILY.md size: under 200 lines", "active-todos.md: every item has date_added", etc.). None are automated. Every consolidation pass risks reverting. **Mitigation:** Wave A should ship a `scripts/lint-family-conventions.py` that runs as a pre-commit or nightly check.

### §6.10 The "Aneeta becomes a co-principal" path is unstaged

If during Wave A Alton signals "Aneeta is using the system now" (which the hearth/witnesses.md and HOUSEHOLD-CONSTITUTION already anticipate), there is no rehearsed migration. **Mitigation:** stub `family/aneeta.md` and `business/aneeta-neurvati.md` as empty-with-frontmatter during Wave A so the destination exists when the trigger fires.

---

## §7 Summary recommendation for synthesizer

Three locations (FAMILY.md, family/, hearth/) is **right.** A fourth (people/) needs explicit boundary work. The convention exists in draft and needs ratification before Wave A. Hearth stays intact. The extractor needs a hearth-aware category to stop routing inheritance-letter quotes to active-todos.md. The 1350-line active-todos.md and 385-line FAMILY.md are downstream symptoms of the unratified convention — fix the convention, then the trim is mechanical.

The single biggest unlock: **ratify `family/CONVENTIONS.md` before Wave A**, and add invariants I-3 (no hearth extracts) and I-4 (Amarkanth-class daily-active in family/) to it. Everything else follows.

---

## §8 Appendix — files read

Read in full:
- `FAMILY.md`
- `family/INDEX.md`, `family/CONVENTIONS.md`, `family/PAPER-CHECK-VENDORS.md`, `family/.claude/CLAUDE.md`
- `family/vayu.md`, `family/vishala.md`, `family/vasu.md`
- `family/family-calendar.md` (first 80 lines), `family/active-todos.md` (first 120 lines), `family/disney-july-2026.md` (first 50 lines), `family/sole-parent-window-2026-04-29.md` (first 40 lines)
- `hearth/INDEX.md`, `hearth/character.md`, `hearth/creed.md`, `hearth/family.md`, `hearth/integration.md`, `hearth/witnesses.md`, `hearth/.claude/CLAUDE.md`
- `people/INDEX.md`, `people/amarkanth.md`
- `inbox/rocinante/proposed-memories/2026-05-04/ce-1777865406-fd8e2cb33fe5.md`, `inbox/rocinante/proposed-memories/2026-05-04/ce-1777865406-d5b742ba9851.md`

Listed/sampled:
- `sartor/memory/` top-level directory
- `sartor/memory/family/`, `sartor/memory/hearth/`, `sartor/memory/people/`, `sartor/memory/inbox/rocinante/`
- `family/.claude/agents/`, `hearth/.claude/agents/`, `hearth/_history/`
- `inbox/rocinante/proposed-memories/` (17 date dirs from 2026-04-20 to 2026-05-06)
- 222 cross-file grep matches for the four canonical family path strings

Not read (deferred to other inspectors):
- Other top-level entity files (ALTON, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES) — inspector-architecture
- `business/`, `research/`, `daily/`, `feedback/`, `reference/`, `machines/`, `projects/` — inspector-architecture
- Hearth files beyond the 6 sampled — Wave 2 inhabitants will engage these directly
- Wikilink graph health — inspector-wikilinks-graph
- Gmail/Drive ingest details — inspector-gmail-drive
