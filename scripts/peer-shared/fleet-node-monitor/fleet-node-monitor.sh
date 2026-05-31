#!/usr/bin/env bash
# ============================================================================
# fleet-node-monitor.sh — Sartor host-LOCAL fleet self-monitor (consolidated)
# ============================================================================
# ONE script that runs on BOTH rtxserver and gpuserver1. Self-configures from
# hostname (like gpu-temp-logger.sh / gpu-thermal-guard.sh). Each invocation is
# ONE coarse 5-min snapshot — it does NOT loop or sleep (the systemd .timer
# provides cadence, mirroring gpu-thermal-guard).
#
# PER TICK it:
#   1. HARDWARE  — nvidia-smi (per-GPU temp/power/util/mem/fan%), CPU temp
#                  (sensors), disk %% (df). Coarse snapshot only; the 30s
#                  gpu-temp-logger.service remains the high-res thermal source
#                  and the P0 alerter. This script does NOT duplicate that loop.
#   2. RENTAL    — reads vast.ai live state LOCALLY (authenticated CLI on this
#                  host if present; else SSH to gpuserver1's CLI). Pulls
#                  current_rentals_running, listed price, min_bid, reliability,
#                  error_description, earn_hour/earn_day, end_date.
#   3. STALE     — docker C.* containers and (where virsh exists) libvirt VMs
#                  left behind by a rental that already ended. Cross-references
#                  against current_rentals_running. ADVISORY ONLY — never
#                  removes anything. docker-weekly-prune.sh stays the only
#                  deleter. A running renter container (a miner) is REVENUE.
#   4. POWER     — est_kwh for the interval = summed GPU power.draw integrated
#                  over the interval + an idle host baseline, /1000. Derived /
#                  graphing-only; the precise kWh source of truth stays
#                  power_ingest.py / power-2026.csv.
#   5. OUTPUT    — appends ONE compact NDJSON row to the committed central log
#                  sartor/memory/fleet-log/<host>.ndjson, overwrites a tiny
#                  heartbeat JSON in inbox/<host>/, and on yellow+ writes a
#                  debounced inbox alert (cooldown idiom from gpu-temp-logger).
#
# READ-ONLY against the GPU and the renter's container/VM. Idempotent. Safe to
# run on a live rental host. No cron is installed here (that is the Deploy
# phase). New host N+1 = add a `case` stanza below + drop the files + enable
# the timer.
#
# Created 2026-05-31 (fleet rebuild). Builds on the existing fleet.yaml /
# scripts/fleet/ system; does NOT reinvent it.
# ============================================================================

set -uo pipefail

# --------------------------------------------------------------------------
# 0. Hostname self-configuration
# --------------------------------------------------------------------------
HOSTNAME_FQ="$(hostname)"
case "$HOSTNAME_FQ" in
  rtxpro6000server|rtxserver)
    HOST_KEY=rtxserver               # short key: central-log filename (fleet-log/rtxserver.ndjson)
    INBOX_KEY=rtxpro6000server       # FQ hostname: the canonical inbox dir (matches gpu-temp-logger)
    MACHINE_ID=124192
    NUM_GPUS=2
    DOCKER="sudo -n docker"          # alton is NOT in the docker group here
    VIRSH="sudo -n virsh"            # virsh currently ABSENT on this box (probe+skip)
    CPU_SENSOR_CHIP=k10temp-pci-00c3
    CPU_SENSOR_LABEL='Tctl:'
    IDLE_W_BASELINE=350              # fleet.yaml rtxserver power.idle_w
    GPU_TEMP_ALERT_C=84
    GPU_TEMP_CRIT_C=86
    DISK_ALERT_PCT=85
    ;;
  gpuserver1)
    HOST_KEY=gpuserver1
    INBOX_KEY=gpuserver1             # inbox dir == short key on this host
    MACHINE_ID=52271
    NUM_GPUS=1
    DOCKER="docker"                  # alton IS in the docker group here
    VIRSH="virsh"                    # virsh present but currently empty
    CPU_SENSOR_CHIP=coretemp-isa-0000
    CPU_SENSOR_LABEL='Package id 0:'
    IDLE_W_BASELINE=80               # fleet.yaml gpuserver1 power.idle_w
    GPU_TEMP_ALERT_C=84
    GPU_TEMP_CRIT_C=86
    DISK_ALERT_PCT=85
    ;;
  *)
    echo "[$(date -Iseconds)] FATAL: unknown hostname '$HOSTNAME_FQ' — refusing to run" >&2
    exit 2
    ;;
