---
name: unifi-takeover-2026-05-01-draft-pete-email
description: Draft email to Pete Berman (Pete@bermanhomesystems.com) requesting AP/controller handoff and offering security improvements for their default install. Not yet sent. Wait for Alton's go.
type: draft
status: not-sent
date: 2026-05-01
to: Pete@bermanhomesystems.com
cc: alyssa@bermanhomesystems.com
recipient_account: BHS Verona NJ (973-239-8870)
related:
  - projects/unifi-takeover-2026-05-01
tags: [draft/email, vendor/berman-home-systems]
---

# Draft email to Pete Berman

**Subject:** Local controller admin handoff + a couple of security suggestions

> Pete,
>
> Quick follow-up on the install — system has been running great. A couple of asks and a couple of friendly suggestions for future installs.
>
> **Handoff requests:**
>
> 1. Could you send a Super Admin invite to my Ubiquiti SSO account (`alto84@gmail.com`) on the controller at `berman.gets-it.net:8443/manage/site/4nyppeqd`? Per my March 31 reply on quote `AAAQ13216-02`, we added the local-gateway provision specifically so I could manage the network locally. Site Administrator first is fine; I'll need a promotion to Administrator after I accept so I can manage admins going forward.
> 2. A `.unf` backup of the current site for my records, whenever convenient. I'll keep a copy locally so we both have one.
> 3. Confirmation of which BHS account(s) currently have access. Happy to keep one BHS admin available for warranty/support work, but I'd like to be able to scope or revoke that on my end.
>
> **Friendly suggestions for your default install template** — I noticed a few things while poking around and figured they might be worth folding into the standard build for future residential customers:
>
> - **Rotate the device SSH credential post-adoption.** The controller has a Device Authentication setting (Settings → System → Advanced) that pushes a site-wide SSH user/password to every adopted device — by default it stays on Ubiquiti's well-known factory credential, which is documented and discoverable. Setting that once at install time would close a small but real local-LAN gap.
> - **Hidden maintenance SSIDs.** I'd suggest a longer random PSK (~16+ chars) on any hidden management SSID rather than a short word, since the SSID being hidden doesn't actually hide it from anyone scanning, and the PSK ends up in the device config in plaintext anyway.
> - **Inform endpoint over HTTPS instead of HTTP.** UniFi supports it on port 8443 — the per-device key encrypts the inform payload either way, but flipping to HTTPS is essentially free defense in depth.
> - **Hosting infrastructure.** The `gets-it.net` DDNS lease + residential FiOS WAN is a potential single point of failure for the whole site. A $20/mo VPS or Ubiquiti Cloud Hosted Controller would let you decouple the controller from any one residential connection. (If your current setup is intentional and just works for your scale, ignore — just flagging.)
>
> Take or leave any of those. None of them are urgent for me — I just thought you might find them useful as you scale the practice. Happy to chat if any of it is interesting to compare notes on.
>
> Quick screen-share works for the handoff too if easier — usually free 4-6pm EST.
>
> Thanks again for the install.
>
> Alton

## What this draft deliberately omits

- The phone-number-as-PSK observation. Personal judgment for Alton; not productive feedback for the vendor.
- The fact that the switch was never actually adopted by their controller (stayed in factory state for ~25 months by its own log). We've already fixed it on our side; no need to highlight the embarrassment.
- That we found and read the full `system.cfg` of every device including all SSIDs and PSKs. Pete will likely realize on his own that ubnt:ubnt access implies this, and dwelling on it makes the message feel adversarial.
- That we executed Phase 1 of the takeover (switch adoption to our controller) without their involvement. Worth mentioning eventually but not in this message — leave that for the screen-share if it comes up. The switch was unadopted on their side anyway, so technically no migration occurred from BHS's perspective.
- The cooling/Sonos observations (Patio on WiFi, no HT bond Living Room Amp ↔ LG OLED). Save those for a separate "remaining install items" email later.

## Send target

Send when Alton greenlights. Do NOT send autonomously.
