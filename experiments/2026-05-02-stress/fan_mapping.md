# Fan mapping (compiled from BMC.md, HARDWARE.md, flower-fans-conversion notes)

| BMC sensor | Physical fan(s) | Location | Bound to | Notes |
|------------|-----------------|----------|----------|-------|
| CPU_FAN | Noctua NH-U14S TR5-SP6 (140mm) | CPU tower, front-of-case-facing intake | CPU Pkg | Threadripper Pro 7975WX cooler. Vulnerable to GPU exhaust impingement → Tccd4. |
| CHA_FAN1 | 1× ARCTIC P14 PWM | Front intake near GPU1 (slot 7) | PCIE07 | Per BMC.md: "front intake covers it [GPU1]" |
| CHA_FAN2 | 1× ARCTIC P14 PWM | Mid-chassis | PCIE03 | |
| CHA_FAN3 | 1× ARCTIC P14 PWM | Mid-chassis | PCIE03 | |
| CHA_FAN4 | empty header | n/a | PCIE07 | proposed location for the 5th P14 / first new 140 mm |
| CHA_FAN5 | **3× Super Flower MEGACOOL on splitter** | **Front-mesh "flower" array** | PCIE03 | **The big front intake.** Pre-conversion: 12V switch always-on. Post-conversion (date unknown but before 2026-04-29): on CHA_FAN5 splitter, single tach return. Highest cumulative airflow of any zone. |
| W_PUMP+ | empty | n/a | CPU Pkg (default) | empty header |
| USB4_FAN | small high-RPM fan | M.2 area | n/a (own controller) | always 4500-5000 RPM |
| M.2_FAN | small high-RPM fan | M.2 area | n/a (own controller) | always 4000-4500 RPM |

## Key interpretive points for fan-placement analysis

1. **CHA_FAN5 is the high-leverage front intake.** Three fans on one splitter, sharing one tach. If CHA5 reads 1500 RPM, the array is pushing significant CFM. The 3-fan array is what defends the GPU0 (slot-3 hot card) from upstream-stale air.

2. **CHA_FAN1 is the secondary front intake, bound to the cool card.** During GPU0-solo (A1), CHA_FAN1 should NOT ramp. During GPU1-solo (A2), it SHOULD. During both-card (B), it ramps because PCIE07 climbs.

3. **CHA_FAN2/3 are mid-chassis bound to GPU0.** They reinforce the front intake's job for the hot card.

4. **CHA_FAN4 is empty.** Critical for fan-placement analysis: if Alton has three 140 mm fans on hand, CHA_FAN4 is the obvious slot for one of them.

5. **No rear/top exhaust fans on motherboard headers.** Per HARDWARE.md "Front intake + rear/top exhaust default airflow" — the rear/top exhaust fans, if any, are likely on the case's stock fan-hub or a Phanteks PWM hub, not the motherboard. This means we have no tach visibility into them. If the case has stock rear/top exhaust, they may be running at a fixed speed independent of the BMC. Verify physically.

## "Front intake saturation" question

Per the addendum: are the front intakes saturated under peak load?

For BMC-bound fans: they reach 100% duty when the bound PCIE temp ≥ 80°C (curve Point D). RPM at 100% duty is fan-dependent (ARCTIC P14 ≈ 1700 RPM nameplate; MEGACOOLs unknown spec). So the empirical question is:

- Does any front-intake-attributable fan (CHA_FAN1 or CHA_FAN5) reach its RPM ceiling under sustained 475W load?
- Is there evidence that EVEN WITH duty=100%, the airflow is insufficient to keep PCIE03 below 80°C?

The 04-29 stress already shows: PCIE03 hits 83°C at sustained dual-card 475W, and Point D = 80°C. So fans were at 100% duty and STILL the temperature climbed past 80°C. That's saturation.

This run will reconfirm under solo conditions, and quantify the per-card contribution.
