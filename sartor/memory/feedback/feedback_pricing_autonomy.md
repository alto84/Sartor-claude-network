---
name: Continuous-rental-priority pricing autonomy for rental machines
description: Machine agents in the Sartor household (gpuserver1 now, Blackwell and future peers later) have delegated pricing authority on their vast.ai listings. Primary objective is continuous rental occupancy for solar ITC tax deduction justification, not revenue maximization. Market-aware ratchet-up with asymmetric risk toward holding customers.
type: feedback
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
# Continuous-rental-priority pricing autonomy for rental machines

**Rule:** Rental-machine agents (gpuserver1 now, future machines later) have delegated pricing authority on their vast.ai listings. The primary optimization target is **continuous rental occupancy**, not hourly revenue. Set prices in a market-aware way that maintains rental continuity — the highest price that keeps the machine rented consistently — while never auto-cutting without explicit authorization.

**Why:**

1. **Solar roof tax deduction justification.** The Sartor household installed a $438K Tesla Solar Roof on a mixed residential/business property at 85 Stonebridge Rd, Montclair NJ. Solar Inference LLC is claiming the 30% federal ITC plus bonus depreciation under Section 168, which requires demonstrable business-purpose electricity consumption. Every hour a machine is rented is an hour of solar-generated electricity consumed for unambiguously business purposes. Idle machines don't serve this goal; continuously-rented machines do. Alton stated this explicitly on 2026-04-11: "we need to actually burn electricity via renting as much as possible... it's actually not profitability, that's most important right now." See `sartor/memory/business/rental-operations.md` for the full operational framework.

2. **Market appreciation expected through 2026.** Alton's read on the GPU rental market is that value will increase significantly as AI workloads continue to scale. Near-term, this argues for patient ratcheting rather than aggressive revenue capture. Bump prices cautiously; revert promptly if a bump causes vacancy.

3. **Asymmetric risk.** Losing a rental because a price bump overshoots is worse than leaving marginal revenue on the table. gpuserver1 raised this explicitly in its MISSION v0.2: the "continuous rental at any sustainable price" mandate creates asymmetric risk, and the pricing logic should bias conservative on upward moves with quick reversion.

**How to apply:**

1. **Data sources:**
   - `vastai search offers 'gpu_name=RTX_5090 verified=True' --raw` for real-time market percentiles
   - `vastai show earnings` for our occupancy and revenue
   - `500.farm/vastai/charts/d/FRpv6Pc7z/home` (Grafana dashboard) every 3-5 days for trend context

2. **Target market position:** p40-p55 of verified RTX 5090 offers while reliability history is building (currently 98.85%, 3 reports on record). Drift upward through the distribution as reports age out and uptime accumulates.

3. **Weekly review cadence** (Mondays 09:00 UTC via `/home/alton/sartor-pricing/run_pricing.sh` cron on gpuserver1). No intra-week changes.

4. **Ratchet rules (occupancy-weighted, upward-biased, revert-fast):**
   - **Bump condition:** rolling 7-day occupancy ≥90% AND our position below p50 of verified market → bump demand by **+$0.025**. Occupancy is the primary gate, percentile position is the secondary gate.
   - **Aggressive bump:** rolling 7-day occupancy ≥95% AND below p40 → bump by **+$0.05**.
   - **Revert condition:** if a previous bump caused occupancy to drop below 60% within the next review cycle, **revert to the prior price**. This is an auto-cut BY WAY OF REVERSION of a recent autonomous bump — it is permitted because it restores a previously-validated equilibrium, not a discretionary cut of uncertain magnitude.
   - **Hold condition:** occupancy 60-90% OR position already at p55+ → no change.
   - **Flag condition:** occupancy <40% for a 7-day window → write a proposed cut to the weekly report and **wait for Alton's explicit authorization**. Discretionary cuts remain non-autonomous.
   - **Ceiling:** $0.55/hr hard cap.
   - **Floor:** $0.25/hr hard floor (above the marginal electricity cost of ~$0.14/hr at NJ rates, with headroom for depreciation and wear).

5. **Interruptible bid spread:** default 25% discount from demand price (e.g., $0.35 demand → $0.26 interruptible floor). Matches the CLAUDE.md `~/vastai-tend.sh` historical pattern.

6. **Every price change must appear** in the next monitoring report AND the weekly pricing report with: old price, new price, rolling occupancy %, market percentile position, market context snapshot, expected impact, date applied. Full audit trail, no hidden changes.

7. **Alton overrides are sacred.** If he manually changes the price, treat his value as the new baseline, skip one weekly review cycle, resume ratchet logic only on the second review after his change. The cooldown is tracked in `/home/alton/sartor-pricing/safeguards/manual-override.txt`.

8. **Scope:** This rule applies to **all rental-machine agents** in the Sartor household network. gpuserver1 now, Blackwell when it comes online, future machines as they are added. Each machine has its own MISSION and its own pricing skill; this feedback rule sets the shared framework they operate within.

9. **Cross-reference:**
   - `sartor/memory/business/rental-operations.md` — operational framework and solar ITC justification
   - `sartor/memory/machines/gpuserver1/MISSION.md` — gpuserver1's self-authored mission
   - `sartor/memory/skills/gpuserver1-market-pricing/SKILL.md` — the market-aware pricing skill
   - `reference_vastai_market_pricing.md` — data source commands and URLs
   - `feedback_objective_level_delegation.md` — how I delegate to peer machines
