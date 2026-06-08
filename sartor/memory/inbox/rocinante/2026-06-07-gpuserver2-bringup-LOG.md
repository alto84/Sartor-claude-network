# GPUserver2 bring-up — overnight autonomous run (2026-06-07 → 06-08)

Owner directive (2026-06-07 evening, then "good night, check in the morning"):
get everything clean → appropriate passwords in Bitwarden → GPU + device drivers up →
install vast.ai → run diagnostics (heat at max load) → list on vast.ai with a SHORT
contract, expire ≤ 1 week. Note: solar roof starting soon → expect to redo some
power/thermal/business-use effort after it's in.

## Established facts
- Host: **gpuserver2**, user **alton**, **Ubuntu 24.04.4 LTS**, kernel **6.8.0-124-generic**.
- Board: ASRock (per NIC subsystem). CPU/GPU/RAM: TBD (inventory pass).
- Wi-Fi: MediaTek (mt7925e) `wlp7s0` `dc:56:7b:01:96:d5`, DHCP **192.168.1.174**, AP **Gym**, **−77 dBm (flaky — SSH sessions drop on long ops)**.
- Wired NIC: **Realtek RTL8126 5GbE** (`06:00.0` `10ec:8126`). Stock `r8169` lacks the 8126 PCI ID → no driver bound → port dark. Fix in progress: **r8126-dkms 3.0.11-1ubuntu13**.
- Access: Rocinante key planted (id_ed25519 rotated-2026-04-16) + **NOPASSWD sudo OK**. Bootstrapped via paramiko password-auth (CLI key-plant-by-curl had failed — gpuserver2→gpuserver1:8088 unreachable, likely Wi-Fi client isolation).
- **Security debt:** temp login secret was shared in chat → MUST rotate to a vault-managed value (`gpuserver2 alton`).

## Operating constraints
- Wi-Fi flaky → run long ops DETACHED on the box (`setsid`/`nohup` + logfile) and poll with short hardened SSH (`-o ServerAliveInterval=5 -o Compression=yes`). Priority is to get the **wired link up** to stabilize everything else.
- Temp key-server still running on gpuserver1: `python http.server 8088` + a `ufw allow 8088` rule → **tear down before done**.

## Phase status
- [~] 1. Ethernet (r8126-dkms) — build launched detached `/tmp/eth-fix.sh` → `/tmp/eth-fix.log`.
- [ ] 2. apt full-upgrade + reboot.
- [ ] 3. GPU + drivers (confirm card, install NVIDIA driver, nvidia-smi).
- [ ] 4. vast.ai install (kaalia; may need web-UI install token).
- [ ] 5. Thermal stress at max load (record peak temps; abort >85 °C).
- [ ] 6. List on vast.ai, end_date ≤ 7 days.
- [ ] 7. Rotate password→vault; REGISTRY+ssh config+fleet.yaml; tear down key-server.

## Refined goal (owner, ~23:40, then AFK)
"Install updated drivers for all motherboard + graphics components, update software as
needed, get ready for vast.ai rentals using prior listing as a template, see if we can get
online. Go ham. At the end, see if we need to update skills/docs." → full autonomy.

## Achievable autonomously tonight (host-side, no web/Fios)
NVIDIA driver, r8126 ethernet (build from source — not in repos), OS clean (done),
vast.ai CLI (Phase A curl), GPU thermal stress (heat@max load), nvidia-power-cap.service,
UFW + hairpin NAT (host-side), password→vault, REGISTRY/fleet.yaml/ssh-config.

## BLOCKED without owner / web access (flag for morning)
- **Fios WAN port-forward (Phase C.1)** — needs Verizon CR1000A admin (vault says NOT reliably
  held; sticker default failed during takeover). Without it, vast.ai NOC can't reach the box →
  no verify, no rent. gpuserver1 holds the single DMZ; gpuserver2 needs an explicit forward.
  **This is the hard gate on "actually renting."**
- **vast.ai API key + kaalia install token** — both from cloud.vast.ai web UI (account login).
  Will attempt IF automation Chrome is logged into vast.ai; else staged for morning.
- GPU: no discrete card was present pre-reseat. Owner reseated it ("looks like it's working").
  Re-verifying once box reboots.

## Prior-listing template (gpuserver1, machine 52271): -g 0.80 / -b 0.65 / -s 0.10 / -m 1 / fixed -e.
Port range for gpuserver2 = **40200-40299** (gpuserver1=40000-40099, rtxserver=40100-40199).

