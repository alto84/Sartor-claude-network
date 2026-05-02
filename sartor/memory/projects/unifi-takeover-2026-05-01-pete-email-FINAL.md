---
name: unifi-takeover-2026-05-01-pete-email-final
description: Final post-takeover email to Pete Berman after revision. Ready to send.
type: draft
status: ready-to-send
date: 2026-05-01
to: Pete@bermanhomesystems.com
cc: alyssa@bermanhomesystems.com
---

# Final email to Pete Berman

**Subject:** Network management handoff + a few suggestions

> Pete,
>
> Thanks again for the install last week. Hardware placement is solid, the WiFi-7 coverage is exactly what I was hoping for, and the Sonos integration came out clean. Genuinely happy with the work.
>
> Quick heads-up so you're not surprised tomorrow morning: per the local-gateway provision in `AAAQ13216-02` and my March 31 reply, I've moved the site over to a local controller running here. Everything is up and stable on my side. Your dashboard will start showing the Sartor APs and switch as Disconnected — feel free to clean up those stale entries on your end whenever it's convenient.
>
> A few friendly suggestions for your default install template, take or leave:
>
> - Rotate the device SSH credential post-adoption (Settings → System → Advanced → Device Authentication). Default factory creds are documented and worth replacing once at install.
> - For hidden maintenance SSIDs, use a random 16+ character PSK rather than a memorable string. The PSK lands in the device config in plaintext anyway, and hidden SSIDs are trivially scannable.
> - Flip the inform endpoint from HTTP (8080) to HTTPS (8443). The per-device key encrypts the payload either way; transport-encrypted is free defense in depth.
> - Long-term, hosting the controller on a residential WAN with free DDNS is a single point of failure for paying customers. A $20/mo VPS or Ubiquiti's Cloud Hosted Controller would be more durable as you scale.
>
> Happy customer on the install side, and happy to keep BHS in mind for future work. Appreciate the good install.
>
> Alton

## Validation results

1. **Word count ≤ 250.** PASS — body is 248 words (excluding "Subject:", greeting "Pete," and signoff "Alton" line, counting the suggestion bullets).
2. **No banned strings.** PASS — checked for: passwords, PSKs, MAC addresses, `mongodb`, `cfgmtd`, `authkey`, `iptables`, `set-adopt`, `syswrapper`, `192.168.1.`, `8c:ed`, `58:d6`, `letmeinnow`, `9732398870`, `;lkjpoiu0987`, `gets-it.net`, `berman.gets-it.net`. None present. (The only quote-reference is `AAAQ13216-02`, which is the contract number, not on the banned list.)
3. **Required content present.** PASS — (a) thanks for install in opening paragraph, (b) disclosure of move to local controller in paragraph 2 with contractual citation, (c) all four security suggestions present as bullets: SSH credential rotation, random PSK on hidden SSIDs, HTTPS inform endpoint, hosting infrastructure off residential WAN, (d) acknowledgment of stale "Disconnected" entries with cleanup ask.
4. **Tone sniff test.** PASS — opens with legitimate compliment, frames takeover as contract-fulfillment not adversarial action, suggestions are explicitly bracketed as "for your default install template, take or leave," closes with door-open language ("happy to keep BHS in mind for future work"). No apology, no scolding, no preaching.
5. **Subject line.** PASS — "Network management handoff + a few suggestions" — neutral, descriptive, doesn't telegraph drama or alarm.
