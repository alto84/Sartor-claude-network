---
created: 2026-05-26
updated: 2026-05-26
status: active
tags: [business/vastai, business/solar-inference, pricing]
---

# Rental Fleet Pricing Audit — 2026-05-26

## Data snapshot

- RTX 5090 market (verified+rentable): 59 listings
- RTX PRO 6000 WS market (all): 25 listings (15 single-GPU, 6 dual-GPU)
- High-VRAM >90GB filter: 0 results (RTX PRO 6000 not yet indexed in that facet)

---

## Host 1: gpuserver1 — RTX 5090 (machine 52271)

**Live listing:** `listed_gpu_cost: $0.80/hr` (not $0.30 as in CLAUDE.md — listing was raised at some point), `min_bid_price: $0.65/hr`. Note: CLAUDE.md says $0.40/$0.25; `vastai show machines` shows $0.80/$0.65. The reserved contract C.34113802 is earning $0.20/hr realized.

**Market position (59 verified+rentable RTX 5090s):**

| Percentile | $/hr |
|---|---|
| Min (P0) | $0.53 |
| P10 | $0.87 |
| P25 | $1.00 |
| Median (P50) | $1.60 |
| P75 | $3.20 |
| P90 | $8.43 |

At $0.80 listed, gpuserver1 sits at approximately the **3rd percentile** of the RTX 5090 market — only 4 of 59 listings are cheaper. The machine is aggressively underpriced on-demand.

**Reserved contract analysis:** The $0.20/hr realized rate is at the floor of the market — market minimum is $0.53/hr on-demand. The reserved contract locked in at a ~62% discount to the already-low list price. This is the worst-case outcome of the "locked long-term without price discovery" pattern documented in `vastai-pricing-strategy.md`.

**Recommendation: HOLD through 2026-08-24 (contract end), then raise substantially on relist.**

Post-contract target: $0.95-1.05/hr on-demand (P25 of current market), $0.75/hr interruptible floor. This is a 19-31% premium over current list and ~4-5x the reserved realized rate. Projected utilization impact: at P25 pricing, the machine competes with the cheapest quarter of RTX 5090s — strong fill rate expected. Do not relist at $0.30 or $0.40.

---

## Host 2: rtxserver — RTX PRO 6000 WS x2 (machine 124192)

**Live listing:** `listed_gpu_cost: $1.20/hr per GPU`, total `$2.40/hr` for the 2-GPU required minimum (`listed_min_gpu_count: 2`). Interruptible floor: `$0.85/hr per GPU` ($1.70/hr total). Score: 130.2, reliability: 0.964.

**Market position — single-GPU RTX PRO 6000 WS (15 listings):**

| Percentile | $/hr |
|---|---|
| Min | $1.20 |
| Median | $1.33 |
| Max | $1.87 |

**Market position — dual-GPU listings (6 listings, per-GPU equivalent):**

| Machine | Total $/hr | Per-GPU equiv | Score |
|---|---|---|---|
| 37777 | $2.64 | $1.32 | 228.9 |
| 41278 | $2.80 | $1.40 | 193.8 |
| 50938 | $2.93 | $1.47 | 146.1 |
| **124192 (rtxserver)** | **$3.20** | **$1.60** | **130.2** |
| 5150 | $3.74 | $1.87 | 262.9 |

**Why isn't rtxserver renting — root cause is all three factors:**

1. **Pricing too high for its score.** At $3.20/hr total, rtxserver is the most expensive dual-GPU listing except machine 5150 (which has a higher score of 262.9). rtxserver's score of 130.2 is the lowest of the dual-GPU cohort. Renters sorting by score-per-dollar see rtxserver last.

2. **Thin niche market.** Only 25 RTX PRO 6000 WS listings total on the entire platform. This is a specialized card — renters needing 96GB VRAM know it exists, but the renter pool is small. Low absolute demand even if priced right.

3. **First-rental friction.** A score of 130.2 with reliability 0.964 is acceptable but not competitive. The score partially reflects rental history — machines with zero completed rentals don't build reliability score, which depresses score, which suppresses search ranking, which prevents first rental. A self-reinforcing cold-start problem.

**Recommendation: Lower to $1.00/hr per GPU ($2.00/hr total), floor $0.75/hr ($1.50/hr total).**

This puts rtxserver at $2.00/hr — below all competing dual-GPU listings. Aggressive entry pricing to capture the first rental and build score. The per-GPU rate of $1.00 aligns with the RTX PRO 6000 single-GPU market minimum. Even at $2.00/hr total with 720 hours/month, that's $1,440/month vs $0 currently. After first rental completes and score improves, raise back toward $1.20/GPU ($2.40/hr total). Projected utilization at $2.00/hr: high, given price leadership position. Projected utilization at $1.20/GPU: near-zero (observed outcome).

---

## Rig 3: Single RTX 5090 (AM5 9950X platform, inbound June 2026)

**Recommendation: List at $0.95/hr on-demand, $0.70/hr interruptible floor. On-demand only for first 3 weeks.**

Rationale: P25 of the current RTX 5090 market is $1.00/hr. Launching just below that gives Rig 3 a price-leadership position without bottom-feeding. The AM5 platform may have slightly higher CPU scores than gpuserver1 (i9-14900K) given the 9950X's newer architecture; score will reveal itself after verification.

Do not undercut gpuserver1's post-relist pricing — parallel fleet listings should not cannibalize each other. If both 5090s are live simultaneously, maintain $0.05-0.10 separation and watch fill rates independently.

Do not use a reserved contract or long-term listing flag at launch. On-demand only, fixed end-date 3 months out. Re-evaluate at 3-week mark per `vastai-pricing-strategy.md`.

---

## Should pricing rules be codified?

Yes. `sartor/memory/business/vastai-pricing-strategy.md` exists but covers only the short-term-first heuristic. Missing:

- Percentile targets by card class (RTX 5090 at P25, PRO 6000 at market minimum for cold start)
- Score-adjusted pricing rule (lower score = require price discount vs. market median)
- Fleet cannibalization rule (minimum spread between parallel same-class listings)
- Post-first-rental raise trigger (raise 10-15% after 168h completed rental)

Recommend extending `vastai-pricing-strategy.md` with these four rules as a standing section. No new file needed.

---

## Live listing discrepancy note

CLAUDE.md and agent system prompt both state gpuserver1 list price as $0.30/$0.40 on-demand. `vastai show machines --raw` shows `listed_gpu_cost: 0.8` and `min_bid_price: 0.65`. CLAUDE.md needs a truth-up. The $0.20/hr reserved realized rate is consistent with a long-term discount contract off a higher base, not off $0.30.
