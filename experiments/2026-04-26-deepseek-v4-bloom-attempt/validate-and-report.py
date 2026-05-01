#!/usr/bin/env python
"""
Bloom build validation + report writer.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

BUILD = Path("/home/alton/models/deepseek-v4-flash/build")
BLOOM = BUILD / "bloom.html"
METRICS = BUILD / "metrics.jsonl"
REPORT = BUILD / "REPORT.md"


def validate(html_text):
    issues = []
    n_lines = len(html_text.split("\n"))
    if n_lines < 200:
        issues.append(f"file < 200 lines (got {n_lines})")
    if n_lines > 800:
        issues.append(f"file > 800 lines (got {n_lines})")
    head = html_text.lstrip()[:200].lower()
    if not head.startswith("<!doctype"):
        issues.append("file does not start with <!DOCTYPE>")
    required = ["AudioContext", "requestAnimationFrame", "fillStyle", "beginPath"]
    for r in required:
        if r not in html_text:
            issues.append(f"missing required token: {r}")
    if ("mousemove" not in html_text) and ("pointermove" not in html_text):
        issues.append("missing mousemove and pointermove (drag tracking absent)")
    if re.search(r"^\s*import\s+", html_text, re.M):
        issues.append("contains ES module import statement")
    if "<script src=" in html_text:
        issues.append("contains <script src=…> remote include")
    return issues, n_lines


def maybe_screenshot():
    chrome_bin = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if not chrome_bin:
        return None, "chrome not found in PATH"
    out = BUILD / "screenshot.png"
    cmd = [
        chrome_bin, "--headless", "--disable-gpu", "--no-sandbox",
        f"--screenshot={out}",
        "--window-size=1280,800",
        f"file://{BLOOM}",
    ]
    try:
        result = subprocess.run(cmd, timeout=60, capture_output=True, text=True)
        if result.returncode != 0:
            return None, f"chrome rc={result.returncode}: {result.stderr[:300]}"
        if out.exists() and out.stat().st_size > 1000:
            return str(out), None
        return None, "screenshot file empty or missing"
    except Exception as e:
        return None, str(e)


def main():
    if not BLOOM.exists():
        print("ERROR: bloom.html not found", file=sys.stderr)
        sys.exit(2)

    html = BLOOM.read_text()
    issues, n_lines = validate(html)

    print(f"=== Bloom static validation ===")
    print(f"  lines: {n_lines}")
    if issues:
        print(f"  issues ({len(issues)}):")
        for it in issues:
            print(f"    - {it}")
    else:
        print(f"  no issues found")

    shot_path, shot_err = maybe_screenshot()
    print(f"\n=== Screenshot ===")
    if shot_path:
        print(f"  saved: {shot_path}")
    else:
        print(f"  skipped: {shot_err}")

    # Aggregate metrics
    metrics = []
    if METRICS.exists():
        with open(METRICS) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                metrics.append(json.loads(line))

    total_prompt = sum(m.get("prompt_tokens", 0) for m in metrics)
    total_completion = sum(m.get("completion_tokens", 0) for m in metrics)
    total_wall = sum(m.get("wall_s", 0) for m in metrics)
    avg_tps = total_completion / total_wall if total_wall > 0 else 0
    peak_g0_temp = max((m.get("gpu0_temp_c_peak") or 0) for m in metrics) if metrics else 0
    peak_g1_temp = max((m.get("gpu1_temp_c_peak") or 0) for m in metrics) if metrics else 0
    peak_g0_pwr = max((m.get("gpu0_power_w_peak") or 0) for m in metrics) if metrics else 0
    peak_g1_pwr = max((m.get("gpu1_power_w_peak") or 0) for m in metrics) if metrics else 0

    # Per-pass table
    rows = []
    for m in metrics:
        rows.append(
            f"| {m['pass']} | {m.get('prompt_tokens', 0)} | {m.get('completion_tokens', 0)} "
            f"| {m.get('tok_per_sec', 0):.1f} | {m.get('wall_s', 0):.1f} "
            f"| {m.get('gpu0_temp_c_peak', '—')} / {m.get('gpu1_temp_c_peak', '—')} "
            f"| {m.get('gpu0_power_w_peak', '—')} / {m.get('gpu1_power_w_peak', '—')} "
            f"| {m.get('output_lines', '—')} |"
        )
    table = "\n".join(rows)

    issues_block = ("\n".join(f"- {it}" for it in issues)) if issues else "_(none — all static checks passed)_"
    shot_block = (f"![bloom screenshot]({shot_path})" if shot_path else f"_(skipped: {shot_err})_")

    md = f"""# DeepSeek-V4-Flash inference test — Bloom build report

Date: 2026-04-26
Hardware: rtxpro6000server, dual RTX PRO 6000 Blackwell, FP8 native weights
Model: DeepSeek-V4-Flash (deepseek_v4 architecture; 43 hidden layers, 256 routed experts, 6 active per token)

## Headline

| Metric | Value |
|--------|-------|
| Total passes | {len(metrics)} |
| Total prompt tokens | {total_prompt:,} |
| Total completion tokens | {total_completion:,} |
| Total wall-clock | {total_wall:.1f}s |
| Average tok/sec (completion) | {avg_tps:.1f} |
| Peak GPU0 temp / power | {peak_g0_temp} °C / {peak_g0_pwr} W |
| Peak GPU1 temp / power | {peak_g1_temp} °C / {peak_g1_pwr} W |

## Per-pass metrics

| Pass | prompt_tok | completion_tok | tok/s | wall_s | peak_temp 0/1 (°C) | peak_pow 0/1 (W) | output_lines |
|------|-----------:|---------------:|------:|-------:|---------------------|-------------------|---------------:|
{table}

## Static validation of bloom.html

- lines: **{n_lines}**
- issues:

{issues_block}

## Headless Chrome screenshot

{shot_block}

## Top observations about DeepSeek-V4-Flash code generation quality

(Filled in after pipeline completes — see PHONE-HOME for narrative.)

## Reproducibility

- Build dir: `/home/alton/models/deepseek-v4-flash/build/`
- Final file: `bloom.html` (this file's static validation summary above)
- Intermediates: `bloom-v1-skeleton.html` through `bloom-v6-polish.html`
- Metrics: `metrics.jsonl`
- Screenshot: `screenshot.png` (if Chrome available)
- Self-audit prelude (from pass 7): `self-audit.txt`
"""
    REPORT.write_text(md)
    print(f"\nwrote {REPORT}")
    print(f"\nValidation status: {'PASS' if not issues else 'FAIL'}")


if __name__ == "__main__":
    main()
