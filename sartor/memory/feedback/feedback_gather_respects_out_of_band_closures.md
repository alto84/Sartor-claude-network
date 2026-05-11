---
name: gather-respects-out-of-band-closures
description: The personal-data-gather pipeline must read recent Alton-check-in / triage blocks at the top of family/active-todos.md before re-emitting callouts. If an item appears as RESOLVED / CLOSED / DOWNGRADED in the most-recent such block, do NOT re-surface it as a new [!warning] / [!deadline] even when the originating Gmail/Calendar signal is unchanged. The pipeline-side complement to feedback_paper_checks_blindspot.
type: feedback
date: 2026-05-02
updated: 2026-05-02
updated_by: family-thread session (Opus 4.7 1M context, family-curator)
status: active
priority: p1
tags: [domain/family, pipeline/personal-data-gather, behavior/dashboard, behavior/non-resurrection]
related: [feedback/paper-checks-blindspot, feedback/always-check-paper-check-vendors-before-flagging-red, feedback/intake-protocol, family/PAPER-CHECK-VENDORS, family/active-todos, family-todos-longrunning-thread, family-memory-fixup, projects/family-thread-dossier/family-dashboard-2026-05-02]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Gather respects out-of-band closures (non-resurrection rule)

**Rule:** Before emitting a new `[!warning]`, `[!deadline]`, or `[!blocker]` callout in `family/active-todos.md`, the `personal-data-gather` skill MUST first scan the file for the item's keyword (vendor name, dollar amount, person name, deadline phrase) inside any `## YYYY-MM-DD Alton check-in — out-of-band resolutions` or `## YYYY-MM-DD … triage — Alton decisions` block. If found there as **RESOLVED / CLOSED / DOWNGRADED**, do NOT re-emit the callout. Instead, append at most one short `[!fact] OUT-OF-BAND-CLOSED — see top-of-file (YYYY-MM-DD)` line so future gather runs can see the prior decision without rebuilding the dashboard.

**Why:** On 2026-05-02, Alton confirmed 4 items closed out-of-band (Wohelo $12,900 paper check, 185 Davis $2,253 paper check, Bill heating-guy paper check, Lucent Solar in-person engineering meeting). None left a Gmail or Calendar trace. Without this rule, the next morning's gather run would have:

- Seen Heidi Gorton's Apr 13 thread with no payment-confirmation reply and re-flagged Wohelo as `[!warning]` IMMINENT;
- Seen Charlotte Rice's Apr 27 unanswered email and re-flagged 185 Davis as OVERDUE;
- Seen the Niko/Doug Paige Apr 13–17 thread with no calendar event and re-flagged Lucent Solar as `[!blocker]` with the $131K ITC framing;
- Resurrected the carry-forward "pay heating guy" line as still open.

That would have wasted Alton's attention, eroded trust in the dashboard, and forced him to re-explain the same closures every morning. The right move is for the pipeline to honor Alton's explicit out-of-band decisions as authoritative.

**How to apply (procedure for the gather skill):**

1. Before generating ANY new deadline / overdue / blocker callout, extract its keyword set: vendor name (Wohelo, Lucent, Charlotte Rice, Heidi Gorton), dollar amount ($12,900, $2,253), distinguishing phrase ("ITC deadline", "expansion tank vote", "Mother's Day gift").
2. Grep `family/active-todos.md` for those keywords inside the **most recent** `## YYYY-MM-DD Alton check-in` or `## YYYY-MM-DD … triage` section. The most recent date wins; older closures are superseded only by newer Alton statements.
3. If a match exists in the **Closed / resolved**, **Resolved**, or **Downgraded** subsection of that block:
   - SKIP the new `[!warning]` / `[!deadline]` / `[!blocker]` callout.
   - Optionally emit ONE `[!fact] OUT-OF-BAND-CLOSED — Alton confirmed YYYY-MM-DD; see top-of-file` line in that day's gather section, so the audit trail is preserved.
4. If a match exists in **Still open** or doesn't exist at all, proceed normally with the callout.
5. NEVER ignore an `## Alton check-in` block by silently overwriting it. If the gather skill needs to dispute a closure (e.g., a NEW invoice for the same vendor), emit a `[!warning] POSSIBLE RE-OPEN` callout citing the new evidence, not a fresh independent `[!warning] OVERDUE`.

**Edge cases:**

- **Re-occurring deadlines** (e.g., monthly condo assessment, recurring vendor invoice). If the closure note specifies "lump sum chosen" but a fresh invoice arrives next month, that's a NEW item — emit it. The non-resurrection rule applies to the SAME deadline / SAME amount, not to legitimately new ones with the same vendor.
- **Partial closures** (e.g., Wohelo deposit paid but full tuition still outstanding). The closure note must explicitly say what was closed. If ambiguous, the pipeline emits `[!todo] CLARIFY — out-of-band note ambiguous on scope: [vendor] [amount]` rather than guessing.
- **Resolution notes that age out.** A 90-day-old "in the mail" claim with no subsequent confirmation should be treated as STALE — emit a `[!todo] CONFIRM — out-of-band resolution from YYYY-MM-DD never reconciled in inbox` rather than treating it as still-closed.

**Relationship to sibling rules:**

- [[feedback/paper-checks-blindspot]] is the **human-facing** rule: when Claude itself drafts dashboard text or a status report, ASK Alton before escalating to RED, because the answer might be "already done." This rule is the **pipeline-facing** complement: when the AUTOMATED gather pipeline re-runs, RESPECT prior Alton confirmations rather than rebuilding the dashboard from email signal alone. Together they close both halves of the loop.
- See also `family/PAPER-CHECK-VENDORS.md` (mentioned in sibling rule, may not yet exist) for the running list of vendors whose closures are structurally invisible.

**History:**

- 2026-05-02 — Created during family-thread dashboard v2 generation, after Alton's 4 out-of-band resolutions made the structural blind spot visible. Drafted by family-curator (Opus 4.7) at team-lead's instruction. Sibling rule `feedback_paper_checks_blindspot.md` was created in parallel by another family-thread agent; this rule cross-links it.
