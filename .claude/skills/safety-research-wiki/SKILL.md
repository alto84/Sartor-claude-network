---
name: safety-research-wiki
description: Use when building a pharmacovigilance / drug safety research knowledge base that compounds across hundreds of papers, trials, and signals. Creates a compiled LLM-wiki with mechanism pages, drug pages, adverse event pages, and signal pages, plus an ingest workflow for PubMed / FDA / EMA / internal trial data. Self-contained; works offline; no dependencies on any proprietary source system. Use in an AZ/work environment where you need to accelerate literature review, signal detection, or pre-submission evidence synthesis.
---

# Safety Research Wiki

A domain-specific playbook for building a **compiled pharmacovigilance knowledge base** that compounds across every paper you read, every adverse event report you review, and every signal you investigate. Based on Karpathy's LLM-Wiki pattern applied to drug safety.

This skill is **self-contained**. No external APIs required. Everything runs on a folder of markdown files, a Python script, and your existing LLM agent. You can build this in any environment — a work laptop with no internet, a locked-down enterprise workspace, a personal machine, anywhere you can run Python and write markdown.

## Why a compiled wiki instead of RAG?

Traditional safety research tooling (Embase, Medline search interfaces, internal signal databases) is **retrieve-per-query**: you type a search, it fetches matching chunks, you synthesize in your head, then the synthesis is lost when you close the tab. Your next search starts from zero.

A compiled wiki inverts this. **Every paper you read becomes a durable structured page.** The LLM maintains the interconnection graph: when a new paper on CAR-T cytokine release syndrome arrives, the ingest pipeline updates the CRS mechanism page, cross-references the affected drug pages, flags any contradiction with prior claims, and appends a log entry. Next time you need a CRS overview, it's already compiled — you just read the page.

**The wiki is the artifact.** The LLM is a bookkeeper.

This matters in safety research specifically because:

1. **Mechanism knowledge is durable.** A paper on IL-6 signaling in CAR-T CRS published in 2023 will still be mechanistically correct in 2026. Compounding is high-value.
2. **Cross-references are the whole game.** CRS-->tocilizumab-->IL-6 receptor blockade-->Roche atlizumab branding-->lemtrada labeling. You can't hold this in your head. The wiki does.
3. **Signals are fuzzy.** You see a weird AE pattern, you need to know every time that pattern has been seen before. Grep across a compiled vault is fast. Retrieval across a raw database is slow and brittle.
4. **Regulatory submissions reward synthesis, not retrieval.** When you write a BLA/NDA safety section, you're synthesizing years of evidence. A compiled wiki is the substrate for that synthesis.

## Domain-specific page types

You will author (or have the LLM author) five kinds of pages. Each has a template.

### 1. Mechanism page

One biological or pharmacological mechanism. Examples: `IL-6-signaling.md`, `qt-prolongation.md`, `hepatotoxicity-DILI.md`, `immunogenicity-ADA.md`.

```yaml
---
type: mechanism
entity: IL-6-signaling
updated: 2026-04-09
updated_by: Claude
status: active
tags: [mechanism/cytokine, mechanism/immune, severity/serious]
aliases: [IL-6, Interleukin-6, IL-6R signaling]
related: [CRS, ICANS, hepatotoxicity]
---
```

Required sections:
- **Biology** (what the mechanism is, 2-3 paragraphs)
- **Clinical manifestations** (how it presents in patients)
- **Affected drug classes** (wikilinks to drug pages)
- **Associated adverse events** (wikilinks to AE pages)
- **Mitigations** (wikilinks to mitigation pages)
- **Key references** (citations with PMIDs or internal doc IDs)
- **Open questions**
- **History** (change log)

### 2. Drug page

One molecule or compound. Examples: `tisagenlecleucel.md`, `axicabtagene-ciloleucel.md`, `abc123.md` (for internal compounds).

```yaml
---
type: drug
entity: tisagenlecleucel
generic_name: tisagenlecleucel
brand_names: [Kymriah]
drug_class: CAR-T
mechanism_of_action: CD19-directed autologous T-cell therapy
updated: 2026-04-09
status: active
tags: [drug/car-t, drug/cd19, indication/ALL, indication/DLBCL]
aliases: [Kymriah, CTL019]
related: [CD19-CAR-T-class, CRS, ICANS]
---
```

