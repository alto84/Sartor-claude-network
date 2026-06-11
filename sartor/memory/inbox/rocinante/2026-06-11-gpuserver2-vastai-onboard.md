# gpuserver2 vast.ai onboarding — 2026-06-11

Alton explicitly authorized listing tonight (2026-06-11); the confirm-before-listing gate was
satisfied up front. Executed per `procedures/vastai-host-onboarding.md` + `vastai-management` skill.

## Result

| Field | Value |
|---|---|
| Machine ID | **139358** |
| Hostname (vast.ai) | gpuserver2 |
| GPU | 1× RTX 5090 32GB, driver 595.71.05, CUDA max 13.2 |
| Listed | YES — 2026-06-11 ~04:20 UTC |
| Price | Listed at approved $0.80/GPU/hr; reprice.py v3 took ownership same hour (04:23Z) and set **$0.64/GPU/hr live** (occupancy-band cold start). $0.65 floor, $0.10/GB-mo storage, min_gpus 1 |
| Listing expiry | 2026-07-11 (fixed `-e`, 30 days, per "short-term first") |
| Ports | 40200-40299, **direct_port_count = 100** (all reachable from vast.ai NOC) |
| Public IP | 108.58.121.254 (Optimum static, UCG Max forward) |
| Measured bandwidth | ~470 Mbps down / ~469 Mbps up (1GbE link is the ceiling) |
| Self-test | **PASSED** (sysreq, ResNet18, ECC, NCCL, 60s stress+gpu-burn) after fixing a container-launch blocker — see Issue 2 below |
| Verification | unverified at list time — automated, runs at least daily; no action needed |
| Dynamic pricing | ENROLLED — fleet.yaml stanza added with `dynamic.enabled: true` (reprice.py v3 picks it up; idle-only applies) |

## What was done (in order)

1. **Pre-flight state check** (SSH alton@192.168.1.175): GPU + driver 595.71.05 OK, power cap
   575W applied, vastai CLI present, Docker ABSENT, UFW inactive, root LV only 100G of 3.64T VG.
2. **Root LV extended** to full 4TB NVMe (`lvextend -l +100%FREE` + online `resize2fs`) BEFORE
   kaalia install so its data partition sized correctly. Note: this consumed the disk into ext4,
   so the installer fell back to a **3.3T loopback XFS** for /var/lib/docker — same layout as
   gpuserver1 (verified at 97.5% reliability), but vast.ai docs prefer a native XFS partition.
   Acceptable; flagged as a future-rebuild consideration only.
3. **Hairpin test pre-install**: curl from gpuserver2 to 108.58.121.254:40250 refused in 2ms →
   UCG Max does native NAT loopback. **No DNAT hairpin rule needed** (unlike Fios-era hosts).
   Phase C.3 of the onboarding doc is obsolete on the UCG Max network.
4. **UFW configured + enabled**: default deny incoming; allow 22/tcp, 40200:40299 tcp+udp,
   route allow 40200:40299/tcp.
5. **Install token** obtained from cloud.vast.ai/host/setup (Alton's Chrome session, logged in
   as alto84@gmail.com). The page elides the token in the DOM; captured the full install command
   via the copy-button clipboard write, saved straight to a file (never echoed), SCP'd to
   gpuserver2. The MCP DLP filter independently blocked the token from transiting chat — good.
6. **Kaalia installed** with `--ports 40200 40299 --agree-to-nvidia-license --no-driver
   --no-libvirt` (Docker deliberately NOT skipped — installer installed Docker + nvidia-ctk).
   NVML test ok, "Daemon Running => Done!". vastai.service + vast_metrics.service active.
   `host_port_range` = 40200-40299.
7. **Token hygiene**: install-command files shredded on both ends, Rocinante clipboard cleared,
   /tmp/vast_install.log + /tmp/vast_host_install.log shredded (root-owned one via sudo).
8. **DOCKER-USER conntrack unit** installed + enabled (docker-user-conntrack.service), rule live.
9. **Registration**: machine appeared as 139358 within ~3 minutes.
10. **External port verification** (the pattern that worked for the other hosts tonight):
    check-host.net TCP check on 108.58.121.254:40299 — connection objects from all 3 nodes
    (nl1 0.095s, us1 0.072s, vn1 0.273s). Port range confirmed open from the internet.
    vast.ai's own probe agrees: direct_port_count = 100.
