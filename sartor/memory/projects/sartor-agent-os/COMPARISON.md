---
type: project-comparison
entity: hearth-v1-vs-v2
created: 2026-04-26
status: review
related: [PLAN-FINAL, PLAN-v2]
---

# HEARTH v1.0 vs v2.0 — comparison

> [!info] **Purpose.** Alton's explicit ask 2026-04-26 morning: "Refresh, starting at the beginning and let's see how the new plan looks and compare to these." This is the comparison.

## Method, side by side

| | v1.0 | v2.0 |
|---|---|---|
| Origin | Generic "Agent OS" framework critique → 8 research agents → 6 persona critiques → revise → re-review | Walk-through of 5 scenes in lived household life → derive items from scenes |
| Phases | A through F, with exit criteria each | No phases. Sequenced by what the calendar wants. |
| Scope-control discipline | Cato had to prosecute v0.1 to surface "every changed line traces to request" | Built under that principle from line 1 |
| Critic apparatus | Six personae load-bearing in plan structure | Critics still in use as judges, but not as plan structure |
| Length | ~18 KB, 7 phases × ~10 items each | ~14 KB, ~20 items aggregated from 5 scenes |
| Trace question | "What does this item solve?" answered by phase rationale | "What does this item solve?" answered by scene reference |
| Time to first read | ~20 min including phases and rationale | ~15 min including scenes, which double as buy-in |

## Where they agree (most items survive)

These v1.0 items appear unchanged or near-unchanged in v2.0 because the walk-through method independently generated them:

- Dead-mans-switch.txt + breakfast-page anomaly view (v1.0 §3.A1; v2.0 S4.1 + S4.3 + A1)
- Vast.ai dispatch wrapper, Option A, dry-run two weeks (v1.0 §3.B1; v2.0 B1)
- Occupancy diagnostic with committed price hypothesis (v1.0 §3.B2; v2.0 B2)
- Monthly P&L close, last Friday (v1.0 §3.B3; v2.0 B3)
- Solar ITC daily countdown (v1.0 §3.B4; v2.0 B4)
- Neurvati firewall, soft default-on, hard pending §2a (v1.0 §3.C; v2.0 C1)
- Coffee with Aneeta when she's ready, no deadline (v1.0 §3.C; v2.0 C3)
- Wohelo $12,400 by May 15 (v1.0 §3.C; v2.0 D1)
- Disney decisions by May 17 (v1.0 §3.C; v2.0 D2)
- Counselor search, three candidates, then stop (v1.0 §3.C; v2.0 D3)
- Compounding loops (read-only): memory-decay, skill-usage, Marginalia margin, semi-annual experiment, rolling Cato (v1.0 §3.E; v2.0 E3)
- Experiment 001 gated on pre-flight (v1.0 §3.D; v2.0 F1)

The convergence is meaningful: when two different methods produce overlapping items, those items are likely correct. The agreement is the strongest evidence either plan has.

## Where they differ — v2.0 changes

### v2.0 cuts that v1.0 had

| Cut | Why |
|---|---|
| Six-persona critique apparatus as plan structure | Critics are judges, not plan content. Their work happened in v0.1→v1.0; in v2.0 the discipline is in the principles, not the apparatus. |
| Phase scaffolding (A/B/C/D/E/F headers, exit criteria per phase) | Scenes don't need phase headers. The calendar does the sequencing. |
| External-framework-critic round | Done in v0.1; not needed again. The four-principle import is now in CLAUDE.md. |
| Phase-3-Build dependency on greenlight | Each item now has its own success criterion; Phase 3 was a placeholder anyway. |
| The §H Operating discipline boilerplate | It was `complex-project` skill content restated, as Cato said. |
| The §6 "what we don't do" list as a long enumeration | Replaced with a tighter "What v2.0 does NOT contain" section that names items explicitly cut. |

### v2.0 sharpenings that v1.0 had loosely

