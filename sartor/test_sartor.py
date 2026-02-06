#!/usr/bin/env python3
"""
Sartor Phase 1 - End-to-End Test Suite

Tests all Phase 1 components: memory search, cost tracker, gateway cron,
task parsing, memory file integrity, config validation, and git status.

Usage:
    python3 test_sartor.py        # Normal verbose output
    python3 test_sartor.py -v     # Extra detail per test
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

SARTOR_DIR = Path(__file__).resolve().parent
REPO_DIR = SARTOR_DIR.parent
MEMORY_DIR = SARTOR_DIR / "memory"
TASKS_DIR = SARTOR_DIR / "tasks"
CONFIG_FILE = SARTOR_DIR / "harness" / "config.yaml"
sys.path.insert(0, str(SARTOR_DIR))


# -- 1. Memory Search --
class TestMemorySearch(unittest.TestCase):
    """Tests for sartor/memory/search.py"""

    @classmethod
    def setUpClass(cls):
        from memory.search import MemorySearch
        cls.searcher = MemorySearch(MEMORY_DIR)

    def test_search_finds_files(self):
        """MemorySearch._collect_files returns .md files from memory/"""
        files = self.searcher._collect_files()
        self.assertGreater(len(files), 0, "Should find at least one .md file")
        for f in files:
            self.assertTrue(f.suffix == ".md", f"Expected .md file, got {f}")

    def test_tax_query_hits_taxes(self):
        """Searching tax terms should return TAXES.md in the top 3"""
        results = self.searcher.search("tax W-2 1099 filing")
        self.assertGreater(len(results), 0, "Should get results for tax query")
        top_files = [Path(r["file"]).stem for r in results[:3]]
        self.assertIn("TAXES", top_files,
                      f"TAXES should be in top 3, got {top_files}")

    def test_machine_query_hits_machines(self):
        """Searching 'gpu server hardware' should return MACHINES.md near top"""
        results = self.searcher.search("gpu server hardware")
        self.assertGreater(len(results), 0)
        top_files = [Path(r["file"]).stem for r in results[:3]]
        self.assertIn("MACHINES", top_files,
                      f"MACHINES should be in top 3, got {top_files}")

    def test_empty_query_returns_empty(self):
        """Empty or whitespace-only query returns no results"""
        self.assertEqual(self.searcher.search(""), [])
        self.assertEqual(self.searcher.search("   "), [])

    def test_missing_directory_returns_empty(self):
        """Search over a nonexistent directory returns empty list"""
        from memory.search import MemorySearch
        bad = MemorySearch("/tmp/nonexistent_sartor_dir_xyz")
        self.assertEqual(bad.search("anything"), [])

    def test_result_structure(self):
        """Each result has the required keys: file, score, snippet, line_number"""
        results = self.searcher.search("project")
        self.assertGreater(len(results), 0)
        for r in results:
            for key in ("file", "score", "snippet", "line_number"):
                self.assertIn(key, r)
            self.assertIsInstance(r["score"], float)
            self.assertGreater(r["score"], 0)

    def test_top_k_limit(self):
        """top_k parameter limits result count"""
        results = self.searcher.search("project", top_k=2)
        self.assertLessEqual(len(results), 2)


# -- 2. Cost Tracker --
class TestCostTracker(unittest.TestCase):
    """Tests for sartor/costs.py"""

    def setUp(self):
        self.tmpfile = tempfile.NamedTemporaryFile(
            suffix=".json", delete=False, prefix="sartor_test_costs_")
        self.tmpfile.close()
        os.unlink(self.tmpfile.name)
        from costs import CostTracker
        self.tracker = CostTracker(path=self.tmpfile.name)

    def tearDown(self):
        if os.path.exists(self.tmpfile.name):
            os.unlink(self.tmpfile.name)

    def test_log_call_haiku_cost(self):
        """Haiku: 1M input + 1M output = $0.25 + $1.25 = $1.50"""
        from costs import _calculate_cost
        self.assertAlmostEqual(_calculate_cost("haiku", 1_000_000, 1_000_000), 1.50, places=4)

    def test_log_call_sonnet_cost(self):
        """Sonnet: 1M input + 1M output = $3.00 + $15.00 = $18.00"""
        from costs import _calculate_cost
        self.assertAlmostEqual(_calculate_cost("sonnet", 1_000_000, 1_000_000), 18.00, places=4)

    def test_log_call_opus_cost(self):
        """Opus: 1M input + 1M output = $15.00 + $75.00 = $90.00"""
        from costs import _calculate_cost
        self.assertAlmostEqual(_calculate_cost("opus", 1_000_000, 1_000_000), 90.00, places=4)

    def test_log_call_small_amounts(self):
        """Small token counts calculated correctly"""
        from costs import _calculate_cost
        self.assertAlmostEqual(_calculate_cost("haiku", 1000, 0), 0.00025, places=6)

    def test_log_call_persists(self):
        """log_call writes to disk and subsequent reads find it"""
        cost = self.tracker.log_call("haiku", 10000, 5000)
        self.assertGreater(cost, 0)
        self.assertAlmostEqual(self.tracker.get_today_total(), cost, places=6)

    def test_daily_limit_enforcement(self):
        """can_spend returns False when over limit"""
        self.tracker.set_daily_limit(0.01)
        self.tracker.log_call("opus", 1_000_000, 1_000_000)
        self.assertFalse(self.tracker.can_spend(0.0))

    def test_can_spend_under_limit(self):
        """can_spend returns True when well under limit"""
        self.tracker.set_daily_limit(100.00)
        self.assertTrue(self.tracker.can_spend(0.01))

    def test_get_summary_structure(self):
        """get_summary returns dict with today, this_week, this_month, limit"""
        summary = self.tracker.get_summary()
        for key in ("today", "this_week", "this_month", "limit"):
            self.assertIn(key, summary)
        self.assertIsInstance(summary["today"], (int, float))

    def test_prune_old_entries(self):
        """Entries older than 30 days are pruned on write"""
        old_ts = (datetime.now() - timedelta(days=35)).isoformat(timespec="seconds")
        self.tracker.log_call("haiku", 1000, 1000, timestamp=old_ts)
        self.tracker.log_call("haiku", 1000, 1000)  # triggers prune
        with open(self.tmpfile.name) as f:
            data = json.load(f)
        for call in data["calls"]:
            age = datetime.now() - datetime.fromisoformat(call["timestamp"])
            self.assertLess(age.days, 31, "Old entry should have been pruned")

    def test_unknown_model_raises(self):
        """Logging an unknown model raises ValueError"""
        with self.assertRaises(ValueError):
            self.tracker.log_call("gpt-4", 1000, 1000)


# -- 3. Gateway Cron --
class TestGatewayCron(unittest.TestCase):
    """Tests for sartor/gateway/gateway_cron.py"""

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(SARTOR_DIR / "gateway"))

    def test_dry_run_exits_cleanly(self):
        """gateway_cron.py --dry-run exits with code 0 or 1 (not crash)"""
        result = subprocess.run(
            [sys.executable, str(SARTOR_DIR / "gateway" / "gateway_cron.py"),
             "--dry-run", "--verbose"],
            capture_output=True, text=True, timeout=30, cwd=str(REPO_DIR))
        self.assertIn(result.returncode, (0, 1),
                      f"Got exit {result.returncode}\nstderr: {result.stderr}")

    def test_parse_tasks_from_active_md(self):
        """gateway_cron.parse_tasks reads ACTIVE.md successfully"""
        from gateway_cron import parse_tasks
        self.assertGreater(len(parse_tasks()), 0, "Should parse at least one task")

    def test_parsed_tasks_have_names(self):
        """Every parsed task has a non-empty name"""
        from gateway_cron import parse_tasks
        for t in parse_tasks():
            self.assertTrue(t.name, "Task name should not be empty")

    def test_load_config_returns_dict(self):
        """load_config returns a dict"""
        from gateway_cron import load_config
        self.assertIsInstance(load_config(), dict)

    def test_budget_check_with_fresh_costs(self):
        """check_budget returns True with default/fresh costs"""
        from gateway_cron import check_budget
        self.assertTrue(check_budget({"daily_limit": 5.00, "spent_today": 0.0}))

    def test_budget_check_over_limit(self):
        """check_budget returns False when spent >= limit"""
        from gateway_cron import check_budget
        self.assertFalse(check_budget({"daily_limit": 5.00, "spent_today": 5.01}))


# -- 4. Task File Format (ACTIVE.md) --
class TestTaskFileFormat(unittest.TestCase):
    """Tests for sartor/tasks/ACTIVE.md structure and content"""

    @classmethod
    def setUpClass(cls):
        cls.path = TASKS_DIR / "ACTIVE.md"
        cls.content = cls.path.read_text(encoding="utf-8")
        cls.lines = cls.content.splitlines()

    def test_file_exists(self):
        """ACTIVE.md exists"""
        self.assertTrue(self.path.is_file())

    def test_valid_markdown_header(self):
        """File starts with a markdown heading"""
        self.assertTrue(self.lines[0].startswith("# "),
                        f"Expected '# ' header, got: {self.lines[0]}")

    def test_task_regex_finds_tasks(self):
        """Regex finds checkbox-style tasks"""
        task_re = re.compile(r"^- \[([ xX])\]\s+\*\*(.+?)\*\*")
        matches = [m for line in self.lines if (m := task_re.match(line))]
        self.assertGreater(len(matches), 3, "Should find at least 4 tasks")

    def test_tags_extracted(self):
        """At least one task has Tags: metadata"""
        tag_re = re.compile(r"^\s+-\s+Tags:\s*(.+)$", re.IGNORECASE)
        tags = [line for line in self.lines if tag_re.match(line)]
        self.assertGreater(len(tags), 0, "Should find at least one Tags: line")

    def test_sections_present(self):
        """ACTIVE.md has ## section headers"""
        sections = [l for l in self.lines if l.startswith("## ")]
        self.assertGreater(len(sections), 0)


