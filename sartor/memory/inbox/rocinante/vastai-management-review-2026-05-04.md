---
type: review
target: vastai-management skill + vastai-host-onboarding procedure (commit 5302dea)
reviewer: Rocinante Opus 4.7 (independent reviewer)
date: 2026-05-04
status: green-light-after-fixes
related:
  - .claude/skills/vastai-management/SKILL.md
  - sartor/memory/procedures/vastai-host-onboarding.md
  - sartor/memory/business/vastai-pricing-strategy.md
---

# vastai-management review — 2026-05-04

Independent audit of the two new canonical artifacts, ground-truthed against gpuserver1 (CLI v0.5.0, live SSH, read-only). Two factual bugs caught and fixed in place; the rest of the work is solid.

## 1. Must-fix findings (corrected in place)

### M1. Kaalia is a systemd unit, not sysvinit

**Files / lines:**
- `.claude/skills/vastai-management/SKILL.md:215-217` (recovery section, "Kaalia daemon broken")
- `sartor/memory/procedures/vastai-host-onboarding.md:425-426` (Phase E.5 verification)
- `sartor/memory/procedures/vastai-host-onboarding.md:434` (E.6 "what the installer touches" table row)
- `sartor/memory/procedures/vastai-host-onboarding.md:28` (frontmatter list of grounding sources)

**Original claim:** kaalia auto-starts via `/etc/init.d/vastai_kaalia_update` (sysvinit, NOT systemd).

**Evidence:**
```
$ ssh alton@192.168.1.100 'ls /etc/init.d/ | grep -i vast'
(empty)

$ ssh alton@192.168.1.100 'systemctl list-units --type=service | grep -i vast'
  vast_metrics.service   loaded active running Vast.ai Machine Metrics
  vastai.service         loaded active running Vast.ai Host Daemon

$ ssh alton@192.168.1.100 'systemctl cat vastai.service'
# /etc/systemd/system/vastai.service
[Service]
ExecStart=/var/lib/vastai_kaalia/latest/launch_kaalia.sh
Restart=always
User=vastai_kaalia
```

There is also a third sibling unit `vastai_bouncer.service` in `/etc/systemd/system/`. Force-restart command was wrong, would have errored when invoked.

**Fix applied:** all three locations updated to `systemctl restart vastai.service` (and to call out the two sibling units). This is a real recovery-path bug — the docs would have failed in the field.

### M2. `vastai accept price-increase` CLI verb does not exist

**Files / lines:**
- `.claude/skills/vastai-management/SKILL.md:116-118` (raising-price section comment)
- `.claude/skills/vastai-management/SKILL.md:320-322` (renter-side context section)

**Original claim:** renters run `vastai accept price-increase <id>` to opt in to a new rate.

**Evidence:** running `vastai accept --help` against CLI v0.5.0 yields argparse "invalid choice: 'accept'" — there is no `accept` subcommand at all. The full subcommand list contains `change bid`, `set min-bid`, `prepay instance`, etc., but no `accept` verb. The price-increase challenge is a real platform mechanism, but acceptance is web-UI only on the renter side.

**Fix applied:** both occurrences edited to drop the spurious CLI form and explain that acceptance is web-UI only. Source confusion appears to be inherited from `business/vastai-pricing-strategy.md:26` and `projects/rtxserver-vastai-watch.md:177`, which still reference the bogus command — flagging those for a separate cleanup pass since they are out of review scope.

### M3. Phase E.3 example command missing `--no-docker` flag (procedure)

**File / line:** `sartor/memory/procedures/vastai-host-onboarding.md:377-381`

**Inconsistency:** the flag-reasoning table at E.3 says `--no-docker` should be passed because "Default Sartor hosts have Docker pre-installed", but the actual example command above the table omits it. An operator copying the example without reading the table below would have the installer rewrite `/etc/docker/daemon.json` and possibly disrupt working Docker config.

**Fix applied:** added `--no-docker` to the example command. Also added a note documenting the `--ports START END` non-interactive alternative (verified against installer source: `parser.add_argument("--ports", nargs="+")`).

## 2. Should-fix findings

### S1. Fios WAN IP `100.1.100.63` referenced as example in 14 files

