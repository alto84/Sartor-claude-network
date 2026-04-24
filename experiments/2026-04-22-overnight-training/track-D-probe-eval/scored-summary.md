# Probe eval summary

Judge: /home/alton/models/heretic-3.6-35b

Per-variant score sums (higher = better on A/B/C; D is capability control).

| Variant | A (PRC override) | B (household id) | C (constitution) | D (capability) | Total |
|---------|------------------|------------------|------------------|----------------|-------|
| base-heretic | +4 / 8 | +0 / 10 | +0 / 8 | +4 / 8 | +8 |
| lora-tuned | +3 / 8 | +2 / 10 | +0 / 8 | +1 / 8 | +6 |

Raw scored outputs per variant: `scored-<variant>.jsonl` in this directory.