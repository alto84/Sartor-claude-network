# Fleet central-log — NDJSON schema (committed, host-written, light)

The light time-series spine the fleet dashboard tails. ONE append-only NDJSON file
per host, written **on the host itself** by `scripts/peer-shared/fleet-node-monitor/fleet-node-monitor.sh`
(every 5 min via a systemd-user timer), and committed to this repo by the host's
upgraded `gather_mirror.sh` (the post-pull commit+push leg).

```
sartor/memory/fleet-log/gpuserver1.ndjson
sartor/memory/fleet-log/rtxserver.ndjson
```

## Why this is COMMITTED while data/financial/ is gitignored

`fleet.yaml` set the precedent: machine **config** is committed; **dollar cost-basis**
is gitignored. These NDJSON rows carry vast.ai *earn* fields (`earn_hour`, `earn_day`)
and the *applied list price* — all of which are already public on the vast.ai
marketplace — plus utilization/power telemetry. They carry **no cost basis, no account
balance, no revenue net of fee, no capital accounts**. Committing is precisely what
makes rtxserver's self-report visible from Rocinante (rtxserver has no GitHub creds and
no authenticated vast.ai CLI; the repo is its only channel home).

The dollar **accounting** source of truth stays in `data/financial/solar-inference/`
(gitignored): `revenue-2026.csv` (net revenue), `power-2026.csv` (precise metered kWh),
`reprice-log.jsonl`, `books-2026.json`. `est_kwh_interval` and `est_earn_interval` here
are **derived, graphing-only** estimates — never the books.

## Row schema (one JSON object per line)

| field | type | meaning |
|-------|------|---------|
| `ts` | str (ISO-8601 UTC, `…Z`) | sentinel tick timestamp |
| `host` | str | `gpuserver1` \| `rtxserver` (matches fleet.yaml `hostname`) |
| `machine_id` | int | vast.ai machine_id (52271 / 124192) |
| `rented` | bool | `current_rentals_running >= 1` |
| `gpu_util` | int | mean GPU utilization % across the box's GPUs |
| `temp_max` | int | hottest GPU temp this tick, °C |
| `power_w` | int | summed GPU `power.draw` + host idle baseline, W |
| `est_kwh_interval` | float | `power_w * interval_hours / 1000` — derived, graphing-only |
| `list_price` | float | applied on-demand `$/GPU/hr` (vast.ai `listed_gpu_cost`) |
| `min_bid` | float | interruptible floor `$/GPU/hr` |
| `reliability2` | float | vast.ai reliability score (0–1) |
| `earn_hour` | float | vast.ai `earn_hour` (public) |
| `earn_day` | float | vast.ai `earn_day` (public) |
| `est_earn_interval` | float | `earn_hour * interval_hours` — derived, graphing-only |
| `stale_docker` | int | count of leftover `C.*` docker containers not tied to a live rental |
| `stale_vm` | int | count of leftover libvirt domains not tied to a live rental |
| `error_description` | str \| null | vast.ai `error_description` (delist risk) when set |
| `vastai_ok` | bool | the vast.ai read succeeded this tick |
| `health` | str | `green` \| `yellow` \| `red` (sentinel's own classification) |
| `source` | str | `sentinel` (host self-report) \| `witness` (synthetic DOWN row from fleet-watchdog) |
| `note` | str \| null | optional context (e.g. `host-down` on a witness row) |

### Synthetic witness rows

When `scripts/fleet-watchdog.py` (Rocinante) detects a host is down (ping + ssh both
fail) while the host's sentinel heartbeat is stale, it appends ONE row with
`source: "witness"`, `health: "red"`, `rented: <last-known>`, `note: "host-down"` so the
dashboard timeline shows the outage as **DOWN**, not a blank gap. This honors the
2026-05-28 lesson: a powered-off host cannot self-report, so the witness owns liveness.

## Volume / rotation

~288 rows/host/day worst case (one per 5-min tick) at ~250 bytes ⇒ **<100 KB/host/day**.
Rotate yearly: at New Year, `git mv gpuserver1.ndjson gpuserver1-2026.ndjson` (and same
for rtxserver) and let the sentinel start a fresh file. The dashboard `/api/fleet-usage`
tails only the current-year file plus the rotated file if the window spans the boundary.

## Consumers

- **Rocinante aggregator** `scripts/fleet/usage_log.py` — merges both host NDJSONs into a
  unified `data/financial/solar-inference/usage-log.csv` (gitignored — it joins the
  earn/power-derived columns for charting). Idempotent by `(host, ts)`.
- **Dashboard** `dashboard/family/server.py` `GET /api/fleet-usage` — tails the NDJSONs
  (or the merged CSV) for the Fleet Usage history charts.
- **fleet-watchdog.py** — reads each host's `_sentinel-heartbeat.json` for the
  stale-heartbeat check; appends synthetic DOWN rows.

## Relation to the other ledgers (consolidate, do not duplicate)

| file | owner | role | committed? |
|------|-------|------|-----------|
| `fleet-log/<host>.ndjson` | host sentinel | **light intraday time-series spine** (this file) | **yes** |
| `revenue-2026.csv` | `books`/`vastai_pull` | canonical NET revenue | no (gitignored) |
| `power-2026.csv` | `power_ingest` | precise metered kWh (ITC substantiation) | no |
| `reprice-log.jsonl` | `reprice` | repricer decision trail | no |
| `usage-log.csv` | `usage_log` (aggregator) | merged charting CSV (derived) | no |
| `fleet-state-history.jsonl` | `vastai_pull` (23:45 only) | sparse; **superseded for intraday** by this NDJSON | no |
