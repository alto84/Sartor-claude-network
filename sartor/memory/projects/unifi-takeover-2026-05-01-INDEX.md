---
name: unifi-takeover-2026-05-01-INDEX
description: Single dispatch page for the 2026-05-01 UniFi network takeover. Indexes all 13 child docs, the on-disk backup directory, the daily backup scheduled task, the Pete email Gmail draft, and the open follow-ups (Nest retirement, DNS filter, UCG-Pro decision, Phase 3 hardening).
type: index
status: phase-1-and-2-complete-phase-3-deferred
date: 2026-05-01
last_updated: 2026-05-02
related:
  - projects/unifi-takeover-2026-05-01
  - reference_home_network
  - MACHINES
tags: [project/active, infra/network, machine/rocinante, vendor/ubiquiti, vendor/berman-home-systems, meta/index]
---

# UniFi Takeover 2026-05-01 — Project INDEX

## TL;DR

On 2026-05-01 Sartor executed a complete software-only takeover of the Berman Home Systems-installed UniFi network — 9 devices total (1 USW-Pro-Max-24-PoE switch + 8 WiFi 7 access points) — without factory-resetting any device, without admin access to the Verizon Fios router, and without involving BHS. Local controller now runs on Rocinante at `https://192.168.1.171:8443`. BHS controller (`berman.gets-it.net:8443`) blocked at the AP boot-time iptables level on every device. PSKs rotated, SSIDs consolidated to a single `LGP123`, 6 GHz enabled, 2.4 GHz channels pinned 1/6/11, daily `.unf` backups scheduled at 3 AM ET. Network renamed Sartor-Saxena-Claude Network.

## Canonical project doc

- [[unifi-takeover-2026-05-01]] — canonical project doc: full playbook, credentials, AP authkey reference, recovery procedures. Read this first.

## Reports and narratives

- [[unifi-takeover-2026-05-01-report]] — user-facing day report: executive summary + cyberpunk narrative of how the takeover unfolded.

## Network state snapshots

- [[unifi-takeover-2026-05-01-network-census]] — mid-state census taken ~21:45 ET, ~3 h post-PSK-rotation. Every device, client, byte counter.
- [[unifi-takeover-2026-05-01-final-census]] — final clean-state census ~22:30 ET after SSID consolidation, channel re-plan, 6 GHz enable, backup automation. Compare against mid-state to confirm stability.

## Plans (Phase 2 and Phase 3)

- [[unifi-takeover-2026-05-01-psk-rotation-plan]] — proposed PSK rotation plan for Berman Net + GhLoP. Status: executed 2026-05-01 evening.
- [[unifi-takeover-2026-05-01-phase3-hardening-plan]] — Phase 3 hardening proposal menu (VLAN segmentation, channel re-plan, IPv6 audit, auto-update window). Status: 3B + 3D executed 2026-05-01; 3A and 3C deferred.

## Investigations (one-off discoveries during the takeover)

- [[unifi-takeover-2026-05-01-nest-retirement]] — Google Nest mesh retirement plan: three physical devices, the 75 GB sustained-flow anomaly, safe physical retirement procedure. Status: investigation complete, awaiting physical unplug once family migrates devices to LGP123.
- [[unifi-takeover-2026-05-01-kidsroom-speaker]] — investigation of the `Kids room speaker.p,` SSID broadcasting from inside the house (trailing comma is real). Status: complete.
- [[unifi-takeover-2026-05-01-unknown-laptop]] — identification of `LAPTOP-C4A43U6V` at 192.168.1.193, an unknown Windows laptop on the family network. Status: complete.

## Pete email (BHS handoff)

