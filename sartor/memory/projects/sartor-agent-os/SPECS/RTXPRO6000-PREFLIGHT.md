---
type: spec-stub
spec_id: RTXPRO6000-PREFLIGHT
status: pending-build
plan_ref: PLAN-FINAL §3.B5, §3.D1 (gating)
target_path: machines/rtxpro6000server/preflight/
owner: rtxpro6000server peer Claude (executor); Rocinante curator (review + sign-off ingest)
updated: 2026-04-25
related: [PLAN-FINAL, NEURVATI-FIREWALL, OUT-OF-BAND-FALLBACK, VASTAI-DISPATCH-WRAPPER]
---

# Spec — rtxpro6000server pre-flight checklist

Mandatory before any sustained-load fine-tune on rtxpro6000server. Closes the dual-card sag/AER risk surfaced during the 2026-04-22 bring-up. Gates D1 (Experiment 001).

## Steps (in order)

**(a) 30-min sustained dual-GPU stress test.**
- Recommended tool: `gpu-burn` (compile from `https://github.com/wilicc/gpu-burn`) run as `gpu-burn -d 1800` on each card concurrently, OR a PyTorch dual-GPU benchmark (e.g., `torch.utils.benchmark` matmul harness on both cards via `device_map='auto'`).
- Both cards must hold load for the full 30 min; any process crash, hang, or driver reset aborts.

**(b) Junction temperatures logged via `nvidia-smi`.**
- Background: `nvidia-smi --query-gpu=index,timestamp,temperature.gpu,temperature.memory,clocks.sm,clocks.mem,power.draw --format=csv -l 5` for the duration of the stress test.
- Output written to `machines/rtxpro6000server/preflight-YYYY-MM-DD.log`.

**(c) Sag-bracket re-torque (physical action).**
- Performed by Alton at the chassis. Bracket addressed the 2026-04-22 DPC-trip when the slot was bumped. Alton signs the log: name + ISO timestamp at the bottom of the same `preflight-YYYY-MM-DD.log`.

**(d) AER counters baselined to zero.**
- Pre-test: `lspci -vvv -s c1:00.0 | grep -iE 'aer|corrected|fatal|nonfatal'` and same for `e1:00.0`.
- All counters must read zero before stress start. If non-zero: clear via `setpci` then re-verify, or abort and investigate.
- Post-test: re-read AER. Any non-zero count is an abort.

**(e) Abort thresholds (any one fires → abort + flag):**
- Junction temp >88°C sustained (>30s).
- Any AER count (corrected, non-fatal, or fatal) increments.
- Any XID error in `dmesg` during the run.
- Any driver reset or GPU disappearance from `nvidia-smi`.

## Owner and review path

- **Executor:** rtxpro6000server peer Claude runs the script and authors the log.
- **Reviewer:** Rocinante curator pulls the log via inbox, verifies all five exit conditions met, and signs the bottom of the file as "Reviewed by curator on YYYY-MM-DD."
- **Final sign:** Alton's signature on (c) is the human-in-the-loop confirmation.

## Exit criterion

A signed log committed to `machines/rtxpro6000server/preflight/preflight-YYYY-MM-DD.log` with: 30-min stress completion timestamp, full nvidia-smi log, AER pre/post zeros, no XID lines, sag-bracket signature line from Alton, and curator-review line from Rocinante. Until that file exists and validates, no D1 fine-tune fires (PLAN-FINAL §3.D1 gating).

## Build dependencies

- Depends on rtxpro6000server peer Claude having Claude Code CLI installed and OAuth working (already done 2026-04-22 per memory history).
- Depends on inbox flow from rtxpro6000server → Rocinante being up (existing inbox/ pattern).
- Depends on B5 schedule — first eligible date 2026-05-22 per PLAN-FINAL §3.B5 ("Blackwell stays standby until 2026-05-22").
- Cross-reference: STATE.md records pre-flight pass/fail as the gate for D1; VASTAI-DISPATCH-WRAPPER explicitly excludes this machine ("No pricing autonomy on this asset in v1.0").
