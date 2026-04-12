#!/usr/bin/env python3
"""Build memory inventory TSV with frontmatter, dates, wikilinks, git mtime."""
import os, re, subprocess, sys, json
from pathlib import Path

ROOT = Path("C:/Users/alto8/Sartor-claude-network/sartor/memory")
REPO = Path("C:/Users/alto8/Sartor-claude-network")

FRONTMATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
WIKILINK_RE = re.compile(r'\[\[([^\]\|#]+)(?:[#\|][^\]]*)?\]\]')
MD_LINK_RE = re.compile(r'\[[^\]]+\]\(([^)]+\.md)[^)]*\)')

def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None
    fm = {}
    for line in m.group(1).splitlines():
        if ':' in line and not line.startswith(' '):
            k, _, v = line.partition(':')
            fm[k.strip()] = v.strip().strip('"\'')
    return fm

def get_git_mtime(path):
    try:
        rel = str(path.relative_to(REPO)).replace('\\','/')
        r = subprocess.run(['git','-C',str(REPO),'log','-1','--format=%cs','--',rel],
                           capture_output=True, text=True, timeout=10)
        return r.stdout.strip() or 'NONE'
    except Exception as e:
        return f'ERR'

# Pass 1: collect file stems for orphan detection
all_files = sorted(ROOT.rglob('*.md'))
stem_map = {}  # stem -> file path
for f in all_files:
    stem_map[f.stem] = f
    stem_map[f.stem.lower()] = f

# Pass 2: per-file extract
records = []
backlink_count = {}  # stem -> count
all_wikilink_targets = {}  # source_file -> [targets]

for f in all_files:
    try:
        text = f.read_text(encoding='utf-8', errors='replace')
    except Exception as ex:
        text = ''
    fm = parse_frontmatter(text)
    wl = WIKILINK_RE.findall(text)
    md_links = MD_LINK_RE.findall(text)
    all_wikilink_targets[str(f)] = wl
    word_count = len(text.split())
    rel = str(f.relative_to(ROOT)).replace('\\','/')
    record = {
        'path': rel,
        'type': (fm or {}).get('type','NONE'),
        'updated': (fm or {}).get('updated','NONE'),
        'entity': (fm or {}).get('entity','NONE'),
        'has_frontmatter': 'YES' if fm else 'NO',
        'word_count': word_count,
        'wikilink_count': len(wl),
        'git_mtime': get_git_mtime(f),
    }
    records.append(record)
    for target in wl:
        t = target.strip().lower()
        backlink_count[t] = backlink_count.get(t,0)+1

# Compute backlinks for each file
for r in records:
    stem = Path(r['path']).stem.lower()
    r['backlink_count'] = backlink_count.get(stem, 0)

# Find dangling wikilinks per file
dangling = {}
for src, targets in all_wikilink_targets.items():
    bad = []
    for t in targets:
        ts = t.strip()
        if ts.lower() not in stem_map and ts not in stem_map:
            bad.append(ts)
    if bad:
        dangling[src] = bad

# Write TSV
out = ROOT / '.scratch' / 'memory-inventory-2026-04-12.tsv'
with out.open('w', encoding='utf-8') as f:
    cols = ['path','type','entity','updated','git_mtime','has_frontmatter','word_count','wikilink_count','backlink_count']
    f.write('\t'.join(cols)+'\n')
    for r in records:
        f.write('\t'.join(str(r.get(c,'')) for c in cols)+'\n')

# Write dangling links report
dl = ROOT / '.scratch' / 'dangling-links-2026-04-12.json'
with dl.open('w', encoding='utf-8') as f:
    json.dump(dangling, f, indent=2)

# Stats
print(f'Files: {len(records)}')
print(f'No frontmatter: {sum(1 for r in records if r["has_frontmatter"]=="NO")}')
print(f'No updated field: {sum(1 for r in records if r["updated"]=="NONE")}')
print(f'Dangling wikilinks (files): {len(dangling)}')
total_dangling = sum(len(v) for v in dangling.values())
print(f'Dangling wikilinks (total): {total_dangling}')
print(f'Orphans (zero backlinks): {sum(1 for r in records if r["backlink_count"]==0)}')
