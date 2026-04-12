#!/usr/bin/env python3
"""
Sartor Experiment Scoring -- composite health score for the keep/discard protocol.

Computes a composite health score from four operational data sources:
  - observer_score: fraction of passing observer checks (last run)
  - task_success_rate: ok/(ok+error) from heartbeat-log.csv (last 24h)
  - memory_health: fraction of core memory files at WARM tier or above
  - experiment_log_health: ratio of keep/total in recent experiments

The composite is a weighted average:
  observer 0.30, task_success 0.30, memory 0.25, experiments 0.15

Usage:
    python experiment.py --score       Print current composite health as JSON
    python experiment.py --baseline    Save baseline snapshot to data/experiment-baseline.json
"""

import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

HARNESS_DIR = Path(__file__).resolve().parent
SARTOR_DIR = HARNESS_DIR.parent
REPO_DIR = SARTOR_DIR.parent
DATA_DIR = REPO_DIR / "data"

OBSERVER_LOG = DATA_DIR / "observer-log.jsonl"
HEARTBEAT_LOG = DATA_DIR / "heartbeat-log.csv"
EXPERIMENT_LOG = DATA_DIR / "experiment-log.tsv"
EXPERIMENT_BASELINE = DATA_DIR / "experiment-baseline.json"
DECAY_SCORES_FILE = SARTOR_DIR / "memory" / ".meta" / "decay-scores.json"

# Weights for composite score
WEIGHTS = {
    "observer_score": 0.30,
    "task_success_rate": 0.30,
    "memory_health": 0.25,
    "experiment_log_health": 0.15,
}

# Core memory files used for memory_health
CORE_MEMORY_FILES = [
    "ALTON.md", "FAMILY.md", "BUSINESS.md", "MACHINES.md",
    "PROJECTS.md", "SELF.md", "PROCEDURES.md", "TAXES.md",
]

WARM_THRESHOLD = 0.30  # Decay score >= this counts as WARM or above


def _compute_observer_score() -> float:
    """Fraction of passing observer checks from the last run in observer-log.jsonl.

    Reads the log, finds all entries sharing the latest timestamp prefix (same
    minute), and computes pass/(pass+fail+warn). Returns 1.0 if no data.
    """
    if not OBSERVER_LOG.exists():
        return 1.0

    try:
        text = OBSERVER_LOG.read_text(encoding="utf-8").strip()
    except OSError:
        return 1.0

    if not text:
        return 1.0

    lines = text.splitlines()

    # Parse entries from the tail (most recent)
    entries = []
    for line in lines[-50:]:
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    if not entries:
        return 1.0

    # Find the latest timestamp prefix (group by minute)
    latest_ts = entries[-1].get("timestamp", "")[:16]
    last_run = [e for e in entries if e.get("timestamp", "")[:16] == latest_ts]

    if not last_run:
        return 1.0

    # Handle two formats:
    # Format A: {"check": ..., "status": "pass"|"fail"|"warn", ...}
    # Format B: {"observer": ..., "passed": N, "failed": N, "warnings": N, ...}
    total_checks = 0
    passed_checks = 0

    for entry in last_run:
        if "status" in entry:
            # Format A (individual checks)
            total_checks += 1
            if entry["status"] == "pass":
                passed_checks += 1
        elif "passed" in entry:
            # Format B (aggregated observer entry)
            p = entry.get("passed", 0)
            f = entry.get("failed", 0)
            w = entry.get("warnings", 0)
            total_checks += p + f + w
            passed_checks += p

    if total_checks == 0:
        return 1.0

    return passed_checks / total_checks


