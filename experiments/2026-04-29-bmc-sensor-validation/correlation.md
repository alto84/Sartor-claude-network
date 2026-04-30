---
name: bmc-sensor-validation-2026-04-29
description: Empirical validation that BMC PCIE03/PCIE07 temperature sensors track the same physical GPU dies that nvidia-smi reports for GPU0/GPU1. Idle-state sample. Confirms architectural assumption from BMC.md before binding fan curves to those sources.
type: experiment-result
date: 2026-04-29
duration_s: 30
sample_count: 15
state: idle
---

# BMC sensor validation — PCIE03/PCIE07 vs nvidia-smi (idle)

## Goal

BMC.md claims PCIE03 Temp = GPU0 (slot 3, hot slot) and PCIE07 Temp = GPU1 (slot 7, cooler slot). Before authorizing fan curves keyed to PCIE03/PCIE07, confirm those BMC sensors actually track the same physical GPU dies that `nvidia-smi` reports — not the chipset, not the PCIe slot socket, not some lagging proxy.

## Method

`experiments/2026-04-29-bmc-sensor-validation/sample_loop.sh` — 15 samples over ~110 seconds (each sample = one `nvidia-smi` call + one `sudo ipmitool sensor` call, ~6-8s per iteration). System idle the whole time, no workload, no rentals, no other consumers.

Captured per sample: GPU0/GPU1 die temp + power draw via nvidia-smi, PCIE03/PCIE07 temp via ipmitool, CPU package temp, all six populated chassis fan tachs.

Raw data: `samples.jsonl` (this directory).

## Result — idle correlation

| Source | Min | Max | Mean | StdDev |
|---|---|---|---|---|
| nvidia-smi GPU0 die | 29 | 29 | 29.0 | 0.0 |
| ipmitool PCIE03 | 29 | 29 | 29.0 | 0.0 |
| nvidia-smi GPU1 die | 27 | 27 | 27.0 | 0.0 |
| ipmitool PCIE07 | 26 | 26 | 26.0 | 0.0 |

Differential (paired):
- GPU0 - PCIE03 = 0.0 °C constant (perfect match).
- GPU1 - PCIE07 = +1.0 °C constant (PCIE07 reads 1°C cooler than the die).

## Interpretation

PCIE03 tracks GPU0 die temp exactly at idle. PCIE07 tracks GPU1 with a constant 1°C offset (likely a slot-board sensor sitting outside the package vs the on-die sensor; consistent offset is fine, monotonicity is what matters for fan control). Both sensors are doing what BMC.md claims: reading the GPU's vicinity, not unrelated chipset state.

**Verdict for fan-control binding: PCIE03 and PCIE07 are usable as fan-curve temperature sources for GPU0 and GPU1 respectively.**

Caveat: this is idle-state correlation only. The dynamic-range correlation (PCIE03 vs GPU0 die under 475W load) is the real test. The 5-min thermal stress at 475W/card after the fan-source binding change is what proves the sensors track the die under actual cooling pressure. Idle correlation is necessary but not sufficient — a sensor reading the slot socket would also match at 29°C idle but might lag 10°C under load, which would defeat the whole point. Stress validation is queued for after the BMC fan-source change lands.

## Idle baseline numbers (for reference at the start of the stress test)

| Metric | Value |
|---|---|
| GPU0 idle temp / power | 29 °C / 24 W |
| GPU1 idle temp / power | 27 °C / 14 W |
| CPU package | 39-44 °C |
| CPU_FAN (Noctua) | 600 RPM |
| CHA_FAN1 (front intake) | 720-840 RPM |
| CHA_FAN2 (intake/middle) | 960 RPM |
| CHA_FAN3 (intake/middle) | 840-960 RPM |
| CHA_FAN5 (3× MEGACOOL) | 600-720 RPM |

All chassis fans are running at the bottom of their default Generic-mode curves, which is consistent with idle CPU temp sitting ~40-45°C and PCIE03/PCIE07 both well under 30°C — i.e., curves currently bound to CPU Package Temp aren't being asked to ramp.

## Implication for fan source binding

If chassis fans were already bound to PCIE03/PCIE07 today, they would be running at minimum because GPU temps are 29/26°C. They are running at the same minimum already because the CPU is idle. So the user-visible behavior at idle is identical between the two source-binding choices. The divergence shows up under load — and that's the next experiment.
