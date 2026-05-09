"""Lighter follow-up: wait for an existing training PID to exit, then run
eval + interview + score on checkpoints/sft-v2/. Does NOT retrain.

Usage:
    python wait_then_eval_sft_v2.py --wait-pid <training_pid>
"""
from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys
import time

SCRIPTS = pathlib.Path(__file__).parent
sys.path.insert(0, str(SCRIPTS))
import wake_lock  # noqa: E402

PYTHON = r"C:/Users/alto8/abliteration-exp/venv/Scripts/python.exe"
REPO = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab")
OUT = REPO / "outputs"
LOGS = REPO / "logs"
CKPT = REPO / "checkpoints" / "sft-v2"


def is_pid_alive(pid: int) -> bool:
    import ctypes
    kernel32 = ctypes.windll.kernel32
    SYNCHRONIZE = 0x00100000
    h = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
    if h == 0:
        return False
    kernel32.CloseHandle(h)
    return True


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
    ap.add_argument("--wait-pid", type=int, required=True)
    ap.add_argument("--max-new-tokens", type=int, default=384)
    args = ap.parse_args()

    with wake_lock.keep_awake("sft-v2-followup"):
        print(f"[chain] waiting for training PID {args.wait_pid}", flush=True)
        t0 = time.time()
        while is_pid_alive(args.wait_pid):
            time.sleep(15)
        print(f"[chain] training PID exited after {int(time.time()-t0)}s", flush=True)

        # Sanity-check the adapter exists
        adapter_file = CKPT / "adapter_model.safetensors"
        if not adapter_file.exists():
            print(f"[chain] ADAPTER MISSING at {adapter_file}, aborting", flush=True)
            return

        # Step 1: combined eval + interview
        eval_cmd = [
            PYTHON, "-u",
            str(SCRIPTS / "run_all_for_checkpoint.py"),
            "--model", "nvidia/Nemotron-Mini-4B-Instruct",
            "--adapter", str(CKPT),
            "--label", "sft-v2",
            "--max-new-tokens", str(args.max_new_tokens),
        ]
        rc = run_subcmd("eval sft-v2", eval_cmd, LOGS / "run-all-sft-v2.log")
        if rc != 0:
            print(f"[chain] eval failed rc={rc}, aborting score", flush=True)
            return

        # Step 2: score
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
        print(f"\n[chain] COMPLETE rc={rc}", flush=True)


if __name__ == "__main__":
    main()
