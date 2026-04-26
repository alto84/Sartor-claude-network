#!/usr/bin/env python
"""
Bloom — orchestrate 7 passes against the local DeepSeek-V4-Flash OpenAI endpoint.
Captures per-pass metrics (tokens, tok/s, GPU temp/power peaks).
"""
import json
import os
import re
import subprocess
import sys
import time
import threading
import urllib.request
import urllib.error
from pathlib import Path

API_BASE = "http://localhost:8001/v1"
MODEL_ID = None  # discovered at runtime
BUILD = Path("/home/alton/models/deepseek-v4-flash/build")
METRICS_PATH = BUILD / "metrics.jsonl"
SYSTEM_PROMPT = ("You are an expert vanilla-JS creative coder. "
                 "Output ONLY the HTML file content, no markdown fences, no commentary. "
                 "The output should be valid HTML5 starting with <!DOCTYPE html>.")

GAME_SPEC = """TITLE: "Bloom — a procedural calligraphy garden"

A meditative single-page HTML/CSS/JS web app, no external dependencies (no CDN, no libraries; vanilla JS only).

Behavior:
- Full-screen canvas with a procedurally rendered parchment background (subtle Perlin noise + warm cream tone).
- Mouse-drag: draws an ink calligraphy stroke. The stroke follows the cursor with smoothed Catmull-Rom or quadratic spline; line width modulates with stroke speed (slow = thick, fast = thin), simulating brush pressure.
- When the user releases the mouse, the just-drawn stroke "blooms" over 4-6 seconds: petal-like organic shapes grow outward from the stroke path, then settle. Petals use the same ink color but with translucent layered overlap.
- Color palette: cycles through 4 traditional Sumi-e accents — deep ocean indigo, plum, soft gold, sage. Each new stroke picks the next color.
- Audio: each stroke triggers a koto-style soft pluck via Web Audio API. Pentatonic tuning (A minor pent: A C D E G). Pitch chosen by stroke vertical midpoint (high stroke = high note). Bloom-completion adds a faint sustained pad chord.
- Persistence: garden accumulates up to 40 blooms; when 41st is added, the oldest gently fades out (3 second alpha fade) and is removed.
- Easter egg: a near-circular stroke (path length / endpoint-distance ratio > 6, suggesting closure) blooms as a lotus instead — radial 8-petal symmetry, gold-trimmed.
- Aesthetic: minimal UI (no menus, no buttons), no text instructions on screen — discoverable through play. Subtle vignette at edges.

Code constraints:
- Single .html file, < 800 lines total.
- Inline <style> and <script>.
- No console.errors in normal play.
- Works in modern Chrome/Firefox without Flash/WebGL extensions.
- Touch events also wire up (mobile-friendly).
"""


def discover_model_id():
    global MODEL_ID
    req = urllib.request.Request(API_BASE + "/models")
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.load(resp)
    MODEL_ID = data["data"][0]["id"]
    print(f"discovered model id: {MODEL_ID}", flush=True)
    return MODEL_ID


def gpu_sample():
    try:
        out = subprocess.check_output(
            ["nvidia-smi",
             "--query-gpu=index,temperature.gpu,power.draw,memory.used,utilization.gpu",
             "--format=csv,noheader,nounits"],
            timeout=5,
        ).decode()
        rows = []
        for line in out.strip().split("\n"):
            parts = [x.strip() for x in line.split(",")]
            rows.append({
                "idx": int(parts[0]),
                "temp_c": float(parts[1]),
                "power_w": float(parts[2]) if parts[2] not in ("[N/A]", "N/A") else 0.0,
                "mem_mib": float(parts[3]),
                "util_pct": float(parts[4]),
            })
        return rows
    except Exception as e:
        return [{"err": str(e)}]


class GpuPeakSampler:
    """Background thread that samples nvidia-smi every 2s, tracks peaks."""

    def __init__(self):
        self.peaks = {}  # idx -> {"temp_c": peak, "power_w": peak}
        self.running = False
        self.thread = None
        self.thermal_alert = False

    def _loop(self):
        while self.running:
            for g in gpu_sample():
                if "err" in g:
                    continue
                idx = g["idx"]
                self.peaks.setdefault(idx, {"temp_c": 0, "power_w": 0})
                self.peaks[idx]["temp_c"] = max(self.peaks[idx]["temp_c"], g["temp_c"])
                self.peaks[idx]["power_w"] = max(self.peaks[idx]["power_w"], g["power_w"])
                if g["temp_c"] > 88:
                    self.thermal_alert = True
            time.sleep(2)

    def start(self):
        self.peaks = {}
        self.running = True
        self.thermal_alert = False
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        return dict(self.peaks)


