---
type: audit
phase: qa
updated: 2026-04-12
auditor: qa-auditor (fresh Opus, no prior attachment to the work)
status: conditional_pass
---

# memory-system-v2 QA Red-Team Audit

## Executive Summary

**CONDITIONAL PASS.** The system is architecturally sound and well-engineered. Four core Python modules are cleanly written, fully tested (37/37 pass), and importable standalone. The wiki is in the best shape it has been: 5 hub pages rewritten with proper frontmatter, wikilinks clean, staleness scoring functional. However, **3 blockers** must be fixed before go-live, plus 4 major issues that should be addressed within the first week. The blockers are all fixable in under 2 hours total.

---

## Test Suite Results

```
$ python -m pytest sartor/tests/ -v
37 passed in 0.53s

test_conversation_extract.py  16 passed
test_curator_pass.py           8 passed
test_improvement_loop.py       6 passed
test_staleness.py              7 passed
```

All tests pass. No failures, no warnings, no skips.

---

## Bug List

### BLOCKER-1: Curator skips underscore-prefixed inbox subdirs, disconnecting gpuserver1 crons

**File:** `sartor/curator_pass.py:226-229`
**Severity:** BLOCKER

The `_iter_entry_files()` function skips any directory or file whose name starts with `_` or `.` (line 226: `RESERVED_DIR_PREFIXES = ("_", ".")`). The master plan specifies gpuserver1's crons write to `inbox/gpuserver1/_stale-alerts/` and `inbox/gpuserver1/_vastai/` -- both start with `_`. Result: the entire stale-detect and vastai-tend pipeline is disconnected. Entries are written by gpuserver1 and never read by the curator.

The conflict is between the master plan's naming convention (using `_` prefix for specialized subdirs) and the curator's filter logic (treating `_` prefix as "reserved/processed, skip").

**Fix:** Either rename the inbox subdirs to drop the `_` prefix (e.g., `vastai/`, `stale-alerts/`) or change the curator to only skip the specific reserved dirs it owns (`.drained/`, `.receipts/`, `.conflicts/`, `_flagged/`, `_processed/`) rather than using a blanket prefix filter.

### BLOCKER-2: vastai-tend.sh false state-change on every run (Python True vs bash true)

**File:** gpuserver1 `/home/alton/vastai-tend.sh` lines 42-48
**Severity:** BLOCKER

The state comparison reads the JSON cache with Python's `json.load`, which converts JSON `true` to Python `True` (capital T). The bash script compares this against lowercase `true`. Since `True != true` in bash string comparison, the script reports a state change on every single run, writing an inbox entry every 30 minutes regardless of whether anything changed.

**Evidence:** Log shows "state changed: listed True->true rented False->false" on consecutive runs with identical state.

**Fix:** Change the Python one-liner to: `print(str(d.get('listed','unknown')).lower())` -- or better, use `jq` instead of Python for the JSON parsing.

### BLOCKER-3: Windows Scheduled Task .cmd wrappers do not exist

**File:** `scripts/curator-pass-run.cmd`, `scripts/improvement-loop-run.cmd`, `scripts/conversation-extract-run.cmd`
**Severity:** BLOCKER

The `.ps1` registration scripts are designed to *create* the `.cmd` wrappers when run, but the `.ps1` scripts themselves have never been executed. The task XML files reference these `.cmd` paths. Until someone runs the `.ps1` scripts (in an elevated PowerShell), the Windows Scheduled Tasks cannot be registered and no Rocinante crons will fire.

This was already flagged by EX-11 but remains unfixed.

**Fix:** Run the three `.ps1` scripts, then register the tasks. Alternatively, generate the `.cmd` files directly.

### MAJOR-1: WebSocket /ws/claude endpoint has no authentication

**File:** `dashboard/family/server.py:944`
**Severity:** MAJOR (security)

FastAPI's app-level `dependencies=[Depends(require_auth)]` applies only to HTTP routes, not WebSocket routes. The `/ws/claude` endpoint at line 944 accepts connections without any authentication check. Anyone who can reach port 5055 can connect to the WebSocket and issue prompts to the Claude API at Alton's expense.

Partially mitigated by: MERIDIAN binds 0.0.0.0:5055 on Rocinante which is NOT in DMZ (gpuserver1 is the DMZ host), so only LAN devices can reach it. But kids' devices and any guest on the WiFi can access it.

