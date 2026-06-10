#!/usr/bin/env python3
"""
Sartor fleet — adaptive market repricer v3 (multi-machine, occupancy-band model).

OBJECTIVE: maximize expected $/day per machine. Revenue rate = price x occupancy and
occupancy-as-a-function-of-price is unknown and non-stationary, so this is a learning
problem, not a formula. v3 replaces the v1/v2 fill-latency multiplier with a banded
empirical model fed by every 15-minute tick (96 observations/day) instead of only the
rare fill events (~1/day):

  1. MARKET ANCHOR (per GPU class, recomputed live): the ~P40 comparable listing
     (per-GPU, reliability >= 0.90, ALL our own machines excluded so three 5090s can't
     race each other down), floored at rank-2 in thin markets (Alton's original "two
     from the bottom"). Anchoring keeps us market-relative as supply drifts; the band
     model learns our box-specific premium or discount on top of it.
  2. RELATIVE-PRICE BANDS: the knob is r = renter-facing per-GPU price / anchor,
     discretized into 6 bands on [0.70, 1.50]. Each tick attributes wall-clock time:
     rented hours to the band the active rental FILLED at (locked_r), idle hours to
     the band currently listed. occupancy(band) = rented_h / (rented_h + idle_h) with
     an optimistic prior (0.85 occ, 12 pseudo-hours) and ~10-day half-life decay so
     stale market regimes fade.
  3. SELECTION (UCB bandit): when idle, list at the band maximizing
         band_mid_r x min(1, occ + UCB_C * sqrt(ln(total_h) / band_h)).
     The optimistic prior makes unexplored HIGHER bands win first (skim, then descend
     — a new listing starts near the P75 ceiling and steps down until it fills); ~3h
     idle at an overpriced band is enough evidence for it to lose to the band below.
     Real rented-hours make a good band sticky. Exploration cost is bounded by the
     idle time it takes to demote a band.
  4. BOUNDED & GUARDED: floored at electricity marginal cost (fleet.yaml), ceilinged
     just under the P75 peer + an absolute cap, step-capped per relist (30% of
     anchor — scales across GPU classes), relists only when IDLE (a mid-rental relist
     cannot touch the active contract), and never relists against a listing end_date
     within 2 days (expiry/relist is a human decision per the short-term-first rule).

SCOPE: every fleet.yaml machine with `listing.dynamic.enabled`, a vast_ai_machine_id,
and status active. Optional `dynamic.start_date` defers enrollment (gpuserver1 uses
this: its reserved-contract hours would poison band learning, so it enrolls the day
C.34113802 ends and the controller takes over automatically). 124192 keeps its
min_gpus=2 thermal invariant on every relist.

CONFIG  (committed):   sartor/memory/business/fleet.yaml
STATE   (gitignored):  data/financial/solar-inference/reprice-state-<machine_id>.json
LOG     (gitignored):  data/financial/solar-inference/reprice-log-<machine_id>.jsonl

Defaults to APPLY (the SartorFleetReprice task runs it bare every 15 min); --dry-run
computes + prints and writes nothing; --machine <id> filters to one machine.

HISTORY: v1 2026-05-29 (rank-2 anchor, fill-latency multiplier). v2 2026-06-09
(percentile anchor, overhead clamp — the rank-2 anchor had become bottom-decile and a
corrupt 0.82 overhead deflated every target by ~$0.41/GPU). v3 2026-06-10 (this —
multi-machine + band model, built for the 124192 + three-5090 fleet).
"""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_YAML = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
FIN_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"

VASTAI_SSH = "alton@gpuserver1"
VASTAI_BIN = "~/.local/bin/vastai"

# --- market anchor ---
MIN_COMP_RELIABILITY = 0.90        # ignore junk listings racing to the bottom
ANCHOR_RANK = 2                    # thin-market floor: "two from the bottom" (Alton's literal rule)
ANCHOR_PCTL = 0.40                 # deep-market anchor percentile (rank-2 of 19 comps is bottom-decile)
CEILING_PCTL = 0.75                # ceiling ref: just under the P75 peer
OUTLIER_MULT = 1.5                 # reject a fallback anchor > 1.5x the robust median (lone mispriced comp)


