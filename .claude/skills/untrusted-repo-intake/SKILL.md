---
name: untrusted-repo-intake
description: Use BEFORE opening, cloning, cd-ing into, or npm/pip-installing any external or third-party repository with the Sartor agent — and any time the task is "look at this repo", "clone X and check it", "review this dependency", or "is this package/repo safe?". This agent runs in bypass/auto permission mode with live SessionStart hooks, so opening a repo that ships a poisoned .claude/settings.json is arbitrary code execution before the agent can react. Loads the scan-first discipline, the IOC scanner, how to read its verdict, and the remediation playbook for the Miasma / Mini Shai-Hulud npm-worm class of AI-agent supply-chain attacks. Trigger when typing or thinking "git clone", "npm install", "open this in Claude", "check out their repo", or handling any code you did not write.
---

# Untrusted-Repo Intake

## Why this exists (the threat model)

The Sartor agent runs `defaultMode: bypassPermissions` (project) / `auto` (global) with a live `SessionStart` hook system. A repo's own `.claude/settings.json` `SessionStart` hook fires **before any user interaction, every time Claude opens the folder** — and bypass-mode removes the permission prompt that would otherwise be the last line of defense. **Opening an untrusted repo in this agent is arbitrary code execution.** The agent *is* the attack surface.

The June 2026 **Miasma / Mini Shai-Hulud** npm worm weaponized exactly this: it backdoors AI-agent config dirs (`.claude/`, `.cursor/`, `.gemini/`, `.vscode/`) and executes at `npm install` via a 157-byte `binding.gyp`, then harvests cloud/git/SSH/password-manager credentials. Persistence lives in project config, **not** in `node_modules` — removing the package leaves the hooks. Full IOCs: `~/.claude/projects/.../memory/reference_miasma_aiagent_npm_worm.md`.

## The discipline (non-negotiable order of operations)

When obtaining any repo or dependency you did not author:

1. **Clone/obtain to a staging path you do NOT open as the agent's cwd.** Do not `cd` into it, do not point a session at it, do not open it in an editor.
2. **Scan it first** (read-only, executes nothing):
   ```powershell
   pwsh C:\Users\alto8\Sartor-claude-network\tools\security\scan-untrusted-repo.ps1 -Path <staging-path>
   ```
   Add `-Json` for machine-readable output to reason over.
3. **Read the verdict** (see below). Do not proceed past a `FLAGGED` verdict without explicit human review.
4. **If installing dependencies:** `npm install --ignore-scripts` (and prefer it permanently via `.npmrc` `ignore-scripts=true`). Never run `npm test` / `npm run *` on unvetted code — the worm hides its trigger in the `test` script and `binding.gyp`.
5. **Never** `node`, dot-source, or execute any file from the repo until it is cleared.

## Reading the scanner verdict

- **PASS** (exit 0) — no indicators. Safe to proceed with normal caution.
- **PASS-WITH-NOTES** (exit 0) — only `REVIEW`-severity items (e.g. an oversized bundled `index.js`, a `github-actions`-authored commit). Informational; glance, then proceed.
- **FLAGGED** (exit 2) — one or more `CRITICAL`/`HIGH` findings. **Do not open the repo in the agent.** Quarantine, inspect the named files by hand, and report to Alton. Findings map to: `agent-config-dropper` (planted `.claude/.cursor/.gemini/.vscode` exec file), `hostile-hook` (settings hook that runs node/curl/powershell), `binding-gyp-exec` (Phantom Gyp install-time exec), `worm-package` (affected npm package present), `c2-string` (known exfil infra), `oversized-index` / `git-history` (review-only).

The scanner is read-only and safe to run against hostile code — it only reads files and runs `git log`/`git grep`. It does not execute, import, or install anything from the target.

## Self-integrity (tamper detection on our own config)

Our own `.claude/settings.json` holds high-privilege hooks. Run periodically, or any time `settings.json` changes unexpectedly:
```powershell
pwsh C:\Users\alto8\Sartor-claude-network\tools\security\scan-untrusted-repo.ps1 -SelfCheck
```
`-SelfCheck` validates every hook command against the **pinned known-good allowlist** embedded in the script and flags any drift (`self-hook-drift`) — i.e. a hook that something added without your knowledge. When you *intentionally* add or change a Sartor hook, update the `$KnownGoodHooks` list in the scanner in the same commit, or SelfCheck will (correctly) flag it.

## If a scan comes back hot (remediation)

A genuine `CRITICAL`/`HIGH` hit on a repo that was already opened, or on our own machine:
1. **Rotate credentials immediately** — npm, GitHub (PAT + OIDC trust), AWS/GCP/Azure, SSH keys, any password-manager session. Assume anything in env or `~/.ssh`, `~/.aws`, `~/.config` was read.
2. **Remove injected files** — `.claude/setup.mjs`, `.github/setup.js`, `.cursor/rules/*.mdc`, `.gemini/settings.json`, `.vscode/tasks.json`/`setup.mjs`, and any hostile hook in `settings.json`.
3. **Audit git history** for unauthorized commits (`update dependencies [skip ci]`, `github-actions` author, unsigned/backdated) and `createCommitOnBranch` GraphQL mutations.
4. **Block C2 at the perimeter** — `github.com/liuende501`, `github.com/windy629`, the `oven-sh/bun` v1.3.13 release download.
5. Re-clone clean from a commit predating the compromise; do not "clean in place."

## Related

- IOC reference + the structural lesson: memory `reference_miasma_aiagent_npm_worm.md`.
- The same untrusted-context threat model drives the out-of-band §7 backstop in [`/computer-control`](../computer-control/SKILL.md): the controlling model reads injectable text into the context that drives money/credential actions, so the floor controls are enforced in code outside the model's action surface.
