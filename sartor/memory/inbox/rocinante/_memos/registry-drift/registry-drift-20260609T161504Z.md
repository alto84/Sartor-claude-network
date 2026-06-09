---
name: registry-drift-report
stamp_utc: 2026-06-09T16:15:04Z
type: drift-detector-output
overall: red
counts: {ok: 3, stale: 0, unreachable: 1}
source: sartor/memory/machines/check-registry.py
---

# Registry drift check -2026-06-09T16:15:04Z

Overall: **RED**. 3 OK, 0 STALE, 1 UNREACHABLE.

| Hostname | IP | Status | Ping | SSH |
|---|---|---|---|---|
| rocinante | 192.168.1.169 | UNREACHABLE | rc=1 |  |
| gpuserver1 | 192.168.1.100 | OK | 1 ms | ok |
| rtxserver | 192.168.1.157 | OK | 1 ms | ok |
| gpuserver2 | 192.168.1.175 | OK | 1 ms | ok |

## Action items

- **rocinante** UNREACHABLE at 192.168.1.169 (rc=1). Possible causes: host off, DHCP reassignment, NIC swap, switch-port move. Update REGISTRY.yaml current_ip if the host moved.

## Provenance

- Registry source: `sartor/memory/machines/REGISTRY.yaml`
- Detector: `sartor/memory/machines/check-registry.py`
- Run host: rocinante (Windows Scheduled Task `Sartor Registry Drift Check`)