Required sections:
- **Indication**
- **Mechanism of action** (wikilink to mechanism page)
- **Known adverse events** (wikilinks to AE pages with frequency)
- **REMS / risk management**
- **Labeling changes** (chronological, with dates)
- **Signals under investigation**
- **Key references**
- **History**

### 3. Adverse event page

One AE or AE cluster. Examples: `CRS.md`, `ICANS.md`, `DILI-grade-3-4.md`, `tumor-lysis-syndrome.md`.

```yaml
---
type: adverse-event
entity: CRS
updated: 2026-04-09
status: active
tags: [ae/cytokine, ae/immune, severity/serious, ae/systemic]
aliases: [Cytokine Release Syndrome, CRS-ASCT grading]
grading_system: ASTCT-2019
related: [IL-6-signaling, ICANS, tocilizumab, corticosteroids]
---
```

Required sections:
- **Definition / grading**
- **Mechanism** (wikilink)
- **Affected drug classes** (wikilinks)
- **Clinical management** (wikilink to mitigation pages)
- **Signal history** (has this AE been escalated, when, outcome)
- **Labeling implications**
- **Key references**
- **History**

### 4. Signal page

One active or historical signal you're tracking. Examples: `signal-2026-03-lvef-carT.md`, `signal-2025-09-secondary-malignancy-gene-therapy.md`.

```yaml
---
type: signal
entity: signal-2026-03-lvef-carT
opened: 2026-03-15
closed: null
severity: medium
status: active
tags: [signal/active, signal/cardiac, ae/lvef]
related: [CAR-T-class, LVEF-decline, cardiotoxicity]
---
```

Required sections:
- **Signal description** (what pattern you observed)
- **Evidence** (how many cases, which studies, what data sources)
- **Biological plausibility** (wikilink to mechanism if known)
- **Affected products** (wikilinks to drug pages)
- **Actions taken** (committee reviews, label changes, etc.)
- **Current status**
- **Decision log** (every meeting where this was discussed)

### 5. Study / trial page

One clinical trial, observational study, or postmarket surveillance dataset. Examples: `NCT01234567.md`, `eurocarT-registry.md`, `faers-2025-pull.md`.

```yaml
---
type: study
entity: NCT01234567
phase: 3
population: "adult r/r DLBCL, n=400"
primary_endpoint: overall survival
updated: 2026-04-09
tags: [study/phase3, study/rwd, indication/DLBCL]
related: [tisagenlecleucel, CRS, ICANS]
---
```

Required sections:
- **Design**
- **Population / eligibility**
- **Interventions**
- **Endpoints**
- **Safety findings** (focus on this — this is why the page exists)
- **Key references**
- **Cross-references to related signals or AEs**

## Two spine files (same as generic LLM wiki)

Your safety vault has two spine files that every operation touches:

### `index.md` — categorized catalog

Group by page type. Each entry is a wikilink + one-line summary. Categories: Mechanisms, Drugs, Adverse Events, Signals, Studies, Submissions, Open Questions.

```markdown
## Mechanisms
- [[IL-6-signaling]] — cytokine cascade driving CRS and ICANS
- [[QT-prolongation]] — hERG-mediated repolarization delay
- [[hepatotoxicity-DILI]] — drug-induced liver injury, grading and mechanism

## Drugs
- [[tisagenlecleucel]] — CD19 CAR-T (Kymriah), r/r ALL and DLBCL
- [[axicabtagene-ciloleucel]] — CD19 CAR-T (Yescarta), r/r DLBCL
- [[InternalCompound-ABC123]] — IL-2 mutein, preclinical

## Adverse Events
- [[CRS]] — cytokine release syndrome (ASTCT grading)
- [[ICANS]] — immune effector cell-associated neurotoxicity syndrome
- [[tumor-lysis]] — metabolic derangement from rapid tumor cell death

## Active Signals
- [[signal-2026-03-lvef-carT]] — LVEF decline cluster in CAR-T postmarket
- [[signal-2025-09-secondary-malignancy]] — T-cell malignancy signal in lentiviral vectors
```

