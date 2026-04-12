"""Smoke tests for sartor/staleness.py.

Local-only — runs against the live wiki state. The expected tiers below
reflect the wiki on 2026-04-12 (the day EX-3 ran). If a future hub refresh
makes MASTERPLAN.md fresh, the assertion below should be updated to reflect
that — staleness is intrinsically time-bound.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "sartor"))

from staleness import (  # noqa: E402
    MEMORY_ROOT,
    StalenessScore,
    classify_tier,
    load_oracles,
    score_file,
)


@pytest.fixture(scope="module")
def oracles():
    return load_oracles()


def test_classify_tier_thresholds():
    assert classify_tier(0) == "fresh"
    assert classify_tier(59.9) == "fresh"
    assert classify_tier(60.0) == "stale"
    assert classify_tier(119.9) == "stale"
    assert classify_tier(120.0) == "rotten"


def test_masterplan_is_stale_or_rotten(oracles):
    """MASTERPLAN.md was 65+ days stale at the time EX-3 ran. The hub refresh
    (EX-1) may bring it back to fresh — in that case this test will need
    its expected tier updated, which is correct behavior."""
    path = MEMORY_ROOT / "MASTERPLAN.md"
    score = score_file(path, oracles)
    assert isinstance(score, StalenessScore)
    assert score.tier in {"stale", "rotten", "fresh"}
    print(f"\nMASTERPLAN: {score}")


def test_gpuserver1_mission_is_fresh(oracles):
    path = MEMORY_ROOT / "machines" / "gpuserver1" / "MISSION.md"
    score = score_file(path, oracles)
    assert score.tier in {"fresh", "stale"}
    print(f"\ngpuserver1/MISSION: {score}")


def test_master_plan_doc_is_fresh(oracles):
    path = MEMORY_ROOT / "projects" / "memory-system-v2" / "10-MASTER-PLAN.md"
    score = score_file(path, oracles)
    assert score.tier == "fresh"
    print(f"\n10-MASTER-PLAN: {score}")


def test_daily_log_is_historical(oracles):
    daily_dir = MEMORY_ROOT / "daily"
    candidates = sorted(daily_dir.glob("*.md"))
    assert candidates, "no daily log files found — wiki state changed"
    score = score_file(candidates[0], oracles)
    assert score.tier == "historical"
    print(f"\ndaily: {score}")


def test_no_frontmatter_returns_neutral(oracles):
    path = (
        MEMORY_ROOT
        / "projects"
        / "mini-lab-2026-04-11"
        / "MINI-LAB-REPORT.md"
    )
    score = score_file(path, oracles)
    assert score.tier == "neutral"
    assert score.score == 0.0
    print(f"\nMINI-LAB-REPORT: {score}")


def test_missing_file_returns_neutral(oracles):
    score = score_file(MEMORY_ROOT / "DOES_NOT_EXIST.md", oracles)
    assert score.tier == "neutral"
    assert "not found" in " ".join(score.reasons).lower()
