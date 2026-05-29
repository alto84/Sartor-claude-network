#!/usr/bin/env bash
# gpu-thermal-guard.sh — host-side dynamic power-cap guard for rtxserver (vast machine 124192).
#
# WHY: GPU0 sits in a slot-3 airflow shadow and runs the hottest of the two RTX PRO 6000s.
# Under sustained renter load in a hot room it has reached the 85°C soft-abort line. The BMC
# owns the chassis fans (OS-side fan control is inert on this board) and the GPU blower curve
# targets the low-80s by design, so the per-GPU POWER CAP is the only fast host-side thermal
# lever. This guard sheds power in stages as die temp rises and restores it (with hysteresis)
# once cooled — proactively, to keep the GPU below the soft-abort (85°C) / hard-abort (88°C)
# thresholds so a thermal event never drops a paying rental or risks the hardware.
#
# Cooler room air (AC, added 2026-05-29) is the real fix; this is the safety net under it.
#
# Deployed as a systemd timer (every 60s). Requires root (nvidia-smi -pl). State-change-only
# logging to /var/log/gpu-thermal-guard.log. Idempotent; safe to run on every tick.
#
# Tuning lives in the THRESHOLDS below. Repo copy: scripts/peer-shared/gpu-thermal-guard/.
set -uo pipefail

NORMAL_CAP=425          # W/GPU — production cap (matches nvidia-power-cap.service)
SHED1_TEMP=84; SHED1_CAP=400    # at/above 84°C (our alert line) -> mild shed
SHED2_TEMP=87; SHED2_CAP=375    # at/above 87°C (approaching 88°C hard-abort) -> firmer shed
RESTORE_TEMP=79         # at/below 79°C -> restore full cap (hysteresis gap vs SHED1)
LOG=/var/log/gpu-thermal-guard.log
STATE=/run/gpu-thermal-guard.cap

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "$(ts) $*" >> "$LOG" 2>/dev/null || true; }

command -v nvidia-smi >/dev/null 2>&1 || { log "nvidia-smi not found"; exit 0; }

maxt=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null | sort -rn | head -1)
curcap=$(nvidia-smi -i 0 --query-gpu=power.limit --format=csv,noheader,nounits 2>/dev/null | cut -d. -f1)
[ -z "${maxt:-}" ] && { log "could not read GPU temp"; exit 0; }
[ -z "${curcap:-}" ] && curcap=$NORMAL_CAP

# Decide target cap from temperature (highest band first).
if   [ "$maxt" -ge "$SHED2_TEMP" ]; then target=$SHED2_CAP
elif [ "$maxt" -ge "$SHED1_TEMP" ]; then target=$SHED1_CAP
elif [ "$maxt" -le "$RESTORE_TEMP" ]; then target=$NORMAL_CAP
else
  # hysteresis band (RESTORE_TEMP < maxt < SHED1_TEMP): hold whatever we last set
  if [ -f "$STATE" ]; then target=$(cat "$STATE" 2>/dev/null || echo "$NORMAL_CAP"); else target=$NORMAL_CAP; fi
fi

if [ "$target" != "$curcap" ]; then
  if nvidia-smi -pl "$target" >/dev/null 2>&1; then
    echo "$target" > "$STATE" 2>/dev/null || true
    log "maxtemp=${maxt}C  cap ${curcap}W -> ${target}W"
  else
    log "maxtemp=${maxt}C  FAILED to set ${target}W (cur ${curcap}W; check -pl range)"
  fi
fi
exit 0
