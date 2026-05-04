---
name: rtxserver-vastai-watch
description: Living tracker for rtxserver's path to first vast.ai rental. Watched by vast-ai-watcher (memory-agents team). Refreshes on relevant commits. Status PAUSED 2026-05-02 pending Verizon Fios WAN-path decision.
type: tracker
status: paused-pending-decision
target: rtxpro6000server (192.168.1.157, dual RTX PRO 6000 Blackwell, 192 GB combined VRAM)
created: 2026-05-02
updated: 2026-05-02-research-pass-3
created_by: vast-ai-watcher (memory-agents team)
related:
  - inbox/rocinante/rtxserver-vastai-decisions-2026-05-02
  - inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02
  - machines/rtxpro6000server/HARDWARE
  - business/solar-inference
  - reference_memory_server
tags: [project/active, project/paused, machine/rtxpro6000server, vast-ai]
---

# rtxserver vast.ai onboarding watch

> **CANONICAL LISTING COMMAND** (per short-term-first preference, see [[business/vastai-pricing-strategy]]):
>
> First listing — fixed end-date for price-discovery window:
> ```
> vastai list machine <id> -g 1.25 -b 1.00 -s 0.10 -m 2 -e MM/DD/YYYY
> ```
> Pick `-e` ~6-12 weeks out (price-discovery window). Use `vastai-management` skill's idle-job + price-adjust ops during the window. Re-evaluate before extending.
>
> Post-discovery (only after 2-4 weeks of fill-rate data) — rolling 6-month or longer-term:
> ```
> vastai list machine <id> -g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"
> ```
>
> $1.25/GPU × 2 GPUs = $2.50/hr dual-rental. `-m 2` forces both-cards-as-one-chunk.
> Per-GPU pricing semantics confirmed via live `vastai list machine --help`;
> see "Pre-fire research Q1" below for full derivation. Earlier `-m 1` references
> are preserved as audit trail; do not use them to fire the listing.

## TL;DR

rtxpro6000server is hardware-ready, BMC-tuned, peer-Claude-online, network-open
(Fios port-forward + UFW + hairpin NAT all in place per team-lead 2026-05-02 eve),
and decision-locked on its commercial parameters. **The active blocker is now the
kaalia host-daemon install**, not the WAN path. The brief's earlier framing — "we
have CLI + API key but no host registration" — is correct: `vastai show machines`
returns only gpuserver1's row. Without kaalia running, there's no machine_id, and
`vastai list machine` has nothing to list. The install command is researched and
ready; needs Alton at the console for one sudo password + a two-integer port-range
prompt. ~1 hour kaalia benchmark warm-up follows the install before self-test will
return clean. Greenlight stands for `vastai list machine` once self-test passes.

**Pre-fire research correction (2026-05-02):** the previously-captured listing flags were
unit-mismatched. `vastai list machine -g` is **per GPU per hour**, not per rental. To match
the validated $2.50/hr dual-system anchor, the correct flag set is **`-g 1.25 -b 1.00 -m 2`**
(both GPUs rented as one chunk, $1.25/GPU × 2 = $2.50/hr total). The previous
`-g 2.50 -m 1` would have meant $2.50/GPU = $5.00/hr dual-rental and allowed renters to
take just one card at $2.50/hr — neither matched the intent. See "Pre-fire research" below.

**Host-GPU-during-rental: forbidden.** Vast.ai's hosting docs explicitly state "the
hardware can not be used for any other purposes" while rented. The 0% utilization on
gpuserver1 under contract C.34113802 is contractually correct, not waste. Permitted
inverse: idle-job mechanism on the Host/Create Job page lets the host run low-priority
work *between* paid rentals. See "Pre-fire research" below.

## Blockers

Status as of 2026-05-02 evening (post-research-pass-3). Network blocker resolved
during the day; new top blocker is the kaalia host-package install.

