#!/bin/bash
# 30-second sample loop: nvidia-smi GPU temps + ipmitool PCIE03/07 + fan tachs
set -e
OUT=samples.jsonl
> "$OUT"
for i in $(seq 1 15); do
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  GPU_LINE=$(nvidia-smi --query-gpu=index,temperature.gpu,power.draw --format=csv,noheader,nounits | tr -d ' ')
  GPU0_TEMP=$(echo "$GPU_LINE" | awk -F',' 'NR==1 {print $2}')
  GPU0_PWR=$(echo "$GPU_LINE" | awk -F',' 'NR==1 {print $3}')
  GPU1_TEMP=$(echo "$GPU_LINE" | awk -F',' 'NR==2 {print $2}')
  GPU1_PWR=$(echo "$GPU_LINE" | awk -F',' 'NR==2 {print $3}')
  IPMI_SENSORS=$(sudo ipmitool sensor 2>/dev/null)
  PCIE03=$(echo "$IPMI_SENSORS" | awk -F'|' '/^PCIE03 Temp/ {gsub(/ /,"",$2); print $2}')
  PCIE07=$(echo "$IPMI_SENSORS" | awk -F'|' '/^PCIE07 Temp/ {gsub(/ /,"",$2); print $2}')
  CPU_TEMP=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CPU Package Temp/ {gsub(/ /,"",$2); print $2}')
  CPU_FAN=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CPU_FAN /  {gsub(/ /,"",$2); print $2}')
  CHA_FAN1=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CHA_FAN1 / {gsub(/ /,"",$2); print $2}')
  CHA_FAN2=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CHA_FAN2 / {gsub(/ /,"",$2); print $2}')
  CHA_FAN3=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CHA_FAN3 / {gsub(/ /,"",$2); print $2}')
  CHA_FAN5=$(echo "$IPMI_SENSORS" | awk -F'|' '/^CHA_FAN5 / {gsub(/ /,"",$2); print $2}')
  printf '{"ts":"%s","gpu0_temp":%s,"gpu0_pwr":%s,"gpu1_temp":%s,"gpu1_pwr":%s,"pcie03":%s,"pcie07":%s,"cpu_temp":%s,"cpu_fan":%s,"cha1":%s,"cha2":%s,"cha3":%s,"cha5":%s}\n' \
    "$TS" "$GPU0_TEMP" "$GPU0_PWR" "$GPU1_TEMP" "$GPU1_PWR" "$PCIE03" "$PCIE07" "$CPU_TEMP" "$CPU_FAN" "$CHA_FAN1" "$CHA_FAN2" "$CHA_FAN3" "$CHA_FAN5" >> "$OUT"
  sleep 2
done
echo "Done. $(wc -l < "$OUT") samples."
