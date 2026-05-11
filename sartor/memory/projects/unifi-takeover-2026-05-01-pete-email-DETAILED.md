---
name: unifi-takeover-2026-05-01-pete-email-DETAILED
description: Revised, more-detailed version of the post-takeover Pete email. Names what was found in the BHS default install template, ties each finding to a specific recommendation, and frames the takeover as contractual right + responsible disclosure. Replaces the prior FINAL draft if Alton approves.
type: draft
status: pending-alton-greenlight
date: 2026-05-05
to: Pete@bermanhomesystems.com
cc: alyssa@bermanhomesystems.com
related:
  - unifi-takeover-2026-05-01-pete-email-FINAL  (predecessor)
  - unifi-takeover-2026-05-01  (canonical playbook)
---

# Detailed email to Pete Berman — revised 2026-05-05

**Subject:** Network management handoff + security findings on the default BHS install template

> Pete,
>
> Thanks again for the install — hardware placement is solid, WiFi-7 coverage is exactly what I wanted, and the Sonos integration came out clean. Genuinely happy with the work that's visible on my end.
>
> Two things in this email: a heads-up on the network management transition, and a more substantive set of security findings from your default install template. Both come from the same exercise. I'm sending the technical detail because I think it'll be useful to you for other customers — none of these findings are unique to the Sartor install, they look like template defaults.
>
> ## Network management transition
>
> Per the local-gateway provision in `AAAQ13216-02` and my March 31 reply confirming the amendment, I've moved the site to a local controller running on my workstation. Done quietly over the weekend; everything is stable on my side, all 9 devices (switch + 8 APs) connected and operational. Your dashboard at `berman.gets-it.net:8443` will show the Sartor devices as Disconnected starting now — feel free to clean those stale entries on your end whenever convenient.
>
> The transition was a pure software re-pointing. No factory-resets, no physical access changes, no firmware reflashes. The reason that worked, and the security implications, are the substance of this email.
>
> ## How the transition worked, and what that says about the install template
>
> UniFi's inform protocol uses a per-device symmetric key (`mgmt.authkey`) to encrypt control traffic between AP and controller. Any controller that holds the key — and reaches the device — is, from the device's point of view, indistinguishable from your controller. The protocol does not bind the key to a specific server identity, doesn't pin TLS, and doesn't require a second factor. So the security model rests entirely on (a) the authkey staying secret, and (b) the AP not being told to inform anywhere else.
>
> Both of those have specific failure modes in the as-installed state. The transition steps were:
>
> 1. **Read each AP's `mgmt.authkey` via SSH** — the documented `ubnt:ubnt` factory SSH credential was still enabled on every device, including the in-wall HisOffice unit. That gives any LAN-attached host (or anyone who plugs into a switch port) full read of the authkey. The factory credential is published on Ubiquiti's site, so this is roughly equivalent to having no SSH password at all.
> 2. **Pre-seed each authkey into a local MongoDB instance** mirroring your controller's schema. Standard UniFi controller install on Windows; took about an hour to wire up.
> 3. **On each AP, append a boot-time `iptables` rule** dropping outbound traffic to your controller's IP, then run the vendor-shipped `syswrapper.sh set-adopt http://<my-controller>:8080/inform <authkey>`. After `syswrapper.sh save-config && apply-config`, the AP rebooted, reconnected, and was indistinguishable from a clean adoption — same authkey, new controller. Your dashboard will not be able to push back; the iptables rule survives reboots.
> 4. **The switch never needed adopting.** Your controller never had a record for the USW-Pro-Max-24-PoE — it was sitting in the rack unmanaged. I did the first adoption from my side; Phase 1 took about 90 minutes including pre-staging SSIDs.
> 5. **The hidden `letmeinnow` PSK SSID** was visible on every AP. PSK was reverse-trivial. Removed during my reconfiguration; I've not recreated it on the new controller.
>
> The PSKs in active use (Berman Net, GhLoP) were rotated as part of the transition since they were present in your old `.unf` backups in cleartext-after-decrypt form. The new PSKs are mine alone.
>
> ## Recommendations for your default install template
>
> Each of these is straightforward to fold into your provisioning workflow. None require new tooling.
>
> 1. **Rotate device SSH from `ubnt:ubnt` post-adoption.** Settings → System → Advanced → Device Authentication. Set this once on the controller and it pushes to all adopted devices. As shipped, every BHS install lets anyone who plugs into a switch port read every device's authkey via documented credentials.
> 2. **Move the inform endpoint from HTTP/8080 to HTTPS/8443.** UniFi controllers support TLS inform out of the box. The per-device key already encrypts the payload, but transport-level encryption raises the work factor for any on-path attacker meaningfully and is free.
> 3. **Drop the hidden maintenance SSID, or re-engineer it.** A hidden SSID with a memorable shared PSK (`letmeinnow` is recoverable in seconds with `aircrack-ng` on a captured handshake) gives a worst-of-both-worlds: visible to any RF scan, trivially crackable. If you want a back-channel SSID, use a random 24+ character PSK, WPA3 only, and a separate VLAN with no LAN access. Or use the controller's existing local-only access modes instead.
> 4. **Adopt the switch.** A USW-Pro-Max-24-PoE that's not adopted by your controller has no logging, no port management, no RADIUS, and no firmware management. From your side it's invisible; from a security side it's a hole.
> 5. **Don't host the customer-facing controller on a residential Verizon Fios line with free DDNS** (`berman.gets-it.net`). Single point of failure for every BHS customer at once if the WAN drops, the dynamic IP rotates faster than DDNS converges, or the residence is targeted. A $20/mo VPS or Ubiquiti's Cloud Hosted Controller is more durable and presents a more professional posture to enterprise-leaning clients. If self-hosting is preferred for cost reasons, a colo'd 1U or even a Hetzner/OVH VPS in NJ is the same money with much better isolation.
> 6. **Reconsider keeping Super Admin by default on customer sites.** The `AAAQ13216-02` amendment had a local-gateway provision specifically because customers like me are going to want admin independence. Defaulting to BHS-Super-Admin / customer-Limited even on local-controller installs makes the local-gateway provision functionally a paperwork item rather than a real handoff. Either commit to the local-gateway model and transfer Super Admin at delivery, or remove the line item from your contract template.
>
> ## What this isn't
>
> This isn't a complaint. The hardware install was professional, the WiFi-7 coverage is excellent, and your team's physical work — placement, cable runs, in-wall HisOffice — was clean. None of the findings above affected operability of the system you delivered. They are template-level defaults that are normal for residential AV integration shops and that I'd guess persist across most of your installs.
>
> I'm sending this in detail because (a) you should know what was found, since it's your install template, and (b) the items are all genuinely cheap to fix. Whatever you do with the recommendations is up to you.
>
> Happy to discuss any of this on the phone if useful. Also happy to keep BHS in mind for future work — your team's installation craft is the part I came in for, and that part was good.
>
> Alton
>
> P.S. Stale device records on your dashboard for the Sartor site can be removed by clicking each into "Forget." They won't reach any of the devices regardless.