| # | Blocker | Status | Owner | Next step |
|---|---------|--------|-------|-----------|
| 1 | WAN ingress for ports 40100-40199 | ✅ RESOLVED | — | Fios port-forward, UFW allow, hairpin NAT all in place per team-lead 2026-05-02 evening. |
| 2 | Hairpin NAT for new external IP | ✅ RESOLVED | — | OUTPUT-DNAT rule applied. Confirmation came from team-lead's "we have" checklist in the install-research dispatch. |
| 3 | **Kaalia host daemon installed + machine registered** | **OPEN — TOP BLOCKER** | rtxserver Claude + Alton | Run `sudo python3 /tmp/vast_host_installer.py "$API_KEY" --interactive --agree-to-nvidia-license --no-driver --no-libvirt`. Needs Alton at console for sudo password + port-range prompt (40100, 40199). Without this, rtxserver has no machine_id and `vastai list machine` has nothing to list. See "Pre-fire research Q3" below. |
| 4 | `vastai self-test machine <id>` | BLOCKED ON #3 + ~1h kaalia warm-up | rtxserver Claude | After install, wait 2-5 min for machine to appear in `vastai show machines`, then ~1 hour for kaalia benchmarks to complete. Self-test confirms ports reachable from vast.ai's NOC. **Note:** correct command is `vastai self-test machine`, not `vastai self-test` — the bare form does not exist on CLI v0.5.0. |
| 5 | `vastai list machine` | BLOCKED ON #4 | rtxserver Claude | Approved flags: `-g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"`. See "Pre-fire research Q1". |
| 6 | Cron suite (gather_mirror, stale-detect, vastai-tend, docker-weekly-prune) | NOT INSTALLED | rtxserver Claude | Adapt 4 scripts from gpuserver1 onboarding dump (commit fd80cc3). Path templates use `inbox/rtxserver/`. Install AFTER successful first listing — easier to debug script issues on a known-good listing. |
| 7 | MISSION-v0.1.md for rtxpro6000server | NOT WRITTEN | rtxserver Claude | Draft alongside or after first successful rental. Use machines/gpuserver1/MISSION as the template. |
| 8 | `procedures/vastai-host-onboarding.md` (load-bearing procedure doc) | DEFERRED | rtxserver Claude | Write only after a complete successful run, so the procedure reflects what actually worked. |

## Done — production-ready infrastructure

- **Hardware bring-up complete (2026-04-22).** Threadripper PRO 7975WX, 251 GB DDR5, dual RTX PRO 6000 Blackwell (96 GB each, 192 GB total). Both cards enumerate clean at PCIe 5.0 x16. Driver 580.126.09 / CUDA 13.0. GPU-sag bracket installed to fix a finicky slot.
- **Power envelope locked at 450W/card production cap (2026-05-02).** systemd `nvidia-power-cap.service` re-applies on every boot. Wall draw at 450W/card sustained ≈1100W with ~300W of breaker margin. Tctl peak at 475W/card dual-card was 65°C; at 450W projected lower. Three 140mm fans on hand, deferred. (commits 5f583e9, 37602d0)
- **BMC fan tuning saved to firmware (2026-05-02).** Zones 2-6 bound to PCIE03/PCIE07 GPU temp sources. Curves: 30°C/50% → 50°C/75% → 60°C/90% → 70°C/100%. Mode = Customized. Persists across reboots without OS involvement. Applied via Chrome MCP from Rocinante. (commits 83a75ab, 5f583e9)
- **Single-card vs dual-card thermal asymmetry characterized.** Dual-card mode is *thermally healthier* than single-card because both chassis fan zones engage and break the Noctua intake recirculation. Single-card Tctl pathology documented; -m 2 was rejected partly for this reason. At 450W single-card, projected Tctl peak ≈74°C — under threshold but worth monitoring on long-running single-GPU workloads.
- **Peer Claude auto-respawns (2026-05-02).** User-level systemd unit `~/.config/systemd/user/sartor-claude-peer.service` with lingering enabled for `alton`. Spawns into tmux session `claude-team-1`. Survives reboots without manual SSH re-attach. (commit ab14b0a)
- **Network access (2026-05-01).** rtxserver moved to 3rd-floor finished attic, plugged into UniFi switch port 10. Host IP 192.168.1.157 (DHCP from Fios), BMC 192.168.1.156, DM_LAN secondary at 10.10.10.10. Part of the Sartor-Saxena-Claude Network takeover. (commit c3cb175)
- **OAuth credentials sync every 4h (2026-05-02).** Windows Scheduled Task `Sartor Peer Creds Sync` SCPs fresh `~/.claude/.credentials.json` to rtxserver every 4 hours, keeping the peer Claude's tokens within Anthropic's refresh window across daytime reboots. (commit d78c502)
- **Memory server canonical path (2026-05-02).** `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git` is the bare repo all peers push to. Peer-Claude-on-rtxserver pushes to its own host's bare repo. (commits 738d4fb, 7427a7e)
- **Pricing target validated against live market (2026-05-02).** Dual RTX PRO 6000 WS market via vastai CLI: $1.74-$2.93/hr verified-rentable (median $2.14). Broader visible UI floor: $1.85-$2.72/hr (median ≈$2.00). $2.50 lands at the 75th-85th percentile depending on which median you cite — defensible as a "192 GB combined VRAM is differentiated" anchor. New `vastai-market-scan` skill captures the methodology including the MUI Select Chrome MCP recipe. (commit de2b5d7)
- **Commercial decisions captured (2026-05-02).** $2.50/hr listed, `-m 1` (single rentable unit, 192 GB combined VRAM as market differentiator), Solar Inference LLC Stripe payout (consolidated with gpuserver1), port range 40100-40199 (separate from gpuserver1's 40000-40099), manual port-forward (NOT shared DMZ — Fios doesn't support two DMZ hosts), rgb_status.py port skipped (BMC owns lighting). (commit 43cf9dd, file `inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md`) **[SUPERSEDED 2026-05-02 evening by Pre-fire research Q1: `-g` is per GPU, not per rental. Canonical flags are now `-g 1.25 -b 1.00 -m 2` → $2.50/hr dual-rental. The price target ($2.50 dual), payout entity, port range, and DMZ decisions all stand. The `-m 1` morning-of-2026-05-02 framing remains in this entry as audit trail.]**
- **Replication template captured (2026-05-02).** gpuserver1's peer Claude wrote a self-contained read-back of its own configuration (live crontab, iptables, UFW, kaalia paths, scripts verbatim) into `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` (commit fd80cc3). This is the canonical "how to bring up the second host" doc.

