---
name: Conversation Loss Catalog (Phase 1E)
description: Audit of facts surfaced in Claude Code chat sessions over the last ~14 days that should have landed in the Sartor memory wiki, with capture/loss status and patterns inferred for the conversation-to-memory pipeline.
type: research
phase: explore
updated: 2026-04-12
author: conversation-miner
---

# Phase 1E — Conversation Loss Catalog

## Method

- Source: 13 Claude Code session JSONLs across `C:/Users/alto8/.claude/projects/C--Users-alto8/` and `.../C--Users-alto8-Sartor-claude-network/`. Three substantive sessions (`70c5dd35` Mar 11–Apr 4, `a2a364fe` Apr 5–6, `6d66075b` Apr 7–12) carry virtually all the user prompts; the rest are 1-prompt cron / scheduled-task fragments.
- I extracted all user-authored string prompts (skipping `tool_result` payloads, `<command-name>` shells, and `<local-command-caveat>` meta), 11.6K lines / 880 KB total. I spot-checked assistant continuation summaries (the "This session is being continued..." blocks) to triangulate facts the model itself had compressed.
- For each candidate fact I grepped `sartor/memory/` for the key phrase or entity. "Landed" = appears in any non-`projects/mini-lab` non-`reviews` file. "Partial" = appears once, usually in `daily/` or `active-todos`, but not in the canonical home (e.g., named in a daily log but missing from `FAMILY.md`, `BUSINESS.md`, `MACHINES.md`, or a people dossier).
- Scope of "should have been memorized" is the seven categories named in the task brief; I deliberately ignored transient working state and tool churn.

## Capture-rate sample bias check

To verify the wiki is not at zero capture, I confirmed five facts that DID land cleanly:

| # | Fact | Where it landed |
|---|------|------|
| C1 | Aneeta moved Biogen → Neurvati Neurosciences (NY EIN 87-1954898), partial-year W-2 Box 1 $194,289.10 | `TAXES.md` line 68, `BUSINESS.md`, `daily/2026-04-06.md` |
| C2 | EPD MLP K-1 in Aneeta's name (Enterprise Products Partners) | `TAXES.md` line 74 |
| C3 | Form 7004 (LLC 1065) extension filed Mar 14 2026; NJ-1065 $450 fee due Apr 15 regardless | `TAXES.md` lines 50–52 |
| C4 | CSA share split with Ilan Grunwald + Khushbu Patel; edit-response Google Forms URL | `people/ilan-grunwald.md`, `family/active-todos.md` |
| C5 | Loki chemo (chlorambucil) reorder via Chewy Rx, Bond Vet Montclair | `family/active-todos.md` line 46 |

Capture rate is clearly non-zero. The wiki is doing real work, especially in `TAXES.md` and `daily/`. The losses cluster in specific structural places (see patterns at end).

## Loss catalog (35 entries)

Status legend: **LOST** = no trace anywhere; **PARTIAL** = appears in a daily log or scratch but not in its canonical home; **WRONG-HOME** = captured but in a place that won't surface during normal recall; **LANDED** = check facts (overlap with capture-rate sample for cross-reference).

