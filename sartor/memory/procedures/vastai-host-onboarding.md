---
name: vastai-host-onboarding
description: Canonical bring-up procedure for a brand-new vast.ai GPU host on the Sartor fleet. Synthesizes the rtxpro6000server work + gpuserver1 reference. Operator runs phases A-L in order; some phases need Alton at the console (kaalia install + Fios port-forward), the rest can run from a peer-Claude tmux session.
type: procedure
status: canonical
created: 2026-05-04
updated: 2026-05-04
created_by: Rocinante Opus 4.7 (vastai-management author)
related:
  - .claude/skills/vastai-management/SKILL.md
  - business/vastai-pricing-strategy.md
  - business/solar-inference.md
  - projects/rtxserver-vastai-watch.md
  - machines/gpuserver1/MISSION.md
  - machines/gpuserver1/CRONS.md
  - machines/gpuserver1/HARDWARE.md
  - .claude/skills/peer-comms/SKILL.md
  - .claude/skills/vastai-market-scan/SKILL.md
tags: [procedure, vast-ai, host-onboarding]
---

# vast.ai host onboarding — canonical procedure

The bring-up sequence for a brand-new GPU host on the Sartor fleet. Twelve phases. Some need Alton at the console (kaalia install — interactive sudo + port prompts; Fios port-forward — UI only). The rest can run unattended from the peer Claude on the host.

This procedure replaces the planned-but-never-written `procedures/vastai-host-onboarding.md`. It's grounded in:

- gpuserver1's actual deployed state (CLI v0.5.0, the active 5-cron suite, the kaalia systemd unit `vastai.service` and siblings `vast_metrics.service` + `vastai_bouncer.service`, hairpin NAT, UFW rules, the `vastai_kaalia` user)
- rtxserver's onboarding work paused at commit `6cee210` (April-May 2026 — hardware, network, peer Claude, power cap all in place, kaalia install pending)
- gpuserver1 peer's self-contained replication dump from 2026-05-02 (commit `fd80cc3`; referenced by the watcher tracker)
- Live `vastai list machine --help`, `vastai self-test machine --help` from gpuserver1 (CLI v0.5.0, 2026-05-04)
- Per-machine quirks captured in [`peer-comms`](../../../.claude/skills/peer-comms/SKILL.md)

Read [`vastai-management`](../../../.claude/skills/vastai-management/SKILL.md) before starting — the listing strategy and pricing rules referenced below live there.

---

## Pre-conditions — what must be true BEFORE you start

| # | Pre-condition | How to verify |
|---|---|---|
| 1 | Hardware bring-up complete: GPU(s) detected at expected PCIe gen and lanes, no AER errors, ECC clean | `nvidia-smi` returns expected card count; `dmesg | grep -i 'aer\|xid'` clean; `lspci -vvv` confirms PCIe Gen + lane count |
| 2 | Production GPU power cap applied + persistent across reboot | `nvidia-smi --query-gpu=power.limit --format=csv` reads expected cap; `systemctl is-enabled nvidia-power-cap.service` returns enabled |
| 3 | Thermal characterization complete + chassis cooling adequate | Per-machine HARDWARE.md documents max sustained power draw + Tctl peak; BMC fan curves saved if applicable |
| 4 | OS: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (gpuserver1 = 22.04, rtxserver = 22.04 HWE 6.8) | `lsb_release -a`; HWE kernel for newer hardware |
| 5 | NVIDIA driver supports the card class (Blackwell needs 555+; rtxserver = 580.126.09; gpuserver1 = 570.144) | `nvidia-smi` (top right); driver-card support matrix at NVIDIA |
| 6 | Docker installed + active. Docker version compatible with NVIDIA Container Toolkit | `docker --version` (29.x verified working); `sudo systemctl is-active docker` |
| 7 | Static (or DHCP-reserved) LAN IP for the host | Arrange via UniFi controller + DHCP reservation. gpuserver1 = 192.168.1.100; rtxserver = 192.168.1.157 |
| 8 | Verizon Fios router admin access available (for port-forward) | Alton has Fios admin credentials in Bitwarden as `Fios admin` |
| 9 | UFW installed | `which ufw` |
| 10 | Sartor git repo cloned at `~/Sartor-claude-network`, `origin` pointing at rtxserver bare | `cd ~/Sartor-claude-network && git remote -v` shows `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git` |
| 11 | Peer Claude session available: tmux session `claude-team-1` running, OAuth fresh | `ssh alton@<host> 'tmux ls'` shows `claude-team-1`; OAuth check per peer-comms |
| 12 | Per-machine MISSION.md or HARDWARE.md committed to memory wiki | `ls sartor/memory/machines/<host>/` shows expected files |
| 13 | Solar Inference LLC vast.ai host account exists; Alton has dashboard access | `https://cloud.vast.ai/host/machines` lists existing machines under alto84@gmail.com |

If any pre-condition is not met, complete it before proceeding. Do NOT skip to Phase A; kaalia will register a half-broken host and the verification window will be wasted.

---

## Phase A — vastai client CLI install

Per-user, non-root install. The CLI is a Python script that lives in `~/.local/bin/vastai`.

