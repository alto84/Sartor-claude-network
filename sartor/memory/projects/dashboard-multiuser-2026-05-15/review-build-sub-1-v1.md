---
type: review-memo
phase: 4-adversarial-review
project: dashboard-multiuser-2026-05-15
sub-phase: build-sub-1
reviewer: auditor (claude-sonnet-4-6, adversarial persona)
review-target: commit d3e2bff5 (sub-1 v1 build)
review-date: 2026-05-15
verdict: fire-after-small-patching
---

# Review memo — sub-1 v1 build

## Summary

One genuine pre-deployment blocker (Charge 1: `/api/auth/set-pin` requires zero authentication, allowing any LAN host to claim Alton's or Aneeta's PIN before they do) and one documentation falsehood (Charge 4: the "acceptable for LAN-only" claim about PIN hash strength is invalidated by the fact that `profiles.json` is committed to a git repo with a GitHub mirror). The remaining charges are medium/low and patchable without redesign. The auth model's structural bones are sound; the CSRF and session signing architecture hold up; sub-2's `_get_viewer`/`tier` interface is correctly laid. None of this should merge without closing Charge 1 first.

---

## Charges

### Charge 1 — Unauthenticated PIN setup: any LAN host can claim Alton's PIN first
**Severity:** critical
**Surface:** `dashboard/family/server.py` — `SessionAuthMiddleware.OPEN_PREFIXES`, `auth_set_pin()`
**Claim:** `POST /api/auth/set-pin` is reachable by any LAN client with zero session credentials. The `OPEN_PREFIXES = ("/api/auth/",)` exempts the entire `/api/auth/` namespace from session checking. The endpoint's only guards are: user exists, user is admin/adult tier, and `pin_hash` is currently null. Since `profiles.json` is committed with `pin_hash: null` for both Alton and Aneeta, any device on the home network can POST `{"user_id": "alton", "pin": "0000"}` before Alton runs the setup flow, setting an attacker-chosen PIN and effectively locking Alton out of his own admin account.

**Evidence:**
```
# SessionAuthMiddleware (line 227):
OPEN_PREFIXES = ("/api/auth/",)
# ...
if _MERIDIAN_DEV or path in self.OPEN_PATHS or any(path.startswith(p) for p in self.OPEN_PREFIXES):
    return await call_next(request)

# auth_set_pin (line 775) — no session check, no caller authentication:
async def auth_set_pin(body: dict, request: Request):
    user_id = (body or {}).get("user_id", "").strip()
    user = _profile_by_id(user_id)
    if not user: ...
    if user.get("tier") not in ("admin", "adult"): ...
    if user.get("pin_hash"): ...  # only guard: "already set"
    # sets the PIN unconditionally
```

Attack: `curl -X POST http://meridian-lan-ip:5055/api/auth/set-pin -H 'Content-Type: application/json' -d '{"user_id":"alton","pin":"1234"}'` from any LAN device, before Alton taps his tile. Server responds 200. Alton's profile now has PIN hash for "1234". When Alton taps his tile, he is told "enter your PIN" (not "set up a PIN") and has no way in unless he uses `/login/legacy`.

The setup window is open from first deployment until both Alton and Aneeta complete PIN setup. Given the commit shows both with `pin_hash: null`, the window is open at merge time.

**Recommended fix:** Two options, pick one:
- (A) Remove `/api/auth/` from `OPEN_PREFIXES`. Move `set-pin` out to `/api/me/set-pin` (session-required). But then the first-run flow breaks: Alton can't set his PIN because he can't log in without one. Resolution: use the legacy password login to get a session, THEN set PIN via `/api/me/set-pin`.
- (B) Keep `set-pin` unauthenticated but require the caller to supply the `_MERIDIAN_PASSWORD` as a `setup_key` field, proving they already have admin access to the machine. Lower-security but simpler.
- (A) is architecturally cleaner and closes the hole properly. The legacy login path was explicitly preserved for this recovery scenario.

---

