#!/bin/bash
# Retrain PCIe links on NVIDIA GPUs that negotiate down from Gen 5 to Gen 1.
# Observed on rtxpro6000server 2026-04-23: both RTX PRO 6000 Blackwell cards
# negotiate at 2.5 GT/s on fresh boot; a setpci-triggered LTSSM retrain
# restores full 32 GT/s.
#
# Run as root (via sudo or as a systemd service). Safe to run repeatedly —
# if a link is already at max speed, the retrain is a no-op.
#
# Usage:
#   sudo bash pcie-retrain.sh           # once
#   sudo systemctl enable pcie-retrain  # run on boot (after installing the
#                                       # .service unit in this dir)

set -u
LOG=${PCIE_RETRAIN_LOG:-/var/log/pcie-retrain.log}
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# fall back to tee if /var/log isn't writable
if ! touch "$LOG" 2>/dev/null; then
  LOG=/tmp/pcie-retrain.log
fi

echo "[$(ts)] pcie-retrain start" >> "$LOG"

# Find NVIDIA VGA/3D devices
GPUS=$(lspci | grep -iE "nvidia" | grep -iE "vga|3d" | awk '{print $1}')
if [[ -z "$GPUS" ]]; then
  echo "[$(ts)] no NVIDIA GPUs found" >> "$LOG"
  exit 0
fi

any_retrained=0
for bdf in $GPUS; do
  max=$(cat /sys/bus/pci/devices/0000:$bdf/max_link_speed 2>/dev/null | awk '{print $1}')
  cur=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed 2>/dev/null | awk '{print $1}')
  if [[ -z "$max" || -z "$cur" ]]; then
    echo "[$(ts)] $bdf: could not read link speed" >> "$LOG"
    continue
  fi
  # Compare as strings; Linux prints like "32.0" and "2.5"
  if [[ "$cur" == "$max" ]]; then
    echo "[$(ts)] $bdf: already at max ($cur GT/s), skipping" >> "$LOG"
    continue
  fi
  echo "[$(ts)] $bdf: $cur GT/s -> need $max GT/s, triggering retrain" >> "$LOG"

  # Parent root port
  parent=$(basename "$(dirname "$(readlink -f /sys/bus/pci/devices/0000:$bdf)")")
  if [[ -z "$parent" ]]; then
    echo "[$(ts)] $bdf: no parent found" >> "$LOG"
    continue
  fi

  # Read Link Control (PCIe cap + 0x10, 16-bit word), OR in bit 5 (retrain link)
  before=$(setpci -s "$parent" CAP_EXP+10.w 2>/dev/null)
  if [[ -z "$before" ]]; then
    echo "[$(ts)] $bdf: setpci read failed on parent $parent" >> "$LOG"
    continue
  fi
  new=$(printf "%04x" $((0x$before | 0x20)))
  setpci -s "$parent" CAP_EXP+10.w=$new
  any_retrained=1
done

if (( any_retrained )); then
  sleep 2
  for bdf in $GPUS; do
    spd=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_speed 2>/dev/null)
    wid=$(cat /sys/bus/pci/devices/0000:$bdf/current_link_width 2>/dev/null)
    echo "[$(ts)] $bdf post-retrain: $spd x$wid" >> "$LOG"
  done
fi

echo "[$(ts)] pcie-retrain done" >> "$LOG"
