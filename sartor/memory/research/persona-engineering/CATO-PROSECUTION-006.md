---
name: cato-prosecution-006
description: Verify pass on Phase-2-Research-Plan revise pass 2. Confirms Cato-005's two patches landed, audits the substantively-rewritten Decision 8 (air-cooler reality), validates the new machines/rtxpro6000server/HARDWARE.md artifact.
type: adversarial-review
date: 2026-04-26
updated: 2026-04-26
updated_by: cato-006
status: filed
volatility: low
verdict: REVISE
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/2-plan, hardware]
related:
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/CATO-PROSECUTION-005
  - research/persona-engineering/CATO-PROSECUTION-004
  - machines/rtxpro6000server/HARDWARE
  - machines/gpuserver1/HARDWARE
---

**Verdict: REVISE**

Both Cato-005 patches landed verbatim and clean. The Decision 8 rewrite is substantively honest about the air-cooled reality. The new `machines/rtxpro6000server/HARDWARE.md` is a sound artifact. But the revise pass introduced one new instance of the recurrent co-located-label-mismatch defect — exactly the class Cato-002/003/004 §3/005 §A§B all caught. HARDWARE.md correctly captures that AMD has no `/sys/devices/system/cpu/cpu*/thermal_throttle/` interface (it is Intel-specific) and proposes Tctl-saturation-at-95 °C as the AMD proxy signal. PHASE-2-RESEARCH-PLAN.md Decision 8 step 4 (line 184) and the new CPU intervention threshold (line 187) still reference exactly that Intel-only sysfs path and "per-core thermal throttle counter increments." The two documents were authored together yet drift on the load-bearing AMD-vs-Intel detail. One ~6-line edit closes it.

---

## §A — Cato-005 §A (§7 Tier 3 / Pairing 6 sync)

Landed verbatim at line 318: "COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) — deferred to Tier 3 fire after first-fire results land. Distinct from the rank-1 single-layer control in first-fire (which is METH §7's design, not Pairing 6). Per §2 Decision 4 + Cato-004 §1; Cato-005 §A patch." Matches Cato-005's prescribed patch text exactly. The stale "already in first-fire batch as control" framing is gone. §7 and Decision 4 (line 102) now agree. Clean.

## §B — Cato-005 §B (§11 fingerprint composition)

Landed verbatim at line 377: "Phase 2 first-fire fingerprint v1.3 stays as 5 sub-dim + 4 countervailing categories + 4 pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, `depth_score_loyalty` composite). `principal_stress_pass` is a Phase-2 second-fire addition per Decision 2(c) + Cato-004 §4 Option A; Cato-005 §B patch." All four §4-Option-A target locations (Decision 2(c) line 73, Pre-Flight item 14 line 272, §6 step 10 line 296, §11 line 377) now agree. Cross-referencing the four pass-factors against any of these locations returns the same answer. Clean.

---

## Decision 8 (air-cooled rework) audit

The hardware identification is correct (line 172 names Noctua NH-U14S TR5-SP6 on sTR5, Phanteks Enthoo Pro 2 case, ARCTIC P14 PWM 5-pack, and explicitly disclaims the Coreliquid AIO with "There is NO AIO and no liquid pump on rtxserver"). The new CPU thermal-throttle concern is grounded: a 350 W-rated cooler on a 350 W TDP CPU is zero-headroom, and Phase F training workloads (data loader, MoE expert routing dispatch on host, gradient sync) are exactly the regime where simultaneous CPU+GPU saturation occurs. The 95 °C intervention threshold is correct for 7975WX Tjmax (HARDWARE.md line 106 independently confirms). The five characterization steps are mostly executable on this hardware, but step 4's "per-core thermal throttle status (`/sys/devices/system/cpu/cpu*/thermal_throttle/`)" is Intel-specific and not present on this AMD box — see new charge §C. The ramp-test-at-PSU-ceiling concern (1400 W expected total at the test conditions, on a working-assumption 1400 W PSU) is implicitly absorbed by Pre-Flight PF-2's "verify PSU first" gate; the ramp test physically cannot fire until PSU rating is confirmed and per-card cap is set. Reasonable.

