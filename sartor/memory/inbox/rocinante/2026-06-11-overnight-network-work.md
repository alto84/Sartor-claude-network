# Overnight network + handoff work (2026-06-11, Rocinante / Fable 5)

## Done and verified
- **UCG API access confirmed** on BOTH surfaces with vaulted key `UCG Max API key (rocinante-claude-v3)`:
  modern `…/proxy/network/integration/v1/` and legacy `…/proxy/network/api/s/default/…` (incl. rest/portforward, rest/user, rest/wlanconf). Header `X-API-KEY`.
- **Port-forwards** on UCG: gpuserver1 40000-40099→.100, rtxserver 40100-40199→.157, gpuserver2 40200-40299→.175. First two externally verified open.
- **DHCP reservations** created on UCG for 13 infra devices (switch, 3 GPU hosts, rtxserver BMC2, 8 APs). Rocinante/.171 reservation set against MAC 2c:f0:5d:39:21:7f but NOT yet effective — see open item.
- **Device SSH credential vaulted** as `UniFi device SSH` (extracted from old controller MongoDB setting.mgmt, verified live on switch). This is the rollback key for any AP/switch work.
- **Stale Fios hairpin DNAT** removed from gpuserver1 live iptables AND /etc/iptables/rules.v4 (backup rules.v4.bak-20260611). UCG does hairpin natively.
- **Both SSIDs staged on UCG** (LGP123 + hidden element-…) via API — created but NO APs on UCG yet, so nothing changed on air.
- **CLAUDE.md** truth-upped for the WAN migration (Alton-approved). network-management SKILL.md got a migration banner. Peer inbox notices written to gpuserver1 + rtxpro6000server.
- **Mirror divergence reconciled**: merged github-only gather/curation runs 207-211 into canonical; mirror now clean.

## WiFi-migration finding (IMPORTANT — do not retry unattended)
Canary-migrated OutdoorBackyard (least-critical AP) old-controller → UCG. Result: **state 10 (adoption failed / managed-by-other)** — the AP holds the old controller's authkey and the UCG lacks it. A clean fleet migration requires EITHER per-AP factory reset (on-site, disruptive) OR MongoDB authkey pre-seeding per device (the 2026-05-01 takeover playbook). This is a deliberate, schedulable, possibly on-site project — NOT an API one-shot. Canary rolled back cleanly via `mca-cli-op set-inform` → old controller re-adopted it (state=1). WiFi never dropped (APs run cached config throughout).

## Root-cause surfaced (needs Alton)
The old UniFi controller runs on Rocinante and is healthy on localhost:8443, but **all 9 APs inform to http://192.168.1.171:8080** — Rocinante's historic IP. Rocinante is currently on **.158**, and **.171 is leased to a phantom Google-OUI device (38:86:f7:a1:45:da) reporting hostname "Rocinante"**. The controller's inform-host setting and the APs' cached inform URL both point at .171. APs show state=1 in the controller (last-known), but at least OutdoorBackyard reported "Unreachable (…171…)" when touched. Two clean fixes: (a) get Rocinante back onto .171 (resolve the phantom-device lease) so reality matches the inform URL, or (b) set the controller inform-host override to .158 and re-provision. This predates tonight; the WAN cutover did not cause it but did expose it.

## Open items
- Rocinante → .171 reservation effective (blocked on phantom-device .171 lease); or move controller inform-host to a stable reserved IP.
- UCG admin password still only in ALTONGAME2025 Chrome saved-passwords — vault as `UCG Max admin` (needs Alton, or its session).
- Two ALTONGAME2025 UCG API keys (`rocinante-claude-v2`, `Sartor-Claude-Network-API`) are plaintext in C:\Users\alto8\.secrets on that box; reconcile/vault/revoke after its bw login.
- WiFi→UCG migration: schedule as a proper project (authkey pre-seed path preferred; avoids on-site resets).