### Charge 2 — PIN hashes committed to git reach the GitHub mirror: "acceptable for LAN-only" is false
**Severity:** high
**Surface:** `sartor/memory/family/profiles.json` (committed in d3e2bff5); `sartor/memory/projects/dashboard-multiuser-2026-05-15/INDEX.md` (the claim)
**Claim:** INDEX.md §Constraints states: "PIN material hashed sha256(pin | per-user-salt | session-secret-prefix); kept in `profiles.json` which is committed to git (no leak in the hash; brute-force resistance is 4-6 digit × rate-limit, not cryptographic — acceptable for LAN-only)." This is incorrect. The `profiles.json` file is committed to the git repo, and the git repo has a GitHub mirror (`github` remote) that replicates every 15 minutes via the "Sartor Memory Mirror" scheduled task. Once PIN hashes land in git history, they are in a semi-public location.

Raw SHA256 of a 4-6 digit PIN with a 16-hex-char salt can be exhausted offline on commodity hardware in under 15 milliseconds for 4-digit PINs. The rate-limit protection only applies at the HTTP layer; it does not protect offline cracking of hashes extracted from git. The "acceptable for LAN-only" claim is only true if the hash never leaves the LAN — which is false by design (GitHub mirror).

**Evidence:**
```
def _hash_pin(pin: str, salt: str) -> str:
    return hashlib.sha256(f"{pin}|{salt}|{_SESSION_SECRET[:16]}".encode()).hexdigest()
```
Benchmark on Rocinante-class hardware: SHA256 runs at ~930K hashes/second. 10,000 possible 4-digit PINs exhausted in 11ms. 6-digit PINs in 1.1 seconds. With GPU acceleration (which is present in this household on gpuserver1): microseconds.

The `_SESSION_SECRET[:16]` prefix is also derived from `_MERIDIAN_PASSWORD`, which is a file secret — but `_MERIDIAN_PASSWORD` is NOT committed to git. The prefix is unknown to an attacker who only has git access. This provides additional resistance: the attacker must also know the Meridian password to do offline cracking. This is a meaningful mitigation — but it is not documented in INDEX.md's claim, and it depends on `meridian-password.txt` never leaking.

**Recommended fix:** Two actions:
1. Add `sartor/memory/family/profiles.json` to `.gitignore` immediately. Exclude it from future commits. The current null-hash bootstrap version that's already in git is harmless; future versions with real hashes should not be committed.
2. Correct the INDEX.md claim to be accurate: "brute-force resistance depends on `meridian-password.txt` remaining secret; if that secret leaks, PIN hashes in git history are crackable offline in seconds. profiles.json excluded from git for this reason."

If (1) is adopted, also document the operational gap: new deployments need profiles.json seeded manually, not from git.

---

### Charge 3 — Rate limit state is in-memory only: server restart resets all lockouts
**Severity:** medium
**Surface:** `dashboard/family/server.py` — `_login_failures: dict[str, deque]`
**Claim:** The entire PIN brute-force rate limit is held in `_login_failures`, an in-process defaultdict. If the uvicorn process restarts (crash, SIGTERM, server update), all accumulated failure counts are lost. An attacker who can cause a server restart — or who simply waits across process restarts — gets unlimited retry attempts from the same IP, five at a time.

More practically: the server is a development-mode process on Rocinante and will restart whenever `server.py` is edited. Every such restart opens a fresh brute-force window.

**Evidence:**
```python
_login_failures: "dict[str, deque]" = defaultdict(deque)
```
No persistence mechanism. Not written to disk, not stored in profiles.json, not checkpointed anywhere.

**Recommended fix:** Persist the rate-limit state to a small side file (e.g., `dashboard/family/.auth-failures.json`) on each update, load it on startup. Or add a per-profile `lockout_until` field to profiles.json. Either is a ~20-line addition. For a home LAN, the simpler in-memory approach is arguably acceptable if the restart-reset risk is documented explicitly — but it is currently not documented at all.

---

