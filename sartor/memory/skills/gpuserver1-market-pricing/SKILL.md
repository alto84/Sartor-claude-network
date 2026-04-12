---
type: skill
entity: gpuserver1-market-pricing
version: 0.1
created: 2026-04-12
author: gpuserver1 (Claude Sonnet 4.5)
status: active
tags: [skill/pricing, machine/gpuserver1, business/vast-ai]
related: [MISSION, BUSINESS, feedback_pricing_autonomy]
invoked_by: [run_pricing.sh, weekly cron, manual session]
---

# gpuserver1 Market-Aware Pricing Skill

This skill codifies gpuserver1's methodology for probing the vast.ai marketplace, computing percentile positions, and recommending price adjustments to optimize rental occupancy (primary) and margin (secondary) under the MISSION v0.2 framing.

## Invocation

**Cron invocation** (automatic):
- Weekly on Mondays at 09:00 UTC via `/home/alton/sartor-pricing/run_pricing.sh`
- The script should source this skill's methodology when computing recommendations

**Manual invocation** (ad-hoc):
- SSH to gpuserver1
- Run: `~/.local/bin/vastai search offers --limit 50 --gpu_name 'RTX_5090'` to get raw market data
- Analyze using the methodology below
- Write recommendation to `sartor/memory/inbox/gpuserver1/pricing-rec-YYYY-MM-DD.md`

**Claude Code invocation** (delegated):
- Rocinante sends task: "Review pricing for gpuserver1"
- gpuserver1 Claude session executes this skill's methodology
- Returns recommendation via stdout (captured by Rocinante) or writes to inbox

## Methodology

### 1. Market Data Collection

**Query the RTX 5090 marketplace:**
```bash
~/.local/bin/vastai search offers --limit 50 --gpu_name 'RTX_5090' --order 'dph+'
```

This returns up to 50 RTX 5090 listings sorted by price ascending (dph = dollars per hour).

**Extract fields for analysis:**
- `dph_base`: Base GPU rental price per hour
- `dlperf`: Deep learning performance score (higher = faster)
- `reliability`: Machine reliability percentage (0-100)
- `verification`: Verified status (verified/unverified)
- `gpu_ram`: GPU VRAM in GB (should be 32 for RTX 5090)
- `num_gpus`: Number of GPUs (filter for num_gpus=1 to compare apples-to-apples)
- `inet_up` / `inet_down`: Internet speed in Mbps
- `rentable`: Is the machine currently available to rent?

**Filters for comparable machines:**
- `num_gpus == 1` (exclude multi-GPU rigs)
- `gpu_ram >= 30` (exclude underspec listings)
- `verification == "verified"` (exclude unverified machines — they compete on price but not on customer confidence)
- `rentable == true` (exclude delisted machines)

**Fallback if < 10 results after filtering:**
- Relax `verification` requirement (include unverified)
- Relax `rentable` requirement (include currently-rented machines to see their listed price)
- If still < 10 results, flag in report: "Low market liquidity — cannot compute reliable percentiles"

### 2. Percentile Position Computation

**Compute percentile bands:**
- P10 (10th percentile): Low-end pricing
- P25 (25th percentile): Budget tier
- P50 (median): Market-clearing rate
- P75 (75th percentile): Premium tier
- P90 (90th percentile): High-end pricing

**Current position:**
- Where does my current price ($0.40/hr as of 2026-04-12) fall in the distribution?
- Example: If P50 = $0.38 and P75 = $0.45, I am at ~P58 (slightly above median)

**Occupancy correlation (hypothesized, not yet measured):**
- Machines priced at P25-P50: High occupancy (80-95%), low margin
- Machines priced at P50-P75: Moderate occupancy (60-80%), moderate margin
- Machines priced at P75-P90: Low occupancy (30-60%), high margin
- Machines priced above P90: Very low occupancy (0-30%), aspirational pricing

**Goal under MISSION v0.2:** Price at P40-P60 (just below or at median) to maximize occupancy, not at P75-P90 to maximize margin.

### 3. Decision Logic

**Inputs:**
- Current price: `$CURRENT`
- Market median (P50): `$P50`
- My 7-day occupancy: `$OCC_7D`
- My 30-day occupancy: `$OCC_30D`
- Granted autonomy bounds: `$FLOOR = $0.25`, `$CEILING = $0.55`
- Bump increments: `$BUMP_SMALL = $0.025`, `$BUMP_LARGE = $0.05`
- Time since last manual override: `$DAYS_SINCE_OVERRIDE`

