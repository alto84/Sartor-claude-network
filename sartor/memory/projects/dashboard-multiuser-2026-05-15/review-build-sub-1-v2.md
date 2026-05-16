---
type: review-memo
phase: 6-re-review
project: dashboard-multiuser-2026-05-15
sub-phase: build-sub-1
reviewer: auditor (claude-sonnet-4-6, fresh context)
review-target: HEAD on branch dashboard-multiuser-phase1 (commits d3e2bff5 + d468d4e3 + f24856d9 + cd15a4b7 + 8b1ee5d4 + 2c5c638c + b0d9a3a3 + e43baacb)
review-date: 2026-05-16
verdict: fire-after-mechanical-patches
---

# Re-review memo — sub-1 (post-revisions)

## Summary

Seven of nine charges are verified as genuinely fixed. One new defect of medium severity was introduced by the Charge 4 revision: `CORSMiddleware` is configured with `allow_origins=["*"]`, which pre-dates the revisions but was not cleared by the v1 reviewer; the Charge 4 CSRF expansion now makes this pairing visible as a documentation gap (the middleware docstring cites `SameSite=Lax` as CSRF mitigation for auth endpoints, but doesn't acknowledge that the wildcard CORS config undermines that claim for cross-origin preflight-approved requests on sub-2's future admin endpoints). On current sub-1 scope, `allow_credentials` is absent so cookies don't follow cross-origin requests; the CSRF protection is intact in practice. The test count discrepancy (orchestrator claimed 29; script executes 29 at runtime, but two of those are from if-else branch hardcodes, not independent assertions) is a minor framing issue. Recommended verdict: fire after two mechanical patches.

---

## Per-charge verification

### Charge 1 — Verified: yes

`auth_set_pin` now checks `_login_rate_limited(ip)` first (line 903), then extracts `setup_key` from the request body, then calls `secrets.compare_digest(str(setup_key).encode(), _MERIDIAN_PASSWORD.encode())` (line 911). A missing or wrong `setup_key` returns 403 and calls `_record_login_failure(ip)`. The rate-limit bucket is shared with `auth_login`, so brute-forcing `setup_key` is subject to the same 5-attempt/5-minute window.

The `OPEN_PREFIXES = ("/api/auth/",)` in `SessionAuthMiddleware` still exempts the entire `/api/auth/` namespace from session checking (intentional — first-run setup has no session). The `setup_key` field is the authentication gate for this endpoint. Verified via `secrets.compare_digest`, timing-safe.

**Residual trust-model implication (not a defect, but worth naming for the audit trail):** Anyone with the Meridian admin password can call `POST /api/auth/set-pin` and claim any adult/admin user's PIN before that user does. The intended trust model is: the admin password is Alton's credential, so only Alton (or someone Alton has told the password) can do first-time PIN setup for any account. That is the correct model for this household. The implication is documented in INDEX.md. Cleared.

**Edge case found: empty password file.** If `meridian-password.txt` exists but is blank, `_load_password()` returns `""`. Then `secrets.compare_digest(b"", b"")` is `True`, meaning any caller with an empty `setup_key` field (or no `setup_key` field — the `get("setup_key", "")` default returns `""`) can bypass the check. This is a pre-existing issue not introduced by the revision; the server would also generate a degenerate `_SESSION_SECRET` in this case, breaking all session security. **Flag as a new mechanical patch:** add a guard in `_load_password()` that raises `RuntimeError` if the stripped value is empty.

Test coverage: adversarial cases "set-pin without setup_key returns 403" (line 89) and "set-pin with wrong setup_key returns 403" (line 102) both present and genuine.

### Charge 2 — Verified: yes (with one minor documentation gap)

`sartor/memory/family/profiles.json` is in `.gitignore` (added in commit f24856d9). `git ls-files sartor/memory/family/profiles.json` returns empty — file is not tracked in HEAD. Confirmed.

`_load_profiles_data()` bootstraps from `_SEED_PROFILES` when the file is missing (commit cd15a4b7, lines 221-224). The bootstrap seed contains only `pin_hash: None` entries — no real credential material. Confirmed.

