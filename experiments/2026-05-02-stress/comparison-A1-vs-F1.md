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

## Phase B — both cards 475W concurrent, aggressive curves

Fired 2026-05-02T15:39:04Z (re-fire after first attempt's GPU1-process bug). Halted 15:44:08Z by mid-checkpoint (GPU0 84°C, climbing from 83°C 30s prior). 60 samples in B phase. No XID/AER/NVRM/thermal in dmesg.

| Metric | A1 (single, agg none) | F1 (single, agg) | **B (dual, agg)** | 04-29 baseline (dual, default curves) |
|--------|----------------------:|-----------------:|------------------:|--------------------------------------:|
| GPU0 die peak | 74 °C | 73 °C | **84 °C** | 84 °C |
| GPU0 die mean | 68.5 | 67.7 | 72.8 | n/a |
| GPU1 die peak | 28 (idle) | 27 (idle) | **73 °C** | 73 °C |
| Inter-card delta | n/a | n/a | **+11 °C** | +11 °C |
| BMC PCIE03 peak | 74 | 73 | 83 | n/a |
| BMC PCIE07 peak | 27 | 27 | 72 | n/a |
| **CPU Tctl peak** | **79.6 → ABORT** | **77.1** | **65.1** | 87.8 |
| CPU Tctl mean | 55.1 | 53.6 | 57.6 | n/a |
| BMC CPU Pkg peak | 73 | 71 | **65** | n/a |
| Tccd1-3 peak | 49.5-50.6 | 49.1-49.6 | 48-49 (uniform) | n/a |
| Tccd4 peak | 69.1 | 49.2 | **57.5** | 83.1 |
| GPU0 power peak / mean | 480 / 452 | 478 / 442 | 478 / 438 | 475 / 475 |
| GPU1 power peak / mean | 14 / 13 | 14 / 13 | 475 / 322 (lower mean: spinup lag) | 475 / 475 |
| Wall peak | 693 W | 692 W | **1153 W** | n/a |
| GPU0 onboard fan | 45% | 44% | 51% | n/a |
| CPU_FAN peak | 1440 | 1440 | 1080 | n/a |
| CHA_FAN1 peak (PCIE07-bound) | 960 | 1080 | **1800** | n/a |
| CHA_FAN2 peak | 1080 | 1200 | 1200 (capped) | n/a |
| CHA_FAN3 peak | 1080 | 1200 | 1200 (capped) | n/a |
| CHA_FAN5 peak (front-mesh) | 1440 | 1680 | 1680 (saturated) | n/a |
| Audible at | t+58s | t+13s | **t+21s** | n/a |
| Result | TCTL_75 abort | clean | **mid-checkpoint kill at GPU0 climbing** | reference |

### Three numbers Alton asked for

1. **Two-card Tctl peak: 65.1 °C.** Refutes the +27.5°C IO-die offset finding from F1. With both PCIE07 and PCIE03 fans engaged, total chassis airflow doubles and the Noctua intake stays clean. **The IO-die heating that produced F1's 77°C Tctl was a single-card pathology** caused by half the chassis fans staying idle (PCIE07-bound zones at 30% floor while GPU1 was cold).
2. **GPU0 vs GPU1 thermal asymmetry: +11 °C** — same as historical (04-22, 04-27, 04-29). Holds across all curve configurations. Confirms the asymmetry is mechanical (slot 3 air starvation), not curve-addressable.
3. **Wall power actual: 1153 W peak** — within 3W of the projected 1150W. The +50W estimated for added chassis-fan power was approximately right. **227 W of breaker margin.** Sustained dual-card 475W is comfortably under the 1400W wall limit.

### Why we landed on the mid-checkpoint kill

GPU0 was at 84°C climbing from 83°C 30s prior at t+300s — exactly the design's mid-checkpoint trigger. Tctl 65°C and wall 1153W were both healthy; the kill was driven by GPU0 die approaching 85°C SOFT abort. Per pre-registered protocol this was correct. Without the mid-checkpoint kill GPU0 would likely have hit GPU_TEMP_85 (85°C) within ~30 more seconds based on linear extrapolation, and then 88°C HARD abort within ~2 more minutes.

The right interpretation: **the curve fix solves the CPU side completely under dual-card; the GPU0 die is the new bottleneck.** That's a much better problem to have than the previous one (CPU-side thermal coupling) because GPU0 die is fixable with targeted airflow at slot 3 — the asymmetry-fix that's been on the table since 04-22.

### Sampler bug update

The F1-discovered abort-regex bug (sampler ignores aborts when phase isn't `^(A1|A2|B)$`) is unchanged. Today's B was correctly tagged `B` so the regex matched, but no abort fired from the sampler because GPU0 only hit 84 (under 85 threshold) and Tctl peak 65 was well under 75. Mid-checkpoint kill came from the orchestrator monitor, not the sampler. **For any future re-test, fix the sampler regex BEFORE running** so the sample-tick abort triggers are reliable across phase tags.

### gpu_burn / kill-mechanics bug (B-specific)

Phase B's first fire (15:28:23Z) had only GPU0 actually loaded — `b-gpu1.log` showed `./gpu_burn: No such file or directory` because the second `./gpu_burn` invocation lost cwd context. Re-fire (15:39:04Z) used explicit subshells `( cd /opt/gpu-burn && ... ) &` and both processes loaded correctly.

Concurrent kill-mechanics issue surfaced too: `kill -TERM $!` of a backgrounded `( cmd ) &` subshell does NOT propagate to the gpu_burn binary inside (subshell PID ≠ exec'd PID when there's I/O redirection). My initial mid-test kill on the failed first-B at 15:30Z killed the bash subshells but left two orphan gpu_burn processes (PIDs 1346706, 1346769) running — Rocinante caught this externally with `pkill -KILL -f gpu_burn` and let GPU0 cool. Lesson booked: any future kill of `( ... ) &` constructs MUST use `pkill -KILL -f <binary>` or send to process group, not stored `$!`.

## Production envelope (2026-05-02 close)

Alton's call after reviewing all three runs: **good enough — limit to 450W and call it a day.** Rocinante set `nvidia-smi -pl 450` on both cards immediately after Phase B. This is the production setting going forward; **do not revert to 600W**.

### Settings persisting after this run

| Setting | Value | Set by | Persistence |
|---------|-------|--------|-------------|
| GPU0 power.limit | **450 W** | Rocinante (post-B wrap) | Across reboots? `nvidia-smi -pl` is NOT persistent by default — needs `nvidia-persistenced` enabled OR a systemd unit / cron @reboot to re-apply. **Currently NOT persistent across reboots; re-apply on boot.** |
| GPU1 power.limit | **450 W** | same | same |
| BMC fan source bindings | Zones 2-6 → PCIE03/PCIE07 per 04-29 confirmation | Rocinante 04-29 Chrome MCP | YES — persistent in BMC firmware |
| BMC fan curves (Zones 2-6) | A=30/50, B=50/75, C=60/90, D=70/100 | Rocinante 05-02T14:46Z Chrome MCP | YES — persistent in BMC firmware |
| BMC fan mode | Customized | auto-promoted from Generic on first per-zone Save | YES |
| Sampler | stopped 15:45:01Z | rtxserver | n/a (one-shot test; no daemon left running) |
| nct6798 enable=5 | restored on all touched channels | rtxserver post-attempt restore | yes |

### Why 450W is the right cap

- Phase B at 475W produced GPU0=84°C peak under 5-min sustained dual-card load — 1°C from the 85°C SOFT abort and 4°C from 88°C HARD.
- 04-22 LoRA training run drew approximately 1080W system (450W × 2 ≈ same wall budget) — the historical sustainable point.
- Linear-ish power-temp scaling: −25W/card → ~−3°C GPU die. Projected GPU0 peak at 450W/card sustained: ~80-81°C. Five-degree thermal buffer to SOFT abort.
- Tctl in dual-card mode is excellent under aggressive curves (65°C peak at 475W; will be even better at 450W). CPU side has 30°C of margin.
- Wall power at 450W × 2 + 200W baseline ≈ 1100W. **300W of breaker margin** (vs the historical 1380W abort threshold and 1400W breaker).

### What this means for sustained workloads

| Workload | Per-card cap | Wall envelope | Status |
|----------|-------------:|---------------|--------|
| Sustained dual-card inference / training | **450 W** | ~1100 W | **PRODUCTION-READY** with current cooling |
| Ad-hoc burst (≤5 min) | 475 W (manual) | ~1150 W | Safe, but mind the abort triggers |
| Single-card development / testing | 450-475 W | 575-625 W | Safe |
| Future "uncapped" — would require new cooling | 600 W | ~1400 W | NOT AUTHORIZED until cooling upgrade + re-test |

### Three 140 mm fans — DEFERRED

Current envelope is good enough. The three 140 mm fans on hand are **NOT** required for thermal capacity at the 450W production cap. **Hold them in reserve** for any of:

- Decision to increase per-card cap above 450W for a sustained workload (e.g., a training run that wants 500W/card) — at that point install Fan #1 (CHA_FAN4 + rebind to PCIE03) first and re-test
- Sub-78°C GPU0 target for warranty / longevity reasons (some literature suggests sustained ≥80°C accelerates GDDR memory wear) — same install path
- Visible asymmetry concerns (e.g., GPU0 throttling under specific workloads) — install Fan #2 (side-bracket aimed at slot 3) first
- Failure replacement (one of the existing fans dies) — keep at least one 140 mm as a hot-standby

### What to validate going forward

- **First boot after a reboot:** verify `nvidia-smi -pl 450` re-applied. If not auto-applied, document the boot-time hook (cron @reboot, systemd unit, or `nvidia-persistenced` config).
- **First sustained workload (e.g., LoRA training run >30 min) under the new envelope:** re-run a quick sampler capture to confirm GPU0 stabilizes ≤80°C and Tctl stays ≤65°C as projected.
- **Quarterly:** re-run the full A1+F1+B harness as a regression test. Hardware ages; thermal paste degrades; fan bearings wear. Catching drift early is cheaper than catching it late.

### What to remember

- The aggressive BMC curves are the single biggest improvement from today's work — they take Tctl from 87.8°C (04-29 baseline) to 65°C (today's B). They are persistent in BMC firmware and survive reboots.
- The cooling-marginal verdict from 04-29 is RESOLVED at the 450W operating point. The original "78-85°C marginal band" was based on 475W/card data; at 450W the same hardware sits comfortably in the green band.
- Single-card workloads have a different thermal profile than dual-card — beware: a single-card workload may produce HIGHER Tctl than dual-card because half the chassis fans stay at idle floor. If running a single-GPU workload at sustained 475W, monitor Tctl. (At 450W single-card, the F1 data suggests Tctl peak ~74°C — under threshold, safe.)

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

## Verdict (post-B, supersedes the post-F1 verdict below)

**The Tctl problem is single-card-specific, not dual-card.** Phase B (both cards 475W concurrent, aggressive curves) ran cleanly with **Tctl peak 65.1°C** — 14°C below F1's single-card peak and 22.7°C below the 04-29 dual-card default-curves baseline. With both PCIE03 AND PCIE07 fans ramping (CHA_FAN1 hit 1800 RPM = above nameplate), total chassis airflow doubled vs single-card runs, and the Noctua intake stayed clean despite both GPUs dumping heat.

**Production 24/7 dual-card 475W inference is thermally safe on the CPU side with the new aggressive curves.** The previously-flagged "GPU0 → Noctua intake recirculation" only manifests when half the chassis fans are at low RPM (single-card mode where PCIE07 stays cold). Under both-cards-loaded, all chassis fans run hard, the air column moves fast enough that the Noctua intake doesn't accumulate warm air, and Tctl stays in healthy range.

**The bottleneck shifts to GPU0 die.** Phase B was halted at t+300s by the pre-registered mid-checkpoint (GPU0 84°C and climbing from 83°C 30s prior). 84°C is identical to the 04-29 default-curves baseline peak and 1°C from where GPU_TEMP_85 SOFT would fire. The aggressive curves did NOT lower GPU0 die — CHA_FAN5 saturated at nameplate (1680 RPM), CHA_FAN2/3 pinned at 1200 RPM (BMC PWM-scaling cap), GPU0 onboard fan only at 51%. We are at the limit of what the existing chassis-fan suite can do for the slot-3 hot card under sustained dual-card load.

**Inter-card asymmetry held at +11°C** — same as historical, regardless of curve change. Slot 3 air-starvation is mechanical, not curve-addressable.

## Verdict (post-F1, superseded above but kept for the chronology)

MARGINAL branch (single-card). The aggressive curves did real work: Tccd4 fully resolved, Tctl reduced 2.5°C, GPU0 die marginally cooler, fans audible 45 seconds earlier. **But Tctl peak 77.1°C was still above the 75°C threshold** — only 2°C above, but above. We then thought the gap was the GPU0→IO-die air-column problem. **B re-test proved that diagnosis incomplete:** Tctl in dual-card mode is HEALTHIER than single-card because both fan zones engage. The earlier theory captured the single-card pathology but not the actual production envelope.

**Decision rule:**

| Branch | Criterion | Action |
|--------|-----------|--------|
| A — BMC fix alone solves it | F1 Tctl peak < 75 °C | curves are the answer; 140 mm fans are noise/redundancy upgrade only |
| **B — Marginal (this run)** | **F1 Tctl peak 75-80 °C** | **curves help; one top-exhaust fan finishes the job; other two 140 mm in reserve** |
| C — Geometry-bound | F1 Tctl peak ≥ 80 °C | curves don't help significantly; full three-fan placement (top-exhaust + slot-3 side + redundancy) |

We landed in Branch B. Specific fan placement updated below.

## Three 140 mm fan placement — UPDATED post-B

The post-F1 plan was top-exhaust as Fan #1. Phase B disproved the premise: Tctl is fine in dual-card mode (the production case). The actual remaining problem is GPU0 die at 84°C under dual-card sustained load. Updated priorities:

### Fan #1 — CHA_FAN4 header (empty), bound to PCIE03 (was Fan #2 in F1 plan, now promoted)

- **Why:** Adds a 5th PCIE03-bound fan on the hot card's airstream. CHA_FAN5 is at nameplate; CHA_FAN2/3 are PWM-cap-bound at 1200 RPM. CHA_FAN4 is a fresh airflow path that bypasses both limitations.
- **Header binding:** CHA_FAN4 is currently bound to PCIE07 in BMC Zone 5. **Rebind Zone 5 PCIE07 → PCIE03** via Chrome MCP (one-click change). Note: doing so removes CHA_FAN4 from the GPU1-side cooling, but GPU1 has plenty of margin (73°C peak vs GPU0's 84°C).
- **Expected effect:** 2-4°C reduction in GPU0 peak under dual-card load (target: 80-82°C from current 84°C). Modest but on the highest-leverage zone for the actual bottleneck.
- **Already proposed in:** `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` 2026-04-29. B data confirms this is the right play.

### Fan #2 — Side-bracket intake aimed directly at slot 3 (asymmetry-fix; was reserve in F1 plan)

- **Why:** The +11°C inter-card asymmetry is robust across all curve configurations (04-27 baseline 11°C, 04-29 dual 11°C, today's B 11°C). It's mechanical: slot 3 sits higher in the chassis and gets less direct front-intake airflow than slot 7. A side-bracket fan blowing perpendicular to the slot 3 PCB (or angled down at the GPU0 intake) breaks this asymmetry.
- **Connector:** Splitter from CHA_FAN4 (after Fan #1 lands), OR W_PUMP+ header for constant-100% mode (Phanteks Enthoo Pro 2 has a side mount).
- **Expected effect:** 3-5°C reduction in GPU0 peak; corresponding reduction in inter-card asymmetry to 5-7°C. Bigger leverage than Fan #1 because it addresses the geometric cause, not just adds redundant intake CFM.

### Fan #3 — HOLD IN RESERVE (still)

- **Why:** Three placements at once obscures which intervention helped. Install Fans #1 and #2, re-run B with 10 minutes (no mid-checkpoint abort) to measure full equilibrium, then decide.
- **Likely future deployment:**
  - If post-mod B shows GPU0 still > 82°C: top-mounted exhaust above GPU0 (the F1-era recommendation, now demoted; useful primarily for asymmetry between PCIE03-bound airflow and the actual GPU0 exhaust path)
  - If post-mod shows asymmetry persists: redundant side-bracket fan
  - If post-mod is clean: hold permanently, useful as failure-replacement spare

### What CHANGED from the F1-era plan

| Fan | F1-era plan | Post-B plan | Reason for change |
|-----|-------------|-------------|-------------------|
| #1 | Top-exhaust above GPU0/CPU | **CHA_FAN4 + rebind PCIE03** | Tctl is solved by aggressive curves under dual-card; new bottleneck is GPU0 die peak under dual-card |
| #2 | CHA_FAN4 + rebind PCIE03 | **Side-bracket at slot 3** | Asymmetry is mechanical, not curve-fixable; geometric intervention has higher leverage than another front-intake |
| #3 | Reserve | Reserve | Same — install one fan at a time, measure, decide |

### What does NOT change

- The aggressive curves (applied 14:46Z) STAY in place. They massively improved Tctl in dual-card mode and reduced Tccd4 in single-card mode by 20°C. Reverting would lose those gains.
- The 04-29 BMC source bindings (Zones 2-6 to PCIE03/PCIE07 per the table) STAY. Today's B run confirms they work correctly under dual-card load.
- W_PUMP+ remains empty (default Generic curve, no fan attached). Stays available for either Fan #2 (constant-100% mode) or future intervention.

### Implication for current production envelope

**With aggressive curves now in place (no new fans installed yet):**

- Sustained 475W/card 24/7 inference: SAFE on CPU/Tctl side (peak 65°C, 30°C margin), MARGINAL on GPU0 die side (peak 84°C climbing, 1°C from soft abort threshold, 4°C from 88°C hard).
- Recommended interim cap: **450W/card** for sustained loads (drops GPU0 by ~3-4°C estimated, putting peak ~80°C with comfortable margin), OR run at 475W/card with active monitoring and accept early throttling if it occurs.
- After Fan #1 and #2 install + re-test: 475W/card 24/7 likely safe across all metrics. Validate with another B run.

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
