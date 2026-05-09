"""
Merge constitutional + retention corpora and produce a stratified 90/10 train/val split.

Stratification ensures constitutional ratio is preserved in both splits.
"""
import json
import random

random.seed(42)

CONSTITUTIONAL_PATH = 'C:/Users/alto8/constitutional-sft/constitutional-corpus-v1.jsonl'
RETENTION_PATH      = 'C:/Users/alto8/constitutional-sft/retention-corpus-v1.jsonl'
MERGED_PATH         = 'C:/Users/alto8/constitutional-sft/training-data.jsonl'
TRAIN_PATH          = 'C:/Users/alto8/constitutional-sft/train.jsonl'
VAL_PATH            = 'C:/Users/alto8/constitutional-sft/val.jsonl'

def load_jsonl(path, label):
    examples = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                obj = json.loads(line)
                obj['_source'] = label
                examples.append(obj)
    return examples

constitutional = load_jsonl(CONSTITUTIONAL_PATH, 'constitutional')
retention      = load_jsonl(RETENTION_PATH,      'retention')

print(f'Constitutional examples: {len(constitutional)}')
print(f'Retention examples:      {len(retention)}')
print(f'Total:                   {len(constitutional) + len(retention)}')

constitutional_ratio = len(constitutional) / (len(constitutional) + len(retention))
print(f'Constitutional ratio:    {constitutional_ratio:.1%}')

# Merge (constitutional first, then retention) and write training-data.jsonl
all_examples = constitutional + retention
with open(MERGED_PATH, 'w', encoding='utf-8') as f:
    for ex in all_examples:
        out = {k: v for k, v in ex.items() if k != '_source'}
        f.write(json.dumps(out, ensure_ascii=False) + '\n')
print(f'Wrote merged file: {MERGED_PATH}')

# Stratified 90/10 split
def stratified_split(examples, val_fraction=0.1):
    constitutional_exs = [e for e in examples if e['_source'] == 'constitutional']
    retention_exs      = [e for e in examples if e['_source'] == 'retention']

    random.shuffle(constitutional_exs)
    random.shuffle(retention_exs)

    n_con_val = max(1, round(len(constitutional_exs) * val_fraction))
    n_ret_val = max(1, round(len(retention_exs) * val_fraction))

    val  = constitutional_exs[:n_con_val] + retention_exs[:n_ret_val]
    train = constitutional_exs[n_con_val:] + retention_exs[n_ret_val:]

    random.shuffle(val)
    random.shuffle(train)
    return train, val

train_examples, val_examples = stratified_split(all_examples, val_fraction=0.1)

def write_jsonl(path, examples):
    with open(path, 'w', encoding='utf-8') as f:
        for ex in examples:
            out = {k: v for k, v in ex.items() if k != '_source'}
            f.write(json.dumps(out, ensure_ascii=False) + '\n')

write_jsonl(TRAIN_PATH, train_examples)
write_jsonl(VAL_PATH, val_examples)

# Report
total = len(all_examples)
train_con = sum(1 for e in train_examples if e['_source'] == 'constitutional')
train_ret = sum(1 for e in train_examples if e['_source'] == 'retention')
val_con   = sum(1 for e in val_examples   if e['_source'] == 'constitutional')
val_ret   = sum(1 for e in val_examples   if e['_source'] == 'retention')

print()
print('=== Split Summary ===')
print(f'Total examples:          {total}')
print(f'Constitutional ratio:    {len(constitutional)}/{total} = {len(constitutional)/total:.1%}')
print(f'Train set:               {len(train_examples)} examples')
print(f'  Constitutional:        {train_con}')
print(f'  Retention:             {train_ret}')
print(f'  Constitutional ratio:  {train_con/len(train_examples):.1%}')
print(f'Val set:                 {len(val_examples)} examples')
print(f'  Constitutional:        {val_con}')
print(f'  Retention:             {val_ret}')
print(f'  Constitutional ratio:  {val_con/len(val_examples):.1%}')
print()

# Sample one from each category
print('=== Samples ===')
print('Constitutional (first val example):')
con_val = [e for e in val_examples if e['_source'] == 'constitutional']
if con_val:
    ex = con_val[0]
    print(f"  User: {ex['messages'][0]['content'][:80]}...")
    print(f"  Asst: {ex['messages'][-1]['content'][:80]}...")

print()
retention_cats = [
    ('math',        0,  9),
    ('reasoning',  10, 19),
    ('factual',    20, 29),
    ('instruction',30, 39),
    ('creative',   40, 49),
]
# Load original retention to know category by original index
with open(RETENTION_PATH, encoding='utf-8') as f:
    ret_orig = [json.loads(l) for l in f]

for cat, start, end in retention_cats:
    # Find a val or train example from this category
    cat_examples = ret_orig[start:end+1]
    print(f'Retention ({cat}):')
    ex = cat_examples[0]
    print(f"  User: {ex['messages'][0]['content'][:80]}...")
    print(f"  Asst: {ex['messages'][-1]['content'][:80]}...")
    print()
