---
type: project
entity: sartor-agent-os
updated: 2026-04-25
status: active
phase: 0-frame
related: [HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT, MASTERPLAN, MEMORY, projects/memory-system-v2, research/persona-engineering]
---

# HEARTH — household agent program

*Formerly "Sartor Agent OS." Renamed 2026-04-25 to **HEARTH** at Alton's directive. The directory `projects/sartor-agent-os/` is preserved; documents use HEARTH.*

> [!info] Phase 0 — Frame
> Single-paragraph problem statement, success criteria, and scope. Pre-registered before personae critique so the yardstick does not drift.

## Problem statement

Alton has asked for a personalized step-by-step plan to upgrade the existing Sartor system into a household-wide Agent OS that runs the home, manages Solar Inference LLC, plans family life in a way Aneeta and the kids can interact with, and continues the personality/loyalty experiments — without rebuilding what already works and without violating Alton's 2026-04-19 caution that *self-evolution can make our systems unstable*. The starting point is not a blank page: there are 21 agents, 27+ skills, 9 slash commands, three peer machines (Rocinante / gpuserver1 / rtxpro6000server-Blackwell), a ratified v0.3 Constitution, an Operating Agreement v1.0, an inbox-and-curator memory pipeline, an active persona-engineering research program, and a real GPU-rental business that has been at $0 occupancy for two months. The work is therefore an *upgrade*, not a clean-room build, and is constrained by what is already present and what has already been decided.

## Success criteria (pre-registered)

A "good plan" must satisfy ALL of the following or it fails Phase 6 re-review:

