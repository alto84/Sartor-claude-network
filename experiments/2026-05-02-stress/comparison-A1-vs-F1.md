---
name: comparison-a1-vs-f1-2026-05-02
description: Direct comparison of A1 (Apr 29 BMC curves, GPU0 solo 475W) vs F1 (aggressive new BMC curves applied 14:46Z, same GPU0 solo 475W). Tests Alton's hypothesis that the front intake fans were under-driven by the prior curve and that a curve fix alone resolves the heat envelope. Result: PARTIAL — curves dramatically fixed Tccd4 localized impingement (−19.9°C) but Tctl barely moved (−2.5°C), revealing that the bottleneck is GPU0→IO-die heating via the Noctua intake air column, NOT localized GPU0 exhaust impingement on a single CCD. Three 140 mm fan placement decision: one top-exhaust + one CHA_FAN4-asymmetry + one reserve.
type: experiment-comparison
date: 2026-05-02
status: f1-complete-marginal-branch
---

# A1 vs F1 — same GPU0 solo workload, two BMC curve sets

## Curves applied

| Point | A1 (Apr 29 curves) | F1 (aggressive, applied 14:46Z) | Delta |
|-------|--------------------|--------------------------------|-------|
| A | 30°C → 30% | 30°C → 50% | +20% duty floor |
| B | 55°C → 50% | 50°C → 75% | +25% duty, point shifted -5°C |
| C | 70°C → 80% | 60°C → 90% | +10% duty, point shifted -10°C |
| D | 80°C → 100% | 70°C → 100% | point shifted -10°C |

Applied to Zones 2-6 (CHA_FAN1, CHA_FAN2, CHA_FAN3, CHA_FAN4-empty, CHA_FAN5/MEGACOOLs). All five zones saved-confirmed via Chrome MCP from Rocinante.

## Idle response (curve change verified live)

| Fan | A1 idle (PCIE03≈30°C) | F1 idle (PCIE03≈29-30°C) | Delta |
|-----|----------------------:|---------------------------:|-------|
| CHA_FAN1 | 600 RPM | 1080 RPM | +80% |
| CHA_FAN2 | 480 RPM | 720 RPM | +50% |
| CHA_FAN3 | 480 RPM | 720 RPM | +50% |
| CHA_FAN5 | 600 RPM | 960 RPM | +60% |

## Headline comparison

| | A1 (Apr 29 curves) | F1 (aggressive curves) | Delta |
|---|---:|---:|---:|
| GPU0 die peak | 74 °C | **73 °C** | −1 |
| GPU0 die mean | 68.5 | 67.7 | −0.8 |
| BMC PCIE03 peak | 74 °C | 73 °C | −1 |
| **CPU Tctl peak** | **79.6 °C → SOFT abort** | **77.1 °C** | **−2.5 (still above 75 threshold)** |
| CPU Tctl mean | 55.1 | 53.6 | −1.5 |
| BMC CPU Pkg peak | 73 °C | 71 °C | −2 |
| **Tccd1 peak** | 50.6 | 49.6 | −1.0 |
| **Tccd2 peak** | 50.0 | 49.1 | −0.9 |
| **Tccd3 peak** | 49.5 | 49.1 | −0.4 |
| **Tccd4 peak** | **69.1** | **49.2** | **−19.9** |
| Wall peak | 693 W | 692 W | ~0 |
| GPU0 onboard fan peak | 45 % | 44 % | −1 |
| CPU_FAN (Noctua) peak | 1440 | 1440 | 0 |
| CHA_FAN1 peak | 960 | 1080 | +120 |
| CHA_FAN2 peak | 1080 | 1200 | +120 |
| CHA_FAN3 peak | 1080 | 1200 | +120 |
| **CHA_FAN5 peak** | **1440** | **1680** | **+240 (now at nameplate max)** |
| Audible at | t+58s | **t+13s** | −45s |
| Result | aborted on TCTL_75 at t+300s natural end | ran clean to t+300s natural end | — |

## Critical finding: Tccd4 fully fixed but Tctl barely moved

**The aggressive curves completely resolved the localized GPU0→Tccd4 impingement.** All four CCDs are now uniform at ~49°C peak — the historical "Tccd4 hot-spot" pattern documented in HARDWARE.md is GONE under F1. This is conclusive evidence that the front-intake fans can hit the front-of-CPU region effectively when driven hard enough.