### `log.md` — append-only ledger

One line per event. Actions: `ingest`, `review`, `signal-open`, `signal-close`, `label-change`, `committee`, `lint`.

```markdown
## [2026-04-09] ingest | Nature paper on IL-6 receptor dynamics in CAR-T
- Source: Chen et al. 2026, Nature 631, PMID 12345678
- Updated: [[IL-6-signaling]], [[CRS]], [[tocilizumab]]
- New page: none
- Contradictions flagged: one minor (prior CRS page said peak IL-6 at 72h; new paper shows 48h in lymphodepleted pts)
- Open questions added: 2

## [2026-04-08] signal-open | LVEF decline cluster in CAR-T postmarket
- Page: [[signal-2026-03-lvef-carT]]
- Evidence: 14 cases in PV database, 3 grade 3-4
- Next step: pull comparator rates from FAERS
- Committee: scheduled for 2026-04-15

## [2026-04-07] lint | weekly audit
- Orphans: 3 (investigated, added cross-refs)
- Stale pages: 12 (>90d without update)
- Contradictions: 0
- Broken wikilinks: 1 (fixed: typo in [[tocilizumabb]])
```

## Ingest workflow (write-heavy)

When a new source arrives, the LLM does the following in a single pass:

```
1. Read the source (paper, trial report, FAERS pull, regulatory letter)
2. Extract: title, authors, date, key claims, citations
3. Identify the entities mentioned: drugs, mechanisms, AEs, signals, studies
4. For each entity, locate the existing page (or flag that a new page is needed)
5. For each existing page:
     a. Determine what this source adds (new claim, contradicting evidence, new reference)
     b. Update the page in place — add to the right section, update references, update "last reviewed" date
     c. Bump frontmatter `updated` field
6. If any entity has no page yet, create one from the appropriate template
7. If the source contradicts an existing claim, add a `> [!warning]` callout flagging the contradiction with both citations
8. Append a log entry summarizing the ingest
9. Run wiki.py --lint to confirm no new orphans or broken links introduced
```

This is the **Karpathy rule**: ingest touches 10-15 related pages, not just one. That's where the compounding comes from.

## Query workflow (read-only, fast)

```
1. Start at index.md to orient
2. Click through to the most relevant page (or use the wiki.py --article command)
3. Follow wikilinks to related pages
4. If the answer requires synthesis across pages, write a new "notes" page capturing the synthesis
5. The notes page itself becomes ingestable content on the next pass
```

## Lint workflow (periodic audit)

Run weekly or after any major ingest session.

```
1. wiki.py --lint
2. Review orphans — either add backlinks from relevant pages, or confirm the page is intentionally standalone
3. Review broken wikilinks — fix typos, create missing pages, or remove dead references
4. Review stale pages (>90 days) — are they still current? If yes, bump `updated` and record; if no, flag for revision
5. Review contradictions (surfaced by `> [!warning]` callouts) — reconcile or escalate
6. Append a lint log entry
```

## Frontmatter schema (full)

Required on every page:
- `type` — one of: mechanism, drug, adverse-event, signal, study, submission, note
- `entity` — canonical name (usually matches filename)
- `updated` — ISO date
- `status` — active | archived | draft
- `tags` — hierarchical list with slash separators

Optional by type:
- For drugs: `generic_name`, `brand_names`, `drug_class`, `mechanism_of_action`, `indication`
- For AEs: `grading_system`, `preferred_term_meddra`
- For signals: `opened`, `closed`, `severity`
- For studies: `phase`, `population`, `primary_endpoint`, `nct_id`
- For mechanisms: `affected_systems`

## Tag vocabulary (suggested)

Use slash hierarchy. Extend by adding new terms, not new prefixes.

