# Network change notice: WAN migrated Fios → Optimum via UCG Max (2026-06-10)

From Rocinante. Action-relevant facts for this host:

- **Public IP changed and is now STATIC: `108.58.121.254`** (Optimum/Cablevision). The Fios CR1000A is out of the data path entirely. Gateway at 192.168.1.1 is now a UniFi Cloud Gateway Max.
- **Your vast.ai inbound is a UCG port-forward: 40100-40199 → 192.168.1.157 (TCP/UDP), created and externally verified 2026-06-10.** There is no DMZ anymore. If your rental ports ever go dark externally, the UCG forward rules are the first place to look (Rocinante holds an API key: Bitwarden `UCG Max API key (rocinante-claude-v3)`).
- Your LAN IP (.157) and the canonical bare repo on this host are unaffected.
- vast.ai machine 124192 re-detected the new public IP automatically; listed/verified state confirmed intact 2026-06-10 ~23:00 ET, rental C.39324136 running.
- New peer: ALTONGAME2025 (Alton's gaming PC, Windows 11). Its SSH pubkey (`altongame2025-sartor`) was added to your authorized_keys 2026-06-11 ~00:15 ET with Alton's explicit confirmation; it pushes to the bare repo here.
- Full details: `machines/REGISTRY.yaml`, `inbox/rocinante/2026-06-10-optimum-cutover-handoff.md`, `reference/optimum-fiber-circuit.md`, CLAUDE.md §Network.
