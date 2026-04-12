---
type: domain
entity: rental-operations
updated: 2026-04-11
updated_by: Claude
status: active
priority: p1
tags: [entity/business, domain/solar-inference, status/active, priority/p1]
aliases: [GPU Rental Operations, Rental Business Framework, Solar ITC Rental Strategy]
related: [BUSINESS, solar-inference, MACHINES, TAXES, gpuserver1-MISSION]
---

# Rental Operations Framework

## Overview

Solar Inference LLC operates a GPU rental business on vast.ai. As of 2026-04-11, the operational priority is **continuous rental occupancy**, not profitability. This document captures the framework so that machine agents (current and future) understand how to interpret their operational directives. It will be updated as the business grows, more machines come online, and the tax strategy is refined with the CPA.

## The solar roof connection

The household has a Tesla Solar Roof — $438,829 contract, 22.10 kW system, 307 tiles, under contract with Lucent Energy Management. This is a mixed-use installation on a residential/business property at 85 Stonebridge Rd, Montclair NJ. The property's business function is Solar Inference LLC.

For the 2026 tax year (first full year with solar in service), Solar Inference LLC plans to claim:

- **30% federal Investment Tax Credit** on the solar installation (~$131,649 if placed in service during 2026)
- **100% bonus depreciation** via OBBB on the 85% depreciable basis (~$373,005)
- **NJ SuSI incentive** (~$24,447)

These deductions require the business portion of the solar-generated electricity to be **actually consumed for business purposes**. Mixed-use installations face scrutiny on what fraction of generation is genuinely business-consumed versus residential. The cleanest documentation of business-purpose electricity consumption is real, continuous GPU compute rental activity.

**Every hour a machine is rented out on vast.ai is an hour of electricity burned for demonstrably business purposes.** This is why the primary objective is continuous rental, not hourly profit maximization.

## Operational consequences

### Primary objective: continuous rental occupancy

The goal is that gpuserver1 (and future rental machines) are rented as close to 100% of the time as market conditions allow. Sitting idle at a high listed price is worse than being rented at a lower sustainable rate. "Continuously rented at $0.25/hr" justifies more of the solar ITC than "hold out for $0.40/hr and sit vacant half the time."

Profitability per rental hour remains relevant — there is a hard floor at the marginal electricity cost (~$0.14/hr for an RTX 5090 at NJ residential rates). Below that floor, renting actually costs the business money. But above the floor, the optimization target is "time under rental," not "$/hr."

### Flexibility: other business electricity uses also count

The tax strategy benefits from broad documentation of business-purpose electricity consumption, not only direct rental activity. The following likely qualify (subject to CPA review):

- Cooling the rental hardware (AC, ventilation, ambient room conditioning)
- Internet bandwidth dedicated to the rental business (networking infrastructure powering the vast.ai connection)
- Power for the business's own research and experimentation (mini-lab fine-tuning, household agent development, market research)
- Power for monitoring infrastructure (Rocinante running curator / memory consolidation / pricing reviews)

Continuous rental at a sustainable rate is the cleanest narrative, but the deduction has room for broader interpretation. Do not optimize against the narrowest possible interpretation.

### Market dynamics assumption (2026 outlook)

Alton's read on the GPU rental market (as of 2026-04-11): **rental value is expected to increase significantly through 2026 due to rapid AI improvements.** This assumption informs pricing strategy:

- **Near-term:** prefer continuous occupancy over aggressive price-bumping. Losing a customer to a bump is worse than leaving marginal revenue on the table.
- **Medium-term:** ratchet up gradually as market rates rise.
- **Long-term:** machine-pricing agents should be empirically market-aware via `vastai search offers` and 500.farm dashboard probes, adjusting to track the ambient market rather than holding fixed targets.

If AI commoditization accelerates faster than expected, rental value could compress instead of expand. Pricing agents should be empirically responsive to the market, not doctrinaire about the long-term trajectory.

## Current infrastructure

**gpuserver1** (the current rental node):

- Hardware: RTX 5090, i9-14900K, 128GB DDR5, ASUS Z790 Gaming WiFi7
- vast.ai machine 52271, listed at $0.35/hr demand, $0.26/hr interruptible (as of 2026-04-11, 25% spread between demand and interruptible)
- Operational cadence: 2-hour monitoring cron, 60-second power logger (pynvml cumulative counter), weekly Monday-09:00-UTC pricing review cron, nightly memory consolidation via autodream
- Agent documents:
  - MISSION: `sartor/memory/machines/gpuserver1/MISSION.md` (self-authored, v0.2)
  - Market pricing skill: `sartor/memory/skills/gpuserver1-market-pricing/SKILL.md` (self-authored)

