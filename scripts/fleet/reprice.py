#!/usr/bin/env python3
"""
Sartor fleet — adaptive market repricer (revenue-optimizing, not a static peg).

WHAT ALTON ASKED FOR (2026-05-29): "check vast.ai for 2x RTX PRO 6000 systems and
price it like two from the bottom... I'd like a more thoughtful market strategy than
just a set price. the question is what is the optimal price for total revenue."

THE STRATEGY — anchored adaptive pricing:
  total revenue = price x occupancy, integrated over time. Higher price earns more per
  rented-hour but risks idle gaps; lower fills fast but leaves margin behind. We have
  one hard data point: at $0.92-1.10/GPU rtxserver filled in 6-18 MINUTES, twice -> we
  are demonstrably BELOW the revenue-optimal price. The optimum above that is unknown
  (never sampled), so this is explore/exploit, not a formula.

  1. MARKET ANCHOR (Alton's rule): anchor_dph = the 2nd-cheapest comparable listing's
     TOTAL $/hr (what renters actually sort on). Recomputed live each run -> we ride
     high when supply is thin/expensive, drop to stay competitive when it's crowded.
  2. DEMAND FEEDBACK: a persisted multiplier on the anchor. Fills fast -> underpriced
     -> multiplier up (explore higher). Sits idle too long -> overpriced -> multiplier
     down (recapture occupancy). It converges toward the fill-time sweet spot; that
     convergence point IS the empirical revenue optimum for the current market.
  3. BOUNDED & DAMPED: floored at electricity marginal cost, ceilinged just under the
     priciest peer (never the most expensive box) + an absolute cap, step-capped per
     run so a thin 3-listing market can't whipsaw us.
  4. INSTRUMENTED: every decision is logged with full rationale to reprice-log.jsonl ->
     the price/occupancy dataset that lets us fit the real demand curve over weeks.

SCOPE: rtxserver (124192) only — the household's price-discoverable rental. gpuserver1
is on a fixed reserved contract (not dynamically priced). 124192's min_gpus=2 invariant
(single-card thermal pathology) is preserved on every relist.

CONFIG  (committed):   sartor/memory/business/fleet.yaml  (floor / min_gpus / min_bid / end_date)
STATE   (gitignored):  data/financial/solar-inference/reprice-state.json   (multiplier, occupancy)
                       data/financial/solar-inference/reprice-log.jsonl    (decision trail)

Defaults to APPLY (the scheduled task runs it bare); --dry-run computes + prints, writes
nothing and changes no price. PyYAML is the only non-stdlib dependency.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_YAML = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
FIN_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"
STATE_PATH = FIN_DIR / "reprice-state.json"
LOG_PATH = FIN_DIR / "reprice-log.jsonl"

VASTAI_SSH = "alton@gpuserver1"
VASTAI_BIN = "~/.local/bin/vastai"

# --- target machine + comparison set ---
MACHINE_ID = 124192
# Broad query: ALL verified+rentable RTX PRO 6000 WS boxes (any GPU count). We derive
# two comp sets from it: a STRICT 2-GPU set (Alton's literal "2x systems", compared on
# total $/hr) and a per-GPU-normalized set (fallback when the 2-GPU set is too thin —
# it empties often; the strict-2-GPU rentable set was 3 one hour and 0 the next).
COMPARE_QUERY = "gpu_name=RTX_PRO_6000_WS verified=true rentable=true"
MIN_COMP_RELIABILITY = 0.90        # ignore junk listings racing to the bottom
ANCHOR_RANK = 2                    # "two from the bottom": 2nd-cheapest competitor

# --- adaptive controller ---
MULT_START = 1.0
MULT_MIN, MULT_MAX = 0.70, 1.50
FAST_FILL_MIN = 30                 # filled <30 min after going idle -> underpriced
SLOW_FILL_MIN = 6 * 60            # filled >6 h after going idle -> overpriced
FAST_FILL_BUMP = 1.10
SLOW_FILL_CUT = 0.92
IDLE_BACKOFF_H = 12               # idle this long at current price -> back off once
IDLE_BACKOFF_CUT = 0.92

# --- bounds / damping ---
STEP_CAP_GPU = 0.50               # max change to gpu_cost per applied relist ($/GPU)
ABS_CEILING_GPU = 3.00            # absolute per-GPU ceiling, regardless of market
MIN_RELIST_INTERVAL_MIN = 30      # don't relist more often than this
DEFAULT_OVERHEAD = 0.62           # our_dph - gpu_cost*num_gpus (storage/inet baked into search dph)
PRICE_TOLERANCE = 0.02            # only relist if target differs from live by more than this


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


def get_our_machine() -> dict | None:
    data, _ = _ssh_json(f"{VASTAI_BIN} show machines --raw 2>/dev/null")
    if not isinstance(data, dict):
        return None
    for m in data.get("machines", []):
        if m.get("machine_id") == MACHINE_ID:
            return m
    return None


def get_comp_offers() -> list[dict] | None:
    data, _ = _ssh_json(f"{VASTAI_BIN} search offers '{COMPARE_QUERY}' --raw 2>/dev/null")
    if not isinstance(data, list):
        return None
    return data


# --- state ----------------------------------------------------------------------

def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return {"multiplier": MULT_START, "last_rented": None, "idle_since": None,
            "last_relist": None, "last_applied_gpu_cost": None,
            "overhead": DEFAULT_OVERHEAD, "backed_off_streak": False}


def save_state(state: dict) -> None:
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def log_decision(record: dict) -> None:
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(record) + "\n")


# --- fleet.yaml: read rtxserver listing + update its gpu_cost line in place -----

def load_rtx_listing() -> dict:
    fleet = yaml.safe_load(FLEET_YAML.read_text(encoding="utf-8")) or {}
    for m in fleet.get("machines", []):
        if m.get("vast_ai_machine_id") == MACHINE_ID:
            return m.get("listing", {}) or {}
    raise RuntimeError(f"machine {MACHINE_ID} not found in fleet.yaml")


def update_fleet_gpu_cost(new_cost: float) -> bool:
    """Update the gpu_cost line inside the rtxserver block only (stateful walk,
    pattern from check-registry.py:update_last_verified). Preserves all comments."""
    text = FLEET_YAML.read_text(encoding="utf-8")
    out, in_rtx, done = [], False, False
    for line in text.splitlines():
        mh = re.match(r"^\s*-\s*hostname:\s*(\S+)\s*$", line)
        if mh:
            in_rtx = (mh.group(1) == "rtxserver")
        if in_rtx and not done and re.match(r"^\s*gpu_cost:\s*", line):
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


def apply_listing(gpu_cost: float, listing: dict) -> tuple[bool, str]:
    min_gpus = int(listing.get("min_gpus", 2))          # thermal invariant: never < 2 for 124192
    if min_gpus < 2:
        return False, f"REFUSED: min_gpus={min_gpus} < 2 (single-card thermal pathology)"
    storage = listing.get("storage_cost", 0.10)
    end_date = listing.get("end_date", "06/30/2026")
    if "-" in str(end_date):                            # YAML ISO -> vastai MM/DD/YYYY
        y, m, d = str(end_date).split("-")
        end_date = f"{m}/{d}/{y}"
    bid = listing.get("min_bid", 0.85)
    bid = round(min(float(bid), gpu_cost * 0.92), 2)    # interruptible floor must stay <= price
    cmd = (f"{VASTAI_BIN} list machine {MACHINE_ID} -g {gpu_cost:.2f} -b {bid:.2f} "
           f"-s {storage} -m {min_gpus} -e \"{end_date}\"")
    out = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
                          VASTAI_SSH, cmd], capture_output=True, text=True, timeout=45,
                         encoding="utf-8", errors="replace")
    if out.returncode != 0:
        return False, f"vastai list failed: {(out.stderr or out.stdout).strip()[:160]}"
    return True, (out.stdout or "").strip()[:160]


# --- core ------------------------------------------------------------------------

def compute(state: dict, our: dict | None, comps_raw: list[dict] | None,
            listing: dict, now: datetime) -> dict:
    """Pure decision: returns a dict with target, multiplier, reasons, apply flag."""
    floor = float(listing.get("marginal_floor_gpu_cost", 0.11))
    live_gpu_cost = None
    running = None
    if our is not None:
        live_gpu_cost = our.get("listed_gpu_cost")
        running = our.get("current_rentals_running")
    now_rented = (int(running) >= 1) if running is not None else None

    reasons: list[str] = []
    mult = float(state.get("multiplier", MULT_START))
    overhead = float(state.get("overhead", DEFAULT_OVERHEAD))
    idle_since = parse_iso(state.get("idle_since"))
    backed_off = bool(state.get("backed_off_streak", False))

    # --- occupancy feedback (only when we can read rental state) ---
    fill_latency_min = None
    if now_rented is not None:
        was = state.get("last_rented")
        if was is False and now_rented is True:        # idle -> rented: a fill happened
            if idle_since:
                fill_latency_min = (now - idle_since).total_seconds() / 60.0
                if fill_latency_min < FAST_FILL_MIN:
                    mult *= FAST_FILL_BUMP
                    reasons.append(f"fast fill ({fill_latency_min:.0f}m<{FAST_FILL_MIN}) -> mult x{FAST_FILL_BUMP}")
                elif fill_latency_min > SLOW_FILL_MIN:
                    mult *= SLOW_FILL_CUT
                    reasons.append(f"slow fill ({fill_latency_min:.0f}m>{SLOW_FILL_MIN}) -> mult x{SLOW_FILL_CUT}")
                else:
                    reasons.append(f"fill {fill_latency_min:.0f}m in sweet spot -> mult held")
            idle_since = None
            backed_off = False
        elif was is True and now_rented is False:      # rented -> idle: start the clock
            idle_since = now
            backed_off = False
            reasons.append("rental ended -> idle clock started")
        elif now_rented is False and idle_since is not None:
            idle_h = (now - idle_since).total_seconds() / 3600.0
            if idle_h > IDLE_BACKOFF_H and not backed_off:
                mult *= IDLE_BACKOFF_CUT
                backed_off = True
                reasons.append(f"idle {idle_h:.1f}h>{IDLE_BACKOFF_H} -> back off mult x{IDLE_BACKOFF_CUT}")
        elif now_rented is False and idle_since is None:
            idle_since = now                            # first observation while idle
    mult = max(MULT_MIN, min(MULT_MAX, mult))

    # --- calibrate overhead from our own offer if visible (idle) ---
    if comps_raw:
        ours = next((o for o in comps_raw if o.get("machine_id") == MACHINE_ID), None)
        if ours and ours.get("dph_total") and live_gpu_cost:
            ng = ours.get("num_gpus", 2) or 2
            overhead = round(float(ours["dph_total"]) - float(live_gpu_cost) * ng, 4)

    # --- build comp sets (exclude us, reliability-filtered) ---
    pool = []
    if comps_raw:
        for o in comps_raw:
            if o.get("machine_id") == MACHINE_ID:
                continue
            if (o.get("reliability2") or 0) < MIN_COMP_RELIABILITY:
                continue
            ng = int(o.get("num_gpus") or 1)
            dph = o.get("dph_total")
            if not dph:
                continue
            pool.append({"mid": o.get("machine_id"), "dph": float(dph), "ng": ng,
                         "per_gpu": float(dph) / ng, "rel": o.get("reliability2")})

    strict2 = sorted([c for c in pool if c["ng"] == 2], key=lambda c: c["dph"])
    pergpu = sorted(pool, key=lambda c: c["per_gpu"])

    # prefer the strict 2-GPU set (Alton's literal intent) when it has >=2 entries;
    # else fall back to per-GPU-normalized across all RTX PRO 6000 WS boxes.
    basis = None
    anchor_per_gpu = rank3_per_gpu = None
    comps = []
    if len(strict2) >= ANCHOR_RANK:
        basis = "strict-2gpu-total"
        comps = strict2
        # comps are same GPU count -> dph directly comparable; express anchor per-GPU
        anchor_per_gpu = strict2[ANCHOR_RANK - 1]["dph"] / 2.0
        if len(strict2) >= 3:
            rank3_per_gpu = strict2[2]["dph"] / 2.0
    elif len(pergpu) >= ANCHOR_RANK:
        basis = "per-gpu-normalized"
        comps = pergpu
        anchor_per_gpu = pergpu[ANCHOR_RANK - 1]["per_gpu"]
        if len(pergpu) >= 3:
            rank3_per_gpu = pergpu[2]["per_gpu"]
        reasons.append(f"2-GPU set thin ({len(strict2)}); per-GPU basis over {len(pergpu)} boxes")
    elif pergpu:
        basis = "per-gpu-single-comp"
        comps = pergpu
        anchor_per_gpu = pergpu[-1]["per_gpu"]
        reasons.append(f"only {len(pergpu)} comp(s); anchor = priciest available per-GPU")

    if anchor_per_gpu is None:
        return {"apply": False, "reason": "no comparable listings; holding price",
                "live_gpu_cost": live_gpu_cost, "now_rented": now_rented,
                "multiplier": round(mult, 4), "overhead": overhead, "basis": None,
                "idle_since": idle_since.strftime("%Y-%m-%dT%H:%M:%SZ") if idle_since else None,
                "backed_off_streak": backed_off, "comps": [], "anchor_per_gpu": None,
                "target_gpu_cost": None, "fill_latency_min": fill_latency_min, "reasons": reasons}

    # --- target: anchor (per-GPU, renter currency) x multiplier, then -> our gpu_cost ---
    # renter pays per GPU = our_gpu_cost + overhead/2; match anchor_per_gpu * mult.
    target_per_gpu = anchor_per_gpu * mult
    per_gpu_overhead = overhead / 2.0
    target_gpu = target_per_gpu - per_gpu_overhead

    # bounds: floor (electricity) .. min(abs ceiling, just under the rank-3 peer)
    upper = ABS_CEILING_GPU
    if rank3_per_gpu is not None:
        upper = min(upper, (rank3_per_gpu - 0.01) - per_gpu_overhead)
    target_gpu = max(floor, min(upper, target_gpu))

    # step cap vs the live price
    base = live_gpu_cost if live_gpu_cost is not None else state.get("last_applied_gpu_cost")
    if base is not None:
        base = float(base)
        if target_gpu > base + STEP_CAP_GPU:
            target_gpu = base + STEP_CAP_GPU
            reasons.append(f"step-capped up to +${STEP_CAP_GPU}/GPU")
        elif target_gpu < base - STEP_CAP_GPU:
            target_gpu = base - STEP_CAP_GPU
            reasons.append(f"step-capped down to -${STEP_CAP_GPU}/GPU")
    target_gpu = round(max(floor, min(ABS_CEILING_GPU, target_gpu)), 2)

    # apply gate: material change + min relist interval
    last_relist = parse_iso(state.get("last_relist"))
    interval_ok = last_relist is None or (now - last_relist).total_seconds() / 60.0 >= MIN_RELIST_INTERVAL_MIN
    material = base is None or abs(target_gpu - float(base)) > PRICE_TOLERANCE
    apply = material and interval_ok
    if not material:
        reasons.append(f"target ${target_gpu} ~= live ${base}; no change")
    if material and not interval_ok:
        reasons.append(f"relisted <{MIN_RELIST_INTERVAL_MIN}m ago; deferring")

    return {"apply": apply, "reason": "; ".join(reasons) or "nominal",
            "live_gpu_cost": live_gpu_cost, "now_rented": now_rented,
            "multiplier": round(mult, 4), "overhead": overhead, "basis": basis,
            "idle_since": idle_since.strftime("%Y-%m-%dT%H:%M:%SZ") if idle_since else None,
            "backed_off_streak": backed_off,
            "comps": comps, "anchor_per_gpu": round(anchor_per_gpu, 3),
            "rank3_per_gpu": round(rank3_per_gpu, 3) if rank3_per_gpu else None,
            "target_per_gpu": round(target_per_gpu, 3), "target_gpu_cost": target_gpu,
            "fill_latency_min": fill_latency_min, "reasons": reasons}


def main() -> int:
    ap = argparse.ArgumentParser(description="Adaptive vast.ai repricer for rtxserver (124192)")
    ap.add_argument("--dry-run", action="store_true", help="Compute + print; change nothing.")
    args = ap.parse_args()

    now = now_dt()
    listing = load_rtx_listing()
    state = load_state()
    our = get_our_machine()
    comps_raw = get_comp_offers()

    d = compute(state, our, comps_raw, listing, now)

    print(f"live=${d['live_gpu_cost']}/GPU rented={d['now_rented']} mult={d['multiplier']} "
          f"overhead=${d['overhead']} basis={d.get('basis')}")
    if d.get("comps"):
        print("comps (sorted): " + ", ".join(
            f"${c['per_gpu']:.2f}/GPU({c['ng']}x m{c['mid']})" for c in d["comps"]))
    print(f"anchor=${d.get('anchor_per_gpu')}/GPU rank3=${d.get('rank3_per_gpu')}/GPU "
          f"-> target=${d.get('target_gpu_cost')}/GPU  apply={d['apply']}")
    print(f"reason: {d['reason']}")

    record = {"ts": utc_iso(), **{k: d.get(k) for k in (
        "live_gpu_cost", "now_rented", "multiplier", "overhead", "basis", "anchor_per_gpu",
        "rank3_per_gpu", "target_per_gpu", "target_gpu_cost", "fill_latency_min", "apply", "reason")}}

    if args.dry_run:
        print("\n[DRY-RUN] no price change, no state/log write.")
        print("would-log:", json.dumps(record))
        return 0

    applied = False
    if d["apply"] and d["target_gpu_cost"] is not None:
        ok, msg = apply_listing(d["target_gpu_cost"], listing)
        applied = ok
        record["applied_ok"] = ok
        record["apply_msg"] = msg
        if ok:
            update_fleet_gpu_cost(d["target_gpu_cost"])
            state["last_relist"] = utc_iso()
            state["last_applied_gpu_cost"] = d["target_gpu_cost"]
            print(f"APPLIED: set gpu_cost=${d['target_gpu_cost']}/GPU ({msg})")
        else:
            print(f"APPLY FAILED: {msg}")

    # persist controller state
    state["multiplier"] = d["multiplier"]
    state["overhead"] = d["overhead"]
    state["idle_since"] = d["idle_since"]
    state["backed_off_streak"] = d["backed_off_streak"]
    if d["now_rented"] is not None:
        state["last_rented"] = d["now_rented"]
    save_state(state)
    log_decision(record)
    print(f"state + decision logged (applied={applied}).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