| Prefix | Examples |
|--------|----------|
| `mechanism/` | `mechanism/cytokine`, `mechanism/cardiac`, `mechanism/hepatic`, `mechanism/neuro` |
| `drug/` | `drug/car-t`, `drug/mab`, `drug/small-molecule`, `drug/gene-therapy` |
| `indication/` | `indication/DLBCL`, `indication/ALL`, `indication/MM`, `indication/HCC` |
| `ae/` | `ae/cardiac`, `ae/hepatic`, `ae/cytokine`, `ae/neuro`, `ae/derm` |
| `severity/` | `severity/mild`, `severity/moderate`, `severity/serious`, `severity/fatal` |
| `signal/` | `signal/active`, `signal/closed`, `signal/under-review` |
| `study/` | `study/phase1`, `study/phase3`, `study/rwd`, `study/faers` |
| `submission/` | `submission/BLA`, `submission/sNDA`, `submission/PBRER` |

## Python query layer (wiki.py)

Use the generic wiki.py from the `build-llm-wiki` skill. The same module works for safety research with zero modifications — it reads frontmatter, extracts wikilinks, builds backlinks, computes tag indexes, finds orphans, audits broken links. All safety-specific logic lives in the page templates and the tag vocabulary, not in the code.

Minimum CLI commands you'll use daily:

```bash
python wiki.py --article CRS                  # read an AE page
python wiki.py --backlinks IL-6-signaling     # what references this mechanism?
python wiki.py --tag mechanism/cytokine       # all cytokine mechanism pages
python wiki.py --similar tisagenlecleucel     # semantically similar drug pages
python wiki.py --lint                         # weekly audit
python wiki.py --log 20                       # recent activity
```

See the generic `build-llm-wiki` skill for the full implementation recipe.

## Templates directory

Create a `templates/` subfolder at the root of your vault with one file per page type:

```
templates/
├── mechanism.md.tmpl
├── drug.md.tmpl
├── adverse-event.md.tmpl
├── signal.md.tmpl
├── study.md.tmpl
└── README.md
```

Each template has the frontmatter skeleton + section stubs with placeholder text. When you create a new page, copy the template and fill in.

## Hard rules for safety work

These are stricter than the generic wiki rules because the domain is higher-stakes.

1. **Every clinical claim cites a source.** No uncited claims in mechanism, drug, or AE pages. If you don't have a citation, use a `> [!todo]` callout noting the source is pending.
2. **Contradictions are flagged, not silently resolved.** When new evidence contradicts an existing claim, add a `> [!warning]` callout with both citations. Only remove the contradiction after explicit reconciliation.
3. **Patient data stays out.** Identifiable patient information (DOB, initials, case narrative with PII) never enters the wiki. Reference case counts and aggregate patterns only.
4. **Internal compound code names** only in pages marked `status/internal`. If you export the wiki, filter by `status` before sharing.
5. **Date every action.** Every log entry, every signal review, every label change — ISO date. No relative dates.
6. **The wiki is not the system of record.** The company's PV database, safety committee minutes, regulatory submissions — those are authoritative. The wiki is a navigation and synthesis layer ON TOP of them. Always cite back to the authoritative source.
7. **Lint before sharing.** Run `wiki.py --lint` before any external review, handoff, or export. Broken wikilinks and orphans in a safety context look sloppy and invite skepticism.

## Bootstrapping: phase 1 (minimal working vault in 1-2 hours)

1. Create a folder: `safety-wiki/`
2. Drop in `wiki.py` from the generic `build-llm-wiki` skill
3. Write `index.md` (empty shell with category headings)
4. Write `log.md` (empty shell with entry format header)
5. Create `templates/` subfolder with the 5 page type templates
6. Write your first mechanism page on a familiar topic (e.g., `hepatotoxicity-DILI.md`)
7. Write your first drug page referencing that mechanism
8. Run `python wiki.py --reindex` — verify the backlink shows up
9. Run `python wiki.py --lint` — should be clean

You now have a working vault. Every paper you read from here on becomes permanent.

## Bootstrapping: phase 2 (seed 10 pages, 1 week)

