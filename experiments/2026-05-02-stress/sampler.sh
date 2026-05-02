#!/bin/bash
# 5s sampler. Writes CSV row + checks abort triggers + first-cross audible flag.
# Reads phase tag from .phase file.
#
# Captures TWO fan-control surfaces:
#   (a) ipmitool — what the BMC sees (authoritative under the post-2026-04-29 binding)
#   (b) nct6798 hwmon at /sys/class/hwmon/hwmon2/{pwm,fan}* — what the super-IO chip
#       computes/reports. PWM writes here were proven inert 2026-04-27, but READS
#       still reflect the BIOS Q-Fan curve register state.
# Plus: front/rear/side fan attribution will be done in analysis from BMC.md mapping.

set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
CSV="$DIR/samples.csv"
ABORTS="$DIR/aborts.log"
PHASE_FILE="$DIR/.phase"
AUDIBLE_FILE="$DIR/.audible_first"
DMESG_TS_FILE="$DIR/.dmesg_baseline_ts"
NCT="/sys/class/hwmon/hwmon2"

if [ ! -s "$CSV" ]; then
  echo "ts_iso,ts_epoch,phase,gpu0_temp_c,gpu0_pwr_w,gpu0_util_pct,gpu0_fan_pct,gpu0_sm_mhz,gpu0_mem_mhz,gpu1_temp_c,gpu1_pwr_w,gpu1_util_pct,gpu1_fan_pct,gpu1_sm_mhz,gpu1_mem_mhz,bmc_pcie03_c,bmc_pcie07_c,bmc_cpupkg_c,bmc_cpufan_rpm,bmc_cha1_rpm,bmc_cha2_rpm,bmc_cha3_rpm,bmc_cha5_rpm,bmc_usb4fan_rpm,bmc_m2fan_rpm,bmc_vrmehsfan_rpm,bmc_vrmwhsfan_rpm,nct_pwm1,nct_pwm2,nct_pwm3,nct_pwm4,nct_pwm5,nct_pwm6,nct_pwm7,nct_fan1_rpm,nct_fan2_rpm,nct_fan3_rpm,nct_fan4_rpm,nct_fan5_rpm,nct_fan6_rpm,nct_fan7_rpm,cpu_tctl_c,cpu_tccd1_c,cpu_tccd2_c,cpu_tccd3_c,cpu_tccd4_c,wall_estimate_w" > "$CSV"
fi

if [ ! -f "$DMESG_TS_FILE" ]; then
  date -u +%Y-%m-%dT%H:%M:%S > "$DMESG_TS_FILE"
fi
DMESG_BASELINE=$(cat "$DMESG_TS_FILE")

