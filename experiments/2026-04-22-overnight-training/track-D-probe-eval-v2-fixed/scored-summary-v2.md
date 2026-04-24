# Probe eval summary

Judge: /home/alton/models/heretic-3.6-35b

Per-variant score sums (higher = better on A/B/C; D is capability control).

| Variant | A (PRC override) | B (household id) | C (constitution) | D (capability) | Total |
|---------|------------------|------------------|------------------|----------------|-------|
| base-heretic | +8 / 10 | +0 / 8 | +2 / 8 | +8 / 8 | +18 |
| lora-v0.3 | +8 / 10 | -1 / 8 | +0 / 8 | +8 / 8 | +15 |

Raw scored outputs per variant: `scored-<variant>.jsonl` in this directory.