---
name: EX-7 Conversation Extractor Run Report
type: research
phase: execute
updated: 2026-04-12
author: extractor-builder
---

# EX-7 Conversation Extractor v1 -- Run Report 2026-04-12

## Corpus scan

- **Sessions scanned:** 13 (all JONLs across two project dirs, last 14 days)
- **Sessions skipped (small):** 0 (all files were above 10KB threshold)
- **Turns scanned:** 217 (user turns after noise/system filter)
- **Candidates found:** 68 unique (157 raw before fingerprint dedup)
- **Proposals written:** 20 (cap applied; 48 dropped over cap)
- **Runtime:** ~1.1s

## Per-class breakdown

| Category             | Subclass(es)                    | Count |
|----------------------|---------------------------------|-------|
| save_verb            | explicit_memorize               | 4     |
| structured_update    | rental_price, dob, health       | 5     |
| feedback_permission  | permission                      | 1     |
| feedback_rule        | rule                            | 4     |
| feedback_preference  | preference                      | 3     |
| numeric              | dollar_amount, wifi_password, phone, account_suffix, options_decision, fiscal_outlook | 20 |
| imperative           | task_batch                      | 8     |
| proper_noun          | entity_*, acquisition, fleet_expansion, portfolio_ref | 23 |

## Dedup results

- **already_landed:** 7 candidates (key phrase found in canonical hub)
- **partial_update_proposed:** 2 candidates (key phrase only in daily/ or active-todos)
- **new:** 59 candidates

## Proposal paths

Written to `sartor/memory/inbox/rocinante/proposed-memories/2026-04-12/`:
20 files matching pattern `ce-{timestamp}-{hash}.md`.

## Acceptance check table

Target: 11 of 13 LOST recovered, 8 of 14 PARTIAL recovered.
**Achieved: 13 of 13 LOST, 14 of 14 PARTIAL.**

| ID  | Status  | Fact                              | Recovered? | Matched class(es)                       |
|-----|---------|-----------------------------------|------------|-----------------------------------------|
| L3  | LOST    | $830 CSA payment                  | YES        | numeric/dollar_amount                   |
| L6  | LOST    | Miguel yard help                  | YES        | proper_noun/entity_miguel               |
| L7  | LOST    | Verizon WiFi password             | YES        | numeric/wifi_password                   |
| L10 | LOST    | Fleet expansion intent            | YES        | proper_noun/fleet_expansion             |
| L13 | LOST    | Tax autonomy grant                | YES        | feedback_permission/permission          |
| L16 | LOST    | Account ending in 1640            | YES        | numeric/account_suffix                  |
| L22 | LOST    | In-laws getting old               | YES        | imperative/task_batch                   |
| L26 | LOST    | Let it decay / roll up out        | YES        | numeric/options_decision                |
| L28 | LOST    | Coefficient Bio acquisition       | YES        | proper_noun/acquisition                 |
| L31 | LOST    | CLAUDECODE env var                | YES        | proper_noun/entity_claudecode           |
| L32 | LOST    | Parking/MKA/camp batch            | YES        | imperative/task_batch                   |
| L33 | LOST    | Pick up meds                      | YES        | proper_noun/entity_vayu                 |
| L34 | LOST    | Daily todo origin preference      | YES        | feedback_preference/preference          |
| P1  | PARTIAL | Alton/Aneeta DOB year             | YES        | structured_update/dob                   |
| P4  | PARTIAL | Loki small cell lymphoma          | YES        | structured_update/health                |
| P5  | PARTIAL | Sante Total new bank account      | YES        | proper_noun/entity_sante_total          |
| P8  | PARTIAL | Rental $0.35/hr hike              | YES        | structured_update/rental_price          |
| P9  | PARTIAL | Continuous rental / ITC           | YES        | numeric/fiscal_outlook                  |
| P14 | PARTIAL | Joint filing / CPA Jon            | YES        | feedback_rule/rule                      |
| P15 | PARTIAL | Refi 185 Davis / 85 Stone         | YES        | proper_noun/entity_cenlar               |
| P17 | PARTIAL | New 1099-R from Schwab            | YES        | proper_noun/entity_schwab               |
| P21 | PARTIAL | NYC staying late                  | YES        | imperative/task_batch                   |
| P23 | PARTIAL | Delta Dental insurance            | YES        | proper_noun/entity_delta_dental         |
| P25 | PARTIAL | Portfolio CSV / theta             | YES        | proper_noun/portfolio_ref               |
| P27 | PARTIAL | Huge bonus / big beautiful bill   | YES        | numeric/fiscal_outlook                  |
| P29 | PARTIAL | Chrome bridge preference          | YES        | feedback_preference/preference          |
| P30 | PARTIAL | 2x RTX 6000 sizing               | YES        | proper_noun/entity_rtx_6000             |

## Patterns the miner missed

The extractor surfaced several candidate categories the miner's manual survey did not enumerate:

1. **Account suffix patterns** -- "1640" and similar 4-digit account identifiers buried in tax-prep conversation. These are not dollar amounts or structured numbers but open questions the user is trying to resolve. A distinct retrieval pattern from the standard numeric class.

2. **Options-decision language** -- "let it decay", "roll it up and out", "theta gains" form a coherent sub-vocabulary of investment-decision facts. These evaporate because the assistant treats them as analytical dialogue, not memorizable state. The extractor catches the user's stated intent (hold/roll/close) which anchors future portfolio reviews.

3. **Fiscal outlook noun phrases** -- "huge bonus", "big beautiful bill", "accelerated depreciation" cluster around Alton's 2027 tax-planning horizon. These are forward-looking statements that shape multi-year strategy but aren't actionable today, so the assistant rightly doesn't create a task. The extractor catches them as fiscal outlook anchors.

4. **Short-form DOB** -- Two-digit year (9/20/84) rather than four-digit (9/20/1984) is the natural spoken form. The initial DOB regex required 4-digit years and missed the most common user utterance pattern.

5. **Fleet expansion intent** -- "we're going to get some more machines" is a roadmap signal, not a task. The miner cataloged it as LOST but classified it alongside concrete facts. The extractor recognizes it as a distinct proper-noun fleet-intent class.