def anchor_rank(n: int) -> int:
    return max(ANCHOR_RANK, math.ceil(ANCHOR_PCTL * n))


def ceiling_rank(n: int) -> int:
    return min(n, max(anchor_rank(n) + 1, math.ceil(CEILING_PCTL * n)))


# --- occupancy-band model ---
BAND_EDGES = [0.70, 0.85, 0.95, 1.05, 1.15, 1.30, 1.50]   # r = our per-GPU price / anchor
OCC_PRIOR = 0.85                   # optimistic prior occupancy for unexplored bands
PRIOR_HOURS = 12.0                 # pseudo-hours behind the prior (how fast evidence overrides it)
UCB_C = 0.25                       # exploration bonus weight
DECAY_PER_TICK = 0.9993            # ~10-day half-life at 96 ticks/day; stale regimes fade
TICK_CAP_H = 1.0                   # max wall-time attributed per tick (cron gaps don't dump hours)


def n_bands() -> int:
    return len(BAND_EDGES) - 1


def band_key(i: int) -> str:
    return f"{BAND_EDGES[i]:.2f}-{BAND_EDGES[i + 1]:.2f}"


def band_of(r: float) -> int:
    r = max(BAND_EDGES[0], min(BAND_EDGES[-1] - 1e-9, r))
    for i in range(n_bands()):
        if r < BAND_EDGES[i + 1]:
            return i
    return n_bands() - 1


def band_mid(i: int) -> float:
    return (BAND_EDGES[i] + BAND_EDGES[i + 1]) / 2.0


def default_bands() -> dict:
    return {band_key(i): {"rented_h": 0.0, "idle_h": 0.0} for i in range(n_bands())}


def band_occ(b: dict) -> float:
    rh, ih = float(b["rented_h"]), float(b["idle_h"])
    return (rh + OCC_PRIOR * PRIOR_HOURS) / (rh + ih + PRIOR_HOURS)


def select_band(bands: dict) -> tuple[int, list[float]]:
    """argmax over bands of expected relative revenue: mid_r x min(1, occ + UCB bonus)."""
    total_h = sum(float(b["rented_h"]) + float(b["idle_h"]) for b in bands.values()) + PRIOR_HOURS
    best_i, best_score, scores = 0, -1.0, []
    for i in range(n_bands()):
        b = bands[band_key(i)]
        h = float(b["rented_h"]) + float(b["idle_h"]) + PRIOR_HOURS
        bonus = UCB_C * math.sqrt(math.log(max(math.e, total_h)) / h)
        score = band_mid(i) * min(1.0, band_occ(b) + bonus)
        scores.append(round(score, 4))
        if score > best_score:
            best_score, best_i = score, i
    return best_i, scores


# --- bounds / damping ---
STEP_FRAC = 0.30                  # max relist move as a fraction of the anchor (class-relative)
STEP_MIN = 0.05                   # $/GPU floor on the step cap
ABS_CEILING_GPU = 3.00            # absolute per-GPU ceiling, regardless of market
MIN_RELIST_INTERVAL_MIN = 30      # don't relist more often than this
DEFAULT_OVERHEAD = 0.02           # our search dph_total - gpu_cost*ng; comps show ~$0.001 real
OVERHEAD_MAX = 0.10               # clamp calibration; anything bigger is a stale/garbled offer read
PRICE_TOLERANCE = 0.02            # only relist if target differs from live by more than this
END_DATE_MIN_DAYS = 2             # listing end_date closer than this -> relist is a human decision


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def now_dt() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


# --- vast.ai layer (idiom from scripts/fleet/vastai_pull.py) -------------------

