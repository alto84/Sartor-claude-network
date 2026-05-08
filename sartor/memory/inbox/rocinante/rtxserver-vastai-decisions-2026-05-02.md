---
name: rtxserver-vastai-decisions-2026-05-02
description: Alton's answers to the 6 open questions raised in `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md`. Captured 2026-05-02 evening, end of stress-test session.
type: decision-record
date: 2026-05-02
related:
  - inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02
  - business/solar-inference
tags: [decision/captured, machine/rtxserver, vast-ai]
---

# Alton's calls on rtxserver vast.ai onboarding (2026-05-02)

Answers to the 6 questions gpuserver1's peer Claude surfaced in its onboarding dump.

## 1. Pricing target

**Target: $2.50/hr listed for the dual-system unit.** Alton will help validate this by checking a few sources (vast.ai web UI competitive listings, 500.farm dashboard, anything else he finds). gpuserver1's $1.20–1.80 instinct was a judgment call without market data; Alton's $2.50 anchor presumably reflects scoping he's already done. Target validated when we open the rtxserver listing.

## 2. List as -m 1 (one big rentable unit) vs -m 2 (per-card split)

**`-m 1` — list as a dual system, single rentable unit (192 GB combined VRAM).** The 192 GB VRAM is the market differentiator; it's what justifies the $2.50/hr ask. Splitting per-card to $1.25/hr × 2 wouldn't capture the same large-model premium. Decision is `-m 1` for launch; revisit only if the dual unit underrents for >2 weeks.

## 3. Stripe payout entity

**Same Solar Inference LLC payout** as gpuserver1 unless CPA flags a depreciation reason to separate. Default is consolidation; vast.ai payout granularity is per-host-account anyway. Flag for next CPA conversation but proceed under same entity.

## 4. gpuserver1 listing end-date drift in docs (8/24 → live 10/24)

**Curator pass run as part of this commit.** CLAUDE.md, MACHINES.md, and business/solar-inference.md all updated to reflect the live `end_date` of 2026-10-24. The reserved-contract end (C.34113802 → 2026-08-24) is preserved as a distinct field — those are two different concepts that were collapsed in the prior docs.

## 5. Pricing drift across 3 docs ($0.30 live / $0.40 MACHINES.md / $0.35 CLAUDE.md)

**Curator pass run as part of this commit.** All three docs now reflect the live state:
- $0.30/hr on-demand listed
- $0.25/hr interruptible floor
- ~$0.20/hr realized (long-term contract discount under C.34113802)

Long-term realized rate captured for the first time as a documented field — Alton's specific framing: "I'm renting at around 0.2 per hour on a long term contract. They're sipping power, so works out to profit." The $0.20/hr realized vs $0.30 listed is the long-term-customer discount; profit comes from the RTX 5090's low power draw relative to revenue.

## 6. rgb_status.py portage to rtxserver

**Skip for v1.** rtxserver's BMC owns its lighting (per the BMC web UI sessions earlier today). No need to overlay a Python daemon. If the case has addressable RGB later that we want operational-state-driven, revisit.

## Decisions implied for next session's onboarding work

- Port range: **40100-40199** (per gpuserver1 peer's recommendation, separate from gpuserver1's 40000-40099)
- DMZ: **manual port-forwarding for 40100-40199, NOT shared DMZ** (Verizon Fios doesn't support two DMZ hosts)
- Hairpin NAT: same pattern as gpuserver1, OUTPUT DNAT rule for the rtxserver external IP → 192.168.1.157
- Crons: same 4-job suite as gpuserver1 (`gather_mirror.sh`, `stale-detect.sh`, `vastai-tend.sh`, `docker-weekly-prune.sh`), adapted for rtxserver paths
- Inbox: `sartor/memory/inbox/rtxserver/` already exists from earlier work
- Production GPU envelope: **450W per card cap, 1080W system total**, set today via `nvidia-smi -i 0,1 -pl 450`
- BMC fan curves: aggressive 30/50→70/100 already applied via Chrome MCP today; will carry over

## Action items for next session (NOT executed today)

1. Validate $2.50/hr against live vast.ai market before listing
2. Generate vast.ai API key for rtxserver (separate from gpuserver1's; same Solar Inference LLC account)
3. Run vast.ai self-test
4. Set up port-forwarding 40100-40199 on Verizon Fios
5. Add hairpin NAT rule for rtxserver external IP
6. Install + adapt the 4 cron scripts
7. List with `-m 1 -g 2.50 -b 2.00 -s 0.10 -e <date>` (end-date TBD)
