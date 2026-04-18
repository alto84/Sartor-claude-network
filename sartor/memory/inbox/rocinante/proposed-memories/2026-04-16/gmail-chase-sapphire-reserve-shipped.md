---
id: gmail-2026-04-16-csr-shipped
origin: rocinante
author: gmail-scanner
created: "2026-04-16T18:00:00+00:00"
source: gmail
source_msg_id: 19d89e2d8f856079
source_date: "2026-04-13T20:47:17-06:00"
category: financial
suggested_target: ALTON.md
suggested_operation: append
confidence: 0.95
priority: p3
type: fact
dedup_status: new
---

# New Chase Sapphire Reserve card shipped (2026-04-13)

Chase notification 2026-04-13: replacement/new Chase Sapphire Reserve card shipped. Likely related to the 2026-04-13 fraud-alert event on Sapphire account ending 9425 ("Action Needed: Please confirm this transaction" — msg 19d848377fdca8c6).

Pattern suggests fraud-triggered card reissue rather than new account opening.

## Suggested edit

Add to `ALTON.md` accounts section:
- Chase Sapphire Reserve card reissued April 2026 (fraud-trigger likely)
- Update any auto-pay records using the old card number