```bash
# As alton on the new host
mkdir -p ~/.local/bin
curl -L -o ~/.local/bin/vastai \
  https://raw.githubusercontent.com/vast-ai/vast-python/master/vast.py
chmod +x ~/.local/bin/vastai

# Add ~/.local/bin to PATH if not already
grep -q '\.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
. ~/.bashrc

# Verify
~/.local/bin/vastai --version
# Expected: 0.5.0 or later (gpuserver1 confirmed running 0.5.0 as of 2026-05-04)
```

**Why per-user, non-root:** keeps the CLI under `alton`'s control; matches gpuserver1's pattern. The kaalia daemon (Phase E) is the root-side install — the CLI and the daemon are separate.

**Verify:** `~/.local/bin/vastai --version` prints a version number. If `python3` complains, the user shell may be missing dependencies — `pip3 install --user requests` resolves it on a fresh box.

---

## Phase B — API key generation + secure delivery

Generate a fresh API key on cloud.vast.ai. **Do NOT reuse gpuserver1's key.** Each host gets its own, even though they share a host account.

### B.1 — Generate the key (Alton, web UI on Rocinante)

1. Open `https://cloud.vast.ai/account/api-keys` in Chrome
2. Sign in if needed (alto84@gmail.com / Solar Inference LLC)
3. Click "Create New API Key"
4. Name it after the host (e.g., `rtxpro6000server-2026-05-04`) for revocation clarity
5. Copy the key value — **DO NOT paste it into chat or logs**

### B.2 — Secure delivery to the host (the SCP-clipboard-hijack pattern)

The pattern Alton used 2026-05-02 for rtxserver. The key value never lands in shell history, browser history, or any tool argument:

1. In Chrome DevTools console (still on the API keys page), paste:

```javascript
// Hijacks navigator.clipboard.writeText to also dump the value as a download.
// Run BEFORE clicking "Copy" on the new key so the next clipboard write is captured.
(function() {
  const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = async (val) => {
    // Save the value to a download
    const blob = new Blob([val], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vastai-api-key.txt';
    a.click();
    URL.revokeObjectURL(url);
    // Then call the original (so the page's copy-button still works)
    return orig(val);
  };
  console.log('Clipboard hijack installed. Click Copy now.');
})();
```

2. Click the page's "Copy" button. Browser downloads `vastai-api-key.txt` to `~/Downloads/`.
3. SCP the file to the new host:

```bash
# From Rocinante
scp ~/Downloads/vastai-api-key.txt alton@<host-ip>:/tmp/vast_api_key.tmp
```

4. On the host, install with mode 600 and shred the source:

```bash
ssh alton@<host-ip>
mkdir -p ~/.config/vastai
mv /tmp/vast_api_key.tmp ~/.config/vastai/vast_api_key
chmod 600 ~/.config/vastai/vast_api_key

# Verify auth works
~/.local/bin/vastai show machines
# Should list any machines already registered to the account (gpuserver1 will appear)

# Shred the local download on Rocinante (run from PowerShell on Rocinante)
sdelete -p 3 -r -s C:\Users\alto8\Downloads\vastai-api-key.txt
# Or on a Linux box: shred -uvz ~/Downloads/vastai-api-key.txt
```

5. Reload the API keys page on Rocinante; the hijack is gone and the page reverts to normal behavior.

**Why this pattern:** the key value is in browser memory + clipboard + the temp download for ≤30 seconds, never in any persistent log. SCP transit is over SSH (encrypted). The key arrives at mode 600 in the canonical path. No tool argument anywhere contains the literal value.

### B.3 — Verify

```bash
# On the new host
ls -la ~/.config/vastai/vast_api_key
# Expected: -rw------- 1 alton alton  64 <date> /home/alton/.config/vastai/vast_api_key
# (gpuserver1's key is exactly 64 bytes; rtxserver's key was the same length)

# Smoke test
~/.local/bin/vastai show machines
# Should NOT error 401 or 403. May show "no machines" or list gpuserver1 etc.
```

If `vastai show user` returns a 400 error ("Extra inputs are not permitted"), that's a known cosmetic issue on CLI v0.5.0 — see vastai-management failure-modes table. Auth is still working.

---

## Phase C — WAN ingress (Fios port-forward + UFW + hairpin NAT)

Vast.ai's NOC needs to reach the host's container ports from outside the LAN. Verizon Fios doesn't support shared DMZ for two hosts (gpuserver1 already holds the DMZ slot) and doesn't support NAT loopback (hairpin) for LAN-side requests to its own WAN IP — so each new host needs:

1. **Fios port-forward:** explicit forward of the host's port range to its LAN IP (manual, web UI)
2. **UFW allow:** firewall accepts inbound on those ports
3. **Hairpin NAT:** local OUTPUT DNAT rule rewrites packets going to the LAN's WAN IP back to the host's LAN IP, so kaalia's self-test (which queries its own external endpoint from inside the LAN) succeeds

Each new host gets its own port range (gpuserver1 = 40000-40099; rtxserver = 40100-40199; future = 40200-40299, etc).

### C.1 — Fios port-forward (Alton, web UI on Rocinante)

