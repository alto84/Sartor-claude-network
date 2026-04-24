#!/bin/bash
# Hardware + training telemetry, v0.2 (2026-04-23).
# Writes to ~/training-monitor.log every 5s and trips a canary at ~/ALERT
# on any of:
#   - GPU edge >= 87 C on any single sample, OR >= 83 C sustained 30 s
#   - GPU hotspot (memory) >= 95 C on any single sample
#   - train tmux session missing (deadlock / silent death)
#   - PCIe link speed downgrade vs baseline captured at start
#   - AER correctable/fatal error count increments
#   - disk free < 10 GB at /
#   - dmesg fatal NVIDIA / PCIe errors (as before)
#
# Also writes an inbox heartbeat every 5 min at:
#   ~/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/_heartbeat.md

set -u
LOG=/home/alton/training-monitor.log
ALERT=/home/alton/ALERT
HEARTBEAT=/home/alton/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/_heartbeat.md
INTERVAL=5

mkdir -p "$(dirname "$HEARTBEAT")"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

rm -f "$ALERT"
echo "[$(ts)] monitor v0.3 start" | tee -a "$LOG"

# ----- Startup grace window -----
# Wait up to GRACE seconds for the train tmux session to appear before
# the heartbeat check starts firing. Qwen 3.6 35B-A3B takes ~60-90s to
# load in bf16 from disk + attach LoRA adapters; previous v0.2 exited
# at the very first loop iteration if we happened to start monitor
# before the train session finished spinning up.
GRACE=120
echo "[$(ts)] startup grace window up to ${GRACE}s for train tmux session" | tee -a "$LOG"
for ((i=0; i<GRACE; i+=2)); do
  if tmux has-session -t train 2>/dev/null; then
    echo "[$(ts)] train tmux session detected after ${i}s — starting main loop" | tee -a "$LOG"
    break
  fi
  sleep 2
done
if ! tmux has-session -t train 2>/dev/null; then
  echo "[$(ts)] WARNING: train session not detected after ${GRACE}s; continuing anyway — the loop's own tmux check will alert" | tee -a "$LOG"
fi

# Capture baseline link speeds at start — we alert on downgrade
declare -A LINK_BASELINE
for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
  spd=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed 2>/dev/null)
  wid=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width 2>/dev/null)
  LINK_BASELINE[$bdf]="$spd x$wid"
  echo "[$(ts)] baseline link $bdf: $spd x$wid" | tee -a "$LOG"
done

# Capture baseline AER counts
declare -A AER_BASELINE
for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
  c=$(cat /sys/bus/pci/devices/0000:$bdf/aer_dev_correctable 2>/dev/null | awk '/^TOTAL_ERR_COR/{print $2}')
  f=$(cat /sys/bus/pci/devices/0000:$bdf/aer_dev_fatal 2>/dev/null | awk '/^TOTAL_ERR_FATAL/{print $2}')
  AER_BASELINE["${bdf}_cor"]="${c:-0}"
  AER_BASELINE["${bdf}_fat"]="${f:-0}"
done

declare -A high_temp_counter
THRESHOLD_WARN_C=83
THRESHOLD_HARD_C=87
THRESHOLD_MEM_C=95
SUSTAINED_SAMPLES=6   # 6 * 5 s = 30 s
HEARTBEAT_EVERY=60    # 60 * 5 s = 5 min
LAST_DMESG_LINE=""
hb_counter=0

alert() {
  local msg="$1"
  echo "[$(ts)] ALERT: $msg" | tee -a "$ALERT" "$LOG"
}

