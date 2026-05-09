"""Non-interactive driver for heretic-llm.

Heretic's main() function is interactive at the end (trial selection, save path).
This driver monkey-patches heretic.main's prompt_* functions so the optimization
runs, the best (top) trial is auto-selected, and the merged model is saved to
a predetermined path without any human interaction.

Usage:
    python heretic_driver.py <hf_model_id> <output_dir> [--n-trials N]

Exits nonzero on failure. Writes progress to stdout/stderr which the caller
should redirect to a log file.
"""
import os
import sys
import argparse

# Force UTF-8 I/O so heretic's Unicode banner doesn't crash on Windows cp1252.
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
os.environ.setdefault("PYTHONUTF8", "1")
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model", help="Hugging Face model ID")
    ap.add_argument("output_dir", help="Directory to save abliterated model")
    ap.add_argument("--n-trials", type=int, default=60,
                    help="Number of Optuna trials (default 60; heretic default is 200)")
    ap.add_argument("--n-startup-trials", type=int, default=20)
    args = ap.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    # Import heretic late so we can patch its main-module names.
    import heretic.main as hmain

    # Patch sys.argv for heretic's argparse-derived settings loader.
    sys.argv = [
        "heretic",
        "--model", args.model,
        "--n-trials", str(args.n_trials),
        "--n-startup-trials", str(args.n_startup_trials),
        # Write optuna study checkpoints into the output dir to avoid collisions.
        "--study-checkpoint-dir", os.path.join(args.output_dir, "checkpoints"),
    ]

    # State machine for monkey-patched prompt_select / prompt_path.
    # Heretic's flow after optimization:
    #   1. prompt_select "Which trial do you want to use?" -> pick first (best) trial
    #   2. prompt_select "What do you want to do with the decensored model?"
    #       -> "Save the model to a local folder"
    #   3. prompt_path "Path to the folder:" -> args.output_dir
    #   4. back to prompt_select "What do you want to do..." -> "Return to the trial selection menu"
    #   5. prompt_select "Which trial..." -> "" (exit program)
    # Also: if an existing study is found, prompt_select "How would you like to proceed?"
    #   -> "restart" so we ignore stale state.
    state = {"step": 0}

    original_prompt_select = hmain.prompt_select
    original_prompt_path = hmain.prompt_path
    original_prompt_text = hmain.prompt_text

    def patched_prompt_select(message, choices):
        msg = (message or "").lower()
        print(f"[heretic_driver] prompt_select: {message}", flush=True)

        # Unwrap Choice objects if present. NOTE: strings have a .title
        # method, so a naive getattr(c, "title", c) would return the bound
        # method instead of the string. Same hazard for .value (strings don't
        # have .value, but be defensive for other primitives).
        from questionary import Choice as _QChoice
        def _value(c):
            if isinstance(c, _QChoice):
                return c.value
            return c
        def _title(c):
            if isinstance(c, _QChoice):
                return c.title
            if isinstance(c, str):
                return c
            return str(c)

        if "how would you like to proceed" in msg:
            # Existing study found. Prefer "continue" if available, else "restart".
            for c in choices:
                if _value(c) == "continue":
                    print("[heretic_driver] -> continue existing study", flush=True)
                    return "continue"
            for c in choices:
                if _value(c) == "restart":
                    print("[heretic_driver] -> restart study", flush=True)
                    return "restart"
            return _value(choices[0])

        if "which trial do you want to use" in msg:
            state["trial_select_count"] = state.get("trial_select_count", 0) + 1
            if state["trial_select_count"] == 1:
                # First call: pick the top Pareto trial (first Choice that isn't 'continue'/'').
                for c in choices:
                    v = _value(c)
                    if v not in ("continue", ""):
                        print(f"[heretic_driver] -> picking best trial: {_title(c)}",
                              flush=True)
                        return v
                return _value(choices[0])
            else:
                # Second call: we've already saved. Exit.
                print("[heretic_driver] -> exiting trial menu", flush=True)
                return ""

        if "decensored model" in msg or "what do you want to do" in msg:
            state["action_count"] = state.get("action_count", 0) + 1
            if state["action_count"] == 1:
                # First action: save.
                for c in choices:
                    t = _title(c).lower() if _title(c) else ""
                    if "save" in t and "local" in t:
                        print("[heretic_driver] -> Save to local folder", flush=True)
                        return _value(c)
                return _value(choices[0])
            else:
                # Already saved. Return to trial menu.
                for c in choices:
                    t = _title(c).lower() if _title(c) else ""
                    if "return" in t:
                        print("[heretic_driver] -> Return to trial menu", flush=True)
                        return _value(c)
                return _value(choices[-1])

        if "merge" in msg or "proceed" in msg:
            # Merge strategy. Pick "merge".
            for c in choices:
                v = _value(c)
                if v == "merge":
                    return "merge"
            return _value(choices[0])

        # Fallback: pick the first choice.
        print(f"[heretic_driver] -> fallback first choice", flush=True)
        return _value(choices[0])

    def patched_prompt_path(message):
        print(f"[heretic_driver] prompt_path: {message} -> {args.output_dir}",
              flush=True)
        return args.output_dir

    def patched_prompt_text(message, default="", qmark="?", unsafe=False):
        print(f"[heretic_driver] prompt_text: {message} -> <empty>", flush=True)
        return default or ""

    hmain.prompt_select = patched_prompt_select
    hmain.prompt_path = patched_prompt_path
    hmain.prompt_text = patched_prompt_text

    # Also patch in utils module, in case it's referenced dynamically somewhere.
    import heretic.utils as hutils
    hutils.prompt_select = patched_prompt_select
    hutils.prompt_path = patched_prompt_path
    hutils.prompt_text = patched_prompt_text

    # Run heretic's main.
    print(f"[heretic_driver] starting heretic on {args.model}", flush=True)
    try:
        hmain.main()
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else 0
        print(f"[heretic_driver] heretic exited with code {code}", flush=True)
        sys.exit(code)
    print(f"[heretic_driver] heretic completed; model saved to {args.output_dir}",
          flush=True)


if __name__ == "__main__":
    main()
