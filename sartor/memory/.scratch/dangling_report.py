import json
from collections import Counter
d = json.load(open('sartor/memory/.scratch/dangling-links-2026-04-12.json'))
items = sorted(d.items(), key=lambda kv: -len(kv[1]))
print('Top 15 files by dangling-link count:')
for path, targets in items[:15]:
    rel = path.split('memory/')[-1]
    print(f'{len(targets):4d}  {rel}')
    for t in targets[:5]:
        print(f'        -> {t}')
print()
print('Most common dangling targets:')
c = Counter()
for path, targets in d.items():
    for t in targets:
        c[t.lower().strip()] += 1
for t,cnt in c.most_common(25):
    print(f'  {cnt:3d}x  {t}')