def _compute_task_success_rate(hours: int = 24) -> float:
    """Ratio of ok/(ok+error) from heartbeat-log.csv over the last N hours.

    Excludes health-check, idle, and budget-gate entries.
    Counts 'ok' and 'dry-run' as success; 'error' as failure.
    Skips 'warning' status entirely (not a task execution outcome).
    Returns 1.0 if no qualifying rows exist.
    """
    if not HEARTBEAT_LOG.exists():
        return 1.0

    cutoff = datetime.now() - timedelta(hours=hours)
    ok_count = 0
    error_count = 0

    try:
        with open(HEARTBEAT_LOG, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                task = row.get("task_name", "")
                if task in ("health-check", "idle", "budget-gate"):
                    continue

                ts_str = row.get("timestamp", "")
                try:
                    ts = datetime.fromisoformat(ts_str)
                except (ValueError, TypeError):
                    continue

                if ts < cutoff:
                    continue

                status = row.get("status", "").lower()
                if status in ("ok", "dry-run"):
                    ok_count += 1
                elif status == "error":
                    error_count += 1
                # warning and other statuses are not counted
    except OSError:
        return 1.0

    total = ok_count + error_count
    if total == 0:
        return 1.0

    return ok_count / total


def _compute_memory_health() -> float:
    """Fraction of core memory files at WARM tier or above.

    Reads decay-scores.json from sartor/memory/.meta/. Falls back to running
    `python sartor/memory/decay.py --health` if the file is missing.
    Returns 0.5 if data is unavailable.
    """
    scores = None

    # Try reading decay-scores.json directly (faster, no subprocess)
    if DECAY_SCORES_FILE.exists():
        try:
            text = DECAY_SCORES_FILE.read_text(encoding="utf-8")
            scores = json.loads(text)
        except (json.JSONDecodeError, OSError):
            scores = None

    # Fallback: run decay.py --health and parse output
    if scores is None:
        decay_py = SARTOR_DIR / "memory" / "decay.py"
        if decay_py.exists():
            try:
                result = subprocess.run(
                    [sys.executable, str(decay_py), "--refresh"],
                    capture_output=True, text=True, timeout=30,
                    cwd=str(REPO_DIR),
                )
                # Re-read after refresh
                if DECAY_SCORES_FILE.exists():
                    text = DECAY_SCORES_FILE.read_text(encoding="utf-8")
                    scores = json.loads(text)
            except (subprocess.TimeoutExpired, OSError, json.JSONDecodeError):
                pass

    if not scores:
        return 0.5

    core_total = 0
    warm_or_above = 0

    for name in CORE_MEMORY_FILES:
        core_total += 1
        entry = scores.get(name)
        if entry is None:
            continue
        score_val = entry.get("score", 0.0)
        if score_val >= WARM_THRESHOLD:
            warm_or_above += 1

    if core_total == 0:
        return 0.5

    return warm_or_above / core_total


def _compute_experiment_log_health(max_recent: int = 20) -> float:
    """Ratio of 'keep' to total experiments in recent experiment-log.tsv rows.

    Reads up to `max_recent` most recent rows. Only considers rows with a
    verdict/status of keep, discard, or proposal. Returns 1.0 if no data
    (no experiments yet is not a health problem).
    """
    if not EXPERIMENT_LOG.exists():
        return 1.0

    try:
        text = EXPERIMENT_LOG.read_text(encoding="utf-8").strip()
    except OSError:
        return 1.0

    lines = text.splitlines()
    if len(lines) <= 1:
        # Only header row, no experiments yet
        return 1.0

    # Parse TSV header
    header = lines[0].split("\t")

    # Find the status/verdict column
    status_col = None
    for i, col in enumerate(header):
        col_lower = col.strip().lower()
        if col_lower in ("status", "verdict"):
            status_col = i
            break

    if status_col is None:
        return 1.0

    # Read the last max_recent data rows
    data_lines = lines[1:]
    recent = data_lines[-max_recent:]

    keep_count = 0
    total_count = 0

    for line in recent:
        fields = line.split("\t")
        if len(fields) <= status_col:
            continue
        status = fields[status_col].strip().lower()
        if status in ("keep", "discard"):
            total_count += 1
            if status == "keep":
                keep_count += 1
        # 'proposal' and 'pending_validation' are not counted against health

    if total_count == 0:
        return 1.0

    return keep_count / total_count


def compute_health_score() -> dict:
    """Compute composite Sartor health score from all four metrics.

    Returns dict with:
        observer_score: float 0.0-1.0
        task_success_rate: float 0.0-1.0
        memory_health: float 0.0-1.0
        experiment_log_health: float 0.0-1.0
        composite: float 0.0-1.0 (weighted average)
        timestamp: ISO 8601 string
        weights: dict of metric name to weight
    """
    obs = _compute_observer_score()
    tsr = _compute_task_success_rate()
    mh = _compute_memory_health()
    elh = _compute_experiment_log_health()

    composite = (
        WEIGHTS["observer_score"] * obs
        + WEIGHTS["task_success_rate"] * tsr
        + WEIGHTS["memory_health"] * mh
        + WEIGHTS["experiment_log_health"] * elh
    )

    return {
        "observer_score": round(obs, 4),
        "task_success_rate": round(tsr, 4),
        "memory_health": round(mh, 4),
        "experiment_log_health": round(elh, 4),
        "composite": round(composite, 4),
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "weights": WEIGHTS,
    }


def record_baseline() -> dict:
    """Capture a health score snapshot and save to experiment-baseline.json.

    Returns the baseline dict.
    """
    baseline = compute_health_score()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_BASELINE.write_text(
        json.dumps(baseline, indent=2), encoding="utf-8"
    )
    return baseline


def load_baseline() -> Optional[dict]:
    """Load the saved baseline from experiment-baseline.json, or None."""
    if not EXPERIMENT_BASELINE.exists():
        return None
    try:
        return json.loads(EXPERIMENT_BASELINE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def record_result(
    experiment_id: str,
    hypothesis: str,
    files_changed: list[str],
    baseline: Optional[dict] = None,
) -> dict:
    """Capture health score after an experiment, compute delta, append to experiment-log.tsv.

    Args:
        experiment_id: Unique identifier for this experiment (e.g. "2026-04-03-1420")
        hypothesis: What the change was supposed to achieve
        files_changed: List of file paths that were modified

    Returns:
        Dict with baseline, current, delta, verdict, and the TSV row written.
    """
    current = compute_health_score()

    if baseline is None:
        baseline = load_baseline()

    if baseline is None:
        # No baseline available; record with unknown delta
        delta = 0.0
        verdict = "no_baseline"
        metric_before = "unavailable"
    else:
        delta = current["composite"] - baseline["composite"]
        verdict = should_keep(baseline, current)
        metric_before = _format_metric_string(baseline)

    metric_after = _format_metric_string(current)

    # Append to experiment-log.tsv
    _append_experiment_log(
        experiment_id=experiment_id,
        hypothesis=hypothesis,
        metric_before=metric_before if baseline else "unavailable",
        metric_after=metric_after,
        delta=f"{delta:+.4f}",
        verdict="keep" if verdict else "discard",
        files_changed=";".join(files_changed),
        notes=f"composite {baseline['composite'] if baseline else '?'} -> {current['composite']}",
    )

    return {
        "baseline": baseline,
        "current": current,
        "delta": round(delta, 4),
        "verdict": "keep" if verdict else "discard",
    }


def should_keep(
    baseline: dict,
    current: dict,
    threshold: float = 0.0,
) -> bool:
    """Return True if the composite delta >= threshold (no regression).

    Args:
        baseline: Health score dict from before the change
        current: Health score dict from after the change
        threshold: Minimum delta to keep (default 0.0 = no regression)
    """
    delta = current["composite"] - baseline["composite"]
    return delta >= threshold


def _format_metric_string(score: dict) -> str:
    """Format a health score dict as a semicolon-separated metric string.

    Example: "composite=0.85;observer_score=0.86;task_success_rate=0.90;..."
    """
    parts = []
    for key in ("composite", "observer_score", "task_success_rate", "memory_health", "experiment_log_health"):
        val = score.get(key)
        if val is not None:
            parts.append(f"{key}={val}")
    return ";".join(parts)


def _append_experiment_log(
    experiment_id: str,
    hypothesis: str,
    metric_before: str,
    metric_after: str,
    delta: str,
    verdict: str,
    files_changed: str,
    notes: str,
) -> None:
    """Append a row to data/experiment-log.tsv."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Ensure file exists with header
    if not EXPERIMENT_LOG.exists() or EXPERIMENT_LOG.stat().st_size == 0:
        with open(EXPERIMENT_LOG, "w", encoding="utf-8") as f:
            f.write("timestamp\texperiment_id\thypothesis\tmetric_before\tmetric_after\tdelta\tverdict\tfiles_changed\tnotes\n")

    # Sanitize fields: no tabs or newlines in values
    def clean(s: str, max_len: int = 300) -> str:
        return s.replace("\t", " ").replace("\n", " ").replace("\r", "")[:max_len]

    row = "\t".join([
        datetime.now().isoformat(timespec="seconds"),
        clean(experiment_id, 50),
        clean(hypothesis, 200),
        clean(metric_before, 300),
        clean(metric_after, 300),
        clean(delta, 20),
        clean(verdict, 30),
        clean(files_changed, 500),
        clean(notes, 300),
    ])

    with open(EXPERIMENT_LOG, "a", encoding="utf-8") as f:
        f.write(row + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Sartor Experiment Scoring -- composite health score for the keep/discard protocol."
    )
    parser.add_argument(
        "--score", action="store_true",
        help="Print current composite health score as JSON",
    )
    parser.add_argument(
        "--baseline", action="store_true",
        help="Save current health score as baseline to data/experiment-baseline.json",
    )
    parser.add_argument(
        "--breakdown", action="store_true",
        help="Print per-metric breakdown in human-readable format",
    )
    args = parser.parse_args()

    # Default to --score if nothing specified
    if not any([args.score, args.baseline, args.breakdown]):
        args.score = True

    if args.baseline:
        baseline = record_baseline()
        print(f"Baseline saved to {EXPERIMENT_BASELINE}")
        print(json.dumps(baseline, indent=2))
        return

    score = compute_health_score()

    if args.breakdown:
        print("SARTOR SYSTEM HEALTH SCORE")
        print("=" * 44)
        print(f"  Observer Score:         {score['observer_score']:.1%}  (weight {WEIGHTS['observer_score']})")
        print(f"  Task Success Rate:      {score['task_success_rate']:.1%}  (weight {WEIGHTS['task_success_rate']})")
        print(f"  Memory Health:          {score['memory_health']:.1%}  (weight {WEIGHTS['memory_health']})")
        print(f"  Experiment Log Health:  {score['experiment_log_health']:.1%}  (weight {WEIGHTS['experiment_log_health']})")
        print(f"  ---")
        print(f"  Composite Score:        {score['composite']:.1%}")
        print(f"  Timestamp:              {score['timestamp']}")

    if args.score:
        print(json.dumps(score, indent=2))


if __name__ == "__main__":
    main()
