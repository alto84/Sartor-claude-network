---
title: "MERIDIAN Overnight Upgrade Plan: Hermes-Inspired Visual Overhaul"
type: project
project: hermes-dashboard-upgrade
phase: overnight-build
created: 2026-04-11
updated: 2026-04-11
estimated_hours: 4-5
---

# MERIDIAN Overnight Upgrade Plan

Scope: one implementation session (4-5 hours of agent time). Alton wakes up to a visually transformed dashboard with the same backend, same endpoints, same data, and zero regressions.

---

## Section 1: Overnight Scope (What We Are Building)

Ranked by visual impact and dependency order. Everything below is achievable tonight.

### 1. CSS Variable Theming System + New Themes (~200 LOC CSS, ~40 LOC JS) -- 45 min

**What:** Extract Hermes's `data-theme` + CSS variable pattern. Replace MERIDIAN's current 2-theme system (which uses 11 CSS variables) with a 25-variable system supporting 3 themes: `dark` (current default, refined), `light` (existing, refined), and `midnight` (new, deep navy/amber accent inspired by Hermes Classic).

**Current state:** MERIDIAN already uses `data-theme="dark"` / `data-theme="light"` on `<html>` and persists via `localStorage('meridian-theme')`. The variable names (`--bg`, `--bg-card`, etc.) are close to Hermes's but miss: `--bg-card-alt`, `--accent-subtle`, `--accent-glow`, `--shadow-glow`, `--border-subtle`. The light theme is incomplete (missing `--accent-dim`, no shadow adjustments).

**Plan:**
- Expand `:root` from 11 to ~25 CSS variables (add: `--accent-subtle`, `--accent-glow`, `--shadow-glow`, `--border-subtle`, `--bg-card-alt`, `--text-accent`, `--success`, `--warning`, `--danger`)
- Add `[data-theme="midnight"]` block with deep navy palette + amber accent
- Refine `[data-theme="light"]` with proper shadow, accent-subtle, and border-subtle values
- Add `.kpi-card`, `.kpi-card-label`, `.kpi-card-value`, `.kpi-card-trend` utility classes (port directly from Hermes `styles.css:102-140`)
- Add hover glow effect on cards for dark/midnight themes (port from Hermes `styles.css:142-150`)
- Expand `toggleTheme()` to cycle: dark -> midnight -> light -> dark
- Theme selector shows current theme name in the header

**Hermes reference:** `/tmp/hermes-studio/src/styles.css:41-150`, `/tmp/hermes-studio/src/lib/theme.ts:129-143`

### 2. GlassCard Restyle + MetricTile Pattern (~300 LOC CSS, ~150 LOC JS) -- 60 min

**What:** Restyle all 14 dashboard cards with the GlassCard pattern: accent-color 2px top bar gradient, consistent padding, uppercase tracking title, titleRight slot. Convert GPU Status, API Costs, Heartbeat, System Status, and Memory Health sidebar into MetricTile-style KPI displays with label/value/sub layout.

**Current state:** All cards use `.card` class with identical styling. No accent colors, no visual hierarchy. Cards are uniform gray rectangles.

**Plan:**
- Add `.glass-card` CSS class with accent-color top bar via `::before` pseudo-element
- Each card gets a unique accent color:
  - Family: `#3b82f6` (blue)
  - Finances: `#22c55e` (green)
  - Daily Tasks: `#f59e0b` (amber)
  - Work Streams: `#8b5cf6` (purple)
  - Active Tasks: `#6366f1` (indigo)
  - Deadlines: `#ef4444` (red)
  - Quick Links: `#06b6d4` (cyan)
  - System Status: `#14b8a6` (teal)
  - Heartbeat: `#ec4899` (pink)
  - Memory Health: `#a855f7` (purple)
  - Observer: `#84cc16` (lime)
  - Career: `#f97316` (orange)
  - API Costs: `#eab308` (yellow)
  - GPU Control: `#10b981` (emerald)