11. **Listing fired** via gpuserver1's authenticated CLI:
    `vastai list machine 139358 -g 0.80 -b 0.65 -s 0.10 -m 1 -e 07/11/2026`
    → "offers created/updated... @ $0.8/gpu/hr... till 1783728000" (= 2026-07-11 00:00 UTC).
    Verified `listed=True`, `listed_gpu_cost=0.8` in show machines --raw. ($0.80/$0.65 is the
    fleet.yaml-approved 5090 price, matching gpuserver1.) Note: `listed_min_bid`/`min_chunk`
    read None in the raw API response for ALL fleet machines incl. known-good 52271 — response
    shape, not a defect.
12. **Self-test** (`vastai self-test machine 139358` via gpuserver1):
    - Attempt 1 (pre-listing): "not found or not rentable" — current vast.ai flow requires
      listing BEFORE self-test (onboarding doc has the old order; see doc-update follow-up).
    - Attempt 2 (post-listing, ~10 min after install): failed on "PCIe bandwidth <= 2.85,
      RAM < VRAM, cores < 2×GPUs" — all three factually false (Gen5 x16, 256GB vs 32GB,
      16C vs 1 GPU). Raw record showed cpu_cores/cpu_ram/pcie_bw = None → benchmark warm-up
      not complete. Re-ran after fields populated; see final status below.