**Fix:** Add explicit authentication to the WebSocket handler -- either check an auth token in the initial handshake query params, or require the HTTP basic auth cookie from the browser session.

### MAJOR-2: Extractor feedback targets use literal `{hash}` in path, not interpolated

**File:** `sartor/conversation_extract.py:572,583,594`
**Severity:** MAJOR

The `suggested_target` for feedback extraction uses string literals like `"feedback/feedback_rule_{hash}.md"` -- this is a plain string, not an f-string, so `{hash}` is never replaced with the candidate's fingerprint. All extracted feedback rules would be routed by the curator to literal files named `feedback_rule_{hash}.md`, `feedback_permissions_{hash}.md`, and `feedback_preferences_{hash}.md`. All feedback entries pile into three files instead of getting unique names.

**Fix:** Either use f-string with `candidate.fingerprint()`, or generate unique filenames at proposal-write time.

### MAJOR-3: MERIDIAN dashboard binds 0.0.0.0 instead of 127.0.0.1

**File:** `dashboard/family/server.py:1802`
**Severity:** MAJOR (security)

`uvicorn.run(app, host="0.0.0.0", port=5055)` exposes the dashboard on all network interfaces. Combined with MAJOR-1 (unauthenticated WebSocket), this is an attack surface. The improvement queue already flagged this as HIGH severity.

**Fix:** Change to `host="127.0.0.1"`. If LAN access is needed, use SSH tunnel.

### MAJOR-4: CORS allows all origins

**File:** `dashboard/family/server.py:52`
**Severity:** MAJOR (security)

`allow_origins=["*"]` combined with basic auth means any malicious page loaded in a browser on Rocinante could make authenticated cross-origin requests to the dashboard API. The browser will send the cached basic auth credentials with cross-origin requests when CORS allows it.

**Fix:** Restrict to `allow_origins=["http://localhost:5055", "http://127.0.0.1:5055"]`.

### MINOR-1: feedback_pricing_autonomy.md is misfiled

**File:** `sartor/memory/feedback_pricing_autonomy.md`
**Severity:** MINOR

This file is at the memory root instead of inside `feedback/`. All other feedback files are in `sartor/memory/feedback/`. The file has `type: feedback` in its frontmatter. The MEMORY.md history references it. It should be moved to `sartor/memory/feedback/feedback_pricing_autonomy.md`.

**Fix:** `mv sartor/memory/feedback_pricing_autonomy.md sartor/memory/feedback/`

### MINOR-2: Staleness scoring is O(N^2) -- will not scale

**File:** `sartor/staleness.py:220-238`
**Severity:** MINOR (no immediate impact, design concern)

`_inbound_link_count()` does a full `rglob("*.md")` + file read for every file scored. Scoring all 194 files takes 4.5s. At 500 files this becomes ~30s; at 1000 files, ~2 minutes. The bottleneck is N file reads per file scored.

**Fix for v0.2:** Build the inbound-link map once (single pass over all files), then look up counts from the map. Changes O(N^2) to O(N).

### MINOR-3: Obsidian vault discrepancy not documented in .mcp.json

**File:** `.mcp.json`
**Severity:** MINOR

The MCP config launches `mcp-obsidian` which connects to whichever vault the Obsidian Local REST API plugin serves. If Alton's Obsidian is open on a personal vault rather than `sartor/memory/`, the MCP tools will read/write the wrong vault. The master plan (section 8) notes this but there is no runtime check or documentation in `.mcp.json` itself.

**Fix:** Add a comment or a smoke-test step to the launch bat that verifies the vault name.

### COSMETIC-1: Curator pass times (07:30/19:30) differ from master plan (06:30/23:00)

**File:** `scripts/curator-pass-task.xml:10,17` vs master plan section 5.1
**Severity:** COSMETIC

The XML task triggers are 07:30 and 19:30. The master plan says 06:30 and 23:00. Not functionally broken, but the discrepancy should be resolved one way or the other.

### COSMETIC-2: 43 memory files return "neutral" staleness (no datable frontmatter)

**Severity:** COSMETIC

The improvement loop reports 43 neutral-tier files. These are files with frontmatter but no `last_verified`, `next_review`, or `updated` field. They are invisible to staleness detection. Not urgent but represents a gap in coverage.

---

## Fix Recommendations (one line each)