**Future rental nodes:**

- **Dual RTX PRO 6000 Blackwell workstation** — scheduled for summer 2026 delivery, ~$35K Newegg order planned, 192GB VRAM total. Primary role: household inference and fine-tuning (for the home agent). Secondary role: supplemental rental when idle. Its MISSION will be authored when the hardware arrives.
- **Possible additional machines after that** — each added rental node deepens the business electricity consumption and strengthens the deduction justification. Pattern is replicable.

## Agent-level pricing approach

The `gpuserver1-market-pricing` skill at `sartor/memory/skills/gpuserver1-market-pricing/SKILL.md` documents the working approach, authored by gpuserver1 itself. Current summary:

- **Target:** highest price that maintains consistent rental (not maximum price)
- **Probe:** `vastai search offers 'gpu_name=RTX_5090 verified=True' --raw` for live market data
- **Reference:** 500.farm Grafana dashboard at `https://500.farm/vastai/charts/d/FRpv6Pc7z/home` for trend context every 3-5 days
- **Position target:** p40-p55 of verified RTX 5090 offers while reliability history is building (currently 98.85%, 3 reports on record)
- **Bump cadence:** weekly review, asymmetric risk — ratchet up only when occupancy has held through the previous bump, revert promptly if a bump causes vacancy
- **Cuts:** flagged for human review, never autonomous
- **Autonomy bounds:** $0.25–$0.55/hr hard floor/ceiling, +$0.05 max change per cycle, 7-day cooldown after manual override

The pricing skill is expected to evolve. gpuserver1 will refine it over time based on empirical market observation.

## Open questions (for resolution over time)

1. **Revenue target / minimum threshold.** What minimum revenue level constitutes "the machine is not earning enough to justify staying listed"? gpuserver1 raised this as an open question in its MISSION v0.1. Resolution requires thinking about the deduction math: even a marginally-profitable machine serves the solar ITC justification, so the threshold may be very low or effectively zero.

2. **Dynamic pricing floor tied to solar generation curve.** Should the pricing floor drop during high-solar periods (spring/summer noon hours) to maximize occupancy exactly when the system is generating the most electricity that needs to be justified? gpuserver1 raised this in its v0.2 open questions.

3. **Adding machines: rental-first vs household-first.** When the Blackwell workstation arrives, does it get its own vast.ai listing immediately, or does it serve household workloads primarily with rental as secondary? Depends on whether household inference demand saturates it.

4. **Broader electricity documentation.** Should cooling, networking, and infrastructure power consumption be tracked explicitly as part of the business-purpose electricity accounting? The rental activity alone is probably sufficient justification, but broader documentation might strengthen the deduction claim. Flag for CPA discussion.

5. **CPA review of the framework.** The solar ITC strategy is load-bearing on the tax position. The framework should be reviewed with Jonathan Francis (the CPA) before the 2026 tax filing. Specifically: is "time under rental" a defensible metric for business-purpose electricity consumption, or does the IRS want something more precise like kWh metering at the machine level?

## Related documents

- [[BUSINESS]] — Higher-level business entity context
- [[TAXES]] — Tax strategy, CPA engagement, deduction planning
- [[solar-inference]] — Solar Inference LLC entity operational details
- [[MACHINES]] — Infrastructure overview
- `sartor/memory/machines/gpuserver1/MISSION.md` — gpuserver1's self-authored mission
- `sartor/memory/skills/gpuserver1-market-pricing/SKILL.md` — market-pricing skill
- `feedback_pricing_autonomy.md` — pricing autonomy rules (Rocinante memory, auto-injected)
- `feedback_objective_level_delegation.md` — delegation pattern for peer machines

## History

- 2026-04-11: Initial capture of the operational framework. Primary objective reframed from revenue-max to occupancy-max for solar ITC tax deduction justification. gpuserver1 MISSION v0.2 and market-pricing skill authored by gpuserver1 Claude on the same day. Reflects Alton's direct framing in the pricing-autonomy discussion. Document is explicitly a v0.1 starting point to be refined as the business grows, more machines come online, and the CPA review shapes the tax strategy.
