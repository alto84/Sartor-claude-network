#!/bin/bash
# Sartor RTX PRO 6000 live dashboard.
# Reads nvidia-smi + sensors + ipmitool. Refreshes every 2s in place via tput.
# Color rules: green <70°C / <60% / <60%pl / <1100W ; yellow mid ; red ≥80°C / ≥80% / ≥90%pl / ≥1300W.
# Designed for rtxpro6000server with the post-2026-04-29 BMC fan-source bindings.

set -u

DIR=/home/alton/experiments/2026-05-02-stress
PHASE_FILE="$DIR/.phase"
ABORTS_FILE="$DIR/aborts.log"

GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1); BOLD=$(tput bold); RST=$(tput sgr0); DIM=$(tput dim)
HIDE=$(tput civis); SHOW=$(tput cnorm); CLR=$(tput clear); HOME=$(tput cup 0 0); EOL=$(tput el)

cleanup() { echo "${SHOW}"; tput cup 32 0; echo; exit 0; }
trap cleanup INT TERM

color_temp()  { local t="${1%.*}"; if [ "${t:-0}" -ge 80 ]; then echo "$RED"; elif [ "${t:-0}" -ge 70 ]; then echo "$YELLOW"; else echo "$GREEN"; fi; }
color_fan()   { local f="${1%.*}"; if [ "${f:-0}" -ge 80 ]; then echo "$RED"; elif [ "${f:-0}" -ge 60 ]; then echo "$YELLOW"; else echo "$GREEN"; fi; }
color_pct()   { local p="${1%.*}"; if [ "${p:-0}" -ge 90 ]; then echo "$RED"; elif [ "${p:-0}" -ge 60 ]; then echo "$YELLOW"; else echo "$GREEN"; fi; }
color_wall()  { local w="${1%.*}"; if [ "${w:-0}" -ge 1300 ]; then echo "$RED"; elif [ "${w:-0}" -ge 1100 ]; then echo "$YELLOW"; else echo "$GREEN"; fi; }

bar() {  # bar VALUE MAX → 10-segment ▓░ string
  local v="${1%.*}" max="$2"
  [ -z "$v" ] || [ "$v" = "NA" ] && v=0
  local n=$(( v * 10 / max ))
  [ "$n" -gt 10 ] && n=10
  [ "$n" -lt 0 ] && n=0
  local out=""
  for i in $(seq 1 10); do
    if [ "$i" -le "$n" ]; then out="${out}▓"; else out="${out}░"; fi
  done
  echo "$out"
}

fmt() { printf '%s%s%s' "$1" "$2" "$RST"; }  # color text
pad() { printf '%-*s' "$1" "$2"; }            # left-pad to width

echo "${HIDE}${CLR}"

