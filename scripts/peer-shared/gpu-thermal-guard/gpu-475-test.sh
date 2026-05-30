#!/usr/bin/env bash
# One-off thermal test: hold the per-GPU power cap at 475W (up from the 425W production
# cap) with room AC on, log temps to steady state, then auto-revert. Pauses the
# gpu-thermal-guard for the duration and ALWAYS restores 425W + re-enables the guard on
# exit (trap), even on kill/error/abort. Safe to run on the rented box (more power = more
# renter perf; the only risk is thermal, which the abort threshold bounds).
set -uo pipefail
TESTCAP=475
NORMAL=425
ABORT_TEMP=87          # revert immediately if GPU0 reaches this (1C under the 88C hard-abort)
DURATION_S=1200        # 20 min — long enough to reach a thermal plateau
INTERVAL_S=30
LOG=/var/log/gpu-475-test.log

restore() {
  nvidia-smi -pl "$NORMAL" >/dev/null 2>&1
  systemctl start gpu-thermal-guard.timer >/dev/null 2>&1
  echo "$(date -u +%FT%TZ) RESTORED cap=${NORMAL}W + thermal-guard re-enabled" >> "$LOG"
}
trap restore EXIT INT TERM

echo "$(date -u +%FT%TZ) === 475W thermal test START (AC on) ===" > "$LOG"
systemctl stop gpu-thermal-guard.timer >/dev/null 2>&1
echo "$(date -u +%FT%TZ) thermal-guard paused for test" >> "$LOG"
if nvidia-smi -pl "$TESTCAP" >/dev/null 2>&1; then
  echo "$(date -u +%FT%TZ) cap set to ${TESTCAP}W" >> "$LOG"
else
  echo "$(date -u +%FT%TZ) FAILED to set ${TESTCAP}W — aborting" >> "$LOG"; exit 1
fi

end=$(( $(date +%s) + DURATION_S )); peak0=0
while [ "$(date +%s)" -lt "$end" ]; do
  read t0 t1 < <(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | tr '\n' ' ')
  read p0 p1 < <(nvidia-smi --query-gpu=power.draw   --format=csv,noheader,nounits | tr '\n' ' ')
  read f0 f1 < <(nvidia-smi --query-gpu=fan.speed     --format=csv,noheader,nounits | tr '\n' ' ')
  syst=$(sensors 2>/dev/null | awk '/SYSTIN/{print $2}')
  echo "$(date -u +%FT%TZ) GPU0=${t0}C(${p0}W fan${f0}%) GPU1=${t1}C(${p1}W fan${f1}%) intake=${syst}" >> "$LOG"
  [ "${t0%.*}" -gt "$peak0" ] && peak0=${t0%.*}
  if [ "${t0%.*}" -ge "$ABORT_TEMP" ]; then
    echo "$(date -u +%FT%TZ) ABORT: GPU0 ${t0}C >= ${ABORT_TEMP}C — reverting early" >> "$LOG"; break
  fi
  sleep "$INTERVAL_S"
done
echo "$(date -u +%FT%TZ) === test END, peak GPU0=${peak0}C ===" >> "$LOG"