# -- 5. Memory File Integrity --
class TestMemoryIntegrity(unittest.TestCase):
    """Tests for memory file existence, headers, and wiki-link integrity"""

    EXPECTED_FILES = [
        "ALTON", "ASTRAZENECA", "BUSINESS", "FAMILY", "LEARNINGS",
        "MACHINES", "MASTERPLAN", "MASTERPLAN-VISIONARY", "PROCEDURES",
        "PROJECTS", "SELF", "TAXES",
    ]

    def test_all_expected_files_exist(self):
        """All expected .md files exist in sartor/memory/"""
        for name in self.EXPECTED_FILES:
            path = MEMORY_DIR / f"{name}.md"
            self.assertTrue(path.is_file(), f"Missing: {path}")

    def test_standard_header_format(self):
        """Each memory file starts with '# Title' on line 1"""
        for name in self.EXPECTED_FILES:
            first = (MEMORY_DIR / f"{name}.md").read_text(encoding="utf-8").splitlines()[0]
            self.assertTrue(first.startswith("# "),
                            f"{name}.md header: {first}")

    def test_files_have_update_line(self):
        """Each file has an update/date indicator in the first 3 lines"""
        date_re = re.compile(r"2026|[Ll]ast updated|[Gg]enerated")
        for name in self.EXPECTED_FILES:
            lines = (MEMORY_DIR / f"{name}.md").read_text(encoding="utf-8").splitlines()
            header = "\n".join(lines[:3])
            self.assertTrue(date_re.search(header),
                            f"{name}.md missing date/update in header")

    def test_wiki_links_point_to_existing_files(self):
        """Every [[Target]] wiki-link resolves to an existing .md file"""
        link_re = re.compile(r"\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]")
        existing = {p.stem.upper() for p in MEMORY_DIR.glob("*.md")}
        broken = []
        for md_file in MEMORY_DIR.glob("*.md"):
            for match in link_re.finditer(md_file.read_text(encoding="utf-8")):
                target = match.group(1).strip().upper()
                if target not in existing:
                    broken.append(f"{md_file.name} -> [[{match.group(1)}]]")
        self.assertEqual(broken, [],
                         "Broken wiki-links:\n" + "\n".join(broken))

    def test_files_are_not_empty(self):
        """No memory file should be empty"""
        for name in self.EXPECTED_FILES:
            size = (MEMORY_DIR / f"{name}.md").stat().st_size
            self.assertGreater(size, 50, f"{name}.md too small ({size} bytes)")


