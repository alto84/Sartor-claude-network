# gpuserver2 — morning report (2026-06-08)

**Bottom line:** gpuserver2 is now a working, fully-driven **RTX 5090 host** — OS clean, GPU driver live, on a **stable wired ethernet** link. The host-side build is essentially done. **Two steps need you (web/router access) before it can actually rent**, plus an optional 5GbE port upgrade.

## What it is
| | |
|---|---|
| CPU | AMD Ryzen 9 9950X (16C/32T) |
| RAM | 256 GB DDR5 (249 GiB usable) |
| Storage | 4 TB WD_BLACK SN7100 NVMe |
| GPU | **NVIDIA RTX 5090, 32 GB** (driver 595.71.05) |
| Board / OS | ASRock · Ubuntu 24.04.4, kernel **6.17 HWE** |
| Net | **wired0** (RTL8126) = `192.168.1.175` @1GbE, PRIMARY · Wi-Fi `192.168.1.174` backup |
| Access | Rocinante SSH key + NOPASSWD sudo · `ssh gpuserver2` |

## Done tonight (autonomous)
- Recovered access around flaky Wi-Fi (paramiko key-bootstrap) + NOPASSWD sudo.
- **OS fully updated/cleaned** (`apt full-upgrade`).
- **NVIDIA RTX 5090 driver 595.71.05** installed + verified (`nvidia-smi` good).
- **Wired ethernet solved** — RTL8126 5GbE was unsupported on kernel 6.8; installed **HWE kernel 6.17** → native `r8169` support. Hardened the interface to **match-by-MAC + set-name `wired0`** so a future PCIe reshuffle can't rename-break it (which is exactly what took the box offline mid-session — see "gotcha" below).
- GPU **power-cap service** (575 W, boot-persistent). Thermals (below) show big headroom → **can safely raise toward 600 W** for max earnings once PSU/circuit draw is confirmed.
- vast.ai CLI installed.
- Registered in `REGISTRY.yaml` + SSH config (`ssh gpuserver2`).
- **Thermal stress @ max load: PASS.** 4-min fp16 matmul burn (6002 iters, no throttle, torch cu128/sm_120 OK): **peak 75 °C, ~588 W draw** at the 575 W cap. The 5090 throttles ~88-90 °C → **~13-15 °C margin. Cooling is excellent.**

## ⛔ The 2 things that need YOU to go live on vast.ai
1. **Fios WAN port-forward** — vast.ai's NOC must reach the box from outside. gpuserver2's allocated range is **40200-40299** → forward TCP to `192.168.1.175` on the Verizon CR1000A (`https://192.168.1.1`). *Note: the vault doesn't hold reliable Fios admin login — this is the long-standing CR1000A-admin gap. Without this forward, the box can't verify or rent.*
2. **vast.ai kaalia install token** — the host-daemon installer needs the 1-hour install token from `cloud.vast.ai/host/setup/` (the account API key returns 403 for registration — confirmed pattern from rtxserver). Log into the vast.ai account and I can drive the rest.

Once those two are in hand, the remaining onboarding (kaalia install → self-test → list using gpuserver1's template `-g 0.80 -b 0.65 -s 0.10 -m 1`, short `-e` ≤1 week per your instruction → verify) is ~30 min and mostly automatable.

## The gotcha worth remembering (and documenting)
Reseating the GPU **renumbered the PCIe bus**, which **renamed the network interfaces** (`wlp7s0`→`wlp8s0`, `enp6s0`→`enp7s0`). netplan hardcoded the old names → box booted fine but had **no network**, looking like a dead box. Fix was a one-line console netplan edit. I've since hardened `wired0` to match-by-MAC; **Wi-Fi is still by-name** (low priority since wired is primary, but worth hardening).

## Loose ends / follow-ups
- **Wired negotiated 1GbE, not the RTL8126's 5GbE** — switch port/cable is 1G. Fine for vast.ai (>500 Mbps floor); upgrade the port/cable for 5G when convenient.
- **Login credential:** the temp `alton` login value got shared in chat earlier — still not rotated (the vault was locked while you were away; key-auth + NOPASSWD make it non-urgent). Rotate + store as `gpuserver2 alton` when the vault's open.
- **gpuserver1 key-server teardown** — I stood up a temp `http.server:8088` + ufw rule on gpuserver1 to bootstrap the key; teardown SSH was erroring intermittently. **Verify it's gone:** `ssh gpuserver1 'pgrep -af http.server; sudo ufw status | grep 8088'` and remove if present.
- **Solar roof:** per your note, expect to revisit power-cap / business-use once it's installed.

## Proposed skill/doc updates (your call; I can apply)
1. `vastai-host-onboarding.md` — add a **"Ubuntu 24.04 / new hardware" section**: HWE kernel for newer NICs (RTL8126 needs ≥6.9; r8126-dkms NOT in repos), `nvidia-driver-595-open` for Blackwell, `python3-venv` not preinstalled, and the **PCIe-renumber → interface-rename → netplan-match-by-MAC** lesson.
2. `secrets-via-bitwarden.md` — add a **data.json torn-write recovery** playbook (ungraceful shutdown zeros the CLI cache; recovery = re-login). Surfaced earlier tonight.
3. Consider a `machines/gpuserver2/` dir (HARDWARE.md / MISSION.md) once it's listed.

Full chronological log: `inbox/rocinante/2026-06-07-gpuserver2-bringup-LOG.md`.
