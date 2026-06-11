# Handoff: Optimum fiber cutover + new machine ALTONGAME2025 (2026-06-10 evening)

Written by the Claude session on ALTONGAME2025 (Alton's gaming PC, Windows 11). Read this top to bottom before touching anything network-related. Companion reference: `sartor/memory/reference/optimum-fiber-circuit.md` (in commit `dcdbcccb`, unpushed from ALTONGAME2025 at time of writing — see Action 1).

## What happened tonight (chronological)

1. **Optimum fiber static circuit verified live.** Static WAN: IP `108.58.121.254`, mask `255.255.255.252` (/30), gateway `108.58.121.253`, DNS `167.206.112.138` / `167.206.7.4`. Installed 2026-05-18; sat unused until tonight.
2. **UCG-Max ("Sartor Saxena Cloud Max") configured.** UniFi OS 4.3.9, Network 9.2.87, admin user `admin`. WAN1 set static via API. `hasInternet: true`, ISP detected "Optimum Online".
3. **House cut over.** Alton unplugged the Fios CR1000A uplink from switch port 24 and connected the UCG-Max to a 2.5G switch port. Verified after cutover: USW-Pro-Max (.170) UP, all 8 APs UP at their usual IPs, UniFi controller on Rocinante (.171:8443) reachable, whole-house egress via `108.58.121.254`.
4. **Persistent API control of the UCG-Max established.** Two full-admin non-expiring UniFi OS API keys exist (header `X-API-KEY`): `rocinante-claude-v2` and `Sartor-Claude-Network-API`. Values are in token files on ALTONGAME2025 at `C:\Users\alto8\.secrets\` — NOT in git, NOT in this doc. A third key (`rocinante-claude`) leaked into a session log and was revoked same hour.

## Network facts that changed (update mental model + docs)

- **`192.168.1.1` is now the UCG-Max, not the Fios CR1000A.** Every doc/skill that says "192.168.1.1 = Verizon Fios CR1000A" is stale (network-management SKILL.md topology table, `reference/network.md`, CLAUDE.md Infrastructure section, vault entry `Fios admin`).
- **DHCP for the house is now served by the UCG-Max** (192.168.1.0/24, same subnet as before — devices kept their IPs on renewal).
- **The Fios CR1000A is disconnected from the data path.** The DMZ-to-gpuserver1 arrangement and ports 40000-40099 forwarding DIED with it. See P0 below.
- **House public IP changed** to `108.58.121.254` (static — it will never change; that's a feature).
- The Optimum XSR250GK (108.58.121.253, MAC 68:AA:C4:DC:CF:80) is the demarc. Treat as carrier equipment: do NOT factory reset, do NOT request bridge mode. Its WiFi `MyOptimum dccf80` is still broadcasting; disabling it is an approved-in-principle pending task.
- UniFi controller is STILL on Rocinante (.171). Switch + APs still adopted there. UCG-Max's built-in controller manages nothing yet — consolidation is a future deliberate migration.

## P0 — vast.ai port forwarding (GPU business is dark until this is done)

Daily notes already showed machines 52271 (gpuserver1) and 124192 (rtxserver) OFFLINE since ~Jun 6. Whatever the original cause, the cutover ADDS a new one: the port forwards (40000-40099 → gpuserver1, plus whatever rtxserver used) lived in the Fios router and are gone. Required on the UCG-Max (via Network API or UI):

- Port-forward rules for gpuserver1 (192.168.1.100) vast.ai range 40000-40099
- Equivalent rules for rtxserver (192.168.1.157) if it had any
- Then re-verify both machines on vast.ai (public IP change means vast.ai must re-detect reachability; machine records will show the new IP)

The UCG-Max API can do this from ALTONGAME2025 today, or from Rocinante once it has an API key (mint one via UCG UI → Integrations, or reuse Alton's — he has the value vaulted-pending).

## New machine: ALTONGAME2025

- Alton's gaming PC, Windows 11 Home, hostname `ALTONGAME2025`. Ethernet MAC `34-5A-60-2B-C2-04` (currently .118), WiFi MAC `EC-8E-77-C1-46-6B` (currently .176).
- Fresh environment: NO python, NO node, NO GitHub creds, Bitwarden CLI installed but unauthenticated, git identity set repo-local only.
- Repo cloned from the GitHub mirror at `C:\Users\alto8\sartor-claude-network\`. Remote `rtxserver` added (canonical bare repo). **One unpushed commit: `dcdbcccb`** (the optimum-fiber-circuit reference + this handoff's companion).
- SSH keypair generated. Public key (safe to share):
  `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDOo7pbhCzxHfH9Rg1YF7dWH3F613f3KrTYq3mhhwTHM altongame2025-sartor`
- Token files at `C:\Users\alto8\.secrets\`: `ucg-max-api-key` (rocinante-claude-v2), `ucg-max-api-key-sartor-claude-network` (Alton's key, extracted from a OneDrive txt that has since been deleted).
- Chrome automation profile on this machine has the UCG admin password saved (autofills at https://192.168.1.1).
- Needs onboarding to be a peer: REGISTRY.yaml entry, SSH keys on peers (Action 1), eventually creds-sync inclusion.

## Actions for Rocinante, in order

1. **Install ALTONGAME2025's pubkey on both peers** (Rocinante has passwordless SSH to both):
   ```
   ssh alton@192.168.1.157 "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDOo7pbhCzxHfH9Rg1YF7dWH3F613f3KrTYq3mhhwTHM altongame2025-sartor' >> ~/.ssh/authorized_keys"
   ssh alton@192.168.1.100 "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDOo7pbhCzxHfH9Rg1YF7dWH3F613f3KrTYq3mhhwTHM altongame2025-sartor' >> ~/.ssh/authorized_keys"
   ```
   Then ALTONGAME2025 pushes `dcdbcccb` to the rtxserver remote; the 15-min mirror task syncs GitHub. (A Gmail draft titled "Run on Rocinante: install ALTONGAME2025 SSH key on peers" contains the same commands.)
2. **vast.ai port forwards on the UCG-Max** (P0 above).
3. **Verify the controller's view**: all 9 devices state=1 in https://192.168.1.171:8443 after the cutover.
4. **Update stale docs**: REGISTRY.yaml (add ALTONGAME2025; note WAN change), MACHINES.md, network-management SKILL.md topology table, `reference/network.md`, CLAUDE.md infra section (also still says Rocinante is Windows 10 / this machine doesn't exist).
5. **DHCP reservations on UCG-Max** for .170, .171, the 8 AP IPs, .157, .100 — so infrastructure never drifts.
6. **Scheduled-task sanity**: UniFi Daily Backup, Memory Mirror, Creds Sync, gather — all should be ISP-agnostic, but confirm first runs post-cutover succeeded.
7. **Pending items**: disable XSR250GK WiFi; UCG-Max firmware update (will blip house internet ~5 min — do late night); Fios service cancellation decision after a stability week; Bitwarden onboarding of ALTONGAME2025 (Alton must `bw login` there); vault the UCG admin password + both API keys.

## Credential hygiene notes

- UCG admin password: in Chrome saved passwords (automation profile on ALTONGAME2025; possibly synced). Vault it as `UCG-Max admin` when Bitwarden is available.
- API keys: token files only, per the per-service-token-file convention. Vault as `UCG-Max API key (rocinante-claude-v2)` and `UCG-Max API key (Sartor-Claude-Network-API)`.
- The revoked leaked key is dead; no action.
- Alton could not recall peer SSH passwords tonight; if that persists, check the Bitwarden master password hint flow, or the logged-in Bitwarden app/extension on Rocinante.