`sartor/memory/procedures/vastai-host-onboarding.md:244`. Not a secret per se — it's already in MACHINES.md, work/solar-inference docs, and several others. But it's worth a one-line note that the IP can change (Verizon does periodically reissue dynamic Fios WAN leases, even on long-stable connections), and the hairpin NAT rule needs to be updated when that happens. **Not edited in place** — flagged here for the next maintenance pass; the example-IP framing in the doc is already correct, just doesn't surface the rotation risk.

### S2. Pricing-strategy doc still contains the bogus `vastai accept price-increase` reference

`sartor/memory/business/vastai-pricing-strategy.md:26`. Inherited error, propagated forward into the review-target docs (now corrected there). **Not edited in place** — outside review scope per the brief. Flag to fold on the next pricing-strategy doc edit.

### S3. Skill failure-modes table doesn't surface the systemd-unit form

`.claude/skills/vastai-management/SKILL.md:394-405` (Failure modes table). Now that M1 is fixed in the recovery section, the failure-modes table would benefit from a row like "Kaalia stops earning silently" → "check `systemctl status vastai.service`; tail kaalia.log; restart with `sudo systemctl restart vastai.service`". **Not edited in place** — this is a "should-fix" addition rather than a correction, and the recovery-section change already gives operators the right command path.

### S4. Procedure Phase J references rtxserver-specific staged-script paths in a generic procedure

`sartor/memory/procedures/vastai-host-onboarding.md:602-605` — the inline links point at `machines/rtxpro6000server/onboarding-staged/...`. The procedure is written to generalize across all future hosts, but these specific links bind to one host's stage area. Recommend changing to `machines/<host>/onboarding-staged/...` placeholders consistent with the rest of the doc (the prose after the table already does this; just the table cells need it). **Not edited in place** — minor; the prose disambiguates and operators won't be misled.

## 3. Nitpicks

1. SKILL line 87 `awk '{print $1, $7}'` against the table format works on gpuserver1's current output (column 7 is reliab) but is brittle to vast.ai CLI output-format changes. `--raw | python3` would be more durable.
2. SKILL line 304 says `vastai show user` 400 is "cosmetic" — accurate that operations don't depend on it, but the phrasing could note that any internal script that does parse `show user` will hard-fail.
3. SKILL line 363 says "the gap will isolate the platform fee" once rtxserver is on-demand. Clean but assumes a single gap source; reality has at least three (platform fee, payout-currency conversion, Stripe transfer fee). Minor, not load-bearing.
4. Procedure Phase A relies on `pip3 install --user requests` as a fallback. On a fresh Ubuntu 22.04 with PEP 668, this can fail with "externally-managed-environment". The vast.ai CLI's actual transitive deps (only `requests` is needed for normal operation) often work because Ubuntu ships them in the base Python. Minor.
5. Procedure Phase D `nvidia-power-cap.service` example uses `Description=Apply <hostname> production GPU power cap` literally — the placeholder syntax is fine for a template but a careless copy-paste lands `<hostname>` in the unit file.
6. Procedure Phase J.4 "6-cron cap" — a soft constraint cited per master-plan §5. Worth a wikilink to the master-plan section if convenient.

## 4. Verified items (tested, confirmed accurate)