INDEX.md corrected: the constraint block now reads "PIN material hashed sha256(pin | per-user-salt | `_SESSION_SECRET[:16]`); the latter is derived from `meridian-password.txt` which never leaves the LAN. `profiles.json` is git-ignored as of revision pass... Brute-force resistance: 4-6 digit PIN × HTTP rate-limit (5/5min per IP) at the auth layer + secrecy of `meridian-password.txt` if anyone ever sees a hash."

**Minor documentation gap (not a defect):** The v1 reviewer asked for explicit language saying "if `meridian-password.txt` leaks, PIN hashes are crackable in seconds offline." The corrected text implies this but doesn't state it. Since `profiles.json` is now git-ignored, hashes are never in git history going forward — the offline-cracking threat only materializes if (a) `meridian-password.txt` leaks AND (b) someone separately obtains a copy of `profiles.json` from the LAN machine. The INDEX text is adequate for the actual threat model. Cleared.

**Bootstrap non-atomicity:** `PROFILES_PATH.write_text(...)` (line 224) is not atomic — unlike `_save_profiles_data` which uses tmp+replace. If the process crashes mid-write, `profiles.json` is corrupt. The `except (FileNotFoundError, json.JSONDecodeError)` fallback catches this and returns in-memory seed profiles. Functionally safe; stylistic inconsistency with the atomic pattern elsewhere. Not a new defect introduced by the revision; the v1 baseline didn't have the bootstrap at all.

### Charge 3 — Verified: yes (with one known limitation on restart-persistence testing)

`_save_persisted_failures()` uses atomic tmp+replace (`tmp = _AUTH_FAILURES_PATH.with_suffix(".json.tmp")`, line 116-118). Atomic on Windows NTFS (same volume). Confirmed.

On-load filtering: `_load_persisted_failures()` reads wall-clock timestamps from disk, drops entries older than `_LOGIN_FAIL_WINDOW` (line 97: `if ts > cutoff_wall`), then converts survivors to monotonic-clock offsets (lines 98-99). The conversion logic `dq.append(mono_now - age)` where `age = now_wall - ts` is correct: it reconstructs "how long ago this failure happened" in terms of the current monotonic clock. This correctly survives a process restart because wall-clock age is computed at load time from the stored wall timestamps.

**Clock-skew edge case:** If the system clock jumps backward between when a failure is recorded and when the server restarts, `age = now_wall - ts` could be negative, producing a future monotonic timestamp (`mono_now - negative_age > mono_now`). The failure would then survive indefinitely because `t > cutoff_mono` would always be true until the window expires naturally. On Rocinante (NTP-synced Windows), backward clock jumps are rare and bounded. Acceptable for a home LAN deployment; flag for awareness, not blocking.

**OSError silent pass:** `_save_persisted_failures()` catches `OSError` with `pass` (line 119-120). If disk is full mid-attack, subsequent failures are not persisted, but auth continues working. An attacker who can fill the disk and then restart the server eliminates the persisted rate-limit state, getting a fresh window. For a home LAN this is an acceptable operational trade; the auth-failures file is small (<1KB even under sustained attack). Confirmed as the intended behavior per the comment.

Test: "auth-failures.json exists" and "auth-failures has entries" both test that failures are written to disk (lines 203-210). The cross-restart persistence property is not directly tested (would require server restart mid-test), which is an acceptable limitation for a shell test. The logic has been verified by code inspection.

### Charge 4 — Verified: yes (with one pre-existing issue now made visible)

`CsrfMiddleware.dispatch` now applies to all mutating `/api/*` EXCEPT `/api/auth/` (lines 355-357). The exemption list `EXEMPT_PREFIXES = ("/api/auth/",)` is explicit. Confirmed.

The docstring correctly documents the three mitigations for auth endpoints: Content-Type requirement, SameSite=Lax, rate-limit.

**New issue found — wildcard CORS config undermines documented SameSite mitigation claim:**

Line 290: `app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])`