1. Open `https://192.168.1.1` in Chrome (Verizon Fios admin)
2. Log in as `Fios admin` (Bitwarden)
3. Navigate to Advanced → Port Forwarding (path varies by Fios firmware version)
4. Create rule:
   - **Protocol:** TCP
   - **External Port Range:** e.g., `40100-40199` (or whatever the host's range is)
   - **Internal IP:** the host's LAN IP (e.g., `192.168.1.157`)
   - **Internal Port Range:** same as external (`40100-40199`)
5. Save / Apply
6. Verify from outside the LAN (mobile hotspot or external host): `nc -zv <fios-wan-ip> 40150` — expect "connection refused" (no listener yet, but UFW is letting traffic through) or "connection succeeded" (something listening)

**Verizon Fios quirk:** the router does NOT do NAT loopback. Requests from inside the LAN to the WAN IP do not hairpin back to the host. That's what Phase C.3 fixes.

### C.2 — UFW allow

```bash
# On the new host, as alton (sudo as needed)
sudo ufw allow 40100:40199/tcp comment "vast.ai customer ports"
sudo ufw route allow proto tcp from any to any port 40100:40199 comment "vast.ai container forward"
sudo ufw status verbose | grep 4010
# Expected: ALLOW Anywhere  on 40100:40199/tcp
```

If UFW is not yet enabled on the host:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "ssh"
sudo ufw allow 40100:40199/tcp comment "vast.ai customer ports"
sudo ufw enable
```

### C.3 — Hairpin NAT

Splice into `/etc/ufw/before.rules`. The full procedure is captured in `sartor/memory/machines/<host>/onboarding-staged/hairpin-nat-rules.txt` for the host being onboarded; abridged here:

```bash
# 1. Backup
sudo cp /etc/ufw/before.rules /etc/ufw/before.rules.pre-vastai-hairpin

# 2. Edit /etc/ufw/before.rules; insert a *nat block BEFORE the *filter block:
sudo nano /etc/ufw/before.rules
```

Insert:

```
*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

# Hairpin NAT — rewrite local connections to our own WAN IP back to LAN IP
# so vast.ai's self-test (running on the host) can reach itself.
-A OUTPUT -d <FIOS_WAN_IP> -p tcp --dport 40100:40199 -j DNAT --to-destination <HOST_LAN_IP>

COMMIT
```

Substitute `<FIOS_WAN_IP>` (current external IP, e.g., `100.1.100.63`) and `<HOST_LAN_IP>` (the host's LAN IP, e.g., `192.168.1.157`).

```bash
# 3. Apply
sudo ufw reload

# 4. Verify
sudo iptables -t nat -L OUTPUT -n -v | grep DNAT
# Expected: DNAT line matching the rule above
```

### C.4 — Docker bridge return-traffic accept

Docker installs its own iptables rules on the DOCKER-USER chain. Without an ESTABLISHED,RELATED accept, return packets get dropped. gpuserver1 has this; new hosts need it too:

```bash
# Persist via systemd unit so the rule survives reboots
sudo tee /etc/systemd/system/docker-user-conntrack.service > /dev/null <<'EOF'
[Unit]
Description=Insert DOCKER-USER conntrack accept (vast.ai)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/sbin/iptables -I DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
ExecStop=/sbin/iptables -D DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now docker-user-conntrack.service

# Verify
sudo iptables -L DOCKER-USER -n -v | head -5
# Expected: line with conntrack ESTABLISHED,RELATED ACCEPT
```

### C.5 — End-to-end verification (before kaalia)

```bash
# WAN reachability — should fail (no listener) but in a useful way
curl -s --max-time 5 -o /dev/null -w '%{http_code}\n' http://<FIOS_WAN_IP>:40150/
# Expected: 000 (connection refused — but the connection refusal is from the host,
# not the router, which means port-forward + UFW + hairpin all work)

# LAN-side hairpin verification (from the host itself)
curl -s --max-time 5 -o /dev/null -w '%{http_code}\n' http://<FIOS_WAN_IP>:40150/
# Expected: 000 (refusal from the host's own LAN-side because nothing listening yet)
# Once kaalia is up, this becomes 200 or similar.
```

---

## Phase D — systemd nvidia-power-cap.service

Boot-time GPU power-cap re-application. Without this, a reboot reverts to the card's nameplate TDP (typically 600W for a Blackwell, ~575W for a 5090) and you risk tripping the wall breaker mid-rental.

```bash
# On the new host
sudo tee /etc/systemd/system/nvidia-power-cap.service > /dev/null <<'EOF'
[Unit]
Description=Apply <hostname> production GPU power cap
After=nvidia-persistenced.service
Before=docker.service
Wants=nvidia-persistenced.service
ConditionPathExists=/usr/bin/nvidia-smi

[Service]
Type=oneshot
ExecStart=/usr/bin/nvidia-smi -pl <CAP_WATTS>
ExecStartPost=/bin/sh -c 'echo "[$(date -Iseconds)] nvidia-power-cap applied: pl=<CAP_WATTS> on all GPUs"; /usr/bin/nvidia-smi --query-gpu=index,power.limit --format=csv'
RemainAfterExit=yes
SuccessExitStatus=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now nvidia-power-cap.service

# Verify
nvidia-smi --query-gpu=index,power.limit --format=csv,noheader
# Expected: each GPU reports the configured cap
```

Substitute `<CAP_WATTS>` per host:

| Host | Cap (W per card) | Reasoning |
|---|---|---|
| gpuserver1 | 575 (default) | Single 5090, 1200W PSU has plenty of headroom |
| rtxpro6000server | 450 | Production cap locked 2026-05-02 after thermal stress sequence; 1400W wall ceiling on 120V/15A outlet |
| Future hosts | TBD per thermal characterization | Always characterize before locking |

The service is `Before=docker.service` so the cap applies BEFORE any rental container can spin up at full nameplate power.

**Reference template** in `sartor/memory/machines/<host>/onboarding-staged/nvidia-power-cap.service` for hosts being onboarded.

---

## Phase E — Kaalia daemon install

The vast.ai host daemon. **This is the only phase that requires Alton at the console** — it prompts for sudo + an interactive port range. Roughly 5-10 minutes wall-clock with `--no-driver`.

### E.1 — Pre-flight

```bash
# Confirm everything kaalia needs is in place
nvidia-smi | head -3        # expect target driver version
docker --version             # expect Docker 29.x or compatible
sudo systemctl is-active docker
~/.local/bin/vastai show machines  # auth works
```

### E.2 — Fetch the installer

```bash
sudo wget https://console.vast.ai/install -O /tmp/vast_host_installer.py
# This URL is a 301 redirect to s3.amazonaws.com/public.vast.ai/kaalia/scripts/vast_host_installer.py
# It's a Python script (NOT bash). API key is the first positional argument.
```

### E.3 — Run the installer (Alton at console for sudo + port prompts)

```bash
# Read API key into env (no echo; doesn't land in shell history because of the parens)
API_KEY=$(cat ~/.config/vastai/vast_api_key)

# Install. ~5-10 min. Will prompt for sudo password + port range.
sudo python3 /tmp/vast_host_installer.py "$API_KEY" \
    --interactive \
    --agree-to-nvidia-license \
    --no-driver \
    --no-libvirt \
    --no-docker
```

**Non-interactive alternative:** the installer also accepts `--ports START END` to skip the port prompt entirely (verified against the installer's argparse on 2026-05-04: `parser.add_argument("--ports", nargs="+")`). Recommended only if you're scripting the install — for first-time bring-up, `--interactive` is safer because it forces a human review of the port range against the per-host allocation table below.

**Flag reasoning:**

| Flag | Why |
|---|---|
| `<api_key>` (positional) | Required. Installer ignores any pre-existing `~/.config/vastai/vast_api_key` — pass the same value here. |
| `--interactive` | Prompts for port range. **Required for Sartor** because each host gets a custom range (40100-40199 for rtxserver, etc). Without `--interactive`, installer picks a default that may collide with another Sartor host. |
| `--agree-to-nvidia-license` | Auto-accept NVIDIA EULA (no prompt). |
| `--no-driver` | **Critical for new Blackwell hosts.** Existing driver 580.126.09 supports Blackwell; letting installer push 535 would break GPU detection. For older cards (5090/4090), `--no-driver` is also safe if your driver is current. If unsure, run `nvidia-smi` and confirm driver version is recent enough for the card class before deciding. |
| `--no-libvirt` | Skip VM/IOMMU provisioning. Not needed for AI rental workloads. |
| `--no-docker` | **Only if Docker is already installed and configured.** Default Sartor hosts have Docker pre-installed; pass this flag. |

### E.4 — Interactive prompts to answer

The `--interactive` flag opens **one prompt set**: port range. The installer asks for **Start Port** then **End Port**.

| Host | Start | End |
|---|---|---|
| gpuserver1 (already onboarded) | 40000 | 40099 |
| rtxpro6000server | 40100 | 40199 |
| Future hosts | 40200 | 40299 (next 100-port block) |

There is no other prompt with `--agree-to-nvidia-license` set. The whole answer phase takes ≤30 seconds.

### E.5 — Verify daemon up

```bash
# Expected final installer message: "Daemon Running => Done!"

# Tree should now exist
ls -la /var/lib/vastai_kaalia/ | head -10
# Expected: bw_report, daemon.tar.gz, data/, host_port_range, kaalia.log, etc.

# Process running
ps aux | grep -i kaalia | grep -v grep
# Expected: launch_kaalia.sh + kaalia binary, owned by vastai_kaalia user

# Port range matches what was entered
sudo cat /var/lib/vastai_kaalia/host_port_range
# Expected: e.g., 40100-40199

# Systemd unit (kaalia runs as `vastai.service` system-level systemd unit;
# also `vast_metrics.service` and `vastai_bouncer.service` are installed)
systemctl status vastai.service 2>&1 | head -10
systemctl is-active vastai.service vast_metrics.service vastai_bouncer.service
```

**Interactive boundary documented:** kaalia install is the one phase that genuinely requires a human-equivalent at the console. Rocinante peer Claudes can prepare everything else (network, power cap, cron suite, MISSION doc) but cannot type the sudo password and port integers without explicit approval. The peer-side preparation makes Alton's window of attention as short as possible — the install, port answers, and "Daemon Running" confirmation should fit in ~10 minutes.

### E.6 — What the installer touches

| Component | Path / unit | Notes |
|---|---|---|
| Kaalia daemon | `/var/lib/vastai_kaalia/latest/kaalia` binary launched by `/var/lib/vastai_kaalia/latest/launch_kaalia.sh` | Auto-start via systemd service `vastai.service` (User=vastai_kaalia, Group=docker, Restart=always, Wants=docker+libvirtd). Two sibling units `vast_metrics.service` and `vastai_bouncer.service` also installed. Verified on gpuserver1 2026-05-04. |
| Machine ID | `/var/lib/vastai_kaalia/machine_id` | Internal hash. Vast.ai assigns the integer machine_id (e.g., 52271) server-side, returned to kaalia via API. |
| Port range | `/var/lib/vastai_kaalia/host_port_range` | Plain text. |
| Data partition | `/var/lib/vastai_kaalia/data/` | 95% of `/var/lib/` free space by default. Loopback file. |
| Docker daemon.json | `/etc/docker/daemon.json` | Installer rewrites with NVIDIA runtime + xfs storage driver. **Backup first if you have custom Docker config.** |
| APT pin | `/etc/apt/preferences.d/vast-packages` | Pins Docker / nvidia-container-toolkit versions. |
| Cron entries (vastai_kaalia user, NOT alton's crontab) | — | Hourly: update_scripts.sh, send_mach_info.py, read_packs.py, enable_vms.py, sync_libvirt.sh, purge_stale_cdi.py. Auto-installed. |

### E.7 — Idempotency note

Re-running the installer on a healthy machine is safe:
- Driver re-install is the dangerous step — `--no-driver` avoids it.
- All other steps check existing state and update in place.
- If kaalia is corrupted, re-run with the same flags to repair.

---

## Phase F — Machine registration + benchmark warm-up

Kaalia's first run does two things:

1. Registers the machine with vast.ai (2-5 minutes after install)
2. Runs initial benchmarks (~30-60 minutes)

You wait. Don't fight it.

### F.1 — Wait for machine registration (2-5 min)

```bash
# Poll until the new host appears in `vastai show machines` alongside any existing hosts
while true; do
  N=$(~/.local/bin/vastai show machines --raw 2>/dev/null \
      | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  echo "$(date -Iseconds) — machine count: $N"
  [ "$N" -ge <expected_count> ] && break
  sleep 30
done

# Capture the new machine_id
~/.local/bin/vastai show machines
```

Substitute `<expected_count>` for the number of machines you expect after this onboarding (e.g., 2 if onboarding rtxserver and gpuserver1 already exists).

### F.2 — Wait for benchmark warm-up (~1 hour)

Kaalia runs initial bandwidth + GPU benchmarks. Self-test (Phase G) will return "BUSY" if run during this window.

```bash
sudo tail -f /var/lib/vastai_kaalia/kaalia.log | grep -iE 'bench|self-test|ready|done'
```

Watch for benchmarks to complete (~30-60 minutes after machine_id appears). Don't restart kaalia, don't re-run the installer, don't attempt to list. Just wait.

---

## Phase G — Self-test

```bash
# Confirms vast.ai's NOC can reach the host's port range from the outside.
~/.local/bin/vastai self-test machine <NEW_MACHINE_ID>
```

**Note:** the correct command is `vastai self-test machine <id>`, NOT bare `vastai self-test`. The bare form does not exist on CLI v0.5.0.

**Expected outputs:**

| Output | Meaning | Action |
|---|---|---|
| Pass + "Machine is ready to be listed" | Network OK, kaalia OK, benchmarks done | Proceed to Phase H |
| "BUSY" | Kaalia mid-benchmark | Wait 15-30 min, retry |
| "Network unreachable" / port-forward error | C.1 (Fios) or C.2 (UFW) or C.3 (hairpin) is wrong | Re-verify Phase C end-to-end |
| "Driver version not supported" | Driver too old for the card | Should not happen if Pre-condition 5 passed; if it does, escalate before listing |

`--ignore-requirements` lets the test run even if minimum spec checks fail. Don't use it for the first self-test; if minimum requirements aren't met, listing is premature.

---

## Phase H — Listing fire

The commercial decision. Apply Alton's "short-term first" preference per [`business/vastai-pricing-strategy.md`](../business/vastai-pricing-strategy.md):

- **First listing of a new host:** on-demand only. **Fixed `-e END_DATE`** (NOT `-l DURATION` rolling reservation).
- Pick an end-date 30-90 days out (Sartor convention has been ~6 months for established hosts; for first listing under "short-term first," use 60-90 days to force a re-evaluation).
- Use the per-GPU price `-g` math from `vastai-management` (the dual-rental case for multi-GPU hosts).
- Internet-bandwidth flags `-u`/`-d` are optional; defaults match gpuserver1 ($3/$2 per TB).

### H.1 — Pricing scan

Before listing, run [`vastai-market-scan`](../../../.claude/skills/vastai-market-scan/SKILL.md) to validate the proposed price against the current market. Output should bracket your target with median + range + percentile.

### H.2 — Fire the listing

```bash
# Per-GPU price, dual-rental for multi-GPU hosts
~/.local/bin/vastai list machine <NEW_MACHINE_ID> \
    -g <PRICE_PER_GPU> \
    -b <FLOOR_PER_GPU> \
    -s 0.10 \
    -m <MIN_CHUNK> \
    -e MM/DD/YYYY
```

Per-host first-listing recommendations (as of 2026-05-04):

| Host | `-g` | `-b` | `-m` | `-e` | Rationale |
|---|---|---|---|---|---|
| rtxpro6000server | 1.25 | 1.00 | 2 | TBD (60-90 days from listing date) | $1.25/GPU × 2 GPUs = $2.50/hr dual-rental, matching the validated 2026-05-02 market anchor (75th percentile of $1.74-$2.93 verified-rentable range). `-m 2` enforces dual-card chunk (192 GB combined VRAM is the differentiator + thermally healthy mode). Fixed `-e` per "short-term first." |
| gpuserver1 (relisting after C.34113802) | TBD per fresh scan | TBD | 1 | TBD | Re-evaluate market when reserved contract ends 2026-08-24; default to on-demand for at least 2-4 weeks before considering another reserved contract. |
| Future hosts | per fresh scan | per fresh scan | per dual-vs-single decision | 60-90 days | Always price-discover before locking. |

### H.3 — Verify the listing

```bash
# Listing should appear in show machines output with listed_gpu_cost set
~/.local/bin/vastai show machines | grep <NEW_MACHINE_ID>

# Cross-check on the web UI
# https://cloud.vast.ai/host/machines (host's view)
# https://500.farm/vastai/machines/show?machine_id=<NEW_MACHINE_ID> (renter's view, useful as a sanity check)
```

---

## Phase I — Verification window

Vast.ai runs automated verification:
- **Lifecycle:** Unverified → Verified → (sometimes) Deverified → Unverified
- **Gate:** CUDA 12.0+, ≥90% reliability, ≥500 Mbps, ≥7 GB GPU RAM, passing self-test
- **Timing:** 1-3 hours per AG-Sec4 community guide; **faster for premium GPUs** (RTX PRO 6000 WS, 8×RTX 5090, B200, H200, H100, A100 are on the prioritized-verification list per docs.vast.ai April 2026 update)

### I.1 — Watch verification status

```bash
# --raw includes the `verified` field
~/.local/bin/vastai show machines --raw \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(m['id'], m.get('verified', '?')) for m in d]"
```

States:
- `false` / `unverified` — initial; expect 30 min - 3h before transition
- `true` / `verified` — listed at full visibility; renters at any tier can find you
- Deverified — something regressed (driver, network, benchmark); investigate

### I.2 — During the window

- Don't reboot.
- Don't re-list (changing flags resets verification per some reports — undocumented, but safer to wait).
- Don't run any host-side GPU work — kaalia is benchmarking continuously during this period.
- Watch `kaalia.log` for benchmark cycles.

### I.3 — If verification doesn't complete in 24h

Escalate:
- File `inbox/rocinante/PHONE-HOME-vastai-verification-stuck-<host>.md`
- Cross-check: confirm self-test still passes (`vastai self-test machine <id>`), confirm the host is still listed, confirm no upstream incidents on vast.ai status page.
- For premium GPUs (RTX PRO 6000 WS), expected verification is hours not days. 24h+ stuck is a signal something is structurally wrong.

---

## Phase J — Cron suite install

Four cron jobs, adapted from gpuserver1's reference. Templates are pre-staged in `sartor/memory/machines/<host>/onboarding-staged/` for the host being onboarded. Install **AFTER** successful first listing — easier to debug script issues against a known-good listing than to debug both at once.

### J.1 — The four scripts

| Script | Schedule | Purpose | Reference |
|---|---|---|---|
| `gather_mirror.sh` | every 4h (`0 */4 * * *`) | Git pull (with named-marker stash/pop), write status JSON to `inbox/<host>/status/`, update `~/sartor-heartbeat.json` | [`onboarding-staged/gather_mirror.sh`](../machines/rtxpro6000server/onboarding-staged/gather_mirror.sh) |
| `stale-detect.sh` | hourly (`0 * * * *`) | Threshold checks (vastai reachability, GPU temp >80C, disk >85%, heartbeat freshness >5h), write debounced inbox alert per hour slot when any signal trips | [`onboarding-staged/stale-detect.sh`](../machines/rtxpro6000server/onboarding-staged/stale-detect.sh) |
| `vastai-tend.sh` | every 30 min (`*/30 * * * *`) | State-change-only listing/rental monitor; writes inbox entry only when state transitions (listed/unlisted, rented/idle) | [`onboarding-staged/vastai-tend.sh`](../machines/rtxpro6000server/onboarding-staged/vastai-tend.sh) |
| `docker-weekly-prune.sh` | Sunday 4 AM (`0 4 * * 0`) | Container/image/network prune (NOT volumes — vast.ai uses volumes for renter persistence). Aborts mid-rental detection | [`onboarding-staged/docker-weekly-prune.sh`](../machines/rtxpro6000server/onboarding-staged/docker-weekly-prune.sh) |

**Drift note:** the rtxserver staged scripts flagged `docker-weekly-prune.sh` as "MAY NOT EXIST" on gpuserver1. Live verification 2026-05-04: it DOES exist on gpuserver1's crontab (`0 4 * * 0 /home/alton/docker-weekly-prune.sh`). The fresh-write spec is correct; gpuserver1 has it.

### J.2 — Install steps

```bash
# 1. Copy staged scripts to ~/
mkdir -p ~/generated/cron-logs
cp ~/Sartor-claude-network/sartor/memory/machines/<host>/onboarding-staged/*.sh ~/
chmod +x ~/gather_mirror.sh ~/stale-detect.sh ~/vastai-tend.sh ~/docker-weekly-prune.sh

# 2. Substitute the actual MACHINE_ID into vastai-tend.sh + any script that references it
sed -i "s/RTXSERVER_MACHINE_ID_TBD/<NEW_MACHINE_ID>/g" ~/vastai-tend.sh
# (verify other staged scripts for placeholder strings — most use `hostname` lookup
# rather than hardcoded MACHINE_ID)

# 3. Confirm inbox path templates are correct (should already be inbox/<host>/ per stage)
grep -n 'inbox/' ~/*.sh

# 4. Syntax-check before installing
for s in ~/gather_mirror.sh ~/stale-detect.sh ~/vastai-tend.sh ~/docker-weekly-prune.sh; do
  bash -n "$s" && echo "OK: $s"
done

# 5. Manual first run of each (verify behavior + populate state)
~/gather_mirror.sh
~/stale-detect.sh
~/vastai-tend.sh
# (skip docker-weekly-prune.sh manually — let it run on Sunday)

# 6. Install cron entries
(crontab -l 2>/dev/null; cat <<'EOF'
# vast.ai operational cron suite — managed by sartor/memory/machines/<host>/CRONS.md
0 */4 * * * /home/alton/gather_mirror.sh
0 * * * *   /home/alton/stale-detect.sh
*/30 * * * * /home/alton/vastai-tend.sh
0 4 * * 0   /home/alton/docker-weekly-prune.sh
EOF
) | crontab -

