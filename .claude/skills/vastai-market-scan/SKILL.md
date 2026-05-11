---
name: vastai-market-scan
description: Use when validating a vast.ai listing price for a Sartor GPU host (gpuserver1, rtxserver, future) — pulls live market comps from vast.ai search-offers via gpuserver1's authenticated CLI, with the VRAM-filter fallback that catches GPUs the gpu_name field doesn't match. Invoke before listing a new card, before raising/lowering an existing listing, or any time someone asks "what's the going rate for X?". 5-10 min wall-clock.
---

# vastai-market-scan — pull live competitor prices for any GPU class

The 2026-05-02 method developed when the gpuserver1 peer's first try at `vastai search offers gpu_name=RTX_PRO_6000` returned empty. The CLI's gpu_name field uses a specific string set that doesn't match all variants — but the per-GPU-VRAM filter is reliable and tells you the actual `gpu_name` strings vast.ai uses, which you can then narrow further.

## When this applies

- About to list a new Sartor GPU host on vast.ai and need a defensible price
- Reviewing an existing listing's positioning vs current market (weekly pricing review per `feedback/feedback_pricing_autonomy.md`)
- Answering Alton's "what's the going rate for X?" or "is our price competitive?" mid-conversation
- Validating a peer Claude's pricing recommendation against fresh data

Skip for: anything the rtxserver / gpuserver1 peer can answer faster from its own state, OR if the price was just verified within the last 24h.

## Ground truth: GPU-name strings vast.ai actually uses (as of 2026-05-02)

| Card | vast.ai `gpu_name` (CLI filter) | vast.ai display label |
|---|---|---|
| RTX 5090 | `RTX_5090` | RTX 5090 |
| RTX 4090 | `RTX_4090` | RTX 4090 |
| H100 SXM | `H100_SXM` | H100 SXM |
| H100 PCIe | `H100_PCIE` | H100 PCIE |
| H200 | `H200` | H200 |
| B200 | `B200` | B200 |
| RTX PRO 6000 Workstation | (none — string mismatch) | `RTX PRO 6000 WS` |
| RTX PRO 6000 Server | (none — string mismatch) | `RTX PRO 6000 S` |
| A100 80GB | `A100_SXM_80GB` or `A100_PCIE_80GB` | A100 SXM 80GB / A100 PCIE 80GB |

**The PRO 6000 Blackwell variants don't filter cleanly via gpu_name.** Use the VRAM-filter workaround below.

## Method A — when gpu_name works

```bash
# From Rocinante (or any machine with vastai CLI authed)
ssh alton@gpuserver1 '~/.local/bin/vastai search offers \
  "gpu_name=RTX_5090 num_gpus=1 verified=true rentable=true" \
  -o "dph_total"' \
  | head -20
```

`-o "dph_total"` sorts ascending by total $/hr. Check the median, the cheapest 25th-percentile, and the most-expensive 25th-percentile to bracket positioning.

## Method B — VRAM-filter fallback (when gpu_name returns empty)

Some GPU classes (notably the PRO 6000 Blackwell variants) have a `gpu_name` string that doesn't match anything searchable. Use per-GPU VRAM as the discriminator, then group results by the `gpu_name` field as it actually appears in the JSON:

```bash
ssh alton@gpuserver1 '~/.local/bin/vastai search offers \
  "gpu_ram>=96 verified=true rentable=true" --raw' \
  | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
seen = {}
for o in data[:100]:
    key = (o.get(\"gpu_name\"), o.get(\"num_gpus\"))
    seen.setdefault(key, []).append(o)
for (name, n), offers in sorted(seen.items()):
    prices = sorted([o[\"dph_total\"] for o in offers])
    median = prices[len(prices)//2]
    print(f\"{name} x{n}: count={len(offers):3d}  range=\${prices[0]:.2f}-\${prices[-1]:.2f}/hr  median=\${median:.2f}\")
"
```

VRAM thresholds that pick out a clean class:
- `gpu_ram>=96`: RTX PRO 6000 Blackwell (any variant), B200 single, H200 single
- `gpu_ram>=80`: + H100 80GB, A100 80GB
- `gpu_ram>=140`: B200 only, H200 only

## Method C — Chrome MCP via the web UI (verified 2026-05-02)

Use this when the CLI doesn't have a matching `gpu_name` string AND you want a live, broader picture (the web UI shows unverified + non-rentable listings the CLI's `verified=true rentable=true` excludes — these often cluster at the low end and pull the median down).

The page is `https://cloud.vast.ai/`. The GPU filter is a MUI Select-multiple combobox that's NOT addressable via `form_input` (it's a DIV, not a real `<select>`). The recipe that works:

