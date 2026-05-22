#!/bin/bash
# ============================================================================
# gpu-temp-summary.sh — hourly digest writer
# ============================================================================
# Reads the active gpu-temp-trajectory CSV(s) for the current UTC hour and
# emits a one-line digest to:
#   sartor/memory/inbox/rtxpro6000server/_temp-summary/YYYY-MM-DD-HH.md
#
# Curator will drain on next run. Pair with gpu-temp-logger.sh (per directive
# sartor/memory/inbox/rtxpro6000server/2026-05-22-temp-logging-during-spinup.md).
# ============================================================================

set -u

LOG_DIR="/home/alton/generated/cron-logs"
SUMMARY_DIR="/home/alton/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/_temp-summary"
DAEMON_LOG="$LOG_DIR/gpu-temp-summary.log"
mkdir -p "$SUMMARY_DIR"

# Hour slot we're summarising = the hour that just ended (HH-1).
NOW_EPOCH=$(date -u +%s)
SLOT_EPOCH=$((NOW_EPOCH - 3600))
SLOT_DATE=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%d)
SLOT_HOUR=$(date -u -d "@$SLOT_EPOCH" +%H)
SLOT_TAG="${SLOT_DATE}-${SLOT_HOUR}"
SLOT_START_ISO=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%dT%H:00:00Z)
SLOT_END_ISO=$(date -u -d "@$NOW_EPOCH" +%Y-%m-%dT%H:00:00Z)

# Find the CSV(s) covering this slot. Usually one, but if midnight crossed
# we may want both. Pick all matching today + yesterday and grep by hour.
CSVS=$(ls -1 "$LOG_DIR"/gpu-temp-trajectory-*-${SLOT_DATE}.csv 2>/dev/null)
if [ -z "$CSVS" ]; then
  # Try yesterday if we just rolled past midnight UTC
  YEST_DATE=$(date -u -d "@$SLOT_EPOCH" +%Y-%m-%d)
  CSVS=$(ls -1 "$LOG_DIR"/gpu-temp-trajectory-*-${YEST_DATE}.csv 2>/dev/null)
fi

if [ -z "$CSVS" ]; then
  echo "[$(date -Iseconds)] no CSVs for slot $SLOT_TAG" >> "$DAEMON_LOG"
  exit 0
fi

# Extract just the slot's rows from each matching CSV, concatenate.
SLOT_ROWS=$(mktemp)
trap "rm -f $SLOT_ROWS" EXIT

for csv in $CSVS; do
  # rows whose ISO timestamp starts with "YYYY-MM-DDTHH"
  awk -v prefix="${SLOT_DATE}T${SLOT_HOUR}" -F, 'NR>1 && index($1,prefix)==1' "$csv" >> "$SLOT_ROWS"
done

SAMPLE_COUNT=$(wc -l < "$SLOT_ROWS")
if [ "$SAMPLE_COUNT" -eq 0 ]; then
  echo "[$(date -Iseconds)] zero samples in slot $SLOT_TAG" >> "$DAEMON_LOG"
  exit 0
fi

# Compute stats: max/avg/min for temps + power + util per GPU; min/max for fans;
# container_running fraction.
read -r G0_T_MAX G0_T_AVG G0_P_MAX G0_P_AVG G0_U_AVG G1_T_MAX G1_T_AVG G1_P_MAX G1_P_AVG G1_U_AVG TCTL_MAX TCTL_AVG F2_MIN F2_MAX F5_MIN F5_MAX CONT_FRAC < <(
  awk -F, '
    NR==1 {
      g0tmin=g1tmin=200; tctlmin=200;
      f2min=999999; f5min=999999;
    }
    {
      g0t=$2+0; g0p=$3+0; g0u=$4+0;
      g1t=$6+0; g1p=$7+0; g1u=$8+0;
      tc=$10+0; f2=$11+0; f5=$12+0; c=$13+0;
      if (g0t>g0tmax) g0tmax=g0t;
      g0tsum+=g0t; g1tsum+=g1t;
      if (g1t>g1tmax) g1tmax=g1t;
      if (g0p>g0pmax) g0pmax=g0p; g0psum+=g0p;
      if (g1p>g1pmax) g1pmax=g1p; g1psum+=g1p;
      g0usum+=g0u; g1usum+=g1u;
      if (tc>tctlmax) tctlmax=tc; tctlsum+=tc;
      if (f2>0 && f2<f2min) f2min=f2; if (f2>f2max) f2max=f2;
      if (f5>0 && f5<f5min) f5min=f5; if (f5>f5max) f5max=f5;
      csum+=c; n++;
    }
    END {
      if (n==0) exit;
      printf "%.0f %.1f %.1f %.1f %.1f %.0f %.1f %.1f %.1f %.1f %.1f %.1f %d %d %d %d %.2f\n",
        g0tmax, g0tsum/n, g0pmax, g0psum/n, g0usum/n,
        g1tmax, g1tsum/n, g1pmax, g1psum/n, g1usum/n,
        tctlmax, tctlsum/n,
        (f2min==999999?0:f2min), f2max, (f5min==999999?0:f5min), f5max,
        csum/n
    }
  ' "$SLOT_ROWS"
)

OUT="$SUMMARY_DIR/${SLOT_TAG}.md"
cat > "$OUT" <<EOF
---
type: temp-summary
date: ${SLOT_DATE}
slot: ${SLOT_TAG}
from: gpu-temp-summary.sh (rtxpro6000server)
priority: P3
tags: [domain/rtxserver, ops/monitoring, summary/thermal, machine/97429]
---

# Thermal/power digest — ${SLOT_START_ISO} → ${SLOT_END_ISO}

Samples: ${SAMPLE_COUNT} | Container-running fraction: ${CONT_FRAC}

| metric | GPU0 | GPU1 |
|--------|------|------|
| temp max (C) | ${G0_T_MAX} | ${G1_T_MAX} |
| temp avg (C) | ${G0_T_AVG} | ${G1_T_AVG} |
| power max (W) | ${G0_P_MAX} | ${G1_P_MAX} |
| power avg (W) | ${G0_P_AVG} | ${G1_P_AVG} |
| util avg (%) | ${G0_U_AVG} | ${G1_U_AVG} |

- CPU Tctl: max ${TCTL_MAX}C / avg ${TCTL_AVG}C
- Fan zone 2 (CHA_FAN2): ${F2_MIN}-${F2_MAX} RPM
- Fan zone 5 (CHA_FAN5): ${F5_MIN}-${F5_MAX} RPM

Sources:
$(for c in $CSVS; do echo "- \`$c\`"; done)
EOF

echo "[$(date -Iseconds)] wrote summary for $SLOT_TAG ($SAMPLE_COUNT samples) -> $OUT" >> "$DAEMON_LOG"
