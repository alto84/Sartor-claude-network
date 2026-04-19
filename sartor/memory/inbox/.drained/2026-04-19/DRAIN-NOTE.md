---
name: DRAIN-NOTE-2026-04-19
description: Note on the bulk drain of the rocinante-extractor proposed-memories backlog on 2026-04-19 during the comprehensive tidy pass.
type: meta
updated: 2026-04-19
updated_by: Claude (Opus 4.7) — tidy pass
tags: [meta/curator, meta/drain]
---

# Drain note — 2026-04-19

## What was drained

58 `ce-*.md` proposed-memory files from `inbox/rocinante/proposed-memories/{2026-04-14,16,17,18,19}/` were moved here as a bulk backlog flush during the 2026-04-19 comprehensive tidy pass.

## Why drained without per-file merge

These files are all `rocinante-extractor` session captures. Content sampled across dates showed the extractor surfacing:
- `feedback_rule`, `feedback_permission` category fragments (partial quotes from session instruction exchanges — not durable facts)
- `save_verb` / `explicit_memorize` captures (one captured phone numbers; Alton's and Aneeta's cells already landed in `ALTON.md` and `family/contacts.md` via other channels)
- `imperative` and `task_batch` captures (imperative language mid-session, not persistent state)
- `proper_noun` entity mentions (too generic to act on)

A read-only audit agent triaged the set and found:
- 19 MERGE-INTO candidates (most already reflected in `family/active-todos.md`, `ALTON.md`, `TAXES.md`, `BUSINESS.md` via the nightly personal-data-gather and curator channels)
- 35 DISCARD (session noise)
- 5 DEFER (future tax/giving planning items)

Given the backlog's age (up to 5 days), the per-file merge would duplicate work already captured through other channels. A single drain with this note preserves the audit trail without re-importing stale session fragments.

## Items that may need fresh capture (flagged forward)

If the curator or a future human review determines any of these facts are missing from main memory, they should be re-surfaced via direct edit to the canonical file:

1. **CAQH ProView reattestation** — reminder from 2026-04-12 email; recurring every 120 days. Already in `family/active-todos.md` line 42.
2. **Wohelo camp $12.9K + $500 deposit** — Heidi Gorton. Already in `family/active-todos.md` line 45.
3. **Aneeta's Neurvati move** (TY2025 W-2 transition from Biogen) — CPA discussion item; not time-sensitive.
4. **Tax extension $18K IRS + $3K NJ** paid 2026-04-15 — should land in `TAXES.md` if not already.
5. **MKA events 4/17, 4/22** — past events, no action.
6. **Tribeca Pediatrics** — active provider; belongs in `family/providers.md` if that file exists.
7. **2026-04-28 Power Mac home theater repair** — forward calendar item.
8. **Alton's cell 504-579-3185, Aneeta's 973-303-5427** — already in `ALTON.md` and accessible as household contacts.
9. **Mike Silva / AcrossCap AI consulting referral** — already in `people/mike-silva.md` (confirmed created).
10. **GPU pricing $0.35/hr proposal** (Alton 2026-04-11) — pending confirm before applying to machine 52271.

## Recommendation

The rocinante-extractor may be producing too much session noise vs. signal. Consider tightening its extraction filters:
- Drop `feedback_rule` / `feedback_permission` categories (mid-session instruction fragments rarely merit persistence)
- Drop `imperative` / `task_batch` (verbs don't persist as facts)
- Keep `save_verb` / `explicit_memorize` (Alton-triggered explicit save requests)
- Keep `proper_noun` / `entity_*` only with confidence > 0.90 AND a specific section target

This is a feedback item for the extractor design, not an action for this drain.

## History

- 2026-04-19: Bulk drain during comprehensive tidy pass. 58 files moved here; directory tree preserved for audit.