esac

# Interval in hours for the kWh integral. Matches the timer's OnUnitActiveSec
# (300s = 5 min). Overridable for a manual one-shot test.
INTERVAL_SEC="${FLEET_NODE_INTERVAL_SEC:-300}"

REPO="/home/alton/Sartor-claude-network"
LOG_DIR="$REPO/sartor/memory/fleet-log"
INBOX_DIR="$REPO/sartor/memory/inbox/$INBOX_KEY"
ALERT_DIR="$INBOX_DIR/alerts"
NDJSON="$LOG_DIR/${HOST_KEY}.ndjson"
HEARTBEAT="$INBOX_DIR/_sentinel-heartbeat.json"
DAEMON_LOG="/home/alton/generated/cron-logs/fleet-node-monitor.log"
ALERT_COOLDOWN_FILE="/run/user/$(id -u)/fleet-node-monitor.alert-epoch"
ALERT_COOLDOWN_S=1800   # 30 min — coarse advisory alerts, not the P0 thermal loop

mkdir -p "$LOG_DIR" "$INBOX_DIR" "$ALERT_DIR" "$(dirname "$DAEMON_LOG")" 2>/dev/null || true
mkdir -p "$(dirname "$ALERT_COOLDOWN_FILE")" 2>/dev/null || true

# Authenticated vast.ai CLI: prefer this host's own (rtxserver's is authed too,
# confirmed 2026-05-31), fall back to gpuserver1 over SSH if absent. The host is
# by definition running when self-monitoring, so the local CLI is the more
# robust primary; the SSH fallback exists only for a host that never had one.
LOCAL_VASTAI="/home/alton/.local/bin/vastai"
VASTAI_SSH_HOST="alton@gpuserver1"

ts_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log_daemon() { echo "[$(ts_iso)] $*" >> "$DAEMON_LOG" 2>/dev/null || true; }

# --------------------------------------------------------------------------
# 1. HARDWARE snapshot
# --------------------------------------------------------------------------
# nvidia-smi: one line per GPU: temp,power,plimit,util,mem,fan
# We derive: max temp, summed power (int W), max util, max fan%, per-GPU temps.
read_gpu() {
  GPU_RAW="$(nvidia-smi \
      --query-gpu=temperature.gpu,power.draw,power.limit,utilization.gpu,memory.used,fan.speed \
      --format=csv,noheader,nounits 2>/dev/null)"
  # Summarize with awk (robust to 1 or 2 GPU lines).
  # Outputs: temp_max power_sum_w util_max fan_max ngpu_seen
  GPU_SUMMARY="$(printf '%s\n' "$GPU_RAW" | awk -F', *' '
    NF>=4 {
      t=$1+0; p=$2+0; u=$4+0; f=$6+0;
      if (t>tmax) tmax=t;
      psum+=p;
      if (u>umax) umax=u;
      if (f>fmax) fmax=f;
      n++;
    }
    END { printf "%d %d %d %d %d", tmax, (psum+0.5), umax, fmax, n }
  ')"
  TEMP_MAX="$(echo "$GPU_SUMMARY"   | awk '{print $1}')"
  POWER_GPU_W="$(echo "$GPU_SUMMARY"| awk '{print $2}')"
  UTIL_MAX="$(echo "$GPU_SUMMARY"   | awk '{print $3}')"
  FAN_MAX="$(echo "$GPU_SUMMARY"    | awk '{print $4}')"
  GPU_SEEN="$(echo "$GPU_SUMMARY"   | awk '{print $5}')"
  : "${TEMP_MAX:=0}" "${POWER_GPU_W:=0}" "${UTIL_MAX:=0}" "${FAN_MAX:=0}" "${GPU_SEEN:=0}"
}