- Add `createGlassCard(title, icon, accentColor, content)` JS helper that generates the HTML structure
- Add `createMetricTile(label, value, sub, icon)` JS helper for KPI displays
- Heartbeat card: show last-run time as main value, status as sub
- System Status: show GPU ping as main value, file counts as sub
- API Costs: show monthly total as main value, trend as sub

**Hermes reference:** `/tmp/hermes-studio/src/screens/dashboard/dashboard-screen.tsx:35-83` (GlassCard), `:158-192` (MetricTile)

### 3. Remove Duplicate Top-Panel Memory Graph (~-300 LOC) -- 20 min

**What:** Remove the top-panel `renderGraph()` instance (lines 3432-3730 in index.html) and the `graph-panel` HTML block. The Memory Tab graph (`renderMemGraph()`) is the canonical version with Obsidian integration. The freed vertical space lets the main grid sit higher, reducing scroll distance.

**Current state:** Two independent D3 force-directed graph instances. Both call `/api/memory-graph`. The top-panel version at line 3432 is 298 lines of near-duplicate code. The Memory Tab version at line 3744 has the Obsidian-open button and is the one users actually interact with.

**Plan:**
- Remove the `<div class="graph-panel">` block (HTML lines ~2131-2153)
- Remove `renderGraph()`, `refreshGraph()`, `toggleGraphSections()` and all associated state vars (`graphData`, `graphSim`, `showSections`, `graphRendered`)
- Remove the `.graph-panel`, `.graph-card`, `.graph-header`, `.graph-container`, `.graph-tooltip`, `.graph-legend`, `.graph-controls`, `.graph-btn` CSS blocks
- Keep `renderMemGraph()` and all Memory Tab graph code untouched
- Remove `refreshGraph()` call from `refreshAll()`
- Net effect: ~300 fewer lines, ~520px of vertical space reclaimed

### 4. Command Palette (Ctrl+K) (~250 LOC JS, ~80 LOC CSS) -- 60 min

**What:** Global keyboard shortcut opens a full-screen overlay with fuzzy search across dashboard sections, Memory Tab sub-panels, and quick actions (toggle theme, open terminal, refresh data, GPU commands).

**Current state:** No navigation shortcut exists. Users scroll to find cards.

**Plan:**
- Port the `scoreCommandAction()` fuzzy scoring algorithm verbatim from Hermes `command-palette.tsx:75-104` (pure JS, no React dependency)
- Build overlay as a `<div id="commandPalette" class="cmd-palette">` with:
  - `<input>` for search query
  - `<div class="cmd-results">` for scored results
  - Grouped display: Sections, Memory Views, Actions, GPU Commands
- Keyboard handling:
  - `Ctrl+K` (not Cmd+K, this is Windows) toggles open/close
  - Arrow keys navigate, Enter selects, Escape closes
  - Type-ahead filters instantly using `scoreCommandAction()`
- Command registry (array of objects):
  - Navigate to card: scroll-into-view for each of the 14 cards
  - Navigate to Memory sub-tab: switch Memory Tab to Graph/Heatmap/Recent/Crons/Inbox/Search
  - Toggle theme (dark/midnight/light)
  - Toggle Claude terminal
  - Refresh all data
  - 8 GPU commands (from the allowlist)
- Visual: centered modal, 600px max-width, glass background blur, accent border, monospace search input
- Close on click outside or Escape

**Hermes reference:** `/tmp/hermes-studio/src/components/command-palette.tsx:75-104` (scoring), `:106-280` (UI pattern)

### 5. WebAudio Sound Notifications (~180 LOC JS, ~30 LOC CSS) -- 30 min

**What:** 7 synthesized sounds using Web Audio API, zero audio files. Wire to dashboard events for background-tab awareness.

**Current state:** No audio feedback whatsoever.

**Plan:**
- Port the entire Hermes `sounds.ts` (304 lines) to vanilla JS. This file has zero framework dependencies; the port is nearly verbatim. Remove TypeScript annotations.
- Wire events:
  - `agentComplete`: play on WebSocket Claude terminal response complete
  - `agentFailed`: play on WebSocket error
  - `chatNotification`: play on WebSocket tool-use block received
  - `alert`: play on GPU status change (online -> offline or vice versa)
  - `thinking`: play on Claude terminal "thinking" state (optional, subtle)
  - `chatComplete`: play when `refreshAll()` completes after data changes
