---
name: paper-checks-blindspot
description: The personal-data-gather pipeline is blind to paper checks, in-person meetings, and phone-confirmed actions. When the dashboard flags a payment or commitment as RED/overdue, ASK Alton before escalating — it may already be done.
type: feedback
date: 2026-05-02
updated: 2026-05-02
updated_by: family-thread session (Opus 4.7 1M context); reciprocal cross-link added by family-curator
status: active
priority: p1
tags: [domain/family, pipeline/personal-data-gather, behavior/dashboard]
related: [feedback/gather-respects-out-of-band-closures, feedback/always-check-paper-check-vendors-before-flagging-red, feedback/intake-protocol, family/PAPER-CHECK-VENDORS, family/active-todos, family-todos-longrunning-thread, family-memory-fixup]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Paper-check / out-of-band blind-spot rule

**Rule:** When the family dashboard or `active-todos.md` flags a payment, signature, or commitment as RED/overdue/at-risk, do not escalate to Alton as urgent without first asking "is this already done?" The `personal-data-gather` pipeline reads Gmail and Google Calendar; it cannot see:

- Paper checks (postmarked, in the mail)
- In-person meetings (Lucent Solar engineer Thursday 2026-04-30)
- Phone calls (vendor confirmations, follow-ups)
- Verbal commitments captured in Alton's head but not written
- SMS/iMessage threads
- Portal-only updates (CAQH, AZ HR W-2, Tribeca Pediatrics, Summit Health)

**Why:** On 2026-05-02, the family-thread dossier's first dashboard pass flagged 9 RED items. Alton's first reaction surfaced 4 resolutions invisible to the pipeline — Wohelo $12,900 check in the mail, 185 Davis $2,253 check in the mail, Lucent Solar engineer met (start date 1 month out, check-in Monday), Bill the heating guy paid by paper check. None of these were findable in Gmail/Calendar. Without the ASK, the dashboard would have generated false-urgency anxiety and consumed Alton's time relitigating closed items.

**How to apply:**

1. Before flagging a money-decision or vendor-action as RED/urgent in user-facing output, scan for whether it's the kind of thing that resolves out-of-band:
   - Vendors who prefer paper checks (Bill the heating guy, Wohelo Camps, condo assessments to property managers, contractors who don't email)
   - Items requiring in-person/phone action (Lucent Solar engineering meetings, CPA conversations)
   - Anything routed through portals the pipeline can't read (CAQH, Magnus Health, Summit Health, AZ HR)
2. Phrase the surface as: "Dashboard shows X overdue — is this still open or already in the mail?" not "X is overdue, you must act today."
3. When Alton confirms an out-of-band resolution, immediately persist it to `family/active-todos.md` as a dated `## YYYY-MM-DD Alton check-in — out-of-band resolutions` block (matches the 2026-04-16 triage style). This prevents the next gather run from re-flagging it.
4. Build up `family/PAPER-CHECK-VENDORS.md` over time as a reference list of vendors who only resolve out-of-band, so future dashboards can pre-filter or pre-soften the flag for those.

**Vendors confirmed as paper-check-only (as of 2026-05-02):**
- Bill (heating, contact unknown to memory) — preferred
- Wohelo Camps — confirmed via Heidi Gorton instructions 2026-04-13
- 185 Davis Condo Board (conduit: Charlotte Rice, charlotterice@gmail.com) — confirmed 2026-05-02 lump-sum check mailed for FY26 assessment + retaining wall

(Add to this list as we learn more. Canonical reference: [[family/PAPER-CHECK-VENDORS]].)

**See also:** [[feedback/gather-respects-out-of-band-closures]] — the pipeline-side complement to this rule. This file tells *Claude* to ASK before escalating; that file tells the AUTOMATED `personal-data-gather` skill not to RE-EMIT closed items on the next run. Together they close both halves of the loop.