## Open work (ordered)

Reflects post-2026-05-02-research state. WAN path resolved (Fios port-forward + UFW
+ hairpin NAT done); kaalia install is now the gating step.

1. **Install kaalia daemon.** `sudo python3 /tmp/vast_host_installer.py "$API_KEY" --interactive --agree-to-nvidia-license --no-driver --no-libvirt`. Needs Alton at console for sudo + port prompt (`40100`, `40199`). 5-10 min wall-clock with `--no-driver`. See "Pre-fire research Q3" for full reasoning on the flag set.
2. **Wait for machine registration** (2-5 min). Poll `vastai show machines` until rtxserver row appears alongside gpuserver1. Note the assigned machine_id.
3. **Wait for kaalia benchmark warm-up** (~1 hour). `tail -f /var/lib/vastai_kaalia/kaalia.log` to watch progress. Don't fight it.
4. **Run `vastai self-test machine <id>`.** Confirms ports reachable from vast.ai's NOC.
5. **List the machine.** `vastai list machine <id> -g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"`. Per-GPU pricing × `-m 2` (forced dual chunk) = $2.50/hr dual-rental, matching the validated market anchor. See "Pre-fire research Q1" for derivation.
6. **Wait for verification** (1-3 hours per AG-Sec4 community guide; faster for RTX PRO 6000 WS per docs.vast.ai April 2026 prioritized-verification list).
7. **Install cron suite.** 4 jobs: `gather_mirror.sh` every 4h, `stale-detect.sh` hourly, `vastai-tend.sh` every 30 min, `docker-weekly-prune.sh` Sunday 4 AM. Adapt paths from gpuserver1 onboarding dump (commit fd80cc3). Install after first successful listing — easier to debug script issues on a known-good listing.
8. **Write `MISSION-v0.1.md`** for rtxpro6000server, mirroring `machines/gpuserver1/MISSION.md` shape.
9. **Write `procedures/vastai-host-onboarding.md`** as the canonical procedure, drafted from what actually worked.
10. **First-rental confirmation.** First successful client connection closes the bring-up loop.

## Recent activity (last ~14 days)

- **2026-05-02 late evening — research-pass-3** (vast-ai-watcher): three research dimensions answered. Q1 surfaced the per-GPU `-g` pricing semantics (corrected `-g 2.50 -m 2` → `-g 1.25 -m 2`), Q2 verdict on host-GPU-during-rental is forbidden by ToS ("the hardware can not be used for any other purposes"), Q3 produced the canonical kaalia install command + flag set + step-by-step. Tracker now has 8 blockers (was 7), with kaalia install as the new top blocker — Fios WAN + UFW + hairpin all closed during the day per team-lead's pre-install checklist.
- **2026-05-02 evening** (`5f583e9`, `ab14b0a`, `d78c502`, `de2b5d7`, `43cf9dd`, `fd80cc3`): rtxserver thermal stress complete (verdict 450W/card production envelope), peer-comms skill updated for systemd auto-respawn pattern, CLAUDE.md infrastructure block written, vastai-market-scan skill committed with $2.50 validation, curator pass reconciled $0.30/$0.40/$0.35 doc drift on gpuserver1, gpuserver1 wrote the self-contained replication dump to inbox.
- **2026-05-02 morning/afternoon** (`7427a7e`, `738d4fb`, `c3cb175` from 5/1): Memory server architecture switched — rtxserver bare repo became the canonical write target, GitHub demoted to nightly DR mirror. The Sartor-Saxena-Claude Network takeover (5/1) put rtxserver on its current network port.
- **2026-04-29** (`37602d0`, `83a75ab`, `616ae96`, `d11076b`): Post-BMC-binding 475W stress was *marginal* (GPU0 84°C peak, +10.9°C inter-card delta). BMC fan source bindings to PCIE03/PCIE07 applied. Cooling-upgrade phone-home filed at `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` with 3 options. The 2026-05-02 stress with aggressive curves + dual-card resolved this — cap at 450W is the answer.
- **2026-04-28** (`b5b33f6`): BMC reference doc for rtxpro6000server (fan control, IPMI, self-management runbook).
- **2026-04-27** (`6f0f4f1`, `2be8109`): Phase A fan-control investigation found nct6798 PWM writes silently ineffective. Path B `acpi_enforce_resources=lax` applied. Original RESUME-after-shutdown-2026-04-27.md doc filed; superseded by the BMC path that ultimately worked.
- **2026-04-26** (`51bc299`, hardware mapping): Per-machine HARDWARE.md created. Live recon via dmidecode/lscpu/nvidia-smi/sensors. PSU rating identified as Phase F gating unknown.
- **2026-04-22** (`1c3b3bf`): Blackwell bring-up + overnight training kickoff. Third peer machine `rtxpro6000server` online with HWE 6.8 kernel.

