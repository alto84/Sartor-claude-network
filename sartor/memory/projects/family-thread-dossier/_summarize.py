"""Read _raw_inventory.tsv, score family relevance, write the dossier."""
import csv
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
ROWS = list(csv.DictReader(open(HERE / "_raw_inventory.tsv", encoding="utf-8"), delimiter="\t"))

# Family-relevance heuristics:
# HIGH: directly about people in the household, kids' schools/activities, holidays,
#       household ops (network, vendors, plumber, heat), shared calendar, todos
# MED:  decisions about Alton/Aneeta personal life that intersect family (taxes, business
#       choices that affect time with family, machines they all use)
# LOW:  infrastructure that family uses indirectly (memory system, rocinante, github)
# NONE: pure technical, research, AI alignment, vastai, AZ work
FAMILY_HIGH_TOKENS = [
    "family", "kid", "vishala", "anaiya", "aneeta", "saxena", "wohelo", "disney",
    "household", "school", "camp", "plumber", "heating", "pediatric", "child",
    "birthday", "anniversary", "calendar", "spouse", "parent", "babysit",
    "photo-book", "nest", "sonos", "wifi", "home-network", "scholar", "tuition",
    "dentist", "doctor",
]
FAMILY_MED_TOKENS = [
    "tax", "insurance", "401k", "ira", "rental", "estate", "trust", "will",
    "alton", "personal", "appointment", "todo", "calendar", "bill", "vendor",
    "house", "85 stonebridge", "stonebridge", "berman", "unifi",
]
LOW_TOKENS = [
    "machine", "gpu", "rocinante", "rtxserver", "rtxpro6000", "gpuserver1",
    "cron", "memory-system", "curator", "extractor", "skill", "scheduled",
    "agent", "delegation", "operating-agreement", "constitution", "feedback_",
    "inbox", "reference_", "snapshot", "indexes", "log.md", "session",
]
NONE_TOKENS = [
    "ccp", "alignment", "constitution-council", "pharmacovigilance",
    "safety-knowledge", "az-career", "astrazeneca", "vastai", "research",
    "experiment", "fine-tune", "training", "lora", "qwen", "blackwell",
    "llm-wiki", "abliterated", "obsidian-control",
]

def score(r):
    p = r["path"].replace("\\", "/").lower()
    name = r["fm_name"].lower()
    desc = r["fm_desc"].lower()
    head = r["heading"].lower()
    blob = f"{p} {name} {desc} {head}"

    # Hard rules first
    if p.startswith("ccp-") or "/ccp-alignment/" in p or "constitution-council" in p:
        return "none"
    if "/pharmacovigilance/" in p or "safety-knowledge-graph" in p:
        return "none"
    if p.startswith("research/") and "family" not in blob:
        return "none"
    if "/inbox/" in p:
        return "low"  # most inbox is processing artifacts
    if "/daily/" in p:
        return "low"  # session logs, may mention family but not family docs
    if "/snapshots/" in p:
        # calendar/gmail snapshots are family-relevant pointers
        if "calendar" in p or "gmail" in p or "life-timeline" in p:
            return "med"
        return "low"

    # Token scoring
    high_hits = sum(1 for t in FAMILY_HIGH_TOKENS if t in blob)
    med_hits = sum(1 for t in FAMILY_MED_TOKENS if t in blob)
    none_hits = sum(1 for t in NONE_TOKENS if t in blob)

    if high_hits >= 2 or (high_hits and "family" in p):
        return "high"
    if high_hits >= 1 and none_hits == 0:
        return "high"
    if med_hits >= 2 and none_hits == 0:
        return "med"
    if med_hits >= 1:
        return "med"
    if none_hits >= 1:
        return "none"
    return "low"

# Apply scoring
for r in ROWS:
    r["fam"] = score(r)

# Sort: family-rel desc, then size desc
RANK = {"high": 3, "med": 2, "low": 1, "none": 0}
ROWS.sort(key=lambda r: (-RANK[r["fam"]], -int(r["lines"]), r["path"]))

# ----- Write dossier markdown -----
out = HERE / "memory-cartography.md"

today = date.today().isoformat()
total = len(ROWS)
by_fam = Counter(r["fam"] for r in ROWS)
by_top = Counter()
by_fam_top = defaultdict(Counter)
stale_count = sum(1 for r in ROWS if r["stale"] == "Y")
bloat_count = sum(1 for r in ROWS if r["bloat"] == "Y")
total_size = sum(int(r["size"]) for r in ROWS)
total_lines = sum(int(r["lines"]) for r in ROWS)

for r in ROWS:
    p = r["path"].replace("\\", "/")
    top = p.split("/", 1)[0] if "/" in p else "(root)"
    by_top[top] += 1
    by_fam_top[r["fam"]][top] += 1

def md_table_row(r):
    p = r["path"].replace("\\", "/")
    purpose = r["fm_desc"] or r["heading"] or r["fm_name"] or ""
    purpose = purpose.replace("|", "/")[:120]
    flags = []
    if r["stale"] == "Y":
        flags.append("stale")
    if r["bloat"] == "Y":
        flags.append("bloat")
    flags_str = ",".join(flags)
    return f"| `{p}` | {r['lines']} | {r['mtime']} | {r['fam']} | {flags_str} | {purpose} |"

