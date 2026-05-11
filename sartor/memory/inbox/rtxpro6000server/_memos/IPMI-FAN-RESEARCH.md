---
name: ipmi-fan-research-2026-04-29
description: Research deliverable for the ASUS ASMB11-iKVM raw IPMI fan-PWM command on rtxpro6000server. Verdict NOT FOUND for ASUS specifically; one architecturally-plausible ASRock-AST2600 hypothesis filed as future option only. Chrome MCP HTTP capture is the recommended fallback and is what we will use for today's binding application.
type: research-result
hostname: rtxpro6000server
date: 2026-04-29
author: rtxserver Opus 4.7 (research delegation; sources from research-agent run a0d625f443b392ee1)
status: NOT-FOUND-FALLBACK-CHROME-MCP
related:
  - machines/rtxpro6000server/BMC
  - inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect (predecessor — same problem at OS layer)
tags: [meta/research, machine/rtxpro6000server, hardware/cooling, bmc, ipmi]
---

# Research — ASUS ASMB11 raw IPMI fan-PWM command

## Verdict

**NOT FOUND.** No primary source documents an `ipmitool raw` byte sequence for setting fan PWM on the ASUS ASMB11-iKVM / WRX90E-SAGE SE.

Strong negative signals:
- ASUS's own ASMB11 User Guide (E25502 V3) and the ASUS IPMI Expansion Card guide list a "Common IPMItool commands" appendix that explicitly stops at PSU address, BMC hardware version, FRU unlock, chassis/power/sensor utilities. **Fan control is documented only via the Web UI.**
- The ASMB9 "Fan Customized Mode" guide (hosted by Lambda) is purely a Web UI walkthrough. No raw command.
- The upstream `ipmitool` repository contains **zero handlers** for ASUSTeK manufacturer ID 2623.
- A TrueNAS forum thread (Z10PA-D8) reports that ASUS BMCs return `Unknown (0x82)` for Supermicro-syntax raw fan commands, confirming ASUS uses a different command space than Supermicro.

## ASRock-AST2600 hypothesis (NOT VERIFIED for ASUS)

ASRock Rack and ASUS ASMB11 share the AST2600 BMC SoC and AMI MegaRAC SP-X firmware. ASRock Rack publishes a primary-source PDF documenting their AST2600 fan commands:

```
NetFn 0x3a, Cmd 0xd0, sub-functions:
  0x11 — set per-slot mode (16 bytes; 0x02 = manual, 0x00 = auto)
  0x0e — set per-slot duty (16 bytes; decimal-percent in hex, 0x00–0x64)
  0x12 — get mode (returns 16-byte vector)
  0x0f — get duty (returns 16-byte vector)
```

Source: `https://download.asrock.com/Rack/TSD/FAQ/TSDQA-72.pdf` (July 2025).

**Why we are not testing this on ASUS today:**

1. The directive permits a programmatic path only when "primary-source documented for *this* board" — ASRock-confirmed is not ASUS-confirmed. Architectural similarity is a hypothesis, not a verification.
2. We do not have BMC recovery posture established: no firmware image staged for re-flash, no cold-reset path verified beyond the `ipmitool mc reset cold` that may itself be vendor-extended. A bad raw command on the wrong NetFn space could: (a) lock the fan controller into a state that requires AC-power-cycle + jumper reset to recover, (b) trigger thermal protection if it returns "Invalid data field" partway through a multi-byte sequence and leaves duty in an inconsistent state, (c) require a full firmware re-flash via the BMC's recovery jumper (BMC_SW). Risk envelope exceeds the value of testing today.
3. Chrome MCP HTTP capture (see below) is deterministic, documented, and avoids all of the above.

This hypothesis is filed as a future option, not a current action. Test only after BMC firmware-image staging + recovery procedure is documented and verified out-of-band.

## AMI MegaRAC SP-X conventions (background)

Inferred from observed AST-series implementations running SP-X (AMI does not publish SP-X OEM commands at byte level):

- **NetFn 0x3A** (OEM Group 1) is the consistent fan/thermal extension space across ASRock Rack, ASUS, Tyan, and several Gigabyte AMI builds.
- **AST2500 era:** single-byte commands directly (e.g., 0xd6, 0xd7, 0xd8, 0xda).
- **AST2600 era:** multiplexed structure — command 0xd0 + sub-function selector. Pattern matches an internal SP-X command-table refactor for AST2600.
- Payload: typically one byte per fan slot; mode values vary across SoC generations (AST2500: 0/1; AST2600: 0/2). Duty values in decimal-percent hex.
- Wrong-length payloads return `Invalid data field` (cc 0xCC). Wrong NetFn returns `Unknown` (cc 0x82).

This narrows the search but does not yield an ASUS-confirmed command.

## Adjacent-board references (not used today)

| Board / project | NetFn / Cmd | Use |
|---|---|---|
| ASRock Rack AST2600 (ROMED8 family) | 0x3a 0xd0 0x{0e,0f,11,12} | Future hypothesis only |
| Supermicro X10/X11/X12 (smfc, zimmertr) | 0x30 0x70 0x66 / 0x91 | Already disproved on ASUS — returns "Invalid data field" |
| Dell iDRAC | 0x30 0x30 0x02/0x01 | Different vendor space, not portable |
| ipmi_fancontrol-ng (DrSpeedy) | vendor-agnostic skeleton | Useful daemon framework once we have a verified command |

