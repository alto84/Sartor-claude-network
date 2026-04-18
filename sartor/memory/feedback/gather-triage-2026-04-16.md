---
name: gather-triage-2026-04-16
description: Pre-filter rules for Gmail/Calendar gather runs — unsubscribes + recruiter filter + declined-opportunity list as of 2026-04-16
type: feedback
updated: 2026-04-16
tags: [feedback, gather, noise-filter]
originSessionId: d920f507-391d-4d21-9a8c-dce4bbe1c2fe
---
# Gather triage — 2026-04-16

**Rule:** When running personal-data gather (Gmail + Calendar → active-todos), pre-filter these sources before surfacing items. Do not re-propose items Alton has already declined.

**Why:** On 2026-04-16 Alton triaged a backlog of gather-surfaced todos and explicitly declined a set of recurring noise sources. Resurfacing them wastes review cycles and dilutes the list's signal value. AZ in-office cadence + family load + two parallel product initiatives currently saturates available advisory capacity.

**How to apply:**

1. **Unsubscribed / suppress entirely:**
   - M3 Global Research daily neurology surveys (`surveys.usa@m3globalresearch.com`)
   - Handshake AI "Project Alloy" and related Handshake fellow-support pings (`fellow-support@joinhandshake.com`) — current capacity constraint, not a permanent no
   - Generic LinkedIn Job Alerts (the scheduled "N new jobs match your search" digests)
   - Ladders recruiter feeds
   - Routine recruiter cold-emails for pharma-safety roles (Regeneron GPS Lead, Catalyst Medical Info Director, Weltrio Medical Director, Enzo Tech AI Director, Jobgether / RemoteHunter aggregator emails, etc.)

2. **Recruiter filter — only surface if AI-related.** Signal criteria (at least one):
   - AI-native drug development or AI safety role
   - Chief Safety Officer or safety-adjacent leadership at an AI company or frontier lab (OpenAI, Anthropic, Google DeepMind, Scale AI, Cohere, etc.)
   - Product-executive role where AI is the core product (e.g. City of Hope Executive Director Technology & AI Products was an acceptable surface — this kind)
   - Direct InMail or named-recruiter outreach from a founder / senior operator (not a bulk aggregator)
   - Explicit AI ethics, red-teaming, alignment, or evaluations role

   Drop: pure pharma pharmacovigilance / drug-safety director / VP medical roles without an AI component, even if compensation is in-band ($300K+).

3. **Advisory / consulting:** Guidepoint threads currently live stay on the list (accept/decline status pending per request). Zintro Z198433 still live. Do not add new generic expert-network pings to the list unless they target AI safety, oncology clinical trials, or rare-disease drug development (Alton's actual specialist lanes).

4. **SNO 2026:** DECLINED — both Clinical Trials Workshop (5/15 app) and Annual Meeting abstract submission (11/12–11/15 Philadelphia). Do not re-surface from SNO digest emails.

5. **Escalation exception:** If a suppressed source sends something materially unusual (e.g., a frontier AI lab directly recruiting for a C-suite safety role, or an M3 study with a $500+/hr rate tied to AI safety in pharma specifically), still surface it and flag as "suppressed-source exception."

**When to revisit:** Weekly during the Sunday active-todos review, or whenever Alton signals capacity has changed (e.g., a major initiative completes, kids' schedules shift, AZ role scope changes).