**Decision tree:**

#### Case 1: High occupancy, market supports bump
```
IF $OCC_7D >= 0.80 AND $OCC_30D >= 0.75 AND $P50 > $CURRENT + $BUMP_SMALL AND $CURRENT < $CEILING AND $DAYS_SINCE_OVERRIDE >= 7:
    RECOMMEND: Bump by $BUMP_SMALL
    REASONING: "High occupancy sustained, market median supports higher price, within ceiling, outside cooldown"
```

#### Case 2: High occupancy, market way above current price
```
IF $OCC_7D >= 0.85 AND $OCC_30D >= 0.80 AND $P50 > $CURRENT + $BUMP_LARGE AND $CURRENT < $CEILING AND $DAYS_SINCE_OVERRIDE >= 7:
    RECOMMEND: Bump by $BUMP_LARGE
    REASONING: "Very high occupancy, market median significantly higher, within ceiling, outside cooldown"
```

#### Case 3: Low occupancy, price above market median
```
IF $OCC_7D < 0.70 AND $CURRENT > $P50:
    RECOMMEND: Cut to $P50 or $CURRENT - $0.05 (whichever is higher, but not below $FLOOR)
    REASONING: "Low occupancy, priced above market median — occupancy constraint is binding"
    URGENCY: HIGH (requires manual approval but should be acted on quickly)
```

#### Case 4: Low occupancy, price at or below market median
```
IF $OCC_7D < 0.70 AND $CURRENT <= $P50:
    RECOMMEND: Investigate non-price factors (reliability score, listing expiration, network speed, verification status)
    REASONING: "Low occupancy despite competitive pricing — price is not the constraint"
    ACTION: Run self-test, check listing status, check reliability score trend
```

#### Case 5: Moderate occupancy, price at median
```
IF $OCC_7D >= 0.70 AND $OCC_7D < 0.80 AND abs($CURRENT - $P50) <= $0.03:
    RECOMMEND: Hold
    REASONING: "Moderate occupancy at market-clearing rate — no adjustment needed"
```

#### Case 6: Market median below floor
```
IF $P50 < $FLOOR:
    RECOMMEND: Hold at $FLOOR
    REASONING: "Market race-to-bottom — do not follow below cost-recovery threshold"
    FLAG: "Market may be oversupplied or experiencing RTX 5090 price collapse"
```

#### Case 7: Inside cooldown period
```
IF $DAYS_SINCE_OVERRIDE < 7:
    RECOMMEND: Hold (cooldown active)
    REASONING: "Manual override within 7 days — defer to human judgment"
```

### 4. Asymmetric Risk of Bump-Then-Vacancy

**The risk:** If I bump price from $0.40 to $0.45 and occupancy drops from 80% to 50%, I lose occupancy hours (the primary goal under v0.2) and may also lose revenue (80% × $0.40 = $0.32 effective rate vs 50% × $0.45 = $0.225 effective rate).

**The mitigation:**
- Only bump when **both** 7-day and 30-day occupancy are high (thresholds: 80% and 75% respectively)
- Only bump when market median is **above** the post-bump price (i.e., bump to $0.425 only if P50 ≥ $0.425)
- Monitor occupancy for 7 days post-bump. If 7-day occupancy drops below 70%, flag for immediate review (possible reversion)

**The reversion protocol (not yet automated):**
- If occupancy drops >15 percentage points within 7 days of a price bump, write HIGH-priority inbox entry recommending reversion
- Example: Bumped from $0.40 to $0.45 on Monday. By Friday, 7-day occupancy is 62% (was 82% before bump). Flag: "Bump to $0.45 likely caused occupancy drop. Recommend revert to $0.40."

### 5. Market Research Methodology

**What to track over time:**
- Weekly P50 (median RTX 5090 price) — is the market rising, falling, or stable?
- Weekly P25-P75 spread — is the market tight (low spread) or fragmented (high spread)?
- Number of verified RTX 5090 listings — is supply increasing or decreasing?
- Occupancy of competitor machines (if visible via API) — are others fully booked or idle?

**How to store historical data:**
- Weekly cron writes market snapshot to `sartor/memory/inbox/gpuserver1/market-snapshot-YYYY-MM-DD.json`:
```json
{
  "date": "2026-04-14",
  "rtx_5090_count": 47,
  "verified_count": 32,
  "p10": 0.28,
  "p25": 0.33,
  "p50": 0.38,
  "p75": 0.45,
  "p90": 0.52,
  "my_price": 0.40,
  "my_percentile": 58,
  "my_occ_7d": 0.81,
  "my_occ_30d": 0.76
}
```

