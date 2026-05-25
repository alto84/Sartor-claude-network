#!/bin/bash
# ============================================================================
# gpu-temp-logger.sh — Sartor GPU thermal/power trajectory logger (unified)
# ============================================================================
# Single script that runs on BOTH rtxserver and gpuserver1. Self-configures
# from hostname. Writes a ~30s-cadence CSV with a unified schema; empty
# fields where the host doesn't have that hardware (gpu1, BMC fans).
#
# Output: ~/generated/cron-logs/gpu-temp-trajectory-{machine_id}-{rental_id}
#         -YYYY-MM-DD.csv (rotates at UTC midnight; per-rental filename so
#         a new customer landing gives a new file automatically.)
#
# Run as: systemd user service ~/.config/systemd/user/gpu-temp-logger.service
#         (Restart=always, lingering enabled — survives reboots + logouts.)
#
# Read-only sensor access only. Never touches renter containers.
#
# v2 (2026-05-25): unified two-host script + dynamic rental detection +
#                  16-column schema + cpu_temp_source field. Prior:
#                  per-host scripts, static RENTAL_ID env, drifted schemas.
# ============================================================================

set -u

HOSTNAME=$(hostname)
case "$HOSTNAME" in
  rtxpro6000server|rtxserver)
    MACHINE_ID=97429
    NUM_GPUS=2
    CPU_TEMP_SOURCE=k10temp_tctl
    HAVE_BMC=1
    THR_GPU_TEMP_C=85
    THR_CPU_TEMP_C=75   # Tctl-offset; AMD Threadripper conservative alert
    THR_POWER_W=435     # cap is 425W (post 2026-05-24 tightening); 435W = brief boost tolerance
    ;;
  gpuserver1)
    MACHINE_ID=52271
    NUM_GPUS=1
    CPU_TEMP_SOURCE=coretemp_pkg
    HAVE_BMC=0
    THR_GPU_TEMP_C=85
    THR_CPU_TEMP_C=85   # Intel Package id 0; Tjmax 100C
    THR_POWER_W=580     # 5090 TDP is 575W
    ;;
  *)
    echo "[$(date -Iseconds)] FATAL: unknown hostname '$HOSTNAME' — refusing to run" >&2
    exit 2
    ;;
esac

CADENCE_SEC="${CADENCE_SEC:-30}"
LOG_DIR="/home/alton/generated/cron-logs"
case "$HOSTNAME" in
  rtxpro6000server|rtxserver) ALERT_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/alerts" ;;
  gpuserver1) ALERT_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/gpuserver1/alerts" ;;
esac
mkdir -p "$LOG_DIR" "$ALERT_DIR"

DAEMON_LOG="$LOG_DIR/gpu-temp-logger.log"
SUSTAIN_SAMPLES=3
ALERT_COOLDOWN_S=900

CSV_HEADER='ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm'

gpu0_hot_run=0; gpu1_hot_run=0
gpu0_pow_run=0; gpu1_pow_run=0
cpu_hot_run=0
last_alert_epoch=0

log_daemon() { echo "[$(date -Iseconds)] $*" >> "$DAEMON_LOG"; }

active_rental() {
  sudo -n docker ps --format '{{.Names}}' 2>/dev/null | grep -m1 '^C\.' || true
}

container_running() {
  local r
  r=$(sudo -n docker ps --format '{{.Names}}' 2>/dev/null | grep -c '^C\.')
  echo "${r:-0}"
}

# nvidia-smi returns one line per GPU. Output up to 2 GPUs as 8 fields:
# g0t,g0p,g0u,g0m,g1t,g1p,g1u,g1m   (g1* are empty strings if NUM_GPUS=1)
gpu_snapshot() {
  local out
  out=$(nvidia-smi \
    --query-gpu=temperature.gpu,power.draw,utilization.gpu,memory.used \
    --format=csv,noheader,nounits 2>/dev/null)
  if [ "$NUM_GPUS" = "2" ]; then
    echo "$out" | awk -F', *' 'NR<=2 {printf "%s,%s,%s,%s%s", $1, $2, $3, $4, (NR==2?"":",")}'
  else
    echo "$out" | awk -F', *' 'NR==1 {printf "%s,%s,%s,%s,,,,", $1, $2, $3, $4}'
  fi
}

cpu_temp_snapshot() {
  case "$CPU_TEMP_SOURCE" in
    k10temp_tctl)
      sensors k10temp-pci-00c3 2>/dev/null \
        | awk '/^Tctl:/ {gsub(/[^0-9.]/,"",$2); print $2; exit}'
      ;;
    coretemp_pkg)
      sensors coretemp-isa-0000 2>/dev/null \
        | awk '/^Package id 0:/ {gsub(/[^0-9.]/,"",$4); print $4; exit}'
      ;;
  esac
}