13. **fleet.yaml**: gpuserver2 stanza added (machine_id 139358, listing block, dynamic.enabled
    true → reprice.py enrollment, marginal floor $0.14 matching gpuserver1's 5090, temps 84/86).
14. **REGISTRY.yaml**: vast_ai_machine_id 139358, description/notes/flags updated.

## Self-test: PASSES (2026-06-11 ~05:30 UTC) — after fixing a real container-launch blocker

Final `vastai self-test machine 139358`: **Test passed** — system requirements, ResNet18,
ECC, NCCL distributed, and the 60s stress-ng + gpu-burn all green. Confirmed twice (once after
the fix, once after persisting it across a daemon restart). Machine is rentable.

Two issues surfaced; both resolved end-to-end:

### Issue 1 (benign, self-cleared): offer-snapshot propagation lag
For ~40 min the self-test rejected on three FALSE spec claims (PCIe <=2.85, RAM<VRAM,
cores<2×GPUs). The self-test reads the renter-side OFFER snapshot, which carried pre-benchmark
Nones while the authoritative machine record already showed pcie_bw 46.6 / 32 cores / 255 GB.
The offer refreshed on its own ~05:18Z (pcie_bw 46.9, cpu_cores 32, cpu_ram 255294) and the
spec rejection vanished. No action needed.

### Issue 2 (REAL, fixed): kaalia could not launch ANY container — shim exit 101
Once specs passed, every test container died with
`kaalia_docker_shim did not terminate successfully: exit status 101` (OCI runtime create
failed). This would have failed every paid rental too — a hard go-live blocker, not cosmetic.

Diagnosis (isolated step by step):
- Plain `docker run` worked; the `nvidia` runtime (= vast's kaalia_docker_shim) did not.
- The REAL `/usr/bin/nvidia-container-runtime` worked perfectly when tested directly (GPU
  enumerated in-container) — so GPU/driver/nvidia-ctk were fine; fault was the shim.
- The shim's per-container start.log gave the exact cause:
  `missing container_gpu_idxs file at ".../data/container_gpu_idxs/<CID>"; refusing to start container`.
- **Root cause: `/var/lib/vastai_kaalia/data/container_gpu_idxs` was owned `root:root`**, while
  every sibling data dir (uuid-idx-mapping, pci_bus_ids, configs, ...) was `vastai_kaalia:docker`.
  Kaalia runs as `vastai_kaalia`, so it could not write the per-container GPU-index file into the
  root-owned dir → shim refused → exit 101. The kaalia installer created the dir root-owned —
  looks like an installer bug on this kaalia build (Ubuntu 24.04 / kernel 6.x).

Fix:
1. `chown vastai_kaalia:docker /var/lib/vastai_kaalia/data/container_gpu_idxs` → self-test
   immediately passed (kaalia wrote the gpu_idxs file; container launched + stress-tested).
2. **Persisted** via systemd drop-in
   `/etc/systemd/system/vastai.service.d/10-gpu-idxs-ownership.conf` with root-prefixed (`+`)
   ExecStartPre that re-asserts the dir + ownership on every kaalia start — survives reboots and
   a re-run of the installer that would recreate it root-owned. Verified: forced it back to root,
   restarted vastai.service, it returned to vastai_kaalia:docker and self-test passed again.

Cleanup: stale per-container CDI specs (`/etc/cdi/D.*.yaml`) from failed runs deleted (kept
`nvidia.yaml`); temp daemon.json test files removed; daemon.json confirmed back to the kaalia
original (single `nvidia` runtime → shim). GPU idle 45-46C, 0%.

Note: an earlier note about daemon states "matching gpuserver1" still holds — vastai active,
vast_metrics auto-restart-looping (203/EXEC) and vastai_bouncer inactive are the fleet norm
(gpuserver1 shows the identical pattern while verified + rented).

**Doc/skill follow-up earned:** add this `container_gpu_idxs` root-ownership failure (shim exit
101 / "missing container_gpu_idxs ... refusing to start container") to the onboarding failure-modes
table and the vastai-management recovery playbook. It is a SILENT go-live blocker — specs and
listing look healthy, but no container (test or rental) can ever start. Diagnostic path: plain
docker works + nvidia runtime fails → test REAL nvidia-container-runtime directly → read
`data/<CID>.start.log` → check `data/container_gpu_idxs` ownership vs sibling dirs.

## Follow-ups

- **Verification watch**: unverified at listing. Automated, at least daily. If still unverified
  after 7 days, escalate per vastai-management weekly ops.
- **Bandwidth at ~470 Mbps** is marginally under the 500 Mbps verification guideline (1GbE
  port/cable is the ceiling; the RTL8126 is a 5GbE NIC). If verification stalls on network
  speed, upgrading the switch port/cable is the fix. Already flagged in REGISTRY.
- **Thermal stress under max load** never ran (bring-up Phase 5). Power cap 575W is provisional.
  Watch GPU temp during first real rental; soft-alert 84C / crit 86C in fleet.yaml.
- **Cron suite (Phase J) + MISSION.md (Phase K)** not installed — needs staged scripts adapted
  for gpuserver2 (inbox/gpuserver2/, machine_id 139358). Recommend after first listing-stable day.
- **Per-host vast.ai API key**: gpuserver2's `~/.config/vastai/` is empty; CLI ops currently
  route through gpuserver1's authenticated CLI. Generate a per-host key (procedure Phase B,
  SCP-clipboard pattern) when convenient — smaller blast radius.
- **Onboarding doc updates earned tonight**: (a) self-test now requires listing first;
  (b) UCG Max replaces Fios Phase C — native hairpin, port-forward via UniFi UI, no DMZ;
  (c) consider reserving an XFS partition for /var/lib/docker at OS-install time instead of
  growing root to 100% (loopback fallback works but is slower).
- **Dynamic pricing took over immediately**: reprice.py set $0.64 live at 04:23Z (fleet.yaml +
  live listing both updated by the controller; verified consistent). Note `min_bid` (0.65) now
  sits ABOVE the dynamic on-demand price (0.64) — interruptible bidders can't undercut on-demand.
  Probably harmless, but consider whether reprice.py should scale min_bid with gpu_cost.
- **acquisition_date for the 5090** missing in fleet.yaml asset block — pull from expense ledger.
- **Phase M check**: no temp firewall holes or key-servers were created tonight; install-token
  artifacts shredded; clipboard cleared. REGISTRY + fleet.yaml updated. Peer rosters
  (creds-sync / sessions-mirror / wellness-checker) do NOT yet include gpuserver2 — that's part
  of the peer-Claude bring-up, not vast.ai onboarding; noting for completeness.
