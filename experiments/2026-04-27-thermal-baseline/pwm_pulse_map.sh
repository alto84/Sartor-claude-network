#!/bin/bash
# Pulse each PWM channel and record fan tach response.
# Restores original enable=5 (BIOS auto) and original pwm value at exit.

set -u
HWMON=/sys/class/hwmon/hwmon4
SETTLE=5
LOG=/tmp/pwm_pulse_map.log
: > "$LOG"

declare -A ORIG_PWM
declare -A ORIG_EN

restore() {
  for i in 1 2 3 4 5 6 7; do
    [[ -n "${ORIG_PWM[$i]:-}" ]] || continue
    echo "${ORIG_PWM[$i]}" | sudo tee "$HWMON/pwm$i" >/dev/null 2>&1
    echo "${ORIG_EN[$i]}"  | sudo tee "$HWMON/pwm${i}_enable" >/dev/null 2>&1
  done
  echo "[restore] all pwm channels restored to BIOS auto" | tee -a "$LOG"
}
trap restore EXIT INT TERM

for i in 1 2 3 4 5 6 7; do
  ORIG_PWM[$i]=$(cat "$HWMON/pwm$i")
  ORIG_EN[$i]=$(cat "$HWMON/pwm${i}_enable")
done

echo "=== PWM pulse mapping ===" | tee -a "$LOG"
date | tee -a "$LOG"
echo "" | tee -a "$LOG"

for i in 1 2 3 4 5 6 7; do
  fan_path="$HWMON/fan${i}_input"
  baseline_rpm=$(cat "$fan_path" 2>/dev/null || echo "n/a")
  echo "--- pwm$i ---" | tee -a "$LOG"
  echo "baseline rpm (current BIOS curve): $baseline_rpm" | tee -a "$LOG"

  # set this pwm to manual mode (1) and pulse to MAX
  echo 1   | sudo tee "$HWMON/pwm${i}_enable" >/dev/null
  echo 255 | sudo tee "$HWMON/pwm$i" >/dev/null
  sleep $SETTLE
  rpm_max=$(cat "$fan_path")
  echo "pwm=255 (100%) -> ${rpm_max} rpm" | tee -a "$LOG"

  # pulse to MIN (~30% floor)
  echo 80 | sudo tee "$HWMON/pwm$i" >/dev/null
  sleep $SETTLE
  rpm_lo=$(cat "$fan_path")
  echo "pwm=80  (31%)  -> ${rpm_lo} rpm" | tee -a "$LOG"

  # restore to BIOS auto for this channel (enable=5)
  echo "${ORIG_PWM[$i]}" | sudo tee "$HWMON/pwm$i" >/dev/null
  echo 5 | sudo tee "$HWMON/pwm${i}_enable" >/dev/null
  echo "" | tee -a "$LOG"
done

echo "=== mapping complete ===" | tee -a "$LOG"