def chat_completion(messages, max_tokens=8192, temperature=0.3):
    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        API_BASE + "/chat/completions",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=900) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTPError {e.code}: {body[:1000]}")
    wall = time.time() - t0
    return data, wall


def extract_html(text):
    """Strip markdown fences if any."""
    t = text.strip()
    if t.startswith("```html"):
        t = t[len("```html"):].lstrip()
    elif t.startswith("```"):
        t = t[3:].lstrip()
    if t.endswith("```"):
        t = t[:-3].rstrip()
    return t


def run_pass(name, user_prompt, output_filename, save_html=True, max_tokens=8192):
    print(f"\n=== PASS: {name} ===", flush=True)
    sampler = GpuPeakSampler()
    sampler.start()

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    try:
        data, wall = chat_completion(messages, max_tokens=max_tokens)
    finally:
        peaks = sampler.stop()

    if sampler.thermal_alert:
        print(f"[!] THERMAL ALERT during {name} — peak: {peaks}", flush=True)

    completion = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    pt = usage.get("prompt_tokens", 0)
    ct = usage.get("completion_tokens", 0)
    tps = ct / wall if wall > 0 else 0

    metric = {
        "pass": name,
        "ts": time.time(),
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "tok_per_sec": round(tps, 2),
        "wall_s": round(wall, 2),
        "gpu0_temp_c_peak": peaks.get(0, {}).get("temp_c"),
        "gpu1_temp_c_peak": peaks.get(1, {}).get("temp_c"),
        "gpu0_power_w_peak": peaks.get(0, {}).get("power_w"),
        "gpu1_power_w_peak": peaks.get(1, {}).get("power_w"),
        "thermal_alert": sampler.thermal_alert,
        "output_lines": len(completion.split("\n")),
    }
    with open(METRICS_PATH, "a") as f:
        f.write(json.dumps(metric) + "\n")

    if save_html:
        html = extract_html(completion)
        out = BUILD / output_filename
        with open(out, "w") as f:
            f.write(html)
        nlines = len(html.split("\n"))
        print(f"  saved {output_filename} ({nlines} lines, {ct} completion tokens, {wall:.1f}s, {tps:.1f} tok/s)", flush=True)
        if nlines < 50:
            print(f"  [!] WARN: output < 50 lines for {name}", flush=True)
        return html, metric, nlines

    return completion, metric, len(completion.split("\n"))


