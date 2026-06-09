---
name: registry-drift-report
stamp_utc: 2026-06-09T18:47:49Z
type: drift-detector-output
overall: green
counts: {ok: 4, stale: 0, unreachable: 0}
source: sartor/memory/machines/check-registry.py
---

# Registry drift check -2026-06-09T18:47:49Z

Overall: **GREEN**. 4 OK, 0 STALE, 0 UNREACHABLE, 0 SELF-DRIFT.

| Hostname | IP | Status | Ping | SSH |
|---|---|---|---|---|
| rocinante | 192.168.1.171 | OK | self (local adapter matches registry) | skipped (self) |
| gpuserver1 | 192.168.1.100 | OK | 1 ms | ok |
| rtxserver | 192.168.1.157 | OK | 1 ms | ok |
| gpuserver2 | 192.168.1.175 | OK | 2 ms | ok |

## Provenance

- Registry source: `sartor/memory/machines/REGISTRY.yaml`
- Detector: `sartor/memory/machines/check-registry.py`
- Run host: rocinante (Windows Scheduled Task `Sartor Registry Drift Check`)