### Charge 4 — No CSRF protection on `/api/me/color` (mutating endpoint behind SessionAuth)
**Severity:** medium
**Surface:** `dashboard/family/server.py` — `CsrfMiddleware` (line 259-277), `me_set_color` endpoint
**Claim:** `CsrfMiddleware` only protects `path.startswith("/api/tasks")`. The new `POST /api/me/color` endpoint is a session-authenticated mutating operation that modifies `profiles.json` — but it receives no CSRF token check. A malicious page running on the LAN (e.g., a compromised device, a locally-served page open in another tab) could submit a cross-site request that changes a user's color.

The mitigation that exists: `SameSite=Lax` on the session cookie. Under `Lax`, the cookie IS sent on same-site navigation (same-origin) and top-level cross-site navigations that are GET, but NOT on cross-origin subresource requests (fetch/XHR). For a `POST` fetch from another origin, `SameSite=Lax` blocks the cookie. The attack vector is therefore limited to same-origin contexts or navigation-level GET requests. For color change (non-sensitive), the practical impact is low.

However: the CSRF middleware exists for a reason; the pattern of "mutating endpoint that CsrfMiddleware doesn't cover" will become a problem when sub-2 adds tier-gated mutating endpoints. The CsrfMiddleware's scope (`/api/tasks` only) is already stale relative to the new endpoint surface.

**Recommended fix:** Expand `CsrfMiddleware` to cover all mutating `/api/` paths except `/api/auth/` (which has no session to bind a CSRF token to). Document the decision explicitly: `/api/auth/*` is exempted because no session exists yet; JSON Content-Type requirement provides partial CSRF mitigation there.

---

### Charge 5 — Test script covers 18 assertions but misses 4 of the 18 PLAN.md acceptance tests
**Severity:** medium
**Surface:** `C:\Users\alto8\.claude\jobs\85180d3d\test-auth-flow.sh`; PLAN.md acceptance test list
**Claim:** The test script has 18 `check()` calls but does NOT cover these four PLAN.md tests:
- **#1**: `GET /api/auth/profiles` returns 4 users, no PIN hashes leaked (the script never tests this endpoint directly or checks the response for `pin_hash` field absence)
- **#16**: `POST /login/legacy` with correct password sets cookie as `alton` (the script only checks that the page loads, line 114-115 — no POST test)
- **#17**: Rate-limit at >5 failed attempts (not tested at all)
- **#18**: Cookie forgery rejected — not tested

The script also covers none of the adversarial cases: unauthenticated set-pin, race condition on set-pin, CSS injection, innerHTML XSS, or cookie replay after password rotation. The claim "17/18 pass" counts 18 assertions against a different mapping than PLAN.md's 18 tests, and the one "false fail" (tile-grid grep count) is a test defect that should be fixed rather than explained away.

**Recommended fix:** Before greenlight, the test script must be updated to cover the four missing PLAN.md tests. The adversarial cases (set-pin without auth, token forgery, rate-limit) must be added as additional tests beyond the 18. The "17/18 pass" headline is misleading when 4 of the 18 pre-registered criteria are not actually exercised.

---

### Charge 6 — `_load_profiles_data()` called twice per authenticated request
**Severity:** low
**Surface:** `dashboard/family/server.py` — `SessionAuthMiddleware.dispatch` (line 234) and `_get_viewer` (line 212)
**Claim:** Every authenticated request triggers two file reads:
1. `SessionAuthMiddleware.dispatch` calls `_profile_by_id(user_id)` which calls `_load_profiles_data()`
2. Route handlers call `_get_viewer(request)` which calls `_profile_by_id(user_id)` which calls `_load_profiles_data()` again

For a 4-user LAN dashboard this is immaterial in practice. But it means the profile returned in the middleware and the profile returned in the route handler could theoretically differ if `profiles.json` is written between the two reads (e.g., concurrent `set-pin` or color update). This is not a security issue but is a structural inconsistency: the middleware confirming the user exists and the route handler reading user data are not reading the same snapshot.

**Recommended fix:** Pass the verified profile from middleware to request state (`request.state.viewer = profile`) so `_get_viewer` reads from state rather than re-loading from disk. This eliminates the double file read and the mid-request inconsistency.

---