read_cpu_temp() {
  CPU_TEMP="$(sensors "$CPU_SENSOR_CHIP" 2>/dev/null \
    | awk -v lbl="$CPU_SENSOR_LABEL" '$0 ~ "^"lbl {for(i=1;i<=NF;i++){gsub(/[^0-9.]/,"",$i); if($i!="" && $i+0>0){print $i+0; exit}}}')"
  [ -z "${CPU_TEMP:-}" ] && CPU_TEMP="null"
}

read_disk() {
  # df the filesystem holding /home; strip the % sign. (single-LV box -> "/")
  DISK_PCT="$(df -P /home 2>/dev/null | awk 'NR==2 {gsub(/%/,"",$5); print $5+0}')"
  : "${DISK_PCT:=0}"
}

# --------------------------------------------------------------------------
# 2. RENTAL / vast.ai live state (local CLI preferred, SSH fallback)
# --------------------------------------------------------------------------
# Emits a single jq object for THIS machine_id, or "" on failure.
fetch_vastai_row() {
  local raw=""
  VASTAI_SOURCE="none"      # init for set -u; overwritten by the path taken
  VASTAI_OK=0
  if [ -x "$LOCAL_VASTAI" ]; then
    raw="$(timeout 35 "$LOCAL_VASTAI" show machines --raw 2>/dev/null)"
  fi
  if [ -z "$raw" ]; then
    # SSH fallback to the canonical authenticated CLI on gpuserver1.
    raw="$(timeout 40 ssh -o BatchMode=yes -o ConnectTimeout=8 "$VASTAI_SSH_HOST" \
            '~/.local/bin/vastai show machines --raw 2>/dev/null' 2>/dev/null)"
    VASTAI_SOURCE="ssh:gpuserver1"
  else
    VASTAI_SOURCE="local"
  fi
  if [ -z "$raw" ]; then
    VASTAI_OK=0; VASTAI_ROW=""; return
  fi
  VASTAI_ROW="$(printf '%s' "$raw" | jq -c \
      --argjson mid "$MACHINE_ID" \
      '.machines[] | select(.machine_id==$mid)
       | {listed_gpu_cost, min_bid_price, current_rentals_running,
          current_rentals_resident, reliability2, error_description,
          end_date, earn_hour, earn_day}' 2>/dev/null)"
  if [ -z "$VASTAI_ROW" ] || [ "$VASTAI_ROW" = "null" ]; then
    VASTAI_OK=0; VASTAI_ROW=""
  else
    VASTAI_OK=1
  fi
}

# jq scalar extractor with a default for null/missing.
jget() { printf '%s' "${VASTAI_ROW:-{}}" | jq -r "$1 // empty" 2>/dev/null; }

read_rental() {
  fetch_vastai_row
  if [ "$VASTAI_OK" = "1" ]; then
    LIST_PRICE="$(jget '.listed_gpu_cost')"
    MIN_BID="$(jget '.min_bid_price')"
    RENTALS_RUNNING="$(jget '.current_rentals_running')"
    RELIABILITY="$(jget '.reliability2')"
    ERROR_DESC="$(printf '%s' "$VASTAI_ROW" | jq -c '.error_description' 2>/dev/null)"
    EARN_HOUR="$(jget '.earn_hour')"
    EARN_DAY="$(jget '.earn_day')"
  else
    LIST_PRICE=""; MIN_BID=""; RENTALS_RUNNING=""; RELIABILITY=""
    ERROR_DESC="null"; EARN_HOUR=""; EARN_DAY=""
  fi
  : "${RENTALS_RUNNING:=0}"
  # Boolean rented = at least one running rental.
  if [ "${RENTALS_RUNNING:-0}" -ge 1 ] 2>/dev/null; then RENTED=true; else RENTED=false; fi
}

