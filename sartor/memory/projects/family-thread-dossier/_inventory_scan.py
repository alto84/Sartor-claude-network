"""One-shot inventory scanner for memory-cartographer dossier.

Walks the memory tree (excluding family/), collects per-file metadata
including frontmatter (name, description, type, updated, tags), line count,
mtime, size. Emits TSV to stdout for the cartographer to filter and rank.
"""
import os
import sys
import time
from pathlib import Path

ROOT = Path(r"C:\Users\alto8\.claude\projects\C--Users-alto8\memory")
EXCLUDE_DIRS = {"family", "__pycache__", ".meta", ".git"}

NOW = time.time()
SIXTY_DAYS = 60 * 86400

def parse_frontmatter(text: str) -> dict:
    out = {}
    if not text.startswith("---"):
        return out
    end = text.find("\n---", 3)
    if end == -1:
        return out
    block = text[3:end]
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k = k.strip().lower()
        v = v.strip().strip("'\"")
        if k in {"name", "description", "type", "updated", "created", "tags", "status"}:
            out[k] = v
    return out

def first_heading(text: str) -> str:
    for line in text.splitlines()[:50]:
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return ""

def scan():
    rows = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # filter excluded dirs in-place
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            full = Path(dirpath) / fn
            rel = full.relative_to(ROOT).as_posix()
            try:
                st = full.stat()
                size = st.st_size
                mtime = st.st_mtime
            except OSError:
                continue
            stale = (NOW - mtime) > SIXTY_DAYS
            try:
                # cap read at 16KB for frontmatter + first heading
                with open(full, "rb") as f:
                    raw = f.read(16384)
                # also count lines by full read but cheaply
                with open(full, "r", encoding="utf-8", errors="replace") as f:
                    lc = sum(1 for _ in f)
            except OSError:
                continue
            text = raw.decode("utf-8", errors="replace")
            fm = parse_frontmatter(text)
            heading = first_heading(text)
            mtime_str = time.strftime("%Y-%m-%d", time.localtime(mtime))
            rows.append({
                "path": rel,
                "lines": lc,
                "size": size,
                "mtime": mtime_str,
                "stale": "Y" if stale else "",
                "bloat": "Y" if lc > 500 else "",
                "fm_name": fm.get("name", ""),
                "fm_type": fm.get("type", ""),
                "fm_updated": fm.get("updated", ""),
                "fm_status": fm.get("status", ""),
                "fm_desc": fm.get("description", "")[:140].replace("\t", " ").replace("\n", " "),
                "heading": heading[:120].replace("\t", " "),
            })
    return rows

def main():
    rows = scan()
    cols = ["path","lines","size","mtime","stale","bloat","fm_type","fm_updated","fm_status","fm_name","heading","fm_desc"]
    out_path = Path(__file__).parent / "_raw_inventory.tsv"
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        f.write("\t".join(cols) + "\n")
        for r in rows:
            f.write("\t".join(str(r[c]) for c in cols) + "\n")
    print(f"wrote {len(rows)} rows to {out_path}")

if __name__ == "__main__":
    main()