- [[unifi-takeover-2026-05-01-draft-pete-email]] — first draft (ask for handoff + offer security suggestions). Status: superseded by FINAL.
- [[unifi-takeover-2026-05-01-pete-email-FINAL]] — final ready-to-send revision.
- **Gmail draft ID:** `r1648436912190611604` (composed in Gmail, awaiting Alton's send).

## Drive cleanup (blocked)

- [[unifi-takeover-2026-05-01-drive-cleanup]] — Google Drive `/Sartor-network/` cleanup. Status: BLOCKED on `@piotr-agier/google-drive-mcp` OAuth refresh token revocation. Re-auth required before this can resume.

## Cleanup summary (this tidy-up pass)

- [[unifi-takeover-2026-05-01-cleanup-summary]] — 2026-05-02 post-takeover tidy-up: what was indexed, what was cross-referenced, what tmp artifacts were deleted, what root clutter was archived, and which items need Alton's review.

## On-disk artifacts (NOT in git)

### Backups directory: `C:\Users\alto8\backups\unifi\`

See `C:\Users\alto8\backups\unifi\README.md` for per-file descriptions. As of 2026-05-02 contains:

- `sartor-claude-network_2026-05-01_1619.unf` — fresh-controller backup (just the switch, pre-AP-takeover)
- `sartor-claude-network_pre-psk-rotation_2026-05-01_1954.unf` — pre-PSK-rotation
- `sartor-claude-network_post-psk-rotation_2026-05-01_1957.unf` — post-PSK-rotation
- `sartor-claude-network-post-takeover_2026-05-01_1901.unf` — post-full-takeover (9 devices, rotated authkeys)
- `sartor-claude-network_auto_2026-05-01_2158.unf` — first auto-run from the new scheduled task
- `firmware.json.bak-20260501_1821` — pre-G7IW-alias-patch firmware.json snapshot
- `ap-authkeys-2026-05-01.json` — per-AP BHS authkeys captured pre-takeover (NOT git-tracked, treat like `.ssh/`)
- `wlanconf-pre-rotation_2026-05-01_1954.json`, `wlanconf-post-bermannet_2026-05-01_1954.json`, `wlanconf-post-ghlop_2026-05-01_1954.json` — JSON snapshots of WLAN config across PSK rotation
- `ap-173-OutdoorBackyard-mgmt.bak` — first AP's `/etc/persistent/cfg/mgmt` before edits (proof-of-concept device)
- `backup-log.txt` — append-only log of scheduled-task runs

### OneDrive copies

The daily backup script writes a parallel copy to `C:\Users\alto8\OneDrive\Documents\Sartor-network\backups\` for off-Rocinante durability.

### Daily backup script

- `C:\Users\alto8\scripts\unifi-daily-backup.ps1` — PowerShell script that logs in to the controller, triggers a backup, downloads the `.unf`, copies to OneDrive, prunes local copies older than 30 days.

### Scheduled Task

- **Name:** `UniFi Daily Backup`
- **Schedule:** daily 3:00 AM ET
- **Action:** `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\Users\alto8\scripts\unifi-daily-backup.ps1`
- **Run as:** `alton`
- **Stop after:** 10 min
- **Verify with:** `schtasks /Query /TN "UniFi Daily Backup" /V /FO LIST`

## What's next

Outstanding items, in rough priority order. None blocks the takeover, which is operationally complete.

1. **Physical Nest retirement** — once Aneeta and the kids' devices have migrated to `LGP123`, unplug the Nest mesh root at switch port 22 (.163). Two wireless peers go dark within seconds. See [[unifi-takeover-2026-05-01-nest-retirement]] for the safe sequence and the 75 GB sustained-flow anomaly that motivates it.
2. **Send the Pete email** — Gmail draft `r1648436912190611604` is queued; Alton's call when. Friendly framing, four security suggestions for BHS's default install template plus a Super Admin handoff request.
3. **Verify `mgmt_url` and `stun_url`** still show 192.168.1.171 (not `berman.gets-it.net`) on all 9 devices. SSH to each, `cat /etc/persistent/cfg/mgmt | grep -E "url"`. HisOffice + OutdoorBackyard already verified clean.
4. **Confirm hidden `letmeinnow` SSID stays gone** — periodic WiFi scan from a phone for hidden SSIDs.
5. **DNS filter decision** — Phase 3A Kids VLAN with Pi-hole is deferred. Whether to wire Pi-hole or NextDNS at the gateway level is an open choice that depends on Phase 3A timing.
6. **UCG-Pro decision** — eventually replace the Verizon Fios router with a UniFi Cloud Gateway (UCG-Pro / UCG-Max) to fold WAN edge into the same admin model. CR1000A bridge mode is supported. No timeline yet.
7. **Phase 3A VLAN segmentation** — Mgmt VLAN (BMC + UniFi devices), IoT VLAN (Sonos + Peloton + Nest + LG TV), Kids VLAN (with DNS filter). Deferred — complex and disruptive; needs a planned weekend.
8. **Phase 3C IPv6 firewall audit** — OutdoorBackyard AP currently has globally-routable `2600:4041:410a:fc00::/64` IPv6. Audit AP-level IPv6 firewall posture across all 8 APs.

## Cross-references

- [[reference_home_network]] — updated 2026-05-02 with the new network name, 9-device inventory, and local controller URL.
- [[MACHINES]] — Rocinante now runs the local UniFi controller; updated to reflect this.
- [[MEMORY]] — History line added 2026-05-01 capturing the takeover at high level.
- [[daily/2026-05-01]] — daily log entry for the day.