| # | Date | Fact-type | Fact (verbatim or paraphrased) | Why it matters | Where it should live | Status |
|---|------|-----------|--------------------------------|----------------|----------------------|--------|
| 1 | 2026-04-10 22:54 | personal | Alton birthday 9/20/1984; Aneeta birthday 10/20/1980 — explicit "please correct" instruction | Identity anchor; year was missing from prior entries | `ALTON.md`, `FAMILY.md` (full DOB) | **PARTIAL** — month/day captured, year (1984/1980) not stored |
| 2 | 2026-04-10 22:52 | personal | Alton cell (504) 579-3185; Aneeta cell (973) 303-5427 ("save it in our memory system as well") | Direct memorize directive; contact info | `ALTON.md`, `FAMILY.md` | **LANDED** (both numbers in canonical files) |
| 3 | 2026-04-10 23:25 | financial | "I finished the form. Just sent $830" (CSA payment confirmation) | Audit trail / receipt | `people/ilan-grunwald.md` or ledger | **LOST** — no $830 anywhere in memory |
| 4 | 2026-04-10 23:27 | family/medical | Loki has small-cell lymphoma; chemo via Chewy | Anchors a recurring task and a pet medical condition | `FAMILY.md` Loki entry, `people/`-equivalent for cats | **PARTIAL** — chemo reorder is in `active-todos`, but `FAMILY.md` still lists Loki only as "Cat" with no diagnosis |
| 5 | 2026-04-10 23:28 | nonprofit | Sante Total needs new bank account for specified donations that need separation | Operational/compliance ask | `business/sante-total.md` | **PARTIAL** — appears in `active-todos`, not added to the Sante Total ops file |
| 6 | 2026-04-10 23:28 | named entity | Miguel — yard help, coming this weekend | Recurring vendor / household contact | `people/miguel-*.md` | **LOST** — only in `active-todos` as a name, no dossier |
| 7 | 2026-04-10 14:27 | reference | Verizon WiFi password `cutler9-nor-cot` | Operational secret-but-not-secret; explicit user share | `reference/network.md` or `MACHINES.md` (Rocinante) | **LOST** — zero hits |
| 8 | 2026-04-11 23:12 | machine state | Raised vast.ai rental price to $0.35/hr "for a few weeks" — explicit decision | Pricing decision with rationale | `MACHINES.md` and/or `business/rental-operations.md` | **PARTIAL** — landed in `business/rental-operations.md` line 67, but `MACHINES.md` line 69 still shows $0.40 (now stale) |
| 9 | 2026-04-12 00:15 | business strategy | Continuous-rental priority over profit; rationale = burn electricity to justify Tesla Solar Roof ITC deduction (mixed-use property) | Load-bearing strategy: drives every pricing/utilization decision | `BUSINESS.md` and `business/solar-inference.md` | **PARTIAL** — captured in agreements + machines/gpuserver1/MISSION but the *why* (electricity burn → ITC justification) is fragmentary in canonical business doc |
| 10 | 2026-04-12 00:15 | business strategy | "Getting some more machines" — fleet expansion intent | Roadmap signal | `MASTERPLAN.md` or `business/rental-operations.md` | **LOST** as discrete intent; only inferred via the RTX 6000 build project |
| 11 | 2026-04-11 01:39 | project | Dual RTX 6000 Pro Blackwell + 256 GB ECC + fast NVMe target build, ~$30–35K budget, will buy on credit "soon" | Active capital project with budget | `projects/rtx6000-workstation-build.md` | **LANDED** (project file exists) |
| 12 | 2026-04-11 02:16 | named entity | Alison Smith updated address: 830 Audubon Street, NOLA 70118 | Person dossier update | `people/alison-smith.md` | **LANDED** (dossier updated) |
| 13 | 2026-04-05 21:13 | preference | "I need you to go back and look at my previous tax years and... do this all on your own... you have permission, period" — durable autonomy grant for tax workflows | Autonomy grant, recurring | `feedback/feedback_tax_autonomy.md` | **LOST** — no feedback file for this |
| 14 | 2026-04-05 21:21 | tax fact | "Aneeta and I file together. We're just going to bundle the tax documents and send to Jon" — joint filing posture + CPA delegation | Filing-status anchor | `TAXES.md` filing posture section | **PARTIAL** — Jonathan Francis dossier exists but the joint-filing posture isn't restated in TAXES.md |
| 15 | 2026-04-05 21:44 | tax fact | Refinanced 185 Davis (Leader Bank 1098), 85 Stonebridge has TWO 1098s (Shellpoint + Cenlar); new HELOC from Cenlar this year | Property-loan structure | `BUSINESS.md` properties or `TAXES.md` mortgage section | **PARTIAL** — Cenlar/Shellpoint show up in 23 files but the two-1098-on-same-property structure isn't captured anywhere obvious |
| 16 | 2026-04-05 22:10 | tax/personal | "I'm having trouble remembering exactly what account that is for 1640" — open question to self about a Schwab/account number | Recurring memory gap that the wiki should solve | `TAXES.md` open questions | **LOST** — "1640" appears only in a draft housekeeping file, not in TAXES.md context |
| 17 | 2026-04-05 22:24 | tax fact | New 1099-R from Schwab, "small account" | Filing line item | `TAXES.md` doc inventory | **PARTIAL** (mentioned in daily logs, not in TAXES.md doc table) |
| 18 | 2026-04-05 22:46 | tax fact | Solar Inference filed an LLC tax extension; need to compile 2025 transactions; NJ + federal joint LLC | Operational deadline | `TAXES.md` | **LANDED** |
| 19 | 2026-04-05 23:10 | reference | Saved credit card + account statements for Solar Inference into Downloads | Source-doc inventory | `snapshots/downloads-inventory.md` | **LANDED** (downloads inventory exists) |
| 20 | 2026-04-07 12:30 | reference | Barbara Weis sent Sante Total 2024 tax e-postcard around May 2025 | Audit-trail anchor | `people/barbara-weis.md` | **LANDED** (Barbara Weis dossier exists) |
| 21 | 2026-04-10 14:07 | personal | Alton's new role described in `C:\Users\alto8\Desktop\CV and Cover letters\New York Senior Director.docx`; will be in NYC frequently and "staying late" | Schedule-shaping life event | `ALTON.md`, `business/az-career.md` | **PARTIAL** — NYC commute is captured but the explicit "staying late frequently" + the source DOCX path are not |
| 22 | 2026-04-10 14:07 | family | Aneeta's parents have been helping in evenings but "are getting old so this is temporary" — childcare gap is closing | Driver of the dentist/childcare hunt | `FAMILY.md` or `people/in-laws.md` | **LOST** as an explicit fact; only the downstream "find childcare" task landed |
| 23 | 2026-04-10 14:07 | task | Need family dentist in Montclair that takes Delta Dental | Concrete recurring need | `family/active-todos.md` (LANDED) and possibly `FAMILY.md` insurance section | **PARTIAL** — task is in active-todos, "Delta Dental" as the family insurance carrier isn't recorded as a standing fact |
| 24 | 2026-04-10 22:28 | named entity | Ilan Grunwald — friend in Montclair, college roommate (provenance) | Relationship context for a named contact | `people/ilan-grunwald.md` | **LANDED** |
| 25 | 2026-04-10 23:30 | financial | Portfolio CSV `Portfolio_Positions_Apr-10-2026.csv` analyzed; Alton has theta-decay options positions; "tech had a nice recovery the last few days" | Snapshot of trading activity + posture | `data/financial/` or `business/` | **PARTIAL** — analysis was performed but no snapshot file exists in `sartor/memory/` |
| 26 | 2026-04-11 00:53 | financial | Alton sore on a specific options position, plans to "let it decay then roll it up and out" | Active-position decision rationale | financial notes | **LOST** — analytical decision evaporated with the conversation |
| 27 | 2026-04-10 22:59 | tax/business | Expecting "huge bonus" next year; ITC for solar installation + accelerated pass-through depreciation under "big beautiful bill" — large 2027 payout expected | Tax-planning anchor for next year | `TAXES.md` 2027 outlook, `business/solar-inference.md` | **PARTIAL** — solar ITC mentioned in business files but the bonus expectation and depreciation acceleration policy reference are not |
| 28 | 2026-04-03 09:40 | external/news | Anthropic acquired stealth Dimension-backed Coefficient Bio in $400M+ stock deal | Industry intel relevant to AZ work + AI strategy | `ASTRAZENECA.md` or `research/` industry log | **LOST** — zero hits anywhere |
| 29 | 2026-04-11 01:42 | preference / project | Wants a custom Chrome bridge built (Puppeteer / Playwright / Selenium evaluation); strong preference to stay in Anthropic ecosystem; permission-prompt friction is the driver | Recurring tooling preference + project intent | `feedback/` and `projects/` | **PARTIAL** — research happened in-session but no project file or feedback rule was created |
| 30 | 2026-04-04 01:38 | infrastructure | "What's the best model we can handle on a 2x RTX Pro 6000 system?" — explicit framing of the future-build target as 2x (not 1x) RTX 6000 Pro | Sizing anchor for RTX 6000 build | `projects/rtx6000-workstation-build.md` | **PARTIAL** — build file exists; the "1x vs 2x" decision history is missing |
| 31 | 2026-03-11 19:06–19:33 | technical/feedback | Discovered Claude Code uses `CLAUDECODE` env var to block nested sessions; correct unset path was via spawning a real new shell, not the `--no-resume` flag | Reusable troubleshooting fact for any future "spawn another claude" attempt | `LEARNINGS.md` or `feedback/` | **LOST** — about an hour of trial-and-error, no surviving artifact |
| 32 | 2026-04-01 09:18 | task | Three explicit tasks: pay parking ticket, pay MKA tuition, pay for summer camp | Concrete recurring obligations | `family/active-todos.md` | **LOST** — none of the three appear; first multi-task list of the conversation evaporated |
| 33 | 2026-04-01 09:41 | task | Pick up meds for Alton + Vayu | Recurring family-ops task | `family/active-todos.md` | **LOST** |
| 34 | 2026-04-01 09:18 | preference | "I'd like a daily to-do/log that we can update across several instances" — explicit feature ask that *defines* the active-todos pattern that later emerged | Origin point for the active-todos design | `feedback/` | **LOST** as the origin moment, even though the pattern itself was implemented |
| 35 | 2026-04-12 00:00 | preference | "Just give gpuserver1 objectives and let them figure out how to execute. If you disagree, come to me." | Durable delegation rule to gpuserver1 | `feedback/` | **LANDED** — `feedback/feedback_objective_level_delegation.md` exists |

