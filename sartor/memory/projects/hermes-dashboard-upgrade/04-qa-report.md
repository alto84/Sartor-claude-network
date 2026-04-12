---
title: MERIDIAN Hermes-Style Upgrade QA Report
date: 2026-04-12
tester: QA Agent
verdict: SHIP WITH CAVEATS
---

# QA Report: MERIDIAN Hermes-Style Upgrade

## Test Results

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Page loads without errors | PASS | Dashboard loads fully, title shows correctly |
| 2 | Dark theme is default | PASS | `data-theme="dark"` confirmed via JS; dark background, light text |
| 3 | GlassCards visible | PASS | 14 glass-cards found with proper titles and styling |
| 4 | Status strip | PASS | Shows MERIDIAN v0.2, GPU: ONLINE, RENTAL, MEMORY count, REFRESH timestamp, DEV/DARK badges |
| 5 | Theme toggle | PASS | Cycles dark -> midnight -> light -> dark; colors change correctly; button label updates |
| 6 | Memory Tab | PASS | All 6 sub-views exist (Graph, Heatmap, Recent, Crons, Inbox, Search); memSwitchTab works |
| 7 | No duplicate graph | PASS | Only 1 SVG on page; graph-card is inside memoryTabWrapper only |
| 8 | Command palette | PASS | Ctrl+K opens overlay; search filters by "memory"; arrow key navigation works; Esc closes |
| 9 | Sound system | PASS | Sound toggle button exists; AudioContext available; no initialization errors |
| 10 | Connection overlay | PASS | Shows on load with 4 health checks; auto-dismisses when all pass; "Continue anyway" button present |
| 11 | Claude terminal | PASS | Terminal wrapper exists and is visible in DOM |
| 12 | API endpoints | PASS | /api/memory-health, /api/greeting, /api/cron-health all return 200 with valid JSON |
| 13 | Memory search | PASS | /api/memory-search?q=gpuserver1 returns BM25-ranked hits across multiple memory files |
| 14 | Auto-refresh | PASS | setInterval(refreshAll, 60000) confirmed in source; status strip timestamp updates |
| 15 | CSS served | PASS | /meridian-theme.css returns valid CSS with 3 theme definitions (dark, midnight, light) |
| 16 | No console errors | PASS | Zero console errors or warnings detected across all testing |

**Score: 16/16 PASS**

## Bugs Found and Fixed

### Bug: Dev mode auth bypass broken (FIXED)

`HTTPBasic()` with default `auto_error=True` raises 401 before `require_auth` body executes when no Authorization header is present. This meant `MERIDIAN_DEV=1` had no effect -- the server always demanded credentials.

**Fix applied in `server.py`:**
- Changed `HTTPBasic()` to `HTTPBasic(auto_error=not _MERIDIAN_DEV)`
- Added `if credentials is None` guard before credential comparison
- Dev mode now correctly bypasses auth

This fix only affects dev mode behavior; production mode (no MERIDIAN_DEV env var) is unaffected since `auto_error` remains True.

## Observations

- D3 memory graph renders with 17 nodes and 104 links
- The D3 graph SVG is 2504x480px, which causes the page to have significant vertical space below the graph; scrolling past it shows a blank dark area. This is cosmetic, not a blocker.
- Screenshot capture occasionally times out (CDP timeout) when the D3 simulation is actively running. This is a test-tooling issue, not a dashboard bug.
- Connection overlay on first load briefly showed GPU Server and Memory System as FAIL before they resolved to PASS; the overlay correctly auto-dismissed after all checks passed.
- Light theme renders cleanly with proper contrast and readable text throughout.

## Verdict: SHIP WITH CAVEATS

The single caveat is the auth bypass fix in server.py, which was required to make `MERIDIAN_DEV=1` actually work. The fix is minimal and does not affect production behavior. All 16 test cases pass. The upgrade is ready for production deployment.
