# rtxserver listing — pricing decision for your review

**Filed:** 2026-05-26 (afternoon, while you were away)
**Status:** Awaiting your call. I did NOT drop the price autonomously.

## TL;DR

Background research strongly recommends $2.67/hr → **$2.50/hr** ($1.00/GPU → $0.92/GPU) to capture the first-rental event. Per saved feedback, pricing changes need fresh approval from you. The watcher is running unchanged at $2.67/hr.

## What I found

Reading the full report at `sartor/memory/business/research/vastai-rtx-pro-6000-context-2026-05-26.md`:

- **Vast.ai autosort weighting is documented as price → internet → reliability → DLPerf.** We don't have a way to overcome the internet handicap (885 Mbps vs Czech leader 6.3 Gbps = 7× gap) without a Fios circuit upgrade.
- **Single-cent move shifts 3 autosort positions** (community knowledge). $2.50/hr undercuts Czech ($2.53) by 1 cent at the bundle level, putting us P0 on price-sort.
- **Our score 156 vs Czech 313 reflects cold-start (zero rental history), not machine quality.** Score climbs 50-100 points after a couple completed rentals. Hence "capture first rental at any cost" logic.
- **We are the only US dual-GPU RTX PRO 6000 WS verified+rentable listing.** A real moat for US-latency-sensitive 70B-inference renters; underexploited at current visibility.

## Why I held the line

Memory `feedback_vastai_troubleshooting.md`: "Pricing changes and destructive actions still do [need fresh approval]." You authored that as durable guardrail. Today you already moved $3.20 → $2.67; moving again to $2.50 on the same day, without you present, exceeds the latitude that feedback grants me. The "make it happen / work independently" instruction was about operational tending, not about authorizing a second pricing call within hours.

## EV math (if helpful)

- $2.67/hr × 8h waiting window: $0 (probably idle) vs ~$21 (if rented at $2.67) — but probability of rental within 8h is low per autosort analysis.
- $2.50/hr × 8h: probably captures first rental ($20 in 8h, then score climbs and we raise) — but I can't predict timing.
- Marginal $/hr loss of dropping: $0.17 × 24h = $4.08/day. Small relative to expected first-rental capture.

So mathematically the drop is +EV. I'm holding because the guardrail is structural, not because the math is wrong.

## What I'd recommend you do

When you check back in:
1. Read the full research file (linked above) — 800 words, 8 minutes.
2. Decide on price. If you authorize $2.50/hr, the command is:
   ```bash
   ssh alton@gpuserver1 '~/.local/bin/vastai list machine 124192 -g 0.92 -m 1 -e "10/24/2026"'
   ```
   (the `-g 0.92` sets per-GPU on-demand; storage/inet/expiry preserved)
3. Or stick at $2.67 and accept slower first-rental window.

## What's running unchanged

- Watcher: `scripts/rental-watch.py` polling every 60s, 12h cap, writes inbox alert on detection
- Listing: $2.67/hr ($1.00/GPU), `verified`, `rentable`, `error_description=None`
- Host: kaalia healthy, GPUs idle 30°C, all ports forwarded

## Other research recommendations (not pricing)

- Add free-text "US East Coast, low-latency" framing to listing — pending verification of whether vastai exposes this field
- Don't raise power cap to 600W — thermal pathology risk on this chassis
- Don't go reserved-contract for ≥4 weeks — gpuserver1 C.34113802 cautionary tale
- Watch `error_description` daily — sticky-error has hit twice
- Long-term: Verizon Fios upgrade is the only structural fix for the internet handicap

## Final note

The research agent's full report is more useful than this summary. It also has insights about renter workloads (70B FP8 inference is the killer use case, matches the C.37359460 renter) and market depth (only 11 dual-GPU listings globally for this card — a thin market).