## Running log
- Ethernet driver build (r8126-dkms) launched detached — FAILED: r8126-dkms not in 24.04 repos. Need source build.
- apt full-upgrade ran clean (`=== DONE 03:19 UTC ===`), no kernel-8126 support added.
- Owner reseated GPU + power-cycled. Box rebooting (long memory train). Finder loop polling for it to surface.
- **BLOCKER (post-reseat, owner AFK): gpuserver2 never returned to the network.** Unreachable to ping
  (all 254 IPs swept) AND key-auth SSH for 6+ min. It is NOT on the LAN. Two most-likely causes, BOTH
  needing console/physical access:
  1. **POST halt** — ASRock boards often stop at POST after a hardware change ("New device detected,
     press F1/Del to continue"). Box never reaches the OS. **Fix:** at the monitor, press F1/Del, let it
     boot; in BIOS, save & exit (and optionally disable the halt-on-hardware-change prompt).
  2. **Wi-Fi interface renamed** — adding the GPU shifts PCIe bus numbering, so `wlp7s0` may have become
     a different name; the netplan config hardcodes `wlp7s0` → Wi-Fi can't come up → no network (box
     otherwise booted fine). **Fix at console:** `ip link` to see the new wifi name → edit
     `/etc/netplan/*.yaml` to the new name (or `set-name`/match by macaddress) → `sudo netplan apply`.
  - No BMC/IPMI on this consumer ASRock board → no remote recovery path. Patient finder (15 min) running;
    will auto-detect + resume the instant the box rejoins. If it doesn't, this waits for owner at console.
  - Everything host-side is staged in this journal; the moment it's reachable: confirm GPU on bus →
    NVIDIA driver → r8126 (source build) → vast.ai CLI/power-cap/UFW+hairpin → stress(heat) → password→vault.

## RESUMED 2026-06-08 (owner walked it past the blocker)
- Root cause CONFIRMED: GPU reseat renumbered PCIe → **Wi-Fi renamed wlp7s0 → wlp8s0**; netplan hardcoded
  the old name → no network. Fix applied at console: `sed -i s/wlp7s0/wlp8s0/ /etc/netplan/*.yaml; netplan apply`.
  Box back at **192.168.1.174** (wlp8s0). TODO: harden netplan to match-by-MAC so a future reseat can't repeat this.
- **GPU IS PRESENT (reseat worked): NVIDIA RTX 5090 — `01:00.0 [10de:2b85]` (GB202 Blackwell).** Same class as
  gpuserver1 (52271) → its listing (-g 0.80 / -b 0.65 / -s 0.10 / -m 1) is the template.
- Ubuntu recommends **nvidia-driver-595-open** (correct -open modules for Blackwell). Headers present.
- [~] NVIDIA driver install launched detached → `/tmp/drv.log` (595-open + build-essential + dkms + git). Reboot after.
- Still TODO after driver: r8126 ethernet (HWE kernel for native 8126 OR source build — r8126-dkms NOT in repos),
  power-cap service, vast.ai CLI, UFW+hairpin (host-side), thermal stress (heat@max), password→vault, registration.
- STILL BLOCKED for actual go-live (need owner web/Fios): vast.ai install token + Fios WAN port-forward (40200-40299).

## Progress 2026-06-08 ~00:20-00:30
- [x] NVIDIA driver installed + verified: **RTX 5090, driver 595.71.05, 32607 MiB, idle 32 °C**. Reboot clean.
- [x] nvidia-power-cap.service created+enabled → **power.limit 575 W** (provisional; refine after stress).
- [x] vast.ai CLI installed (~/.local/bin/vastai).
- [x] REGISTRY.yaml + ~/.ssh/config: gpuserver2 added (ssh gpuserver2 works).
- [~] HWE kernel (linux-generic-hwe-24.04) installing detached → native r8126 (kernel 6.9+ has 8126 in r8169).
      NVIDIA dkms rebuilds for new kernel automatically. Reboot after → verify enp wired iface.
- TODO remaining: thermal stress (heat@max — pip torch matmul, faster once wired); netplan match-by-MAC;
  UFW host-side; password→vault (DEFERRED — vault likely locked, owner away; key+NOPASSWD make it non-urgent);
  fleet.yaml (DEFERRED to actual listing); final report + skill/doc updates.
