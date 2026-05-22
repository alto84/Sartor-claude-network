#!/bin/bash
# ============================================================================
# gpu-temp-logger.sh — rtxpro6000server thermal/power trajectory logger
# ============================================================================
# Per directive sartor/memory/inbox/rtxpro6000server/2026-05-22-temp-logging-
# during-spinup.md — Alton wants dense (~30s) trajectory of GPU thermals/power,
# CPU Tctl, BMC fan tachs, and container_running flag during paying rentals.
#
# Output: ~/generated/cron-logs/gpu-temp-trajectory-{machine_id}-{rental_id}
#         -YYYY-MM-DD.csv (rotates at UTC midnight)
#
# Read-only sensor access only — never touches the renter container.
# ============================================================================

set -u

MACHINE_ID=97429
RENTAL_ID="${RENTAL_ID:-C.37359460}"
CADENCE_SEC="${CADENCE_SEC:-30}"

LOG_DIR="/home/alton/generated/cron-logs"
ALERT_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/alerts"
mkdir -p "$LOG_DIR" "$ALERT_DIR"

DAEMON_LOG="$LOG_DIR/gpu-temp-logger.log"

# Thresholds (alert if breached on a single sample) — per directive.
THR_GPU_TEMP_C=82
THR_TCTL_C=70
THR_POWER_W=460

# Per-threshold sustain windows (samples) to avoid alerting on single transient
# spikes. With 30s cadence: 3 samples = ~90s sustained.
SUSTAIN_SAMPLES=3

CSV_HEADER='ts_iso,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,tctl_c,fan_zone2_rpm,fan_zone5_rpm,container_running'

# state for sustain tracking
gpu0_hot_run=0; gpu1_hot_run=0
gpu0_pow_run=0; gpu1_pow_run=0
tctl_hot_run=0
last_alert_epoch=0
ALERT_COOLDOWN_S=900   # 15 min between alerts of the same class

log_daemon() {
  echo "[$(date -Iseconds)] $*" >> "$DAEMON_LOG"
}

# Returns 1 if a docker container whose name starts with "C." is running.
container_running() {
  local out
  out=$(sudo -n docker ps --format '{{.Names}}' 2>/dev/null | grep -c '^C\.')
  echo "${out:-0}"
}

# nvidia-smi snapshot — returns CSV-friendly 8 fields:
# gpu0_t,gpu0_p,gpu0_u,gpu0_m,gpu1_t,gpu1_p,gpu1_u,gpu1_m
gpu_snapshot() {
  nvidia-smi \
    --query-gpu=temperature.gpu,power.draw,utilization.gpu,memory.used \
    --format=csv,noheader,nounits 2>/dev/null \
    | awk -F', *' 'NR<=2 {printf "%s,%s,%s,%s%s", $1, $2, $3, $4, (NR==2?"":",")}'
}

tctl_snapshot() {
  sensors k10temp-pci-00c3 2>/dev/null \
    | awk '/^Tctl:/ {gsub(/[^0-9.]/,"",$2); print $2; exit}'
}