- Add sound toggle button in header (speaker icon, toggles `prefs.enabled`)
- Persist volume + enabled state in `localStorage('meridian-sound-prefs')`
- Add volume slider in command palette under "Settings" group (stretch goal)

**Hermes reference:** `/tmp/hermes-studio/src/lib/sounds.ts:1-304` (copy verbatim, strip TS types)

### 6. Agent Status Strip (~100 LOC JS, ~60 LOC CSS) -- 30 min

**What:** Persistent thin bar above the header showing real-time system status: gpuserver1 connection, MERIDIAN auth mode, last data refresh, GPU rental status, memory file count.

**Current state:** gpuserver1 status is a single dot in the header. No persistent telemetry visibility.

**Plan:**
- Add `<div class="status-strip" id="statusStrip">` above `.header`
- 24px tall, monospace 9px text, theme-aware background (darker than header)
- Left section: `MERIDIAN v0.2` brand + current theme badge
- Center section: `GPU: ONLINE` or `GPU: OFFLINE` (polls `/api/gpu/status`), `RENTAL: ACTIVE` or `IDLE` (polls `/api/gpu/rental`), `MEMORY: 47 files` (from `/api/memory-health`)
- Right section: `LAST REFRESH: 14:32:05` (updates on `refreshAll()`), auth mode badge (`DEV` or `AUTH`)
- Status pips: green dot for connected, red for disconnected, amber for degraded
- Update every 60s alongside `refreshAll()`, plus GPU rental on its own 30s cycle (existing)
- On `midnight` theme: strip gets a subtle cyan glow effect

**Hermes reference:** `/tmp/hermes-studio/src/components/agent-status-strip.tsx:1-123` (layout pattern, StatusPip component)

### 7. Fix XSS in Claude Terminal renderMarkdown() (~10 LOC) -- 5 min

**What:** The `renderMarkdown()` function at index.html:3269 does not sanitize content within bold/italic regex replacements before setting innerHTML. If Claude output contains `**<img onerror=...>**`, it executes.

**Current state:** Code blocks are escaped via `escapeHTML()`, but bold (`**...**`) and italic (`*...*`) patterns pass inner content through unescaped.

**Plan:**
- In `renderMarkdown()`, after the code block replacement, escape the remaining text BEFORE applying bold/italic/inline-code regexes
- Specifically: apply `escapeHTML()` to the full string after code block extraction, then re-apply formatting regexes on the escaped output
- This ensures no raw HTML survives inside formatting markers

**Fix (exact):**
```javascript
// Current (vulnerable):
html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

// Fixed: escape non-code-block content first
var codeBlocks = [];
html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
  var placeholder = '%%CODEBLOCK_' + codeBlocks.length + '%%';
  codeBlocks.push('<pre>' + escapeHTML(code.trim()) + '</pre>');
  return placeholder;
});
html = escapeHTML(html);
html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
html = html.replace(/\n/g, '<br>');
for (var i = 0; i < codeBlocks.length; i++) {
  html = html.replace('%%CODEBLOCK_' + i + '%%', codeBlocks[i]);
}
```

### 8. Connection Health Overlay (~120 LOC JS, ~60 LOC CSS) -- 30 min

**What:** If the initial `refreshAll()` on page load fails to reach key services (gpuserver1 unreachable, API errors), show a diagnostic overlay instead of broken/empty panels. Progressive reveal: spinner for 3s, then status checklist for each service.

**Current state:** If gpuserver1 is down or server.py has an issue, cards silently show "Loading..." forever or display stale data. No user feedback.

**Plan:**
- Add `<div id="connectionOverlay" class="connection-overlay">` hidden by default
- On page load, run health checks in parallel:
  - `/api/greeting` (MERIDIAN server reachable)
  - `/api/gpu/status` (gpuserver1 reachable)
  - `/api/memory-health` (memory system working)
  - `/api/heartbeat-status` (cron system working)