# --------------------------------------------------------------------------
# 3. STALE docker container / VM detection (advisory, read-only)
# --------------------------------------------------------------------------
# A STALE artifact = a C.* container or libvirt domain left after a rental
# ended (not tied to a live current_rentals_running rental). We NEVER touch a
# running C.* (that is a paying renter, possibly a miner = revenue).
detect_stale() {
  STALE_DOCKER=0
  STALE_VM=0
  STALE_NOTE=""

  # --- docker ---
  # Running C.* count (legitimate rentals) and clearly-dead C.* (Exited/Created/Dead).
  local dlines running_c dead_c
  dlines="$($DOCKER ps -a --format '{{.Names}}|{{.Status}}' 2>/dev/null | grep '^C\.' || true)"
  running_c="$(printf '%s\n' "$dlines" | grep -ic '|Up ' || true)"
  dead_c="$(printf '%s\n' "$dlines" | grep -icE '\|(Exited|Created|Dead)' || true)"
  running_c=${running_c:-0}; dead_c=${dead_c:-0}
  STALE_DOCKER=$dead_c
  if [ "$dead_c" -gt 0 ]; then
    STALE_NOTE="${STALE_NOTE}${dead_c} dead C.* container(s); "
  fi
  # Cross-check: more RUNNING C.* than vast.ai reports rentals -> suspicious
  # (a renter container left running after the rental record cleared). Advisory.
  if [ "$VASTAI_OK" = "1" ] && [ "${RENTALS_RUNNING:-0}" -ge 0 ] 2>/dev/null; then
    if [ "$running_c" -gt "${RENTALS_RUNNING:-0}" ] 2>/dev/null; then
      STALE_DOCKER=$((STALE_DOCKER + (running_c - RENTALS_RUNNING)))
      STALE_NOTE="${STALE_NOTE}running C.*=${running_c} > rentals_running=${RENTALS_RUNNING}; "
    fi
  fi

  # --- libvirt VMs (probe + skip if virsh absent) ---
  if command -v "${VIRSH%% *}" >/dev/null 2>&1; then
    local vm_all vm_off vm_running
    vm_all="$($VIRSH list --all --name 2>/dev/null | grep -v '^[[:space:]]*$' || true)"
    if [ -n "$vm_all" ]; then
      vm_off="$($VIRSH list --all --name --state-shutoff 2>/dev/null | grep -vc '^[[:space:]]*$' || true)"
      vm_running="$($VIRSH list --name --state-running 2>/dev/null | grep -vc '^[[:space:]]*$' || true)"
      vm_off=${vm_off:-0}; vm_running=${vm_running:-0}
      # shut-off domains = stale leftovers; excess running vs rentals = suspicious
      STALE_VM=$vm_off
      if [ "$VASTAI_OK" = "1" ] && [ "$vm_running" -gt "${RENTALS_RUNNING:-0}" ] 2>/dev/null; then
        STALE_VM=$((STALE_VM + (vm_running - RENTALS_RUNNING)))
      fi
      [ "$STALE_VM" -gt 0 ] && STALE_NOTE="${STALE_NOTE}${STALE_VM} stale VM(s); "
    fi
  fi
  STALE_NOTE="${STALE_NOTE%% }"
}

# --------------------------------------------------------------------------
# 4. POWER — interval kWh estimate (derived, graphing-only)
# --------------------------------------------------------------------------
# est_kwh_interval = (summed GPU draw + idle host baseline) W * interval_h / 1000
estimate_power() {
  POWER_TOTAL_W=$((POWER_GPU_W + IDLE_W_BASELINE))
  EST_KWH_INTERVAL="$(awk -v w="$POWER_TOTAL_W" -v s="$INTERVAL_SEC" \
      'BEGIN { printf "%.5f", (w * (s/3600.0)) / 1000.0 }')"
}

# est_earn_interval = earn_hour * interval_h  (derived; revenue truth = books.py)
estimate_earn() {
  if [ -n "${EARN_HOUR:-}" ]; then
    EST_EARN_INTERVAL="$(awk -v e="$EARN_HOUR" -v s="$INTERVAL_SEC" \
        'BEGIN { printf "%.5f", e * (s/3600.0) }')"
  else
    EST_EARN_INTERVAL="null"
  fi
}

