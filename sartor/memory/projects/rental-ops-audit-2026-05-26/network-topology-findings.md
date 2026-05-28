---
name: Network topology findings — rental-ops audit 2026-05-26
type: project
created: 2026-05-26
related: [reference_home_network, .claude/skills/network-management/SKILL.md, .claude/skills/rtxserver-management/SKILL.md, .claude/skills/vastai-management/SKILL.md]
---

# Network topology findings — Sartor vast.ai rental fleet

## 1. Current state (verified live 2026-05-26)

```
                  Internet
                     │
                     │  WAN IP 100.1.100.63
                     ▼
        ┌─────────────────────────────┐
        │ Verizon Fios CR1000A        │
        │ 192.168.1.1                 │
        │ IPv4 DMZ host = .100        │  ◄── enabled
        │ IPv6 DMZ host = (none)      │
        │ IPv6 Pinholes = (none)      │
        │ Port-forward rules (3):     │
        │   4577/TCP  → 127.0.0.1     │  ← stale loopback (no-op)
        │   4567/TCP  → 127.0.0.1     │  ← stale loopback (no-op)
        │   40100-40199/TCP → .157    │  ◄── "rtxserver-vastai"
        └──────────────┬──────────────┘
                       │  LAN 192.168.1.0/24
         ┌─────────────┼─────────────────┬───────────────┐
         ▼             ▼                 ▼               ▼
   gpuserver1     rtxserver       UniFi switch     Rocinante
   .100           .157            .170 (uplink     .171
   (DMZ target)   (40100-40199    via port 24)     (controller)
                   forward target)
   UFW: 22, 40000-40099/tcp     UFW: 22, 40100-40199/tcp
   Hairpin DNAT: ALL traffic    Hairpin DNAT: 40100-40199
   to WAN-IP → 192.168.1.100    to WAN-IP → 192.168.1.157
   DOCKER-USER: 40000:40099     DOCKER-USER: (empty — not yet listed)
   ACCEPT (active, ~21M pkts)
```

**Verified inventory of CR1000A rules:**
- **DMZ IPv4:** enabled, `192.168.1.100 - gpuserver1`. DMZ IPv6: disabled.
- **Port Forwarding rules (3 total):**
  1. `rtxserver-vastai` — original 40100-40199, TCP, → 192.168.1.157:40100-40199, Always
  2. unnamed — 4577 TCP → 127.0.0.1:4577 (stale; loopback target is a no-op)
  3. unnamed — 4567 TCP → 127.0.0.1:4567 (stale; loopback target is a no-op)
- **IPv6 Pinholes:** none.
- **Port Forwarding Rules** (protocol catalog page) holds only the default service definitions (FTP/HTTP/HTTPS/IMAP/L2TP/POP3/SMTP/SNMP/Telnet/TFTP/Traceroute/ICMP) — those are templates, not active NAT.

## 2. Q1 — How CR1000A arbitrates DMZ vs port-forward

The CR1000A processes port-forward rules BEFORE the DMZ catch-all. Empirical evidence: rtxserver's hairpin DNAT chain shows 18 packets / 1080 bytes matched on the 40100-40199 range, meaning inbound traffic on those ports has actually reached .157 — which would be impossible if DMZ were eating everything first. The standard Actiontec/Verizon firmware behavior holds here: specific NAT rules take precedence over the DMZ host. **No conflict exists for distinct WAN port ranges.** A conflict would only arise if a port-forward rule overlapped with a port a service on `.100` was actively listening for.

## 3. Q2 — Port allocation for fleet growth

Vast.ai's `host_port_range` is per-host arbitrary; the only constraint is "no overlap between hosts on the same WAN." Proposed scheme — 100-port windows, room for 10 hosts:

| Host | Port range | Status |
|---|---|---|
| gpuserver1 | 40000-40099 | live |
| rtxserver | 40100-40199 | configured, not yet listed |
| rig3 (June 2026) | 40200-40299 | reserve |
| rig4 | 40300-40399 | reserve |
| ... | up to 40999 | available |

Document the allocation in `sartor/memory/machines/REGISTRY.yaml` so vast.ai onboarding never collides.

## 4. Q3 — Done above (§1).

## 5. Q4 — What breaks if DMZ is removed from gpuserver1

Currently gpuserver1 has UFW open for `22/tcp` (SSH) and `40000:40099/tcp` (vast.ai). Removing DMZ and replacing with explicit forwards would require:
- `22/tcp` → .100 (SSH from WAN — currently used, e.g. for remote ops)
- `40000-40099/tcp` → .100 (vast.ai customer containers)

That's it for what's audibly used. No other listeners outside that range on gpuserver1's UFW allow-list. **DMZ removal is safe** provided both rules are added before the change.

## 6. Q5 — Hairpin NAT on rtxserver

Already present and counting traffic. `iptables -t nat -L OUTPUT -n -v` on rtxserver shows:
```
DNAT tcp -- 0.0.0.0/0  100.1.100.63  tcp dpts:40100:40199 to:192.168.1.157   (18 pkts)
```
**No additional UFW/iptables work needed on rtxserver.** The hairpin rule was installed when rtxserver onboarding began (2026-05-02, paused). It's already correct. The empty DOCKER-USER chain is expected: rtxserver isn't running customer containers yet.

For each future host (rig3, rig4...), the per-host hairpin pattern is:
```bash
sudo iptables -t nat -A OUTPUT -d 100.1.100.63 -p tcp --dport 40N00:40N99 -j DNAT --to-destination 192.168.X.Y
```
Persist via `iptables-persistent`.

## 7. Recommendation

**Migrate to all-port-forward; retire DMZ.** Justifications:

1. **Diagnostic clarity.** The current DMZ + explicit-forward hybrid is what confused today's diagnosis. Once a third host arrives, the question "which path does packet X take?" gets harder, not easier.
2. **Blast radius.** DMZ exposes every unlisted port on gpuserver1 to the public internet. UFW catches it today, but a UFW misconfiguration becomes a full-host exposure rather than a single-port exposure.
3. **Symmetry.** Every rental host gets identical treatment (explicit forward of its 100-port window). New hosts onboard via one repeatable pattern, not "and also flip DMZ to point at the new one."
4. **Cost.** Three rules: `22→.100`, `40000-40099→.100`, plus the existing `40100-40199→.157`. Plus delete the two stale 127.0.0.1 rules. Five-minute change window.

Do this when convenient — not urgent. The current hybrid works; it's just brittle.

## 8. Concrete next steps

- Delete the two stale `127.0.0.1:4577` and `:4567` port-forward rules.
- Add explicit forward `22/TCP → 192.168.1.100` (SSH-to-gpuserver1).
- Add explicit forward `40000-40099/TCP → 192.168.1.100` (vast.ai gpuserver1).
- Disable DMZ host.
- Verify SSH + vast.ai connectivity from outside.
- Add port-allocation table to `sartor/memory/machines/REGISTRY.yaml`.
- Update `.claude/skills/vastai-management/SKILL.md` onboarding checklist to include the per-host port-forward rule and per-host hairpin DNAT.

**No router or iptables changes made during this audit, per scope.**
