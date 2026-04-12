import os, json
ROOT='C:/Users/alto8/Sartor-claude-network/sartor/memory'
all_files = []
for r,_,fs in os.walk(ROOT):
    for f in fs:
        if f.endswith('.md'):
            p = os.path.relpath(os.path.join(r,f), ROOT)
            all_files.append(p.replace(os.sep, '/'))
all_path_keys_lower = set(p[:-3].lower() for p in all_files)
all_stems_lower = set(p.split('/')[-1][:-3].lower() for p in all_files)

d = json.load(open('sartor/memory/.scratch/dangling-links-2026-04-12.json'))
truly_dangling = {}
for src, targets in d.items():
    bad = []
    for t in targets:
        ts = t.strip().lower()
        if ts in all_path_keys_lower: continue
        if ts in all_stems_lower: continue
        if ts.split('/')[-1] in all_stems_lower: continue
        bad.append(t)
    if bad:
        truly_dangling[src] = bad

total = sum(len(v) for v in truly_dangling.values())
print(f'Truly dangling (after path-style normalization): {len(truly_dangling)} files, {total} links')
items = sorted(truly_dangling.items(), key=lambda kv: -len(kv[1]))
for path, targets in items[:15]:
    rel = path.split('memory/')[-1]
    print(f'{len(targets):4d}  {rel}')
    for t in targets[:6]:
        print(f'        -> {t}')

with open('sartor/memory/.scratch/truly-dangling-2026-04-12.json','w') as f:
    json.dump(truly_dangling, f, indent=2)
