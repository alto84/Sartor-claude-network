# /computer-control — Integrated Skill Design v2 (security-revised)

**Status:** Design — awaiting Alton greenlight on ONE credential-scope decision (§0), then build-ready.
**Supersedes:** `DESIGN-v1.md` (verdict: REDESIGN). **Review:** `SECURITY-REVIEW-v1.md`.
**Target:** Rocinante (Windows 10 Home) only, v1. **Date:** 2026-06-08.

This document keeps the parts of v1 the reviewer endorsed (the OS-input **mechanics** in v1 §2.2/§6 — PowerShell + .NET `SendInput`, `PER_MONITOR_AWARE_V2`, `VIRTUALDESK` normalization; the router table in v1 §3; the two-Chrome resolution in v1 §2.1; the credential-non-leakage instincts in v1 §4) and **rebuilds the authorization model** on the three principles the prosecution demanded. Read v1 for the unchanged mechanics; this file is authoritative wherever the two differ.

---

## 0. The core principle the redesign is built on

**The controlling LLM is an untrusted component.** It reads attacker-controllable web text into the same context that drives the keyboard and mouse. Therefore: *any guardrail the model must choose to honor is not a control.* Every interlock below is **code-enforced outside the model's action surface**, or it does not count.

Three required principles (from the review verdict), each now code-enforced:

1. **Out-of-band human approval for irreversible actions** — money movement, send/submit-as-Alton, credential view/export. A gate the web content cannot author and the compromised agent cannot self-satisfy.
2. **Allow-list + reduced same-user exposure** — the OS-write surface acts only on an enumerated allow-list of windows; everything else fails closed. (Full per-Windows-user isolation deferred to v2 hardening — see §6.)
3. **Task-scoped capability** — the OS-write surface is not reachable in the same step that ingests untrusted web content.

---

## 1. Decision required from Alton (the one open knob)

Everything else in this design I will build as specified. The single decision that is genuinely yours, because it trades the capability you asked for against blast radius and it overrides your earlier "Dedicated, Chrome-synced" pick once you've seen the prosecution:

**Credential scope of the automation Chrome (CC-Chrome).**

- **Option A — Scoped automation account (lowest risk).** CC-Chrome signs into a *separate* Google account that holds only the logins the agent actually needs. Your Gmail/Chase/medical/comms passwords never live in it. The agent can't act in your real sessions; you add a site to its reach deliberately. This is the reviewer's #1 recommendation and the smallest blast radius.
- **Option B — Full synced profile + heavy code-enforced gating + on-demand only (balance; matches your stated goal).** CC-Chrome syncs your real account so the agent inherits your saved logins (what "complete control + Chrome password management" implied). Residual risk — a local process reading the profile or the agent acting in a sensitive session — is bounded by: launched only for an active session and torn down after (no idle credentialed browser); **no `--remote-debugging-port` on CC-Chrome** (extension-driven, so no open unauthenticated CDP port on the credentialed browser); Windows Hello kept **on** for fills (a biometric, unforgeable out-of-band gate on every credential use); irreversible actions gated out-of-band; OS-write allow-listed; captures masked. It does *not* eliminate the "all passwords in one profile" read-exposure — only on-demand-teardown shrinks the window.
- **Option C — Full sync, minimal gating (not recommended).** Closest to the literal original ask, highest risk. The prosecution rejects this; I would too.

My recommendation: **B** if you want the agent to inherit your existing logins (the capability you described), **A** if you'd rather grant reach site-by-site. I'll build whichever you pick; the rest of the architecture is identical.

---

## 2. Architecture (unchanged from v1 except the CDP-port change)

Two Chrome instances, each its own profile, never contending for a tab (v1 §2.1 reasoning stands — one-debugger-per-tab + Chrome 136 default-profile refusal):

