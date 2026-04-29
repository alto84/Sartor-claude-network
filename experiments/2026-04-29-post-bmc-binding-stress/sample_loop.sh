#!/bin/bash
# Sampling sidecar for thermal_stress.py.
# Runs in parallel with the stress process; logs nvidia-smi + ipmitool + sensors
# to samples.jsonl every ~2 seconds. Exits when DURATION is reached.

set -u
DURATION="${1:-310}"  # seconds; default = 5 min stress + 10 s tail
OUT="${2:-samples.jsonl}"
> "$OUT"

START=$(date +%s)
END=$((START + DURATION))

while [ "$(date +%s)" -lt "$END" ]; do
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  EPOCH=$(date +%s.%N)

  # GPUs: index, temp, power, util, mem_util, sm_clock, mem_clock, fan, pstate
  while IFS= read -r line; do
    line_clean=$(echo "$line" | tr -d ' ')
    printf '{"ts":%s,"iso":"%s","src":"gpu","row":"%s"}\n' "$EPOCH" "$TS" "$line_clean" >> "$OUT"
  done < <(nvidia-smi --query-gpu=index,temperature.gpu,power.draw,utilization.gpu,utilization.memory,clocks.sm,clocks.mem,fan.speed,pstate --format=csv,noheader,nounits)

  # CPU + DIMM temps via lm-sensors (k10temp + nct6798)
  CPU_LINE=$(sensors 2>/dev/null | grep -E "Tctl|Tccd|Composite" | tr '\n' ' ' | tr -s ' ')
  printf '{"ts":%s,"iso":"%s","src":"cpu","row":%s}\n' "$EPOCH" "$TS" "$(jq -Rn --arg s "$CPU_LINE" '$s')" >> "$OUT"

  # BMC: PCIE03/07, fan tachs, CPU package via ipmitool
  IPMI=$(sudo ipmitool sensor 2>/dev/null)
  PCIE03=$(echo "$IPMI" | awk -F'|' '/^PCIE03 Temp/ {gsub(/ /,"",$2); print $2}')
  PCIE07=$(echo "$IPMI" | awk -F'|' '/^PCIE07 Temp/ {gsub(/ /,"",$2); print $2}')
  CPU_PKG=$(echo "$IPMI" | awk -F'|' '/^CPU Package Temp/ {gsub(/ /,"",$2); print $2}')
  CPU_FAN=$(echo "$IPMI" | awk -F'|' '/^CPU_FAN /  {gsub(/ /,"",$2); print $2}')
  CHA1=$(echo "$IPMI" | awk -F'|' '/^CHA_FAN1 / {gsub(/ /,"",$2); print $2}')
  CHA2=$(echo "$IPMI" | awk -F'|' '/^CHA_FAN2 / {gsub(/ /,"",$2); print $2}')
  CHA3=$(echo "$IPMI" | awk -F'|' '/^CHA_FAN3 / {gsub(/ /,"",$2); print $2}')
  CHA5=$(echo "$IPMI" | awk -F'|' '/^CHA_FAN5 / {gsub(/ /,"",$2); print $2}')
  printf '{"ts":%s,"iso":"%s","src":"bmc","pcie03":%s,"pcie07":%s,"cpu_pkg":%s,"cpu_fan":%s,"cha1":%s,"cha2":%s,"cha3":%s,"cha5":%s}\n' \
    "$EPOCH" "$TS" "${PCIE03:-null}" "${PCIE07:-null}" "${CPU_PKG:-null}" "${CPU_FAN:-null}" "${CHA1:-null}" "${CHA2:-null}" "${CHA3:-null}" "${CHA5:-null}" >> "$OUT"

  sleep 2
done

echo "Sampler done. $(wc -l < "$OUT") lines written to $OUT."