# BMC fan tachs — zones 2 and 5 are the chassis intake/exhaust we care about.
# Output of `ipmitool sdr`: "NAME | VALUE | STATUS" with VALUE like "840 RPM".
fan_snapshot() {
  local out z2 z5
  out=$(timeout 8 sudo -n ipmitool sdr 2>/dev/null)
  z2=$(echo "$out" | awk -F'|' '/^CHA_FAN2 *\|/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
  z5=$(echo "$out" | awk -F'|' '/^CHA_FAN5 *\|/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
  echo "${z2:-},${z5:-}"
}

current_csv() {
  local date_utc
  date_utc=$(date -u +%Y-%m-%d)
  echo "$LOG_DIR/gpu-temp-trajectory-${MACHINE_ID}-${RENTAL_ID}-${date_utc}.csv"
}

ensure_header() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "$CSV_HEADER" > "$path"
  fi
}

write_alert() {
  local kind="$1" detail="$2"
  local now_epoch=$(date +%s)
  # cooldown: skip if too soon since last alert
  if [ $((now_epoch - last_alert_epoch)) -lt $ALERT_COOLDOWN_S ]; then
    log_daemon "ALERT suppressed (cooldown) kind=$kind detail=$detail"
    return
  fi
  last_alert_epoch=$now_epoch
  local ts_iso=$(date -Iseconds)
  local ts_stamp=$(date -u +%Y-%m-%dT%H%M%SZ)
  local path="$ALERT_DIR/${ts_stamp}_thermal-${kind}.md"
  cat > "$path" <<EOF
---
type: alert
date: $(date -I)
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxserver, ops/monitoring, alert/thermal, machine/${MACHINE_ID}, rental/${RENTAL_ID}]
---

# Thermal threshold breach: ${kind}

**Timestamp:** ${ts_iso}
**Detail:** ${detail}
**Rental:** ${RENTAL_ID} (machine ${MACHINE_ID})

## Latest sample
\`\`\`
$(tail -1 "$(current_csv)" 2>/dev/null || echo "no sample yet")
\`\`\`

## Last 10 samples
\`\`\`
$(tail -10 "$(current_csv)" 2>/dev/null || echo "no samples yet")
\`\`\`

Sustained ${SUSTAIN_SAMPLES} samples at ~${CADENCE_SEC}s cadence.
Thresholds: GPU_temp >${THR_GPU_TEMP_C}C / Tctl >${THR_TCTL_C}C / power >${THR_POWER_W}W.

EOF
  log_daemon "ALERT WRITTEN kind=$kind detail=$detail path=$path"
}

# Numeric float compare: returns 0 if $1 > $2
gt() {
  awk -v a="$1" -v b="$2" 'BEGIN {exit !(a>b)}'
}

log_daemon "gpu-temp-logger starting (rental=$RENTAL_ID cadence=${CADENCE_SEC}s)"

while true; do
  ts_iso=$(date -Iseconds)
  gpus=$(gpu_snapshot)
  tctl=$(tctl_snapshot)
  fans=$(fan_snapshot)
  cont=$(container_running)

  csv=$(current_csv)
  ensure_header "$csv"
  echo "${ts_iso},${gpus},${tctl},${fans},${cont}" >> "$csv"

  # Parse for threshold checks
  gpu0_t=$(echo "$gpus" | cut -d, -f1)
  gpu0_p=$(echo "$gpus" | cut -d, -f2)
  gpu1_t=$(echo "$gpus" | cut -d, -f5)
  gpu1_p=$(echo "$gpus" | cut -d, -f6)

  # GPU0 temp
  if [ -n "$gpu0_t" ] && gt "$gpu0_t" "$THR_GPU_TEMP_C"; then
    gpu0_hot_run=$((gpu0_hot_run + 1))
    if [ $gpu0_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu0-temp" "GPU0 temp ${gpu0_t}C >${THR_GPU_TEMP_C}C sustained ${gpu0_hot_run} samples"
      gpu0_hot_run=0
    fi
  else
    gpu0_hot_run=0
  fi

  # GPU1 temp
  if [ -n "$gpu1_t" ] && gt "$gpu1_t" "$THR_GPU_TEMP_C"; then
    gpu1_hot_run=$((gpu1_hot_run + 1))
    if [ $gpu1_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu1-temp" "GPU1 temp ${gpu1_t}C >${THR_GPU_TEMP_C}C sustained ${gpu1_hot_run} samples"
      gpu1_hot_run=0
    fi
  else
    gpu1_hot_run=0
  fi

  # GPU0 power
  if [ -n "$gpu0_p" ] && gt "$gpu0_p" "$THR_POWER_W"; then
    gpu0_pow_run=$((gpu0_pow_run + 1))
    if [ $gpu0_pow_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu0-power" "GPU0 power ${gpu0_p}W >${THR_POWER_W}W sustained ${gpu0_pow_run} samples"
      gpu0_pow_run=0
    fi
  else
    gpu0_pow_run=0
  fi

  # GPU1 power
  if [ -n "$gpu1_p" ] && gt "$gpu1_p" "$THR_POWER_W"; then
    gpu1_pow_run=$((gpu1_pow_run + 1))
    if [ $gpu1_pow_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu1-power" "GPU1 power ${gpu1_p}W >${THR_POWER_W}W sustained ${gpu1_pow_run} samples"
      gpu1_pow_run=0
    fi
  else
    gpu1_pow_run=0
  fi

  # Tctl
  if [ -n "$tctl" ] && gt "$tctl" "$THR_TCTL_C"; then
    tctl_hot_run=$((tctl_hot_run + 1))
    if [ $tctl_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "tctl" "Tctl ${tctl}C >${THR_TCTL_C}C sustained ${tctl_hot_run} samples"
      tctl_hot_run=0
    fi
  else
    tctl_hot_run=0
  fi

  sleep "$CADENCE_SEC"
done
