"""Inbox poisoning categorical breakdown for memory-engineer.

Walks inbox/, classifies each file, and within the extractor_proposed bucket,
detects byte-equivalence-modulo-meta dupes by stripping dates/hashes before
hashing the body. Emits a JSON-friendly summary.
"""
import os
import hashlib
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\alto8\.claude\projects\C--Users-alto8\memory")
INBOX = ROOT / "inbox"


def first_heading(text: str) -> str:
    for line in text.splitlines()[:30]:
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return ""


def normalize_body(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end >= 0:
            text = text[end + 4:]
    t = re.sub(r"\d{4}-\d{2}-\d{2}T?\d{0,2}:?\d{0,2}:?\d{0,2}", "DATE", text)
    t = re.sub(r"\b[a-f0-9]{8,}\b", "HASH", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def classify(rel: str) -> str:
    rel = rel.replace("\\", "/")
    if "proposed-memories" in rel or "rocinante-extractor" in rel:
        return "extractor_proposed"
    if "/_processed/" in rel:
        return "processed_results"
    if "/_drained/" in rel or "/.drained/" in rel:
        return "drained_archive"
    if "PHONE-HOME" in rel.upper():
        return "peer_phone_home"
    if rel.startswith("inbox/gpuserver1/") or rel.startswith("inbox/rtxpro6000server/") or rel.startswith("inbox/rtxserver/"):
        return "peer_inbox_other"
    if rel.startswith("inbox/rocinante/_specs/"):
        return "rocinante_specs"
    if rel.startswith("inbox/rocinante/"):
        return "rocinante_top"
    return "other"


buckets = defaultdict(list)
heading_counts = Counter()

for dirpath, dirs, files in os.walk(INBOX):
    for fn in files:
        if not fn.endswith(".md"):
            continue
        full = Path(dirpath) / fn
        rel = full.relative_to(ROOT).as_posix()
        try:
            text = full.read_text(encoding="utf-8", errors="replace")
        except Exception:
            buckets["unreadable"].append((rel, "", "", 0))
            continue
        h = first_heading(text)
        body_norm = normalize_body(text)
        body_hash = hashlib.md5(body_norm.encode()).hexdigest()[:10]
        size = full.stat().st_size
        cat = classify(rel)
        buckets[cat].append((rel, h, body_hash, size))
        heading_counts[h] += 1

total = sum(len(v) for v in buckets.values())
print(f"TOTAL inbox files: {total}\n")

print("--- BUCKETS ---")
for k, v in sorted(buckets.items(), key=lambda x: -len(x[1])):
    bytes_total = sum(t[3] for t in v)
    print(f"{len(v):5d}  {bytes_total:>9d}B  {k}")

print("\n--- TOP 20 HEADINGS (across whole inbox) ---")
for h, n in heading_counts.most_common(20):
    print(f"{n:5d}  {h[:80]}")

print("\n--- WITHIN extractor_proposed: dedup-modulo-meta by heading ---")
ep = buckets["extractor_proposed"]
heading_to_bodyhashes = defaultdict(Counter)
heading_to_paths = defaultdict(list)
for rel, h, bh, sz in ep:
    heading_to_bodyhashes[h][bh] += 1
    heading_to_paths[h].append(rel)
for h, bcounts in sorted(heading_to_bodyhashes.items(), key=lambda x: -sum(x[1].values()))[:20]:
    total_h = sum(bcounts.values())
    n_unique = len(bcounts)
    top_freq = bcounts.most_common(1)[0][1]
    print(f"{total_h:4d} files | {n_unique:3d} unique-body | top-body x{top_freq:<3d} | {h[:60]}")

print("\n--- SAMPLE: 3 entity_alton files for byte-comparison ---")
alton_paths = sorted(heading_to_paths.get("Proposed memory: entity_alton", []))[:3]
for p in alton_paths:
    full = ROOT / p
    print(f"\n###### {p} (size={full.stat().st_size}B) ######")
    print(full.read_text(encoding="utf-8", errors="replace"))

print("\n--- SAMPLE: 2 wifi_password files ---")
wp_paths = sorted(heading_to_paths.get("Proposed memory: wifi_password", []))[:2]
for p in wp_paths:
    full = ROOT / p
    print(f"\n###### {p} (size={full.stat().st_size}B) ######")
    print(full.read_text(encoding="utf-8", errors="replace"))
