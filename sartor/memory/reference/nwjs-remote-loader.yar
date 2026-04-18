/*
  NW.js remote-payload loader detection
  Source incident: PrivacyBrowse MSIX, 2026-04-16
  Companion memo: reference/microsoft-store-pua-pattern.md
  Scope: extracted MSIX contents (package.json, AppxManifest.xml), not the MSIX archive itself.
         Run after unpacking the AppX/MSIX with `expand` or by treating it as a ZIP.
*/

rule NWjs_Remote_Loader_PackageJson
{
    meta:
        description = "package.json declares remote HTTPS main + Node enabled + unrestricted node-remote — NW.js remote-payload loader pattern"
        author      = "Alton / Claude"
        reference   = "PrivacyBrowse 6BA8FE022212713FFAEC8940C3BD023E75528C4D2D00D1F69ACCB766BA241F15"
        date        = "2026-04-16"
        severity    = "high"
        tlp         = "green"

    strings:
        $main_remote_http  = /"main"\s*:\s*"https?:\/\/[^"]+"/
        $nodejs_true       = /"nodejs"\s*:\s*true/
        $node_remote_any   = /"node-remote"\s*:\s*"\*:\/\/\*"/
        $webview_all_urls  = /"accessible_resources"\s*:\s*\[\s*"<all_urls>"\s*\]/

    condition:
        filesize < 16KB
        and $main_remote_http
        and $nodejs_true
        and ($node_remote_any or $webview_all_urls)
}

rule AppxManifest_Anonymous_Publisher_FullTrust_Autostart
{
    meta:
        description = "AppxManifest.xml with anonymous-GUID publisher + runFullTrust + StartupTask Enabled=true — Store PUA pattern"
        author      = "Alton / Claude"
        reference   = "Microsoft Store PUA campaigns 2024-2026, PrivacyBrowse family"
        date        = "2026-04-16"
        severity    = "medium"
        tlp         = "green"

    strings:
        $guid_publisher = /Publisher="CN=[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"/
        $runfulltrust   = "rescap:Capability Name=\"runFullTrust\""
        $startup_task   = /<desktop:StartupTask[^>]+Enabled="true"/
        $fulltrust_app  = "EntryPoint=\"Windows.FullTrustApplication\""

    condition:
        filesize < 256KB
        and $guid_publisher
        and $runfulltrust
        and ($startup_task or $fulltrust_app)
}

rule NWjs_Launcher_Renamed
{
    meta:
        description = "PE binary with NW.js OriginalFilename nw.exe but renamed delivery — loader shim"
        author      = "Alton / Claude"
        reference   = "PrivacyBrowse.exe renamed from nw.exe"
        date        = "2026-04-16"
        severity    = "info"
        tlp         = "green"

    strings:
        $original_nw    = "OriginalFilename" wide ascii
        $nw_exe_literal = "nw.exe" wide
        $nwjs_company   = "The NW.js Community" wide
        $nwjs_desc      = "nwjs" wide

    condition:
        uint16(0) == 0x5A4D   // MZ
        and filesize < 8MB
        and $original_nw
        and $nw_exe_literal
        and ($nwjs_company or $nwjs_desc)
}