1. **BLOCKER-1:** Rename `_vastai/` to `vastai/` and `_stale-alerts/` to `stale-alerts/` on gpuserver1 and in the cron scripts.
2. **BLOCKER-2:** Replace Python `print()` with `print(str(...).lower())` or switch to `jq` in vastai-tend.sh.
3. **BLOCKER-3:** Run the three `.ps1` registration scripts from elevated PowerShell, or generate the `.cmd` files directly.
4. **MAJOR-1:** Add auth check to `/ws/claude` -- require token in query param or validate session cookie.
5. **MAJOR-2:** Change `suggested_target` in extractor feedback to use fingerprint or unique ID in filename.
6. **MAJOR-3:** Change `host="0.0.0.0"` to `host="127.0.0.1"` in server.py line 1802.
7. **MAJOR-4:** Restrict CORS origins to localhost only.
8. **MINOR-1:** Move `feedback_pricing_autonomy.md` into `feedback/`.
9. **MINOR-2:** Build inbound-link map once per scoring pass, not per file.
10. **MINOR-3:** Add vault-name verification to the Obsidian MCP launch script.

---

## Items Requiring Alton's Decision

1. **Deploy key for gpuserver1** (master plan Q1) -- still pending Alton sign-off.
2. **Machine-owned P2P writes** (master plan Q2) -- deferred to quarterly review per plan recommendation.
3. **MERIDIAN bind address** -- if LAN access to the dashboard is intentional, 0.0.0.0 is needed but should be paired with proper WebSocket auth. If localhost-only is acceptable, change to 127.0.0.1.
4. **Windows Scheduled Task registration** -- the `.ps1` scripts need to be run from elevated PowerShell by Alton to actually install the crons. This is by design (the builder didn't want to auto-install), but Alton needs to do this for the system to run.

---

## Items Working Correctly

1. **Test suite:** 37/37 pass, covering all four core modules with both unit and integration tests.
2. **Staleness scoring:** Produces sensible results across auditor-chosen files. Hub boost, inbound-link scaling, oracle dampening, and recent-edit relief all work as designed. ALTON.md scores 39 (fresh), MULTI-MACHINE-MEMORY.md scores 18 (fresh with oracle boost).
3. **Curator pass:** Correctly discovers 25 inbox files, validates schema (2 flagged for missing fields), classifies entries, produces correct routing decisions. Dry-run output matches expectations.
4. **Conversation extractor:** 20 proposals generated from real session data. Schema-valid, properly routed, dedup functional. The recall-biased regex patterns are comprehensive (16 fact families).
5. **Improvement loop:** Finds 1 real issue (receipt timeout), correctly computes tier distribution (98 fresh, 0 stale, 0 rotten), extraction metrics, and would write both improvement queue entry and briefing summary.
6. **Hub pages:** All 5 checked (MACHINES, BUSINESS, MASTERPLAN, PROCEDURES, MASTERPLAN-VISIONARY) have proper frontmatter with `last_verified`, `updated`, `type`, `tags`, `related`. No dangling wikilinks.
7. **gpuserver1 crons:** All 3 scripts exist, are executable, run successfully. Logs appear at expected paths. Crontab has exactly 3 active entries plus correctly-commented deprecated entries.
8. **Oracles.yml:** Well-structured, 12 oracles covering all entity types. Source types properly deferred to runtime where appropriate.
9. **Security basics:** `.secrets/` is gitignored and not tracked. `.mcp.json` does not contain inline API keys. Password loaded from file at runtime, not hardcoded.
10. **Module imports:** All 4 modules import cleanly standalone. PyYAML is available. No import errors.

---

## Overall Assessment

**Conditional pass. Fix the 3 blockers, then this system is ready for supervised go-live.**

The architecture is solid. The code quality is high -- clean separation between library functions and CLI, proper data classes, good error handling, dry-run support everywhere. The test coverage is meaningful (not just smoke tests -- the curator tests create real filesystem fixtures and verify receipt I/O). The master plan is well-reasoned and the execution largely faithful to it.

The blockers are all trivially fixable (the curator underscore filter is a 2-line change, the bash True/true bug is a 1-line change, the .cmd files need a PowerShell invocation). The security issues (MAJOR-1 through MAJOR-4) should be fixed before Alton starts using the dashboard with the Memory tab -- they represent real attack surface on a home network with children's devices.

The scalability concern (O(N^2) staleness scoring) is not urgent at 194 files / 4.5 seconds, but should be addressed before the wiki doubles in size.

Total bugs: 3 blocker, 4 major, 3 minor, 2 cosmetic = **12 findings**.
