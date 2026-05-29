#!/bin/bash
# ============================================================================
# gpu-temp-summary.sh — Sartor GPU hourly digest (unified)
# ============================================================================
# Reads the v2 18-column trajectory CSV(s) for the previous UTC hour and
# emits a markdown digest to inbox/{hostname}/_temp-summary/YYYY-MM-DD-HH.md.
#
# Self-configures from hostname. Skips fan columns on hosts without BMC.
# Skips gpu1 columns on single-GPU hosts.
# ============================================================================

set -u

HOSTNAME=$(hostname)
case "$HOSTNAME" in
  rtxpro6000server|rtxserver)
    MACHINE_ID=124192; NUM_GPUS=2; HAVE_BMC=1
    SUMMARY_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/_temp-summary"
    ;;
  gpuserver1)
    MACHINE_ID=52271; NUM_GPUS=1; HAVE_BMC=0
    SUMMARY_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/gpuserver1/_temp-summary"
    ;;
  *)
    echo "[$(date -Iseconds)] FATAL: unknown hostname '$HOSTNAME'" >&2; exit 2
    ;;
esac

LOG_DIR="/home/alton/generated/cron-logs"
DAEMON_LOG="$LOG_DIR/gpu-temp-summary.log"
mkdir -p "$SUMMARY_DIR"

NOW_EPOCH=$(date -u +%s)
SLOT_EPOCH=$((NOW_EPOCH - 3600))
SLOT_DATE=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%d)
SLOT_HOUR=$(date -u -d "@$SLOT_EPOCH" +%H)
SLOT_TAG="${SLOT_DATE}-${SLOT_HOUR}"
SLOT_START_ISO=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%dT%H:00:00Z)
SLOT_END_ISO=$(date -u -d "@$NOW_EPOCH" +%Y-%m-%dT%H:00:00Z)

# v2 CSVs only (exclude .v1.csv archives).
CSVS=$(ls -1 "$LOG_DIR"/gpu-temp-trajectory-*-${SLOT_DATE}.csv 2>/dev/null | grep -v '\.v1\.csv$')
if [ -z "$CSVS" ]; then
  YEST_DATE=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%d)
  CSVS=$(ls -1 "$LOG_DIR"/gpu-temp-trajectory-*-${YEST_DATE}.csv 2>/dev/null | grep -v '\.v1\.csv$')
fi

if [ -z "$CSVS" ]; then
  echo "[$(date -Iseconds)] no CSVs for slot $SLOT_TAG" >> "$DAEMON_LOG"
  exit 0
fi

SLOT_ROWS=$(mktemp)
trap "rm -f $SLOT_ROWS" EXIT

for csv in $CSVS; do
  awk -v prefix="${SLOT_DATE}T${SLOT_HOUR}" -F, 'NR>1 && index($1,prefix)==1' "$csv" >> "$SLOT_ROWS"
done

SAMPLE_COUNT=$(wc -l < "$SLOT_ROWS")
if [ "$SAMPLE_COUNT" -eq 0 ]; then
  echo "[$(date -Iseconds)] zero samples in slot $SLOT_TAG" >> "$DAEMON_LOG"
  exit 0
fi

# v2 column positions (1-indexed):
#  1=ts 2=host 3=mach 4=rental 5=cont 6=ngpus
#  7=g0t 8=g0p 9=g0u 10=g0m
# 11=g1t 12=g1p 13=g1u 14=g1m
# 15=cput 16=cput_src 17=fan2 18=fan5

