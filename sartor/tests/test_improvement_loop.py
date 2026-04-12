"""Tests for sartor/improvement_loop.py.

Uses tmp_path fixtures to avoid touching the real filesystem.
Six tests covering: staleness trend, extraction miss rate, receipt timeouts,
append-only proposals, valid snapshot JSON, and dry-run no-write.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "sartor"))

from improvement_loop import (  # noqa: E402
    Flag,
    LoopResult,
    TierDistribution,
    ExtractionStats,
    ReceiptHealth,
    check_staleness_trend,
    check_extraction_miss_rate,
    check_receipt_timeouts,
    write_proposals,
    write_snapshot,
    run_loop,
    SNAPSHOT_DIR as REAL_SNAPSHOT_DIR,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _write_jsonl(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


def _write_snapshot(snap_dir: Path, date_str: str, tiers: dict) -> None:
    snap_dir.mkdir(parents=True, exist_ok=True)
    snap = {
        "date": date_str,
        "tier_distribution": tiers,
        "extraction": {"candidates_found": 10, "proposals_written": 5, "hit_rate": 0.5},
        "receipt_health": {"total_inbox_entries": 0, "entries_without_receipt": 0},
    }
    (snap_dir / f"{date_str}.json").write_text(json.dumps(snap), encoding="utf-8")


# ---------------------------------------------------------------------------
# Test 1: Staleness trend detection (mock increasing rotten count)
# ---------------------------------------------------------------------------


def test_staleness_trend_flags_rotten_increase(tmp_path):
    """When rotten count goes up vs last snapshot, a flag is raised."""
    snap_dir = tmp_path / "snapshots"
    _write_snapshot(snap_dir, "2026-04-05", {"fresh": 30, "stale": 5, "rotten": 2})

    # Current distribution: rotten went from 2 -> 5
    current_dist = TierDistribution(fresh=28, stale=5, rotten=5, neutral=0, historical=0)

    result = LoopResult()

    with patch("improvement_loop._score_all_hub_files", return_value=current_dist), \
         patch("improvement_loop.SNAPSHOT_DIR", snap_dir):
        check_staleness_trend(result)

    assert len(result.flags) >= 1
    signals = [f.signal for f in result.flags]
    assert "staleness_regression" in signals
    rotten_flag = next(f for f in result.flags if f.signal == "staleness_regression")
    assert rotten_flag.severity == "high"
    assert "2" in rotten_flag.detail and "5" in rotten_flag.detail


# ---------------------------------------------------------------------------
# Test 2: Extraction miss-rate detection (mock declining ratio)
# ---------------------------------------------------------------------------


def test_extraction_miss_rate_flags_decline(tmp_path):
    """When extraction hit rate drops >20% week-over-week, a flag is raised."""
    now = datetime.now(timezone.utc)
    last_week_ts = (now - timedelta(days=10)).isoformat(timespec="seconds")
    this_week_ts = (now - timedelta(days=1)).isoformat(timespec="seconds")

    # Last week: 100 candidates, 50 proposals = 50% rate
    # This week: 100 candidates, 30 proposals = 30% rate (40% drop)
    log_path = tmp_path / "extractor-log.jsonl"
    _write_jsonl(log_path, [
        {"timestamp": last_week_ts, "candidates_found": 100, "proposals_written": 50, "sessions_scanned": 5},
        {"timestamp": this_week_ts, "candidates_found": 100, "proposals_written": 30, "sessions_scanned": 3},
    ])

    curator_log = tmp_path / "curator-log.jsonl"
    curator_log.touch()

    result = LoopResult()

    with patch("improvement_loop.EXTRACTOR_LOG", log_path), \
         patch("improvement_loop.CURATOR_LOG", curator_log):
        check_extraction_miss_rate(result)

    assert result.extraction_stats.candidates_found == 100
    assert result.extraction_stats.proposals_written == 30
    signals = [f.signal for f in result.flags]
    assert "extraction_miss_rate_increase" in signals


# ---------------------------------------------------------------------------
# Test 3: Receipt timeout detection (mock old entries without receipts)
# ---------------------------------------------------------------------------


def test_receipt_timeout_flags_old_entries(tmp_path):
    """Inbox entries older than 48h without receipt produce flags."""
    inbox = tmp_path / "inbox"
    gpu_dir = inbox / "gpuserver1"
    gpu_dir.mkdir(parents=True)

    # Create an entry file with old mtime
    entry = gpu_dir / "old-entry.md"
    entry.write_text("---\nid: old-1\norigin: gpuserver1\ncreated: 2026-04-01\ntarget: MACHINES.md\noperation: append\n---\nSome content\n")

    # Set mtime to 72 hours ago
    import os
    old_time = (datetime.now(timezone.utc) - timedelta(hours=72)).timestamp()
    os.utime(str(entry), (old_time, old_time))

    # No .receipts dir = no receipts

    result = LoopResult()

    with patch("improvement_loop.INBOX_ROOT", inbox):
        check_receipt_timeouts(result)

    assert result.receipt_health.total_inbox_entries == 1
    assert result.receipt_health.entries_without_receipt == 1
    assert len(result.receipt_health.timed_out) == 1
    assert result.receipt_health.timed_out[0]["source_machine"] == "gpuserver1"

    signals = [f.signal for f in result.flags]
    assert "receipt_timeout" in signals


# ---------------------------------------------------------------------------
# Test 4: Proposal write is append-only (existing content preserved)
# ---------------------------------------------------------------------------


def test_proposals_append_only(tmp_path):
    """Existing IMPROVEMENT-QUEUE.md content is preserved when appending."""
    queue_file = tmp_path / "IMPROVEMENT-QUEUE.md"
    original = "# Improvement Queue\n\nExisting content here.\n"
    queue_file.write_text(original, encoding="utf-8")

    result = LoopResult()
    result.flags = [
        Flag(
            signal="test_signal",
            severity="low",
            detail="Test detail.",
            proposed_fix="Test fix.",
            estimated_effort="5min",
        ),
    ]

    with patch("improvement_loop.IMPROVEMENT_QUEUE", queue_file):
        write_proposals(result, dry_run=False)

    content = queue_file.read_text(encoding="utf-8")
    # Original content still present
    assert "Existing content here." in content
    # New proposal appended
    assert "test_signal" in content
    assert "[LOW]" in content


# ---------------------------------------------------------------------------
# Test 5: Snapshot write produces valid JSON
# ---------------------------------------------------------------------------


def test_snapshot_produces_valid_json(tmp_path):
    """write_snapshot produces a valid JSON file with expected keys."""
    snap_dir = tmp_path / "snapshots"

    result = LoopResult()
    result.tier_dist = TierDistribution(fresh=20, stale=5, rotten=3, neutral=10, historical=8)
    result.extraction_stats = ExtractionStats(
        sessions_scanned=5, candidates_found=50, proposals_written=15, hit_rate=0.3,
    )
    result.receipt_health = ReceiptHealth(
        total_inbox_entries=12, entries_without_receipt=2, timed_out=[{"x": 1}, {"x": 2}],
    )
    result.flags = [Flag("sig", "high", "d", "f", "e")]

    with patch("improvement_loop.SNAPSHOT_DIR", snap_dir):
        out_path = write_snapshot(result, dry_run=False)

    assert out_path.exists()
    data = json.loads(out_path.read_text(encoding="utf-8"))

    assert data["tier_distribution"]["fresh"] == 20
    assert data["tier_distribution"]["rotten"] == 3
    assert data["extraction"]["candidates_found"] == 50
    assert data["extraction"]["hit_rate"] == 0.3
    assert data["receipt_health"]["entries_without_receipt"] == 2
    assert data["receipt_health"]["timed_out_count"] == 2
    assert data["flags_count"] == 1
    assert "date" in data
    assert "timestamp" in data


# ---------------------------------------------------------------------------
# Test 6: Dry-run doesn't write
# ---------------------------------------------------------------------------


def test_dry_run_no_writes(tmp_path):
    """In dry-run mode, no files are created or modified."""
    queue_file = tmp_path / "IMPROVEMENT-QUEUE.md"
    snap_dir = tmp_path / "snapshots"
    briefing_dir = tmp_path / "briefing"

    # Create a result with flags to exercise all write paths
    result = LoopResult()
    result.flags = [
        Flag("test", "high", "detail", "fix", "1h"),
    ]
    result.tier_dist = TierDistribution(fresh=10, stale=2, rotten=1)

    with patch("improvement_loop.IMPROVEMENT_QUEUE", queue_file), \
         patch("improvement_loop.SNAPSHOT_DIR", snap_dir), \
         patch("improvement_loop.BRIEFING_DIR", briefing_dir):
        write_proposals(result, dry_run=True)
        write_snapshot(result, dry_run=True)

    # Nothing was written
    assert not queue_file.exists()
    assert not snap_dir.exists()