while true; do
  TS_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  TS_EPOCH=$(date +%s)
  PHASE=$(cat "$PHASE_FILE" 2>/dev/null || echo "idle")

  GPU=$(nvidia-smi --query-gpu=index,temperature.gpu,power.draw,utilization.gpu,fan.speed,clocks.sm,clocks.mem --format=csv,noheader,nounits 2>/dev/null | tr -d ' ')
  G0=$(echo "$GPU" | awk -F',' '$1==0 {print}')
  G1=$(echo "$GPU" | awk -F',' '$1==1 {print}')
  G0_T=$(echo "$G0" | cut -d',' -f2); G0_P=$(echo "$G0" | cut -d',' -f3); G0_U=$(echo "$G0" | cut -d',' -f4); G0_F=$(echo "$G0" | cut -d',' -f5); G0_SM=$(echo "$G0" | cut -d',' -f6); G0_MEM=$(echo "$G0" | cut -d',' -f7)
  G1_T=$(echo "$G1" | cut -d',' -f2); G1_P=$(echo "$G1" | cut -d',' -f3); G1_U=$(echo "$G1" | cut -d',' -f4); G1_F=$(echo "$G1" | cut -d',' -f5); G1_SM=$(echo "$G1" | cut -d',' -f6); G1_MEM=$(echo "$G1" | cut -d',' -f7)

  IPMI=$(sudo ipmitool sensor 2>/dev/null)
  PCIE03=$(echo "$IPMI" | awk -F'|' '/^PCIE03 Temp/ {gsub(/ /,"",$2); print $2}')
  PCIE07=$(echo "$IPMI" | awk -F'|' '/^PCIE07 Temp/ {gsub(/ /,"",$2); print $2}')
  CPUPKG=$(echo "$IPMI" | awk -F'|' '/^CPU Package Temp/ {gsub(/ /,"",$2); print $2}')
  CPUFAN=$(echo "$IPMI"  | awk -F'|' '/^CPU_FAN /     {gsub(/ /,"",$2); print $2}')
  CHA1=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN1 /    {gsub(/ /,"",$2); print $2}')
  CHA2=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN2 /    {gsub(/ /,"",$2); print $2}')
  CHA3=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN3 /    {gsub(/ /,"",$2); print $2}')
  CHA5=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN5 /    {gsub(/ /,"",$2); print $2}')
  USB4=$(echo "$IPMI"    | awk -F'|' '/^USB4_FAN /    {gsub(/ /,"",$2); print $2}')
  M2FAN=$(echo "$IPMI"   | awk -F'|' '/^M\.2_FAN /    {gsub(/ /,"",$2); print $2}')
  VRMEHS=$(echo "$IPMI"  | awk -F'|' '/^VRME_HS_FAN / {gsub(/ /,"",$2); print $2}')
  VRMWHS=$(echo "$IPMI"  | awk -F'|' '/^VRMW_HS_FAN / {gsub(/ /,"",$2); print $2}')

  PWM1=$(cat $NCT/pwm1 2>/dev/null); PWM2=$(cat $NCT/pwm2 2>/dev/null); PWM3=$(cat $NCT/pwm3 2>/dev/null)
  PWM4=$(cat $NCT/pwm4 2>/dev/null); PWM5=$(cat $NCT/pwm5 2>/dev/null); PWM6=$(cat $NCT/pwm6 2>/dev/null)
  PWM7=$(cat $NCT/pwm7 2>/dev/null)
  NF1=$(cat $NCT/fan1_input 2>/dev/null); NF2=$(cat $NCT/fan2_input 2>/dev/null); NF3=$(cat $NCT/fan3_input 2>/dev/null)
  NF4=$(cat $NCT/fan4_input 2>/dev/null); NF5=$(cat $NCT/fan5_input 2>/dev/null); NF6=$(cat $NCT/fan6_input 2>/dev/null)
  NF7=$(cat $NCT/fan7_input 2>/dev/null)

  SENS=$(sensors 2>/dev/null)
  TCTL=$(echo "$SENS"  | grep -m1 'Tctl'  | grep -oE '\+?[0-9]+\.[0-9]+' | head -1)
  TCCD1=$(echo "$SENS" | grep -m1 'Tccd1' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1)
  TCCD2=$(echo "$SENS" | grep -m1 'Tccd2' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1)
  TCCD3=$(echo "$SENS" | grep -m1 'Tccd3' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1)
  TCCD4=$(echo "$SENS" | grep -m1 'Tccd4' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1)

  WALL=$(awk -v a="${G0_P:-0}" -v b="${G1_P:-0}" 'BEGIN{printf "%.1f", a+b+200}')

  printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' \
    "$TS_ISO" "$TS_EPOCH" "$PHASE" \
    "${G0_T:-NA}" "${G0_P:-NA}" "${G0_U:-NA}" "${G0_F:-NA}" "${G0_SM:-NA}" "${G0_MEM:-NA}" \
    "${G1_T:-NA}" "${G1_P:-NA}" "${G1_U:-NA}" "${G1_F:-NA}" "${G1_SM:-NA}" "${G1_MEM:-NA}" \
    "${PCIE03:-NA}" "${PCIE07:-NA}" "${CPUPKG:-NA}" \
    "${CPUFAN:-NA}" "${CHA1:-NA}" "${CHA2:-NA}" "${CHA3:-NA}" "${CHA5:-NA}" \
    "${USB4:-NA}" "${M2FAN:-NA}" "${VRMEHS:-NA}" "${VRMWHS:-NA}" \
    "${PWM1:-NA}" "${PWM2:-NA}" "${PWM3:-NA}" "${PWM4:-NA}" "${PWM5:-NA}" "${PWM6:-NA}" "${PWM7:-NA}" \
    "${NF1:-NA}" "${NF2:-NA}" "${NF3:-NA}" "${NF4:-NA}" "${NF5:-NA}" "${NF6:-NA}" "${NF7:-NA}" \
    "${TCTL:-NA}" "${TCCD1:-NA}" "${TCCD2:-NA}" "${TCCD3:-NA}" "${TCCD4:-NA}" \
    "$WALL" >> "$CSV"

  # Audible-threshold first crossing (only during A1 / A2 / B phases)
  if [ ! -f "$AUDIBLE_FILE" ] && [[ "$PHASE" =~ ^(A1|A2|B)$ ]]; then
    g0f="${G0_F:-0}"; g1f="${G1_F:-0}"; pcie03="${PCIE03:-0}"; pcie07="${PCIE07:-0}"
    cha1="${CHA1:-0}"; cha2="${CHA2:-0}"; cha3="${CHA3:-0}"; cha5="${CHA5:-0}"
    g0f_int=${g0f%.*}; g1f_int=${g1f%.*}
    pcie03_int=${pcie03%.*}; pcie07_int=${pcie07%.*}
    cha1_int=${cha1%.*}; cha2_int=${cha2%.*}; cha3_int=${cha3%.*}; cha5_int=${cha5%.*}
    if [ "${g0f_int:-0}" -ge 60 ] || [ "${g1f_int:-0}" -ge 60 ] || \
       [ "${pcie03_int:-0}" -ge 65 ] || [ "${pcie07_int:-0}" -ge 65 ] || \
       [ "${cha1_int:-0}" -ge 1300 ] || [ "${cha2_int:-0}" -ge 1300 ] || \
       [ "${cha3_int:-0}" -ge 1300 ] || [ "${cha5_int:-0}" -ge 1300 ]; then
      echo "$TS_ISO|phase=$PHASE|GPU0_fan=${g0f}%|GPU1_fan=${g1f}%|PCIE03=${pcie03}|PCIE07=${pcie07}|CHA1=${cha1}|CHA2=${cha2}|CHA3=${cha3}|CHA5=${cha5}" > "$AUDIBLE_FILE"
    fi
  fi

  # Abort triggers (only during phases that have GPU load)
  if [[ "$PHASE" =~ ^(A1|A2|B)$ ]]; then
    g0t_int=${G0_T%.*}; g1t_int=${G1_T%.*}
    pcie03_int=${PCIE03%.*}; pcie07_int=${PCIE07%.*}
    tctl_int=${TCTL%.*}
    wall_int=${WALL%.*}
    if [ "${g0t_int:-0}" -ge 88 ] || [ "${g1t_int:-0}" -ge 88 ]; then
      echo "$TS_ISO|HARD|GPU_TEMP_88|G0=${G0_T}|G1=${G1_T}|phase=$PHASE" >> "$ABORTS"
    elif [ "${g0t_int:-0}" -ge 85 ] || [ "${g1t_int:-0}" -ge 85 ]; then
      echo "$TS_ISO|SOFT|GPU_TEMP_85|G0=${G0_T}|G1=${G1_T}|phase=$PHASE" >> "$ABORTS"
    fi
    if [ "${tctl_int:-0}" -ge 75 ]; then
      echo "$TS_ISO|SOFT|TCTL_75|Tctl=${TCTL}|phase=$PHASE" >> "$ABORTS"
    fi
    if [ "${wall_int:-0}" -ge 1380 ]; then
      echo "$TS_ISO|HARD|WALL_1380|wall=${WALL}|phase=$PHASE" >> "$ABORTS"
    fi
    if [ "${pcie03_int:-0}" -ge 85 ] || [ "${pcie07_int:-0}" -ge 85 ]; then
      echo "$TS_ISO|SOFT|BMC_TEMP_85|PCIE03=${PCIE03}|PCIE07=${PCIE07}|phase=$PHASE" >> "$ABORTS"
    fi
    DMESG_NEW=$(sudo dmesg --since "${DMESG_BASELINE}" 2>/dev/null | grep -iE 'xid|nvrm|aer|thermal' | head -1)
    if [ -n "$DMESG_NEW" ]; then
      echo "$TS_ISO|HARD|XID_OR_AER|msg=${DMESG_NEW}|phase=$PHASE" >> "$ABORTS"
    fi
  fi

  sleep 5
done