# --------------------------------------------------------------------------
# 5. HEALTH grade
# --------------------------------------------------------------------------
grade_health() {
  HEALTH=green
  HEALTH_REASONS=""
  # red: critical temp, vast.ai error_description set, disk critical
  if [ "${TEMP_MAX:-0}" -ge "$GPU_TEMP_CRIT_C" ] 2>/dev/null; then
    HEALTH=red; HEALTH_REASONS="${HEALTH_REASONS}gpu_temp ${TEMP_MAX}C>=${GPU_TEMP_CRIT_C}; "
  fi
  if [ "${ERROR_DESC:-null}" != "null" ] && [ -n "${ERROR_DESC:-}" ]; then
    HEALTH=red; HEALTH_REASONS="${HEALTH_REASONS}vastai error_description set; "
  fi
  if [ "${DISK_PCT:-0}" -ge 92 ] 2>/dev/null; then
    HEALTH=red; HEALTH_REASONS="${HEALTH_REASONS}disk ${DISK_PCT}%>=92; "
  fi
  # yellow (only if not already red)
  if [ "$HEALTH" != red ]; then
    if [ "${TEMP_MAX:-0}" -ge "$GPU_TEMP_ALERT_C" ] 2>/dev/null; then
      HEALTH=yellow; HEALTH_REASONS="${HEALTH_REASONS}gpu_temp ${TEMP_MAX}C>=${GPU_TEMP_ALERT_C}; "
    fi
    if [ "${DISK_PCT:-0}" -ge "$DISK_ALERT_PCT" ] 2>/dev/null; then
      HEALTH=yellow; HEALTH_REASONS="${HEALTH_REASONS}disk ${DISK_PCT}%>=${DISK_ALERT_PCT}; "
    fi
    if [ "${STALE_DOCKER:-0}" -gt 0 ] 2>/dev/null || [ "${STALE_VM:-0}" -gt 0 ] 2>/dev/null; then
      HEALTH=yellow; HEALTH_REASONS="${HEALTH_REASONS}stale artifacts: ${STALE_NOTE}; "
    fi
    if [ "${VASTAI_OK:-0}" != "1" ]; then
      HEALTH=yellow; HEALTH_REASONS="${HEALTH_REASONS}vast.ai read failed; "
    fi
  fi
  HEALTH_REASONS="${HEALTH_REASONS%% }"
}

# --------------------------------------------------------------------------
# 6. Emit NDJSON row + heartbeat + debounced alert
# --------------------------------------------------------------------------
# JSON-safe helpers: numbers pass through; empty -> null; strings -> quoted.
jnum() { local v="${1:-}"; if [ -z "$v" ] || [ "$v" = "null" ]; then printf 'null'; else printf '%s' "$v"; fi; }
jstr() { local v="${1:-}"; if [ -z "$v" ] || [ "$v" = "null" ]; then printf 'null'; else printf '%s' "$v" | jq -Rsa . | tr -d '\n'; fi; }

emit_row() {
  local ts; ts="$(ts_iso)"
  # error_description is already a jq-encoded value (string-quoted or null).
  local err_field="${ERROR_DESC:-null}"
  [ -z "$err_field" ] && err_field="null"

  local row
  row="$(cat <<JSON
{"ts":"$ts","host":"$HOST_KEY","machine_id":$MACHINE_ID,"rented":$RENTED,"gpu_util":$(jnum "$UTIL_MAX"),"temp_max":$(jnum "$TEMP_MAX"),"fan_pct":$(jnum "$FAN_MAX"),"power_w":$(jnum "$POWER_TOTAL_W"),"est_kwh_interval":$(jnum "$EST_KWH_INTERVAL"),"list_price":$(jnum "$LIST_PRICE"),"min_bid":$(jnum "$MIN_BID"),"reliability2":$(jnum "$RELIABILITY"),"earn_hour":$(jnum "$EARN_HOUR"),"earn_day":$(jnum "$EARN_DAY"),"est_earn_interval":$(jnum "$EST_EARN_INTERVAL"),"disk_pct":$(jnum "$DISK_PCT"),"cpu_temp":$(jnum "$CPU_TEMP"),"stale_docker":$(jnum "$STALE_DOCKER"),"stale_vm":$(jnum "$STALE_VM"),"error_description":$err_field,"vastai_ok":$([ "$VASTAI_OK" = 1 ] && echo true || echo false),"vastai_source":"$VASTAI_SOURCE","health":"$HEALTH","source":"sentinel","note":null}
JSON
)"
  # Validate before appending; a malformed row must never corrupt the log.
  if ! printf '%s' "$row" | jq -e . >/dev/null 2>&1; then
    log_daemon "ERROR: assembled row failed jq validation, NOT appended: $row"
    return 1
  fi
  printf '%s\n' "$row" >> "$NDJSON"

  # Heartbeat (overwrite, tiny — gather_mirror syncs it; witness reads its age).
  cat > "$HEARTBEAT" <<JSON
{"ts":"$ts","host":"$HOST_KEY","machine_id":$MACHINE_ID,"health":"$HEALTH","rented":$RENTED,"temp_max":$(jnum "$TEMP_MAX"),"power_w":$(jnum "$POWER_TOTAL_W"),"util":$(jnum "$UTIL_MAX"),"disk_pct":$(jnum "$DISK_PCT"),"stale_docker":$(jnum "$STALE_DOCKER"),"stale_vm":$(jnum "$STALE_VM"),"vastai_ok":$([ "$VASTAI_OK" = 1 ] && echo true || echo false),"reasons":$(jstr "$HEALTH_REASONS")}
JSON

  log_daemon "tick host=$HOST_KEY rented=$RENTED util=${UTIL_MAX}% tmax=${TEMP_MAX}C pw=${POWER_TOTAL_W}W price=${LIST_PRICE} stale_d=${STALE_DOCKER} stale_vm=${STALE_VM} health=$HEALTH src=$VASTAI_SOURCE"
}

