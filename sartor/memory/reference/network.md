---
type: reference
entity: home-network
updated: "2026-04-14"
updated_by: rocinante-curator
tags: [domain/infrastructure, entity/rocinante, type/reference]
related: [MACHINES, gpuserver1-operations]
---

# Home Network Reference

## Verizon Fios WiFi

| Field | Value |
|-------|-------|
| **SSID** | Verizon WiFi |
| **Password** | cutler9-nor-cot |

## Notes

- Router: Verizon Fios (Vue.js SPA admin interface)
- DMZ: All external traffic forwarded to 192.168.1.100 (gpuserver1)
- UFW on gpuserver1 handles port filtering
- Hairpin NAT workaround: iptables OUTPUT DNAT rule + DOCKER-USER conntrack rule

## History

- 2026-04-14: Created from extractor proposal ce-1776051002-72a1017f5712 (wifi password extracted from session 2026-04-10).