## Decision 7 PSU math audit

Internally consistent. New math: 2 × 500 W GPU + 350 W CPU + 50 W system = 1400 W at the working-assumption 1400 W PSU ceiling — "zero slack" is honest replacement for the previous "~50 W slack." The 450 W fallback (if `dmidecode` returns < 1500 W) yields 2 × 450 + 350 + 50 = 1300 W, leaving 100 W slack on a 1400 W PSU and 200 W on a 1500 W. The 450 W number is not derived in the doc but is operationally sound (a ~10% headroom band against transients on the lower-bound assumption); not a charge but a one-line "(100 W slack on 1400 W; 200 W on 1500 W)" parenthetical at line 161 would close the loop. Phase 1's measured 170 W/card peak grounds the first-fire-non-gating carve-out (single-card inference + light tokenization, well below the 200 W/card threshold and far below the regime that exercises CPU); Phase 1 did not heavily exercise CPU (single-process inference + judge), so the carve-out holds.

## machines/rtxpro6000server/HARDWARE.md audit

Sound artifact. Mirrors gpuserver1/HARDWARE.md structure (BoM table → reconnaissance → power profile → cooling profile → quirks → history). Live reconnaissance commands are quoted with output (lines 41-65) and the live-vs-build-doc distinction is honest: CPU/GPU/motherboard/BIOS verified by command output; DRAM speed/PSU rating explicitly marked TBD with the reason (PSU rating not exposed in SMBIOS 3.7 to dmidecode 3.3). The AMD-vs-Intel thermal-throttle interface difference is captured cleanly at line 106 ("there is no `/sys/devices/system/cpu/cpu0/thermal_throttle/` interface on AMD Ryzen / Threadripper — that's an Intel-specific path"). No anthropomorphism. Open quirks section is appropriately humble (PSU rating, fan RPM channels, AMD throttle proxy, DRAM module count). Reasonable to GREENLIGHT this artifact in isolation; the recurring-defect-class issue is on the plan side, not this doc.

---

## New charges

### PROSECUTION-006 §C — Decision 8 step 4 + intervention threshold reference Intel-only `/sys/.../thermal_throttle/` interface that does not exist on this AMD box

#### Evidence

PHASE-2-RESEARCH-PLAN.md Decision 8 step 4 (line 184):

> Capture: GPU temp + power per card, CPU package temp, CPU package power (`perf stat -e power/energy-pkg/`), per-core thermal throttle status (`/sys/devices/system/cpu/cpu*/thermal_throttle/`), at 5-second resolution.

PHASE-2-RESEARCH-PLAN.md Decision 8 CPU intervention threshold (line 187):

> if CPU package temp climbs past 95 °C OR per-core thermal throttle counter increments during the test, the 7975WX has hit its cooler ceiling

machines/rtxpro6000server/HARDWARE.md (line 106):

> there is no `/sys/devices/system/cpu/cpu0/thermal_throttle/` interface on AMD Ryzen / Threadripper — that's an Intel-specific path. AMD throttle status surfaces as Tctl pinning at the operating limit (95 °C for 7975WX) without further temperature rise even as power draw stays high. The throttle signal is therefore "Tctl saturates at ~95 °C with sustained power" rather than a counter increment.

machines/rtxpro6000server/HARDWARE.md open quirks (line 126):

> No `/sys/devices/system/cpu/cpu*/thermal_throttle/` on AMD — Phase 2 plan Decision 8's "per-core thermal throttle counter increments" check needs an AMD-specific equivalent (Tctl saturation at ~95 °C is the proxy signal).

#### Why this is a defect

