---
name: always-check-paper-check-vendors-before-flagging-red
description: Before emitting a [!warning] or [!deadline] callout for any money item in family/active-todos.md or a family dashboard, grep family/PAPER-CHECK-VENDORS.md for the recipient. If the vendor is on the list, soften the callout to a [!todo] with explicit "paper-check vendor; confirm out-of-band before escalating" framing. Closes the loop between the human-facing ask-rule (paper-checks-blindspot) and the pipeline-facing don't-resurrect rule (gather-respects-out-of-band-closures).
type: feedback
date: 2026-05-02
updated: 2026-05-02
updated_by: family-curator (family-thread, Opus 4.7 1M context)
status: active
priority: p1
tags: [domain/family, household/finance, pipeline/personal-data-gather, behavior/dashboard, behavior/escalation]
related: [feedback/paper-checks-blindspot, feedback/gather-respects-out-of-band-closures, feedback/intake-protocol, family/PAPER-CHECK-VENDORS, family/active-todos, family-todos-longrunning-thread, projects/family-thread-dossier/family-dashboard-2026-05-02]
proposed_relocation: feedback/family/ (when memory-improvement-program v0.2 §A6 directory-split lands)
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Always check paper-check vendors before flagging RED

**Rule.** Before generating a `[!warning]`, `[!deadline]`, or `[!blocker]` callout for any money-flow item — payment due, invoice unpaid, vendor unconfirmed — grep `family/PAPER-CHECK-VENDORS.md` for the recipient name (vendor, contact person, organization). If the recipient is on that list, **do not emit a RED-style callout**. Instead emit a softened `[!todo]`:

```
> [!todo] PAPER-CHECK VENDOR — confirm out-of-band before escalating
> {item description, dollar amount, deadline} — recipient {Name} is on the paper-check vendor list ([[family/PAPER-CHECK-VENDORS]]).
> The originating Gmail/Calendar signal cannot see paper checks, in-person handoffs, or phone confirmations.
> Ask Alton "is this already in the mail?" before treating as overdue. If genuinely new (e.g., new invoice for an existing vendor), confirm explicitly with Alton, not via inferred from absence of email reply.
```

**Why.** On 2026-05-02, the family-thread first dashboard pass flagged 9 RED items. Alton's out-of-band check-in surfaced 4 already-closed items the gather pipeline could not see — Wohelo $12,900 paper check, 185 Davis $2,253.13 paper check, Bill the heating-guy paper check, Lucent Solar in-person engineering meeting. None had Gmail or Calendar artifacts. The pipeline emitting them as RED wasted Alton's attention and forced him to relitigate closures. Three of those four recipients (Wohelo, 185 Davis, Bill) are now on `family/PAPER-CHECK-VENDORS.md`. The structural fix is to consult that file BEFORE emitting RED, not after Alton corrects the mistake.

**How to apply (per gather run, per dashboard generation, per any RED-flag emission):**

1. **Identify the recipient** in the source signal. Vendor name (Wohelo Camps, 185 Davis Condo Board), contact person (Heidi Gorton, Charlotte Rice, Bill), or organization (Bloomfield-Montclair CSA). Capture the exact strings present in the source email or calendar event.
2. **Grep `family/PAPER-CHECK-VENDORS.md`** for those strings. Match on vendor name, contact name, AND any aliases listed in the row.
3. **If hit:** soften per the template above. Do NOT emit `[!warning]` / `[!deadline]` / `[!blocker]`. The downgrade is structural; do not reverse it on the basis of "but the deadline IS overdue" — the rule's premise is that the deadline-vs-paid status cannot be inferred from email signal for these vendors.
4. **If miss:** proceed with the normal callout severity. The vendor list is allowlist semantics for softening; absence from the list is not a positive signal of payment status, just a signal that gather can probably see whether it's paid.
5. **When Alton confirms a new vendor as paper-check-only:** add a row to `family/PAPER-CHECK-VENDORS.md` (per its "How to update" section) AND, if there's an active item from that vendor in `family/active-todos.md`, retroactively soften it.
6. **When the deadline genuinely matters and the vendor is on the list:** route the urgency to a "please confirm" question to Alton, not a RED escalation. Example: "Charlotte Rice's 185 Davis assessment was due May 1 (3 days ago). She's on the paper-check vendor list — is the lump-sum check already mailed, or do we need to send it?"

