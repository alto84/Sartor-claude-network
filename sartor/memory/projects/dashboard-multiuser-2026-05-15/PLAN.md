---
type: project-plan
project: dashboard-multiuser-2026-05-15
status: active
frozen: 2026-05-15
related: [./INDEX]
---

# Plan — MERIDIAN multi-user rebuild

This is the method ladder + measurement spec + pre-registered acceptance criteria for each of the four build sub-phases. Frozen 2026-05-15. Post-hoc changes to acceptance criteria are not allowed without a documented amendment.

## Method ladder

Build proceeds in four sub-phases, each going through the full complex-project cycle (Build → Review → Revise → Re-Review → Greenlight → Validate). Sub-phases are sequenced because each depends on the prior. LAN flip is a separate hard gate after sub-2 verifies.

### Sub-1 — Profile + auth foundation (~3h)

**Files touched:** `sartor/memory/family/profiles.json` (new), `dashboard/family/server.py` (modified).

**Mechanism:** `profiles.json` holds four user records (id, name, tier, color, optional PIN hash + salt). New endpoints `/api/auth/profiles`, `/api/auth/login`, `/api/auth/set-pin`, `/api/me`, `/api/me/color`. Login page (`/login`) rebuilt as a tile-launcher; tap a tile, kids are in immediately, adults enter (or first-time set) a 4-6 digit PIN. Color injected as CSS variable into `serve_index` before first paint. Session cookie format unchanged (user_id:HMAC sig). Legacy single-password admin path preserved at `/login/legacy` for recovery.

**What is NOT changed in sub-1:** Any API endpoint other than the new auth ones. Privacy filtering, data sources, panel content. Every user sees the same data after sub-1; only the cookie identity and the accent color differ.

### Sub-2 — Per-user data filter at the API layer (~3h, highest-stakes)

**Files touched:** `dashboard/family/server.py` (each existing endpoint gets a tier check), `family/active-todos.md` parser (new), tests.

**Mechanism:** A `_require_tier(min_tier)` helper decorates endpoints. Three explicit tiers, ordered: `kid < adult < admin`. Each endpoint declares its minimum tier; viewer below that gets 403, not silently filtered. The `active-todos.md` parser pulls Obsidian-callout blocks and filters by `[[vayu]]` / `[[vishala]]` cross-reference for kid views. Calendar API already filters by attendee for kids.

**Constitutional gate:** Endpoints exposing medical, tax, business-financial, career, or AstraZeneca content are admin-tier-only. Endpoints exposing family calendar, household to-dos, kid-specific items are adult-or-above (and kids see only their own filtered slice). Tested by adversarial request from a kid-tier cookie — NOT trusted from the UI hiding alone.

### Sub-3 — Check-off interactivity (~2h)

**Files touched:** `sartor/memory/family/dashboard-state.json` (new overlay), `dashboard/family/server.py` (new check-off endpoints), `index.html` (Done buttons on cards).

**Mechanism:** Per-card Done button. Click writes a `{user_id, item_hash, ts}` row to the overlay. Render layer hides dismissed items in the next refresh. A "Recently dismissed" disclosure lets the user un-do within 24h. Curator picks up the overlay nightly and archives resolved items from `active-todos.md` into `family/_history/` per the archive-not-collapse discipline.

### Sub-4 — Polish (~2h)

**Files touched:** `index.html` (color picker UI, larger kid touch targets, logout/switch-user link), tests.

**Mechanism:** First-run color picker tile for kids. Logout endpoint already exists; expose a switch-user button. Larger fonts and touch targets for kid tier. Integration tests covering each tier × each endpoint.

## Pre-registered acceptance criteria (frozen)

Each sub-phase's validation is bucketed before firing. Six buckets, every plausible result lands in exactly one:

### Sub-1 buckets