while true; do
  echo "${HOME}"
  TS=$(date -u +%H:%M:%SZ)
  UPTIME=$(uptime -p 2>/dev/null | sed 's/up //')
  PHASE=$(cat "$PHASE_FILE" 2>/dev/null || echo "idle")
  ABORTS=$([ -f "$ABORTS_FILE" ] && wc -l < "$ABORTS_FILE" || echo 0)
  SAMPLER_PID=$(pgrep -f "sampler.sh" 2>/dev/null | head -1)

  G=$(nvidia-smi --query-gpu=index,temperature.gpu,power.draw,power.limit,fan.speed,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null | tr -d ' ')
  G0=$(echo "$G" | awk -F',' '$1==0 {print}')
  G1=$(echo "$G" | awk -F',' '$1==1 {print}')
  G0_T=$(echo "$G0" | cut -d',' -f2); G0_P=$(echo "$G0" | cut -d',' -f3); G0_PL=$(echo "$G0" | cut -d',' -f4); G0_F=$(echo "$G0" | cut -d',' -f5); G0_U=$(echo "$G0" | cut -d',' -f6); G0_MU=$(echo "$G0" | cut -d',' -f7); G0_MT=$(echo "$G0" | cut -d',' -f8)
  G1_T=$(echo "$G1" | cut -d',' -f2); G1_P=$(echo "$G1" | cut -d',' -f3); G1_PL=$(echo "$G1" | cut -d',' -f4); G1_F=$(echo "$G1" | cut -d',' -f5); G1_U=$(echo "$G1" | cut -d',' -f6); G1_MU=$(echo "$G1" | cut -d',' -f7); G1_MT=$(echo "$G1" | cut -d',' -f8)

  SENS=$(sensors 2>/dev/null)
  TCTL=$(echo "$SENS" | grep -m1 'Tctl' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1 | tr -d +)
  TCCD4=$(echo "$SENS" | grep -m1 'Tccd4' | grep -oE '\+?[0-9]+\.[0-9]+' | head -1 | tr -d +)

  IPMI_OK=1; IPMI=""
  if sudo -n ipmitool sensor >/dev/null 2>&1; then
    IPMI=$(sudo -n ipmitool sensor 2>/dev/null)
  else
    IPMI_OK=0
  fi
  if [ "$IPMI_OK" = "1" ]; then
    PCIE03=$(echo "$IPMI" | awk -F'|' '/^PCIE03 Temp/ {gsub(/ /,"",$2); print $2}')
    PCIE07=$(echo "$IPMI" | awk -F'|' '/^PCIE07 Temp/ {gsub(/ /,"",$2); print $2}')
    CPUFAN=$(echo "$IPMI"  | awk -F'|' '/^CPU_FAN /     {gsub(/ /,"",$2); print $2}')
    CHA1=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN1 /    {gsub(/ /,"",$2); print $2}')
    CHA2=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN2 /    {gsub(/ /,"",$2); print $2}')
    CHA3=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN3 /    {gsub(/ /,"",$2); print $2}')
    CHA5=$(echo "$IPMI"    | awk -F'|' '/^CHA_FAN5 /    {gsub(/ /,"",$2); print $2}')
    USB4=$(echo "$IPMI"    | awk -F'|' '/^USB4_FAN /    {gsub(/ /,"",$2); print $2}')
    M2F=$(echo "$IPMI"     | awk -F'|' '/^M\.2_FAN /    {gsub(/ /,"",$2); print $2}')
  else
    PCIE03="n/a"; PCIE07="n/a"; CPUFAN="n/a"; CHA1="n/a"; CHA2="n/a"; CHA3="n/a"; CHA5="n/a"; USB4="n/a"; M2F="n/a"
  fi

  # CPU pkg power: try AMD RAPL via /sys (powercap), else "estimate"
  CPU_PWR_W=""
  for d in /sys/class/powercap/intel-rapl:0 /sys/class/powercap/amd-rapl:0; do
    if [ -r "$d/energy_uj" ]; then
      e1=$(cat "$d/energy_uj" 2>/dev/null); sleep 0.1; e2=$(cat "$d/energy_uj" 2>/dev/null)
      if [ -n "$e1" ] && [ -n "$e2" ]; then
        CPU_PWR_W=$(awk -v a="$e1" -v b="$e2" 'BEGIN{printf "%.0f", (b-a)/100000}')
        break
      fi
    fi
  done
  CPU_PWR_LBL="$CPU_PWR_W W"
  [ -z "$CPU_PWR_W" ] && { CPU_PWR_W=85; CPU_PWR_LBL="~85 W (est)"; }

  WALL=$(awk -v a="${G0_P:-0}" -v b="${G1_P:-0}" -v c="${CPU_PWR_W:-85}" 'BEGIN{printf "%.0f", a+b+c+150}')
  WALL_PCT=$(awk -v w="$WALL" 'BEGIN{printf "%.0f", w*100/1400}')
  GPU_SUM=$(awk -v a="${G0_P:-0}" -v b="${G1_P:-0}" 'BEGIN{printf "%.0f", a+b}')

  # GPU power %
  G0_PP=$(awk -v p="${G0_P:-0}" -v pl="${G0_PL:-600}" 'BEGIN{printf "%.0f", p*100/pl}')
  G1_PP=$(awk -v p="${G1_P:-0}" -v pl="${G1_PL:-600}" 'BEGIN{printf "%.0f", p*100/pl}')

  # Fan duty estimate from RPM (ARCTIC P14 ≈ 1700 max; CHA5 splitter ≈ 1700 single tach)
  fan_pct() { awk -v r="${1:-0}" -v m="${2:-1700}" 'BEGIN{ if (r=="n/a") print "n/a"; else printf "%.0f", r*100/m }' ; }
  CHA1_PCT=$(fan_pct "$CHA1" 1700)
  CHA2_PCT=$(fan_pct "$CHA2" 1700)
  CHA3_PCT=$(fan_pct "$CHA3" 1700)
  CHA5_PCT=$(fan_pct "$CHA5" 1700)

  # ── render ──
  printf "%s╭─ Sartor RTX PRO 6000 Live ─ %s ─ uptime %s ─ Phase: %s ─ Aborts: %s%s\n" \
    "$BOLD" "$TS" "$UPTIME" "$PHASE" "$ABORTS" "$RST"
  echo

  # GPU rows
  printf "  %sGPU0 (slot 3, hot)%s          │  %sGPU1 (slot 7)%s\n" "$BOLD" "$RST" "$BOLD" "$RST"
  printf "    Temp  %s%s°C%s  %s   │    Temp  %s%s°C%s  %s\n" \
    "$(color_temp "$G0_T")" "$(pad 4 "${G0_T:-NA}")" "$RST" "$(bar "${G0_T:-0}" 100)" \
    "$(color_temp "$G1_T")" "$(pad 4 "${G1_T:-NA}")" "$RST" "$(bar "${G1_T:-0}" 100)"
  printf "    Power %s%4s W / %s W%s  %s%% %s   │    Power %s%4s W / %s W%s  %s%% %s\n" \
    "$(color_pct "$G0_PP")" "${G0_P:-NA}" "${G0_PL:-?}" "$RST" "$(printf '%3s' "${G0_PP}")" "$(bar "$G0_PP" 100)" \
    "$(color_pct "$G1_PP")" "${G1_P:-NA}" "${G1_PL:-?}" "$RST" "$(printf '%3s' "${G1_PP}")" "$(bar "$G1_PP" 100)"
  printf "    Fan   %s%s%%%s         %s   │    Fan   %s%s%%%s         %s\n" \
    "$(color_fan "$G0_F")" "$(pad 3 "${G0_F:-NA}")" "$RST" "$(bar "${G0_F:-0}" 100)" \
    "$(color_fan "$G1_F")" "$(pad 3 "${G1_F:-NA}")" "$RST" "$(bar "${G1_F:-0}" 100)"
  printf "    Util  %s%%      Mem %s/%s MiB  │    Util  %s%%      Mem %s/%s MiB\n" \
    "$(pad 3 "${G0_U:-NA}")" "${G0_MU:-?}" "${G0_MT:-?}" \
    "$(pad 3 "${G1_U:-NA}")" "${G1_MU:-?}" "${G1_MT:-?}"
  echo

  # CPU
  printf "  %sCPU%s\n" "$BOLD" "$RST"
  printf "    Tctl  %s%s°C%s   Tccd4 %s%s°C%s   pkg-power  %s\n" \
    "$(color_temp "$TCTL")" "$(pad 5 "${TCTL:-NA}")" "$RST" \
    "$(color_temp "$TCCD4")" "$(pad 5 "${TCCD4:-NA}")" "$RST" \
    "$CPU_PWR_LBL"
  echo

  # System fans
  printf "  %sSystem fans%s   (PCIE03→hot card, PCIE07→cool card; per BMC.md bindings)\n" "$BOLD" "$RST"
  printf "    CPU_FAN     (Noctua NH-U14S, CPU)        %s%5s RPM%s\n" "$RST" "$(pad 5 "${CPUFAN:-NA}")" "$RST"
  printf "    CHA_FAN1    (front intake, GPU1 side)    %s%5s RPM%s   ~%s%%\n" "$RST" "$(pad 5 "${CHA1:-NA}")" "$RST" "${CHA1_PCT:-NA}"
  printf "    CHA_FAN2    (mid-chassis, GPU0-bound)    %s%5s RPM%s   ~%s%%\n" "$RST" "$(pad 5 "${CHA2:-NA}")" "$RST" "${CHA2_PCT:-NA}"
  printf "    CHA_FAN3    (mid-chassis, GPU0-bound)    %s%5s RPM%s   ~%s%%\n" "$RST" "$(pad 5 "${CHA3:-NA}")" "$RST" "${CHA3_PCT:-NA}"
  printf "    CHA_FAN5    (3× MEGACOOL front-mesh)     %s%5s RPM%s   ~%s%%\n" "$RST" "$(pad 5 "${CHA5:-NA}")" "$RST" "${CHA5_PCT:-NA}"
  printf "    USB4_FAN/M2_FAN (M.2 area, fixed)        %5s / %5s RPM\n" "${USB4:-NA}" "${M2F:-NA}"
  if [ "$IPMI_OK" = "0" ]; then
    printf "    %s(IPMI requires sudo; some sensors unavailable)%s\n" "$DIM" "$RST"
  fi
  printf "    BMC PCIE03 (=GPU0) %s%s°C%s   PCIE07 (=GPU1) %s%s°C%s\n" \
    "$(color_temp "$PCIE03")" "$(pad 4 "${PCIE03:-NA}")" "$RST" \
    "$(color_temp "$PCIE07")" "$(pad 4 "${PCIE07:-NA}")" "$RST"
  echo

  # Power envelope
  printf "  %sPower envelope%s\n" "$BOLD" "$RST"
  printf "    GPU sum  %4s W   CPU pkg  %s   Baseline ~150 W (mobo+RAM+PSU)\n" "$GPU_SUM" "$CPU_PWR_LBL"
  printf "    Total estimate  %s%s W%s / 1400 W wall budget   [%s]  %s%%\n" \
    "$(color_wall "$WALL")" "$WALL" "$RST" "$(bar "$WALL" 1400)" "$WALL_PCT"
  echo
  printf "  Sampler: %s   Aborts: %s\n" "${SAMPLER_PID:-not running}" "$ABORTS"
  printf "  %sCtrl-C to quit. Refresh 2s.%s%s\n" "$DIM" "$RST" "$EOL"

  sleep 2
done
