#!/usr/bin/env python3
"""Compute per-phase peaks + means + audible-threshold timing from samples.csv.

Usage: phase_summary.py PHASE_NAME [PHASE_NAME ...]
       phase_summary.py --all
"""
from __future__ import annotations
import csv
import sys
from pathlib import Path

CSV_PATH = Path("/home/alton/experiments/2026-05-02-stress/samples.csv")


def to_float(x: str) -> float | None:
    if x in ("NA", "", "None"):
        return None
    try:
        return float(x.lstrip("+"))
    except ValueError:
        return None


def summarize(rows: list[dict]) -> dict:
    if not rows:
        return {}
    cols = [
        "gpu0_temp_c", "gpu0_pwr_w", "gpu0_fan_pct",
        "gpu1_temp_c", "gpu1_pwr_w", "gpu1_fan_pct",
        "bmc_pcie03_c", "bmc_pcie07_c", "bmc_cpupkg_c",
        "bmc_cha1_rpm", "bmc_cha2_rpm", "bmc_cha3_rpm", "bmc_cha5_rpm", "bmc_cpufan_rpm",
        "cpu_tctl_c", "cpu_tccd4_c",
        "wall_estimate_w",
    ]
    out = {}
    for c in cols:
        vals = [to_float(r[c]) for r in rows]
        vals = [v for v in vals if v is not None]
        if vals:
            out[c] = {"peak": max(vals), "mean": sum(vals) / len(vals), "min": min(vals), "n": len(vals)}
    out["_n_samples"] = len(rows)
    out["_first_ts"] = rows[0]["ts_iso"]
    out["_last_ts"] = rows[-1]["ts_iso"]
    out["_duration_s"] = int(rows[-1]["ts_epoch"]) - int(rows[0]["ts_epoch"])
    return out


def time_to_audible(rows: list[dict]) -> dict:
    """Time from phase-start to first row hitting any audible threshold."""
    if not rows:
        return {}
    t0 = int(rows[0]["ts_epoch"])
    for r in rows:
        f0 = to_float(r["gpu0_fan_pct"]) or 0
        f1 = to_float(r["gpu1_fan_pct"]) or 0
        p3 = to_float(r["bmc_pcie03_c"]) or 0
        p7 = to_float(r["bmc_pcie07_c"]) or 0
        c1 = to_float(r["bmc_cha1_rpm"]) or 0
        c2 = to_float(r["bmc_cha2_rpm"]) or 0
        c3 = to_float(r["bmc_cha3_rpm"]) or 0
        c5 = to_float(r["bmc_cha5_rpm"]) or 0
        if (f0 >= 60 or f1 >= 60 or p3 >= 65 or p7 >= 65 or
            c1 >= 1300 or c2 >= 1300 or c3 >= 1300 or c5 >= 1300):
            return {
                "delta_s": int(r["ts_epoch"]) - t0,
                "ts_iso": r["ts_iso"],
                "gpu0_fan_pct": f0, "gpu1_fan_pct": f1,
                "pcie03": p3, "pcie07": p7,
                "cha1": c1, "cha2": c2, "cha3": c3, "cha5": c5,
            }
    return {"delta_s": None, "note": "audible threshold never crossed in this phase"}


def main() -> int:
    rows_all = list(csv.DictReader(CSV_PATH.open()))
    args = sys.argv[1:]
    if not args or args == ["--all"]:
        phases = sorted({r["phase"] for r in rows_all})
    else:
        phases = args

    for ph in phases:
        rs = [r for r in rows_all if r["phase"] == ph]
        if not rs:
            print(f"\n=== {ph} : no rows ===")
            continue
        print(f"\n=== {ph} ({len(rs)} samples, {rs[0]['ts_iso']} → {rs[-1]['ts_iso']}) ===")
        s = summarize(rs)
        for k in ["gpu0_temp_c", "gpu1_temp_c", "bmc_pcie03_c", "bmc_pcie07_c", "bmc_cpupkg_c",
                 "cpu_tctl_c", "cpu_tccd4_c", "gpu0_pwr_w", "gpu1_pwr_w", "wall_estimate_w",
                 "gpu0_fan_pct", "gpu1_fan_pct",
                 "bmc_cha1_rpm", "bmc_cha2_rpm", "bmc_cha3_rpm", "bmc_cha5_rpm", "bmc_cpufan_rpm"]:
            if k in s:
                v = s[k]
                print(f"  {k:24s} peak={v['peak']:>7.1f}  mean={v['mean']:>7.1f}  min={v['min']:>7.1f}")
        a = time_to_audible(rs)
        if a.get("delta_s") is not None:
            print(f"  audible@t+{a['delta_s']}s GPU0fan={a['gpu0_fan_pct']:.0f}% PCIE03={a['pcie03']:.0f}°C CHA5={a['cha5']:.0f}rpm")
        else:
            print(f"  audible: not crossed in this phase")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
