"""Retry script for the abliteration experiment.

Runs AFTER run_experiment.py has (hopefully) completed phases A/D/E-baseline.
Because heretic's initial run crashed during the save step (fixed in
heretic_driver.py), but the optuna study is cached, we can re-run heretic,
which will pick up the cached study and jump straight to saving.

Steps:
  1. Wait for run_experiment.py's main loop to finish (poll experiment.log).
  2. Re-run heretic on Qwen2.5-1.5B-Instruct, save to models/heretic_qwen25-1p5b.
  3. Run the 15 prompts on the abliterated model.
  4. If a Qwen3-4B baseline exists and its abliterated json doesn't,
     also re-run heretic + phase C for that model.
  5. Regenerate SUMMARY.md including everything.
"""
import os
import sys
import time
import json
import logging
import subprocess
import traceback
from datetime import datetime
from pathlib import Path

os.environ.setdefault("PYTHONIOENCODING", "utf-8")
os.environ.setdefault("PYTHONUTF8", "1")
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("C:/Users/alto8/abliteration-exp")
SCRIPTS = ROOT / "scripts"
OUTPUTS = ROOT / "outputs"
MODELS = ROOT / "models"
VENV_PY = ROOT / "venv" / "Scripts" / "python.exe"

sys.path.insert(0, str(SCRIPTS))
from eval_prompts import all_prompts  # noqa: E402
from run_experiment import run_prompts, run_heretic, write_summary  # noqa: E402

LOG_PATH = OUTPUTS / "experiment.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, mode="a", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("experiment.retry")


def wait_for_main_done(timeout_s=6 * 3600, poll_s=30):
    """Block until experiment.log contains 'EXPERIMENT COMPLETE' or an obvious
    terminal state. Returns True if main finished, False if timeout."""
    log.info("[retry] waiting for main experiment to finish")
    start = time.time()
    while time.time() - start < timeout_s:
        try:
            with open(LOG_PATH, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            if "EXPERIMENT COMPLETE" in content:
                log.info("[retry] main experiment signaled COMPLETE")
                return True
        except FileNotFoundError:
            pass
        time.sleep(poll_s)
    log.warning(f"[retry] timed out after {timeout_s}s waiting for main")
    return False


def retry_heretic_and_eval(model_id, ablit_dir, heretic_log, ablit_json,
                            ablit_md, label):
    """Re-run heretic (should resume from cached optuna study) and eval."""
    log.info(f"[retry] running heretic on {model_id}")
    ok = run_heretic(model_id, ablit_dir, heretic_log)
    if not ok:
        log.error(f"[retry] heretic failed for {model_id}")
        return False
    if not ablit_dir.exists() or not any(ablit_dir.iterdir()):
        log.error(f"[retry] heretic output dir empty: {ablit_dir}")
        return False
    try:
        run_prompts(str(ablit_dir), ablit_json, ablit_md, label)
        return True
    except Exception:
        log.error(f"[retry] prompt eval failed:\n{traceback.format_exc()}")
        return False


def main():
    log.info("=" * 60)
    log.info("RETRY SCRIPT STARTING")
    log.info("=" * 60)

    ok = wait_for_main_done()
    if not ok:
        log.warning("[retry] continuing anyway after timeout")

    # Give the main process a few seconds to release GPU memory.
    time.sleep(15)

    summary_entries = []

    # Include baseline (Qwen2.5) if it exists.
    base_json = OUTPUTS / "baseline_qwen25-1p5b.json"
    if base_json.exists():
        summary_entries.append({"label": "baseline_qwen25_1p5b",
                                "json_path": str(base_json)})

    # --- Qwen2.5-1.5B: heretic + eval ---
    model_a = "Qwen/Qwen2.5-1.5B-Instruct"
    ablit_dir = MODELS / "heretic_qwen25-1p5b"
    heretic_log = OUTPUTS / "heretic_run.log"
    ablit_json = OUTPUTS / "abliterated_qwen25-1p5b.json"
    ablit_md = OUTPUTS / "abliterated_qwen25-1p5b.md"

    if ablit_json.exists():
        log.info("[retry] Qwen2.5 abliterated eval already present, skipping")
        summary_entries.append({"label": "heretic_qwen25_1p5b",
                                "json_path": str(ablit_json)})
    else:
        ok = retry_heretic_and_eval(model_a, ablit_dir, heretic_log,
                                    ablit_json, ablit_md, "heretic_qwen25_1p5b")
        if ok:
            summary_entries.append({"label": "heretic_qwen25_1p5b",
                                    "json_path": str(ablit_json)})

    # Include huihui reference if it exists.
    hh_json = OUTPUTS / "huihui_reference.json"
    if hh_json.exists():
        summary_entries.append({"label": "huihui_qwen25_1p5b",
                                "json_path": str(hh_json)})

    # --- Qwen3-4B: baseline + heretic + eval (if possible) ---
    base3_json = OUTPUTS / "baseline_qwen3-4b.json"
    model_e = "Qwen/Qwen3-4B-Instruct-2507"
    base3_md = OUTPUTS / "baseline_qwen3-4b.md"
    ablit3_dir = MODELS / "heretic_qwen3-4b"
    heretic3_log = OUTPUTS / "heretic_qwen3_4b.log"
    ablit3_json = OUTPUTS / "abliterated_qwen3-4b.json"
    ablit3_md = OUTPUTS / "abliterated_qwen3-4b.md"

    # If main ran phase E, it will have produced base3_json. But it also would
    # have tried (and failed, same bug) heretic. Try heretic again now.
    if base3_json.exists():
        summary_entries.append({"label": "baseline_qwen3_4b",
                                "json_path": str(base3_json)})
    else:
        # Main didn't do phase E at all; try to do a quick baseline now.
        try:
            log.info("[retry] Qwen3-4B baseline (main didn't run it)")
            run_prompts(model_e, base3_json, base3_md, "baseline_qwen3_4b")
            summary_entries.append({"label": "baseline_qwen3_4b",
                                    "json_path": str(base3_json)})
        except Exception:
            log.error(f"[retry] Qwen3-4B baseline failed:\n{traceback.format_exc()}")

    if base3_json.exists():
        if ablit3_json.exists():
            log.info("[retry] Qwen3-4B abliterated eval already present, skipping")
            summary_entries.append({"label": "heretic_qwen3_4b",
                                    "json_path": str(ablit3_json)})
        else:
            ok = retry_heretic_and_eval(model_e, ablit3_dir, heretic3_log,
                                        ablit3_json, ablit3_md,
                                        "heretic_qwen3_4b")
            if ok:
                summary_entries.append({"label": "heretic_qwen3_4b",
                                        "json_path": str(ablit3_json)})

    # --- Regenerate summary ---
    try:
        log.info("[retry] regenerating SUMMARY.md")
        write_summary(summary_entries)
    except Exception:
        log.error(f"[retry] summary write failed:\n{traceback.format_exc()}")

    log.info("[retry] DONE — all retries complete")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log.critical(f"Unhandled exception in retry main:\n{traceback.format_exc()}")
        sys.exit(1)