## Pre-fire research (2026-05-02, vast-ai-watcher)

Two questions the team-lead routed to research before the rtxserver peer fires
`vastai list machine`. Findings ground the listing decision in primary-source vast.ai
docs + the live `--help` text, not memory's snapshot.

### Q1 — Listing flags and best-practice for new/unverified host

**`vastai list machine --help` (live from rtxserver, 2026-05-02 evening) — direct quotes:**

- `-g PRICE_GPU` → "per gpu rental price in $/hour (price for active instances)"
- `-b PRICE_MIN_BID` → "per gpu minimum bid price floor in $/hour"
- `-m MIN_CHUNK` → "minimum amount of gpus (default: 1)"
- `-e END_DATE` → "contract offer expiration … in unix float timestamp or MM/DD/YYYY"

The `-g` and `-b` units are **per GPU per hour, not per rental**. This is confirmed
by the API reference at `docs.vast.ai/api-reference/machines/list-machine` ("price_gpu:
Price per GPU per hour"). For a 2-GPU machine:

| Flags | What renter sees | Total $/hr at full rental |
|-------|------------------|---------------------------|
| `-g 2.50 -m 1` | "Rent 1 or 2 GPUs at $2.50 each" | $5.00 dual / $2.50 single |
| `-g 2.50 -m 2` | "Must rent both at $2.50 each" | $5.00 dual (no single allowed) |
| **`-g 1.25 -m 2`** | **"Must rent both at $1.25 each"** | **$2.50 dual — matches market anchor** |
| `-g 1.25 -m 1` | "Rent 1 or 2 GPUs at $1.25 each" | $2.50 dual / $1.25 single |

The 2026-05-02 market scan (skill `vastai-market-scan`) found dual RTX PRO 6000 WS
listings at $1.74-$2.93/hr verified-rentable, CLI median $2.14, UI median ~$2.00.
Those are **dual-system totals** in market reporting, so the comparable host-side
flag is `-g <total/2>`. **$2.50 dual-system → `-g 1.25`.**

**Single-vs-dual rental policy:** Curator decision (2026-05-02, `inbox/rocinante/
rtxserver-vastai-decisions-2026-05-02.md`) was "list as one rentable unit, 192 GB combined
VRAM is the differentiator." That maps to `-m 2`, not `-m 1`. The original brief's
note that "`-m 2` was corrected from `-m 1` to address single-card thermal pathology"
points the same direction: thermal characterization showed dual-card mode is healthier
than single-card (Noctua intake recirculation only breaks when both chassis fan zones
engage). `-m 2` enforces this both as a market position and as a thermal protection.

**Verification process (docs.vast.ai/documentation/host/verification-stages):**
- Lifecycle: **Unverified → Verified → (sometimes) Deverified → Unverified**
- Automated; no manual intervention. CUDA 12.0+, ≥90% reliability, ≥500 Mbps,
  ≥7 GB GPU RAM, passing self-test.
- "Machines with datacenter GPUs such as B200, H200, H100, A100, etc., **and those
  with premium GPUs such as RTX PRO 6000 WS**, 8×RTX 5090, 8×RTX 4090, etc., receive
  prioritized verification processing due to their high demand and performance
  capabilities." — direct quote, vast.ai April 2026 product update.
- Reliability is independent of verification status (per docs); verification is a
  technical-spec gate, reliability is uptime/job-success history.

**New-host pricing strategy (community signal, gpunex.com / aitooldiscovery):**
Unverified H100 hosts run ~$0.90/hr while verified data-center H100s are $1.50-$1.87/hr
— a 30-50% discount window for new/unverified machines. After verification, prices ratchet
up. Two viable launch strategies:

- **Launch-at-target ($1.25 × 2 = $2.50 dual)**: lists in 75th-85th percentile from day 1.
  Risk: zero rentals during the unverified window, longer time to first reliability data,
  longer time to verified status. Acceptable if verification is fast for premium GPUs (the
  doc quote suggests it is).
- **Launch-discounted then ratchet ($0.99 × 2 = $1.98 dual for first 2 weeks, then
  raise to $1.25)**: captures first renters during unverified window, builds
  reliability score faster. The host-side action to raise a listing's price is a
  `vastai list machine <id> -g <new>` update (or web UI). Existing renters receive a
  "price-increase challenge" notification from vast.ai and accept via the platform's
  web UI on the renter side; until they accept, their auto-extend stops at the old
  price. **There is no `vastai accept` CLI verb** — the original note in this section
  inherited an error from the source docs (corrected 2026-05-03 by vastai-management
  reviewer).

**Recommendation: launch-at-target ($1.25/GPU, $2.50 dual).** Reasoning: (1) RTX PRO 6000
WS is on the docs' explicit "prioritized verification" list, so the unverified window
should be short, (2) the dual-system 192 GB VRAM is a market differentiator that loses
its value at a discount, (3) the price-increase challenge mechanism does not give you
back the customers you already lost — clients who rented at $0.99 may decline the
ratchet and you re-enter the unverified-comparable window. Hold a discount in reserve as
plan B if no rentals materialize within ~10 days of listing.

**Listing duration:** gpuserver1 used 6 months. `--help` shows `-l DURATION` as a
rolling-renewal alternative to `-e END_DATE` ("Updates end_date daily to be duration
from current date"). For a new host where the goal is "always listed forward," `-l "6 months"`
is cleaner than picking a fixed `-e` date.

### Q2 — Host GPU usage during paid rental

**Verdict: forbidden** (during active rental). Permitted (between rentals via idle job).

**Primary source — Hosting Overview (docs.vast.ai/documentation/host/hosting-overview):**
> "the hardware can not be used for any other purposes"
> "the client's data must be isolated and protected according to the data protection policy"

Plus the new-host requirements page: "dedicated machines only that shouldn't be doing
other tasks while rented." This is unambiguous. CUDA MPS, MIG partitioning, time-sliced
co-tenancy, and any host-side GPU process during a paid rental all violate the hosting
agreement. Doing so risks reliability score penalties and host-account termination per
the same doc ("If your machine has an active client job and then goes offline, crashes,
or has performance problems, this could permanently lower your reliability rating" —
quoted from the `--help` text itself).

**Permitted inverse — idle jobs (vast.ai FAQ + Rental Types article):**
> "As a host you can set a min bid price for your machine by creating an idle job at
> that price on the Host/Create Job page. If you don't want to setup a true mining
> idle job, you can just use 'ubuntu' as the image and 'bash' as the command."
> "Hosts can run low priority jobs on their own machines, so there is always a fallback
> when high priority jobs are not available."

Mechanism: the host creates a self-rental at the bid floor. When a paying client outbids,
the idle job is preempted (interruptible). When no clients are bidding, the host's own
job runs. This is the legitimate path to "useful idle GPU time."

**Implication for Alton's gpuserver1 observation:** the 0% util under reserved contract
C.34113802 is contractually correct. A reserved contract precludes both client-bid
preemption AND host idle-job execution — the GPU is dedicated to that one client even
if their containers are empty. The $0.20/hr realized rate is paying for *availability*,
not utilization. Net economic: still profitable per Alton's framing ("they're sipping
power, so works out to profit"); the surfacing of this confirms that's the right frame.

**For rtxserver going forward:** if Alton wants productive idle time, the path is to
list with on-demand pricing (no reserved contract), then create a host-side idle job
at $0.50-$1.00/hr range that runs his own workload (training, inference, household-agent
work) when no client is bidding. Not relevant for v1 launch — list normally first.

### Greenlight verdict

**GREENLIGHT to fire `vastai list machine` once blockers 1-7 close, with these
corrected flags:**

```bash
~/.local/bin/vastai list machine <machine_id> \
  -g 1.25 \
  -b 1.00 \
  -s 0.10 \
  -m 2 \
  -l "6 months"
```

Where:
- `-g 1.25` → $1.25/GPU/hr × 2 GPUs = $2.50/hr dual-rental (matches validated market anchor)
- `-b 1.00` → $1.00/GPU/hr interruptible floor × 2 = $2.00/hr (gives ~20% discount
  to interruptible renters, aligns with gpuserver1's $0.30/$0.25 = ~17% pattern)
- `-s 0.10` → $0.10/GB-month storage (matches gpuserver1)
- `-m 2` → must rent both GPUs as a single chunk (192 GB VRAM is the product;
  also enforces dual-card thermal-healthy mode)
- `-l "6 months"` → rolling 6-month listing horizon (cleaner than fixed end-date)

Internet bandwidth flags `-u`/`-d` are optional; defaults match gpuserver1 ($3/$2 per TB).
Omit them and let the platform pick.

### Q3 — Host-package install (kaalia daemon) for new dual-GPU host

**Real blocker surfaced 2026-05-02 evening:** the vast.ai host daemon (kaalia) is NOT
installed on rtxserver. We have CLI + API key but no host-side registration. `vastai
show machines` returns only gpuserver1's row — there's no rtxserver machine ID yet,
so `vastai list machine` has nothing to list and `vastai self-test machine` has nothing
to test.

**Canonical install command (verified 2026-05-02):**

```bash
sudo wget https://console.vast.ai/install -O /tmp/vast_host_installer.py
sudo python3 /tmp/vast_host_installer.py <API_KEY> --interactive
```

The `console.vast.ai/install` URL is a 301 redirect to the canonical S3 bucket:
`https://s3.amazonaws.com/public.vast.ai/kaalia/scripts/vast_host_installer.py`. The
installer is a Python script (NOT bash). API key is the **first positional argument**.

**Key flags (from installer source):**

- `<api_key>` → first positional, **required**. The installer ignores any pre-existing
  `~/.config/vastai/vast_api_key` — pass the same key value here.
- `--interactive` → prompts for port range. **REQUIRED for rtxserver** because we need
  custom ports `40100-40199` (gpuserver1 uses `40000-40099`). Without `--interactive`,
  installer picks a default range that may collide.
- `--agree-to-nvidia-license` → auto-accept NVIDIA EULA (no prompt).
- `--no-driver` → **USE THIS FOR rtxserver.** Driver 580.126.09 + CUDA 13.0 is already
  installed and working. Letting the installer try to overwrite with 535 would break
  the Blackwell card support.
- `--no-libvirt` → skip VM/IOMMU provisioning. Not needed for AI rental workloads
  on dual-Blackwell.
- `--no-docker` → only if Docker is already installed. Verify with `docker --version`
  before passing.
- `--storage-size <GiB>` → loopback file size for kaalia's data partition. Default is
  95% of `/var/lib/` free space, which is usually fine.

**Recommended invocation for rtxserver:**

```bash
# Read API key from disk into env, don't echo to history
API_KEY=$(cat ~/.config/vastai/vast_api_key)

# Pre-flight: confirm driver + docker already in place
nvidia-smi | head -3                  # expect "Driver Version: 580.126.09"
docker --version                      # expect Docker 29.x

# Install — drops driver install, keeps interactive port-range prompt
sudo python3 /tmp/vast_host_installer.py "$API_KEY" \
    --interactive \
    --agree-to-nvidia-license \
    --no-driver \
    --no-libvirt
```

**Interactive prompts (must be answered live):**

The `--interactive` flag opens ONE prompt: port range. The installer asks for
**Start Port** then **End Port**. Enter `40100` and `40199`. There is no other
prompt with `--agree-to-nvidia-license` set. Verified via the AG-Sec4 community
guide and the installer source.

**Cannot fire from peer's tmux without Alton-or-equivalent at the console** — `sudo`
plus the interactive port-range prompt mean the peer Claude needs either (a) Alton
typing the sudo password and the two port numbers, or (b) pre-staged `sudo -n` access
plus a here-doc / `expect`-style answer file. Path (a) is cleaner; the prompts are
two integers and take ≤30 seconds.

**What gets installed (verified against gpuserver1's live state, 2026-05-02):**

| Component | Path / unit | Notes |
|-----------|-------------|-------|
| Kaalia daemon | `/var/lib/vastai_kaalia/latest/kaalia` (binary) launched by `launch_kaalia.sh` | Runs as `vastai_kaalia` user. **NOT a systemd unit** — auto-start is via `/etc/init.d/vastai_kaalia_update` (sysvinit-compatible). |
| Machine ID | `/var/lib/vastai_kaalia/machine_id` | Internal hash. Vast.ai assigns the integer machine_id (e.g., 52271) server-side. |
| Port range | `/var/lib/vastai_kaalia/host_port_range` | Plain text, `40100-40199` for rtxserver. |
| Data partition | `/var/lib/vastai_kaalia/data/` | 95% of `/var/lib/` free space by default. Loopback file. |
| Docker daemon.json | `/etc/docker/daemon.json` | Installer rewrites with NVIDIA runtime + xfs storage driver. **Backup first if you have custom Docker config.** |
| APT pin | `/etc/apt/preferences.d/vast-packages` | Pins Docker/nvidia-container-toolkit versions. |
| Cron entries (vastai_kaalia user) | — | Hourly: update_scripts.sh, send_mach_info.py, read_packs.py, enable_vms.py, sync_libvirt.sh, purge_stale_cdi.py. Auto-installed. |

**Idempotency:** **Partially idempotent.** Most steps check for existing state, but:

1. NVIDIA driver install triggers a **system reboot**. With `--no-driver` this is avoided.
2. Re-running on a healthy machine is safe per gpuserver1's history (driver pinned,
   Docker config preserved if you back it up first).
3. If kaalia is already running, the installer detects via `/var/lib/vastai_kaalia/`
   existing and updates the daemon binary in place. For a fresh rtxserver, this is N/A.

**Post-install timeline (informed by gpuserver1's live state + community guides):**

| Step | Expected wall-clock |
|------|---------------------|
| Installer runs (with `--no-driver`) | 5-10 min (Docker reconfigure, package pinning, kaalia download, daemon launch) |
| Kaalia first heartbeat to `52.90.216.45:7071` | Within 60 seconds of launch |
| Machine appears in `vastai show machines` | **2-5 minutes** after kaalia first contact |
| Initial benchmark sweep (kaalia.log shows progress) | **30-60 minutes** — this is the warm-up period; `vastai self-test machine <id>` may fail or return "BUSY" if run during this window |
| Self-test ready to run | After benchmarks complete (~1 hour after install) |
| Verification (Unverified → Verified) | **1-3 hours** per AG-Sec4 community guide; faster for premium GPUs (RTX PRO 6000 WS is on the prioritized-verification list per docs) |

**Important CLI command corrections (from live `--help` on rtxserver, 2026-05-02):**

The brief and the prior tracker version used `vastai self-test`. The actual command
is **`vastai self-test machine <id>`** (verb-noun form, like `vastai show machines`).
There is no bare `vastai self-test`. Confirmed against the 145-command CLI surface.

**Order of operations to confirm in revised resume command-list (below):**

1. Pre-flight verify driver + docker already in place
2. Read API key from disk into env (no echo)
3. Run `vast_host_installer.py` with `--no-driver --interactive --agree-to-nvidia-license --no-libvirt`
4. Answer port-range prompt: `40100`, `40199`
5. Wait for "Daemon Running => Done!" message
6. Wait 2-5 min, then poll `vastai show machines` until rtxserver row appears
7. Note the assigned `machine_id`
8. Wait ~1 hour for kaalia benchmark warm-up (don't fight it)
9. `vastai self-test machine <id>` — confirms reachability + benchmarks
10. `vastai list machine <id> -g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"`
11. Wait 1-3 hours for verification (likely faster for RTX PRO 6000 WS)
12. First rental closes the loop.

### Citations

- [vast.ai list machine API reference](https://docs.vast.ai/api-reference/machines/list-machine)
- [Verification Stages](https://docs.vast.ai/documentation/host/verification-stages)
- [Hosting Overview](https://docs.vast.ai/documentation/host/hosting-overview)
- [Vast.ai April 2026 Product Update](https://vast.ai/article/april-2026-product-update)
- [Rental Types (idle jobs / bid floor)](https://vast.ai/article/Rental-Types)
- [GPUnex: Vast.ai Review 2026 — verified vs unverified pricing](https://www.gpunex.com/blog/vast-ai-review-2026/)
- [aitooldiscovery: Vast.ai Review 2026 — reliability-score-driven pricing](https://www.aitooldiscovery.com/ai-infra/vast-ai-review)
- [AG-Sec4 VastAI-GPU-Host-Guide INSTALLATION.md](https://github.com/AG-Sec4/VastAI-GPU-Host-Guide) — community guide; confirmed install command syntax + interactive port-range prompt + "1-3 hours verification" expectation
- [vast_host_installer.py source](https://s3.amazonaws.com/public.vast.ai/kaalia/scripts/vast_host_installer.py) — canonical installer (Python, ~argv flags, prerequisites, install paths)
- Live `vastai list machine --help` from rtxserver, 2026-05-02 (CLI v0.5.0)
- Live state of `/var/lib/vastai_kaalia/` and `vastai_kaalia` user crontab on gpuserver1, inspected 2026-05-02 evening

## Resume command-list

Revised end-to-end (2026-05-02 research pass). Pre-install pieces that already exist
have a checkmark; remaining steps are ordered. Fire from rtxserver's tmux session.
Steps 4 (interactive prompt) and 7 (confirmation) need a human-or-equivalent at the
console — the rest can run unattended.

```bash
# === PRE-INSTALL CHECKLIST ===
# ✅ vastai CLI installed (~/.local/bin/vastai, v1.0.8 per peer report)
# ✅ API key at ~/.config/vastai/vast_api_key chmod 600
# ✅ Hairpin NAT for 40100-40199 → 192.168.1.157
# ✅ Fios port-forward 40100-40199 → 192.168.1.157
# ✅ UFW allow 40100-40199/tcp
# ✅ systemd nvidia-power-cap.service @ 450W
# ✅ systemd sartor-claude-peer.service

# === STEP 0 — sanity ===
ssh alton@192.168.1.157
tmux attach -t claude-team-1
git -C ~/Sartor-claude-network pull origin main
nvidia-smi | head -3                    # expect Driver Version: 580.126.09 (Blackwell)
docker --version                        # expect Docker 29.x or compatible
~/.local/bin/vastai show user           # confirm alto84@gmail.com / Solar Inference LLC

# === STEP 1 — fetch installer ===
sudo wget https://console.vast.ai/install -O /tmp/vast_host_installer.py
# (URL is a 301 to s3.amazonaws.com/public.vast.ai/kaalia/scripts/vast_host_installer.py)

# === STEP 2 — read API key into env (no echo) ===
API_KEY=$(cat ~/.config/vastai/vast_api_key)

# === STEP 3 — RUN INSTALLER (5-10 min) ===
sudo python3 /tmp/vast_host_installer.py "$API_KEY" \
    --interactive \
    --agree-to-nvidia-license \
    --no-driver \
    --no-libvirt
# --no-driver is CRITICAL: existing 580.126.09 supports Blackwell;
# letting installer push 535 would break GPU detection.

# === STEP 4 — answer interactive prompt (one prompt, two integers) ===
# Start Port: 40100
# End Port:   40199

# === STEP 5 — verify daemon ===
# Expected final installer message: "Daemon Running => Done!"
ls -la /var/lib/vastai_kaalia/                      # tree should now exist
ps aux | grep -i kaalia | grep -v grep              # expect launch_kaalia.sh + kaalia binary
cat /var/lib/vastai_kaalia/host_port_range          # must read: 40100-40199

# === STEP 6 — wait for machine registration (2-5 min) ===
# Poll until rtxserver appears alongside gpuserver1 in show machines
while true; do
  N=$(~/.local/bin/vastai show machines --raw 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  echo "$(date -Iseconds) — machine count: $N"
  [ "$N" -ge 2 ] && break
  sleep 30
done
~/.local/bin/vastai show machines                   # capture the new machine_id

# === STEP 7 — kaalia benchmark warm-up (≈1 hour, hands off) ===
# kaalia runs initial bandwidth + GPU benchmarks. Do not interrupt. Watch progress:
sudo tail -f /var/lib/vastai_kaalia/kaalia.log | grep -iE 'bench|self-test|ready'

# === STEP 8 — self-test (after warm-up complete) ===
~/.local/bin/vastai self-test machine <NEW_MACHINE_ID>
# Confirms vast.ai NOC can reach the host. Failure here = port-forward / hairpin issue.

# === STEP 9 — LIST THE MACHINE (commercial decision pre-approved) ===
~/.local/bin/vastai list machine <NEW_MACHINE_ID> \
    -g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"
# $1.25/GPU × 2 = $2.50/hr dual-rental | -m 2 forces dual-card chunk
# (192 GB combined VRAM is the differentiator + thermal-healthy mode)

# === STEP 10 — verification window (1-3 hours; faster for RTX PRO 6000 WS) ===
# Watch reliability + verification status climb on https://cloud.vast.ai/host/machines

# === STEP 11 — first rental closes the loop ===

# === STEP 12 — install cron suite (post-rental, household monitoring) ===
# Templates in inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md (commit fd80cc3).
# Adapt MACHINE_ID, INBOX path to inbox/rtxserver/, source: rtxserver.
# Suite: gather_mirror.sh (4h), stale-detect.sh (1h), vastai-tend.sh (30min),
#        docker-weekly-prune.sh (Sun 4 AM).
crontab -e   # paste the 4-line block

# === STEP 13 — verify on web UI + 500.farm/dashboard ===
# https://cloud.vast.ai/host/machines (host's view)
# https://500.farm/vastai/machines/show?machine_id=<NEW_MACHINE_ID> (renter's view)
```

**Reference UFW + hairpin commands (already applied per checklist; documented here
for re-creation):**

```bash
sudo ufw allow 40100:40199/tcp comment "vast.ai rtxserver"
sudo ufw route allow proto tcp from any to any port 40100:40199 comment "vast.ai containers"
sudo iptables -t nat -A OUTPUT -d <PUB_IP> -j DNAT --to-destination 192.168.1.157
```

## When this file should refresh

Refresh triggers (vast-ai-watcher should re-edit this file on any of these):

- Any commit touching `machines/rtxpro6000server/`, `inbox/rtxserver/`, or `inbox/rocinante/` with `rtxserver` in subject.
- Any commit message containing `vast.ai`, `vastai`, `port-forward`, `fios`, `dmz`, `hairpin`, `kaalia`, `onboarding`, or `mission` related to rtxserver.
- Any new file at `procedures/vastai-host-onboarding.md`, `machines/rtxpro6000server/MISSION-v*.md`, or `inbox/rtxpro6000server/RESUME-vastai-onboarding-*.md`.
- Manual ping from Alton ("refresh the rtxserver tracker").

On refresh: append to "Recent activity", update blocker statuses, move items between "Open work" and "Done" as they resolve, and bump frontmatter `updated:`.

When the machine has its first rental and the procedure doc is written, this tracker's status flips to `archived` and a one-line "first-rental record" entry is added under "Done".

## Open caveats

- The brief that spawned this tracker references three on-disk seed files (`inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`, `machines/rtxpro6000server/MISSION-v0.1.md`, `projects/rtx-stress-design-2026-05-02.md`) and a pause commit (`6cee210`). None exist in the current tree as of 2026-05-02 evening. State here is reconstructed from on-disk evidence (the curator's decisions doc, gpuserver1's onboarding dump, the 2026-05-02 stress commit, the peer-comms skill updates) plus the brief's explicit summary. When the rtxserver-side RESUME doc and MISSION-v0.1.md actually land, link them in the related-list above and merge their content into the relevant sections here.
- `inbox/rtxserver/` does not yet exist as a directory — gpuserver1's dump used `inbox/rtxserver/` in path templates, but no commits have yet created this path. First rtxserver-side commit will need to `mkdir -p sartor/memory/inbox/rtxserver/`.
- Listing `end_date` for first list: gpuserver1's pattern is 6 months. Pick a Friday for clean accounting; first reasonable date is 2026-11-02.
