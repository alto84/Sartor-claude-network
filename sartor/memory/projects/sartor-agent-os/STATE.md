---
type: project-state
entity: sartor-agent-os
status: active
updated: 2026-04-25
updated_by: Claude (state-keeper, session 23bafeb0)
tags: [meta/handoff, curator/spec, status/active]
related: [INDEX, PLAN-FINAL, HOUSEHOLD-CONSTITUTION, STATE-TEMPLATE]
---

# STATE — HEARTH

Append-only handoff log. Newest stanza on top. Template at [[STATE-TEMPLATE]]. Mandatory final write before context-close per PLAN-FINAL §5 (also applies to v2.0).

---

## 2026-04-26 (overnight) — session 23bafeb0 (continued) — claude-opus-4-7[1m] — fresh-plan + principles import

**Trigger.** Alton, going to bed: "See what you can come up with overnight." Earlier in the session he asked for (a) a fresh plan from the beginning to compare with v1.0, (b) the four principles in `~/Downloads/CLAUDE (1).md` translated into our framework as an "overhaul of everything," and (c) "don't tax your thinking with silly stuff."

**Done overnight (autonomous, no Alton in the room):**

1. **Four principles translated.** `Discipline` section added to `CLAUDE.md` between `Communication Style` and `Skill invocation`. Two new feedback files:
   - `feedback/scope-discipline.md` — every changed line traces to request; mention dead code don't delete; clean only your own orphans; generalizes beyond code.
   - `feedback/goal-driven-execution.md` — define success criteria; transform vague tasks to verifiable goals; loop until verified, not until done; references `superpowers:test-driven-development` and `superpowers:verification-before-completion` as operating skills.

2. **PLAN-v2.md written** via walk-through method (5 scenes: Tuesday morning, Saturday 2 AM call shift, Vayu Wednesday math, Friday midnight gpuserver1-down, Sunday evening status). Each plan item traces to a specific scene with success criterion.

3. **COMPARISON.md written.** v1.0 vs v2.0: where they agree (most items survive convergence), where they differ (cuts, sharpenings, additions, timing), what v2.0 might be missing. Recommendation: use v2.0 as working plan, keep v1.0 on disk as prior state of record.

**Method choice (made autonomously per "don't tax your thinking with silly stuff"):**

The brainstorming skill offered options A/B/C/D/E for the fresh-plan methodology. I picked **B (walk-through scenes) + C (smallest-thing-that-earns-its-keep)** combined: walk through real moments, derive minimum-viable items from each scene's needs. Chose this because the four imported principles (especially "every changed line traces to request") favor scene-derived plans over architecture-derived ones, and Cato's 2026-04-25 prosecution of v0.1 specifically flagged the "rhetorical not measured" pattern that scene-grounding directly counters.

**Decisions left for Alton:**

- Which plan is the working one. (v2.0 recommended; both stay on disk.)
- Whether scenes 1–5 in v2.0 are plausible or off in detail. (Where wrong, derived items need re-derivation.)
- The four §8 gates from PLAN-FINAL (unchanged). v2.0 added one tightening: Experiment 001 (D1) waits for 14 days of green substrate, not just B5 pre-flight pass.
- Whether to apply the 7 ready-to-apply SKILL-IMPROVEMENTS items now or later.
- Whether to ratify Constitution v0.4 amendments now or later.

**Anti-relitigation log additions:**