while true; do
  STAMP=$(ts)

  # ----- GPU snapshot with hotspot + fan -----
  NVSMI=$(nvidia-smi --query-gpu=index,temperature.gpu,temperature.memory,fan.speed,power.draw,utilization.gpu,memory.used --format=csv,noheader,nounits 2>&1)
  echo "[$STAMP] gpu: $(echo "$NVSMI" | tr '\n' '|')" >> "$LOG"

  while IFS=',' read -r idx edge mem fan power util memused; do
    idx=$(echo "$idx" | xargs)
    edge=$(echo "$edge" | xargs)
    mem=$(echo "$mem" | xargs)
    [[ -z "$idx" || -z "$edge" ]] && continue
    # Hard single-sample edge trigger
    if [[ "$edge" != "N/A" ]] && (( $(echo "$edge >= $THRESHOLD_HARD_C" | bc -l) )); then
      alert "GPU $idx edge ${edge}C >= ${THRESHOLD_HARD_C}C (single sample)"
    fi
    # Sustained warn
    if [[ "$edge" != "N/A" ]] && (( $(echo "$edge >= $THRESHOLD_WARN_C" | bc -l) )); then
      high_temp_counter[$idx]=$(( ${high_temp_counter[$idx]:-0} + 1 ))
      if (( ${high_temp_counter[$idx]} >= SUSTAINED_SAMPLES )); then
        alert "GPU $idx edge sustained ${edge}C >= ${THRESHOLD_WARN_C}C for $(( ${high_temp_counter[$idx]} * INTERVAL ))s"
      fi
    else
      high_temp_counter[$idx]=0
    fi
    # Hotspot (memory) single-sample
    if [[ "$mem" != "N/A" && -n "$mem" ]] && (( $(echo "$mem >= $THRESHOLD_MEM_C" | bc -l) )); then
      alert "GPU $idx memory/hotspot ${mem}C >= ${THRESHOLD_MEM_C}C"
    fi
  done <<< "$NVSMI"

  # ----- PCIe link state per GPU (alert on downgrade) -----
  for bdf in "${!LINK_BASELINE[@]}"; do
    spd=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed 2>/dev/null)
    wid=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width 2>/dev/null)
    cur="$spd x$wid"
    if [[ -n "$spd" && "$cur" != "${LINK_BASELINE[$bdf]}" ]]; then
      alert "PCIe link $bdf: baseline ${LINK_BASELINE[$bdf]} -> now $cur"
      LINK_BASELINE[$bdf]="$cur"  # update so we don't re-alert every sample
    fi
  done

  # ----- AER counter deltas -----
  for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
    cnow=$(cat /sys/bus/pci/devices/0000:$bdf/aer_dev_correctable 2>/dev/null | awk '/^TOTAL_ERR_COR/{print $2}')
    fnow=$(cat /sys/bus/pci/devices/0000:$bdf/aer_dev_fatal 2>/dev/null | awk '/^TOTAL_ERR_FATAL/{print $2}')
    cbase="${AER_BASELINE[${bdf}_cor]:-0}"
    fbase="${AER_BASELINE[${bdf}_fat]:-0}"
    if [[ -n "$cnow" && "$cnow" != "$cbase" ]]; then
      alert "AER correctable errors on $bdf: $cbase -> $cnow"
      AER_BASELINE["${bdf}_cor"]="$cnow"
    fi
    if [[ -n "$fnow" && "$fnow" != "$fbase" ]]; then
      alert "AER FATAL errors on $bdf: $fbase -> $fnow"
      AER_BASELINE["${bdf}_fat"]="$fnow"
    fi
  done

  # ----- tmux train heartbeat -----
  if ! tmux has-session -t train 2>/dev/null; then
    alert "train tmux session missing — training died or never started"
    # Don't spam — exit after one alert
    echo "[$STAMP] train session gone; monitor exiting" >> "$LOG"
    break
  fi

  # ----- Disk free check -----
  free_gb=$(df -BG / | awk 'NR==2 {sub("G","",$4); print $4}')
  if [[ -n "$free_gb" && "$free_gb" -lt 10 ]]; then
    alert "disk free at / only ${free_gb}GB — risk of filling mid-run"
  fi

  # ----- CPU/motherboard sensors (every 25s to reduce log noise) -----
  if (( $(date +%s) % 25 < INTERVAL )); then
    SENSORS=$(sensors 2>/dev/null | grep -E "Package id|Tctl|Tdie|Tccd" | head -8 | tr '\n' '|')
    echo "[$STAMP] cpu: $SENSORS" >> "$LOG"
  fi

  # ----- dmesg fatal scrape -----
  NEW_ERRS=$(sudo dmesg -T 2>/dev/null | grep -iE "xid|aer.*(fatal|uncorrectable)|dpc.*containment|nvrm.*(fail|cannot attach|rm_init_adapter)|fallen off|link down" | tail -3)
  if [[ -n "$NEW_ERRS" ]]; then
    LAST_LINE=$(echo "$NEW_ERRS" | tail -1)
    if [[ "$LAST_LINE" != "$LAST_DMESG_LINE" ]]; then
      alert "dmesg fatal: $LAST_LINE"
      LAST_DMESG_LINE="$LAST_LINE"
    fi
  fi

  # ----- Heartbeat to inbox every 5 min -----
  hb_counter=$(( hb_counter + 1 ))
  if (( hb_counter >= HEARTBEAT_EVERY )); then
    hb_counter=0
    {
      echo "---"
      echo "type: heartbeat"
      echo "source: rtxpro6000server/monitor.sh"
      echo "updated: $STAMP"
      echo "---"
      echo ""
      echo "# rtxpro6000server heartbeat $STAMP"
      echo ""
      echo '```'
      nvidia-smi --query-gpu=index,temperature.gpu,temperature.memory,fan.speed,power.draw,utilization.gpu,memory.used --format=csv
      echo ""
      echo "PCIe link state:"
      for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
        echo "  $bdf: $(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed) x$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width)"
      done
      echo ""
      echo "tmux sessions:"
      tmux list-sessions 2>&1 | sed 's/^/  /'
      echo ""
      echo "disk free at /: ${free_gb}G"
      echo '```'
    } > "$HEARTBEAT"
  fi

  sleep $INTERVAL
done

echo "[$(ts)] monitor exit" | tee -a "$LOG"