with open(out, "w", encoding="utf-8") as f:
    f.write(f"""---
name: memory-cartography
description: Inventory of every memory file outside family/, scored by family-relevance, with stale and bloat flags. Built by memory-cartographer agent for the family-thread long-running session.
type: project
status: active
created: {today}
updated: {today}
---

# Memory Cartography (everything outside `family/`)

> Inventory-only; no edits made. Scope is the memory tree at `C:\\Users\\alto8\\.claude\\projects\\C--Users-alto8\\memory\\` excluding `family/`. Companion to the `family-curator` agent which owns `family/`.

## Summary numbers

- Total markdown files scanned: **{total}**
- Family-relevance buckets: high={by_fam['high']}, med={by_fam['med']}, low={by_fam['low']}, none={by_fam['none']}
- Stale (mtime > 60d): **{stale_count}**
- Bloat (>500 lines): **{bloat_count}**
- Total size: {total_size/1024:.1f} KB across {total_lines:,} lines

## File counts by top-level directory

| top-level | total | high | med | low | none |
|---|---:|---:|---:|---:|---:|
""")
    for top in sorted(by_top, key=lambda t: -by_top[t]):
        f.write(f"| `{top}` | {by_top[top]} | {by_fam_top['high'][top]} | {by_fam_top['med'][top]} | {by_fam_top['low'][top]} | {by_fam_top['none'][top]} |\n")

    # HIGH section: full table
    f.write("\n\n## HIGH family-relevance files\n\n")
    f.write("Sorted by lines desc within bucket. These are documents `family-curator` and the team lead should know exist.\n\n")
    f.write("| path | lines | updated | rel | flags | purpose |\n|---|---:|---|---|---|---|\n")
    for r in ROWS:
        if r["fam"] == "high":
            f.write(md_table_row(r) + "\n")

    # MED section: full table
    f.write("\n\n## MED family-relevance files\n\n")
    f.write("| path | lines | updated | rel | flags | purpose |\n|---|---:|---|---|---|---|\n")
    for r in ROWS:
        if r["fam"] == "med":
            f.write(md_table_row(r) + "\n")

    # LOW section: bloat or stale only
    f.write("\n\n## LOW family-relevance — only bloat or stale shown\n\n")
    f.write("Most LOW files are routine infra. This table surfaces only the ones that look like cleanup candidates.\n\n")
    f.write("| path | lines | updated | rel | flags | purpose |\n|---|---:|---|---|---|---|\n")
    for r in ROWS:
        if r["fam"] == "low" and (r["stale"] == "Y" or r["bloat"] == "Y"):
            f.write(md_table_row(r) + "\n")

    # LOW dirs summary
    f.write("\n\n## LOW family-relevance — directory roll-up (not enumerated)\n\n")
    low_dirs = Counter()
    for r in ROWS:
        if r["fam"] == "low" and not (r["stale"] == "Y" or r["bloat"] == "Y"):
            p = r["path"].replace("\\", "/")
            d = "/".join(p.split("/")[:2]) if "/" in p else "(root)"
            low_dirs[d] += 1
    f.write("| dir | files |\n|---|---:|\n")
    for d, n in sorted(low_dirs.items(), key=lambda x: -x[1]):
        f.write(f"| `{d}` | {n} |\n")

    # NONE dirs summary only
    f.write("\n\n## NONE family-relevance — directory roll-up (not enumerated)\n\n")
    f.write("Pure technical/research/work artifacts. Listed by directory only; the dossier has the full enumeration in `_raw_inventory.tsv`.\n\n")
    none_dirs = Counter()
    for r in ROWS:
        if r["fam"] == "none":
            p = r["path"].replace("\\", "/")
            d = "/".join(p.split("/")[:2]) if "/" in p else "(root)"
            none_dirs[d] += 1
    f.write("| dir | files |\n|---|---:|\n")
    for d, n in sorted(none_dirs.items(), key=lambda x: -x[1]):
        f.write(f"| `{d}` | {n} |\n")

    # Stale ledger
    f.write("\n\n## All stale files (mtime > 60d) at a glance\n\n")
    f.write("| path | lines | updated | rel |\n|---|---:|---|---|\n")
    for r in ROWS:
        if r["stale"] == "Y":
            p = r["path"].replace("\\", "/")
            f.write(f"| `{p}` | {r['lines']} | {r['mtime']} | {r['fam']} |\n")

    # Bloat ledger
    f.write("\n\n## All bloat files (>500 lines)\n\n")
    f.write("| path | lines | updated | rel |\n|---|---:|---|---|\n")
    for r in ROWS:
        if r["bloat"] == "Y":
            p = r["path"].replace("\\", "/")
            f.write(f"| `{p}` | {r['lines']} | {r['mtime']} | {r['fam']} |\n")

    f.write("\n\n## Notes on the inventory\n\n")
    f.write("- `family/` is excluded by directive; teammate `family-curator` owns it.\n")
    f.write("- `inbox/` and `daily/` files are scored LOW unless they bubble up via stale/bloat.\n")
    f.write("- `research/ccp-alignment/` and `research/pharmacovigilance/` are NONE by rule.\n")
    f.write("- Raw TSV at `_raw_inventory.tsv`; rebuild via `python _inventory_scan.py`.\n")

print(f"wrote {out}")
print(f"high={by_fam['high']} med={by_fam['med']} low={by_fam['low']} none={by_fam['none']}")
print(f"stale={stale_count} bloat={bloat_count}")