# BMC chassis fans (rtxserver only). Returns "z2,z5" or ","
bmc_fan_snapshot() {
  if [ "$HAVE_BMC" != "1" ]; then echo ","; return; fi
  local out z2 z5
  out=$(timeout 8 sudo -n ipmitool sdr 2>/dev/null)
  z2=$(echo "$out" | awk -F'|' '/^CHA_FAN2 *\|/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
  z5=$(echo "$out" | awk -F'|' '/^CHA_FAN5 *\|/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
  echo "${z2:-},${z5:-}"
}

current_csv() {
  local rid="$1"
  local date_utc
  date_utc=$(date -u +%Y-%m-%d)
  local tag="${rid:-no-rental}"
  echo "$LOG_DIR/gpu-temp-trajectory-${MACHINE_ID}-${tag}-${date_utc}.csv"
}

ensure_header() {
  local path="$1"
  if [ ! -f "$path" ]; then echo "$CSV_HEADER" > "$path"; return; fi
  # If existing file has the OLD (pre-v2) header, rotate it to .v1.csv.
  local first
  first=$(head -1 "$path" 2>/dev/null)
  if [ "$first" != "$CSV_HEADER" ]; then
    local archived="${path%.csv}.v1.csv"
    mv "$path" "$archived"
    log_daemon "rotated pre-v2 schema file: $path -> $archived"
    echo "$CSV_HEADER" > "$path"
  fi
}

write_alert() {
  local kind="$1" detail="$2" csv="$3"
  local now_epoch=$(date +%s)
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
from: gpu-temp-logger.sh (${HOSTNAME})
priority: P0
tags: [domain/${HOSTNAME}, ops/monitoring, alert/thermal, machine/${MACHINE_ID}]
---

# Thermal threshold breach: ${kind}

**Timestamp:** ${ts_iso}
**Host:** ${HOSTNAME} (machine ${MACHINE_ID})
**Detail:** ${detail}

## Latest sample
\`\`\`
$(tail -1 "$csv" 2>/dev/null || echo "no sample yet")
\`\`\`

## Last 10 samples
\`\`\`
$(tail -10 "$csv" 2>/dev/null || echo "no samples yet")
\`\`\`

Sustained ${SUSTAIN_SAMPLES} samples at ~${CADENCE_SEC}s cadence.
Thresholds: GPU_temp >${THR_GPU_TEMP_C}C / CPU_temp >${THR_CPU_TEMP_C}C / power >${THR_POWER_W}W.

EOF
  log_daemon "ALERT WRITTEN kind=$kind detail=$detail path=$path"
}

gt() { awk -v a="$1" -v b="$2" 'BEGIN {exit !(a>b)}'; }

log_daemon "gpu-temp-logger v2 starting (host=$HOSTNAME machine=$MACHINE_ID gpus=$NUM_GPUS cpu=$CPU_TEMP_SOURCE bmc=$HAVE_BMC cadence=${CADENCE_SEC}s)"

while true; do
  ts_iso=$(date -Iseconds)
  gpus=$(gpu_snapshot)
  cpu=$(cpu_temp_snapshot)
  fans=$(bmc_fan_snapshot)
  rid=$(active_rental)
  cont=$(container_running)

  csv=$(current_csv "$rid")
  ensure_header "$csv"
  echo "${ts_iso},${HOSTNAME},${MACHINE_ID},${rid},${cont},${NUM_GPUS},${gpus},${cpu},${CPU_TEMP_SOURCE},${fans}" >> "$csv"

  gpu0_t=$(echo "$gpus" | cut -d, -f1)
  gpu0_p=$(echo "$gpus" | cut -d, -f2)
  gpu1_t=$(echo "$gpus" | cut -d, -f5)
  gpu1_p=$(echo "$gpus" | cut -d, -f6)

  if [ -n "$gpu0_t" ] && gt "$gpu0_t" "$THR_GPU_TEMP_C"; then
    gpu0_hot_run=$((gpu0_hot_run + 1))
    if [ $gpu0_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu0-temp" "GPU0 ${gpu0_t}C >${THR_GPU_TEMP_C}C sustained ${gpu0_hot_run} samples" "$csv"
      gpu0_hot_run=0
    fi
  else gpu0_hot_run=0; fi

  if [ "$NUM_GPUS" = "2" ] && [ -n "$gpu1_t" ] && gt "$gpu1_t" "$THR_GPU_TEMP_C"; then
    gpu1_hot_run=$((gpu1_hot_run + 1))
    if [ $gpu1_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu1-temp" "GPU1 ${gpu1_t}C >${THR_GPU_TEMP_C}C sustained ${gpu1_hot_run} samples" "$csv"
      gpu1_hot_run=0
    fi
  else gpu1_hot_run=0; fi

  if [ -n "$gpu0_p" ] && gt "$gpu0_p" "$THR_POWER_W"; then
    gpu0_pow_run=$((gpu0_pow_run + 1))
    if [ $gpu0_pow_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu0-power" "GPU0 ${gpu0_p}W >${THR_POWER_W}W sustained ${gpu0_pow_run} samples" "$csv"
      gpu0_pow_run=0
    fi
  else gpu0_pow_run=0; fi

  if [ "$NUM_GPUS" = "2" ] && [ -n "$gpu1_p" ] && gt "$gpu1_p" "$THR_POWER_W"; then
    gpu1_pow_run=$((gpu1_pow_run + 1))
    if [ $gpu1_pow_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "gpu1-power" "GPU1 ${gpu1_p}W >${THR_POWER_W}W sustained ${gpu1_pow_run} samples" "$csv"
      gpu1_pow_run=0
    fi
  else gpu1_pow_run=0; fi

  if [ -n "$cpu" ] && gt "$cpu" "$THR_CPU_TEMP_C"; then
    cpu_hot_run=$((cpu_hot_run + 1))
    if [ $cpu_hot_run -ge $SUSTAIN_SAMPLES ]; then
      write_alert "cpu-temp" "${CPU_TEMP_SOURCE} ${cpu}C >${THR_CPU_TEMP_C}C sustained ${cpu_hot_run} samples" "$csv"
      cpu_hot_run=0
    fi
  else cpu_hot_run=0; fi

  sleep "$CADENCE_SEC"
done