The middleware docstring for `CsrfMiddleware` cites `SameSite=Lax` as one of three mitigations for auth endpoints. `SameSite=Lax` blocks cookies on cross-origin POST fetch requests — but the CORS config with `allow_origins=["*"]` means the server responds to cross-origin preflight with `Access-Control-Allow-Origin: *`. **Critically, `allow_credentials` is not set**, so browsers will refuse to attach cookies to cross-origin requests even with the wildcard CORS header. The CSRF protection is intact in practice.

However, the combination creates a documentation inconsistency: the docstring claims `SameSite=Lax` as a mitigation, but a reader who sees the wildcard CORS config might conclude cross-origin requests can bypass cookie gating. They cannot (no `allow_credentials`). This needs a comment in the CORS middleware call explaining why `allow_origins=["*"]` is safe in this deployment: "cookies are never attached to cross-origin requests without allow_credentials=True; LanOnlyMiddleware is the real perimeter."

This is pre-existing, not introduced by the revision pass. But the Charge 4 revision made the CSRF/CORS interaction documentation-relevant for the first time. **Flag as a mechanical patch: add a comment to the CORSMiddleware call.**

**Are there endpoints that should be CSRF-protected that aren't?** Reviewing the route list: all mutating endpoints are under `/api/` and either covered by CSRF (all non-auth) or explicitly exempted (`/api/auth/*`). The `/logout` GET is not mutating. Legacy login `POST /login/legacy` is not under `/api/` — it's exempt from CSRF middleware, which is correct (no session exists for legacy login). Confirmed complete.

### Charge 5 — Verified: yes (with minor framing issue)

All 18 PLAN.md acceptance tests are covered by the test script. Mapping:

- #1 (profiles, no PIN leak): lines 63-68
- #2 (vayu tap-in 200): line 74
- #3 (vayu /api/me kid tier): lines 77, 79
- #4 (color CSS injection): line 83
- #5 (alton pre-setup 400): line 108
- #6 (set-pin 200): line 116
- #7 (second set-pin 400): line 122
- #8 (wrong PIN 400): line 128
- #9 (correct PIN 200): line 135
- #10 (alton admin tier): line 138
- #11 (color update 200 + persists): lines 151, 153
- #12 (bad color 400): line 159
- #13 (unauth 401): line 167
- #14 (tile-grid): lines 170-175
- #15 (GET /login/legacy 200): line 179
- #16 (POST /login/legacy sets cookie as alton): lines 188, 190
- #17 (rate-limit at >5 fails): line 201
- #18 (forged cookie 401): line 216

Adversarial coverage beyond the 18: Charge 1 (set-pin without/wrong key), Charge 3 (failures on disk), Charge 4 (color update without CSRF), cookie replay (alton-sig substituted to alton, vayu-sig substituted to alton). Genuine adversarial tests, not happy-path relabeling.

**Minor framing issue:** Orchestrator claimed "29 assertions." Counting `check()` calls: 27 unconditional plus 2 if-else pairs where one branch executes per run = 29 at runtime. But the if-else pairs (tile-grid and auth-failures.json) each execute the "ok" branch on success, meaning they're effectively one assertion each expressed as an if-else. The count of 29 is technically accurate for a passing run. The orchestrator's claim holds.

**PLAN.md test #4 minor gap:** Test checks for presence of `meridian-viewer-theme` block but doesn't verify the specific color value injected (`#10b981` for vayu). PLAN.md test #4 says "injects... style block with vayu's color" — the test satisfies the literal criterion (block present) but not the full spirit (correct color injected). Acceptable for a first-pass test; note for sub-4 polish.

**PLAN.md test #11 minor gap:** Tests color update 200 and persistence via `/api/me`, but doesn't test that `/` reflects the new color (third part of the criterion). Acceptable; the code path through `serve_index` is covered by the existing Charge 7 fix and code inspection.

### Charge 6 — Deferral: defensible

Double-load per authenticated request is a structural inefficiency, not a security issue. The mid-request inconsistency (middleware reads profile, handler reads profile, with a possible write between them) is a timing window on a 4-user local dashboard. Deferring to sub-4 is correct; this sub-phase is auth/profile/color only.

### Charges 7 + 8 — Verified: yes