The two documents were authored together in this revise pass. HARDWARE.md correctly identifies the Intel-only sysfs path and proposes the AMD proxy (Tctl saturation at 95 °C with sustained power draw). PHASE-2-RESEARCH-PLAN.md Decision 8 still cites the Intel-only sysfs path as the capture target AND uses "per-core thermal throttle counter increments" as one of two intervention triggers. An implementing agent following Decision 8 step 4 will either fail to find the file (silent miss; the OR branch of the intervention threshold becomes unreachable) or worse, look at `/proc` or `/sys` cousins and capture the wrong signal. HARDWARE.md flags the issue in its own open-quirks list ("Phase 2 plan Decision 8's [check] needs an AMD-specific equivalent") — i.e., the orchestrator knew the plan was wrong while writing HARDWARE.md and did not patch the plan. This is the co-located-label-mismatch defect class (Cato-002 §1, Cato-003, Cato-004 §3, Cato-005 §A §B) recurring at the AMD/Intel boundary, between two documents authored in the same pass.

The 95 °C OR-clause-only path is technically not silently broken — Tctl saturation at 95 °C will trigger the "package temp climbs past 95 °C" branch — but the defect is still load-bearing because (a) HARDWARE.md says the AMD signal is "Tctl pinning at the limit *without further temperature rise*," meaning a literal "climbs past 95 °C" reading may never fire (the signal is "Tctl pegs at 95 °C and stays there even as power stays high"); the plan needs to specify "Tctl reaches AND sustains 95 °C with sustained CPU power draw" or equivalent. (b) The capture target itself is unreachable, so any post-hoc forensic question — "did the CPU throttle during the ramp?" — has no logged data to answer it.

#### Proposed patch

PHASE-2-RESEARCH-PLAN.md Decision 8 step 4 line 184: change the capture-target clause from

> per-core thermal throttle status (`/sys/devices/system/cpu/cpu*/thermal_throttle/`)

to

> AMD throttle proxy signal (Tctl from `sensors k10temp-pci-00c3` sustaining at ~95 °C with continued CPU power draw; plus per-CCD frequencies via `cpupower frequency-info` to confirm boost is sustained vs derated — AMD has no `/sys/.../thermal_throttle/` interface, see `machines/rtxpro6000server/HARDWARE.md`)

PHASE-2-RESEARCH-PLAN.md Decision 8 line 187: change the CPU intervention threshold from

> if CPU package temp climbs past 95 °C OR per-core thermal throttle counter increments during the test

to

> if CPU Tctl reaches and sustains 95 °C with continued CPU power draw OR per-CCD boost frequency derates below base clock during the test

One ~6-line edit; closes the cross-document drift between Decision 8 and HARDWARE.md.

---

## Closing

Cato-005's two patches are clean. The Decision 8 air-cooled rewrite is substantively honest about the new thermal regime, and the new HARDWARE.md is a sound mirror of gpuserver1/HARDWARE.md. The AMD/Intel `thermal_throttle` mismatch is a single recurrence of the co-located-label-mismatch defect class — the orchestrator caught it once (in HARDWARE.md and HARDWARE.md's own open quirks) and missed propagating the fix back to the plan, which is the inverse of the v1.1 / Cato-005 pattern but the same structural class.

Trajectory: 18 → 5 → 4 → 6 → 2 → 1. The narrowing continues. One charge is the smallest non-zero count in this sequence; the orchestrator is converging on GREENLIGHT but the recurrent defect class remains the only thing standing between this plan and fire-ready. Cato-005's closing recommendation — a single-source-of-truth document with anchor-cited references for thresholds and hardware-specific commands — would terminate this class. Until that exists, the next revise pass should manually grep both documents for any Intel-specific or hardware-specific assertion before declaring done.

Patch §C; expect GREENLIGHT from Cato-007 or whoever spawns next. Not a Phase 2 first-fire blocker (Phase 2 first-fire is single-card inference and does not exercise the CPU+GPU simultaneous regime where this defect bites); but it IS a Phase F precondition blocker, and Phase F is downstream of greenlight.

— cato-006 (external adversarial reviewer), 2026-04-26
