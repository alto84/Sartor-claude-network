---
type: research-note
date: 2026-05-26
author: research-agent
scope: vast.ai market context for machine 124192 (dual RTX PRO 6000 WS, New Jersey US)
tags: [business/vastai, business/solar-inference, gpu-rental, rtx-pro-6000, market-research]
related:
  - business/vastai-pricing-strategy
  - projects/rental-ops-audit-2026-05-26/pricing-findings
  - .claude/skills/vastai-market-scan/SKILL.md
---

# RTX PRO 6000 Blackwell on vast.ai — operational context for machine 124192

Snapshot taken 2026-05-26 from live `vastai search offers` + vast.ai docs + external benchmarks.

## TL;DR

Our $2.67/hr listing is the **2nd cheapest** dual-GPU RTX PRO 6000 WS on the platform and the **only US listing** in the dual-GPU rentable cohort. The primary headwind is not price-against-Czechia; it is **autosort weighting** (price > internet > reliability > DLPerf, per vast.ai's own documentation), and our `inet_down=885 Mbps / inet_up=899 Mbps` is materially below 5 of 6 dual-GPU competitors (Czech leader 6,318/6,677 Mbps, two Canadian listings 2,800-4,000 Mbps). A second-order issue is our score of 130-166 reflecting zero-rental-history cold start; the Czech leader is at 313.

The renter we're losing is the price-sensitive autosort-default buyer. The renter we should be winning is the US-latency-sensitive 70B-FP8 inference operator and the dual-GPU 70B-FP16 fine-tuning operator, neither of whom has any cheaper US alternative right now.

---

## 1. Renter demand for RTX PRO 6000 Blackwell WS — what workloads buy this card

The 96 GB single-GPU / 192 GB dual-GPU memory pool is the entire value proposition. From the benchmarks and product positioning literature:

- **70B FP8 single-GPU inference** is the killer use case. 70B at FP8 fits in 96GB with ~26GB free for KV cache → serves **13-26 concurrent users** without multi-GPU sharding (Spheron, CloudRift, VRLA Tech benchmarks). This is the workload that previously required an H100 80GB (and even H100 leaves less KV headroom for 70B FP8).
- **70B FP16 inference / fine-tuning** needs 192 GB → dual-GPU only. Our 2-GPU bundle is the entry point for serious 70B work without going to H200 (141 GB) or multi-H100.
- **Full-parameter 7B fine-tuning at FP16** — only single-desktop-class GPU that can do this at full precision (VRLA Tech). LoRA/QLoRA on 70B is comfortable on a single card; full fine-tune on 70B comfortably wants the dual.
- **Local RAG-plus-inference stacks** — vector search, embedding model, and a 70B LLM colocated on one card. Small teams (10-20 users) running self-hosted LLM endpoints to escape OpenAI/Anthropic spend.
- **Video generation models** (Wan, HunyuanVideo, CogVideoX) — these are pushing past 48 GB. 96 GB single, 192 GB dual is comfortable headroom.
- **Scientific computing / molecular dynamics / DFT** — quietly growing; FP64 not as strong as datacenter, but 96 GB unified memory wins for many simulations.

**Buyer profile** vs H100/H200 path: the buyer who picks PRO 6000 over H100 is usually (a) cost-sensitive — RTX PRO 6000 is ~$1-2/GPU/hr vs $2-3/GPU/hr H100 SXM and ~28% lower cost-per-token at single-GPU 70B (CloudRift), (b) constrained to non-CUDA-NVL clusters (no H100 NVLink switch), (c) running inference more than training. Buyer who picks H200 over PRO 6000 needs the 141 GB pool for >70B at FP16, or the 4.8 TB/s memory bandwidth for largest training runs.

The renter on our recently-ended C.37359460 was running vLLM — that is the modal workload for this card. Expect more of the same.

**Rental durations:** literature does not publish typical durations for this card class, but the inference-server use case is structurally long-tail (a serving endpoint stays up). The vLLM renter that just left would have been a candidate for multi-week stay if pricing had not driven them away.

## 2. Geographic positioning — does US East Coast give us an edge?

Yes, but narrowly. As of the snapshot we are the **only** verified+rentable dual-GPU RTX PRO 6000 WS in the US. The competing dual-GPU listings are: Czechia (×3), Quebec, Ontario, Alberta, Taiwan. For a US-located inference customer serving US users from us-east-1-equivalent, we are the only choice in this card class without going to a full datacenter provider (RunPod $2.09/GPU/hr, Hyperstack $1.80/GPU/hr — both compete with us, but those are H100/datacenter; for RTX PRO 6000 specifically, vast.ai is the platform).

Vast.ai search filters expose `geolocation` as a first-class facet. A renter who has tied US-located workload pinned (regulatory, data residency, latency to US-east users) and types `RTX_PRO_6000_WS geolocation~US` sees one listing: ours. That funnel exists; it is small but non-zero.

The Czech leader at $2.53/hr has a ~110ms RTT disadvantage to US-east users vs our ~10-20ms. For interactive inference (chat, agent loops, RAG) that's a real product-quality difference. We should mention "US East Coast, low-latency for US users" in our listing description if vast.ai exposes a free-text host description (it does — `geolocation` is structured, but most hosts also include free-text in `webpage` or template).

## 3. Pricing dynamics on vast.ai for high-VRAM cards

**Market depth is shallow.** 11 verified+rentable dual-GPU+ RTX PRO 6000 WS listings worldwide. Compare to 59 RTX 5090s. This is a thin niche where one renter arriving or leaving moves the apparent fill rate sharply. Don't over-fit to "nobody is renting today."

**Recent price compression:** external sources (Thundercompute, May 2026) say RTX PRO 6000 on-demand has *risen* 52% since June 2025 ($1.79 → $2.73 per GPU). Our $1.335/GPU is materially below the cited industry mean. This is consistent with vast.ai being structurally cheaper than the rest of the market. RunPod $2.09/GPU, Hyperstack $1.80/GPU, Spheron starts at $0.88/GPU (spot $0.23/GPU). vast.ai page advertises "from $1.02/hr" (single-GPU) and "$1.33/hr" (S-variant). We are right at the low end of platform price.

**Spread cheapest-to-median (dual-GPU vast.ai cohort):**

| Percentile | Total $/hr | Per-GPU $/hr |
|---|---|---|
| Min | $2.53 | $1.27 |
| **Us (P~20)** | **$2.67** | **$1.34** |
| Median | $3.20 | $1.60 |
| P75 | $3.74 | $1.87 |

We are 5.5% above the Czech floor and 17% below median. The spread is tight; this is a competitive market where small moves matter.

**A single-cent price change moves you three spots in autosort** (vast.ai community knowledge, well-documented). At our spread, dropping to $2.50/hr ($1.25/GPU) would clear the Czech leader and put us at P0 — meaningful for autosort exposure.

**Is $2.67/hr enough to rent within hours?** Probably not at our current autosort signal. With score=156 and inet_down=885 Mbps, even at price-equal we sit behind the Czech leader on every autosort tiebreak. The "price is the only tunable" doctrine is operative here.

## 4. What makes a listing surface in search vs sit idle

Vast.ai documents the autosort weighting as **price → internet speed → reliability → DLPerf, in that order**. Practical implications:

- **Price** dominates. A single cent moves three positions.
- **Internet speed** is a hard secondary. Our 885 Mbps down vs the Czech leader's 6,318 Mbps is a 7× gap. Even at lower price, the Czech listing may outrank us on the combined sort.
- **Reliability** thresholds: machines below 90% reliability are excluded from the default UI view entirely. We're at 96.5% — safe but not stellar. Difference between 99.8% and 99.9% carries a "massive multiplier."
- **DLPerf** is the workload-quality proxy. Our 406 dlperf is mid-cohort. dlperf_per_dphtotal is 152; Czech leader is 191 (better both in raw and price-normalized).

**The autosort is a price-internet-reliability-dlperf tuple**, not just price. Underpricing without fixing the internet/score handicap captures only price-only-filter buyers. Many renters use vast.ai's combined autosort.

Other signals that affect visibility:
- **`error_description`** field — if non-null, listing is suppressed from default view. We've been bitten by this before (rtxserver 2026-05-19). Currently `None` per host-side query.
- **`rentable`** boolean — must be True. Currently True.
- **`verification`** — must be "verified." Currently is.
- **Disk space** — renters filter on this. We have 3,352 GB available — strong; only one competitor offers more (Quebec 4-GPU listing at 5,337 GB; Czech 4-GPU at 7,291 GB).
- **`direct_port_count`** — number of ports exposed to renter. We have 100 (standard). Most are 100; Czech leader has 2,499 (unusual, likely a hosting-platform-tier datacenter).
- **`gpu_max_power`** — we are 425W (cap); most competitors 600W. **This is visible to renters.** A renter benchmarking knows our cards are power-capped, will assume lower throughput. This may matter for performance-sensitive renters.

## 5. Common new-host gotchas (what makes "verified but no rentals" happen)

From the docs + Sartor incident history:

- **Sticky `error_description`** — set by Docker/NVML mismatches during verification; doesn't auto-clear. Has bitten rtxserver twice (2026-05-02 Docker flags, 2026-05-19 NVML). Currently clean per host snapshot.
- **Cold-start score handicap** — score is partially a function of rental history. New machine with 0 rentals starts low (Sartor's 130-166 range), suppressing autosort placement, suppressing first rental — classic chicken-and-egg. Only fix: undercut price aggressively to capture first rental and build score.
- **CPU cores per GPU** — we have 32 effective cores / 2 GPUs = 16 cores/GPU. Most competitors are similar. Some renters filter on this; not a problem here.
- **Disk bandwidth** — our 4,858 MB/s is competitive (Czech leader 1,997 MB/s, but they have static_ip and presumably higher-tier datacenter). Strong fast-load performance.
- **Storage cost** — we charge $0.16/GB-month (default). Renters who park large model weights see this in total cost. Median is in this range; not a differentiator.
- **Internet bandwidth ceiling for verification is 500 Mbps**; we're at 885/899 → well above verification floor, but well below competitor norm. **Verification is not the issue; autosort is.**
- **Power cap visibility** — 425W shows in the listing. If we ran uncapped at 600W (vendor TDP), DLPerf scores would rise. Production cap was set for thermal safety; trade-off is real.

## 6. Renter UX — what they see

Vast.ai's docs are coy on the exact renter UI, but from the API surface + community knowledge:

- Default landing is **autosort** (the weighted combination above). Most renters don't change it.
- Sort options exposed: $/hr, DLPerf, DLPerf/$, internet down, internet up, reliability, score.
- Filters: GPU name, num_gpus (with `>=`), VRAM, CUDA version, disk space, geolocation, verified, rentable.
- **Default view excludes reliability < 90%.** We pass.
- Listing card likely shows: GPU model + count, total $/hr, per-GPU $/hr, location, score, reliability, internet down/up, disk, "verified" badge.
- A "hot" listing visually differs from a cold one mainly by the **score-per-dollar** and **autosort position**. We are at rank ~2-3 by price but probably rank 5+ by autosort because of the internet gap.

## Surprising findings

1. **Internet bandwidth, not price, is our principal autosort handicap.** Documented vast.ai weighting puts internet ahead of reliability and DLPerf. Our 885 Mbps vs Czech 6.3 Gbps is a 7× gap. No price drop fully overcomes this, though a sufficient drop puts us into price-only-sort buyer flow.
2. **We are the only US dual-GPU RTX PRO 6000 WS listing in the verified+rentable cohort.** This is a real moat for US-latency-sensitive renters and is underexploited.
3. **The market for this card class is 11 dual-GPU+ listings worldwide.** Extremely thin. Daily fill rate is noisy by construction; "no renter today" tells us almost nothing on a one-day window.
4. **External market prices have risen 52% in 11 months on this card.** vast.ai is structurally below the broader market. We are below median on vast.ai which is below median across-platform. Room to raise post-first-rental is real.
5. **Score 130-166 reflects cold-start, not actual machine quality.** The Czech leader at 313 has rental history baked in. After a couple of completed rentals, we should see our score climb 50-100 points organically.
6. **Power cap visibility (425W) is a real but small handicap.** Competitors mostly show 600W. Some renters will notice; most won't.

## Concrete recommendations

In order of expected impact:

1. **Drop to $2.50/hr total ($1.25/GPU), interruptible floor $1.85/$0.92.** This undercuts the Czech leader ($2.53) by one cent at the bundle level, putting us at P0 on price. Combined with our US-only-in-cohort positioning and clean error_description, this is the highest-leverage move available right now. **Expected outcome:** first rental within 1-3 days based on market depth and our prior C.37359460 capture history.

2. **Add a free-text listing description (if vast.ai supports it on this account) emphasizing US East Coast, low-latency, no datacenter middleman.** Even on autosort, the listing card shows location; renters with US-residency or latency requirements self-select.

3. **Do not raise power cap to 600W to chase DLPerf.** Thermal pathology on rtxserver's single-card-failure history (per rental-ops-audit incident patterns) does not justify the risk. 425W cap is correct for now. The DLPerf gap is small and price compensates.

4. **Plan a price raise after first completed rental.** Per `vastai-pricing-strategy.md`, after 168h+ of completed rental, raise 10-15%. With one rental's worth of score build, $2.50 → $2.85-3.00 is reasonable. Existing renter gets a "price increase challenge" email; new renters see the higher price.

5. **Do not consider a reserved long-term contract for at least 4 weeks.** gpuserver1's C.34113802 at $0.20/hr realized vs $0.80 list is the cautionary tale. Price-discover first.

6. **Monitor `error_description` daily.** Sticky-error has hit this machine before. A non-null error tanks visibility silently.

7. **Internet bandwidth is a fixable problem on the Verizon Fios upgrade path.** The 885 Mbps is the Fios circuit cap. If a Fios Gigabit-symmetric or 2-Gig plan is available at the address, an upgrade would materially shift our autosort position. Worth checking — this is the single largest non-tunable handicap currently.

## Open questions / things to verify

- Does vast.ai's listing UI expose a host-controlled free-text description field? (worth checking in console)
- Has Verizon rolled out higher-tier Fios at Montclair address since the network was last spec'd?
- What's the actual fill rate on the Czech leader at $2.53? Is it renting steadily or also idle? (would need rental-history scrape; not currently instrumented)
- What rental duration did C.37359460 run for, and what was the renter's stated workload? (vLLM is known; duration data in vast.ai instance history)

## Sources

- [Vast.ai Verification Stages](https://docs.vast.ai/documentation/host/verification-stages) — reliability floor 90%, bandwidth ceiling 500 Mbps for verification, disk and CUDA thresholds
- [Vast.ai Hosting Overview](https://docs.vast.ai/documentation/host/hosting-overview) — autosort + verification flow
- [Vast.ai Rental Types FAQ](https://docs.vast.ai/documentation/reference/faq/rental-types) — DLPerf definition, on-demand vs interruptible
- [Vast.ai RTX PRO 6000 WS pricing page](https://vast.ai/pricing/gpu/RTX-PRO-6000-WS) — platform-advertised pricing
- [Spheron Blog: RTX PRO 6000 Benchmarks (30B AWQ, 70B FP8)](https://www.spheron.network/blog/rent-nvidia-rtx-pro-6000/) — workload performance
- [VRLA Tech: RTX PRO 6000 Blackwell for LLMs](https://vrlatech.com/rtx-pro-6000-blackwell-for-llms-why-96gb-changes-everything/) — buyer profiles, model fit
- [CloudRift: RTX PRO 6000 vs H100/H200/L40S](https://www.cloudrift.ai/blog/benchmarking-rtx6000-vs-datacenter-gpus) — comparative benchmarks, cost-per-token
- [Thundercompute: RTX PRO 6000 Pricing May 2026](https://www.thundercompute.com/blog/nvidia-rtx-pro-6000-pricing) — industry pricing trend, +52% over 11 months
- [Databasemart: Pro 6000 vLLM benchmark](https://www.databasemart.com/blog/vllm-gpu-benchmark-pro6000) — concurrency throughput data
- [Vast.ai Review (aitooldiscovery)](https://www.aitooldiscovery.com/ai-infra/vast-ai-review) — autosort weight ordering, reliability multiplier
- [Vast.ai Earnings article](https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai) — pricing strategy norms
- Internal: `sartor/memory/projects/rental-ops-audit-2026-05-26/pricing-findings.md` — Sartor fleet market position
- Internal: `sartor/memory/business/vastai-pricing-strategy.md` — short-term-first doctrine
- Live: `vastai search offers 'gpu_name=RTX_PRO_6000_WS num_gpus>=2 verified=true rentable=true'` 2026-05-26
