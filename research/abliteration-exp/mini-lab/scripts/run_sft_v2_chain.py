"""Sequential chain for the sft-v2 remediation pipeline.

Waits for an optional upstream PID to exit (the c100-buggy eval), then:
  1. Run sft-v2 training via train_sft.py --fallback --assistant-only-loss.
  2. Run full eval + 53-prompt interview on sft-v2 final adapter.
  3. Score the eval via score_eval.py.

Everything detached and wake-locked. Each subprocess inherits the detached
process group so OS scheduling or harness reaping can't clip it.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import sys
import time

SCRIPTS = pathlib.Path(__file__).parent
sys.path.insert(0, str(SCRIPTS))
import wake_lock  # noqa: E402

PYTHON = r"C:/Users/alto8/abliteration-exp/venv/Scripts/python.exe"

REPO = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab")
CORPUS = REPO / "corpus" / "constitution_plus_household.jsonl"
OUT = REPO / "outputs"
LOGS = REPO / "logs"
CKPT_ROOT = REPO / "checkpoints" / "sft-v2"


def is_pid_alive(pid: int) -> bool:
    import ctypes
    kernel32 = ctypes.windll.kernel32
    SYNCHRONIZE = 0x00100000
    handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
    if handle == 0:
        return False
    kernel32.CloseHandle(handle)
    return True


def wait_for_pid(pid: int, label: str, poll_s: int = 15):
    if pid <= 0:
        return
    print(f"[chain] waiting for PID {pid} ({label})", flush=True)
    t0 = time.time()
    while is_pid_alive(pid):
        time.sleep(poll_s)
    print(f"[chain] PID {pid} exited after {int(time.time()-t0)}s", flush=True)


def run_subcmd(label: str, cmd: list[str], log_path: pathlib.Path):
    print(f"\n[chain] ---- {label} ----", flush=True)
    print(f"[chain] cmd: {' '.join(cmd)}", flush=True)
    print(f"[chain] log: {log_path}", flush=True)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as f:
        proc = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT)
    print(f"[chain] {label} returncode={proc.returncode}", flush=True)
    return proc.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wait-pid", type=int, default=0,
                    help="upstream GPU process to wait for before starting")
    ap.add_argument("--epochs", type=int, default=10)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--r", type=int, default=32)
    ap.add_argument("--alpha", type=int, default=64)
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=8)
    ap.add_argument("--warmup-ratio", type=float, default=0.1)
    args = ap.parse_args()

    with wake_lock.keep_awake("sft-v2-chain"):
        if args.wait_pid:
            wait_for_pid(args.wait_pid, "upstream c100 eval")

        # === STEP 1: sft-v2 training ===
        out_dir = CKPT_ROOT
        loss_log = LOGS / "sft-v2-loss.jsonl"
        epoch1_ckpt = out_dir / "epoch-1"
        # Clear stale loss log so we start fresh
        if loss_log.exists():
            loss_log.unlink()
        train_cmd = [
            PYTHON, "-u",
            str(SCRIPTS / "train_sft.py"),
            "--model", "nvidia/Nemotron-Mini-4B-Instruct",
            "--corpus", str(CORPUS),
            "--out", str(out_dir),
            "--fallback",
            "--assistant-only-loss",
            "--epochs", str(args.epochs),
            "--lr", str(args.lr),
            "--r", str(args.r),
            "--alpha", str(args.alpha),
            "--batch-size", str(args.batch_size),
            "--grad-accum", str(args.grad_accum),
            "--warmup-ratio", str(args.warmup_ratio),
            "--save-strategy", "epoch",
            "--save-total-limit", "12",
            "--loss-log", str(loss_log),
            "--epoch1-ckpt", str(epoch1_ckpt),
        ]
        rc = run_subcmd("train sft-v2", train_cmd, LOGS / "train-sft-v2.log")
        if rc != 0:
            print(f"[chain] training failed rc={rc}, aborting", flush=True)
            return

        # === STEP 2: eval + interview ===
        eval_cmd = [
            PYTHON, "-u",
            str(SCRIPTS / "run_all_for_checkpoint.py"),
            "--model", "nvidia/Nemotron-Mini-4B-Instruct",
            "--adapter", str(out_dir),
            "--label", "sft-v2",
            "--max-new-tokens", "384",
        ]
        rc = run_subcmd("eval sft-v2", eval_cmd, LOGS / "run-all-sft-v2.log")
        if rc != 0:
            print(f"[chain] eval failed rc={rc}, aborting", flush=True)
            return

        # === STEP 3: score ===
        score_cmd = [
            PYTHON, "-u",
            str(SCRIPTS / "score_eval.py"),
            "--battery", str(OUT / "eval-battery.json"),
            "--responses", str(OUT / "eval-sft-v2.jsonl"),
            "--out", str(OUT / "eval-sft-v2-scored.json"),
            "--mode", "rules",
            "--name", "sft-v2",
        ]
        rc = run_subcmd("score sft-v2", score_cmd, LOGS / "score-sft-v2.log")
        print(f"\n[chain] COMPLETE. rc={rc}", flush=True)


if __name__ == "__main__":
    main()
