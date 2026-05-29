---
type: matter
matter: registered-agent-nj-standing
status: open
risk: high
priority: p1
opened: 2026-05-28
updated: 2026-05-28
last_action: 2026-05-28
deadline: 2026-09-06   # NJ annual report (formation anniversary); RA confirmation sooner
authority: []
related: [BUSINESS, business/solar-inference, solar-itc-48-vs-25d, TAXES]
---

# Matter: Solar Inference LLC registered agent + NJ good standing after LegalZoom cancellation

## Issue

LegalZoom's **State Compliance Filings** subscription was canceled 2026-04-05. If LegalZoom was the
registered agent (common with their compliance package), Solar Inference LLC may now have **no valid
registered agent of record** with NJ DORES — risking administrative revocation, which would strip
liability protection and could invalidate the LLC's standing to **own the solar asset**, directly
undermining the §48E ITC posture (which requires the LLC to own/use the property). Surfaced by the
2026-05-28 audit completeness pass (VERIFICATION.md T2).

## Facts

- LegalZoom State Compliance canceled 2026-04-05; solar-inference.md notes "Alton must track NJ
  compliance manually going forward."
- NJ Entity ID 0451339243, EIN 39-4199284, formed 2025-09-06.
- A Treasury "appointment as registered agent" doc exists from Sept 2025, but no confirmation of who
  the agent is post-cancellation.
- NJ LLCs owe a **$75 annual report** on the formation anniversary (~Sept 6); first one due ~Sept 2026,
  no longer an automated LegalZoom reminder. (Distinct from the NJ-1065 $450 partnership fee.)

## Analysis

A lapsed RA + unfiled annual report → NJ administrative revocation, which (a) strips liability
protection for the lapse period, (b) can invalidate the LLC's capacity to own the solar asset (the
load-bearing fact for the entire ~$32–86K ITC + bonus-depreciation strategy), and (c) means a lawsuit
or tax notice served on the stale agent is never received.

## Action items

- [ ] Pull current NJ DORES business status for Entity 0451339243 (state portal) — confirm RA of record
      + good-standing status.
- [ ] If LegalZoom was the RA, appoint a replacement immediately (Alton at 85 Stonebridge, or a paid
      commercial agent).
- [ ] Calendar the **Sept 6 NJ annual report ($75)** as a recurring task (LegalZoom reminders are gone).

## CPA / counsel routing

- Mostly a self-service NJ DORES action; flag to JF as load-bearing on the ITC ownership posture.

## History

- 2026-05-28: Opened from the fleet-ledger audit completeness pass (VERIFICATION.md T2).

## Resolution

(pending)