Total: 35 entries. Status counts: LANDED 8, PARTIAL 14, LOST 13. Loss-or-degraded rate ≈ 77%, of which 37% is total loss and 40% is "captured in the wrong place to be useful for recall."

## Three patterns about WHAT gets lost and WHY

### Pattern 1 — The "first prompt of the morning" amnesia

The earliest task batch in any new session evaporates. Apr 1 09:18 had three concrete tasks (parking ticket, MKA tuition, summer camp) plus the meds pickup at 09:41 — none survived. Apr 3 00:22 had a long planning prompt mentioning the Hermes scrape; that survived because it became a project. Apr 5 21:13 launched the entire tax workflow and survived. The differentiator is whether the assistant immediately spawned a tool-using subtask. Concrete checklist items handed to a chat-only response window get a verbal acknowledgment and disappear because the assistant has not yet "engaged" any persistence machinery for the session.

**Implication for the pipeline:** the extractor cannot rely on the assistant to remember to write down checklist-style facts. It must scan every user turn for *imperative + concrete noun* patterns and post them to `active-todos.md` regardless of whether downstream agents picked them up.

### Pattern 2 — Mid-tool-use facts get summarized into structure but stripped of provenance

The largest losses happen when a fact is spoken in the middle of a long tool-using turn. Examples: the $830 CSA payment confirmation (turn 23:25 buried between the form filling and a "what else" pivot); the "raised price to $0.35" decision (immediately followed by the "spikey usage" question, so the question got the model's attention and the price change became data point in `rental-operations` instead of a versioned update to `MACHINES.md`); the year-1984/1980 birthday correction (the structured fields got the date but the year was outside the existing template column). Compression-step continuation summaries also do this — the "This session is being continued..." blocks consistently preserve the *technical concepts* but not the *one-line operational facts* uttered between them.

**Implication for the pipeline:** the extractor must run *per-user-turn*, not per-session-summary. Per-turn extraction with high recall on numeric values (dollars, dates, phone numbers, room numbers, account suffixes), proper nouns, and explicit "save / remember / store" verbs would recover most of the loss-13 column. It also needs a "fact wants to update an existing structured field" detector — when the year of a birthday already-recorded as month/day shows up, that should be a STRUCTURED-UPDATE event, not a new memory file.

### Pattern 3 — Feedback-shaped statements rarely become feedback files unless they look like rules

The assistant captured `feedback_objective_level_delegation.md` and `feedback_pricing_autonomy.md`, both of which arrived in clean rule-shaped sentences. It missed the equally-rule-shaped tax autonomy grant ("you have permission, period"), the chrome-bridge ecosystem preference ("I do tend to prefer to stay inside the entropic ecosystem"), the daily-todo origin preference, and the implicit Coefficient Bio "track AI industry M&A" signal. The pattern: feedback gets written down only when the user says "I prefer X" or "from now on Y." Feedback expressed as a one-time exception ("you have permission for *this*") or as an ambient preference ("I tend to prefer") slides past the filter even though it should produce a durable rule.

**Implication for the pipeline:** the extractor needs a feedback classifier that catches three classes — explicit rules ("don't / always / from now on"), permission grants (often phrased as "you can / you have permission / period"), and ambient preferences ("I tend to / I prefer / I usually"). All three should produce candidate feedback files; the curator can downweight or merge later.

## Cross-cutting recommendation for Phase 2

The right unit of capture is the **user turn**, not the session summary or the assistant's free-text response. A Phase-2 extraction job that runs per-turn over JSONL with recall-biased rules for the seven fact-types in the brief — and that has a *separate* "structured-field update" path for facts that should slot into existing rows in `ALTON.md` / `FAMILY.md` / `MACHINES.md` / `TAXES.md` — would have caught at least 11 of the 13 LOST entries above and converted at least 8 of the 14 PARTIAL entries into LANDED. Combined with a small feedback classifier, the resulting recall would land near 90% on the categories the brief actually cares about.