# -- 6. Config File (config.yaml) --
class TestConfig(unittest.TestCase):
    """Tests for sartor/harness/config.yaml"""

    @classmethod
    def setUpClass(cls):
        import yaml
        cls.config = yaml.safe_load(CONFIG_FILE.read_text(encoding="utf-8"))

    def test_yaml_parses(self):
        """config.yaml is valid YAML"""
        self.assertIsInstance(self.config, dict)

    def test_autonomy_tiers_exist(self):
        """All three autonomy tiers are defined and non-empty"""
        autonomy = self.config.get("autonomy", {})
        for tier in ("autonomous", "ask_first", "never"):
            self.assertIn(tier, autonomy, f"Missing tier: {tier}")
            self.assertIsInstance(autonomy[tier], list)
            self.assertGreater(len(autonomy[tier]), 0, f"Tier '{tier}' empty")

    def test_no_overlap_between_tiers(self):
        """No tag appears in more than one autonomy tier"""
        a = self.config.get("autonomy", {})
        sets = [set(a.get(t, [])) for t in ("autonomous", "ask_first", "never")]
        overlaps = (sets[0] & sets[1]) | (sets[0] & sets[2]) | (sets[1] & sets[2])
        self.assertEqual(overlaps, set(), f"Tags in multiple tiers: {overlaps}")

    def test_harness_section_exists(self):
        """config.yaml has a harness section with expected keys"""
        harness = self.config.get("harness", {})
        self.assertIn("check_interval_minutes", harness)
        self.assertIn("tasks_file", harness)


# -- 7. Git Status --
class TestGitStatus(unittest.TestCase):
    """Tests for repo cleanliness and branch"""

    def test_on_main_branch(self):
        """Repo is on the main branch"""
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True, text=True, cwd=str(REPO_DIR), timeout=10)
        self.assertEqual(result.stdout.strip(), "main")

    def test_sartor_core_clean(self):
        """No uncommitted changes to core sartor source files"""
        core_paths = [
            "sartor/costs.py", "sartor/memory/search.py",
            "sartor/gateway/gateway_cron.py", "sartor/gateway/gateway.py",
            "sartor/harness/config.yaml", "sartor/harness/runner.py",
            "sartor/tasks/ACTIVE.md",
        ]
        result = subprocess.run(
            ["git", "status", "--porcelain", "--"] + core_paths,
            capture_output=True, text=True, cwd=str(REPO_DIR), timeout=10)
        lines = [l for l in result.stdout.strip().splitlines() if l]
        self.assertEqual(lines, [],
                         "Uncommitted changes:\n" + "\n".join(lines))


if __name__ == "__main__":
    if len(sys.argv) == 1:
        sys.argv.append("-v")
    unittest.main(verbosity=2)
