# Morning note — rtxpro6000server is yours

Good morning. Everything below is status at the moment you read this.

## One-step to wake up Claude Code on this box

You probably want to finish OAuth login manually (I did not pre-seed tokens — device-bound auth is flaky cross-machine and I didn't want to risk invalidating Rocinante's session while you slept). Run:

```bash
claude
# or
claude /login
```

Follow the device-flow URL on any phone/laptop. ~30 seconds.

After that, this box has a Claude Code instance that can read the Sartor repo at `~/Sartor-claude-network/` and manage itself.

## What happened overnight (short)

- Training kicked off against `~/models/heretic-3.6-35b` with LoRA adapters targeting attention only.
- Monitor ran in parallel, logging temps/power/dmesg to `~/training-monitor.log`.
- Alert canary at `~/ALERT` — if that file EXISTS and is non-empty, something tripped. Read it first.

## Where things are

| artifact | path |
|---|---|
| Training plan | `~/Sartor-claude-network/experiments/2026-04-22-overnight-training/PLAN.md` |
| Training script | `~/Sartor-claude-network/experiments/2026-04-22-overnight-training/train.py` |
| Monitor script | `~/Sartor-claude-network/experiments/2026-04-22-overnight-training/monitor.sh` |
| Training log | `~/training.log` |
| Monitor log | `~/training-monitor.log` |
| Alert canary | `~/ALERT` (only exists if something tripped) |
| LoRA adapter | `~/models/lora-sartor-v0.1/` |
| Base model | `~/models/heretic-3.6-35b/` |
| Opus 4.6 reasoning dataset | `~/datasets/opus-reasoning-12k/` |
| Post-run SUMMARY | `~/Sartor-claude-network/experiments/2026-04-22-overnight-training/SUMMARY.md` (written by Rocinante Claude at end of run) |

## Check this first

```bash
cat ~/ALERT 2>/dev/null || echo "no alerts fired"
tail -50 ~/training.log
nvidia-smi
```
