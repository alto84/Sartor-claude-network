#!/bin/bash
# Track A: hardware characterization baseline, 2026-04-24 overnight.
# 5 min idle, 30 min dual-GPU gpu-burn, 2 min cooldown.
# Captures every sensor we can read + dmesg + PCIe link state.

set -u
OUT=/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-A-hardware-baseline
mkdir -p "$OUT"
cd "$OUT"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*" | tee -a "$OUT/run.log"; }

log "=== Track A start ==="

# Pre-flight: retrain PCIe if needed
log "pre-flight retrain..."
sudo bash /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/pcie-retrain.sh 2>&1 | tee -a "$OUT/run.log"
for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
  log "  $bdf: $(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed) x$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width)"
done

# Continuous telemetry started in background
log "starting continuous dmon (nvidia-smi + sensors + PCIe state, 1 Hz)..."
(
  while true; do
    stamp=$(ts)
    nv=$(nvidia-smi --query-gpu=index,temperature.gpu,temperature.memory,fan.speed,power.draw,utilization.gpu,memory.used,clocks.current.graphics,clocks.current.memory --format=csv,noheader,nounits 2>&1 | tr '\n' '|')
    sensors_snap=$(sensors 2>/dev/null | grep -E "Package id|Tctl|Tdie|Tccd|VSOC|VDD|fan" | tr '\n' '|')
    pcie_speeds=""
    for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
      pcie_speeds="$pcie_speeds $bdf:$(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed 2>/dev/null)x$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width 2>/dev/null)"
    done
    echo "$stamp||GPU:$nv||SENSORS:$sensors_snap||PCIE:$pcie_speeds"
    sleep 1
  done
) > "$OUT/telemetry.csv" 2>&1 &
TELEM_PID=$!
log "telemetry PID $TELEM_PID"

# Phase 1: 5 min idle baseline
log "=== Phase 1: 5 min idle baseline ==="
sleep 300
log "idle phase complete"
nvidia-smi --query-gpu=index,temperature.gpu,temperature.memory,power.draw --format=csv >> "$OUT/run.log"

# Phase 2: 30 min dual-GPU gpu-burn
# gpu-burn via Docker container if available, else compile locally
log "=== Phase 2: 30 min dual-GPU gpu-burn ==="

# Try container approach first (cleanest), fall back to build
if docker info >/dev/null 2>&1; then
  log "using docker nvidia/cuda image for gpu-burn..."
  # Run gpu-burn in container on each GPU
  (docker run --rm --gpus device=0 -v /tmp:/tmp chrisstream/gpu-burn:latest 1800 2>&1 | tee "$OUT/gpu-burn-0.log") &
  BURN_0=$!
  (docker run --rm --gpus device=1 -v /tmp:/tmp chrisstream/gpu-burn:latest 1800 2>&1 | tee "$OUT/gpu-burn-1.log") &
  BURN_1=$!
  log "gpu-burn PIDs: $BURN_0 (GPU 0), $BURN_1 (GPU 1)"
  wait $BURN_0 $BURN_1
else
  log "docker not available; building gpu-burn from source..."
  cd /tmp
  if [ ! -d gpu-burn ]; then
    git clone https://github.com/wilicc/gpu-burn.git 2>&1 | tee -a "$OUT/run.log"
  fi
  cd gpu-burn
  make 2>&1 | tee -a "$OUT/run.log"
  # Run simultaneously on both GPUs
  (CUDA_VISIBLE_DEVICES=0 ./gpu_burn 1800 2>&1 | tee "$OUT/gpu-burn-0.log") &
  BURN_0=$!
  (CUDA_VISIBLE_DEVICES=1 ./gpu_burn 1800 2>&1 | tee "$OUT/gpu-burn-1.log") &
  BURN_1=$!
  log "gpu-burn PIDs: $BURN_0 (GPU 0), $BURN_1 (GPU 1)"
  wait $BURN_0 $BURN_1
fi

log "=== Phase 3: 2 min cooldown ==="
sleep 120

log "=== stopping telemetry ==="
kill $TELEM_PID 2>/dev/null
sleep 1

log "=== post-run dmesg ==="
sudo dmesg -T 2>/dev/null | tail -50 > "$OUT/dmesg-tail.log"

log "=== final PCIe state ==="
for bdf in $(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}'); do
  log "  $bdf: $(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed) x$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width)"
done

# Quick analysis: max sustained temps, throttle events
log "=== Quick stats from telemetry ==="
python3 - "$OUT/telemetry.csv" > "$OUT/stats.txt" 2>&1 <<'PY'
import sys, re
from collections import defaultdict

max_edge = [0.0, 0.0]
max_mem = [0.0, 0.0]
max_power = [0.0, 0.0]
max_fan = [0.0, 0.0]
sample_count = 0

with open(sys.argv[1]) as f:
    for line in f:
        if "GPU:" not in line: continue
        sample_count += 1
        gpu_part = line.split("GPU:")[1].split("||")[0]
        # Per-GPU rows separated by |
        for row in gpu_part.split("|"):
            if not row.strip(): continue
            parts = [p.strip() for p in row.split(",")]
            if len(parts) < 9: continue
            try:
                idx = int(parts[0])
                edge = float(parts[1]) if parts[1] != "N/A" else 0
                mem = float(parts[2]) if parts[2] != "N/A" else 0
                fan = float(parts[3]) if parts[3] != "N/A" else 0
                power = float(parts[4]) if parts[4] != "N/A" else 0
                if idx < 2:
                    if edge > max_edge[idx]: max_edge[idx] = edge
                    if mem > max_mem[idx]: max_mem[idx] = mem
                    if power > max_power[idx]: max_power[idx] = power
                    if fan > max_fan[idx]: max_fan[idx] = fan
            except ValueError:
                pass

print(f"samples: {sample_count}")
for i in (0, 1):
    print(f"GPU {i}:")
    print(f"  max edge temp: {max_edge[i]}C")
    print(f"  max memory temp: {max_mem[i]}C")
    print(f"  max power: {max_power[i]}W")
    print(f"  max fan: {max_fan[i]}%")
PY

log "=== Track A done ==="
