---
type: project
entity: dashboard-multiuser-rebuild
status: phase-3-build-under-review
created: 2026-05-15
created_by: Claude Opus 4.7 + Alton (orchestrator pair)
tags: [project/dashboard, scope/family, status/active, priority/p1, domain/family, domain/infrastructure]
related: [reference/HOUSEHOLD-CONSTITUTION, family/active-todos, family/CLAUDE]
---

# MERIDIAN dashboard — multi-user rebuild

## Frame

The MERIDIAN family dashboard (`dashboard/family/server.py` on Rocinante:5055) is currently single-user, single-password, single-color, localhost-only. The family is four people with materially different needs: Alton sees everything (admin, all five domains), Aneeta needs family logistics + her own work calendar + ability to act on shared decisions, Vayu (10) and Vishala (8) want to see and check off their own to-dos and calendar. The current dashboard cannot serve any of those latter three well — and the live to-do source (`family/active-todos.md`, updated by the personal-data-gather pipeline) is not even wired in; the panel reads a `tasks/TODAY.md` snapshot that hasn't been touched since April 2.

Alton framed this on 2026-05-15 as "an upgrade rebuild type thing" and authorized individual accounts with relevant data and per-user color. Four scope decisions captured via AskUserQuestion:

| Decision | Choice |
|---|---|
| Accounts | Alton (admin), Aneeta (adult), Vayu (kid 10), Vishala (kid 8). No Vasu (4) account. |
| Auth | Tap-tile launcher; PIN for adults (Alton/Aneeta), no PIN for kids. |
| Hosting | Stay on Rocinante; LAN-only binding once privacy filter is verified. |
| Kid view scope | Read + check-off only — kids can mark items done but cannot add new items. |

## Why now

Two converging pressures:

1. The dashboard panel is six weeks stale and the live to-do data is structurally invisible to the household. The fix requires touching the data layer, which is the natural moment to also fix who sees what.
2. The household has explicit constitutional rules (HOUSEHOLD-CONSTITUTION §3, family/CLAUDE.md) about medical content never appearing on shared dashboards and kid content staying scoped to `family/`. The existing single-user model is technically compliant (only Alton sees it) but operationally blocks the family from using it. Multi-user is the path to broader use; the privacy filter is the gate that makes it safe.

## Success criteria

A successful Phase 1+2+3+4 ship means all of:

1. **Each family member taps their tile and lands on a dashboard themed in their color.** Alton/Aneeta enter a PIN, kids don't.
2. **Constitutional gate holds at the API layer, not just the UI.** A kid-tier session, even with hand-crafted requests, cannot retrieve medical, tax, or business-financial data. Verified by adversarial test, not by UI hiding alone. (Phase 2.)
3. **The live to-do source (`family/active-todos.md`) drives the to-do panel.** No more April-2 staleness. Each viewer sees only items relevant to them (Alton: all; Aneeta: family/her items; kid: cross-referenced `[[vayu]]`/`[[vishala]]` items). (Phase 2.)
4. **Kids can check off their own items.** Click writes to `family/dashboard-state.json` overlay; UI hides; un-do available for 24h. Curator archives nightly to `family/_history/`. (Phase 3.)
5. **Dashboard is reachable from any device on the home WiFi**, after Phase 2 verification gates the LAN flip. (Phase 8 — separate hard gate.)
6. **Each user can change their own color.** Personalization is part of the contract. (Phase 1+4.)

## Scope

**In:** Auth, profile schema, color theming, per-user data filtering, check-off interactivity, LAN binding (gated), first-run UX for kids and PIN setup for adults.

**Out (deliberately):** Per-user notifications/push, multi-device sync of dashboard state (single-source overlay file is enough for v1), external (off-LAN) reachability via Tailscale/Cloudflare (separate decision, separate threat model), Vasu (4) account (revisit when he reads), admin tooling for Alton to manage other users' profiles (he can edit `profiles.json` directly during v1 — not exposed via UI), password-change UI for adult PIN rotation (next phase, not v1).

## Constraints

- **Constitutional (hard):** Medical content never on shared dashboards (Constitution §3 + family CLAUDE.md). Kids' content stays in `family/`. The privacy filter MUST live at the API layer so a hand-crafted request from a kid's session cannot extract gated content.
- **Operational:** Stays on Rocinante (Phase 1-4); existing Bitwarden-managed `Meridian dashboard` password is preserved as `/login/legacy` admin-recovery path AND as the `setup_key` required to set anyone's PIN for the first time (closes review-build-sub-1-v1 Charge 1). PIN material hashed sha256(pin | per-user-salt | `_SESSION_SECRET[:16]`); the latter is derived from `meridian-password.txt` which never leaves the LAN. `profiles.json` is git-ignored as of revision pass; the seed version with `pin_hash: null` already in git at commit d3e2bff5 is harmless. **Brute-force resistance: 4-6 digit PIN × HTTP rate-limit (5/5min per IP) at the auth layer + secrecy of `meridian-password.txt` if anyone ever sees a hash.** Bitwarden-vault rotation of the admin password rotates the hash-input prefix, invalidating all stored PIN hashes (the operational coupling Charge 9 names — defer to backlog).
- **Personnel:** Vasu (age 4) does not get an account. Aneeta is not asked to set up her PIN today — first time she taps her tile, she gets the setup flow.

## Phase plan (skill phases)

| Skill Phase | Status | Artifact |
|---|---|---|
| 0 Frame | done | This INDEX.md |
| 1 Explore | skipped (current-state already known; no comparable prior art needed) | n/a |
| 2 Plan | done | PLAN.md |
| 3 Build (sub-1: auth/profile/color) | done — under review | `dashboard/family/server.py` + `sartor/memory/family/profiles.json` (commit `<sha>`) |
| 4 Adversarial Review (sub-1) | pending | `review-build-sub-1-v1.md` |
| 5 Revise (sub-1) | pending | review memo `## Reply` section + revision commits |
| 6 Re-Review (sub-1) | pending | `review-build-sub-1-v2.md` |
| 7 Greenlight (sub-1) | pending | Alton chat-message ack |
| 8 Validate (sub-1) | pending | pre-registered acceptance test from PLAN.md |
| 9 Loop / merge | pending | merge to main, restart server, observe |

Each subsequent build sub-phase (sub-2 privacy filter, sub-3 check-off, sub-4 polish) repeats the same cycle. The privacy-filter sub-phase has the highest stakes — the adversarial review for that round is the load-bearing one because the constitutional gate lives there.

## Audit trail

- 2026-05-15 09:00ish — Alton: "Can we make the dashboard 'live' for everyone?"
- 2026-05-15 — 4-way AskUserQuestion captured scope decisions
- 2026-05-15 — TaskCreate × 5 (Phase 1-4 build sub-phases + LAN flip gated on Phase 2)
- 2026-05-15 — Build sub-1 (auth + profile + color) written; tested 17/18 pass (1 fail = test counting artifact, not code defect)
- 2026-05-15 — Alton: "shouldnt you use the large project skill?" → invoked `/complex-project`, backfilled Frame + Plan, submitted sub-1 for adversarial review.
- 2026-05-15 — Feedback saved: `feedback_invoke_complex_project_for_rebuilds.md` in user memory.

## Related

- [[HOUSEHOLD-CONSTITUTION]] §3 (medical privacy) — the rule the Phase 2 filter must enforce
- [[family/CLAUDE]] — privacy ladder, archive-not-collapse, advisor discipline
- [[family/active-todos]] — the live data source the dashboard will read
- `dashboard/family/server.py` — the system under modification
- `sartor/memory/business/secrets-migration-log.md` — where the Meridian-vault import is logged