# Debounced inbox alert on yellow+ (cooldown via /run epoch file).
maybe_alert() {
  [ "$HEALTH" = green ] && return 0
  local now_epoch last_epoch
  now_epoch="$(date +%s)"
  last_epoch="$(cat "$ALERT_COOLDOWN_FILE" 2>/dev/null || echo 0)"
  if [ $((now_epoch - last_epoch)) -lt "$ALERT_COOLDOWN_S" ]; then
    log_daemon "ALERT suppressed (cooldown) health=$HEALTH reasons=$HEALTH_REASONS"
    return 0
  fi
  echo "$now_epoch" > "$ALERT_COOLDOWN_FILE" 2>/dev/null || true
  local stamp prio path
  stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
  [ "$HEALTH" = red ] && prio=P1 || prio=P2
  path="$ALERT_DIR/${stamp}_fleet-node-${HEALTH}.md"
  cat > "$path" <<EOF
---
type: alert
date: $(date -I)
from: fleet-node-monitor.sh (${HOST_KEY})
priority: ${prio}
tags: [domain/${HOST_KEY}, ops/monitoring, alert/fleet-node, machine/${MACHINE_ID}]
---

# Fleet node ${HEALTH}: ${HOST_KEY} (machine ${MACHINE_ID})

**Timestamp:** $(ts_iso)
**Reasons:** ${HEALTH_REASONS:-none}

## Snapshot
- rented: ${RENTED}  (rentals_running=${RENTALS_RUNNING:-?})
- gpu temp max: ${TEMP_MAX}C   util: ${UTIL_MAX}%   fan: ${FAN_MAX}%
- power: ${POWER_TOTAL_W}W (GPU ${POWER_GPU_W}W + idle ${IDLE_W_BASELINE}W)   est_kwh: ${EST_KWH_INTERVAL}
- cpu temp: ${CPU_TEMP}C   disk: ${DISK_PCT}%
- list price: \$${LIST_PRICE}/GPU   min_bid: \$${MIN_BID}   reliability: ${RELIABILITY}
- earn/hr: \$${EARN_HOUR}   earn/day: \$${EARN_DAY}
- stale docker: ${STALE_DOCKER}   stale VM: ${STALE_VM}   ${STALE_NOTE:+(${STALE_NOTE})}
- vast.ai read: ${VASTAI_SOURCE} (ok=${VASTAI_OK})

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
EOF
  log_daemon "ALERT WRITTEN health=$HEALTH prio=$prio path=$path"
}

# --------------------------------------------------------------------------
# main — serialize concurrent ticks with a non-blocking lock
# --------------------------------------------------------------------------
main() {
  read_gpu
  read_cpu_temp
  read_disk
  read_rental
  detect_stale
  estimate_power
  estimate_earn
  grade_health
  emit_row
  maybe_alert
}

LOCK="/run/user/$(id -u)/fleet-node-monitor.lock"
exec 9>"$LOCK" 2>/dev/null || exec 9>/tmp/fleet-node-monitor.$(id -u).lock
if flock -n 9; then
  main
else
  log_daemon "another fleet-node-monitor tick is running; skipping this invocation"
fi
exit 0