- Display checklist with green/red/amber status pips for each
- If all pass: overlay never shows, normal load
- If any fail after 3s: show overlay with status, auto-retry every 5s
- Overlay includes: service name, status pip, last error message, "Retry Now" button
- Auto-dismiss when all services come online
- Does NOT block the page: user can click "Continue Anyway" to dismiss

**Hermes reference:** `/tmp/hermes-studio/src/components/connection-startup-screen.tsx:1-120` (polling pattern, progressive reveal timing)

---

## Section 2: Implementation Architecture

### CSS Variables (new file: `dashboard/family/meridian-theme.css`)

Create a separate CSS file to keep theme definitions maintainable. Load via `<link rel="stylesheet">` in index.html before the `<style>` block, so inline styles can override if needed.

Contents:
- `:root` with expanded 25-variable dark theme (default)
- `[data-theme="light"]` block
- `[data-theme="midnight"]` block (deep navy: `--bg: #0a0e1a`, `--accent: #f59e0b`, `--bg-card: #111827`)
- `.kpi-card`, `.kpi-card-label`, `.kpi-card-value`, `.kpi-card-trend` utility classes
- `.glass-card` with `::before` accent bar
- `.status-strip` styling
- `.cmd-palette` overlay styling
- `.connection-overlay` styling
- `.sound-toggle` button styling

The inline `<style>` block in index.html retains all component-specific CSS (family grid, finance tables, memory tab, graph, terminal, etc.) but references the new variables.

### GlassCard Templating in Vanilla JS

Replace the static `<div class="card">` HTML with dynamic generation. Each card's HTML becomes:

```javascript
function glassCard(title, icon, accentColor, id) {
  return '<div class="glass-card" style="--card-accent:' + accentColor + '">' +
    '<div class="glass-card-title">' +
      '<span class="glass-card-icon">' + icon + '</span> ' + title +
    '</div>' +
    '<div class="glass-card-body" id="' + id + '"></div>' +
  '</div>';
}
```

The `::before` pseudo-element reads `--card-accent` for its gradient. This avoids 14 separate CSS rules.

### Command Palette Integration

- Single `<div id="commandPalette">` appended to `<body>`, above all other content
- `z-index: 10000` to sit above everything including the terminal
- Event listener on `document` for `keydown`, checks `e.ctrlKey && e.key === 'k'`
- Commands array populated once at startup, static registry
- `scoreCommandAction()` copied from Hermes, stripped of TypeScript annotations
- Results rendered as `<div class="cmd-item">` elements, highlighted item gets `.cmd-active`
- Selection triggers: `element.scrollIntoView()` for cards, `switchMemTab()` for memory sub-panels, direct function calls for actions

### Sound Wiring to Existing Events

- WebSocket `onmessage`: parse message type, play `chatNotification` on tool blocks, `thinking` on reasoning
- WebSocket `onclose` after active conversation: play `chatComplete`
- WebSocket `onerror`: play `agentFailed`
- `refreshAll()` completion: if GPU rental status changed since last check, play `alert`
- Sound toggle button in header uses `setSoundEnabled()` / `isSoundEnabled()`
- All sound functions are defined in the `<script>` block of index.html (no separate file, keeps the single-file spirit for JS)

### Status Strip Reading from Existing Endpoints

No new backend endpoints needed. The strip reads from:
- `/api/gpu/status` -> `gpu_online` field -> GPU status pip
- `/api/gpu/rental` -> `online` + `rental_active` fields -> Rental status
- `/api/memory-health` -> `total` field -> Memory file count
- `/api/system` -> `gpu_reachable` field -> Secondary GPU check
- Auth mode: read from inline `_MERIDIAN_DEV` state or check if Basic auth header is present
- Last refresh: JS timestamp updated in `refreshAll()`

---

## Section 3: Files to Modify

### New file: `dashboard/family/meridian-theme.css`
- ~300 LOC
- All theme variable definitions, GlassCard CSS, KPI utility classes, status strip, command palette overlay, connection overlay, sound toggle
- Loaded via `<link>` in index.html `<head>`

