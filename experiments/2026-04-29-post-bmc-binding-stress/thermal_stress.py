#!/usr/bin/env python3
"""
Thermal stress harness — paired with experiments/2026-04-27-thermal-baseline/.

Drives both GPUs at sustained ~475W via large-matrix matmul on each device,
runs for DURATION seconds, and exits cleanly. A separate sampler process
(see sample_loop.sh) writes nvidia-smi + sensors output to samples.jsonl.

Usage:
    /home/alton/ml/bin/python3 thermal_stress.py --duration 300

Designed to be reproduced run-over-run for before/after comparisons.
"""
from __future__ import annotations

import argparse
import multiprocessing as mp
import os
import signal
import sys
import time

import torch


def stress_worker(gpu_id: int, stop_at: float, q: mp.Queue) -> None:
    torch.cuda.set_device(gpu_id)
    device = torch.device(f"cuda:{gpu_id}")
    # 13312x13312 fp16 matmul fills the streaming multiprocessors and pulls
    # ~475W on RTX PRO 6000 Blackwell.
    n = 13312
    a = torch.randn((n, n), device=device, dtype=torch.float16)
    b = torch.randn((n, n), device=device, dtype=torch.float16)
    count = 0
    while time.time() < stop_at:
        a = torch.matmul(a, b)
        count += 1
        # Light sync every iteration so we don't queue work past stop_at
        torch.cuda.synchronize(device)
    q.put((gpu_id, count))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=int, default=300, help="seconds of stress")
    parser.add_argument("--gpus", type=str, default="0,1", help="comma-separated GPU IDs")
    args = parser.parse_args()

    gpu_ids = [int(x) for x in args.gpus.split(",") if x.strip()]
    if not gpu_ids:
        print("no GPUs requested", file=sys.stderr)
        return 2

    if not torch.cuda.is_available():
        print("CUDA not available", file=sys.stderr)
        return 2

    ctx = mp.get_context("spawn")
    stop_at = time.time() + args.duration
    print(f"Stress will run for {args.duration}s on GPUs {gpu_ids}", flush=True)

    q = ctx.Queue()
    procs = []
    for gpu_id in gpu_ids:
        p = ctx.Process(target=stress_worker, args=(gpu_id, stop_at, q))
        p.start()
        procs.append(p)

    print(f"PIDs: {[p.pid for p in procs]}", flush=True)

    def _term(signum, frame):
        for p in procs:
            if p.is_alive():
                os.kill(p.pid, signal.SIGTERM)
        sys.exit(130)

    signal.signal(signal.SIGINT, _term)
    signal.signal(signal.SIGTERM, _term)

    for p in procs:
        p.join(timeout=args.duration + 30)
        if p.is_alive():
            os.kill(p.pid, signal.SIGTERM)
            p.join(timeout=5)

    while not q.empty():
        gpu_id, count = q.get()
        print(f"GPU {gpu_id}: {count} matmul iterations", flush=True)
    print("Done.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
