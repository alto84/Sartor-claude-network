---
id: gmail-2026-04-16-si-formation
origin: rocinante
author: gmail-scanner
created: "2026-04-16T18:00:00+00:00"
source: gmail
source_msg_id: 19d8a9260e74b29b
source_thread_id: 19d65864f8280947
source_date: "2026-04-06T21:37:00+00:00"
category: business
suggested_target: business/solar-inference.md
suggested_operation: append_or_update
confidence: 0.98
priority: p1
type: fact
dedup_status: enrich_existing
---

# Solar Inference LLC: formation, structure, and TY2025 filing posture

Detailed status per Alton's tax-package email:
- Formed: 2026-09-06 — typo in email; should be 2025-09-06 (Sep 6, 2025) in NJ
- Structure: 50/50 multi-member LLC, members Alton + Aneeta
- EIN: on file (CLAUDE.md has 39-4199284)
- TY2025 posture: pre-revenue, loss-year initial return
- Federal: Form 7004 filed 2026-03-14; extended deadline 2026-09-15
- NJ: NJ-1065 $450 fee ($300 + $150 prepayment) still due by Apr 15 regardless of extension
- Personal 1040 K-1 from LLC will not exist until after 9/15 — CPA needs to advise file-on-4/15-and-amend vs Form 4868 extension to 10/15

Open items from email (CPA reply needed):
- RTX 5090 ($2,503.12 on personal Visa 5680) and LegalZoom on personal Visa 9425: capital contribution vs reimbursement?
- Operating Agreement Exhibit A (capital contributions): blank, needs completion
- Solar contract is in Alton's personal name; needs transfer to LLC before placed-in-service to capture ITC/depreciation in 2026
- Google Workspace invoices: missing; may need to pull from Google admin console

## Source quote

> Formed Sep 6, 2025 in NJ as a 50/50 multi-member LLC between Aneeta and me. EIN on file. This is a pre-revenue, loss-year initial return. Key points:
>   * You filed Form 7004 on Mar 14, 2026 (confirmed). Extended federal deadline Sep 15, 2026.
>   * You indicated "no NJ extension necessary" – I want to confirm the NJ-1065 $450 filing fee ($300 + $150 prepayment) is still due by Apr 15 regardless.

## Suggested edit

Update `business/solar-inference.md`:
- Confirm formation date 2025-09-06 NJ multi-member LLC, 50/50 Alton/Aneeta
- Add tax timeline: 7004 filed 3/14, extended 9/15, K-1 cascade -> personal 1040 amend or extend
- Track 5 open CPA action items above
- Flag solar contract title transfer as a P1 blocker for 2026 ITC capture