### Modified: `dashboard/family/index.html` (~4030 LOC -> ~3900 LOC net)
Changes:
1. **`<head>`**: Add `<link rel="stylesheet" href="/meridian-theme.css">` before `<style>` block
2. **`<style>` block**: Remove `:root` and `[data-theme="light"]` variable definitions (moved to CSS file). Remove `.graph-panel`, `.graph-card`, `.graph-header`, `.graph-container`, `.graph-tooltip`, `.graph-legend`, `.graph-controls`, `.graph-btn` CSS rules. Remove `.card` base styles (replaced by `.glass-card`). Keep all component-specific CSS.
3. **Header HTML**: Add theme name display, sound toggle button, update theme toggle to cycle 3 themes
4. **Remove top-panel graph HTML** (lines ~2131-2153)
5. **Add status strip HTML** before `.header`
6. **Replace static card divs** with `id` attributes that `glassCard()` targets (or generate cards in JS on load)
7. **Add command palette HTML** at end of `<body>`
8. **Add connection overlay HTML** at end of `<body>`
9. **JS section**: 
   - Add `glassCard()` and `createMetricTile()` helpers
   - Add command palette logic (~250 LOC)
   - Add sound system (~180 LOC, ported from Hermes)
   - Add status strip update logic (~80 LOC)
   - Add connection overlay logic (~100 LOC)
   - Fix `renderMarkdown()` XSS (~15 LOC change)
   - Remove `renderGraph()`, `refreshGraph()`, `toggleGraphSections()` and state vars (~300 LOC removed)
   - Expand `toggleTheme()` to 3-theme cycle
   - Wire sounds to WebSocket events
   - Update `refreshAll()` to update status strip

Net LOC change: approximately -300 (graph removal) + 600 (new features) = +300 in index.html, +300 in new CSS file.

### Modified: `dashboard/family/server.py` (~1802 LOC -> ~1810 LOC)
Changes:
1. **Add static file serving** for `meridian-theme.css`:
   ```python
   from fastapi.staticfiles import StaticFiles
   app.mount("/static", StaticFiles(directory=str(BASE_DIR)), name="static")
   ```
   Or simpler: add a dedicated route:
   ```python
   @app.get("/meridian-theme.css")
   async def serve_theme_css():
       css_path = BASE_DIR / "meridian-theme.css"
       return HTMLResponse(content=css_path.read_text(), media_type="text/css")
   ```
2. No other backend changes. All 26 API endpoints preserved as-is.

---

## Section 4: What NOT to Touch Tonight

These features are deferred to future sessions:

1. **SSE Streaming Upgrade** -- Replacing the WebSocket Claude terminal with SSE and the Hermes event vocabulary (chunk/tool/thinking/done/approval). This is a backend+frontend change that needs careful testing. Defer to Phase 2.

2. **Approval Workflow Cards** -- The Hermes approval-card pattern (Once/Session/Always) requires backend support for persistent approval scopes. Defer.

3. **Usage Meter with Multi-View Toggle** -- Requires aggregating data across sessions, providers, and cost models. The compact pill UI is achievable but the data pipeline is not tonight's scope.

4. **Gateway Capability Probing** -- MERIDIAN talks to known services (Claude API, gpuserver1). Probing adds value when services are dynamic, but ours are relatively static. Lower priority.

5. **Mobile PWA / Responsive Overhaul** -- Current responsive breakpoint at 1200px is functional. A proper mobile experience requires layout rethinking. Defer.

6. **Monaco/CodeMirror Editor** -- Overkill for MERIDIAN's current needs.

7. **xterm.js Terminal Upgrade** -- Replacing the current textarea+div terminal with xterm.js. Nice-to-have but high-risk for an overnight session.

8. **Additional Themes Beyond 3** -- Ship with dark/midnight/light. Adding more (slate, mono, warm) is trivial once the CSS variable system is in place but not tonight.

---

## Section 5: Acceptance Criteria

The QA agent should verify all of the following in Chrome:

### Must Pass (Blocking)
- [ ] All 26 API endpoints return valid JSON (run through each `/api/*` path)
- [ ] Auth works: unauthenticated request to any `/api/*` returns 401
- [ ] Dark theme renders correctly (no unstyled elements, no white flashes)
- [ ] Light theme renders correctly (all text readable, all cards styled)
- [ ] Midnight theme renders correctly (navy bg, amber accents, all cards visible)
- [ ] Theme persists across page reload (check `localStorage('meridian-theme')`)
- [ ] All 14 cards display with accent-color top bars
- [ ] Family card shows 5 members + 3 cats
- [ ] Finances card expands/collapses categories
- [ ] Daily Tasks checkboxes toggle (POST `/api/daily-tasks/toggle` fires)
- [ ] Memory Tab: all 6 sub-panels render (Graph, Heatmap, Recent, Crons, Inbox, Search)
- [ ] Memory Tab graph: D3 force simulation runs, nodes draggable, Obsidian open button works
- [ ] Claude terminal: WebSocket connects, messages send/receive, streaming works
- [ ] Claude terminal: markdown rendering produces no XSS (test with `**<img src=x onerror=alert(1)>**`)
- [ ] Top-panel memory graph is GONE (no duplicate graph above main grid)
- [ ] GPU Server Control: all 8 command buttons work, rental widget displays
- [ ] 60s auto-refresh still fires (check console or network tab)
- [ ] 30s GPU rental refresh still fires
- [ ] Status strip shows GPU status, rental status, memory count, last refresh time
- [ ] `Ctrl+K` opens command palette
- [ ] Command palette fuzzy search filters results as you type
- [ ] Selecting a card command scrolls to that card
- [ ] Escape closes command palette
- [ ] Sound toggle button in header toggles audio on/off
- [ ] Sound plays on Claude terminal response complete (requires active conversation)
- [ ] Connection overlay appears if MERIDIAN server is unreachable (test by stopping backend mid-load)
- [ ] Health strip above Memory Tab shows ACTIVE/WARM/COLD/FORGOTTEN/ARCHIVE counts

### Should Pass (Non-Blocking)
- [ ] KPI-style metric tiles render for System Status, Heartbeat, API Costs
- [ ] Theme transition is smooth (CSS `transition` on background/color)
- [ ] Command palette keyboard navigation (up/down arrows) works
- [ ] Sound volume persists across reload
- [ ] Status strip updates on each refresh cycle
- [ ] Connection overlay auto-dismisses when services come back

---

## Section 6: Implementation Task Breakdown

### Task 1: Theme System + CSS File + GlassCards (Priority: FIRST, blocking all others)

**Files to create:** `dashboard/family/meridian-theme.css`
**Files to modify:** `dashboard/family/index.html` (CSS section + theme toggle JS), `dashboard/family/server.py` (add CSS serving route)

**What to extract from Hermes:**
- CSS variable pattern: `/tmp/hermes-studio/src/styles.css:41-99` (utility classes)
- KPI card classes: `/tmp/hermes-studio/src/styles.css:101-150`
- Theme persistence pattern: `/tmp/hermes-studio/src/lib/theme.ts:129-143`
- GlassCard layout: `/tmp/hermes-studio/src/screens/dashboard/dashboard-screen.tsx:35-83`

**Steps:**
1. Create `meridian-theme.css` with 3 theme definitions (dark, light, midnight) and all utility classes
2. Add CSS serving route to server.py
3. Add `<link>` to index.html `<head>`
4. Move `:root` and `[data-theme="light"]` from inline `<style>` to the CSS file
5. Replace `.card` class with `.glass-card` in CSS and HTML
6. Add `--card-accent` per-card via inline style or data attribute
7. Update `toggleTheme()` to 3-theme cycle
8. Add theme name display in header
9. Verify all 3 themes render correctly

**Estimated LOC:** ~500 new, ~200 removed. Net +300.

### Task 2: Remove Duplicate Graph + Add Status Strip + Fix XSS (Priority: SECOND, independent of Task 3-4)