def _ssh_json(remote_cmd: str, timeout: int = 45) -> tuple[object | None, str]:
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", VASTAI_SSH, remote_cmd]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None, "ssh timeout"
    except FileNotFoundError:
        return None, "ssh binary not found"
    if out.returncode != 0:
        err = (out.stderr or "").strip().splitlines()
        return None, (err[-1][:120] if err else f"rc={out.returncode}")
    payload = (out.stdout or "").lstrip()
    if not payload:
        return None, "empty output"
    try:
        obj, _ = json.JSONDecoder().raw_decode(payload)
        return obj, "ok"
    except json.JSONDecodeError as e:
        return None, f"json decode failed: {e}"


def get_machines() -> dict[int, dict]:
    """All host machines keyed by machine_id — one SSH serves every fleet member."""
    data, _ = _ssh_json(f"{VASTAI_BIN} show machines --raw 2>/dev/null")
    out: dict[int, dict] = {}
    if isinstance(data, dict):
        for m in data.get("machines", []):
            if m.get("machine_id") is not None:
                out[int(m["machine_id"])] = m
    return out


def get_comp_offers(query: str) -> list[dict] | None:
    data, _ = _ssh_json(f"{VASTAI_BIN} search offers '{query}' --raw 2>/dev/null")
    if not isinstance(data, list):
        return None
    return data


# --- state ----------------------------------------------------------------------

def state_path(mid: int) -> Path:
    return FIN_DIR / f"reprice-state-{mid}.json"


def log_path(mid: int) -> Path:
    return FIN_DIR / f"reprice-log-{mid}.jsonl"


def default_state() -> dict:
    return {"schema": 3, "last_tick": None, "last_rented": None, "idle_since": None,
            "last_relist": None, "last_applied_gpu_cost": None,
            "overhead": DEFAULT_OVERHEAD, "locked_r": None, "bands": default_bands()}


def load_state(mid: int) -> dict:
    p = state_path(mid)
    if p.exists():
        try:
            s = json.loads(p.read_text(encoding="utf-8"))
            bands = s.get("bands") or {}
            for i in range(n_bands()):
                bands.setdefault(band_key(i), {"rented_h": 0.0, "idle_h": 0.0})
            s["bands"] = bands
            return s
        except (OSError, json.JSONDecodeError):
            pass
    return default_state()


def save_state(mid: int, state: dict) -> None:
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    state_path(mid).write_text(json.dumps(state, indent=2), encoding="utf-8")


def log_decision(mid: int, record: dict) -> None:
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    with log_path(mid).open("a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(record) + "\n")


# --- fleet.yaml: enumerate dynamic machines + update a gpu_cost line in place -----

def load_fleet() -> list[dict]:
    fleet = yaml.safe_load(FLEET_YAML.read_text(encoding="utf-8")) or {}
    return fleet.get("machines", [])


def update_fleet_gpu_cost(hostname: str, new_cost: float) -> bool:
    """Update the gpu_cost line inside the named machine block only (stateful walk,
    pattern from check-registry.py:update_last_verified). Preserves all comments."""
    text = FLEET_YAML.read_text(encoding="utf-8")
    out, in_block, done = [], False, False
    for line in text.splitlines():
        mh = re.match(r"^\s*-\s*hostname:\s*(\S+)\s*$", line)
        if mh:
            in_block = (mh.group(1) == hostname)
        if in_block and not done and re.match(r"^\s*gpu_cost:\s*", line):
            indent = re.match(r"^(\s*)", line).group(1)
            out.append(f"{indent}gpu_cost: {new_cost:.2f}                   "
                       f"# DYNAMIC (scripts/fleet/reprice.py) set {utc_iso()}")
            done = True
            continue
        out.append(line)
    if not done:
        return False
    FLEET_YAML.write_text("\n".join(out) + "\n", encoding="utf-8")
    return True


def apply_listing(mid: int, gpu_cost: float, listing: dict) -> tuple[bool, str]:
    min_gpus = int(listing.get("min_gpus", 1))
    if mid == 124192 and min_gpus < 2:                  # thermal invariant: never < 2 for 124192
        return False, f"REFUSED: min_gpus={min_gpus} < 2 (single-card thermal pathology)"
    storage = listing.get("storage_cost", 0.10)
    end_date = listing.get("end_date", "06/30/2026")
    if "-" in str(end_date):                            # YAML ISO -> vastai MM/DD/YYYY
        y, m, d = str(end_date).split("-")
        end_date = f"{m}/{d}/{y}"
    bid = listing.get("min_bid", round(gpu_cost * 0.80, 2))
    bid = round(min(float(bid), gpu_cost * 0.92), 2)    # interruptible floor must stay <= price
    cmd = (f"{VASTAI_BIN} list machine {mid} -g {gpu_cost:.2f} -b {bid:.2f} "
           f"-s {storage} -m {min_gpus} -e \"{end_date}\"")
    out = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
                          VASTAI_SSH, cmd], capture_output=True, text=True, timeout=45,
                         encoding="utf-8", errors="replace")
    if out.returncode != 0:
        return False, f"vastai list failed: {(out.stderr or out.stdout).strip()[:160]}"
    return True, (out.stdout or "").strip()[:160]