1. **Personalized, not generic.** Names the actual people (Alton, Aneeta, Vayu, Vishala, Vasu, Loki/Ghosty/Pickle), the actual machines, the actual deadlines (Wohelo $12,400 due 2026-05-15, Disney ADR window opens 2026-05-17, Solar in-service deadline 2026-07-04). A reader who does not know this household should not be able to lift the plan and apply it elsewhere without serious work.
2. **Constitution-compliant.** Cites Constitution §§ when defining new agent capabilities, respects the trust ladder (§12, §12a), maintains the priority hierarchy and hard rules (§6, §7), keeps PHI / EIN / children's info inside household systems (§7), and does not propose autonomous self-modification of the Constitution itself (§18).
3. **Phased and reversible.** Step-by-step phases with explicit greenlight gates between them. Any phase must be paused or rolled back without breaking the others. Per `complex-project` skill: greenlight is a hard gate Alton (the principal) ratifies in chat — the orchestrator cannot self-approve.
4. **Aneeta-readable and Aneeta-included.** Has at least one explicit step that brings Aneeta into the system as the co-principal she is constitutionally — not a passive recipient of Alton's interpretation. Per 2026-04-19 ratification record, she has not yet read the Constitution; the plan must address that on its own terms.
5. **Children's-norms compliant.** Any kid-facing capability cites Constitution §10 (children's norms): warm, direct, honest, parental authority preserved, escalation on safety, no surveillance role, homework-help-not-homework-doing.
6. **Solves a named pain.** Each capability ties to a documented gap from the research digests (e.g., 0% GPU occupancy two months running, Disney trip behind schedule, Gmail MCP brittle, no Aneeta interface, AZ scheduled-task table is dark).
7. **Compounding-safe.** Any "system learns from itself" loop is human-ratified (no self-modifying without Alton's chat-message yes), bounded in scope, and reversible. Honors the 2026-04-19 deferral of `weekly-skill-evolution`.
8. **Ledgered.** Every automation produces an artifact Alton can read at breakfast — better than a generic Log Habit because the ledger is queryable from the existing memory wiki, not a parallel logging system.
9. **Honest about cost and risk.** Names dollar costs for new infrastructure, names the failure modes that would surface, and names what would have to be true for each phase to be worth doing. No hockey sticks.
10. **Carries existing experiments forward.** Persona-engineering Experiment 001 (loyalty fingerprint baseline), the six-persona self-team, the alton-voice corpus, the interior-report-discipline skill — these are continued and integrated, not orphaned.

## Scope

**In scope:**
- Upgrades to existing agents/skills/commands/scheduled tasks.
- New capabilities that fit naturally into the inbox-and-curator pipeline.
- Family-facing surface: shared dashboard, kids' future direct-access design, Aneeta's interface.
- Solar Inference operational fixes (pricing, P&L close, capacity coordination, July 4 ITC).
- Personality/loyalty experiments — continuation and operationalization.
- Multi-machine coordination upgrades (heartbeat, drain cadence, health pings).
- AZ-side knowledge-worker support that respects identity separation.
- Logging/ledger upgrades that make the system queryable.

**Out of scope:**
- Rewriting the Constitution. Section 18 already governs Constitution amendments; this plan can propose §11a-equivalent additions but cannot ratify them.
- Replacing markdown with a database. (MASTERPLAN §2 forbids it; the plan honors that.)
- Open-sourcing Sartor (LOOM is Phase 4 of MASTERPLAN; the upgrade plan does not accelerate it).
- Adopting third-party skill marketplace (after the 341-malicious-skill OpenClaw incident).
- Pushing notifications that create obligations. (MASTERPLAN §8 #10 — Sartor is a butler, not a boss.)
- Mobile native app. Responsive web is the surface.

## Constraints (non-negotiable)

- **Alton's 2026-04-19 stability caution.** Anything labeled "self-evolution," "autonomous skill upgrade," or "weekly improvement loop" is deferred unless the plan explicitly opens that question for ratification.
- **Pricing autonomy is bounded.** $0.25–$0.55/hr for the RTX 5090; new bounds for Blackwell only after Alton's grant.
- **No auto-cuts.** Per `feedback_pricing_autonomy.md`, asymmetric ratchet: bumps allowed within band, cuts require approval.
- **Greenlight on consequential action.** Any spending, any external send, any machine-state change beyond declared scope requires Alton's chat-message yes.
- **Identity separation.** Household and AstraZeneca are different scopes. AZ-side capabilities cannot leak household data, and vice versa.
- **Children's privacy.** Names/birthdates/school details/medical never leave household systems.
- **No EIN in external output.** Constitution §7 hard rule.
- **rtxpro6000server is fresh.** Brought online 2026-04-22; treat its capabilities as subjunctive until it has earned its own MISSION doc and run cleanly for two weeks.

## Method

Per `complex-project` skill, this program runs:

| Phase | Status | Output |
|-------|--------|--------|
| 0 — Frame | **done** | INDEX.md (this file) |
| 1 — Explore | **done** | 8 research digests (R1–R8) integrated; full text in transcript |
| 2 — Plan | **done** | PLAN-v0.1.md |
| 3 — Build | gated on Phase 7 | — (handoff bundle being built in parallel by sartor-agent-os-handoff team: STATE-TEMPLATE, SKILL-IMPROVEMENTS, SPECS/) |
| 4 — Adversarial Review | **done** | CRITIQUES.md — Cato, Marginalia, Vigil, Philos, Lethe, Aneeta-proxy + peer-machine memo |
| 5 — Revise (orchestrator-written, NOT critics) | **done** | PLAN-v0.2.md with reply-to-charges table |
| 6 — Re-Review (fresh Agent, no priors) | **done** | verdict: "fire after small patching"; six mechanical patches + one structural blind spot applied |
| 7 — Greenlight | **awaiting Alton's chat-message yes** per PLAN-FINAL §8 (four open gates) | PLAN-FINAL.md ready |
| 8 — Validate | per phase, post-build | — |
| 9 — Loop | as needed | revision passes back to Phase 5, max three rounds |

## Files this program will produce

- `projects/sartor-agent-os/INDEX.md` — this file (Phase 0)
- `projects/sartor-agent-os/RESEARCH-DIGESTS.md` — synthesis of R1–R8 (Phase 1 close)
- `projects/sartor-agent-os/PLAN-v0.1.md` — first-pass plan (Phase 2)
- `projects/sartor-agent-os/CRITIQUE-{cato,marginalia,vigil,philos,lethe,aneeta-proxy}.md` — Phase 4 memos
- `projects/sartor-agent-os/PLAN-v0.2.md` — revised plan with reply-to-charges (Phase 5)
- `projects/sartor-agent-os/RE-REVIEW.md` — Phase 6 fresh-context re-prosecution
- `projects/sartor-agent-os/PLAN-FINAL.md` — green-lit final plan
- `inbox/gpuserver1/` and `inbox/rtxpro6000server/` proposals — peer-machine input requested

## History

- 2026-04-25 — Phases 0–6 executed in a single Rocinante session (Opus 4.7, 1M context, session 23bafeb0). Eight research agents (R1–R8) dispatched; six persona critics (Cato, Marginalia, Vigil, Philos, Lethe, Aneeta-proxy) prosecuted v0.1; orchestrator-written v0.2 addressed 22 specific charges; fresh-context Phase 6 reviewer cleared as "fire after small patching"; six mechanical patches + one structural blind spot (§2a Constitution-amendment dependency for Phase C) applied to produce PLAN-FINAL.md. TeamCreate spawned `sartor-agent-os-handoff` (3 teammates: state-keeper, skill-editor, spec-writer) to produce the handoff bundle: STATE-TEMPLATE.md + STATE.md (Lethe's anti-amnesia mechanism), SKILL-IMPROVEMENTS.md (six skill-by-skill recs from a parallel skill-reflector subagent), SPECS/ (NEURVATI-FIREWALL, OUT-OF-BAND-FALLBACK, RTXPRO6000-PREFLIGHT, VASTAI-DISPATCH-WRAPPER). Peer-machine memo filed to inbox/rocinante/ requesting input from gpuserver1 and rtxpro6000server peer Claudes per OPERATING-AGREEMENT §14a/b. Awaiting Alton's chat-message greenlight per PLAN-FINAL §8.