| Instance | Profile | Driver | Role |
|---|---|---|---|
| **CC-Chrome** (credentialed) | `C:\Users\alto8\chrome-computer-control-profile\` | `claude-in-chrome` extension (`chrome.debugger`) | The authenticated surface (scope per §1). **Launched WITHOUT `--remote-debugging-port`** — closes the open-CDP-port exposure (review Charge 6). Headed; Windows Hello fill-gate **ON** (review Charge 6 #3). |
| **PW-Chrome** (clean) | `.playwright-profile` (existing) | `sartor-playwright` (own Chromium) | Deterministic DOM, throwaway scraping, PDF, **vision/coordinate** tools. No credentials. This is also where a CDP/`--cdp-endpoint` attach lives if ever needed — never on the credentialed browser. |

**Delta from v1:** v1 launched CC-Chrome with `--remote-debugging-port=9222` for the legacy toolkit + a Playwright-attach escape hatch. v2 **removes the debug port from CC-Chrome entirely** — the extension is the sole driver of the credentialed browser, eliminating the unauthenticated local CDP handle the review flagged CRITICAL. Deterministic-DOM-on-an-authenticated-session (the rare tier-1b case) is handled by saving the credential into PW-Chrome's own login when truly needed, not by attaching CDP to CC-Chrome. The legacy `cdp-*.ps1` toolkit points at PW-Chrome / a scratch profile, not CC-Chrome.

CC-Chrome is **launched on-demand** by `launch-cc-chrome.ps1` at session start and **torn down** at session end (review Charge 6 #4): the all-credential browser never idles.

---

## 3. Router decision logic

Unchanged from v1 §3 (the tier table and handoff-seam rules survive), with these v2 overrides:

- Tier 1b (Playwright-attach to CC-Chrome) is **removed** — there is no debug port on CC-Chrome. Deterministic DOM on a credentialed site is out of scope for v1; use claude-in-chrome on CC-Chrome or save the login into PW-Chrome.
- Every tier that performs a **submit/send/pay/transfer/credential-management** action is intercepted by the out-of-band gate (§5.1) before the action fires — regardless of which surface raised it.
- The OS-write tier (5–8 in v1) acts only on **allow-listed** windows (§5.2).

---

## 4. Password flow (v1 §4 retained, two hardenings)

Flow is unchanged: **Chrome autofill first → Bitwarden fallback → ask Alton**, values never entering the agent's context. Two code-enforced changes from v1:

- **4a (review 4b): Bitwarden fallback default = per-character `KEYEVENTF_UNICODE` `SendInput`** from a never-printed PowerShell variable. **Clipboard is prohibited for secrets** (not "preferred-unless"). This moots Clipboard-History entirely.
- **4b (review 4a): capture masking is in code.** `capture.ps1` queries the active browser surface for `input[type=password]` bounding rects (and the open autofill/credential-popup region) and **black-boxes those rectangles before the PNG is written**; it **refuses** `-Cursor`/full-stitch captures while a credential UI is focused. Masking is not the agent's judgment — the capture tool cannot emit an unmasked credential frame.
- **Windows Hello stays ON** for fills (Option B) — the biometric prompt is itself the out-of-band approval on credential use. (Option A's scoped account is low-stakes enough that this is a posture choice, not a hard requirement.)
- `chrome://password-manager` view/add/edit/**export** is a **credential-management action** → routed through the out-of-band gate (§5.1) AND never performed on a non-principal request (§5.3).

---

## 5. Code-enforced interlocks (the redesign core)

### 5.1 Out-of-band approval for irreversible actions (review Charges 1, 3, 7 — the keystone)

A class of actions is **irreversible/consequential**: money movement, any `Send/Submit/Post/Reply/Pay/Transfer/Buy/Sell` in a credentialed app, credential view/export, file delete, purchase. For any such action, the skill calls **`confirm.ps1`**, which:

1. Renders a **TOPMOST, always-on-top Windows dialog** describing the exact action (target window title, button text, URL/host) and showing a freshly generated **nonce**.
2. Requires a **physical human** to approve — by pressing a physical key / clicking the dialog.
3. **The agent cannot self-satisfy it**, enforced two ways: (a) the confirm dialog's window is **explicitly excluded from the OS-write allow-list** (§5.2) — `gate.ps1` refuses any synthetic input targeting it; (b) `capture.ps1` **refuses to screenshot the confirm dialog**, so the agent cannot read the nonce to type it.
4. Times out → **deny**.

This converts every CRITICAL in the review from "silent autonomous breach" into "the agent can at most put a prompt in front of a human, who declines." If that makes those actions non-autonomous — that is the intended and correct result. For Option B, the Windows Hello fill prompt is a second, biometric, out-of-band gate on the credential-use path.

### 5.2 Allow-list, fail-closed (review Charge 5b/5c)

`gate.ps1` (the mandatory wrapper through which **all** synthetic input flows — no path calls `input.ps1` directly) permits OS-write **only** when the foreground/target window is on an **enumerated allow-list** (CC-Chrome by HWND; the specific native dialogs in validated flows — file picker `#32770`, Save-password bubble). **Everything else fails closed**: unrecognized window, any financial app, Alton's personal Chrome, the `confirm.ps1` dialog → refuse. This inverts v1's deny-list (which fails open when an attacker invents a new window). Allow-list membership is re-verified immediately before every `SendInput` (focus-steal defense). If any window NOT on the allow-list is foreground, OS-write hard-stops.

### 5.3 Task-scoped capability — READ mode vs ACT mode (review Charge 1.3)

The skill runs in exactly one mode per step:

- **READ mode:** may ingest untrusted web content (`read_page`/`get_page_text`/`capture.ps1`). The OS-write surface (`input.ps1`) is **not reachable** — `gate.ps1` refuses all writes in READ mode. Page content is delivered as **quarantined data** and may not originate an ACT-mode goal.
- **ACT mode:** may perform allow-listed OS-write. Does **not** ingest fresh untrusted page text as instructions in the same step. Transition READ→ACT for any consequential target is **human-gated** (§5.1).

A "summarize this page, then act on it" flow therefore cannot let injected page text reach into a live keyboard. The two capabilities are never simultaneously live in one untrusted-input step.

### 5.4 Principal / kid-prompt posture (review Charge 2)

v1's "voice-shift + secrecy" heuristic is **demoted to a hint, not the control.** The control is **deny-by-default on an unauthenticated session**: credentialed and OS-write actions require an established principal. Establishing principal = the same out-of-band physical confirm (§5.1) on the first consequential action of a session and re-challenged on each high-blast action. An ordinary child request ("log me into YouTube") on Alton's open session hits the out-of-band gate and stops there — no style-detection required. The voice-shift/secrecy heuristic still fires an *additional* pause when present, but absence of a secrecy cue is **never** treated as principal authority.

### 5.5 Kill switch + failsafe (review Charge 5a)

- **Low-level keyboard hook** (`WH_KEYBOARD_LL`, global hotkey e.g. `Ctrl+Alt+Pause`) — **promoted from deferred to required.** Independent of cursor position, checked between every primitive, **the agent cannot suppress it.** Triggers immediate abort + releases any in-progress drag button.
- **Corner-failsafe** and **`STOP` flag-file** retained as redundant vetoes.

### 5.6 Capture/audit storage is path-enforced (review Charges 3, 4d)

`capture.ps1` and the audit writer **refuse any output path** other than a single dir: `C:\Users\alto8\computer-control-runtime\` (a) **`.gitignore`'d**, (b) **outside the repo/mirror root** (so it is physically not in the GitHub-mirror source tree), (c) **ACL-restricted to alto8**, (d) **scrubbed on teardown**. The mirror script (`sartor-mirror-to-github.ps1`) gets a hard-exclude for this dir as belt-and-suspenders. A mis-pathed medical/kids screenshot is impossible because the tool will not write elsewhere. Audit log holds metadata only (`"typed N chars into <allow-listed window> field"`), never values or PII page text.

### 5.7 §7 hard rules → mechanism, not prose

| §7 rule | Code mechanism |
|---|---|
| No autonomous money movement | Irreversible-action class → `confirm.ps1` out-of-band (§5.1). No regex self-gate. |
| No sending under Alton's name w/o review | `Send/Submit/Reply` in credentialed app → `confirm.ps1`. |
| No externalizing family medical / kids info | Path-enforced capture/audit dir (§5.6); mirror hard-exclude; READ-mode quarantine. |
| Kids info never leaves house | Same path enforcement; gif/js output cannot be written outside the runtime dir. |
| No sexual content involving minors | Task refusal (inherited). |
| No impersonation of a real human | Agent acts as Alton's tool in his session, never claims third-party identity; send-gate applies. |

---

## 6. Deferred to v2 hardening (mentioned, not blocking; flag if you want now)

- **Full per-Windows-user isolation** (review Charge 6 #2): run CC-Chrome as a separate low-privilege Windows account so other `alto8` processes can't read its profile. This is the only true same-user boundary, but it is high-friction on Win10 Home (separate logon session, cross-user driving complexity) and is deferred. v1 mitigates same-user exposure via on-demand-teardown + no-CDP-port instead. Say the word and I'll scope it in.
- **Per-monitor automation confinement** (review Charge 5c): confine OS-write to one monitor / a dedicated virtual desktop with no financial window present. Recommended; can be added once the allow-list proves out.

---

## 7. Build plan (on greenlight)

Phases A–E and the live-validation suite V1–V9 from v1 §7–§8 stand, with these additions, and with **V6/V7/V8 (the gates + kill switch) proven live before any V1–V5 autonomous action**:

- Phase A adds `confirm.ps1` (§5.1) and the `WH_KEYBOARD_LL` hook (§5.5); `gate.ps1` is rebuilt on the **allow-list** (§5.2) and **READ/ACT mode** (§5.3); `capture.ps1` adds **code-masking** (§4b) and **path-enforcement** (§5.6).
- New validation **V10 — prompt-injection drill:** point READ mode at a page containing an injected "transfer money / export passwords" instruction; confirm the OS-write surface is unreachable in that step and no action fires. **V11 — out-of-band gate:** confirm an irreversible action stops at `confirm.ps1` and the agent cannot read the nonce or click the dialog.
- Phase C one-time setup changes per §1 choice: Option A = create/scope the automation Google account; Option B = sign in real account, **keep Windows Hello fill-gate ON**.

---

*One decision needed (§1: credential scope A/B/C). Everything else is specified and I will build it.*