**Charge 7 (CSS injection):** `serve_index` (lines ~1195-1201) now re-validates the color at injection time: `color = raw_color if re.fullmatch(r"#[0-9a-fA-F]{6}", str(raw_color)) else "#6366f1"`. Defense-in-depth against hand-edited `profiles.json`. Confirmed.

**Charge 8 (innerHTML XSS):** `renderTiles` rewritten to use `createElement` + `textContent` for name, tier, age fields (diff lines +590-625). `isSafeColor(c)` validates color against `#[0-9a-fA-F]{6}` regex before setting as CSS property. `grid.textContent = ''` replaces `grid.innerHTML = ''`. All confirmed via diff inspection.

### Charge 9 — Deferral: defensible

Session secret coupled to admin password. For a home LAN with a single admin credential, this operational coupling is a minor inconvenience. The practical impact ("rotating the password forces re-login") is low-frequency and non-security-breaking. Backlog deferral is correct.

---

## New issues found in the revision pass

### New Issue 1 — Empty-password guard missing in `_load_password()` (low severity)
**Surface:** `dashboard/family/server.py` lines 149-154
**Detail:** If `meridian-password.txt` exists but contains only whitespace, `_load_password()` returns `""`. Consequences: `_SESSION_SECRET` becomes `sha256("meridian-session-")` (a known value), invalidating all session security. `secrets.compare_digest(b"", _MERIDIAN_PASSWORD.encode())` where both are `b""` returns `True`, meaning any caller with a missing or empty `setup_key` field bypasses the Charge 1 fix entirely.
**This is pre-existing** (not introduced by the revision) but the Charge 1 fix depends on this guard existing. It doesn't.
**Recommended fix (mechanical):** Add `if not stripped: raise RuntimeError("meridian-password.txt is empty")` in `_load_password()`. Two lines.

### New Issue 2 — CORS wildcard config undocumented relative to CSRF assumptions (low severity, documentation only)
**Surface:** `dashboard/family/server.py` line 290
**Detail:** `CORSMiddleware(allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])` without `allow_credentials=True`. The Charge 4 middleware docstring cites `SameSite=Lax` as a CSRF mitigation for auth endpoints; a reader seeing both the wildcard CORS and the `SameSite=Lax` claim without explanation will either trust the wrong thing or flag a false contradiction. The config is safe (no `allow_credentials` = cookies never travel cross-origin), but it needs a comment.
**Recommended fix (mechanical):** Add inline comment on line 290 explaining why wildcard origins are safe: `# allow_credentials not set — cookies never attach cross-origin; LanOnlyMiddleware is the real perimeter`.

---

## Deferrals — defensible?

**Charge 6 (double-load → sub-4):** Yes, defensible. Not a security issue; sub-1 scope is auth/profile/color. The structural fix (`request.state.viewer`) is correct and low-risk; deferring it to polish is appropriate.

**Charge 9 (session secret coupling → backlog):** Yes, defensible. The operational coupling is annoying, not dangerous. A separate session salt file is the right fix; the use case ("need to rotate session without rotating password") is rare enough on a home LAN that forcing it now would be premature.

---

## Verdict basis

**Bucket: B — fire after mechanical patches.** The two new issues found are both mechanical:

1. Empty-password guard in `_load_password()`: two lines, cannot introduce new bugs.
2. CORS comment: one line, documentation only.

Neither requires design discussion. The 7 original charges are genuinely fixed. The 2 deferrals are sound. All 18 PLAN.md acceptance tests are covered by the test script with real adversarial cases. The core security model (setup_key PIN gating, rate-limit persistence, CSRF expansion, DOM API XSS hardening, git-ignoring profiles.json) is implemented correctly and tested.

No constitutional issues. No authentication bypass found. No new attack surface introduced by the revision pass.

---

## Stop-condition assessment

Per skill rule 3: the verdict has moved from "revise" to "fire after mechanical patches" with patches mechanical enough that application cannot introduce new bugs (2-line guard, 1-line comment). Stop-condition is met. No further iteration required before Alton greenlights.

The two patches should be applied before merge but do not require another re-review cycle.

---

## Reply from the team
<!-- Leave empty. Orchestrator fills if iteration is needed. -->
