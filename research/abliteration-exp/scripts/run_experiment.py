"""Master abliteration experiment script.

Phases:
  A. Baseline run on Qwen/Qwen2.5-1.5B-Instruct
  B. Run heretic abliteration on that model
  C. Run prompts on the abliterated model
  D. Run prompts on huihui-ai reference abliterated model
  E. (stretch) Repeat A-C for Qwen/Qwen3-4B-Instruct-2507
  F. Write SUMMARY.md comparing all runs side-by-side

Designed to run unattended overnight. All output goes to outputs/.
"""
import os
import sys
import json
import time
import logging
import subprocess
import traceback
from datetime import datetime
from pathlib import Path

# Force UTF-8 so we don't die on emoji/unicode anywhere.
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

OUTPUTS.mkdir(exist_ok=True)
MODELS.mkdir(exist_ok=True)

# Make sure we can import eval_prompts
sys.path.insert(0, str(SCRIPTS))
from eval_prompts import all_prompts  # noqa: E402

# ----------------------------------------------------------------------
# Logging
# ----------------------------------------------------------------------
LOG_PATH = OUTPUTS / "experiment.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, mode="a", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("experiment")

# ----------------------------------------------------------------------
# Core: run prompts against a model
# ----------------------------------------------------------------------

def run_prompts(model_name_or_path, output_json, output_md, label):
    """Load model, generate on all prompts, save json + markdown."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    log.info(f"[{label}] Loading tokenizer from {model_name_or_path}")
    tokenizer = AutoTokenizer.from_pretrained(
        model_name_or_path, trust_remote_code=True
    )
    log.info(f"[{label}] Loading model (bfloat16, device_map=cuda)")
    t_load_start = time.time()
    model = AutoModelForCausalLM.from_pretrained(
        model_name_or_path,
        torch_dtype=torch.bfloat16,
        device_map="cuda",
        trust_remote_code=True,
    )
    model.eval()
    log.info(f"[{label}] Model loaded in {time.time()-t_load_start:.1f}s")

    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id

    results = []
    prompts = all_prompts()
    for idx, (category, cat_idx, user_prompt) in enumerate(prompts, 1):
        log.info(f"[{label}] [{idx}/{len(prompts)}] {category}:{cat_idx}")
        messages = [{"role": "user", "content": user_prompt}]
        try:
            input_ids = tokenizer.apply_chat_template(
                messages,
                add_generation_prompt=True,
                return_tensors="pt",
            ).to("cuda")

            with torch.no_grad():
                output_ids = model.generate(
                    input_ids,
                    max_new_tokens=512,
                    do_sample=False,
                    pad_token_id=tokenizer.pad_token_id,
                )
            gen_tokens = output_ids[0][input_ids.shape[1]:]
            response = tokenizer.decode(gen_tokens, skip_special_tokens=True)
        except Exception as e:
            response = f"<<ERROR: {e}>>"
            log.error(f"[{label}] generation failed on {category}:{cat_idx}: {e}")

        results.append({
            "index": idx,
            "category": category,
            "category_index": cat_idx,
            "prompt": user_prompt,
            "response": response,
        })

        # Incremental JSON write so we don't lose data if crash.
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump({
                "label": label,
                "model": str(model_name_or_path),
                "timestamp": datetime.now().isoformat(),
                "results": results,
            }, f, ensure_ascii=False, indent=2)

    # Write the markdown.
    with open(output_md, "w", encoding="utf-8") as f:
        f.write(f"# {label}\n\n")
        f.write(f"**Model:** `{model_name_or_path}`\n\n")
        f.write(f"**Timestamp:** {datetime.now().isoformat()}\n\n")
        for cat in ("safety", "ccp", "capability"):
            f.write(f"## {cat.upper()}\n\n")
            for r in results:
                if r["category"] != cat:
                    continue
                f.write(f"### {cat}:{r['category_index']}\n\n")
                f.write(f"**Prompt:** {r['prompt']}\n\n")
                f.write(f"**Response:**\n\n")
                f.write("```\n")
                f.write(r["response"])
                f.write("\n```\n\n")

    log.info(f"[{label}] wrote {output_json.name} and {output_md.name}")

    # Free GPU memory.
    del model
    del tokenizer
    import gc
    gc.collect()
    torch.cuda.empty_cache()
    log.info(f"[{label}] GPU memory freed")


# ----------------------------------------------------------------------
# Heretic invocation
# ----------------------------------------------------------------------

def run_heretic(model_id, save_dir, log_file):
    """Call scripts/heretic_driver.py as a subprocess, stream logs to log_file."""
    log.info(f"[heretic] starting on {model_id}, saving to {save_dir}")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    cmd = [
        str(VENV_PY),
        str(SCRIPTS / "heretic_driver.py"),
        model_id,
        str(save_dir),
        "--n-trials", "60",
        "--n-startup-trials", "20",
    ]
    log.info(f"[heretic] cmd: {' '.join(cmd)}")
    with open(log_file, "w", encoding="utf-8") as lf:
        lf.write(f"=== heretic run @ {datetime.now().isoformat()} ===\n")
        lf.write(f"CMD: {' '.join(cmd)}\n\n")
        lf.flush()
        proc = subprocess.run(
            cmd,
            stdout=lf,
            stderr=subprocess.STDOUT,
            env=env,
            cwd=str(ROOT),
        )
    if proc.returncode != 0:
        log.error(f"[heretic] exited with code {proc.returncode}; see {log_file}")
        return False
    log.info(f"[heretic] completed successfully")
    return True


# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------

def write_summary(entries):
    """entries: list of dicts with 'label', 'json_path'."""
    summary_path = OUTPUTS / "SUMMARY.md"
    loaded = []
    for e in entries:
        p = Path(e["json_path"])
        if not p.exists():
            loaded.append({"label": e["label"], "results": None, "error": "missing"})
            continue
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            loaded.append({"label": e["label"], "results": data.get("results", []),
                           "model": data.get("model")})
        except Exception as ex:
            loaded.append({"label": e["label"], "results": None, "error": str(ex)})

    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("# Abliteration Experiment Summary\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write("Runs included:\n\n")
        for L in loaded:
            err = L.get("error")
            if err:
                f.write(f"- **{L['label']}**: FAILED ({err})\n")
            else:
                f.write(f"- **{L['label']}**: `{L.get('model')}` "
                        f"({len(L['results'])} responses)\n")
        f.write("\n---\n\n")

        # Build index by (category, cat_idx) -> {label: response}
        prompts_ref = all_prompts()
        for category, cat_idx, prompt in prompts_ref:
            f.write(f"## {category}:{cat_idx}\n\n")
            f.write(f"**Prompt:** {prompt}\n\n")
            for L in loaded:
                if L.get("error"):
                    f.write(f"### {L['label']}\n\nERROR: {L['error']}\n\n")
                    continue
                match = None
                for r in L["results"]:
                    if r["category"] == category and r["category_index"] == cat_idx:
                        match = r
                        break
                if match is None:
                    f.write(f"### {L['label']}\n\n(no response found)\n\n")
                    continue
                resp = match["response"]
                snippet = resp[:400].replace("\n", " ")
                if len(resp) > 400:
                    snippet += " ..."
                f.write(f"### {L['label']}\n\n")
                f.write(f"> {snippet}\n\n")
            f.write("---\n\n")

    log.info(f"[summary] wrote {summary_path}")


# ----------------------------------------------------------------------
# Main orchestration
# ----------------------------------------------------------------------

def main():
    t0 = time.time()
    log.info("=" * 60)
    log.info("ABLITERATION EXPERIMENT STARTING")
    log.info(f"cwd={os.getcwd()} python={sys.executable}")
    log.info("=" * 60)

    summary_entries = []

    # ---- Phase A: baseline Qwen2.5-1.5B-Instruct ----
    model_a = "Qwen/Qwen2.5-1.5B-Instruct"
    base_json = OUTPUTS / "baseline_qwen25-1p5b.json"
    base_md = OUTPUTS / "baseline_qwen25-1p5b.md"
    try:
        log.info("PHASE A: baseline Qwen2.5-1.5B-Instruct")
        run_prompts(model_a, base_json, base_md, "baseline_qwen25_1p5b")
        summary_entries.append({"label": "baseline_qwen25_1p5b",
                                "json_path": str(base_json)})
    except Exception:
        log.error(f"PHASE A failed:\n{traceback.format_exc()}")

    # ---- Phase B: heretic abliteration ----
    ablit_dir = MODELS / "heretic_qwen25-1p5b"
    heretic_log = OUTPUTS / "heretic_run.log"
    heretic_ok = False
    try:
        log.info("PHASE B: heretic abliteration on Qwen2.5-1.5B-Instruct")
        heretic_ok = run_heretic(model_a, ablit_dir, heretic_log)
    except Exception:
        log.error(f"PHASE B failed:\n{traceback.format_exc()}")

    # ---- Phase C: run prompts on abliterated model ----
    ablit_json = OUTPUTS / "abliterated_qwen25-1p5b.json"
    ablit_md = OUTPUTS / "abliterated_qwen25-1p5b.md"
    if heretic_ok and ablit_dir.exists() and any(ablit_dir.iterdir()):
        try:
            log.info("PHASE C: prompts on heretic-abliterated model")
            run_prompts(str(ablit_dir), ablit_json, ablit_md,
                        "heretic_qwen25_1p5b")
            summary_entries.append({"label": "heretic_qwen25_1p5b",
                                    "json_path": str(ablit_json)})
        except Exception:
            log.error(f"PHASE C failed:\n{traceback.format_exc()}")
    else:
        log.warning("PHASE C skipped (heretic did not produce a saved model)")

    # ---- Phase D: huihui reference ----
    huihui_model = "huihui-ai/Qwen2.5-1.5B-Instruct-abliterated"
    hh_json = OUTPUTS / "huihui_reference.json"
    hh_md = OUTPUTS / "huihui_reference.md"
    try:
        log.info("PHASE D: huihui reference model")
        run_prompts(huihui_model, hh_json, hh_md, "huihui_qwen25_1p5b")
        summary_entries.append({"label": "huihui_qwen25_1p5b",
                                "json_path": str(hh_json)})
    except Exception:
        log.error(f"PHASE D failed:\n{traceback.format_exc()}")

    elapsed = time.time() - t0
    log.info(f"Phases A-D done in {elapsed/60:.1f} min")

    # ---- Phase E: stretch Qwen3-4B if under 2 hours total ----
    if elapsed < 2 * 3600:
        log.info("PHASE E: stretch — Qwen3-4B-Instruct-2507")
        model_e = "Qwen/Qwen3-4B-Instruct-2507"
        base3_json = OUTPUTS / "baseline_qwen3-4b.json"
        base3_md = OUTPUTS / "baseline_qwen3-4b.md"
        try:
            run_prompts(model_e, base3_json, base3_md, "baseline_qwen3_4b")
            summary_entries.append({"label": "baseline_qwen3_4b",
                                    "json_path": str(base3_json)})
        except Exception:
            log.error(f"PHASE E baseline failed:\n{traceback.format_exc()}")

        ablit3_dir = MODELS / "heretic_qwen3-4b"
        heretic3_log = OUTPUTS / "heretic_qwen3_4b.log"
        heretic3_ok = False
        try:
            heretic3_ok = run_heretic(model_e, ablit3_dir, heretic3_log)
        except Exception:
            log.error(f"PHASE E heretic failed:\n{traceback.format_exc()}")

        if heretic3_ok and ablit3_dir.exists() and any(ablit3_dir.iterdir()):
            ablit3_json = OUTPUTS / "abliterated_qwen3-4b.json"
            ablit3_md = OUTPUTS / "abliterated_qwen3-4b.md"
            try:
                run_prompts(str(ablit3_dir), ablit3_json, ablit3_md,
                            "heretic_qwen3_4b")
                summary_entries.append({"label": "heretic_qwen3_4b",
                                        "json_path": str(ablit3_json)})
            except Exception:
                log.error(f"PHASE E abliterated run failed:\n{traceback.format_exc()}")
    else:
        log.info(f"PHASE E skipped (elapsed {elapsed/60:.1f} min >= 120 min budget)")

    # ---- Phase F: summary ----
    try:
        log.info("PHASE F: writing SUMMARY.md")
        write_summary(summary_entries)
    except Exception:
        log.error(f"PHASE F failed:\n{traceback.format_exc()}")

    total = time.time() - t0
    log.info(f"EXPERIMENT COMPLETE in {total/60:.1f} min")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log.critical(f"Unhandled exception in main:\n{traceback.format_exc()}")
        sys.exit(1)