read -r G0_T_MAX G0_T_AVG G0_P_MAX G0_P_AVG G0_U_AVG \
        G1_T_MAX G1_T_AVG G1_P_MAX G1_P_AVG G1_U_AVG \
        CPU_MAX CPU_AVG F2_MIN F2_MAX F5_MIN F5_MAX CONT_FRAC < <(
  awk -F, '
    BEGIN { f2min=999999; f5min=999999 }
    {
      g0t=$7+0; g0p=$8+0; g0u=$9+0;
      g1t=$11+0; g1p=$12+0; g1u=$13+0;
      cpu=$15+0; f2=$17+0; f5=$18+0; c=$5+0;
      if (g0t>g0tmax) g0tmax=g0t; g0tsum+=g0t;
      if (g1t>g1tmax) g1tmax=g1t; g1tsum+=g1t;
      if (g0p>g0pmax) g0pmax=g0p; g0psum+=g0p;
      if (g1p>g1pmax) g1pmax=g1p; g1psum+=g1p;
      g0usum+=g0u; g1usum+=g1u;
      if (cpu>cpumax) cpumax=cpu; cpusum+=cpu;
      if (f2>0 && f2<f2min) f2min=f2; if (f2>f2max) f2max=f2;
      if (f5>0 && f5<f5min) f5min=f5; if (f5>f5max) f5max=f5;
      csum+=c; n++;
    }
    END {
      if (n==0) exit;
      printf "%.0f %.1f %.1f %.1f %.1f %.0f %.1f %.1f %.1f %.1f %.1f %.1f %d %d %d %d %.2f\n",
        g0tmax, g0tsum/n, g0pmax, g0psum/n, g0usum/n,
        g1tmax, g1tsum/n, g1pmax, g1psum/n, g1usum/n,
        cpumax, cpusum/n,
        (f2min==999999?0:f2min), f2max, (f5min==999999?0:f5min), f5max,
        csum/n
    }
  ' "$SLOT_ROWS"
)

OUT="$SUMMARY_DIR/${SLOT_TAG}.md"
{
  cat <<EOF
---
type: temp-summary
date: ${SLOT_DATE}
slot: ${SLOT_TAG}
from: gpu-temp-summary.sh (${HOSTNAME})
priority: P3
tags: [domain/${HOSTNAME}, ops/monitoring, summary/thermal, machine/${MACHINE_ID}]
---

# Thermal/power digest — ${SLOT_START_ISO} → ${SLOT_END_ISO}

**Host:** ${HOSTNAME} (machine ${MACHINE_ID})
**Samples:** ${SAMPLE_COUNT}
**Container-running fraction:** ${CONT_FRAC}

EOF
  if [ "$NUM_GPUS" = "2" ]; then
    cat <<EOF
| metric | GPU0 | GPU1 |
|--------|------|------|
| temp max (C) | ${G0_T_MAX} | ${G1_T_MAX} |
| temp avg (C) | ${G0_T_AVG} | ${G1_T_AVG} |
| power max (W) | ${G0_P_MAX} | ${G1_P_MAX} |
| power avg (W) | ${G0_P_AVG} | ${G1_P_AVG} |
| util avg (%) | ${G0_U_AVG} | ${G1_U_AVG} |

EOF
  else
    cat <<EOF
| metric | GPU0 |
|--------|------|
| temp max (C) | ${G0_T_MAX} |
| temp avg (C) | ${G0_T_AVG} |
| power max (W) | ${G0_P_MAX} |
| power avg (W) | ${G0_P_AVG} |
| util avg (%) | ${G0_U_AVG} |

EOF
  fi
  echo "- CPU temp: max ${CPU_MAX}C / avg ${CPU_AVG}C"
  if [ "$HAVE_BMC" = "1" ]; then
    echo "- Fan zone 2 (CHA_FAN2): ${F2_MIN}-${F2_MAX} RPM"
    echo "- Fan zone 5 (CHA_FAN5): ${F5_MIN}-${F5_MAX} RPM"
  fi
  echo ""
  echo "Sources:"
  for c in $CSVS; do echo "- \`$c\`"; done
} > "$OUT"

echo "[$(date -Iseconds)] wrote summary for $SLOT_TAG ($SAMPLE_COUNT samples) -> $OUT" >> "$DAEMON_LOG"
