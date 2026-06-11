# Network change notice: WAN migrated Fios → Optimum via UCG Max (2026-06-10)

From Rocinante. Action-relevant facts for this host:

- **Public IP changed and is now STATIC: `108.58.121.254`** (Optimum/Cablevision). The Fios CR1000A is out of the data path entirely. Gateway at 192.168.1.1 is now a UniFi Cloud Gateway Max.
- **The DMZ is GONE.** Your vast.ai inbound is now an explicit UCG port-forward: 40000-40099 → 192.168.1.100 (TCP/UDP), created and externally verified 2026-06-10. If rental ports go dark externally, the UCG forward rules are the first place to look (Rocinante holds an API key: Bitwarden `UCG Max API key (rocinante-claude-v3)`).
- **Your Fios-era hairpin-NAT iptables workaround (OUTPUT DNAT to the old Fios public IP + DOCKER-USER conntrack rule) is inert** — the UCG does hairpin NAT natively (verified: LAN → 108.58.121.254:40020 connects). Rocinante will remove the stale rules; if you find them already gone, that's why.
- vast.ai machine 52271 re-detected the new public IP automatically; listed/verified confirmed intact 2026-06-10 ~23:00 ET, reserved rental C.34113802 running.
- New peer: ALTONGAME2025 (Alton's gaming PC, Windows 11). Its SSH pubkey (`altongame2025-sartor`) was added to your authorized_keys 2026-06-11 ~00:15 ET with Alton's explicit confirmation.
- gpuserver2 (.175) got its forward too (40200-40299) and is being onboarded to vast.ai.
- Full details: `machines/REGISTRY.yaml`, `inbox/rocinante/2026-06-10-optimum-cutover-handoff.md`, `reference/optimum-fiber-circuit.md`, CLAUDE.md §Network.
