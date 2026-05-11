---
type: spec-stub
spec_id: NEURVATI-FIREWALL
status: pending-build
plan_ref: PLAN-FINAL §1, §3.C, §6 #4
target_path: sartor/memory/feedback/neurvati-firewall.md
owner: skill-editor (drafts), Alton (ratifies hard form)
updated: 2026-04-25
related: [PLAN-FINAL, HOUSEHOLD-CONSTITUTION, OUT-OF-BAND-FALLBACK, RTXPRO6000-PREFLIGHT, VASTAI-DISPATCH-WRAPPER]
---

# Spec — Neurvati firewall (feedback rule)

Encodes the principle from PLAN-FINAL §1 and §3.C that Aneeta's professional life is hers. The rule is auto-injected like other feedback files.

## Target file

`sartor/memory/feedback/neurvati-firewall.md`

## Expected frontmatter

```yaml
---
name: Neurvati firewall — Aneeta's professional surfaces are off-default
description: Default-on rule blocking the agent from reading Aneeta's Neurvati calendar, work email, and her mentorship thread with Bruce. Soft form effective immediately; hard form pending Constitution §2a ratification after the coffee conversation.
type: feedback
form: soft  # soft | hard — flips on §2a ratification
---
```

## What triggers

- Any tool call (Calendar, Gmail, Drive, Chrome) whose target matches Aneeta's Neurvati surfaces.
- Any prompt that asks the agent to summarize, infer, or act on Aneeta's professional load without her explicit say-so.

## Scope of the firewall — "Neurvati surface" means

- Aneeta's Neurvati work calendar (any calendar she identifies as Neurvati / work).
- Her Neurvati work email (the address with her employer's domain).
- Her mentorship thread with Bruce (named in PLAN-FINAL §1 as out-of-bounds).
- Any document, Slack/Teams equivalent, or shared drive folder she has flagged as work.
- Inferences about her workload, promotion trajectory, or clinical schedule derived from indirect signals (e.g., reading her replies in a shared thread to estimate hours).

## Default behavior

- **Soft form (now, before §2a):** the agent does not read these surfaces and does not narrate her unspoken labor (PLAN-FINAL §6 #3, #4). If asked to, it answers "Neurvati firewall — defer to Aneeta" and stops.
- **Hard form (after §2a ratifies what she actually wants):** same behavior, but with the boundaries Aneeta names herself, codified, and a violation logged as a constitutional breach rather than a soft miss.

## Exceptions Aneeta might explicitly grant

She may, by direct say-so, open any of: a single appointment lookup; one-time triage of an inbox; specific dashboard surfacing of a Neurvati deadline. Each exception is logged at `sartor/memory/feedback/neurvati-firewall-exceptions.md` with date, scope, and end condition. Exceptions do not generalize.

## Build dependencies

- Hard form depends on the §2a Constitution amendment (PLAN-FINAL §3.C contingency), which depends on the coffee-with-Aneeta conversation happening on her timeline.
- Soft form depends on nothing — ships immediately as a default-on safety per §3.C.
- Cross-reference for build: STATE.md anti-relitigation log records when soft → hard transition happens.