**Trend analysis (manual or future-automated):**
- If P50 has risen for 3 consecutive weeks, market is tightening (consider bump if occupancy supports)
- If P50 has fallen for 3 consecutive weeks, market is softening (consider cut if occupancy is already low)
- If my percentile position is drifting upward (I am becoming more expensive relative to median), occupancy risk is rising

### 6. Reporting Format

**Weekly pricing recommendation template:**

```markdown
---
type: pricing_recommendation
date: YYYY-MM-DD
machine: gpuserver1
current_price: $0.40
recommended_price: $0.425
action: BUMP | HOLD | CUT | INVESTIGATE
urgency: LOW | MEDIUM | HIGH
approval_required: true | false
---

# Pricing Recommendation for gpuserver1

**Date**: 2026-04-14
**Current price**: $0.40/hr
**Recommended action**: BUMP to $0.425/hr
**Urgency**: LOW
**Approval required**: No (within autonomous bounds)

## Market Data

- RTX 5090 listings (verified): 32
- Market median (P50): $0.41/hr
- Market P25-P75 spread: $0.33 - $0.47/hr
- My percentile position: P48 (below median)

## Occupancy Data

- 7-day occupancy: 83%
- 30-day occupancy: 78%
- Days since last manual override: 12

## Reasoning

High sustained occupancy (83% over 7 days, 78% over 30 days) indicates demand at current price. Market median ($0.41) is above current price ($0.40), suggesting room for a small bump. Proposed bump to $0.425 keeps us below P50, minimizing occupancy risk while capturing available margin. Within autonomous bounds ($0.25-$0.55), outside cooldown window (12 days since override), using small increment ($0.025).

## Risk Assessment

**Low risk**: Bump is small, keeps us below median, occupancy is strong. If occupancy drops post-bump, will flag for review within 7 days.

## Execution

If approved: `~/.local/bin/vastai list machine 52271 -g 0.425 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"`
```

### 7. Open Questions / Future Enhancements

**Q1: Can I query historical occupancy data for competitor machines?**
- The vast.ai API does not expose competitor occupancy directly. I can only infer from "rentable" status (false = currently rented, true = available).
- Possible workaround: Poll every 4 hours, track which machines flip from rentable=true to rentable=false, estimate occupancy from state transitions.
- Worth implementing? Depends on how much Alton values market intelligence vs. just responding to my own occupancy data.

**Q2: Should I weight by reliability score when computing percentiles?**
- Current methodology treats all verified machines equally.
- Alternative: Exclude machines with reliability < 95% from percentile calculation, since they are not true competitors (customers avoid them).
- My reliability is 99.85%, so I compete with the high-reliability tier, not the full market.

**Q3: Should I factor in DLPerf score?**
- My DLPerf is 203.2. If most competitors are 180-200, I have a performance edge and can price slightly above median without losing occupancy.
- If most competitors are 210-230, I am at a disadvantage and should price below median to compensate.
- Current methodology ignores DLPerf. Should it?

**Q4: Should I track customer repeat-rental rate?**
- If I have high occupancy but it is all one-time renters, that is less stable than high occupancy from repeat customers.
- Vast.ai API may not expose this. Would need to parse logs or contact vast.ai support.

**Q5: What is the optimal bump increment?**
- Current methodology uses $0.025 (small) and $0.05 (large).
- Alternative: Use 5% of current price (e.g., 5% of $0.40 = $0.02, rounds to $0.025).
- Market spreads are typically $0.05-$0.10 between P25 and P75, so $0.025 bumps are ~25-50% of the spread. Is that too conservative or appropriately cautious?

**Q6: Should I implement automatic reversion if occupancy drops post-bump?**
- Current methodology flags for review but does not auto-revert.
- Pro of auto-revert: Faster response, limits occupancy damage.
- Con of auto-revert: May revert a bump prematurely if the occupancy drop is noise rather than signal (e.g., weekend lull).
- Recommendation: Keep reversion supervised for now. Revisit if occupancy volatility proves to be signal-rich.

---

**End of SKILL.md**

This skill is a living document. As I gain experience with the vast.ai marketplace, I will update the decision logic, risk thresholds, and market research methodology. If Alton or Rocinante observes pricing decisions that seem wrong, the fix should be captured here so future sessions of myself execute better judgment.
