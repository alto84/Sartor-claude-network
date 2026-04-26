---
name: cato-prosecution-007
description: Verify pass on Phase-2-Research-Plan revise pass 3. Confirms Cato-006 §C (AMD/Intel thermal_throttle interface mismatch) landed substantively. Final structural health check. No new charges.
type: adversarial-review
date: 2026-04-26
updated: 2026-04-26
updated_by: cato-007
status: filed
volatility: low
verdict: GREENLIGHT
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/2-plan, hardware]
related:
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/CATO-PROSECUTION-006
  - research/persona-engineering/CATO-PROSECUTION-005
  - machines/rtxpro6000server/HARDWARE
---

**Verdict: GREENLIGHT**

The §C patch landed substantively. The plan's structural integrity holds. No new defects surfaced. The plan is fire-ready for the experiment 002 design phase.

---

## §C patch verification

Landed clean at PHASE-2-RESEARCH-PLAN.md line 184 (Decision 8 step 4) and line 187 (CPU intervention threshold). Step 4's capture-target list now reads "CPU package temp + per-CCD temps via `sensors k10temp-pci-00c3` (Tctl + Tccd1-4 channels — AMD-specific) ... per-CCD frequency via `cpupower frequency-info` (boost-sustained vs derated)." The Intel-only `/sys/devices/system/cpu/cpu*/thermal_throttle/` path now appears only inside the explicit AMD-disclaimer note ("**AMD note (per Cato-006 §C):** there is no ... interface ... that path is Intel-specific") which correctly negates the path and points the reader to `machines/rtxpro6000server/HARDWARE.md` §"Notes for HARDWARE-THERMAL-BASELINE.md" (line 102 of HARDWARE.md, which exists). Line 187 replaces the old "per-core thermal throttle counter increments" trigger with the AMD-correct "CPU Tctl saturates at ~95 °C while power stays high ... OR ... per-CCD boost frequency derates below the sustained-all-core target during the test." This matches HARDWARE.md line 106 verbatim in substance. `grep -n "thermal_throttle"` against the plan returns four matches — three in patched contexts (Decision 8 disclaimer, history entry, history entry) and one in §"NEW — CPU thermal-throttle risk" framing prose (line 177) which is hardware-neutral terminology, not a sysfs reference. The old sysfs path no longer appears as a capture target or as an intervention trigger anywhere in the plan.

## Structural health

Numbering integrity: Decisions 1-9 present and contiguous (lines 55, 65, 77, 98, 127, 143, 154, 168, 196). Falsifiers F1-F6 present and contiguous (lines 233, 236, 239, 242, 245, 248), each with a pre-committed action and threshold. Pre-Flight checklist contains 15 numbered rows plus PF-1 + PF-2 (17 total) matching §5's table head. No drift between Decision 7's PSU math (2 × 500 + 350 + 50 = 1400 W at zero slack) and Decision 8's air-cooled regime (350 W TDP CPU on 350 W-rated cooler, zero CPU headroom); both are anchored in HARDWARE.md's BoM table. The first-fire-non-gating claim ("does NOT block Phase 2 first-fire") at line 194 is empirically grounded against the corrected hardware reality: first-fire is single-card inference at < 200 W/card with light tokenization-only CPU work, well below the simultaneous-saturation regime where the air-cooled CPU becomes the binding constraint. Phase 1's measured 170 W/card peak (cited at line 156) is the empirical anchor. The carve-out is honest, not a rationalization.

## New charges

None.

---

## Closing

Trajectory: 18 → 5 → 4 → 6 → 2 → 1 → **0**. The chain has converged. The recurrent co-located-label-mismatch defect class — which surfaced at Cato-002 §1, Cato-003, Cato-004 §3, Cato-005 §A/§B, and Cato-006 §C — is closed for this prosecution chain at the AMD/Intel boundary. The single-source-of-truth pattern (HARDWARE.md as canonical hardware reference; plan documents cite back to it via explicit anchor) is now operative; Cato-005's closing recommendation has been implemented in practice if not in name. Future revise passes that touch hardware-specific assertions should continue to grep both documents, but no current defect remains.

Verdict justification: the §C patch is exact, the disclaimer pointer is accurate, no other Intel-only references exist in the plan, and structural integrity is clean across Decisions 1-9, F1-F6, and Pre-Flight items 1-15 + PF-1/PF-2. The plan can fire the experiment 002 pre-registration document now without further plan-level prosecution. The experiment 002 pre-registration itself will get its own Cato review per Decision 5 / line 307 — that is the correct next adversarial gate, not another iteration on this plan.

This is the principal's gate-flip signal.

— cato-007 (external adversarial reviewer), 2026-04-26
