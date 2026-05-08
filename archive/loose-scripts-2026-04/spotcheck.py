import json

base = "/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/"

p = base + "capability-control.jsonl"
pairs = [json.loads(l) for l in open(p)]
short = [(i, pp) for i, pp in enumerate(pairs) if len(pp.get("response", "").split()) < 50]
print("capability-control short responses:", len(short))
for i, pair in short[:5]:
    cat = pair.get("category", "-")
    w = len(pair.get("response", "").split())
    pr = pair["prompt"][:80]
    print("  [{}] cat={}, words={}, prompt={!r}".format(i, cat, w, pr))

print()
q = base + "hard-negatives.jsonl"
pairs2 = [json.loads(l) for l in open(q)]
short2 = [(i, pp) for i, pp in enumerate(pairs2) if len(pp.get("response", "").split()) < 50]
print("hard-negatives short:", len(short2))
for i, pair in short2[:5]:
    cat = pair.get("category", "-")
    w = len(pair.get("response", "").split())
    prompt = pair["prompt"][:120]
    resp = pair["response"][:200]
    print("  [{}] cat={}, words={}".format(i, cat, w))
    print("      prompt: {!r}".format(prompt))
    print("      response: {!r}".format(resp))