**But Tctl barely moved** (−2.5°C), and stayed 2.1°C above the 75°C SOFT abort threshold. This decoupling is structurally informative:

| Source | A1 | F1 | Implied heat path |
|--------|----|----|-------------------|
| Tccd4 (front-of-package CCD) | 69.1 °C | 49.2 °C | **Cooled by front fans** ✓ — localized GPU exhaust impingement on CCD-4 fully addressed |
| max(Tccd1-3) (other CCDs) | 50.6 °C | 49.6 °C | already cool in both runs — never the bottleneck |
| Tctl (CPU control temp) | 79.6 °C | 77.1 °C | **NOT cooled by front fans** ✗ — heat path is independent of CCD impingement |
| BMC CPU Package | 73.0 °C | 71.0 °C | tracks Tctl, not CCDs |

The Tctl-to-max-CCD offset went from +10.5°C in A1 to +27.5°C in F1. That's not a sensor anomaly — it's evidence that **Tctl is reading the IO die / central socket temperature**, which sits under the IHS and is heated by:
1. The IHS-top air (what the Noctua tower dumps onto it)
2. NOT by the local CCD impingement that front fans now address

The Noctua's intake is front-of-case-facing. It pulls chassis air through the tower fins. When the chassis air is hot (because GPU0 exhaust hasn't been pushed out the rear/top yet), the Noctua dumps that warm air onto the IHS top. The IO die heats from above through the IHS. **No front fan can reach the IO die — only intercepting the GPU exhaust before it recirculates back into the Noctua intake will help.**

## Saturation analysis at F1 peak

| Zone / Header | F1 peak RPM | Nameplate max | % of max | Saturated? |
|---------------|------------:|--------------:|--------:|------------|
| CHA_FAN5 (3× MEGACOOL front-mesh) | **1680** | ~1700 | **~99%** | **YES — at nameplate max** |
| CHA_FAN1 (front, PCIE07-bound, GPU1 cold) | 1080 | ~1700 | ~64% | No (windmilling + curve floor) |
| CHA_FAN2 (mid-chassis) | 1200 | ~1700 | ~71% | No — under-driven by ~29% despite 100%-duty curve |
| CHA_FAN3 (mid-chassis) | 1200 | ~1700 | ~71% | No — same |
| CPU_FAN (Noctua NF-A15) | 1440 | ~1500 | ~96% | Approaching saturation |
| GPU0 onboard fan | 44% | 100% | 44% | No, ~56% headroom |

**CHA_FAN5 is saturated at nameplate** — pushing this curve harder cannot extract more airflow from the front-mesh array. **CHA_FAN2/3 are still under-driven** even with the aggressive curve commanding 100% duty at PCIE03=70°C — peaked at 71% of nameplate. This is a BMC PWM-scaling cap on those zones (the open-question item from the design doc); curve aggression cannot push them past this cap.

## Verdict

**MARGINAL branch.** The aggressive curves did real work: Tccd4 fully resolved, Tctl reduced 2.5°C, GPU0 die marginally cooler, fans audible 45 seconds earlier. **But Tctl peak 77.1°C is still above the 75°C threshold** — only 2°C above, but above. The remaining gap is structural: GPU0 → IO-die heating via the Noctua intake air column, which front fans cannot address.

**Decision rule:**

| Branch | Criterion | Action |
|--------|-----------|--------|
| A — BMC fix alone solves it | F1 Tctl peak < 75 °C | curves are the answer; 140 mm fans are noise/redundancy upgrade only |
| **B — Marginal (this run)** | **F1 Tctl peak 75-80 °C** | **curves help; one top-exhaust fan finishes the job; other two 140 mm in reserve** |
| C — Geometry-bound | F1 Tctl peak ≥ 80 °C | curves don't help significantly; full three-fan placement (top-exhaust + slot-3 side + redundancy) |

We landed in Branch B. Specific fan placement updated below.

## Three 140 mm fan placement (final, evidence-based)

### Fan #1 — TOP-MOUNTED EXHAUST above the GPU0/CPU region (highest leverage)