| v1.0 | v2.0 |
|---|---|
| Breakfast page described in §4 of v1.0 | Concrete in S1.1: one URL on LAN, <2s phone load, specified composition, success criterion = three mornings without scrolling |
| "Anomaly mode" mentioned briefly | S1.3 + S4.3: full page replacement, names the gap, tells what to check, says whether money was earned/lost during gap |
| "Show family dashboard to Aneeta after Vishala leaves for camp" | S2.1: opt-in only, OFF by default, succeeds if she opts in three weekends or never opts in. The latter is also a success. |
| "Vayu math — agent reminds gently if asked" | S3.2: parent-logged-practice only; agent aggregates trend; surfaces only on meaningful change |
| "Counselor search, scoped to find candidates" | S3.3: three named candidates with phone, intake process, insurance status, then STOP. Explicit stop-criterion. |
| "Compounding loops are read-only" | E3: each loop has a verifiable success criterion now |

### v2.0 additions v1.0 didn't have

| New | Why |
|---|---|
| Phone-quiet-hours rule (S4.2 / A2 in v2.0) | Scene 4 made it visible: midnight pages would violate household norms. Belongs as a feedback file. |
| What-you-missed mode (S2.3 / E2) | Scene 2 surfaced the question: when Aneeta gets home at 2 AM, what does she actually want? Answer: optional, opt-in, past-tense, ≤3 bullets. |
| Sunday evening ?week view at the same URL (S5.1 / D4) | Scene 5 showed the format Alton actually wants for weekly status. v1.0 had monthly close + breakfast page; v2.0 adds the weekly seam. |
| Stop-criterion explicit on counselor search and Aneeta dashboard | Scenes show the household needs explicit stops, not just starts. |

### v2.0 changes to v1.0 timing

| Item | v1.0 | v2.0 | Why |
|---|---|---|---|
| Experiment 001 | After B5 pre-flight | After substrate is green 14 days | Vigil's attention-starvation warning sharpened by Scene 4: substrate must hold before personality work competes for attention |
| Family-facing dashboard shown to Aneeta | "Shown after June 25" | Built when she's ready, shown when she opts in (no scheduled show) | Aneeta-proxy critique: showing a dashboard on a deadline is still managing her |
| §2a Constitution amendment | "After her response" | Same; v2.0 makes the amendment scope smaller (just what she names) | No actual change; v2.0 is more honest about what we don't know about her response |

## What v2.0 might be missing (vs. v1.0)

Honest accounting of v1.0 items v2.0 deliberately does NOT carry:

| v1.0 item | Why v2.0 dropped it | Risk if v2.0 is wrong |
|---|---|---|
| Phase 6 fresh-context re-review apparatus baked in | v2.0 plans don't carry their own re-review structure; they get re-reviewed when written | Plans drift if the discipline isn't there. Mitigation: invoke `complex-project` Phase 6 explicitly when writing future plans. |
| The 21-agent inventory and skill audit | Outside scope of the plan; should be its own session | Stale agents accumulate. Mitigation: monthly skill-usage report (E2) catches this. |
| §I cost & risk register | Trimmed in v2.0 to per-item risks | If a cross-cutting risk emerges, v2.0 has nowhere to put it. Mitigation: surface to STATE.md anti-relitigation log. |

## Recommendation

Use **v2.0 as the working plan.** Reasons:

1. Every item traces to a concrete scene; reviewable by anyone who knows the household.
2. Built under the four CLAUDE.md Discipline principles from line 1 rather than retrofitted.
3. Stop-criteria explicit on items that were soft in v1.0.
4. Convergence with v1.0 on most items is the strongest evidence either plan is correct.

**Keep v1.0 on disk** as the prior state of record (per the "mention it, don't delete it" rule). Don't merge or rename.

**The four greenlight gates from PLAN-FINAL §8 are unchanged.** v2.0 doesn't add new ones. Stated preferences are unchanged with one tightening: Experiment 001 (D1) waits for 14 days of green substrate, not just B5 pre-flight pass.

## Honest limitations of this comparison

- I wrote both plans. The comparison is not external. A fresh-context reviewer would catch v2.0 issues I'm blind to.
- v2.0's scenes are partly inferred. Where they're wrong, derived items are wrong.
- "v2.0 is more disciplined" is partially a claim about my own writing, which is not falsifiable from inside.
- The decision between them is Alton's. This memo presents the comparison; it does not pre-commit.

## History

- 2026-04-26 — Comparison written overnight after PLAN-v2.md was drafted from the walk-through method. Both plans live in `projects/sartor-agent-os/`. Decision pending Alton's morning review.
