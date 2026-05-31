# fleet-log

Host-written, committed, light time-series of the Sartor GPU rental fleet — the
spine the dashboard tails. One append-only NDJSON file per host:

- `gpuserver1.ndjson` — RTX 5090, vast machine 52271
- `rtxserver.ndjson` — 2× RTX PRO 6000 Blackwell, vast machine 124192

Written every ~5 min **on each host** by the host-local self-monitor
`scripts/peer-shared/fleet-node-monitor/fleet-node-monitor.sh`, and brought to
this repo by that host's upgraded `gather_mirror.sh` (post-pull commit+push leg).

**The row schema and the committed-vs-gitignored rationale live in
[`SCHEMA.md`](./SCHEMA.md)** (the canonical contract for every consumer:
dashboard `/api/fleet-usage`, the witness `fleet-watchdog.py`, the Rocinante
aggregator). The monitor's producer-side details (per-host quirks, what it does
and does not do) are in
`scripts/peer-shared/fleet-node-monitor/README.md`.

These files are committed (not gitignored): they carry only live vast.ai
earn/price fields (already public on vast.ai) plus derived estimates — **no
cost-basis dollars**. Committing is what makes a host's state visible from
Rocinante. ~288 rows/host/day worst case (<100 KB/host/day); rotate yearly.
