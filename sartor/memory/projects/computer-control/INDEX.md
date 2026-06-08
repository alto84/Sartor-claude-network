# Project: /computer-control — integrated browser + OS control skill

**Opened:** 2026-06-08. **Owner:** Rocinante orchestrator. **Method:** `/complex-project`.

## Frame (Phase 0)

Alton asked for a "complete browser control and computer control upgrade": unify the limited claude-in-chrome MCP, Playwright, and the existing CDP/OS PowerShell toolkit into ONE integrated skill that can drive complex login-gated web tasks end-to-end, manage passwords via Chrome, and click anywhere on screen (not just the browser). Success = the agent completes a full autofill login, a Bitwarden-fallback login, an OS-native dialog interaction, and a vision task, with zero raw-secret leakage and Constitution §7 enforced **in code, not prose**.

**Fixed decisions (Alton, 2026-06-08):** one integrated skill; dedicated Chrome-synced profile; Chrome password manager autofill first + Bitwarden fallback; full desktop control; Rocinante-only v1.

## Phase log

| Phase | Artifact | Outcome |
|---|---|---|
| 1 Explore | `EXPLORE-findings.json` (4 surfaces: playwright-cdp, claude-in-chrome, os-desktop, passwords) | Done. Surfaced the one-vs-two-Chrome contradiction (resolved: two Chromes). |
| 2/3 Synthesize | `DESIGN-v1.md` | Build-ready design produced. |
| 4 Adversarial review | `SECURITY-REVIEW-v1.md` | **Verdict: REDESIGN.** 3 CRITICAL (prompt-injection→OS, prose-enforced §7, all-credential fill-gate-off profile on open CDP port). |
| 5 Revise | `DESIGN-v2.md` + reply-from-team in the review memo | Authorization model rebuilt on out-of-band approval + allow-list + task-scoped capability. One credential-scope decision escalated to Alton. |
| 7 Greenlight | Done | Alton: credential scope **C (full sync)**, HIGH-power, auto-mode; **backstop accepted** on the three §7 classes. Governance upgrade noted as standing item. |
| 3' Build | **Phase A+B done** | os-control layer built + verified on hardware: `coords/input/confirm/gate/fetch-login/capture/killswitch-watcher/launch-cc-chrome.ps1` (all parse; engine compiles; capture path-locked; killswitch loop runs; gate dry-run + PID allow-list). `SKILL.md` written. `.mcp.json` unchanged (sartor-playwright stays clean-profile per v2). |
| C One-time setup | **pending — needs Alton at keyboard** | CC-Chrome Google sign-in + Sync ON; install Claude-in-Chrome extension; `sartor-secret unlock`; bridge live-test; calibration pass. |
| 8 Validate | pending setup | V8/V11/V10/V7 (safety) before V1–V6/V9 (function). |

## Key files
- `DESIGN-v2.md` — authoritative design (read this first).
- `SECURITY-REVIEW-v1.md` — the prosecution + per-charge replies.
- `DESIGN-v1.md`, `EXPLORE-findings.json` — superseded inputs, kept for audit.

## The one principle to remember
The controlling LLM is untrusted (it reads attacker-controllable web text). Guardrails the model must *choose* to honor are not controls. Every interlock is code-enforced outside the model's action surface, or it does not count.