def main():
    discover_model_id()

    # Health check
    print("=== HEALTH CHECK ===", flush=True)
    h_msgs = [{"role": "user", "content": "Reply with exactly the word ALIVE"}]
    h_data, h_wall = chat_completion(h_msgs, max_tokens=8)
    h_text = h_data["choices"][0]["message"]["content"].strip()
    print(f"  health response: {h_text!r} ({h_wall:.2f}s)", flush=True)
    if "ALIVE" not in h_text.upper():
        raise RuntimeError(f"health check failed: {h_text!r}")

    # Reset metrics file
    METRICS_PATH.unlink(missing_ok=True)

    # === Pass 1: skeleton ===
    p1_html, _, _ = run_pass(
        "skeleton",
        f"""Build the SKELETON of this single-file HTML/CSS/JS web app. We will iterate in subsequent passes; for THIS pass deliver only:

- HTML5 doctype + minimal head (title, meta viewport)
- Inline <style>: full-page reset, body covers viewport, canvas#bloom fills the viewport
- Inline <script>: get canvas, set canvas size to window inner dims, attach window resize handler that re-fits the canvas, and a parchment background renderer that draws warm cream + subtle Perlin-style noise across the canvas (use a small pseudo-noise function — no libraries). Re-render parchment on resize.
- requestAnimationFrame loop placeholder (no animation yet — will add later).
- A few const declarations at the top for design tokens (colors, durations) we'll fill in later.

Spec for the full project (so you know what is coming):

{GAME_SPEC}

Output ONLY the HTML file content.""",
        "bloom-v1-skeleton.html",
    )

    # === Pass 2: stroke engine ===
    p2_html, _, _ = run_pass(
        "stroke-engine",
        f"""Take this v1 skeleton and ADD the stroke drawing engine:

- Mouse-drag tracking (mousedown/mousemove/mouseup), maintaining an array of points for the active stroke
- Smooth the stroke path with quadratic spline interpolation between points
- Modulate line width with cursor speed: slow = thick (e.g. 14 px), fast = thin (e.g. 2 px); use exponential moving average so width transitions are smooth
- Render the active stroke during drag so the user sees ink trail in real time
- On mouseup, finalize the stroke into a "completed strokes" array (the bloom animation will read this in the next pass)
- Touch events (touchstart/touchmove/touchend) also map to the same pipeline

Keep the pass-1 parchment, resize handler, and requestAnimationFrame loop intact. Stroke color: use a single ink color for now (#1a2540 — deep indigo); palette cycling comes later.

Full project spec for context:

{GAME_SPEC}

Here is the v1 file:

{p1_html}

Output ONLY the updated HTML file content.""",
        "bloom-v2-strokes.html",
    )

    # === Pass 3: bloom animation ===
    p3_html, _, _ = run_pass(
        "bloom-animation",
        f"""Take this v2 file and ADD the bloom animation that fires on stroke-release:

- When a stroke completes (mouseup/touchend), schedule a "bloom" tied to that stroke
- The bloom grows over 4-6 seconds (use easing — e.g. easeOutQuad on growth, easeInOutSine on settle)
- Petal-like organic shapes emerge outward from the stroke path: e.g. 5-9 petals per stroke, distributed along the stroke length, each petal an organic curved shape (use bezier curves with slight randomization)
- Petals are drawn in the same ink color as the stroke but with low alpha (0.12-0.22), and they layer translucently so overlapping petals deepen color
- Animate via the existing requestAnimationFrame loop: maintain an array of active blooms, each with start time + duration; in each frame, redraw parchment, redraw all completed strokes (the ink), then redraw all blooms at their current animation phase
- After bloom completes, the petals stay rendered (not yet faded — fade-out comes in the polish pass)

Keep all v2 functionality (drawing, smoothing, touch). The visual order each frame: parchment background → completed strokes → blooms → in-progress stroke (if drawing).

Full project spec for context:

{GAME_SPEC}

Here is the v2 file:

{p2_html}

Output ONLY the updated HTML file content.""",
        "bloom-v3-blooms.html",
    )

    # === Pass 4: color cycling + lotus easter egg ===
    p4_html, _, _ = run_pass(
        "color-lotus",
        f"""Take this v3 file and ADD:

1. Palette cycling — 4 traditional Sumi-e accents in this exact order, advance one position per stroke:
   - deep ocean indigo (#1a2540)
   - plum (#552243)
   - soft gold (#a07a2c)
   - sage (#5a6e4a)
   The active stroke + its bloom inherit the same color.

2. Lotus easter egg — when a finished stroke is "near-circular" (path length / endpoint-distance ratio > 6), instead of the standard organic-petal bloom, render a LOTUS bloom: 8-petal radial symmetry centered on the stroke's centroid; gold-trimmed petals (use the soft-gold palette color #a07a2c for the trim regardless of the stroke's own color, with the stroke's own color as the petal fill at low alpha); same 4-6 second growth animation; same easing. The lotus is the easter egg — do NOT cycle the palette index when a stroke triggers a lotus (so the next non-lotus stroke gets the color the lotus would have had).

Keep all v3 behavior (parchment, stroke engine, bloom rendering pipeline, touch). Make sure the path-length / endpoint-distance check uses the smoothed stroke path, not the raw event points.

Full project spec for context:

{GAME_SPEC}

Here is the v3 file:

{p3_html}

Output ONLY the updated HTML file content.""",
        "bloom-v4-color-lotus.html",
    )

    # === Pass 5: audio ===
    p5_html, _, _ = run_pass(
        "audio",
        f"""Take this v4 file and ADD Web Audio API integration:

- Lazy-init AudioContext on first user gesture (since AudioContext can't auto-start without user interaction)
- On stroke-START (mousedown / touchstart), trigger a single koto-style pluck:
  - Pentatonic A-minor pent scale frequencies in Hz: A=220, C=261.63, D=293.66, E=329.63, G=392.00 (and their octave-up variants 440, 523.25, 587.33, 659.25, 783.99)
  - Pitch chosen by stroke-START vertical position: y near 0 → high octave-up note; y near canvas height → low octave note
  - Use OscillatorNode with a brief frequency sweep + GainNode envelope (attack 5ms, exponential decay over ~1.2s) for the pluck timbre. Add a touch of low-pass filter for warmth.
- On bloom-COMPLETION (when the bloom animation finishes), play a faint sustained pad chord:
  - Three notes from the same pentatonic set, root + 3rd + 5th, lower octave
  - Slow attack (~600ms), sustained for ~3s, gentle release
  - Mix at low gain so it's faint background; multiple overlapping pads should not clip — use a master limiter or simple soft-clip on the output

Keep all v4 behavior intact. Do not break the visual pipeline; audio is additive.

Full project spec for context:

{GAME_SPEC}

Here is the v4 file:

{p4_html}

Output ONLY the updated HTML file content.""",
        "bloom-v5-audio.html",
    )

    # === Pass 6: polish ===
    p6_html, _, _ = run_pass(
        "polish",
        f"""Take this v5 file and ADD the polish layer:

1. Persistence cap of 40 blooms — when a 41st bloom is added, the OLDEST bloom (and its underlying stroke) gently fades out over 3 seconds (alpha lerps to 0) and is then removed from the arrays. Implement the fade as an additional state on each bloom/stroke pair.

2. Subtle edge vignette — render after blooms each frame: radial-gradient-like darkening at the canvas edges (you can use createRadialGradient or a simple per-frame edge-shader-in-2D). Keep it subtle: max alpha ~0.18 at corners, near 0 at center.

3. Touch events — confirm they were wired in earlier passes; if they aren't fully equivalent to mouse events (single-finger only, prevent default to avoid scroll), make them so. Two-finger gestures should not fire spurious strokes.

4. Bug sweep — make sure no console.errors fire in normal play. Specifically:
   - AudioContext is created lazily on first interaction (not at page load)
   - Resize handler doesn't break in-progress strokes (cancel any active stroke on resize, or reproject — your call but be deliberate)
   - The animation loop never accesses arrays out of bounds when the persistence cap evicts a bloom mid-frame

Keep all v5 behavior. Output the COMPLETE final file (this is the v6 polished version; one more self-audit pass will follow).

Full project spec for context:

{GAME_SPEC}

Here is the v5 file:

{p5_html}

Output ONLY the updated HTML file content.""",
        "bloom-v6-polish.html",
    )

    # === Pass 7: self-audit ===
    print("\n=== SELF-AUDIT PASS ===", flush=True)
    audit_resp, audit_metric, audit_lines = run_pass(
        "self-audit",
        f"""Audit the following HTML file for bugs, missing features per the spec, and code quality issues. List up to 8 specific issues. Then write the fixed final file.

Spec (for reference):

{GAME_SPEC}

The file to audit:

{p6_html}

Output format — first a section starting with `<!--` containing the audit list (max 8 issues), then the corrected HTML5 file starting with `<!DOCTYPE html>`. The HTML5 file must be the FINAL, CORRECTED version that addresses the issues you found. Do NOT include markdown fences.""",
        "bloom.html",
        max_tokens=12000,
    )

    # Strip the audit comment if it's there but ensure DOCTYPE is at the top
    final_path = BUILD / "bloom.html"
    final_html = final_path.read_text()
    # Find <!DOCTYPE
    idx = final_html.lower().find("<!doctype")
    if idx > 0:
        # Save the audit prelude separately
        prelude = final_html[:idx].strip()
        if prelude:
            (BUILD / "self-audit.txt").write_text(prelude)
        final_html = final_html[idx:]
        final_path.write_text(final_html)
        print(f"  separated audit prelude to self-audit.txt; bloom.html now starts at <!DOCTYPE")

    print("\n=== BUILD DONE ===", flush=True)


if __name__ == "__main__":
    main()