```javascript
// 1. Open the combobox — needs mousedown + click, plain click alone may not open MUI Selects
const cb = Array.from(document.querySelectorAll('[role="combobox"]'))
  .find(el => el.classList.contains('MuiSelect-multiple') && /GPUs?$/.test(el.innerText));
cb.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
cb.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, button: 0}));
cb.click();
// wait ~500ms for listbox to render

// 2. Type into the "Search for GPUs" input to narrow options
const search = Array.from(document.querySelectorAll('input'))
  .find(i => i.placeholder === 'Search for GPUs');
const setNative = (el, val) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new Event('input', {bubbles: true}));
};
setNative(search, 'PRO 6000');
// wait ~500ms

// 3. Toggle checkboxes via the LABEL element (NOT the option role — those don't intercept clicks).
//    Each variant (Workstation, Server, Max-Q) has its own checkbox; default state has all 3 checked.
const labels = Array.from(document.querySelectorAll('label.MuiFormControlLabel-root'))
  .filter(l => l.offsetParent && /RTX PRO 6000 Blackwell/.test(l.innerText) && l.innerText.length < 60);
for (const l of labels) {
  const want = /Workstation/.test(l.innerText.trim());  // or whatever variant
  const checkbox = l.querySelector('input[type=checkbox]');
  if (checkbox.checked !== want) l.click();
}

// 4. Close the listbox with Escape
document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true}));

// 5. Set GPU count via the .gpucount_buttons row (ANY/1X/2X/4X/8X/9X+ as <button> elements)
const twoX = Array.from(document.querySelectorAll('.gpucount_buttons button'))
  .find(b => b.innerText.trim() === '2X');
twoX.click();
// wait ~1500ms for results to refresh

// 6. Scrape prices from the page text (the result rows render "$X.XX/hr" inline)
const prices = [...document.body.innerText.matchAll(/\$(\d+\.\d{2,3})\s*\/\s*hr/gi)]
  .map(m => parseFloat(m[1]))
  .sort((a,b) => a-b);
```

**Critical detail**: clicking the `<label>` element toggles the underlying checkbox via MUI's event handler. Clicking the `[role="option"]` elements directly was unreliable in 2026-05-02 testing.

**Defaults to know**: When you open the GPU filter for the first time, the variant subgroup may have ALL N variants checked by default (e.g., all 3 Blackwell variants). After clicking "Workstation" once you may UNCHECK it (it was checked) instead of selecting only it. Always read back the checkbox state and toggle deliberately, don't assume.

## Output format expected by Alton

Always close with a structured table he can scan:

```
| Stat | Value |
|---|---|
| Active listings | N |
| Price range | $low – $high/hr |
| Median | $median/hr |
| Your target | $target/hr |
| Percentile | "75th = +17% above median, -15% below ceiling" |
```

Plus 3 short bullets:

- **Why the spec sheet justifies upper-mid:** [the specific Sartor advantages — CPU class, RAM, PCIe gen, NUMA, location]
- **Realized-vs-listed reality:** under reserved contracts, Sartor sees ~$0.20 realized vs $0.30 listed on gpuserver1 — about a 33% discount. Apply that ratio to estimate revenue at the proposed listed rate.
- **Adjustment recommendation:** specific increment (e.g., "list at $2.50, drop to $2.25 if no rent in 7 days, hold if rented in <48h").

## Reference data points (snapshots — refresh when stale)

### 2026-05-02 dual-card market

| Class | Source | Listings | Range | Median |
|---|---|---|---|---|
| RTX PRO 6000 WS x2 | CLI (verified+rentable) | 6 | $1.74 – $2.93/hr | $2.14 |
| RTX PRO 6000 WS x2 | Web UI (broader filter) | 10 | $1.85 – $2.72/hr | ~$2.00 |
| RTX PRO 6000 S x2 | CLI | 9 | $1.47 – $3.20/hr | $2.35 |
| RTX 5090 x2 | (varies — query directly) | — | — | — |
| H200 x2 | CLI | 0 active at scan time | — | — |
| B200 x2 | CLI | 1 | $8.13 | $8.13 |

**Method-A vs Method-C divergence**: Web UI median was $0.14 lower than CLI median for the same dual-WS class (4 unverified/non-rentable listings the CLI excluded clustered at the low end). When the question is "what would a renter actually book at?", the CLI is more honest. When the question is "what's the visible market floor that we're competing against on the search page?", the UI is more honest. Both are useful; cite which one you used.

### 2026-05-02 gpuserver1 (RTX 5090 x1) live state

- Listed: $0.30/hr on-demand, $0.25/hr interruptible floor
- Realized under reserved contract C.34113802: ~$0.20/hr
- Discount ratio: 33% (listed → realized for long-term)
- Listing end_date: 2026-10-24

## Failure modes

| Symptom | Diagnosis | Fix |
|---|---|---|
| `Error: Unknown operator` from `gpu_name~=foo` | Tilde isn't a valid operator on this CLI version | Use `=` only; if no match, switch to Method B (VRAM filter) |
| All variants return only headers, no rows | `gpu_name` strings don't match | Method B |
| Method B returns empty | `gpu_ram` cutoff too high or `verified=true` excluding everything | Lower the VRAM threshold by 16 GB or drop `verified=true` |
| `vastai` CLI not found / unauthed on the target machine | Setup gap | Run from gpuserver1 (always authed); rtxserver CLI install is in `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` |
| 500.farm dashboard cited but not used | The 500.farm market-stats site is a useful cross-check but slower than the CLI | Use only when CLI methods both fail OR when you specifically want occupancy stats, not just price |

## After the scan

If the recommendation results in a real listing/repricing action:
1. Capture the scan date + raw numbers in the file you write the decision to (so future-you can detect drift if the scan is referenced later)
2. Update `MACHINES.md` and `business/solar-inference.md` if the listed price actually changes
3. If significant market shift detected (median moved >15% since last scan), file an inbox memo to `inbox/rocinante/<TS>-vastai-market-shift-<class>.md`

## History

- 2026-05-02 (Rocinante Opus 4.7): Created after dual-RTX-PRO-6000-Blackwell-WS pricing question for rtxserver. First gpuserver1 peer attempt with `gpu_name=RTX_PRO_6000` returned empty; Rocinante then ran VRAM-filter fallback (`gpu_ram>=96`) and recovered actual market data. Validated Alton's $2.50/hr target as 75th-percentile positioning. Skill captures the methodology so future pricing reviews don't repeat the gpu_name dead-end.
