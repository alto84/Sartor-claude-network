---
name: bmc-binding-applied-2026-04-29
description: Confirmation that BMC fan source bindings + 4-point curves were applied to rtxpro6000server per the proposal in PHONE-HOME-bmc-fan-source-bindings-proposal.md. Drove ASMB11-iKVM web UI from Rocinante via Chrome MCP because no programmatic IPMI path was available. rtxserver should now pull origin and execute experiments/2026-04-29-post-bmc-binding-stress/run.sh to validate.
type: bmc-config-applied
date: 2026-04-29
applied_by: Rocinante Opus 4.7 (Chrome MCP)
applied_at: 2026-04-29T12:50:00Z
target_machine: rtxpro6000server
target_bmc: ASMB11-iKVM v2.1.30 at https://192.168.1.156
status: applied-and-verified
related:
  - inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal
  - machines/rtxpro6000server/BMC
  - experiments/2026-04-29-post-bmc-binding-stress
tags: [meta/confirmation, machine/rtxpro6000server, bmc, hardware/cooling]
---

# BMC fan source bindings + curves — APPLIED

## Final config (read back from BMC after Save+reload)

### Source bindings

Verified via the Temperature Source page after page reload. All persisted to BMC firmware:

| Zone | Header | Sensor source | Backing select.value | Visible label |
|------|--------|---------------|----------------------|---------------|
| 1 | CPU_FAN, CPU_OPT | (immutable) | n/a | CPU Package Temp |
| 2 | CHA_FAN1 | PCIE07 Temp | 17 | PCIE07 Temp |
| 3 | CHA_FAN2 | PCIE03 Temp | 13 | PCIE03 Temp |
| 4 | CHA_FAN3 | PCIE03 Temp | 13 | PCIE03 Temp |
| 5 | CHA_FAN4 | PCIE07 Temp | 17 | PCIE07 Temp |
| 6 | CHA_FAN5 (MEGACOOLs) | PCIE03 Temp | 13 | PCIE03 Temp |
| 7 | W_PUMP+ | CPU Package Temp (default, untouched) | 0 | CPU Package Temp |

### 4-point curves

Verified via the Customized page after page reload. All Zone 2-6 persisted with target curve:

| Point | Temp (°C) | Duty (%) |
|-------|-----------|----------|
| A | 30 | 30 |
| B | 55 | 50 |
| C | 70 | 80 |
| D | 80 | 100 |

Zone 1 left at original Generic-mode curve (20/20, 45/40, 65/70, 70/100).
Zone 7 (W_PUMP+) left at original Generic-mode curve (20/100, 45/100, 60/100, 70/100) — it's an empty header.

### Auto mode now reads "Customized mode"

Saving any per-zone curve auto-promotes the BMC's overall fan mode from `Generic mode` to `Customized mode`. Confirmed on the Auto mode page: "Current mode is Customized mode" with no preset radio button selected. This is the desired state — the per-zone Customized curves are authoritative.

## Empirical effect at idle (verified via in-band ipmitool)

Pre-config (from morning baseline reading, all zones bound to CPU Package Temp):
- CPU 36 °C, fans: CHA_FAN1=720, CHA_FAN2=960, CHA_FAN3=840, CHA_FAN5=600

Post-config:
- CPU 40 °C, PCIE03 31 °C, PCIE07 28 °C
- Fans: CHA_FAN1=600, CHA_FAN2=480, CHA_FAN3=480, CHA_FAN5=600

Fan RPMs are LOWER at idle because PCIE temps sit at the curve's 30 % floor while CPU was previously driving them higher. This is correct behavior — fans now respond to GPU heat (the heat we actually care about), and at idle the GPUs aren't producing heat, so fans drop. Under load, expectation is the opposite: GPU-bound fans ramp aggressively when PCIE03 climbs, while previously the CPU-bound fans would only ramp if CPU also got hot (decoupled from GPU heat).

## Application path notes (for the future-scripting interface)

The BMC web UI uses a custom `multiple-checkboxes` widget for the Temperature Source dropdowns (NOT Select2 despite jQuery's selectpicker availability). The underlying `<select>` element accepts programmatic `.value =` assignment, but the visible button only updates if the wrapper's checkbox elements are clicked (the framework listens on checkbox click, not select change).

For the Customized curves, each zone has 8 inputs with duplicate IDs (`A_X`, `A_Y`, `B_X`, `B_Y`, `C_X`, `C_Y`, `D_X`, `D_Y`) — must target by document order (8 inputs per zone × 7 zones = 56 total). Each zone has its own Save link.

Save success confirmed via JS-overridden `window.alert`:
- `Zone3(CHA_FAN2) Save data done!`
- `Zone4(CHA_FAN3) Save data done!`
- `Zone5(CHA_FAN4) Save data done!`
- `Zone6(CHA_FAN5) Save data done!`

Zone 2 (CHA_FAN1) saved cleanly on the first attempt before the alert dialog froze the page. Subsequent saves (zones 3-6) only landed after installing a `window.alert` no-op override. **Future scripted access from rtxserver-side ipmitool would still need the raw IPMI command (NOT FOUND for ASUS); for now Web UI from Rocinante remains the actuator path.**

POST body wasn't formally captured in DevTools network inspector — the page froze on the first attempt before I could click into Network panel. The alert messages confirm save success per zone, which is what matters operationally. If you want the POST body for future scripting, capture it next time someone makes a curve edit and route it through DevTools.

## Lockout-risk subset

UNTOUCHED, as required:
- Network Settings: not modified
- User Management: not modified (admin password unchanged from what Alton set yesterday)
- Services: not modified
- System Firewall: not modified
- IPMI Interfaces: not modified

BMC remains reachable at https://192.168.1.156. SSH to rtxserver works. In-band ipmitool works.

## Next action — for rtxserver Claude

1. `git pull --rebase origin main` to fetch this confirmation file.
2. Execute `experiments/2026-04-29-post-bmc-binding-stress/run.sh` (the staged stress harness from commit 7f2756e).
3. Compare results to `experiments/2026-04-27-thermal-baseline/samples.jsonl` per the decision rule in PHONE-HOME-bmc-fan-source-bindings-proposal.md:
   - GPU0 peak < 78°C and inter-card delta ≤ 5°C → existing fan suite is sufficient.
   - 78°C ≤ GPU0 peak < 85°C → marginal; recommend an extra fan in CHA_FAN4 (Zone 5).
   - GPU0 peak ≥ 85°C OR throttle → recommend water cooling on GPU0.
4. Write `experiments/2026-04-29-post-bmc-binding-stress/comparison.md`.
5. Append "History" entry to `sartor/memory/machines/rtxpro6000server/BMC.md` documenting the applied source bindings + curves.
6. If the cooling-upgrade decision is forced by the data, file `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` with the recommended path.

Stress test budget: 5-10 min (one ramped run is enough). 475W power cap per card per the established protocol (`thermal_stress.py` should already use `nvidia-smi -pl 475` or be the staged `run.sh`).

Ready for stress.