### Charge 7 — CSS injection via color field in `serve_index` (trust-source trade undocumented)
**Severity:** low
**Surface:** `dashboard/family/server.py` — `serve_index` (lines 1049-1074)
**Claim:** The color value from `profiles.json` is injected raw into an inline `<style>` block:
```python
style_block = (
    f"<style id=\"meridian-viewer-theme\">:root {{ --accent-primary: {color}; "
    f"--accent-secondary: {color}; }}</style>"
)
```
The color is validated at `/api/me/color` entry point, but the raw value in `profiles.json` is not re-validated at read time. If `profiles.json` is hand-edited with a malicious color value (e.g., `</style><script>alert(document.cookie)</script><style>`), it would be injected directly into the served HTML.

The trust boundary is clear: anyone who can write `profiles.json` has local file system access and can already do far more damage. This is a documented-trade situation, not a surprise attack. But it is currently undocumented, and the same pattern will recur for sub-2 endpoints. The fix is one line.

**Recommended fix:** Add `color = re.fullmatch(r'#[0-9a-fA-F]{6}', raw_color) and raw_color or '#6366f1'` as a safety check in `serve_index` before injecting. Belt-and-suspenders is appropriate when the output is HTML.

---

### Charge 8 — `renderTiles` uses `innerHTML` without sanitization (latent XSS vector)
**Severity:** low
**Surface:** `dashboard/family/server.py` — `_LOGIN_HTML` inline `<script>` block, `renderTiles` function
**Claim:** The tile-launcher's `renderTiles()` does:
```javascript
t.innerHTML = `
  <div class="tile-avatar" style="background:${u.color}">${initial(u.name)}</div>
  <div class="tile-name">${u.name}</div>
  <div class="tile-tier">${u.tier}${u.age ? ' · age ' + u.age : ''}</div>
`;
```
`u.name`, `u.tier`, `u.color`, and `u.age` are read from `/api/auth/profiles` which reads `profiles.json`. The `initial(u.name)` function returns a single character and is safe. But `u.name` in `tile-name` is injected raw. If `profiles.json` is hand-edited to set `name: "<img src=x onerror=alert(document.cookie)>"`, XSS executes in the login page context.

Again, the trust boundary is the same (local file access required). But the pattern of `innerHTML` with user-controlled strings is a latent structural vulnerability: if any future endpoint allows name to be set from user input (e.g., a future self-service profile page), XSS is automatic. The fix at the pattern level is to use `textContent` or `document.createElement`.

**Recommended fix:** Replace `innerHTML` template with explicit DOM construction (`createElement`, `textContent`) for the name, tier, and age fields. The color on the avatar `style` attribute is a separate concern; use CSS variable injection or a safe whitelist.

---

### Charge 9 — Session secret is permanently coupled to `meridian-password.txt`
**Severity:** low
**Surface:** `dashboard/family/server.py` line 105
**Claim:**
```python
_SESSION_SECRET = hashlib.sha256(f"meridian-session-{_MERIDIAN_PASSWORD}".encode()).hexdigest()
```
Rotating the session secret (to invalidate all sessions) requires rotating the admin password. Rotating the password to maintain security invalidates all sessions. The two operations cannot be performed independently. For a LAN dashboard this is a minor operational constraint, but it means "force everyone to log in again" is only achievable via password rotation, which may be disruptive.

**Recommended fix:** Add a separate `_SESSION_SALT` loaded from a file (or an env var), defaulting to a random value generated on first run and stored in `.secrets/session-salt.txt`. This decouples session invalidation from password rotation. Low priority but worth a backlog item.

---

## What was NOT prosecuted

