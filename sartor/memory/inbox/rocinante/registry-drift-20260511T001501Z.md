---
name: registry-drift-report
stamp_utc: 2026-05-11T00:15:01Z
type: drift-detector-output
overall: green
counts: {ok: 3, stale: 0, unreachable: 0}
source: sartor/memory/machines/check-registry.py
---

# Registry drift check -2026-05-11T00:15:01Z

Overall: **GREEN**. 3 OK, 0 STALE, 0 UNREACHABLE.

| Hostname | IP | Status | Ping | SSH |
|---|---|---|---|---|
| rocinante | 192.168.1.171 | OK | 1 ms | skipped (no ssh_path) |
| gpuserver1 | 192.168.1.199 | OK | 1 ms | ok |
| rtxserver | 192.168.1.157 | OK | 1 ms | ok |

## Provenance

- Registry source: `sartor/memory/machines/REGISTRY.yaml`
- Detector: `sartor/memory/machines/check-registry.py`
- Run host: rocinante (Windows Scheduled Task `Sartor Registry Drift Check`)