# --- core ------------------------------------------------------------------------

def compute(state: dict, our: dict | None, comps_raw: list[dict] | None,
            listing: dict, dyn: dict, fleet_mids: set[int], now: datetime) -> dict:
    """Pure decision for one machine: returns target, band stats, reasons, apply flag."""
    floor = float(listing.get("marginal_floor_gpu_cost", 0.11))
    cfg_ng = int(dyn.get("comp_num_gpus", listing.get("min_gpus", 1)))
    live_gpu_cost = our.get("listed_gpu_cost") if our else None
    running = our.get("current_rentals_running") if our else None
    now_rented = (int(running) >= 1) if running is not None else None

    reasons: list[str] = []
    overhead = float(state.get("overhead", DEFAULT_OVERHEAD))
    idle_since = parse_iso(state.get("idle_since"))
    locked_r = state.get("locked_r")
    bands = state["bands"]

    # --- calibrate overhead from our own offer if visible (idle) ---
    if comps_raw and live_gpu_cost:
        ours = next((o for o in comps_raw if o.get("machine_id") in fleet_mids
                     and o.get("machine_id") == (our or {}).get("machine_id")), None)
        if ours and ours.get("dph_total"):
            ng = ours.get("num_gpus", cfg_ng) or cfg_ng
            raw_oh = float(ours["dph_total"]) - float(live_gpu_cost) * ng
            overhead = round(min(OVERHEAD_MAX, max(0.0, raw_oh)), 4)
            if raw_oh > OVERHEAD_MAX:
                reasons.append(f"overhead calib {raw_oh:.2f} implausible -> clamped {OVERHEAD_MAX}")

    # --- comp pool: exclude ALL our machines, reliability-filtered ---
    pool = []
    if comps_raw:
        for o in comps_raw:
            if o.get("machine_id") in fleet_mids:
                continue
            if (o.get("reliability2") or 0) < MIN_COMP_RELIABILITY:
                continue
            ng = int(o.get("num_gpus") or 1)
            dph = o.get("dph_total")
            if not dph:
                continue
            pool.append({"mid": o.get("machine_id"), "dph": float(dph), "ng": ng,
                         "per_gpu": float(dph) / ng, "rel": o.get("reliability2")})

    strictN = sorted([c for c in pool if c["ng"] == cfg_ng], key=lambda c: c["per_gpu"])
    pergpu = sorted(pool, key=lambda c: c["per_gpu"])

    basis = None
    anchor_per_gpu = ceil_per_gpu = None
    comps = []
    if len(strictN) >= ANCHOR_RANK:
        basis = f"strict-{cfg_ng}gpu"
        comps = strictN
        a = anchor_rank(len(strictN))
        anchor_per_gpu = strictN[a - 1]["per_gpu"]
        c = ceiling_rank(len(strictN))
        if c > a:
            ceil_per_gpu = strictN[c - 1]["per_gpu"]
        if a > ANCHOR_RANK:
            reasons.append(f"deep market ({len(strictN)} comps) -> P{int(ANCHOR_PCTL*100)} anchor rank {a}")
    elif len(pergpu) >= ANCHOR_RANK:
        basis = "per-gpu-normalized"
        comps = pergpu
        a = anchor_rank(len(pergpu))
        anchor_per_gpu = pergpu[a - 1]["per_gpu"]
        c = ceiling_rank(len(pergpu))
        if c > a:
            ceil_per_gpu = pergpu[c - 1]["per_gpu"]
        reasons.append(f"strict {cfg_ng}-GPU set thin ({len(strictN)}); per-GPU basis over {len(pergpu)} boxes")
        # OUTLIER GUARD on the fallback: a lone mispriced comp must never set our price.
        ref = None
        if strictN:
            s = sorted(x["per_gpu"] for x in strictN)
            ref = s[len(s) // 2]
        else:
            s = sorted(x["per_gpu"] for x in pergpu)
            ref = s[len(s) // 2]
        if ref and anchor_per_gpu > OUTLIER_MULT * ref:
            reasons.append(f"OUTLIER GUARD: anchor ${anchor_per_gpu:.2f} > {OUTLIER_MULT}x median "
                           f"${ref:.2f}/GPU -> clamped to median")
            anchor_per_gpu = ref
            if ceil_per_gpu is not None and ceil_per_gpu > OUTLIER_MULT * ref:
                ceil_per_gpu = None
    elif pergpu:
        reasons.append(f"only {len(pergpu)} comp(s) (<{ANCHOR_RANK}); no market to anchor -> hold price")

    # --- rental-state transitions ---
    fill_latency_min = None
    if now_rented is not None:
        was = state.get("last_rented")
        if was is False and now_rented is True:        # idle -> rented: a fill happened
            if idle_since:
                fill_latency_min = (now - idle_since).total_seconds() / 60.0
            if anchor_per_gpu and live_gpu_cost:
                locked_r = round(float(live_gpu_cost) / anchor_per_gpu, 4)
            idle_since = None
            reasons.append(f"FILLED{f' after {fill_latency_min:.0f}m' if fill_latency_min is not None else ''}"
                           f" -> locked_r={locked_r}")
        elif was is True and now_rented is False:      # rented -> idle
            idle_since = now
            locked_r = None
            reasons.append("rental ended -> idle clock started")
        elif now_rented is False and idle_since is None:
            idle_since = now                            # first observation while idle

    # --- band attribution: decay everything, then add this tick's wall time ---
    last_tick = parse_iso(state.get("last_tick"))
    dt = min(TICK_CAP_H, max(0.0, (now - last_tick).total_seconds() / 3600.0)) if last_tick else 0.0
    for b in bands.values():
        b["rented_h"] = round(float(b["rented_h"]) * DECAY_PER_TICK, 4)
        b["idle_h"] = round(float(b["idle_h"]) * DECAY_PER_TICK, 4)
    if dt > 0 and anchor_per_gpu and live_gpu_cost is not None and now_rented is not None:
        if now_rented:
            r_attr = float(locked_r) if locked_r else float(live_gpu_cost) / anchor_per_gpu
            bk = band_key(band_of(r_attr))
            bands[bk]["rented_h"] = round(float(bands[bk]["rented_h"]) + dt, 4)
        else:
            bk = band_key(band_of(float(live_gpu_cost) / anchor_per_gpu))
            bands[bk]["idle_h"] = round(float(bands[bk]["idle_h"]) + dt, 4)

    base_out = {"live_gpu_cost": live_gpu_cost, "now_rented": now_rented,
                "overhead": overhead, "basis": basis, "locked_r": locked_r,
                "idle_since": idle_since.strftime("%Y-%m-%dT%H:%M:%SZ") if idle_since else None,
                "fill_latency_min": fill_latency_min,
                "band_occ": {band_key(i): round(band_occ(bands[band_key(i)]), 3)
                             for i in range(n_bands())}}

    if anchor_per_gpu is None:
        return {**base_out, "apply": False, "reason": "; ".join(reasons) or "no comparable listings; holding",
                "anchor_per_gpu": None, "ceil_per_gpu": None, "chosen_band": None,
                "band_scores": None, "target_per_gpu": None, "target_gpu_cost": None,
                "reasons": reasons}

    # --- band selection -> target price ---
    best_i, scores = select_band(bands)
    target_per_gpu = band_mid(best_i) * anchor_per_gpu
    per_gpu_overhead = overhead / max(1, cfg_ng)
    target_gpu = target_per_gpu - per_gpu_overhead

    upper = ABS_CEILING_GPU
    if ceil_per_gpu is not None:
        upper = min(upper, (ceil_per_gpu - 0.01) - per_gpu_overhead)
    target_gpu = max(floor, min(upper, target_gpu))

    step_cap = max(STEP_MIN, STEP_FRAC * anchor_per_gpu)
    base = live_gpu_cost if live_gpu_cost is not None else state.get("last_applied_gpu_cost")
    if base is not None:
        base = float(base)
        if target_gpu > base + step_cap:
            target_gpu = base + step_cap
            reasons.append(f"step-capped up to +${step_cap:.2f}/GPU")
        elif target_gpu < base - step_cap:
            target_gpu = base - step_cap
            reasons.append(f"step-capped down to -${step_cap:.2f}/GPU")
    target_gpu = round(max(floor, min(ABS_CEILING_GPU, target_gpu)), 2)

    # --- apply gate: material + interval + idle + fresh end_date ---
    last_relist = parse_iso(state.get("last_relist"))
    interval_ok = last_relist is None or (now - last_relist).total_seconds() / 60.0 >= MIN_RELIST_INTERVAL_MIN
    material = base is None or abs(target_gpu - float(base)) > PRICE_TOLERANCE
    idle_to_apply = (now_rented is not True)
    end_ok = True
    ed = listing.get("end_date")
    if ed:
        try:
            end_dt = datetime.strptime(str(ed), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_ok = (end_dt - now).total_seconds() >= END_DATE_MIN_DAYS * 86400
        except ValueError:
            pass
    apply = material and interval_ok and idle_to_apply and end_ok
    if not material:
        reasons.append(f"target ${target_gpu} ~= live ${base}; no change")
    if material and not interval_ok:
        reasons.append(f"relisted <{MIN_RELIST_INTERVAL_MIN}m ago; deferring")
    if material and interval_ok and not idle_to_apply:
        reasons.append("rented now -> hold relist (only affects next renter); target logged")
    if material and not end_ok:
        reasons.append(f"listing end_date {ed} within {END_DATE_MIN_DAYS}d; relist is a human decision")

    return {**base_out, "apply": apply, "reason": "; ".join(reasons) or "nominal",
            "anchor_per_gpu": round(anchor_per_gpu, 3),
            "ceil_per_gpu": round(ceil_per_gpu, 3) if ceil_per_gpu else None,
            "chosen_band": band_key(best_i), "band_scores": scores,
            "target_per_gpu": round(target_per_gpu, 3), "target_gpu_cost": target_gpu,
            "reasons": reasons}


def process_machine(m: dict, machines_raw: dict, comp_cache: dict,
                    fleet_mids: set[int], now: datetime, dry_run: bool) -> None:
    mid = int(m["vast_ai_machine_id"])
    hostname = m.get("hostname", str(mid))
    listing = m.get("listing", {}) or {}
    dyn = listing.get("dynamic", {}) or {}
    tag = f"[{hostname} {mid}]"

    query = dyn.get("comp_query")
    if not query:
        print(f"{tag} no comp_query configured; skipping")
        return
    if query not in comp_cache:
        comp_cache[query] = get_comp_offers(query)

    state = load_state(mid)
    our = machines_raw.get(mid)
    d = compute(state, our, comp_cache[query], listing, dyn, fleet_mids, now)

    print(f"{tag} live=${d['live_gpu_cost']}/GPU rented={d['now_rented']} basis={d.get('basis')} "
          f"anchor=${d.get('anchor_per_gpu')}/GPU ceil=${d.get('ceil_per_gpu')}/GPU")
    print(f"{tag} band_occ={d['band_occ']}")
    print(f"{tag} scores={d.get('band_scores')} chosen={d.get('chosen_band')} "
          f"-> target=${d.get('target_gpu_cost')}/GPU apply={d['apply']}")
    print(f"{tag} reason: {d['reason']}")

    record = {"ts": utc_iso(), "machine_id": mid, **{k: d.get(k) for k in (
        "live_gpu_cost", "now_rented", "overhead", "basis", "anchor_per_gpu", "ceil_per_gpu",
        "chosen_band", "band_scores", "band_occ", "locked_r", "target_per_gpu",
        "target_gpu_cost", "fill_latency_min", "apply", "reason")}}

    if dry_run:
        print(f"{tag} [DRY-RUN] no price change, no state/log write.")
        return

    applied = False
    if d["apply"] and d["target_gpu_cost"] is not None:
        ok, msg = apply_listing(mid, d["target_gpu_cost"], listing)
        applied = ok
        record["applied_ok"] = ok
        record["apply_msg"] = msg
        if ok:
            update_fleet_gpu_cost(hostname, d["target_gpu_cost"])
            state["last_relist"] = utc_iso()
            state["last_applied_gpu_cost"] = d["target_gpu_cost"]
            print(f"{tag} APPLIED: gpu_cost=${d['target_gpu_cost']}/GPU ({msg})")
        else:
            print(f"{tag} APPLY FAILED: {msg}")

    state["schema"] = 3
    state["last_tick"] = utc_iso()
    state["overhead"] = d["overhead"]
    state["idle_since"] = d["idle_since"]
    state["locked_r"] = d["locked_r"]
    if d["now_rented"] is not None:
        state["last_rented"] = d["now_rented"]
    save_state(mid, state)
    log_decision(mid, record)
    print(f"{tag} state + decision logged (applied={applied}).")


def main() -> int:
    ap = argparse.ArgumentParser(description="Adaptive vast.ai repricer for the Sartor fleet (band model)")
    ap.add_argument("--dry-run", action="store_true", help="Compute + print; change nothing.")
    ap.add_argument("--machine", type=int, default=None, help="Only process this machine_id.")
    args = ap.parse_args()

    now = now_dt()
    today = now.strftime("%Y-%m-%d")
    machines = load_fleet()
    fleet_mids = {int(m["vast_ai_machine_id"]) for m in machines if m.get("vast_ai_machine_id")}

    targets = []
    for m in machines:
        dyn = (m.get("listing") or {}).get("dynamic") or {}
        mid = m.get("vast_ai_machine_id")
        if not dyn.get("enabled") or not mid or m.get("status") != "active":
            continue
        if args.machine and int(mid) != args.machine:
            continue
        sd = dyn.get("start_date")
        if sd and str(sd) > today:
            print(f"[{m.get('hostname')} {mid}] dynamic pricing starts {sd}; skipping")
            continue
        targets.append(m)

    if not targets:
        print("no dynamic machines to process")
        return 0

    machines_raw = get_machines()
    comp_cache: dict[str, list | None] = {}
    rc = 0
    for m in targets:
        try:
            process_machine(m, machines_raw, comp_cache, fleet_mids, now, args.dry_run)
        except Exception as e:
            print(f"[{m.get('hostname')}] ERROR {type(e).__name__}: {e}", file=sys.stderr)
            rc = 1
    return rc


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