- **`_verify_token` delimiter abuse (user_id containing `:`).** The current profile IDs (alton, aneeta, vayu, vishala) contain no colons. The token parser uses `split(":", 1)` which would misparse a user_id containing `:`. Not exploitable with current fixed IDs and no user-input control over IDs. Cleared.
- **`_save_profiles_data` atomicity on Windows.** The `tmp.replace(PROFILES_PATH)` pattern is documented as relying on OS-level atomic rename. On Windows NTFS this works for same-volume files. The tmp file is written alongside profiles.json (same directory) so it is same-volume. Cleared for current deployment.
- **`profiles.json` corruption / empty file.** `_load_profiles_data` returns `{"users": [], "color_palette": []}` on `FileNotFoundError`. An empty or corrupt file would cause all logins to fail (no profiles found). This is a known operational trade — `/login/legacy` is the recovery path. Cleared as documented.
- **LAN-only middleware bypass.** `LanOnlyMiddleware` reads `request.client.host` directly, not `X-Forwarded-For`. No spoofing via headers possible. Cleared.
- **`X-MERIDIAN-DEV` mode.** Dev mode (`_MERIDIAN_DEV`) bypasses auth entirely. This is gated on an env var at startup, not a cookie or header. Cleared.
- **Sub-2 interface readiness.** `_get_viewer(request)` returns a full profile dict with the `tier` field. The `_require_tier(min_tier)` helper sub-2 plans to write has everything it needs. Cookie shape unchanged. Cleared.
- **Legacy login rate sharing.** `_record_login_failure` and `_login_rate_limited` are shared between the new PIN endpoint and the legacy password endpoint. This is correct behavior — the same rate bucket should apply. Cleared.
- **PIN length validation.** Both `auth_set_pin` and the client-side `pinSubmit` handler validate 4-6 digits. Server-side validation is the authoritative check. Cleared.
- **`/api/auth/profiles` PIN hash leak.** `_public_profile` explicitly omits `pin_hash` and `pin_salt`. The endpoint returns `has_pin: bool` only. Cleared.

---

## Verdict basis

**Bucket: B — ship with small patching.** The classification depends on Charge 1 being treated as a pre-merge blocker (not as a "deploy and fix later" item), which the bucket B definition allows ("fixable in <15 min mechanical change; no constitutional issues").

The Charge 1 fix is mechanical: either (a) move `set-pin` out of the open prefix and require legacy-login session for first-run setup, or (b) require the `_MERIDIAN_PASSWORD` as a `setup_key` field in the request body. Option (a) is ~15 lines; option (b) is ~5 lines. Neither requires architectural rethinking.

Charge 2 (profiles.json in git) is also straightforward: add to `.gitignore` + amend INDEX.md claim + document the operational implication. ~10 lines of text.

Charges 3-9 are medium/low and can be addressed in the same revision pass or tracked as sub-4 backlog items.

No constitutional issues were found at sub-1 scope. The medical privacy gate is sub-2's job; sub-1 does not expose any data API. The session model correctly names users by ID; sub-2 has the `tier` field it needs to implement the constitutional gate.

Bucket F (real attack found) would apply if this were being deployed to production with null PINs today. It is not — the worktree is in review before merge. Treated as Bucket B on the basis that the fix precedes merge.

---

## Reply from the team