# 7. Verify
crontab -l | tail -10
```

### J.3 — Inbox creation

```bash
# First gather_mirror run will create these, but pre-creating avoids race
mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/<host>/status
mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/<host>/_stale-alerts
mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/<host>/_vastai
mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/<host>/_docker-prune
mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/<host>/alerts
```

### J.4 — Per-host cap reminder

Per master-plan §5: **6-cron cap across the fleet**. As of 2026-05-04, gpuserver1 is at 5 (the 4 + `rgb_status.py` for hardware LED control). New hosts add 4. The cap is a soft constraint — RGB-style local-display crons that don't write inbox/git are exempt. Hard inbox-writing crons should stay ≤4 per host.

---

## Phase K — MISSION-vXX.md for the new machine

Mirror `machines/gpuserver1/MISSION-v0.1.md` (or v0.2 if reframing for the host's specific role). Content the file should cover:

1. **Identity:** hostname, hardware (BOM links), driver/CUDA versions, network position
2. **Primary duty:** what role this host plays in the household (rental host? household inference? both?)
3. **Pricing context:** current listed price, realized rate, occupancy target
4. **Secondary duties:** monitoring, peer Claude tmux session, cron suite
5. **Autonomy scope:** what the local Claude can decide alone vs escalate
6. **Hard rules:** no git push, no shared-memory edits outside inbox, no sudo escalation, no GPU work during rental, no container interference
7. **Relationship to Rocinante and other peers**
8. **Open questions for Alton**

Draft alongside or after first successful rental. The file goes at `sartor/memory/machines/<host>/MISSION-v0.1.md`. Frontmatter: `type: machine_identity, version: 0.1, author: <host> (Claude <model>), status: active`.

---

## Phase L — First rental closes the loop

The procedure isn't complete until a real client rents the machine. First rental can take hours to days depending on:

- Verification status (verified > unverified, by ~30-50%)
- Pricing percentile (lower percentile fills faster)
- GPU class demand (RTX PRO 6000 WS dual-card is differentiated; first rental may take 2-7 days)
- Time of week (weekday daytime US/EU has higher rental volume)

Watch:

```bash
~/.local/bin/vastai show instances
# When this returns a non-empty result, first rental has happened.
```

When the first rental closes:
- Append a "first-rental record" line to the per-host MISSION.md history
- Update the watcher tracker (e.g., `projects/rtxserver-vastai-watch.md` flips to `archived`)
- Update the [`vastai-management`](../../../.claude/skills/vastai-management/SKILL.md) fleet-inventory table

---

## Recovery / known issues

### Per-host quirks

| Host | Quirk | Workaround |
|---|---|---|
| gpuserver1 | `vastai show user` returns 400 "Extra inputs are not permitted" on CLI v0.5.0 | Cosmetic. Ignore. Use `vastai show machines` for any host-account context. |
| gpuserver1 | Hairpin NAT lives in `/etc/ufw/before.rules`. Any `ufw reset` wipes it. | Backup before any ufw operation; restore from `/etc/ufw/before.rules.pre-vastai-hairpin` if needed. |
| rtxpro6000server | Single-card thermal pathology — Noctua intake recirculation. Dual-card (`-m 2`) breaks the loop. | Don't list with `-m 1` even if a renter wants single-card. Per 2026-05-02 thermal characterization. |
| rtxpro6000server | BMC fan curves only persist if saved to firmware (Customized mode, not Auto) | Curves saved 2026-05-02 via Chrome MCP; verify `Customized mode` after any BMC firmware update. |
| rtxpro6000server | Hooks may report `python: command not found` (Ubuntu uses `python3`) | Non-blocking. Filter from peer-Claude output, don't escalate. |

### Common failure modes (during onboarding)

| Symptom | Phase | Likely cause | Fix |
|---|---|---|---|
| Installer hangs at "Starting kaalia daemon..." | E | Docker not running OR daemon.json conflict | `sudo systemctl start docker`, check `/etc/docker/daemon.json` for syntax errors |
| Installer wants to push driver despite `--no-driver` | E | Flag typo OR installer version mismatch | Re-fetch installer; verify flag spelling exactly |
| Machine never appears in `vastai show machines` after kaalia install | F | Kaalia can't reach `52.90.216.45:7071` (vast.ai control endpoint) | Check outbound network; check `kaalia.log` for connection refused |
| Self-test passes but verification stuck for 12h+ | I | Benchmarks failing repeatedly OR vast.ai backend issue | Tail `kaalia.log` for benchmark errors; if clean, escalate to vast.ai support |
| Listing succeeds but no rentals after 7 days at competitive price | H/I | Verification stuck OR reliability score not yet built | Check `verified` field; reliability builds over time, not instant |
| Cron jobs run but `inbox/<host>/` is empty | J | Path templates not updated (still pointing at gpuserver1 inbox) | `grep -n 'inbox/gpuserver1' ~/*.sh`; replace with `inbox/<host>` |
| `gather_mirror.sh` fails with stash conflicts | J | Local uncommitted changes at the time of pull | Manual `git status` + resolve; re-run script |

### vast.ai support escalation

Vast.ai support engineer **Saber** has handled prior gpuserver1 incidents (2026-04-22 offline event). For platform-level issues (verification stuck, listing not visible, payout delays), escalate via the support form on cloud.vast.ai → Help. Reference Solar Inference LLC + the host account (alto84@gmail.com) for fast routing.

---

## Citations

- vast.ai docs:
  - [Hosting Overview](https://docs.vast.ai/documentation/host/hosting-overview)
  - [Verification Stages](https://docs.vast.ai/documentation/host/verification-stages)
  - [list-machine API reference](https://docs.vast.ai/api-reference/machines/list-machine)
  - [Vast.ai April 2026 Product Update](https://vast.ai/article/april-2026-product-update) (prioritized-verification list)
  - [Rental Types (idle jobs / bid floor)](https://vast.ai/article/Rental-Types)
- Community guides:
  - [AG-Sec4 VastAI-GPU-Host-Guide INSTALLATION.md](https://github.com/AG-Sec4/VastAI-GPU-Host-Guide) — confirmed install command syntax + interactive port-range prompt + verification timing
  - [GPUnex: Vast.ai Review 2026](https://www.gpunex.com/blog/vast-ai-review-2026/) — verified vs unverified pricing
- Internal Sartor:
  - [`projects/rtxserver-vastai-watch.md`](../projects/rtxserver-vastai-watch.md) — research-pass-3 (Q1, Q2, Q3) for canonical listing flags, ToS forbidden/allowed actions, kaalia install command + flag set
  - [`business/vastai-pricing-strategy.md`](../business/vastai-pricing-strategy.md) — short-term-first preference, source for Phase H rules
  - [`business/solar-inference.md`](../business/solar-inference.md) — entity context, gpuserver1 pricing reality
  - [`machines/gpuserver1/MISSION.md`](../machines/gpuserver1/MISSION.md) v0.2 — occupancy-first reframe, supervised-cuts rule
  - [`machines/gpuserver1/CRONS.md`](../machines/gpuserver1/CRONS.md) v0.4 — authoritative cron documentation; pattern-source for Phase J
  - [`machines/gpuserver1/HARDWARE.md`](../machines/gpuserver1/HARDWARE.md) — BOM + thermal characterization template
  - `inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md` — captured commercial decisions (port range, payout entity, cron suite scope)
  - `machines/rtxpro6000server/onboarding-staged/` — pre-staged scripts and configs for rtxserver Phase J + D
  - `inbox/gpuserver1/MISSION-vastai-truth-2026-05-04.md` — read-only verification mission for gpuserver1 peer
  - `inbox/rtxpro6000server/MISSION-vastai-prep-2026-05-04.md` — pre-kaalia readiness mission for rtxserver peer
- Live CLI verification (gpuserver1, 2026-05-04):
  - `vastai --version` → 0.5.0
  - `vastai list machine --help` (full flag table preserved in vastai-management skill)
  - `vastai self-test machine --help` (verb-noun form confirmed)
  - `crontab -l` (5 active jobs, including `docker-weekly-prune.sh` at `0 4 * * 0`)

## History

- 2026-05-04 (Rocinante Opus 4.7): Initial canonical version. Synthesized rtxserver work (paused at `6cee210` 2026-05-02) + gpuserver1 reference + live CLI verification. Procedure replaces the planned-but-never-written file. Awaits validation against `inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md` (peer report) and `inbox/rocinante/gpuserver1-state-2026-05-04.md` (peer report) when those land — neither was on disk at author time. Folded "TBD: validate" notes where they would have applied; structural procedure stands.
