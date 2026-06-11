# Metaview: the overnight session (2026-06-11) — what worked, what I changed

Alton asked me to "keep a Metaview eye on this whole process and suggest then implement improvements, particularly with computer control." This is the reflection, and the changes are already implemented (links below), not just proposed.

## How the night actually went (process)

The night was a cascade of interrupts: a network question became an outage diagnosis became a hands-on gateway migration became a peer-onboarding became a constitutional rewrite became a hearth visit. Each new instruction arrived while the previous task was mid-flight. What kept it coherent:

- **Background agents for independent, mechanical work; the orchestrator for the irreducible.** I ran three subagents concurrently (gpuserver2 vast.ai onboarding, the family-ops brief, the ops-fixes batch) and a 15-agent review workflow, while personally holding the two things that are *mine* and cannot be delegated: the Constitution v0.7 authoring and the hearth monument. That split is the right shape and worth repeating: delegate breadth, keep the soul-of-the-system work in the orchestrator.
- **Coordination by file-ownership, not locks.** I told each background agent explicitly which files NOT to touch (CLAUDE.md, Constitution, fleet.yaml, REGISTRY.yaml, hearth/, the family-brief file). Zero merge conflicts across ~10 commits from 4 writers. The discipline that made it work: assign each writer a disjoint file set up front.
- **Commit-and-push after every coherent unit, with `pull --rebase --autostash`.** With multiple writers (including the cloud-runner that pushes to GitHub directly), frequent small commits + rebase kept divergence from accumulating. The one real snag was the cloud-runner mirror divergence — now documented with a fix proposal (see below).

## What I changed tonight (implemented, not proposed)

- **computer-control SKILL.md** — added a "Known surfaces & recipes" section with two field-learned rules: (1) the UCG gateway is **API-first** (X-API-KEY on both proxy surfaces) because its UI is cert-walled and React-formed; (2) **`form_input` silently no-ops on React-controlled fields** — fall back to real click+type. Both came directly from driving the UCG port-forward form tonight, where every `form_input` returned an empty set and only click+type stuck.
- **rules + skills pricing reconciliation** (ops agent) — `gpu-business-ops.md` and the vast.ai skill no longer contradict the live autonomous-pricing grant.
- **cloud-runner "unverifiable-from-this-runner" gate** (ops agent) — gather/curation skills no longer escalate fleet-status they can't actually verify; kills the 21-run false-OFFLINE P0.
- **scheduled-task health auditor** — `scripts/win-tasks/check-task-health.ps1` (test-run correctly flagged the diverged mirror task).
- **tasks/TODAY.md + ACTIVE.md** regenerated from 70-day staleness.
- **Constitution v0.7 (proposed)** — fleet-as-REGISTRY, autonomous-pricing grant, §14b hosted-runner discipline, §15 corrigibility code-backstop clause (which formalizes exactly the computer-control gate.ps1 design), ad-hoc peers, Fable 5 substrate.

## Computer-control: the metaview verdict

computer-control performed its job tonight (it got me into the UCG UI via Alton's authenticated Chrome session to create the first port-forwards before I'd discovered the API), and its safety design held — but the sharper lesson is one *level up*: **the most-scoped tool for the UCG was never the browser at all; it was the REST API.** The skill already preaches "most-scoped tool wins"; tonight added the specific routing fact for this gateway. The §15 amendment generalizes the gate.ps1 principle into the Constitution: where a hard constraint can live in code rather than disposition, it should. That is computer-control's core idea promoted to constitutional status.

## Open process improvements (proposals, for Alton)

- **Mirror pipeline** — cloud runners push direct to GitHub (no SSH to canonical); fix proposed at `inbox/rocinante/2026-06-11-mirror-pipeline-proposal.md` (cloud/inbox branch + auto-merge + real 15-min trigger + DIVERGED monitoring).
- **Register `check-task-health.ps1`** as a scheduled task so silent task failures page instead of lurking.
- **A Rocinante dead-man switch** (review item, scored 8.0): rtxserver cron pages if Rocinante goes silent — the orchestrator host is currently a single point of failure with no external watcher.