Filed by orchestrator (single-builder context per skill rule 2). Each charge gets one of CONCEDE (the charge is right; here's the fix), CONTEST (the charge is wrong; here's why), or EXTEND (concede the point but disagree on the proposed patch; here's the alternative).

### Charge 1 — Unauthenticated PIN setup
**CONCEDE.** Real attack, real blocker. Implemented option (B) from the recommendation: `/api/auth/set-pin` now requires a `setup_key` field matching `_MERIDIAN_PASSWORD`. Rate-limit applies to bad setup_key attempts. Setup flow in the login HTML prompts for the admin password before submitting the PIN. Patch: commit `d468d4e3`. Adversarial test added: "set-pin without setup_key returns 403", "set-pin with wrong setup_key returns 403". Both green.

Option (A) considered and rejected for now: it would require a working /api/me/set-pin endpoint reachable from an authenticated session, which means first-run flow is "log in via /login/legacy, set PIN, log out, re-login via tile." Too many UI steps for v1. Backlog: build the in-session PIN-rotation flow as part of sub-4 Polish.

### Charge 2 — PIN hashes leak via GitHub mirror
**CONCEDE.** The INDEX claim was wrong. Two patches:
- Commit `f24856d9`: `sartor/memory/family/profiles.json` added to `.gitignore`; the bootstrap version with null hashes (already in d3e2bff5 git history) is harmless and stays; INDEX corrected to name the real resistance model (PIN hash includes `_SESSION_SECRET[:16]` derived from never-committed `meridian-password.txt`).
- Commit `cd15a4b7`: server now self-bootstraps `profiles.json` from `_SEED_PROFILES` on first start when missing. Avoids the merge-deletes-file footgun.

### Charge 3 — Rate limit state in-memory only
**CONCEDE.** Patch: commit `8b1ee5d4`. `_login_failures` now persisted to `dashboard/family/.auth-failures.json` (gitignored). Atomic write on each `_record_login_failure` / `_clear_login_failures`. Loaded once at import; stale entries dropped. Monotonic offsets converted to wall-clock for storage, converted back on load. Adversarial test added: "auth-failures.json exists" + "auth-failures has entries" after rate-limit trigger. Green.

### Charge 4 — CSRF middleware only covers /api/tasks
**CONCEDE.** Patch: commit `2c5c638c`. `CsrfMiddleware` now covers all mutating `/api/*` EXCEPT `/api/auth/*` (no session exists yet — relies on Content-Type + SameSite + rate-limit for CSRF mitigation, documented in middleware docstring). Adversarial test added: "color update without CSRF returns 403", "color update with CSRF 200". Both green.

### Charge 5 — Test script gaps
**CONCEDE.** The v1 test in `jobs/85180d3d/test-auth-flow.sh` had 18 assertions but missed 4 of the 18 PLAN.md acceptance tests (#1 PIN-material absence, #16 legacy POST cookie, #17 rate limit, #18 cookie forgery) and zero adversarial cases. v2 test script committed to repo at `dashboard/family/tests/test_auth_flow.sh` with **29 assertions covering all 18 PLAN.md tests + adversarial cases for Charges 1, 3, 4. All 29 green.** PLAN.md updated to reference the in-repo script.

### Charge 6 — Double profile load per request
**EXTEND — defer to sub-4.** Concede the structural inconsistency point. The fix (pass `request.state.viewer` from middleware) is correct but is performance/cleanliness, not security. Deferring to sub-4 Polish so this revision pass stays scoped to security charges. Added to backlog. No commit in this round.

### Charge 7 — CSS injection via color in serve_index
**CONCEDE.** Defense-in-depth, one line. Patch: commit `b0d9a3a3` (bundled with Charge 8). `serve_index` now re-validates the color value against `re.fullmatch(r"#[0-9a-fA-F]{6}", ...)` before injection; falls back to default `#6366f1` on mismatch.

### Charge 8 — innerHTML in renderTiles
**CONCEDE.** Patch: commit `b0d9a3a3` (bundled with Charge 7). `renderTiles` rewritten to use `createElement` + `textContent` for name, tier, age fields. Color attribute checked against `#rrggbb` regex before being set as a CSS property. Eliminates the latent XSS vector if any future endpoint ever lets user input land in `profiles.json`.

### Charge 9 — Session secret coupled to admin password
**EXTEND — defer to backlog.** Concede the operational-coupling point. Decoupling (separate `.secrets/session-salt.txt`) is correct but the practical impact today is "rotating the admin password forces re-login" — annoying but not security-breaking. Filed as a sub-4 / future-improvement backlog item. The rotation flow is rare enough that adding the file now is premature without a real use case driving it.

---

### Summary of revisions

| Charge | Action | Commit |
|---|---|---|
| 1 critical | fix landed | d468d4e3 |
| 2 high | fix landed | f24856d9, cd15a4b7 |
| 3 medium | fix landed | 8b1ee5d4 |
| 4 medium | fix landed | 2c5c638c |
| 5 medium | fix landed (test in repo) | <this commit> |
| 6 low | defer to sub-4 | — |
| 7 low | fix landed | b0d9a3a3 |
| 8 low | fix landed | b0d9a3a3 |
| 9 low | defer to backlog | — |

7 fixes landed; 2 deferred with documented rationale. 29/29 acceptance tests pass after revisions. Ready for re-review (skill Phase 6).