- **CLI v0.5.0 confirmed** on gpuserver1 (`vastai --version` → `0.5.0`).
- **`vastai list machine` flag table** in SKILL §"Vast.ai CLI flag reference" matches `vastai list machine --help` output exactly. `-g/-b/-s/-u/-d/-r/-m/-e/-l/-v/-z` all present, all with the long-forms and descriptions matching live help.
- **Per-GPU semantics of `-g`** confirmed by the help text: "per gpu rental price in $/hour (price for active instances)". The skill's "rtxserver target `-g 2.50` would have meant $5.00/hr dual-rental" warning is accurate.
- **`-e` vs `-l` mutual-exclusion** confirmed: help text says "Cannot be combined with end_date".
- **`vastai self-test machine <id>`** verb-noun form confirmed; bare `vastai self-test` errors on argparse subcommand list.
- **`vastai show user` 400 quirk** confirmed live: returns `failed with error 400: owner: Extra inputs are not permitted`. `vastai show machines` works fine alongside.
- **`vastai unlist machine`** subcommand exists (verified in `--help` subcommand list — was implicitly referenced in the skill, not directly).
- **gpuserver1 active crontab (5 jobs):** `gather_mirror.sh` (every 4h), `stale-detect.sh` (hourly), `vastai-tend.sh` (every 30 min), `rgb_status.py` (every 5 min, RGB-display only), `docker-weekly-prune.sh` (Sunday 4 AM). Procedure Phase J's claim that gpuserver1 has `docker-weekly-prune.sh` despite the rtxserver staged-script note saying "MAY NOT EXIST" is correct.
- **`vastai_kaalia` user crontab (7 jobs):** `update_scripts.sh` (hourly, plus a separate hourly wget refresh), `send_mach_info.py` (hourly), `read_packs.py` (every 5 min), `enable_vms.py` (hourly), `sync_libvirt.sh` (hourly), `purge_stale_cdi.py` (hourly). Procedure E.6 list is accurate as far as it goes; the wget self-update of the script is an additional row not currently captured but isn't load-bearing.
- **Installer flags:** verified by reading the installer source on gpuserver1 (`curl -sL https://console.vast.ai/install` then grep for `add_argument`). All flags claimed by the procedure exist with the spelling claimed: `--interactive`, `--agree-to-nvidia-license`, `--no-driver`, `--no-libvirt`, `--no-docker`. Plus the un-mentioned `--ports START END`, `--no-daemon`, `--reset-machine`, `--driver-version`, `--storage-size`, `--amd`, `--raidgpt` flags exist (now noted in Phase E.3).
- **Short-term-first preference** properly enacted in procedure Phase H (uses `-e END_DATE`, not `-l DURATION`) and properly cited in skill §"Listing strategy" with a wikilink to `business/vastai-pricing-strategy.md`.
- **No literal secrets** in either file: API keys, passwords, PSKs, private SSH keys, OAuth tokens, contract numbers (the C.34113802 contract ID appears in CLAUDE.md and is treated as non-secret reference info), Bitwarden vault contents — all absent from both artifacts.
- **Cross-references** to `vastai-market-scan`, `gpu-pricing-optimizer`, `gpu-fleet-check`, `peer-comms`, `secrets-via-bitwarden` all present in skill §"Related references". Procedure links properly to the skill, to `business/vastai-pricing-strategy.md`, to `projects/rtxserver-vastai-watch.md`, and to the per-machine MISSION/CRONS/HARDWARE files.
- **Idle-jobs section** in skill §"Idle jobs" is clear about the reserved-contract incompatibility (gpuserver1 currently can't use idle jobs), and frames it for rtxserver post-listing as future work.
- **Recovery sections** cover all five required modes: machine offline, listing expired, kaalia broken, NIC issue, rental hung. After M1 fix, recovery commands are executable as written.
- **Cuts-are-supervised rule** properly cited from `machines/gpuserver1/MISSION.md` v0.2.

## 5. Verdict

**Green-light to use as-is, post-fix.** Three must-fix items corrected in place (kaalia systemd unit, bogus CLI verb in two locations, missing `--no-docker` flag in procedure example). Four should-fix items flagged but not blocking — three are minor maintenance items, one is in a doc outside the review scope. Six nitpicks, none load-bearing.

The procedure is end-to-end executable for an operator coming in cold: pre-conditions are explicit, phase boundaries (especially the kaalia install needing Alton at the console) are well-marked, recovery patterns are real ones from the gpuserver1 incident history. The skill's CLI flag reference is the strongest section — it captures the per-GPU-`-g` gotcha and the `-e` vs `-l` distinction that have bitten Sartor before.

Bigger missing piece (out of v1 scope, noted in skill §"Open follow-ups"): the per-rental cost / token-burn observability story. Author flagged it; agree it should land after rtxserver has 30+ days of on-demand data so the realized-vs-listed gap can isolate the platform fee.

## History

- 2026-05-04 (Rocinante Opus 4.7, independent reviewer): initial review. Three must-fix items corrected in place; review committed as `vastai-management review: kaalia systemd + accept-CLI + --no-docker`. SSH probes to gpuserver1 read-only throughout.
