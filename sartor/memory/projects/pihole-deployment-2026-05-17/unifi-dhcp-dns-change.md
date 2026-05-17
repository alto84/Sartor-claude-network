---
type: deploy-spec
project: pihole-deployment-2026-05-17
status: build-artifact-pending-review
related: [./INDEX, ./PLAN]
---

# UniFi DHCP DNS push — configuration change spec

This document specifies the **exact change** to be made to the UniFi controller's DHCP configuration AFTER the Pi-hole container is verified live (per `deploy-pihole-docker.sh`). The change is fired only after Phase 7 greenlight.

## What changes

UniFi controller at `https://192.168.1.171:8443` → Settings → Networks → "Default" (LAN network) → Advanced settings → DHCP → Name Server.

**Before:**
- Auto (Verizon Fios CR1000A pushes its own DNS — typically Verizon's `71.252.0.12` / `68.237.161.12` or similar ISP resolvers)

**After:**
- Manual
- Primary: `192.168.1.171` (Rocinante's LAN IP — Pi-hole container is bound here, port 53)
- Secondary: `1.1.1.1` (Cloudflare public resolver — fallback when Pi-hole / Rocinante is down)

## Why this exact config

- **Pi-hole as primary** means most DNS resolution flows through the blocklist and gets logged.
- **Cloudflare as secondary** means when Pi-hole / Rocinante is unreachable, clients fall over within ~1-2 seconds and the household sees no DNS outage. The trade is that during a Pi-hole outage, ads/trackers come through and we have no DNS log.
- **NOT setting only Pi-hole**: doing so would mean "internet is broken" for everyone whenever Rocinante reboots, sleeps, or Docker has a hiccup. Hard outage; bad.
- **NOT setting Pi-hole + a second Pi-hole**: no second Pi-hole exists yet. v2 if we want full redundancy.

## How to apply

Two paths; pick whichever is reachable.

### Path A — UniFi controller Web UI (preferred when reachable)

1. Open `https://192.168.1.171:8443` in Chrome (accept self-signed cert).
2. Log in as the UniFi admin (Bitwarden item `UniFi superadmin`).
3. Settings → Networks → click `Default` (the LAN network).
4. Advanced → DHCP Service → DHCP Name Server: switch from `Auto` to `Manual`.
5. Primary = `192.168.1.171`, Secondary = `1.1.1.1`.
6. Save.

### Path B — UniFi controller API

If the Web UI is misbehaving, the controller API can update the DHCP DNS via:

```
PUT /api/s/default/rest/networkconf/<network-id>
```

with a JSON body that includes:

```json
{ "dhcpd_dns_enabled": true,
  "dhcpd_dns_1": "192.168.1.171",
  "dhcpd_dns_2": "1.1.1.1" }
```

The network-id for `Default` is captured at deploy time from `GET /api/s/default/rest/networkconf`. Auth: cookie session from `/api/login` (Bitwarden `UniFi superadmin`).

API shape NOT yet verified against this controller version (v10.3.55). First-run validation needed. The MongoDB-direct fallback (per the secrets-via-bitwarden Playbook 3) updates the same fields in `db.networkconf`.

## How clients pick up the change

UniFi DHCP push only takes effect on **new** DHCP lease grants. Existing leases keep the old DNS servers until they expire.

Two options:

1. **Force renew via Web UI**: Settings → Networks → Default → "Force-renew DHCP leases" button. All connected clients get the new DNS immediately.
2. **Wait for lease expiry**: Typical Fios DHCP lease is 24h. Without force-renew, the household is on mixed DNS (some clients new, some old) for up to a day. Resolution still works, but Pi-hole only logs new-DNS clients.

**Recommend: force-renew once verified Pi-hole is healthy.**

## Verification immediately after apply

From a freshly-renewed-lease client (e.g., toggle WiFi off/on on your phone):

```bash
# What DNS the client thinks it has
ipconfig /all     # Windows
cat /etc/resolv.conf  # Linux
scutil --dns | head  # macOS
# Expect: 192.168.1.171 listed as primary nameserver
```

Then:

```bash
dig +short google.com  # should resolve via 192.168.1.171
dig +short doubleclick.net  # should return 0.0.0.0 (blocked)
```

Pi-hole admin UI at `http://192.168.1.171:8053/admin/` should show the queries arriving.

## Rollback

If anything goes wrong:

- Web UI: same path; switch Name Server back to Auto. Force-renew.
- API: `PUT /api/s/default/rest/networkconf/<network-id>` with `{"dhcpd_dns_enabled": false}`.
- MongoDB-direct: `db.networkconf.update({_id: ObjectId("...")}, {$set: {dhcpd_dns_enabled: false}})`.

After rollback, force-renew leases and verify clients are back on Verizon's DNS.

## Risks named

1. **Pi-hole admin UI exposure.** The container binds port 8053 to Rocinante's `0.0.0.0`. Anyone on the LAN can hit `http://192.168.1.171:8053/admin/`. That's the desired UX for the household. **It must NOT be reachable from outside the LAN** — this depends on the Fios CR1000A NOT forwarding port 8053 (currently it doesn't; the DMZ is set to gpuserver1, not Rocinante). If we ever change DMZ or port-forwarding, revisit this.
2. **`192.168.1.171` is Rocinante's LAN IP.** It's NOT a DHCP reservation — it's the OS's static-style IP. If Rocinante ever gets a different LAN IP, this config breaks. Currently the IP is stable (Ethernet adapter, fixed). Doc reference: `sartor/memory/machines/REGISTRY.yaml`.
3. **Force-renew can cause a 1-2-second DHCP storm.** Acceptable for the household; clients reconnect.
4. **First-run UniFi API endpoint not verified for v10.3.55.** Web UI path is the safer first attempt. If using API, capture the working endpoint shape here after first execution.