- Considered making v2.0 a wholesale rewrite that supersedes v1.0. Rejected: violates the new `feedback/scope-discipline.md` rule (mention, don't delete). Both plans stay on disk.
- Considered editing the Constitution to align with the new probability/preference framing in CLAUDE.md (yesterday). Rejected: §18 requires Alton's explicit ratification; deferred to v0.4 bundle.
- Considered running another full Phase-1-through-6 critique cycle on v2.0. Rejected: gstack pathology (cf. Cato 2026-04-25). The four-principle import was applied during writing; critique cycle would be performance.
- Considered dispatching parallel persona critics on v2.0. Rejected: same reason. v2.0 will be reviewed by Alton when he wakes up; that's the right reviewer.
- Method choice (B+C from brainstorming options) recorded in PLAN-v2.md history. Anti-relitigation: do not redebate the method choice unless Alton's morning review surfaces a problem with the scenes themselves.

**Files modified or created this stanza:**

- `CLAUDE.md` — added `Discipline` section with four principles
- `sartor/memory/feedback/scope-discipline.md` — new
- `sartor/memory/feedback/goal-driven-execution.md` — new
- `sartor/memory/projects/sartor-agent-os/PLAN-v2.md` — new
- `sartor/memory/projects/sartor-agent-os/COMPARISON.md` — new
- This `STATE.md` stanza

**Next concrete action when Alton wakes up:**

1. Read COMPARISON.md (~5 min).
2. Skim PLAN-v2.md scenes; flag any that are wrong about household reality.
3. Choose: v2.0 working plan vs. v1.0 working plan vs. merge.
4. The four §8 gates are still pending decision. v2.0 didn't change them.

**Phase status (HEARTH program):** unchanged — Phase 7 awaiting greenlight on the four §8 gates. v2.0 produces a parallel artifact, not a phase advance.

---

## 2026-04-25 (late) — session 23bafeb0 — claude-opus-4-7[1m] — rule-revision pass

**Phase status** (unchanged from prior stanza except as noted)
- Phase 7 (Greenlight): still pending; no chat-yes on §8 gates yet.
- Side-task: Communication-rule revision completed at Alton's request.

**Rule changes ratified by Alton in chat (verbatim trigger: "Let's drop 1. 2, you should think through what would help the best. 3, Slim it down in strength..."):**

1. **"No em dashes"** — dropped from CLAUDE.md and `.claude/rules/communication-style.md`.
2. **"No probability assessments" + "Express preferences"** — replaced with three-register confidence framing ("X is correct" / "leaning X because Y" / "I don't know yet"). Numbers allowed when they reflect a real estimate.
3. **"Skip preamble, restating what was asked, transition filler"** — slimmed; brief acknowledgement of which prong of a multi-part question is fine.
4. **using-superpowers MUST-INVOKE** — overridden by new "Skill invocation" section in CLAUDE.md. Required only for novel/high-stakes/explicit-name/multi-phase-dispatch; skipped for continuation, clarification, trivial actions.
5. **interior-report-discipline** — lightened in tone, broadened from phrases to constructions per Marginalia's PLAN-v0.1 finding. Updated in `.claude/skills/interior-report-discipline/SKILL.md`.
6. **"Lead with the answer, not the reasoning"** — deleted. Replaced with positive line: "Think well, and write to be read. Trust your judgment about whether to lead with the conclusion or the reasoning. Both are welcome."
7. **Priority hierarchy / trust ladder applied to minor decisions** — codified as `feedback/framework-floor-not-checklist.md`: frameworks are the floor, not a per-action checklist. Applied on stakes-triggering decisions only.

**Files modified this stanza:**
- `CLAUDE.md` (3 sections)
- `.claude/rules/communication-style.md` (2 sections)
- `.claude/skills/interior-report-discipline/SKILL.md` (rewrite, retains decision rule, adds construction detection)
- New: `sartor/memory/feedback/framework-floor-not-checklist.md`

**Constitution amendments needed (Alton's signaled "time soon to edit the constitution"; not done this session):**

- **§3 Epistemology:** "Do not generate probability estimates except when they come from a validated quantitative system" should be amended to match the new three-register framing in CLAUDE.md, allowing numbers when they reflect a real estimate. Otherwise CLAUDE.md and Constitution disagree on the same rule.
- **§4 Honesty / hedge language:** if the household wants to enshrine the broadened construction detection (not just the "functions as" phrase), a §4 addition would carry it from skill into Constitution.
- **§13 Self-knowledge / introspection:** parallel to §3, the calibration prose may want softening to match the lighter interior-report-discipline framing.
- **§6 priority hierarchy + §12 trust ladder:** consider adding a one-paragraph clarification that these are the floor for boundary-triggering decisions, not a per-action checklist (currently captured in feedback file; could be promoted into the Constitution proper at v0.4).
- **§2a "Dual-principal protocol"** (already pending from PLAN-FINAL §3.C, awaits Aneeta's coffee conversation).

These five items can be bundled into v0.4 ratification when Alton is ready.

**Anti-relitigation log additions:**
- Considered editing the using-superpowers skill file directly at `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/`. Decided against: plugin cache is wiped on update. Override at the user-CLAUDE.md level instead.
- Considered putting the priority-hierarchy floor rule inline in CLAUDE.md only. Decided to also write `feedback/framework-floor-not-checklist.md` because feedback files auto-inject and are discoverable; CLAUDE.md is the override-of-record.
- **Program name chosen: HEARTH.** Considered KEEP (more pun-forward, slightly defensive register), STEWARD (directly from Constitution §2, more serious). Picked HEARTH because it names the place the agent serves (counter-register to "Personal Infrastructure"), contains "heart," fits the existing single-word codename pattern (ATLAS, MERIDIAN, SENTINEL, FORGE). Directory `projects/sartor-agent-os/` preserved to avoid mechanical churn on inbox / curator references; documents going forward use HEARTH.
- New file: `IMPROVEMENTS-BACKLOG.md` seeded with `/catchup` improvement and the optional em-dash cosmetic pass.

**Next concrete action:** Alton's chat-yes on the four PLAN-FINAL §8 gates. Then Phase A substrate work begins.

---

## 2026-04-25 — session 23bafeb0 — claude-opus-4-7[1m]

**Phase status**
- Phase 0 (Frame): done — `INDEX.md` records pre-registered success criteria; project framed as a working memo, not a build.
- Phase 1 (Explore): done — prior-art scan and constraint mapping captured in `PLAN-v0.1.md`.
- Phase 2 (Plan): done — `PLAN-v0.1.md` drafted A–F sequenced workstreams.
- Phase 3 (Build): deferred — no live execution this session; build gated on Alton greenlight per §8.
- Phase 4 (Adversarial Review): done — `CRITIQUES.md` captures persona-team review producing v0.1 → v0.2 deltas.
- Phase 5 (Revise): done — `PLAN-v0.2.md` integrated review patches.
- Phase 6 (Re-Review): done — fresh-context re-review verdict "fire after small patching"; six mechanical patches and one structural patch (Aneeta §2a contingency) applied into `PLAN-FINAL.md`.
- Phase 7 (Greenlight): pending — `PLAN-FINAL.md` shipped with `status: pending-alton-greenlight`; awaiting Alton's chat-message yes on §8 gates.

**Last greenlight rendered**

(Empty — no chat-message greenlight from Alton yet. Two-reviewer agreement does not constitute greenlight per PLAN-FINAL header.)

**Open gates** (verbatim from PLAN-FINAL §8)
1. **B1.** Option A (build dispatch wrapper, dry-run two weeks) or Option B (retract autonomy, accept §11 partial-fail)? *Default if no answer: A1+A2 substrate work proceeds; B1 waits.*
2. **A1 fallback channel.** SMS via Twilio, dead-mans-switch file you grep at 7 AM, or physical LED? Pick one. *Default: dead-mans-switch file (lowest setup cost).*
3. **D1 compute spend.** Yes to Experiment 001 firing on rtxpro6000server post-pre-flight? *Default if no answer: D1 holds.*
4. **F1 AZ shipping log.** Real commitment-tracking gap, or current ad-hoc workflow fine? *Default if no answer: F1 doesn't get built.*

**Anti-relitigation log**
- Considered Option A vs Option B for vast.ai dispatch (PLAN-FINAL §8 #1); orchestrator preference is A; Alton's chat-yes pending.

**Next concrete action**
- Render PLAN-FINAL §8 to Alton in chat for the four greenlight votes — owner: orchestrator (next session).
- In parallel: spec-writer drafts the four `SPECS/<NAME>.md` stubs referenced from PLAN-FINAL phases A–F.

**Session notes**
- Shipped `projects/sartor-agent-os/PLAN-FINAL.md` v1.0 with six mechanical patches and §3.C contingency; status `pending-alton-greenlight`.
- Created this STATE.md and `STATE-TEMPLATE.md` per PLAN-FINAL §5 (Lethe's anti-amnesia mechanism).
- SPECS/ files are spec-writer's deliverable; reference scheme is `projects/sartor-agent-os/SPECS/<NAME>.md` — future stanzas link there.

---

## History

- 2026-04-25: Seeded by state-keeper at session 23bafeb0.
