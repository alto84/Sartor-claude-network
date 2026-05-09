---
type: project
program: constitution-v0.6-ratification
created: 2026-05-08
updated: 2026-05-09
status: phase-3-build-complete (PLAN-v0.6.md and v0.6.proposed text written; awaiting orchestrator's Phase-4 reviewer dispatch after greenlight on plan)
related: [HOUSEHOLD-CONSTITUTION, HOUSEHOLD-CONSTITUTION.v0.6.proposed, OPERATING-AGREEMENT, hearth/INDEX, projects/sartor-agent-os, complex-project-skill]
---

# Constitution v0.6 ratification project

## Phase 0 — Frame

The Sartor Home Agent Constitution v0.5 was ratified by Alton on 2026-05-06.
In the two days since ratification, the household has made decisions that
the v0.5 text does not yet reflect. Alton's directive on 2026-05-08 evening:
"Constitution should be fully ratified. Make an agent team to check voice,
consider. We have a major project protocol."

This project produces v0.6: a Constitution amendment that picks up the
post-v0.5 scope expansions, gets adversarially reviewed by an agent team,
revised, re-reviewed, and surfaces for Alton's ratification.

### Best-guess scope of v0.6 (confirm with Alton at greenlight gate)

1. **Life-OS scope expansion.** Earlier in the 2026-05-08 session, Alton
   said: "This is basically going to become my life operating system... I
   need to accumulate some sensitive documents... we're going to eventually
   create a life operating system here." v0.5 §16 ("do not accumulate
   beyond what the role requires") was written for "household agent."
   Life-OS is a deliberate role expansion. v0.6 needs to acknowledge this
   so future Claudes don't quietly rein themselves in to the old scope.

2. **Peer self-loops as Constitutional structure.** Deployed 2026-05-08 on
   rtxserver and gpuserver1. Self-paced via ScheduleWakeup, twice-daily
   floor, 12pm-5am bias, Stage-1 trust with explicit pathing-fix authority,
   first-person voice. v0.5 §14 covers other instantiations and polyphonic
   stewardship but not specifically the self-pacing-loop pattern. Worth
   either a §14 extension or a new sub-section.

3. **Plain Drive sync and §7 children's-info reading.** Alton chose plain
   (unencrypted) Drive sync over rclone-crypt for the project tree. §7's
   hard rule "children's information never leaves the house, not to cloud
   providers beyond those already sanctioned" needs explicit interpretation:
   does plain Drive sync of `sartor/memory/family/` and `FAMILY.md` count
   as a sanctioned cloud (Google already holds Calendar, etc.) or as
   crossing the §7 line? Alton's choice implies the former; the
   Constitution should explicitly endorse or qualify so future Claudes
   don't read the rule literally and panic.

### Out of scope for v0.6 (deferred to future work)

- Aneeta co-ratification. v0.3, v0.4, v0.5 were all ratified by Alton
  alone; the open procedural caveat from 2026-04-19 ("Aneeta has not yet
  read the full document; co-principal status ratified per operational
  reality") still stands. Dual-ratification is a separate workstream
  requiring a moment with Aneeta. Flag for next conversation; do NOT
  block v0.6 on it.
- §11a "when idle is a failure" — still deferred per v0.5 reasoning
  (heartbeat substrate non-functional).

### Success criteria

- v0.6 produced as a full Constitution document (not a delta memo) so
  it can be ratified as such.
- Adversarial team's critiques addressed in writing per the
  complex-project protocol; review memos committed.
- Alton's chat-message ratification before any swap of the canonical file.
- v0.5 archived to `reference/archive/HOUSEHOLD-CONSTITUTION-v0.5.md` per
  archive-not-collapse discipline.

### Failure modes to watch

- v0.6 is too long / churn-y given v0.5 just ratified 2 days ago.
  Mitigation: minimum surgical changes; absorb rather than rewrite.
- Voice drift from Alton's first-person register. Mitigation: cantor as
  one of the review team.
- Scope creep — picking up things that should be feedback rules instead
  of Constitution-level. Mitigation: Aneeta-proxy reviewer pushes back
  on anything that doesn't pass "would Aneeta need to read this for it
  to bind her too?" test.
- Live-document churn making the Constitution feel less authoritative
  over time. Mitigation: cap at one amendment per quarter as a working
  norm; v0.6 is exception because v0.5 was a major redraft and post-v0.5
  the household made several substantive moves quickly.

## Phase 1 — Explore (in flight)

Three explore agents dispatched 2026-05-08 evening, in parallel. Each
produces a digest in this directory. Synthesis happens in Phase 2.

- `EXPLORE-A-life-os-scope.md` — what life-OS means in practice, what
  v0.5 sections it touches, recommended amendment shape
- `EXPLORE-B-peer-self-loops.md` — the self-loop pattern's Constitutional
  shape, where in v0.5 it fits, voice-matched first-person draft
- `EXPLORE-C-drive-sync-and-section-7.md` — plain Drive sync's
  interaction with §7 children's-info rule, recommended interpretation

## Phase log

- 2026-05-08 evening — Phase 0 framed by orchestrator (Rocinante Opus 4.7).
  Three Phase 1 explore agents dispatched. Awaiting their digests before
  Phase 2.
- 2026-05-09 — Phase 1 explore digests landed (EXPLORE-A, EXPLORE-B,
  EXPLORE-C). Phase 2 (Plan) and Phase 3 (Build) executed by an
  orchestrator-dispatched Plan+Build agent (Claude Opus 4.7, 1M context).
  PLAN-v0.6.md synthesizes the three explore digests into three surgical
  amendments + three open questions for Alton. v0.5 verbatim archived to
  `reference/archive/HOUSEHOLD-CONSTITUTION-v0.5.md` per archive-not-collapse.
  v0.6.proposed text written at `reference/HOUSEHOLD-CONSTITUTION.v0.6.proposed.md`,
  ~30,749 words, with three surgical insertions and frontmatter+callout
  bumped to v0.6 status. Three open questions surfaced explicitly for
  Alton's greenlight rather than silently picked. Phase 4 adversarial
  review awaits orchestrator's call after greenlight on the plan.