## HTTP-capture fallback procedure (the path we are taking)

The BMC web UI Save action issues a single authenticated request to a vendor-specific endpoint. Capturing it gives the exact, board-specific, firmware-version-specific URL, headers, cookies, CSRF token, and JSON body. The captured request can be replayed via `curl` (deterministic) or used to identify the underlying NetFn/command for parity.

**Procedure (executed from Rocinante via Chrome MCP):**

1. Open Chrome, navigate to `https://192.168.1.156/`, log in as `admin`.
2. Open DevTools (F12) BEFORE navigating to the fan page. Network tab. Tick **Preserve log** and **Disable cache**. Filter: **XHR/Fetch**.
3. Clear Network panel.
4. Navigate Settings → Fan Control. Note the GET requests that load current curves (these are the read endpoints).
5. Modify one value trivially (e.g., Zone 7 Point B duty 0 → 0). Click Save.
6. Locate the POST/PUT in Network panel. Likely `/api/settings/fan-control`, `/api/Fan/Settings`, or `/redfish/v1/Chassis/.../Thermal`.
7. Right-click → Copy → Copy as cURL. Captures URL, headers (including session cookie + `X-CSRFTOKEN`), and JSON body.
8. Inspect body — almost certainly JSON describing curve points and zone selection.
9. Verify replay with `curl` while session cookie still valid.
10. Parameterize the JSON to script different duties / zones / curves. This becomes the long-term scripting interface.

**For today's stress test, steps 1-6 are sufficient** — Chrome MCP just clicks through the binding and curve UI directly. We don't need step 7-10 (replay/parameterize) until we want a daemon, which is a separate future project.

## Recommendation

**For today (binding application + stress test):** Rocinante drives Chrome MCP at `https://192.168.1.156` to apply the bindings + curves per the phone-home proposal. No raw IPMI attempts on ASUS.

**For the long-term GPU-aware-with-`max(PCIE03, PCIE07)` daemon:** capture the BMC fan-config POST via DevTools (steps 1-10 above), build the daemon on top of the captured HTTP interface. Skip the IPMI-raw layer entirely for ASUS until ASUS publishes the command sequence or someone in the community reverse-engineers it from `libipmi*.so` on the BMC's own filesystem.

**Do not run** the ASRock 0x3a 0xd0 sequence on this board today. It is a plausible hypothesis but not a verified path; the cost of being wrong includes BMC lockout requiring a hardware-jumper recovery, which is incompatible with today's "Alton calling in remote" mode of operation.

## Sources (full URL list from research run)

- ASRock Rack TSDQA-72: `https://download.asrock.com/Rack/TSD/FAQ/TSDQA-72.pdf`
- ASRock Rack FAQ #38: `https://www.asrockrack.com/support/faq.cn.asp?id=38`
- ASRock Rack FAQ #63: `https://www.asrockrack.com/support/faq.cn.asp?id=63`
- ASUS ASMB11-iKVM User Guide: `https://dlcdnets.asus.com/pub/ASUS/E25502_ASMB11-iKVM_UM_V3_WEB.pdf?model=ASMB11-iKVM`
- ASUS IPMI Expansion Card UG: `https://dlcdnets.asus.com/pub/ASUS/mb/Add-on_card/IPMI_Expansion_Card_EM_WEB_EN.pdf`
- ASUS ASMB9 Fan Customized Mode (Lambda mirror): `https://docs.lambda.ai/assets/docs/ASMB9-iKVM_Fan_Customized_Mode_User_Guide_v0.71_20191112.pdf`
- Cole Deck — ASRock IPMI Fan Control: `https://deck.sh/asrock-ipmi-fan-control/`
- TrueNAS forum thread (Z10PA-D8 negative result, page 12): `https://www.truenas.com/community/threads/script-to-control-fan-speed-in-response-to-hard-drive-temperatures.41294/page-12`
- Level1Techs WRX80E IPMI fan-control thread (no answer): `https://forum.level1techs.com/t/asus-wrx80-e-ipmi-fan-and-temp-control-help/174811`
- tmm.cx WRX80E build log (BMC fan-control limitations): `https://blog.tmm.cx/2023/01/18/build-log-threadripper-pro-5975wx-linux-workstation-on-the-asus-pro-ws-wrx80e-sage-se-wifi/`
- AMI MegaRAC SP-X overview: `https://www.ami.com/resource/megarac-sp-x-bmc-firmware-the-foundation-for-powerful-server-management-part-ii/`
- petersulyok/smfc (Supermicro daemon, architecture reference): `https://github.com/petersulyok/smfc`
- DrSpeedy/ipmi_fancontrol-ng (vendor-agnostic skeleton): `https://github.com/DrSpeedy/ipmi_fancontrol-ng`
- ipmitool upstream (no ASUSTeK 2623 handler): `https://github.com/ipmitool/ipmitool`
