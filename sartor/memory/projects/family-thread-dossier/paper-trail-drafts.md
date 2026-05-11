---
entity: paper-trail-drafts
type: artifact
date: 2026-05-02
updated: 2026-05-02
updated_by: family-curator (family-thread, Opus 4.7 1M context, alton-voice skill loaded)
status: draft-pending-alton-review
priority: p1
volatility: high
purpose: Pre-drafted vendor confirmation emails so Alton can copy-paste into Gmail. Each closes a paper-check loop the gather pipeline cannot see, which prevents the Mon morning gather run from re-flagging these as overdue.
related: [family/PAPER-CHECK-VENDORS, family/active-todos, feedback/paper-checks-blindspot, feedback/gather-respects-out-of-band-closures, projects/family-thread-dossier/family-dashboard-2026-05-02]
voice_register: register-2 (professional logistics) — clause-stacking allowed, parenthetical for date specificity, NO "I'm thrilled" / NO "I hope this email finds you well" / NO emojis. Matches the tone of Alton's prior 1-line confirms (e.g., "Got it — please proceed" to JF on 2026-04-14).
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Paper-trail email drafts — 2026-05-02

Three short logistics emails to create inbox paper trail for the 3 paper checks Alton mailed today. Each is 2-3 sentences. Subject + body only — no signature (Alton has his own).

**Why this batch matters:** without these, the next `personal-data-gather` run (Mon ~6 AM ET) will re-flag Wohelo, 185 Davis, and Lucent as RED/overdue/at-risk because the originating Gmail threads have no visible closure. See [[feedback/gather-respects-out-of-band-closures]] for the deeper structural fix; these emails are the cheap immediate workaround.

**Voice notes:** drafts use register-2 (professional logistics) per the `alton-voice` skill — terse, direct, clause-stacked, parenthetical date for specificity, no warmth-flourish, no exec-template polish. Compared to true register-2 cover-letter style, these are even shorter because they are vendor confirmations rather than introductions.

---

## 1. Heidi Gorton — Wohelo Camps

**To:** heidigorton@gmail.com
**Cc:** (consider Aneeta — aneetasax@gmail.com — since Vishala camp logistics)
**Subject:** Wohelo full tuition — check mailed today

**Body:**

Hi Heidi,

Quick confirm — the full $12,900 tuition check (payable to Wohelo Camps, mailed to 25 Gulick Road, Raymond, ME 04071) went out today, so you should see it land within the next few days. Vishala is excited.

Best,
Alton

**Why this email:** closes the 2026-05-15 deadline thread in your inbox. Without a visible confirmation reply, Monday's gather will see Heidi's Apr 13 instructions thread with no payment-confirm and re-flag Wohelo as `[!warning]` IMMINENT. Heidi is also the camp director, so a courtesy heads-up is appropriate.

---

## 2. Charlotte Rice — 185 Davis Condo Board

**To:** charlotterice@gmail.com
**Cc:** (consider the rest of the assessment thread recipients — reply-all to her Apr 27 message preserves the audit trail for the other unit owners)
**Subject:** 185 Davis assessment — lump sum check mailed

**Body:**

Hi Charlotte,

Confirming we went with the lump-sum option — the $2,253.13 check went out today, so you should see it shortly. Happy to vote on the boiler expansion tank by the May 15 form deadline once I've had a chance to look it over.

Thanks,
Alton

**Why this email:** closes the Apr 27 assessment thread (yesterday's overdue), AND signals you're tracking the May 15 boiler-tank vote so it doesn't surprise you. Reply-all to Charlotte's original message keeps the rest of the unit owners visible to the same paper trail.

---

## 3. Niko Markanovic — Lucent Energy

**To:** Niko@lucent-energy.com (note: hyphenated domain — `lucent-energy.com`, not `lucentenergy.com` as initially recalled)
**Cc:** doug.paige@lucent-energy.com, audrey.vera@lucent-energy.com (full thread participants per the Apr 13 email)
**Subject:** 85 Stonebridge install — confirming early-June start, check-in Mon 5/05

**Body:**

Niko,

Per our 4/30 walkthrough, confirming the install start is approximately one month out (~early June) and we'll touch base again Monday 5/05 to lock in the date. Given the July 4 ITC deadline, I want to make sure we have a firm in-service date with enough margin to handle the inspection and PTO sequence. Please flag anything on your end that could move that target.

Thanks,
Alton

**Why this email:** the Niko/Doug/Audrey Apr 13–17 thread shows no confirmation back, so Monday's gather will re-fire the `[!blocker]` with the $131K ITC framing. This email puts the 4/30 in-person meeting on the record, names Mon 5/05 as the next check-in, AND surfaces the ITC-deadline pressure to Lucent so they treat the install schedule with the urgency it deserves. The "please flag anything that could move that target" line is structurally important — it shifts the burden of bad news to them.

---

## Notes for Alton

- Each email is consciously short. The clause-stacking and parenthetical date are register-2 markers; resist the urge to add "I hope this email finds you well" or "Looking forward to your reply" — that's not your voice in this register.
- Niko's email is `Niko@lucent-energy.com` (hyphen). The team-lead's instruction had an unhyphenated guess; the active-todos source (line 750) is authoritative.
- All three are safe to send today (Saturday 2026-05-02) — they don't need a response, they just create the paper trail.
- After sending, the gather pipeline will see the outbound thread on Mon morning and treat the items as in-progress / closed rather than re-firing them from the original deadline emails.
- Bill the heating guy is intentionally NOT in this set — he's been paid in person and prefers paper. The vendor file ([[family/PAPER-CHECK-VENDORS]]) captured what we know about him so future Claude doesn't relitigate.

## History

- 2026-05-02 — Drafted by family-curator at team-lead's instruction (auto-mode pre-draft, Alton review pending). `alton-voice` skill loaded; register-2 selected. Saved here rather than directly to Gmail Drafts because Alton may want to write some himself or skip some entirely.