Over the next week, ingest:
- 3 mechanism pages from your core domain (whatever you work on daily)
- 3 drug pages (one per drug class you care about)
- 2 AE pages for the most clinically relevant events in your portfolio
- 1 signal page (a current signal you're tracking)
- 1 study page (a pivotal trial you reference often)

At the end of the week, run `wiki.py --lint` and `wiki.py --log`. If you have 10+ pages, 30+ backlinks, 0 broken links, you've reached critical mass.

## Bootstrapping: phase 3 (habit formation, 1 month)

Every time you:
- Read a paper → add it as a source, update 5+ related pages
- Review a signal → update the signal page with the day's decision
- Attend a safety committee → append 1-3 log entries
- Write a regulatory document → reference the wiki pages that fed into it

One month in, you should have:
- 30-50 pages
- Several active signals tracked
- A weekly lint habit
- The vault has become the first place you look when you need to answer any safety question

## What NOT to put in the vault

- Patient-level data (case reports, narratives, identifiable info)
- Internal committee minutes verbatim (cite them, don't copy)
- Draft labeling under embargo (wait until public)
- Anything you wouldn't be comfortable showing a colleague from a different team
- Anything from outside your legal access scope

## Obsidian compatibility

Everything in this vault is Obsidian-native. Open the folder in Obsidian and:
- Graph view shows your mechanism/drug/AE interconnection
- Backlinks panel works on every page
- Tags pane shows your hierarchical tag vocabulary
- Properties pane shows frontmatter

If you want to share a clean read-only view with a colleague, export to HTML via Obsidian or run a simple markdown-to-HTML converter. The wiki format has no Obsidian lock-in.

## Integration with enterprise systems

This skill deliberately does NOT prescribe integration with Medline, Embase, internal PV databases, or any other enterprise system. The compiled-not-retrieved philosophy means the wiki is the synthesis layer; the enterprise systems are the source-of-truth layer. You manually ingest from them into the wiki as needed.

If you want automation, the right pattern is:
- A small ingest script that watches a `sources/` directory for new PDFs
- The LLM reads each new source and performs the ingest workflow described above
- The script commits the result to git with a descriptive message

But this is optional. The wiki works fine with manual ingest.

## Testing checklist

Before you start using the vault for real work:

- [ ] `wiki.py --selftest` passes
- [ ] At least one page of each of the 5 types exists
- [ ] `wiki.py --reindex` produces non-empty backlinks.json, tag-index.json
- [ ] `wiki.py --lint` returns 0 broken links
- [ ] Opening the vault in Obsidian works and graph view renders
- [ ] At least 5 wikilinks resolve correctly across pages
- [ ] Your log.md has at least 3 entries

## When this skill applies

Use this skill when:

- You're a safety researcher, physician, or PV scientist starting a new research area
- You're building out a submission-supporting evidence synthesis
- You want to stop losing knowledge between literature reviews
- You're in an enterprise environment where you can't use external AI-memory SaaS
- You need to onboard junior staff fast — the wiki becomes a training substrate

Do NOT use this skill when:

- You need a real-time signal detection system (use your PV database, not a wiki)
- You're building a patient-facing decision aid (compliance requirements are different)
- You need multi-user concurrent editing with access controls (use Confluence or a real wiki platform)
- The scope is <10 sources total — grep through your bibliography is fine

## Done criteria

You are using the skill successfully when:

1. The wiki answers at least one question per day you couldn't have answered from memory
2. Every paper you read ends up in the vault within 24 hours
3. `wiki.py --lint` shows 0 broken links and < 5 orphans at all times
4. Weekly log entries show 10+ ingest actions
5. At least one signal page has matured over 30+ days with decision history

If after 3 months those criteria aren't met, the habit hasn't formed. Either adjust scope (ingest fewer, higher-quality sources) or accept that this workflow isn't for you.

## Final assembly order

1. Set up the folder structure and `wiki.py` (30 minutes)
2. Write your first 3 mechanism pages on topics you know cold (1 hour)
3. Write your first 3 drug pages referencing those mechanisms (45 minutes)
4. Write your first 2 AE pages (30 minutes)
5. Write 1 signal page from a current tracked signal (20 minutes)
6. Run `wiki.py --reindex`, `wiki.py --lint`, `wiki.py --selftest` (5 minutes)
7. Open in Obsidian, verify graph view (5 minutes)
8. Start ingesting real sources (ongoing)

Total time to working vault: 3-4 hours of focused work.

Total time to compound kicking in: 2-4 weeks of daily habit.

Total time to transformational impact on how you work: 3-6 months.