| Bucket | Definition | Outcome |
|---|---|---|
| **A — clean ship** | All 18 acceptance tests pass (see test list below); zero security regressions found in adversarial review; no new endpoints break LAN-only middleware. | Merge to main, restart server, move to sub-2. |
| **B — ship with small patches** | 17+ tests pass; reviewer flags ≤3 issues, each fixable in <15 min mechanical change; no constitutional issues. | Apply patches, re-test, merge. |
| **C — revise and re-review** | 14-16 tests pass; reviewer flags 4-8 issues OR one issue requires design discussion. | Loop back to Phase 5. |
| **D — fundamental design issue** | <14 tests pass OR reviewer surfaces a constitutional or architectural concern. | Pause, surface to Alton, reframe before continuing. |
| **E — process violation** | Phase skipped, no review memo committed, no greenlight obtained. | Halt, document violation, restart from violated phase. |
| **F — adversarial test surfaces real attack** | Reviewer (or test) finds a way to bypass auth or escalate tier. | Treat as P0; fix before any merge; consider whether sub-2 needs to come first. |

### Sub-1 acceptance test list (18 tests, all must pass for bucket A)

1. `GET /api/auth/profiles` returns 4 users, no PIN hashes leaked
2. `POST /api/auth/login {user_id: 'vayu'}` returns 200, sets cookie, no PIN required (kid tier)
3. `GET /api/me` with vayu cookie returns `{id: 'vayu', tier: 'kid', ...}`
4. `GET /` with vayu cookie injects `meridian-viewer-theme` style block with vayu's color
5. `POST /api/auth/login {user_id: 'alton', pin: '1234'}` BEFORE setup returns 400 "PIN not set yet"
6. `POST /api/auth/set-pin {user_id: 'alton', pin: '<X>'}` returns 200; profiles.json updated atomically
7. `POST /api/auth/set-pin` for same user twice returns 400 (PIN already set)
8. `POST /api/auth/login {user_id: 'alton', pin: 'wrong'}` returns 400
9. `POST /api/auth/login {user_id: 'alton', pin: '<X>'}` correct returns 200
10. `GET /api/me` with alton cookie returns admin tier
11. `POST /api/me/color {color: '#8b5cf6'}` returns 200; persists; `/` reflects new color
12. `POST /api/me/color {color: 'not-a-color'}` returns 400
13. `GET /api/me` with no cookie returns 401
14. `GET /login` serves tile-launcher HTML (contains `tile-grid`)
15. `GET /login/legacy` still serves admin-recovery form
16. `POST /login/legacy` with correct password sets cookie as `alton`
17. Rate-limit kicks in at >5 failed PIN attempts from same IP within 5 min
18. Session cookie cannot be forged without `_SESSION_SECRET` (negative test: fake `vayu:badsig` cookie returns 401)

### Sub-2 acceptance test list (the constitutional gate)

Pre-registered for when sub-2 happens. Not relevant for sub-1 review, but documented now so the gate isn't designed post-hoc.

1. Kid-tier cookie hitting `/api/finances` returns 403, not 200-with-filtered-data
2. Kid-tier cookie hitting `/api/career` returns 403
3. Kid-tier cookie hitting `/api/family-todos` returns ONLY items cross-referenced to that kid's slug
4. Adult-tier cookie hitting `/api/finances` returns 403 (Aneeta does not see Alton's business panels)
5. Adult-tier cookie hitting `/api/family-todos` returns ONLY items NOT marked alton-only
6. Admin cookie hitting any endpoint returns its full data
7. Direct GET to medical content path with kid cookie returns 403
8. Replay attack: capture admin cookie, replay with substituted user_id — signature check rejects

## First experiment

Sub-1 is "fired" already (build complete on the worktree branch, not yet committed/merged). Adversarial review is the first real interpretation gate.

## Test artifact

Adversarial test suite lives at `dashboard/family/tests/test_auth_flow.sh`. Run target: uvicorn on `127.0.0.1:5056` from this worktree (with `.secrets/meridian-password.txt` populated). Script self-bootstraps `profiles.json` and resets `.auth-failures.json` between runs.

The v1 test script had 18 assertions but missed 4 of the 18 pre-registered PLAN.md tests (see review-build-sub-1-v1 Charge 5). The v2 in-repo script covers all 18 PLAN.md tests plus adversarial coverage for Charges 1, 3, 4, 7, 8 — **29 assertions, all passing after revisions land**.

## Out of scope for this plan

- Tailscale / off-LAN reachability — separate decision, separate threat model, separate plan when relevant
- Vasu account — revisit when he reads
- Push notifications, mobile-app wrapper, native widget integration — v2+
- Per-user MFA beyond PIN — not needed for LAN-only; revisit only if hosting model changes