**Files to modify:** `dashboard/family/index.html`

**What to extract from Hermes:**
- Status strip layout: `/tmp/hermes-studio/src/components/agent-status-strip.tsx:78-122`
- StatusPip pattern: `/tmp/hermes-studio/src/components/agent-status-strip.tsx:25-43`

**Steps:**
1. Remove `<div class="graph-panel">` HTML block (~lines 2131-2153)
2. Remove `renderGraph()`, `refreshGraph()`, `toggleGraphSections()` and all state vars from JS
3. Remove associated CSS rules (`.graph-panel`, `.graph-card`, etc.)
4. Remove `refreshGraph()` from `refreshAll()`
5. Add status strip HTML before `.header`
6. Add status strip JS: `updateStatusStrip()` function, called from `refreshAll()`
7. Fix `renderMarkdown()` XSS: restructure to escape before formatting
8. Verify Memory Tab graph still works (it should be completely untouched)

**Estimated LOC:** ~180 new, ~350 removed. Net -170.

### Task 3: Command Palette (Priority: THIRD, depends on Task 1 for styling)

**Files to modify:** `dashboard/family/index.html`, `dashboard/family/meridian-theme.css`

**What to extract from Hermes:**
- Fuzzy scoring: `/tmp/hermes-studio/src/components/command-palette.tsx:75-104` (copy `scoreCommandAction` verbatim, strip TS)
- UI structure: `/tmp/hermes-studio/src/components/command-palette.tsx:106-220` (adapt from React to vanilla JS)

**Steps:**
1. Add command palette CSS to `meridian-theme.css` (overlay, input, result items, groups, active highlight)
2. Add palette HTML to end of `<body>` in index.html
3. Port `scoreCommandAction()` to vanilla JS
4. Build command registry: 14 card navigation + 6 memory tabs + theme toggle + terminal toggle + refresh + 8 GPU commands = ~31 commands
5. Add keyboard listener for `Ctrl+K`
6. Implement arrow key navigation + Enter select + Escape close
7. Implement result rendering with group headers

**Estimated LOC:** ~330 new.

### Task 4: Sound System + Connection Overlay (Priority: FOURTH, depends on Task 1 for styling)

**Files to modify:** `dashboard/family/index.html`, `dashboard/family/meridian-theme.css`

**What to extract from Hermes:**
- Sound system: `/tmp/hermes-studio/src/lib/sounds.ts:1-304` (copy entire file, strip TS annotations)
- Connection polling: `/tmp/hermes-studio/src/components/connection-startup-screen.tsx:88-119` (polling pattern)

**Steps:**
1. Port `sounds.ts` to vanilla JS in index.html `<script>` block (strip `export`, type annotations, `as const`)
2. Add sound toggle button HTML in header
3. Wire `playSound('chatComplete')` to WebSocket response completion
4. Wire `playSound('agentFailed')` to WebSocket error
5. Wire `playSound('alert')` to GPU status changes
6. Add connection overlay CSS to `meridian-theme.css`
7. Add overlay HTML to end of `<body>`
8. Implement health check logic: parallel fetch to 4 endpoints, progressive reveal after 3s
9. Auto-retry every 5s, auto-dismiss on all-clear
10. Add "Continue Anyway" dismiss button

**Estimated LOC:** ~350 new.

---

## Summary Estimates

| Feature | New LOC | Removed LOC | Time |
|---------|---------|-------------|------|
| Theme system + CSS file | 500 | 200 | 45 min |
| GlassCard + MetricTile restyle | 450 | 100 | 60 min |
| Remove duplicate graph | 0 | 350 | 20 min |
| Command palette | 330 | 0 | 60 min |
| Sound notifications | 200 | 0 | 30 min |
| Status strip | 160 | 0 | 30 min |
| Fix XSS | 15 | 10 | 5 min |
| Connection overlay | 180 | 0 | 30 min |
| **Total** | **~1835** | **~660** | **~4.5 hr** |

Net code growth: ~1175 LOC across 2 files (index.html + meridian-theme.css) + 8 LOC in server.py.
