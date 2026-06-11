# Optimum fiber circuit — static IP details

Installed 2026-05-18 (1–2 PM appointment, 85 Stonebridge Rd). Details from the tech's handwritten note (photo provided by Alton 2026-06-10). Verified live 2026-06-10 from Rocinante's ethernet port.

## Static WAN assignment

| Setting | Value |
|---|---|
| Static IP | `108.58.121.254` |
| Subnet mask | `255.255.255.252` (/30) |
| Gateway | `108.58.121.253` |
| Primary DNS | `167.206.112.138` (ns5.srv.hcvlny.cv.net — verified responding) |
| Secondary DNS | `167.206.7.4` |

No DHCP on the handoff — whatever device sits on this link must be statically configured with the values above.

## Gateway device (108.58.121.253)

- Responds on-link (TTL=64), MAC `68:aa:c4:dc:cf:80`
- Web admin UI on `http://108.58.121.253` — `micro_httpd`, session-cookie login (401 without credentials). Credentials likely on the device sticker or Optimum account.
- HTTPS not enabled (connection reset)

## Verification results (2026-06-10, Rocinante ethernet @ 108.58.121.254)

- Gateway ping: <1–3 ms
- Internet transit: 8.8.8.8 at 6–7 ms avg via temporary host route
- DNS: `167.206.112.138` resolved google.com correctly

## UCG-Max (configured 2026-06-10)

The UniFi Cloud Gateway Max ("Sartor Saxena Cloud Max") now holds the static IP on its WAN1 ("Internet 1") port:

- UniFi OS 4.3.9, Network 9.2.87. Local admin user `admin` (password in Chrome automation profile saved passwords + to be vaulted).
- WAN1 static config applied 2026-06-10 via `PUT /proxy/network/api/s/default/rest/networkconf/6a29a58393156936a09246d4` — `wan_type: static`, IP/netmask/gateway/DNS per the table above. `hasInternet: true`, ISP detected "Optimum Online", verified end-to-end (7 ms to 1.1.1.1 through it).
- LAN: 192.168.1.1/24 with DHCP — **conflicts with the existing Fios LAN subnet**; fine while isolated, must be resolved before cutover.

### API access (persistent)

UniFi OS API keys (no expiry), header `X-API-KEY`, both full-admin scope:

| Key name | Stored at |
|---|---|
| `rocinante-claude-v2` | `C:\Users\alto8\.secrets\ucg-max-api-key` |
| `Sartor-Claude-Network-API` (Alton's) | `C:\Users\alto8\.secrets\ucg-max-api-key-sartor-claude-network` |

- Official Network API: `https://<ucg-ip>/proxy/network/integration/v1/...` (e.g. `/sites`; verified working with both keys 2026-06-10).
- Classic API also proxied: `/proxy/network/api/s/default/...`.
- Key management (cookie session, not API key): list/create `GET|POST /proxy/users/api/v2/user/{userId}/keys`, revoke `DELETE /proxy/users/api/v2/keys/{keyId}`. Admin userId `37787986-a7ef-4b34-97e7-41fbda80837c`.
- A third key (`rocinante-claude`) was created 2026-06-10 but its value leaked into a session log; it was revoked the same hour. Do not reuse.
- TLS note: self-signed cert; PowerShell 5.1 `Invoke-RestMethod` fails even with cert-validation callback — use `curl.exe -sk` with a header file (`-H @file`) so the key stays off argv.

## Context

- Existing WAN: Verizon Fios CR1000A at 192.168.1.1 (still the L3 gateway for the 192.168.1.0/24 LAN — see [[network-management]] skill and `reference/network.md`)
- This Optimum circuit is the second/replacement WAN, now terminated on the UCG-Max. Cutover of the house LAN (USW-Pro-Max-24 + 8 APs) from CR1000A to UCG-Max is the open next step (UCG-Pro replacement was already a deferred Phase 3 item in the UniFi takeover).
