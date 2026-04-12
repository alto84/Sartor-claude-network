"""Smoke test for sartor/curator_pass.py.

Builds an isolated temp inbox with three fake entries (routine / event / urgent),
runs the curator pass in dry-run mode (verifies routing decisions without
side-effects), then runs in real mode and asserts every drained entry produced:
  - a stub or appended block at the destination
  - a receipt file under inbox/{machine}/.receipts/{date}/
  - a drained file under inbox/.drained/{date}/{machine}/
  - a JSONL line in the curator log

Conflicts and prioritization are also exercised against the same fixture.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "sartor"))

import curator_pass  # noqa: E402
from curator_pass import (  # noqa: E402
    InboxEntry,
    detect_conflicts,
    parse_entry,
    prioritize,
    resolve_destination,
    run_pass,
)


# ---------------------------------------------------------------------------
# Fixture builder
# ---------------------------------------------------------------------------


def _write_entry(path: Path, frontmatter: dict, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fm_lines = ["---"]
    for k, v in frontmatter.items():
        fm_lines.append(f"{k}: {v}")
    fm_lines.append("---")
    fm_lines.append("")
    fm_lines.append(body)
    path.write_text("\n".join(fm_lines), encoding="utf-8")


@pytest.fixture
def fake_inbox(tmp_path, monkeypatch):
    """Create a 3-entry inbox + isolated memory root, return its INBOX_ROOT."""
    memory_root = tmp_path / "sartor" / "memory"
    inbox_root = memory_root / "inbox"
    meta_dir = memory_root / ".meta"
    inbox_root.mkdir(parents=True)
    meta_dir.mkdir(parents=True)

    monkeypatch.setattr(curator_pass, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(curator_pass, "MEMORY_ROOT", memory_root)
    monkeypatch.setattr(curator_pass, "INBOX_ROOT", inbox_root)
    monkeypatch.setattr(curator_pass, "META_DIR", meta_dir)
    monkeypatch.setattr(curator_pass, "CURATOR_LOG", meta_dir / "curator-log.jsonl")

    routine = inbox_root / "gpuserver1" / "2026-04-12T10-00-00Z-monitoring.md"
    _write_entry(
        routine,
        {
            "id": "gpuserver1-2026-04-12T10-00-00Z-monitoring",
            "origin": "gpuserver1",
            "author": "monitoring-cron",
            "created": "2026-04-12T10:00:00Z",
            "target": "MACHINES.md",
            "operation": "report",
            "type": "routine",
            "priority": "p3",
            "entity": "gpuserver1-monitoring-window",
        },
        "Routine monitoring sweep complete. GPU temp 64C, listing active.",
    )

    event = inbox_root / "gpuserver1" / "2026-04-12T11-30-00Z-pricing-update.md"
    _write_entry(
        event,
        {
            "id": "gpuserver1-2026-04-12T11-30-00Z-pricing-update",
            "origin": "gpuserver1",
            "author": "pricing-cron",
            "created": "2026-04-12T11:30:00Z",
            "target": "BUSINESS.md",
            "operation": "append",
            "type": "event",
            "priority": "p2",
            "entity": "vastai-pricing-2026-04-12",
        },
        "Vast.ai market price for RTX 5090 dropped 4 percent overnight.",
    )

    urgent = inbox_root / "gpuserver1" / "2026-04-12T12-00-00Z-rental-down.md"
    _write_entry(
        urgent,
        {
            "id": "gpuserver1-2026-04-12T12-00-00Z-rental-down",
            "origin": "gpuserver1",
            "author": "vastai-tend",
            "created": "2026-04-12T12:00:00Z",
            "target": "MACHINES.md",
            "operation": "append",
            "type": "event",
            "priority": "p1",
            "severity": "high",
            "entity": "gpuserver1-rental-incident",
            "escalate": "true",
        },
        "Machine 52271 went offline. Rental dropped at 11:58 UTC.",
    )

    return inbox_root


# ---------------------------------------------------------------------------
# Unit-level checks
# ---------------------------------------------------------------------------


def test_three_case_classification(fake_inbox):
    entries = sorted(
        (e for e in [
            parse_entry(p, "gpuserver1") for p in (fake_inbox / "gpuserver1").glob("*.md")
        ] if e is not None),
        key=lambda e: e.entry_id,
    )
    classifications = {e.entry_id.split("-")[-1]: e.classify() for e in entries}
    assert "monitoring" in classifications
    assert "update" in classifications
    assert "down" in classifications
    assert classifications["monitoring"] == "routine"
    assert classifications["update"] == "event"
    assert classifications["down"] == "urgent"


def test_resolve_destination_routes_to_memory_hub(fake_inbox):
    e = parse_entry(
        next((fake_inbox / "gpuserver1").glob("*monitoring*.md")),
        "gpuserver1",
    )
    dest = resolve_destination(e)
    assert dest.name == "MACHINES.md"
    assert "memory" in dest.as_posix()


def test_prioritize_urgent_first(fake_inbox):
    parsed = [
        parse_entry(p, "gpuserver1")
        for p in (fake_inbox / "gpuserver1").glob("*.md")
    ]
    parsed = [e for e in parsed if e is not None]
    ordered = prioritize(parsed, max_drain=10)
    assert ordered[0].classify() == "urgent"
    classes = [e.classify() for e in ordered]
    assert classes.index("urgent") < classes.index("event") < classes.index("routine")


def test_no_conflict_when_single_machine(fake_inbox):
    parsed = [
        parse_entry(p, "gpuserver1")
        for p in (fake_inbox / "gpuserver1").glob("*.md")
    ]
    clean, conflicts = detect_conflicts([e for e in parsed if e is not None])
    assert conflicts == []
    assert len(clean) == 3


def test_conflict_detected_across_machines(fake_inbox):
    rocinante_entry = fake_inbox / "rocinante" / "2026-04-12T12-05-00Z-rental-counter.md"
    _write_entry(
        rocinante_entry,
        {
            "id": "rocinante-2026-04-12T12-05-00Z-rental-counter",
            "origin": "rocinante",
            "author": "diagnostic",
            "created": "2026-04-12T12:05:00Z",
            "target": "MACHINES.md",
            "operation": "append",
            "type": "event",
            "priority": "p1",
            "entity": "gpuserver1-rental-incident",
        },
        "Rocinante observed: machine 52271 reachable from LAN; conflict with gpuserver1 report.",
    )

    parsed = []
    for machine in ("gpuserver1", "rocinante"):
        for p in (fake_inbox / machine).glob("*.md"):
            e = parse_entry(p, machine)
            if e is not None:
                parsed.append(e)
    clean, conflicts = detect_conflicts(parsed)
    assert len(conflicts) == 1
    assert conflicts[0]["entity"] == "gpuserver1-rental-incident"
    # 4 entries total - 2 conflicting (the rental-incident pair) = 2 clean
    assert len(clean) == 2
    clean_ids = {e.entry_id for e in clean}
    assert "gpuserver1-2026-04-12T12-00-00Z-rental-down" not in clean_ids


# ---------------------------------------------------------------------------
# End-to-end pass — dry run then real
# ---------------------------------------------------------------------------


def test_dry_run_does_not_touch_filesystem(fake_inbox):
    snapshot = sorted(p.relative_to(fake_inbox).as_posix() for p in fake_inbox.rglob("*"))
    stats = run_pass(inbox_root=fake_inbox, dry_run=True, max_drain=100, verbose=False)

    assert stats.num_drained == 3
    assert stats.num_conflicts == 0
    assert stats.num_errors == 0
    classes = {d.classification for d in stats.drained}
    assert classes == {"routine", "event", "urgent"}

    after = sorted(p.relative_to(fake_inbox).as_posix() for p in fake_inbox.rglob("*"))
    assert snapshot == after, "dry-run touched the filesystem"
    assert not curator_pass.CURATOR_LOG.exists(), "dry-run wrote to curator log"


def test_real_pass_drains_writes_receipts_logs(fake_inbox):
    stats = run_pass(inbox_root=fake_inbox, dry_run=False, max_drain=100, verbose=False)

    assert stats.num_drained == 3
    assert stats.num_errors == 0
    assert stats.num_conflicts == 0

    today = datetime.now(timezone.utc).date().isoformat()

    drained_dir = fake_inbox / ".drained" / today / "gpuserver1"
    assert drained_dir.exists(), "no .drained dir created"
    drained_files = list(drained_dir.glob("*.md"))
    assert len(drained_files) == 3, f"expected 3 drained files, found {len(drained_files)}"

    receipts_dir = fake_inbox / "gpuserver1" / ".receipts" / today
    receipts = list(receipts_dir.glob("*.receipt.yml"))
    assert len(receipts) == 3, f"expected 3 receipts, found {len(receipts)}"

    sample = receipts[0].read_text(encoding="utf-8")
    assert "received_by: rocinante-curator" in sample
    assert "status: drained" in sample
    assert "hash:" in sample
    assert "curator_version: '0.1'" in sample or "curator_version: 0.1" in sample

    machines_md = curator_pass.MEMORY_ROOT / "MACHINES.md"
    business_md = curator_pass.MEMORY_ROOT / "BUSINESS.md"
    assert machines_md.exists()
    assert business_md.exists()
    assert "Inbox entry: gpuserver1-2026-04-12T12-00-00Z-rental-down" in machines_md.read_text(encoding="utf-8")

    log_path = curator_pass.CURATOR_LOG
    assert log_path.exists()
    lines = [json.loads(l) for l in log_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    assert len(lines) == 1
    assert lines[0]["num_drained"] == 3
    assert lines[0]["num_conflicts"] == 0
    assert lines[0]["dry_run"] is False


def test_real_pass_with_conflict_does_not_drain_either(fake_inbox):
    rocinante_entry = fake_inbox / "rocinante" / "2026-04-12T12-05-00Z-rental-counter.md"
    _write_entry(
        rocinante_entry,
        {
            "id": "rocinante-2026-04-12T12-05-00Z-rental-counter",
            "origin": "rocinante",
            "author": "diagnostic",
            "created": "2026-04-12T12:05:00Z",
            "target": "MACHINES.md",
            "operation": "append",
            "type": "event",
            "priority": "p1",
            "entity": "gpuserver1-rental-incident",
        },
        "Rocinante observed: conflict with gpuserver1 report.",
    )

    stats = run_pass(inbox_root=fake_inbox, dry_run=False, max_drain=100, verbose=False)

    assert stats.num_conflicts == 1
    today = datetime.now(timezone.utc).date().isoformat()
    conflict_records = list((fake_inbox / ".conflicts").glob(f"{today}_*.md"))
    assert len(conflict_records) == 1
    body = conflict_records[0].read_text(encoding="utf-8")
    assert "gpuserver1-rental-incident" in body
    assert "pending_human_review" in body

    drained = stats.drained
    drained_ids = {d.entry.entry_id for d in drained}
    assert "gpuserver1-2026-04-12T12-00-00Z-rental-down" not in drained_ids
    assert "rocinante-2026-04-12T12-05-00Z-rental-counter" not in drained_ids
