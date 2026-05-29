---
name: vastai-pricing-strategy
description: Sartor's stated preference for vast.ai listing strategy — short-term rentals first while gauging demand at various price points, then commit to longer terms once price discovery is done. Cited 2026-05-03 by Alton.
type: project
created: 2026-05-03
updated: 2026-05-28
status: active
tags: [business/vastai, business/solar-inference, strategy]
related:
  - business/solar-inference
  - projects/rtxserver-vastai-watch
  - .claude/skills/vastai-market-scan/SKILL.md
  - .claude/skills/gpu-pricing-optimizer/SKILL.md
---

# Vast.ai pricing strategy — short-term first

## Stated preference (Alton, 2026-05-03)

> "I may want short term rentals at first while we gauge demand for various prices."

**How to apply:** When listing a new Sartor host on vast.ai (or relisting after expiry), default to **on-demand pricing only** for the first listing window. Don't lock in long-term reserved contracts on day one. Use the first 2-4 weeks to:

1. Publish at a candidate target price (the validated market median from `vastai-market-scan`).
2. Watch rental fill rate, time-to-first-rental, and renter behavior.
3. If fill rate is high → consider a small price raise. The host-side action is a listing-update via `vastai list machine <id> -g <new>` (or web UI). Existing renters receive a "price increase challenge" email from vast.ai; they accept via the platform's web UI (renter side, not host CLI). No `vastai accept` CLI verb exists.
4. If fill rate is zero → drop price 10-20% and watch again.
5. Only after 2-4 weeks of rental data should we consider a long-term reserved contract (which locks in a specific renter at a discount).

**Why:** Locking long-term too early with insufficient data means we under-price (gpuserver1's 5090 reserved contract C.34113802 at ~$0.20/hr realized is a case in point — the contract bought it at a long-term discount when list was $0.30; list is now $0.80, so the realized-vs-list gap has widened and we'd be capturing more on-demand if the machine weren't locked).

## Concrete rules

- **First listing of a new host:** on-demand only. No `-l` reservation, no special long-term flags.
- **First 2-4 weeks:** treat as price discovery. Adjust pricing based on fill rate, not feeling.
- **Only after price discovery:** consider reserved contracts (which lock in a specific big renter for months at a discount).
- **If a renter offers a long-term contract early:** evaluate against current on-demand-realized rate, not list price. If the discount is more than the realized-vs-list gap suggests, decline.

## Status by host

| Host | Listing | Strategy |
|---|---|---|
| gpuserver1 (RTX 5090) | $0.80 listed, currently under reserved C.34113802 (~$0.20/hr realized) through 2026-08-24. Listing expiry 2026-06-30. | Reserved through 8/24, then re-evaluate against fresh price-discovery on relist |
| rtxpro6000server (dual RTX PRO 6000 Blackwell, machine_id 124192) | LISTED, verified, RENTED on-demand as of 2026-05-28. Live list $1.10/GPU (approved $0.92/GPU — live-drift discrepancy, separate open decision). | In price-discovery window. Reconcile live $1.10 vs approved $0.92 with Alton; adjust per fill rate. |
| Future hosts | n/a | Same strategy applies |

## Related

- [[projects/rtxserver-vastai-watch]] — existing tracker; reflect this preference when listing fires
- [[reference/vastai-listing-flags]] — to be written: catalog of `vastai list machine` flags, especially `-l` (rolling) vs `-e` (fixed end-date) trade-off
