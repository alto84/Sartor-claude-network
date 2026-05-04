---
name: vastai-management
description: Day-to-day, week-to-week, and recovery operations for the Sartor vast.ai GPU rental fleet. Loads fleet inventory, listing strategy (Alton's "short-term first"), CLI flag semantics, idle-job mechanics, pricing-adjustment workflow, and recovery playbooks. Invoke before any vast.ai operational action — checking earnings, adjusting price, relisting, debugging an offline machine, or onboarding a new host (in which case also invoke the canonical procedure at sartor/memory/procedures/vastai-host-onboarding.md). Skip for one-shot read-only queries already covered by gpu-fleet-check.
---

# vastai-management — Sartor's vast.ai operational manual

The skill any future Claude (or peer-machine Claude) loads to do real work against vast.ai. Codifies the fleet inventory, the listing-strategy preference, the CLI flag semantics that aren't obvious from `--help`, the recovery patterns that have actually been used, and the decision rules for raising or lowering price.

This skill is **operational**. The bring-up procedure for a brand-new host is in [`sartor/memory/procedures/vastai-host-onboarding.md`](../../../sartor/memory/procedures/vastai-host-onboarding.md). Pricing-scan methodology (live market comps) is in [`vastai-market-scan`](../vastai-market-scan/SKILL.md). Pricing-recommendation analysis is in [`gpu-pricing-optimizer`](../gpu-pricing-optimizer/SKILL.md). Daily fleet status is in [`gpu-fleet-check`](../gpu-fleet-check/SKILL.md). Don't duplicate those — invoke them.

## When to invoke

Invoke when about to:

- Adjust a Sartor host's listing (price, end-date, min-bid, chunk size)
- Check earnings, active rentals, or contract status across the fleet
- Diagnose a machine that went offline, lost its listing, or stopped earning
- Recover from a kaalia-daemon failure, NIC issue, or hung rental
- Set up an idle job to capture between-rental utilization
- Decide whether to accept a renter's reserved-contract offer
- Relist a machine after listing expiry or contract end
- Onboard a brand-new host (load this skill AND the procedure doc)

Skip for: a single read-only `show machines` / `show earnings` from a briefing context — `gpu-fleet-check` is lighter for that.

## Sartor fleet inventory

Authoritative state of the fleet. Update on each meaningful change.

| Hostname | LAN IP | GPU(s) | Combined VRAM | Status | Listing strategy |
|---|---|---|---|---|---|
| gpuserver1 | 192.168.1.100 | 1× RTX 5090 | 32 GB | Listed (machine 52271). Currently rented under reserved contract C.34113802 through 2026-08-24 at ~$0.20/hr realized. Listed price $0.30 on-demand / $0.25 floor. Listing end-date 2026-10-24. | Reserved through 8/24; on contract end, relist on-demand only per "short-term first" |
| rtxpro6000server | 192.168.1.157 | 2× RTX PRO 6000 Blackwell WS | 192 GB | **NOT YET LISTED** as of 2026-05-04. Hardware ready, network ready (Fios port-forward 40100-40199 + UFW + hairpin NAT), kaalia install pending. See [`projects/rtxserver-vastai-watch.md`](../../../sartor/memory/projects/rtxserver-vastai-watch.md). | Per "short-term first": list on-demand only with fixed `-e` end-date for first 2-4 weeks. Do NOT use `-l "6 months"` rolling-reservation flag for first listing. |
| Future hosts | — | — | — | — | Same: on-demand + fixed end-date for 2-4 weeks of price discovery, then re-evaluate |

**Fleet account:** all Sartor hosts share one vast.ai host account (alto84@gmail.com / Solar Inference LLC). One Stripe payout entity. Per-host CLI installs each have their own `~/.config/vastai/vast_api_key` mode 600.

## Listing strategy — "short-term first"

> "I may want short term rentals at first while we gauge demand for various prices." — Alton, 2026-05-03

Canonical preference doc: [`sartor/memory/business/vastai-pricing-strategy.md`](../../../sartor/memory/business/vastai-pricing-strategy.md). The rule:

1. **First listing of a new host** — on-demand only. Fixed `-e END_DATE` for the listing horizon, NOT `-l DURATION` rolling reservation. The fixed date forces a re-evaluation; rolling reservation makes the price stick by default.
2. **First 2-4 weeks** — treat as price discovery. Watch fill rate, time-to-first-rental, renter behavior. Do NOT lock into a reserved contract during this window.
3. **After 2-4 weeks** — if fill rate >80%, raise price 5-10% via the price-increase challenge mechanism (below). If fill rate <50%, drop 10-20% and watch again. Only after price discovery should reserved contracts be considered.
4. **A long-term reserved contract offered early** — evaluate against current realized rate (not list price). Decline if the reserved-rate discount exceeds the visible realized-vs-list gap. Example: gpuserver1 lists at $0.30 but realizes $0.20 under C.34113802 — that's a 33% long-term discount. A renter offering 50% discount on a fresh host is offering worse than the prevailing market.
5. **Concrete first-listing flag template** for the new-host case (substitutes the per-GPU price for `<g>`, the dual-card differentiator min-chunk for `<m>`, an end-date 30-90 days out for `<e>`):

```
vastai list machine <id> -g <g> -b <b> -s 0.10 -m <m> -e MM/DD/YYYY
```

The reserved-contract / rolling-listing variant `-l "6 months"` should NOT be used for v1 of a new listing — it implicitly commits to that horizon and is harder to course-correct.

**Why:** locking long-term too early with insufficient data means under-pricing. gpuserver1's reserved C.34113802 at ~$0.20 realized is a case in point — list price is $0.30, but the contract was signed during a quieter period and is now likely below current market for an RTX 5090.

## Daily operations

Short, frequent commands. None should ever modify state.

```bash
# Earnings (pay attention to recent days, not just total)
ssh alton@192.168.1.100 '~/.local/bin/vastai show earnings'

# Active rentals — who's on the box, what they're paying
ssh alton@192.168.1.100 '~/.local/bin/vastai show instances'

# Machine status — listing health, reliability score, occupancy
ssh alton@192.168.1.100 '~/.local/bin/vastai show machines'

# Hardware health — GPU temp, util, memory, disk
ssh alton@192.168.1.100 'nvidia-smi; df -h /; free -h; uptime'
```

For rtxserver once listed, swap IPs and run the same commands.

**Read the inbox** for state changes the peers have flagged: `sartor/memory/inbox/<host>/_vastai/` (state-change-only, written by `vastai-tend.sh`) and `sartor/memory/inbox/<host>/_stale-alerts/` (hourly threshold breaches).

## Weekly operations

Once a week, ideally Sunday or Monday morning before the renter market shifts:

1. **Pricing scan** — invoke [`vastai-market-scan`](../vastai-market-scan/SKILL.md). 5-10 min wall-clock. Captures current market median, range, and your percentile position for each GPU class in the fleet.
2. **Compare to current listed price** — if you're >75th percentile and rented, hold or consider a small bump. If you're below median and rented, hold and let the discount drive occupancy. If you're below median and idle, the price isn't the problem — investigate reliability or verification status.
3. **Reliability score check** — `vastai show machines | awk '{print $1, $7}'` shows reliability per machine. Below 95% triggers a hardware/uptime audit. Below 90% is a 30-day rolling reliability bug; the fix is sustained uptime, not a config change.
4. **Verification status** — `--raw` JSON has a `verified` field. Unverified machines list at a 30-50% discount to verified ones; if the machine is still unverified after 7 days, escalate to vast.ai support (the prioritized-verification list per docs.vast.ai April 2026 includes RTX PRO 6000 WS, so unverified-for-7-days is itself a signal something is wrong).
5. **Earnings rollup** — review the last week's earnings against expected. gpuserver1 baseline under C.34113802 at $0.20/hr × 168 hrs = ~$33.60/week pre-payout-fees. Anomalies (well above or well below) deserve a one-line note in the inbox.

Output of the weekly review goes to `sartor/memory/inbox/rocinante/<TS>-vastai-weekly-<host>.md`. One row per fleet member, one paragraph for the actionable items.

## Periodic operations

| Trigger | Action |
|---|---|
| Listing `end_date` within 7 days | Relist (re-list, not just extend) — but first re-run pricing scan and apply current "short-term first" defaults |
| Reserved contract end-of-term | Decide: reup with same renter (only if their offered rate ≥ current market) OR relist on-demand and let the market clear |
| Reliability score below 95% for 7+ days | Diagnose: tail kaalia.log, check nvidia-smi for ECC errors, check UFW for rule drift, check Fios port-forward for routing changes |
| Machine verified-state regresses from Verified → Deverified | Check the docs.vast.ai verification stages page; usually a benchmark deviation (CUDA version drift, driver downgrade, network speed regression). Re-run benchmarks. |
| Idle for >24 hours when listed | Confirm the listing actually shows on cloud.vast.ai (web UI cross-check), confirm price is in the market range, and consider an idle-job for between-rental utilization (see "Idle jobs" below) |

## Pricing adjustment workflow

The price-increase challenge mechanism is the only sanctioned path for raising prices on a host that has active customers. **Cuts** can happen any time but immediately apply to active rentals.

### Raising price

```bash
# 1. Re-list the machine at the new (higher) price. The CLI accepts the new price
#    even with active renters — it triggers a "price increase challenge" emailed
#    to affected clients.
ssh alton@192.168.1.100 \
  '~/.local/bin/vastai list machine 52271 -g 0.35 -b 0.30 -s 0.10 -m 1 -e MM/DD/YYYY'

# 2. Affected clients get an email. Until they `vastai accept price-increase <id>`
#    on the renter side, their auto-extend stops at the OLD price.
# 3. New rentals see the new price.
# 4. Existing rentals continue at OLD price until their current term ends or they accept.
```

Per `vastai list machine --help`: "Once you list your machine and it is rented, it is extremely important that you don't interfere with the machine in any way." The price-increase mechanism is the platform's sanctioned way to change price without interfering — it does not touch active containers.

### Cutting price

Cuts apply immediately, including to active rentals (the renter pays the lower rate from the moment the cut takes effect). There's no challenge mechanism for cuts — they're always allowed.

```bash
# Cut: same command, lower number
ssh alton@192.168.1.100 \
  '~/.local/bin/vastai list machine 52271 -g 0.25 -b 0.20 -s 0.10 -m 1 -e MM/DD/YYYY'
```

**Sartor convention (per gpuserver1 MISSION v0.2):** cuts are **supervised**, never autonomous. Even when occupancy is the constraint, the inbox flags the recommendation; Alton or Rocinante executes the cut. This protects against a runaway race-to-the-bottom.

### Decision rule for adjustment

| Occupancy (7-day) | Listed-percentile vs market | Action |
|---|---|---|
| ≥ 90% | Any | Hold or +5% via price-increase challenge |
| 80-90% | ≤ 50th percentile | Hold |
| 80-90% | ≥ 75th percentile | Hold (you're capturing value at the high end) |
| 50-80% | ≤ 50th percentile | Consider price-increase challenge IF reliability is high; pricing isn't the problem |
| 50-80% | ≥ 75th percentile | Drop 5-10%, re-evaluate in 7 days |
| < 50% | Any | Drop 10-20%, file inbox memo, re-evaluate in 7 days |
| < 50% sustained 14+ days | Any | Investigate non-price causes: reliability, verification, listing visibility, network |

### When on-demand vs reserved makes sense

| Scenario | Choice | Why |
|---|---|---|
| New host, first 2-4 weeks | On-demand only | Need price-discovery data |
| Verified, reliable, market price stable, occupancy >80% | On-demand | Optionality > small discount of reserved |
| Renter offers reserved with discount < (listed - realized) gap | Decline | Worse than current market |
| Renter offers reserved with discount > (listed - realized) gap during a quiet stretch | Accept | Below-market in lean times beats idle |
| End of an existing reserved contract | Re-list on-demand FIRST, observe 2-4 weeks of fill rate, only then consider another reserved | Same logic as new host — re-discover price |

Reserved contracts limit upside (you can't capture a market spike) but limit downside (you're guaranteed the rate during the term). Sartor's bias is toward on-demand because the host fleet is small; one host idle for a week is a 25% revenue hit on that host but ≤2% across the fleet roadmap. The optionality matters.

## Recovery — common failure modes

### Machine offline (unreachable from vast.ai or LAN)

Order of operations:

```bash
# 1. LAN ping — distinguishes network-down from box-down
ping -n 3 192.168.1.100

# 2. SSH — tells you sshd is up, OAuth keys work
ssh -o ConnectTimeout=5 alton@192.168.1.100 'date; uptime'

# 3. nvidia-smi — GPU/driver alive
ssh alton@192.168.1.100 'nvidia-smi 2>&1 | head -10'

# 4. Kaalia daemon — vast.ai's host process
ssh alton@192.168.1.100 'ps -ef | grep kaalia | grep -v grep'
ssh alton@192.168.1.100 'sudo tail -30 /var/lib/vastai_kaalia/kaalia.log'

# 5. Docker — kaalia talks to docker; if docker is down, every rental hangs
ssh alton@192.168.1.100 'sudo systemctl status docker | head -10'

# 6. UFW + Fios port-forward — does external traffic still route?
ssh alton@192.168.1.100 'sudo ufw status verbose | grep 40000'
# Fios port-forward verification requires Chrome MCP to the router admin OR an external tester
# (curl from Rocinante hits the LAN-side hairpin, not the WAN ingress)
```

Past incidents:
- **2026-04-22 (gpuserver1):** went offline ~02:35 UTC, vast.ai support engineer Saber emailed at 05:27 UTC because an active client was impacted. Recovery was a power-cycle. Reliability dropped briefly. **Lesson:** active-rental-mid-failure is the worst-case (vast.ai contacts the renter, not just us). Detection latency matters; the `daily-household-health` skill closes some of this gap.
- **2026-04-04 (gpuserver1):** 45-min offline incident, no client impact (machine was idle). Auto-recovered.

### Listing expired

```bash
# Symptom: vastai show machines shows machine but no listing fields,
# or end_date is in the past
ssh alton@192.168.1.100 '~/.local/bin/vastai show machines'

# Recovery: re-list. Use the "short-term first" defaults if it was a new host's expiry,
# OR the prior price if it was a healthy listing that just rolled over.
ssh alton@192.168.1.100 \
  '~/.local/bin/vastai list machine <id> -g <g> -b <b> -s 0.10 -m <m> -e MM/DD/YYYY'
```

### Kaalia daemon broken

```bash
# Symptoms: machine stops earning, vastai show machines reports stale data,
# or kaalia.log shows repeating errors

# Inspect
ssh alton@192.168.1.100 'sudo tail -100 /var/lib/vastai_kaalia/kaalia.log'

# Kaalia auto-restarts via /etc/init.d/vastai_kaalia_update (sysvinit, NOT systemd).
# To force a restart:
ssh alton@192.168.1.100 'sudo /etc/init.d/vastai_kaalia_update restart 2>&1 | head -20'

# If kaalia binary is corrupted, the install script can be re-run idempotently:
ssh alton@192.168.1.100 \
  'sudo python3 /tmp/vast_host_installer.py "$(cat ~/.config/vastai/vast_api_key)" \
   --interactive --agree-to-nvidia-license --no-driver --no-libvirt'
# Re-running on a healthy install is safe — kaalia detects existing state and updates in place.
# Driver re-install is the dangerous step; --no-driver avoids it.
```

### NIC / network issue

```bash
# vast.ai reachability self-test fails
ssh alton@192.168.1.100 '~/.local/bin/vastai self-test machine <id>'
# Returns "BUSY" during kaalia warm-up; returns failure with a specific diagnosis otherwise.

# Test the LAN-side hairpin from the host itself (this is what self-test does):
ssh alton@192.168.1.100 'sudo iptables -t nat -L OUTPUT -n -v | grep DNAT'
# Expected: -A OUTPUT -d <PUB_IP> -p tcp --dport 40000:40099 -j DNAT --to-destination 192.168.1.100

# UFW rules
ssh alton@192.168.1.100 'sudo ufw status verbose | grep 4000'
# Expected: ALLOW from anywhere to 40000:40099/tcp

# Fios port-forward — manual check via Chrome MCP to https://192.168.1.1
# (Verizon Fios doesn't expose a port-forward API)
```

If hairpin NAT or UFW rules are gone after a reboot or UFW reload, the rules at `/etc/ufw/before.rules` (NAT block) need to be reapplied; on Sartor hosts they're persisted in the file but a `ufw reset` would wipe them.

### Rental hung

A rental "hung" usually means: machine is rented per `vastai show instances`, but the renter's container is frozen or the renter has gone silent. **Do not touch the rental container** under any circumstances. Per gpuserver1's MISSION and rental policy, host-side intervention voids the contract and damages the reliability score.

The right path is to wait for the rental to time out naturally OR for the renter to release it. If a renter actively reports a problem, route through vast.ai support (their support engineer Saber has handled prior incidents — see 2026-04-22 entry above).

## Vast.ai CLI flag reference

Authoritative as of `vastai` v0.5.0 (verified 2026-05-04 via gpuserver1's `--help`). When in doubt, run `vastai <command> --help` on a peer; the live help is the source of truth.

### `vastai list machine <id> [options]`

The command that creates or updates a listing.

| Flag | Long form | Unit | Semantics |
|---|---|---|---|
| `-g PRICE` | `--price_gpu` | $ per GPU per hour | Active-instance rental price. **Per-GPU**, not per-rental. For a 2-GPU machine listed at `-g 1.25`, total dual-rental price is $2.50/hr. |
| `-b PRICE` | `--price_min_bid` | $ per GPU per hour | Interruptible minimum bid floor. Renters bidding below this are excluded from preempting. |
| `-s PRICE` | `--price_disk` | $ per GB-month | Storage price for inactive instances. Default $0.10. Sartor convention: $0.10. |
| `-u PRICE` | `--price_inetu` | $ per GB | Internet upload bandwidth. Default platform-picked. Sartor gpuserver1: $3.00/TB. |
| `-d PRICE` | `--price_inetd` | $ per GB | Internet download bandwidth. Default platform-picked. Sartor gpuserver1: $2.00/TB. |
| `-r RATE` | `--discount_rate` | fraction | Max long-term prepay discount rate. Default 0.4 (40%). |
| `-m N` | `--min_chunk` | integer | Minimum number of GPUs renters must take. `-m 1` allows single-GPU rentals on a multi-GPU host; `-m 2` forces both. |
| `-e DATE` | `--end_date` | MM/DD/YYYY or unix timestamp | **Fixed** listing-expiry date. After this, the listing unlists; existing rentals continue until the renter releases. |
| `-l DURATION` | `--duration` | "n days/weeks/months/years" | **Rolling** listing — updates `end_date` daily to be DURATION from current date. Cannot combine with `-e`. |
| `-v SIZE` | `--vol_size` | GiB | Volume contract offer size. Default half of available disk. `0` = no volume contract. |
| `-z PRICE` | `--vol_price` | $ per GB-month | Volume contract storage price. Defaults to `-s` value. Invalid if `-v 0`. |

Critical semantics that bit Sartor before:

- **`-g` is per GPU** — for a 2-GPU listing, the dual-rental total is `2 × g`. The earlier rtxserver target `-g 2.50` would have meant $5.00/hr dual-rental. The corrected target is `-g 1.25 -m 2` = $2.50/hr dual-rental. Always confirm dual-vs-single math before listing a multi-GPU host.
- **`-m 1` vs `-m 2`** on a multi-GPU host:
  - `-m 1` → renters can take 1 or 2 GPUs. Captures more renters but exposes single-card thermal pathology on rtxserver (Noctua intake recirculation in single-card mode).
  - `-m 2` → renters must take both. Higher per-rental price ceiling, healthier thermal mode. Sartor's choice for rtxserver.
- **`-e` (fixed) vs `-l` (rolling)**: rolling is convenient ("always listed forward") but defeats the "short-term first" strategy because it auto-extends. Use `-e` for new-host first listings, switch to `-l` only after price discovery.

### `vastai self-test machine <id> [options]`

Confirms vast.ai's NOC can reach the host's port range. **Verb-noun form** — `vastai self-test machine`, NOT bare `vastai self-test`. The bare form does not exist on CLI v0.5.0.

```bash
vastai self-test machine 52271 [--ignore-requirements] [--debugging] [--raw]
```

- Returns failure with a specific cause: port unreachable, kaalia not running, benchmark not complete, etc.
- Returns "BUSY" if kaalia is in its post-install warm-up window (~1 hour after install).
- `--ignore-requirements` lets the test run even if minimum spec checks fail (use only for debugging, not normal operation).

### `vastai show machines [--raw]`

Lists all machines associated with the host account. `--raw` returns JSON with fields like `id`, `gpu_name`, `verified`, `reliability2`, `listed_gpu_cost`, `listed_min_bid`, `current_rentals_resident`. Useful for scripting; otherwise the table format is fine.

### `vastai show instances`, `vastai show earnings`, `vastai show user`

- `show instances` — current rentals on host's machines.
- `show earnings` — historical earnings; supports time-window filters via flags.
- `show user` — host account info. **Known peer-side quirk:** `vastai show user` on gpuserver1 returns `failed with error 400: owner: Extra inputs are not permitted` as of 2026-05-04. Doesn't affect operation; cosmetic. Use `vastai show machines` for any host-account context that matters operationally.

### `vastai search offers "<filter>" [--raw] [-o <field>]`

Renter-side market data. Full filter syntax in `vastai search offers --help`. Common Sartor uses:

```bash
# By gpu_name (string-match; not all GPUs match cleanly — see vastai-market-scan skill)
vastai search offers "gpu_name=RTX_5090 num_gpus=1 verified=true rentable=true" -o "dph_total"

# By VRAM (works when gpu_name doesn't match)
vastai search offers "gpu_ram>=96 verified=true rentable=true" --raw
```

Routing through `vastai-market-scan` is preferable when sizing comps for a pricing decision.

### `vastai price-increase` (renter-side, mentioned for context)

When you raise price on a host with active renters, those renters get an email and can run `vastai accept price-increase <id>` to opt in to the new rate. Until they accept, their auto-extend stops at the old price. **You don't run this command** — it's the renter-side accept verb. But knowing it exists explains why the price-increase challenge mechanism is non-disruptive.

## Idle jobs

Between-rental utilization. Vast.ai's hosting docs explicitly forbid host-side GPU work during a paid rental ("the hardware can not be used for any other purposes"). The sanctioned path to using your own GPU when not rented is **idle jobs**: a host-created self-rental at the bid floor, preempted automatically when a paying client outbids.

### Mechanism

The host creates a job on vast.ai's Host/Create Job page (web UI; the CLI doesn't expose this directly). Per vast.ai FAQ:

> "As a host you can set a min bid price for your machine by creating an idle job at that price on the Host/Create Job page. If you don't want to setup a true mining idle job, you can just use 'ubuntu' as the image and 'bash' as the command."

The job runs at the configured bid floor (e.g., $0.50/hr). When a client bids above that floor, the idle job is preempted (interruptible). When no clients are bidding, the host's own job runs uninterrupted. **It costs you the bid-floor amount per hour you're using your own GPU**, but that money flows to your own Stripe account, so the net economic is zero (except for vast.ai's cut, which is small).

### Sartor implications

- **gpuserver1 (under reserved contract C.34113802):** idle jobs are **forbidden** by reserved-contract terms. The GPU is dedicated to the contracted client whether or not their containers are running. The 0% utilization observation on gpuserver1 under contract is contractually correct, not waste.
- **rtxserver (post-listing, on-demand mode):** idle jobs become available once verified. Future direction: at $1.00/GPU bid floor, an idle job lets Alton run his own training/inference on the dual Blackwell when no client is bidding, paying himself the bid floor. Implementation TBD; not part of v1 launch.
- **Future hosts:** same as rtxserver. Always evaluate whether idle-jobs make economic sense for the workload (training jobs that can checkpoint cheaply benefit; long-running stateful workloads do not).

### Setup sketch (for when this becomes work)

1. Host the docker image on Docker Hub or a registry the host can pull from (e.g., `ubuntu:24.04` for a placeholder, or your own training image).
2. On cloud.vast.ai, navigate to Host → Create Job. Fill in:
   - **Image:** the Docker image
   - **Command:** the command to run (`bash` for placeholder; your training script for real work)
   - **Min bid:** the bid floor for the listing (e.g., $0.50/GPU/hr for rtxserver)
   - **Disk:** how much storage your job needs
3. Submit. The job appears in your `vastai show instances` output as your own rental.
4. When a client bids above the floor, vast.ai preempts the idle job. Your container stops; theirs starts.

## Token-burn observability

**Proposed, not yet built.** Forensics-agent recommendation 5 (post-2026-04-22 incident review) flagged that Sartor lacks per-rental cost tracking — i.e., for a given rental, how much did vast.ai's cut subtract from the host's earnings. Without this, "earnings" reported by `vastai show earnings` can drift from "realized at Stripe" by the platform fee percentage, and that fee percentage isn't transparently published.

Future work:

- Cron a Stripe-side earnings pull alongside the vast.ai-side earnings pull
- Reconcile per-day; the delta IS vast.ai's cut + payout adjustments
- Surface the realized cut as a fleet metric so pricing decisions know the true revenue

For now, the realized-vs-listed gap on gpuserver1 (~$0.20 vs $0.30 = 33%) is treated as a combined long-term-discount + platform-fee aggregate. When rtxserver is on-demand with no reserved contract, the gap will isolate the platform fee.

## Operational rules (codified)

- **Never modify marketplace listings without explicit Alton confirmation.** Every `vastai list machine <...>` command is "draft + present + execute" — the skill drafts, Alton (or another peer Claude with explicit go-ahead) executes.
- **Never expose API keys** in chat, commit messages, log files, or shared docs. Reference by file path (`~/.config/vastai/vast_api_key`); read into env via `API_KEY=$(cat ~/.config/vastai/vast_api_key)` to avoid argv leakage.
- **Log every marketplace interaction** to the inbox audit trail: `sartor/memory/inbox/<host>/_vastai/<TS>-<action>.md`. The state-change-only `vastai-tend.sh` cron does most of this automatically; manual interventions need a manual entry.
- **Pricing scan before any pricing change.** Don't reprice from intuition; call `vastai-market-scan`.
- **Below-60% utilization for 6+ hours triggers an alert** per gpu-business-ops rules. The cron suite does this automatically; surface to Alton.
- **Cuts are supervised, bumps within bounds may be autonomous** per gpuserver1 MISSION v0.2 — but autonomous bump implementation is not yet built; both flow through Alton today.

## Common SSH idioms

For ops scripts, here are the idioms that work reliably:

```bash
# Read state with a 5-second connect timeout (default SSH timeout is too long)
ssh -o ConnectTimeout=5 alton@<host> '<command>'

# Multi-command read-only
ssh alton@<host> 'date; uptime; ~/.local/bin/vastai show machines | head -5'

# Read API key without echoing
ssh alton@<host> 'API_KEY=$(cat ~/.config/vastai/vast_api_key); ~/.local/bin/vastai some-command --api-key "$API_KEY"'
# (Better: trust the default ~/.config/vastai/vast_api_key path; don't pass --api-key explicitly)

# JSON parsing — Python over jq because Python is guaranteed on Sartor peers
ssh alton@<host> '~/.local/bin/vastai show machines --raw' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(m['id'], m.get('verified')) for m in d]"
```

## Failure modes table

| Symptom | Likely cause | Fix |
|---|---|---|
| `vastai show user` returns 400 "Extra inputs are not permitted" | CLI v0.5.0 quirk; vastai backend rejecting an extra field | Cosmetic. Ignore. Use `show machines` for any host-account context. |
| `vastai self-test` returns "command not found" or argparse error | Used bare form, not `vastai self-test machine <id>` | Add the `machine <id>` positional |
| `vastai self-test machine <id>` returns "BUSY" | Kaalia in benchmark warm-up | Wait ~1 hour after install; tail `/var/lib/vastai_kaalia/kaalia.log` |
| `vastai list machine` returns "must verify first" or similar gating | Machine never registered with kaalia OR pre-verification window | Confirm `vastai show machines` shows the row; if not, kaalia isn't registered. See onboarding procedure. |
| Listing succeeds but cloud.vast.ai web UI shows nothing | Verification status pending OR listing filter on UI excluding unverified | Cross-check with `vastai show machines --raw` for the `listed_gpu_cost` field; if present, listing is real. UI filter may be hiding unverified. |
| Reliability score dropping over weeks | Real uptime issue, OR kaalia/Docker periodically failing | Tail kaalia.log; check `journalctl -u docker --since '7 days ago' | grep -i error` |
| Earnings present in `vastai show earnings` but no Stripe payout | Stripe payout schedule (vast.ai pays out monthly or on threshold) | Check vast.ai Host → Billing page; not a host-side action |
| "Insufficient permissions" on a vast.ai CLI call | API key got rotated upstream OR file mode wrong on `~/.config/vastai/vast_api_key` | `chmod 600`, or generate a new key on cloud.vast.ai → Account → API Keys |

## Related references

- [`sartor/memory/procedures/vastai-host-onboarding.md`](../../../sartor/memory/procedures/vastai-host-onboarding.md) — Canonical bring-up procedure for a brand-new host. Invoke this skill alongside.
- [`sartor/memory/business/vastai-pricing-strategy.md`](../../../sartor/memory/business/vastai-pricing-strategy.md) — Alton's "short-term first" preference (the source for the Listing strategy section above).
- [`sartor/memory/projects/rtxserver-vastai-watch.md`](../../../sartor/memory/projects/rtxserver-vastai-watch.md) — Live tracker for rtxserver onboarding; load-bearing as long as rtxserver is unlisted.
- [`sartor/memory/business/solar-inference.md`](../../../sartor/memory/business/solar-inference.md) — Business-entity context, listing details, ITC framing.
- [`sartor/memory/machines/gpuserver1/MISSION.md`](../../../sartor/memory/machines/gpuserver1/MISSION.md) — The occupancy-first reframe; the source for the supervised-cuts rule.
- [`sartor/memory/machines/gpuserver1/CRONS.md`](../../../sartor/memory/machines/gpuserver1/CRONS.md) — Authoritative cron documentation for gpuserver1; pattern-source for new-host cron suites.
- [`.claude/skills/vastai-market-scan/SKILL.md`](../vastai-market-scan/SKILL.md) — Live pricing scan methodology including the VRAM-filter fallback.
- [`.claude/skills/gpu-pricing-optimizer/SKILL.md`](../gpu-pricing-optimizer/SKILL.md) — Pricing recommendation analysis (older, RTX-5090-specific framing).
- [`.claude/skills/gpu-fleet-check/SKILL.md`](../gpu-fleet-check/SKILL.md) — Daily/inline fleet status check.
- [`.claude/skills/peer-comms/SKILL.md`](../peer-comms/SKILL.md) — Driving work through peer Claudes (per-host quirks for gpuserver1 and rtxserver).
- [`.claude/skills/secrets-via-bitwarden/SKILL.md`](../secrets-via-bitwarden/SKILL.md) — Note: vast.ai API key currently lives at `~/.config/vastai/vast_api_key` per-machine, NOT in Bitwarden. Per-service token convention; not in the migration table.

## Open follow-ups (not blocking v1)

- **Token-burn observability** — described above; not built. Recommended after rtxserver has 30+ days of on-demand data so the realized-vs-listed gap is meaningful.
- **Idle-job setup for rtxserver** — defer until verified + 30 days of rental data. Then implement at bid floor for between-rental household-agent inference.
- **Autonomous bump implementation** — gpuserver1 MISSION v0.2 grants bounded autonomy (price increases within $0.25-$0.55, 7-day cooldown) but no executor exists. Either build the executor or retract the theoretical authority. Defer.
- **Per-host vs per-account API key** — Sartor's current design has one API key per machine in `~/.config/vastai/vast_api_key`. All keys authenticate as the same Solar Inference LLC host account. Decide whether to consolidate to one key (simpler revocation) or keep per-host (smaller blast radius if one host is compromised). No active risk; defer.
- **Validate against peer reports** — `inbox/rocinante/gpuserver1-state-2026-05-04.md` and `inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md` were not yet on disk at the time this skill was authored. If they have landed, fold any drift into this skill on the next pass.

## History

- 2026-05-04 (Rocinante Opus 4.7): Initial author. Synthesized from `projects/rtxserver-vastai-watch.md` (the watcher's research-pass-3), the existing `vastai-market-scan` skill, the `gpu-pricing-optimizer` and `gpu-fleet-check` skills, gpuserver1 MISSION v0.2, gpuserver1 CRONS v0.4, `business/vastai-pricing-strategy.md`, `business/solar-inference.md`, peer-comms skill, and live verification via SSH to gpuserver1 (vastai CLI v0.5.0 `--help` for `list machine` and `self-test machine`, plus active `crontab -l` showing 5 jobs including the `docker-weekly-prune.sh` that the staged scripts on rtxserver flagged as "may not exist on gpuserver1" — it does). Two ground-truth peer reports (`gpuserver1-state-2026-05-04.md`, `rtxserver-pre-kaalia-2026-05-04.md`) were requested but not landed by author-time; folded "TBD: validate" notes where they would have applied.