**Specific patterns to catch:**

- A `[!deadline] YYYY-MM-DD` callout for a vendor that is on the list — soften.
- A "X is OVERDUE" line in a dashboard's RED bucket where the recipient is on the list — move to YELLOW with the soften-template.
- A `[!warning] URGENT` in the daily morning briefing for a paper-check vendor — replace with the soften-template.
- A "no payment-confirmation email found" reasoning chain that ends in RED — for paper-check vendors, "no payment-confirmation email found" is the EXPECTED state, not evidence of unpaid status. Stop reasoning from the absence.

**Edge cases:**

- **NEW invoice from an existing paper-check vendor.** A fresh email from Charlotte Rice about, say, the June 30 fuel-cost overage IS legitimately a new item even though Charlotte is on the vendor list. Emit it as a `[!todo]` with the soften-template AND a `NEW THIS CYCLE` flag. Do NOT pre-soften based on the assumption that prior cycles were paid; only the most recent confirmation is authoritative.
- **Vendor on the list but the contact person changes.** Treat as new vendor row pending confirmation. Don't auto-soften.
- **Recipient has both paper-check AND digital options** (e.g., Pool Guyz LLC offers Zelle but accepts paper too). NOT on the paper-check vendor list because the digital channel produces visible signal. Pool Guyz, in particular, is explicitly excluded from the file (see "Vendors NOT in this file" section). If Alton ever pays Pool Guyz by paper, escalate to an Alton-decision about adding them — don't auto-add.
- **Vendor on the list but invoice amount has changed dramatically.** Worth flagging as a `[!warning] AMOUNT-DELTA` even after softening — anomalous amounts from known vendors can indicate fraud, billing errors, or scope changes that warrant attention even when the payment method is paper.

**Relation to sibling rules:**

This rule is the **per-emission allowlist check** that operationalizes the broader pair:
- [[feedback/paper-checks-blindspot]] — human-facing rule: "ASK Alton before escalating to RED."
- [[feedback/gather-respects-out-of-band-closures]] — pipeline-facing rule: "don't re-emit items already marked CLOSED in active-todos.md."
- **This rule** — pre-emission rule: "before EMITTING in the first place, check the vendor list." It runs earlier in the pipeline than the closure-respect rule and prevents most of the false-RED emissions before they happen.

Three rules, three points in the loop:
1. **Pre-emission** (this rule) — vendor allowlist softens before the callout is written.
2. **Re-emission** ([[feedback/gather-respects-out-of-band-closures]]) — closed items don't re-fire.
3. **Human escalation** ([[feedback/paper-checks-blindspot]]) — when a callout has slipped through, ASK before pushing the RED to Alton.

If all three fire correctly, paper-check vendors generate ZERO false-RED noise.

**Operational note:** This file currently lives in `feedback/` (root). Per memory-improvement-program v0.2 §A6 directory-split, it is queued for relocation to `feedback/family/` once that work lands. Leaving in root preserves auto-injection on every session until the bucketed-injection mechanism replaces it.

## History

- 2026-05-02 — Created by family-curator at team-lead's instruction during family-thread session. Greenlit explicitly by team-lead after family-curator surfaced the gap between paper-checks-blindspot (human-facing ASK rule) and gather-respects-out-of-band-closures (pipeline-side don't-resurrect rule). This rule fills the pre-emission third slot. Vendor allowlist initial entries: Bill (heating), Wohelo Camps, 185 Davis Condo Board.
