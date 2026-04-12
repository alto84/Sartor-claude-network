"""Tests for the conversation extractor (EX-7).

Covers the 12 acceptance cases from the task brief plus a handful of
regression cases for the regex families.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from sartor import conversation_extract as CE


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_turn(text: str, session_id: str = "test-sess", ts: str = "2026-04-11T00:00:00Z") -> CE.UserTurn:
    return CE.UserTurn(
        session_id=session_id,
        turn_id="turn-1",
        timestamp=ts,
        text=text,
        prior_context="",
        source_file=Path("test.jsonl"),
    )


def write_jsonl(path: Path, user_texts: list[str], ts_base: datetime) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    for i, text in enumerate(user_texts):
        ts = (ts_base + timedelta(minutes=i)).isoformat()
        lines.append(json.dumps({
            "type": "user",
            "uuid": f"u{i}",
            "timestamp": ts,
            "message": {"role": "user", "content": [{"type": "text", "text": text}]},
        }))
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def pad_to_min(path: Path) -> None:
    """Pad a small jsonl so it passes the 10KB filter."""
    while path.stat().st_size < CE.MIN_FILE_SIZE + 512:
        filler = json.dumps({
            "type": "assistant",
            "message": {"content": [{"type": "text", "text": "padding " * 100}]},
        })
        with path.open("a", encoding="utf-8") as f:
            f.write("\n" + filler)


# ---------------------------------------------------------------------------
# Extraction unit tests — LOST-catalog recovery
# ---------------------------------------------------------------------------


def test_extracts_035_price_hike():
    turn = make_turn(
        "Of note, I am increasing the rental price to 0.35 per hour and see how that rents"
    )
    cands = CE.extract_candidates(turn)
    hits = [c for c in cands if c.subclass == "rental_price"]
    assert hits, f"expected rental_price candidate, got {[c.subclass for c in cands]}"
    assert "0.35" in hits[0].suggested_value


def test_extracts_loki_lymphoma():
    turn = make_turn(
        "I need to order Loki (my cat with small cell lymphoma!) his chemo. I think I got it through chewy"
    )
    cands = CE.extract_candidates(turn)
    health = [c for c in cands if c.subclass == "health"]
    assert health, f"expected health candidate, got {[c.subclass for c in cands]}"
    # Loki should be recognized as entity (via diagnosis nearest-name OR via entity trigger)
    all_entities = " ".join(c.entity.lower() for c in cands)
    all_targets = " ".join(c.suggested_target for c in cands)
    assert "loki" in all_entities or "family.md" in all_targets.lower()


def test_extracts_verizon_wifi_password():
    turn = make_turn(
        "Can you take a look at my keep https://keep.google.com/u/0/ and scrape data? "
        "Some is very old/outdated. Verizon Wifi: cutler9-nor-cot"
    )
    cands = CE.extract_candidates(turn)
    wifi = [c for c in cands if c.subclass == "wifi_password"]
    assert wifi, f"expected wifi_password, got {[c.subclass for c in cands]}"
    assert wifi[0].suggested_value == "cutler9-nor-cot"


def test_extracts_coefficient_bio_acquisition():
    turn = make_turn("Anthropic Buys Stealth Dimension-Backed Coefficient Bio in $400M+ Stock Deal.")
    cands = CE.extract_candidates(turn)
    # Either the acquisition family or the entity trigger
    subs = [c.subclass for c in cands]
    assert any("acquisition" in s or "entity_coefficient" in s for s in subs), f"got {subs}"


def test_extracts_parking_ticket_task_batch():
    turn = make_turn(
        "Notes for the day. These are the tasks: Pay parking ticket, pay MKA tuition, pay for summer camp."
    )
    cands = CE.extract_candidates(turn)
    imp = [c for c in cands if c.subclass == "task_batch"]
    assert imp, f"expected task_batch, got {[c.subclass for c in cands]}"
    assert imp[0].suggested_target == "family/active-todos.md"


# ---------------------------------------------------------------------------
# Feedback classifier
# ---------------------------------------------------------------------------


def test_classify_from_now_on_as_rule():
    turn = make_turn("from now on please push to git only from Rocinante")
    cands = CE.extract_candidates(turn)
    assert any(c.category == "feedback_rule" for c in cands)


def test_classify_permission_grant():
    turn = make_turn(
        "You have full permission to go back and look at my previous tax years. "
        "Just do it on your own, you have permission, period."
    )
    cands = CE.extract_candidates(turn)
    assert any(c.category == "feedback_permission" for c in cands), \
        f"got {[c.category for c in cands]}"


def test_classify_ambient_preference():
    turn = make_turn("I do tend to prefer to stay inside the entropic ecosystem.")
    cands = CE.extract_candidates(turn)
    assert any(c.category == "feedback_preference" for c in cands), \
        f"got {[c.category for c in cands]}"


# ---------------------------------------------------------------------------
# Dedup logic
# ---------------------------------------------------------------------------


def test_dedup_already_landed(tmp_path: Path):
    """A fact whose key phrase already appears in a canonical hub → already_landed."""
    mem = tmp_path / "memory"
    mem.mkdir()
    (mem / "FAMILY.md").write_text(
        "# Family\n\nLoki is a cat with small cell lymphoma, on chemo.\n",
        encoding="utf-8",
    )
    turn = make_turn("Reminder: Loki has small cell lymphoma.")
    cands = CE.extract_candidates(turn)
    health = [c for c in cands if c.subclass == "health"]
    assert health
    # Target the test memory dir
    health[0].suggested_target = "FAMILY.md"
    status = CE.check_dedup(health[0], memory_root=mem)
    assert status == "already_landed", f"got {status}"


def test_dedup_partial_update_proposed(tmp_path: Path):
    """A fact that appears only in daily/ → partial_update_proposed."""
    mem = tmp_path / "memory"
    (mem / "daily").mkdir(parents=True)
    (mem / "daily" / "2026-04-10.md").write_text(
        "Discussed Miguel yard help visit this weekend.\n", encoding="utf-8"
    )
    (mem / "FAMILY.md").write_text("# Family\n\n", encoding="utf-8")
    turn = make_turn("Miguel, my help with the yard, is coming this weekend.")
    cands = CE.extract_candidates(turn)
    # Grab the entity-trigger candidate for Miguel
    miguel = [c for c in cands if "miguel" in (c.match_span or "").lower()]
    assert miguel, f"no miguel candidate, got {[c.match_span for c in cands]}"
    miguel[0].suggested_target = "FAMILY.md"
    status = CE.check_dedup(miguel[0], memory_root=mem)
    assert status == "partial_update_proposed", f"got {status}"


# ---------------------------------------------------------------------------
# Cap + dry-run
# ---------------------------------------------------------------------------


def test_caps_at_N_proposals(tmp_path: Path):
    """Generating 30 candidates with cap=5 yields 5 written, 25 dropped."""
    sess_root = tmp_path / "sessions"
    sess_root.mkdir()
    jsonl = sess_root / "bigsess.jsonl"
    texts = [f"I am increasing the rental price to 0.{i:02d} per hour" for i in range(20, 50)]
    write_jsonl(jsonl, texts, datetime(2026, 4, 11, tzinfo=timezone.utc))
    pad_to_min(jsonl)

    out_root = tmp_path / "proposed"
    mem_root = tmp_path / "memory"
    mem_root.mkdir()

    stats = CE.run(
        since=datetime(2026, 4, 10, tzinfo=timezone.utc),
        cap=5,
        dry_run=False,
        verbose=False,
        session_roots=[sess_root],
        out_root=out_root,
        memory_root=mem_root,
    )
    assert stats.proposals_written == 5, f"got {stats.proposals_written}"
    assert stats.dropped_over_cap >= 1


def test_dry_run_does_not_write(tmp_path: Path):
    sess_root = tmp_path / "sessions"
    sess_root.mkdir()
    jsonl = sess_root / "s.jsonl"
    write_jsonl(
        jsonl,
        [
            "I am increasing the rental price to 0.35 per hour.",
            "Loki has small cell lymphoma and needs chemo.",
            "from now on always push only from Rocinante",
        ],
        datetime(2026, 4, 11, tzinfo=timezone.utc),
    )
    pad_to_min(jsonl)

    out_root = tmp_path / "proposed"
    mem_root = tmp_path / "memory"
    mem_root.mkdir()

    stats = CE.run(
        since=datetime(2026, 4, 10, tzinfo=timezone.utc),
        cap=20,
        dry_run=True,
        session_roots=[sess_root],
        out_root=out_root,
        memory_root=mem_root,
    )
    assert stats.proposals_written > 0
    # No files on disk under out_root
    assert not out_root.exists() or not any(out_root.rglob("*.md"))


# ---------------------------------------------------------------------------
# Extra: session-file size filter and noise filter
# ---------------------------------------------------------------------------


def test_skips_small_jsonls(tmp_path: Path):
    sess_root = tmp_path / "sessions"
    sess_root.mkdir()
    tiny = sess_root / "tiny.jsonl"
    tiny.write_text('{"type":"user","message":{"content":"hi"}}\n', encoding="utf-8")
    assert tiny.stat().st_size < CE.MIN_FILE_SIZE
    found = CE.discover_sessions(datetime(2000, 1, 1, tzinfo=timezone.utc), roots=[sess_root])
    assert tiny not in found


def test_noise_filter_drops_tool_results(tmp_path: Path):
    sess_root = tmp_path / "sessions"
    sess_root.mkdir()
    jsonl = sess_root / "s.jsonl"
    write_jsonl(
        jsonl,
        [
            "<task-notification>\nignore me\n</task-notification>",
            "<command-name>/foo</command-name>",
            "This session is being continued from a previous conversation. blah blah",
            "Real user turn: I am increasing the rental price to 0.35 per hour.",
        ],
        datetime(2026, 4, 11, tzinfo=timezone.utc),
    )
    pad_to_min(jsonl)
    turns = list(CE.iter_user_turns(jsonl))
    assert len(turns) == 1
    assert "rental price" in turns[0].text


def test_save_verb_triggers():
    turn = make_turn(
        "Aneeta's cell is (973) 303-5427. Please save it in our memory system as well."
    )
    cands = CE.extract_candidates(turn)
    assert any(c.category == "save_verb" for c in cands), \
        f"got {[c.category for c in cands]}"


def test_dob_year_capture():
    turn = make_turn("My birthday is 9/20/1984. Please correct the record.")
    cands = CE.extract_candidates(turn)
    dobs = [c for c in cands if c.subclass == "dob"]
    assert dobs, f"got {[c.subclass for c in cands]}"
    assert "1984" in dobs[0].suggested_value
