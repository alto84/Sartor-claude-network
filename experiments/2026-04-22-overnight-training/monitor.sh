#!/bin/bash
# Hardware telemetry during training. Samples every 5s, writes to ~/training-monitor.log,
# and trips an alert canary (~/ALERT) on thermal or PCIe errors.
#
# Alert thresholds:
#   - any GPU > 88 C for > 60 s (sustained)
#   - any XID / AER / DPC / NVRM fail in dmesg
#   - GPU "fallen off the bus"

LOG=/home/alton/training-monitor.log
ALERT=/home/alton/ALERT
INTERVAL=5

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# Clear old alert file on start
rm -f "$ALERT"

echo "[$(ts)] monitor start" | tee -a "$LOG"

# High-temp tracking: require sustained exceedance for N consecutive samples
declare -A high_temp_counter
THRESHOLD_C=88
SUSTAINED_SAMPLES=12   # 12 * 5s = 60 s

while true; do
  STAMP=$(ts)

  # GPU snapshot
  NVSMI=$(nvidia-smi --query-gpu=index,temperature.gpu,power.draw,power.limit,utilization.gpu,memory.used,memory.total,pcie.link.gen.current,pcie.link.width.current,clocks.current.graphics,clocks.current.memory --format=csv,noheader,nounits 2>&1)
  echo "[$STAMP] gpu: $NVSMI" | tr '\n' '|' >> "$LOG"
  echo "" >> "$LOG"

  # Check high-temp sustained
  while IFS=',' read -r idx temp power plimit util memused memtot pciegen pciewidth gclk mclk; do
    idx=$(echo "$idx" | xargs)
    temp=$(echo "$temp" | xargs)
    if [[ -n "$idx" && -n "$temp" ]]; then
      if (( $(echo "$temp > $THRESHOLD_C" | bc -l) )); then
        high_temp_counter[$idx]=$(( ${high_temp_counter[$idx]:-0} + 1 ))
        if (( ${high_temp_counter[$idx]} >= $SUSTAINED_SAMPLES )); then
          echo "[$STAMP] ALERT: GPU $idx sustained ${temp}C > ${THRESHOLD_C}C for $(( ${high_temp_counter[$idx]} * INTERVAL ))s" | tee -a "$ALERT" "$LOG"
        fi
      else
        high_temp_counter[$idx]=0
      fi
    fi
  done <<< "$NVSMI"

  # CPU / sensors snapshot (once every 5 samples = 25s to reduce log noise)
  if (( $(date +%s) % 25 < $INTERVAL )); then
    SENSORS=$(sensors 2>/dev/null | grep -E "Package id|Tctl|Tdie|Tccd" | head -8 | tr '\n' '|')
    echo "[$STAMP] cpu: $SENSORS" >> "$LOG"
  fi

  # dmesg error scrape — new lines since last sample
  NEW_ERRS=$(sudo dmesg -T 2>/dev/null | grep -iE "xid|aer.*(fatal|uncorrectable)|dpc.*containment|nvrm.*(fail|cannot attach)|fallen off|link down" | tail -5)
  if [[ -n "$NEW_ERRS" ]]; then
    # Only alert if the latest line is newer than what we've seen before
    LAST_LINE=$(echo "$NEW_ERRS" | tail -1)
    if [[ "$LAST_LINE" != "$LAST_DMESG_LINE" ]]; then
      echo "[$STAMP] ALERT: new dmesg error -- $LAST_LINE" | tee -a "$ALERT" "$LOG"
      LAST_DMESG_LINE="$LAST_LINE"
    fi
  fi

  sleep $INTERVAL
done