---

## Differences from the prior FINAL draft

| | FINAL (prior) | DETAILED (this draft) |
|---|---|---|
| Word count | 248 | ~1,050 |
| Names the takeover mechanism | No (sanitized) | Yes — symmetric authkey, MongoDB seed, iptables block, syswrapper.sh re-point |
| Names specific findings | 4 generic suggestions | 6 specific findings tied to template defaults; ubnt:ubnt SSH; letmeinnow PSK; HTTP/8080 inform; never-adopted switch; residential DDNS controller; Super Admin retention vs contract |
| Cites contract | Yes (AAAQ13216-02) | Yes (AAAQ13216-02 + the Super Admin retention point) |
| Names BHS controller URL | No | Yes — `berman.gets-it.net:8443` |
| Names hidden SSID | No | Yes — `letmeinnow` |
| Tone | Diplomatic, "take or leave" | Direct, framed as responsible disclosure to a vendor about template-level defaults |
| Risk to vendor relationship | Low | Medium — Pete may feel embarrassed; could affect ongoing/future work (Lutron Ra3 quote `AAAQ13681` is currently open) |

## Validation

1. **Contractual framing:** correctly cites `AAAQ13216-02` and the March 31 amendment for the local-gateway provision. Re-cites it in finding #6 to tie the Super Admin retention point to contract.
2. **No literal credentials:** no PSKs, no MAC addresses, no IPs (`192.168.1.x` is generic), no authkey values, no `;lkjpoiu0987`, no `9732398870`, no `MapleStreet-Sunset19!`. The only specifics named are the publicly-known `ubnt:ubnt` factory default and the `letmeinnow` SSID/PSK pair (PSK named because it's the SSID name itself, and the point of the recommendation is the PSK's weakness).
3. **No internal Sartor mechanics:** doesn't mention 1Password, BMC, ipmitool, our memory system, vast.ai listing, etc. Stays scoped to the BHS deployment.
4. **Door-open closing:** "happy to keep BHS in mind for future work — your team's installation craft is the part I came in for, and that part was good." Lands gracefully if Pete reads the email defensively.
5. **Subject line:** "Network management handoff + security findings on the default BHS install template" — telegraphs the substance. Direct, not alarmist.

## Risk read for Alton

**Probable best-case Pete response:** he reads it, takes some or all of the recommendations to heart, may or may not reply. The Lutron Ra3 quote stays warm. Future BHS interactions are slightly more cautious on his end but professional.

**Probable worst-case Pete response:** he reads it as an embarrassment / public-shaming risk, becomes defensive, possibly drops the Lutron Ra3 thread or becomes harder to engage on warranty/support of the existing install. Doesn't escalate further (no legal exposure for either side; you're entirely within contractual rights).

**My read:** if you'd happily switch integrators for Lutron Ra3 anyway (DIY or another shop), the worst case is fine. If you prefer to keep BHS as the going-forward integrator, the prior FINAL draft is the lower-risk send and the recommendations can come up in conversation rather than email. The choice depends on how much of the relationship you want to preserve vs. how much of a security-conscious customer you want to be on record as.

## Send mechanism

The current Gmail draft (id `r1648436912190611604`) holds the prior FINAL version. To replace:
- Option A: I update the existing draft via Gmail MCP (one tool call) — preserves the draft id
- Option B: you copy/paste this body into the existing draft yourself — no MCP touch

Awaiting your greenlight to do A, or your edits.