- **Why:** F1's data isolates the Tctl problem to GPU0 → Noctua intake → IO die. A top-exhaust fan above this region pulls GPU0's hot exhaust OUT of the chassis BEFORE it can recirculate into the Noctua's front-facing intake. This is the ONLY intervention that addresses the residual 2-3°C Tctl gap.
- **Connector:** W_PUMP+ header (currently empty, default Generic curve = always 100%) is a good home if you want max-speed continuous. Alternatively, splitter from CHA_FAN5 source for curve-controlled. **Suggested:** start with W_PUMP+ for full speed during the next stress validation, switch to curve-bound after.
- **Expected effect:** Drop Tctl peak from 77.1°C (F1, single-card) to ~70-72°C; drop dual-card Tctl peak from 87.8°C (04-29 baseline) to ~78-80°C. Sustained 475W/card 24/7 inference becomes thermally safe IF combined with the F1 curves now in place.

### Fan #2 — CHA_FAN4 header (currently empty), with rebind Zone 5 PCIE07 → PCIE03

- **Why:** CHA_FAN4 is the empty 5th P14 slot. Today's data showed PCIE03-bound zones are the relevant cooling lever (PCIE07 stays cold during GPU0-solo). Rebinding Zone 5 to PCIE03 puts another fan on the hot card's airstream. Addresses the inter-card asymmetry (11°C in dual-card runs) without touching the CPU coupling.
- **Expected effect:** 2-3°C reduction in GPU0 die under dual-card load; 2-4°C reduction in inter-card asymmetry. Modest but cheap.
- **Note:** This was already proposed in `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` 2026-04-29. F1 data reaffirms.

### Fan #3 — HOLD IN RESERVE

- **Why:** F1's curve change consumed most of the front-intake-fan headroom (CHA_FAN5 now saturated at 1680 RPM = nameplate). Adding a third PCIE03-bound fan to an already-saturated zone gives diminishing returns.
- **Likely future deployment** (after post-mod stress test):
  - If post-mod B-phase shows Tctl still ≥75°C: second top-exhaust fan in a redundant position
  - If post-mod shows asymmetry persists despite CHA_FAN4: side-bracket intake aimed at slot 3
  - If post-mod is clean across all metrics: hold permanently for failure replacement
- **Decision rule:** install Fans #1 and #2, re-run today's full A1+A2+B harness, measure, then decide.

## What the data discriminates among the original three branches

The directive's three branches were:
- Branch 1: front intakes ≥90% PWM at peak load → 140 mm fans not needed for thermal envelope
- Branch 2: front intakes <70% during peak → BMC binding bug; fix curves first
- Branch 3: fans not tach-readable → install on non-BMC headers

**A1 alone landed in Branch 2** — front intakes were at 56-85% of nameplate, with the mid-chassis P14s especially under-driven. We "fixed the curves first" in F1.

**F1 lands in:**
- For CHA_FAN5 (front-mesh): now saturated → Branch 1 confirmed for this zone
- For CHA_FAN2/3 (mid-chassis): still at 71% of nameplate despite 100% duty command → Branch 2 *partial* (BMC PWM-scaling cap on those zones; curve aggression won't get them past 1200 RPM)
- For GPU0→Noctua coupling: NEITHER branch addresses this → **a fourth branch surfaces: geometry-bound CPU coupling that no front-fan curve can fix**

## Sampler bug noted (caught in F1 analysis, not a safety issue)

The sampler's abort-trigger regex is `^(A1|A2|B)$` — the F1 phase tag does NOT match, so no abort fired during F1 even though Tctl peak 77.1°C > 75°C SOFT threshold. GPU envelope stayed safe (peaks well below 88°C hard abort), but the bug means F1 would have continued past a TCTL_75 trip without orchestrator awareness. Fix: extend regex to `^(A1|A2|B|F1|F2)$` or similar in any future phase additions. Filed in open-questions.

## Files

- This comparison: `experiments/2026-05-02-stress/comparison-A1-vs-F1.md`
- F1 raw data: `samples.csv` rows tagged `phase=F1` (66 samples, 14:46:52 → 14:52:24)
- F1 stdout: `f1.log`
- A1 raw data: same CSV, rows tagged `phase=A1` (40 samples)
- Phone-home for A1 abort: `sartor/memory/inbox/rtxpro6000server/PHONE-HOME-stress-2026-05-02-anomaly.md` — supersede with this F1 result
