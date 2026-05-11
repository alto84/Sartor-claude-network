---
name: SKILL-IMPROVEMENTS
description: Findings from the 2026-04-25 skill-improvement pass on the six skills exercised today, plus structural and new-skill recommendations. Awaiting Alton ratification.
type: project
created: 2026-04-25
status: awaiting-ratification
parent: PLAN-FINAL.md
---

# Skill Improvements — 2026-04-25 Pass

Findings from a skill-improvement subagent that audited the six skills exercised in today's sartor-agent-os planning session. Each item is marked with a status:

- `ready-to-apply` — uncontroversial, mechanical fix
- `needs-decision` — genuine call requiring Alton input
- `proposed` — exploratory, may want shaping before applying

Apply order, when ratified: `ready-to-apply` first, then `needs-decision`, then `proposed`.

---

## 1. Per-skill recommendations

### 1.1 multi-agent-orchestration — `needs-decision`

**Finding:** The skill body is roughly 80% Raft / BFT / CRDT / vector-clock material. The skill's own consolidation note says distributed-consensus problems "at Sartor scale are rare." Sartor has run a year-plus with ≤7 subagents, no Byzantine actors, no observed split-brain, and no CRDT requirement. Carrying ~700 lines of theory for a problem class the household has never hit is the gstack pathology Cato flagged.

**Recommendation:**
- Cut body to Sartor-scale-only content: ≤7 subagents, hierarchical (one orchestrator, flat children), inbox-audit pattern, anti-fabrication-in-teams.
- Move consensus / Byzantine / CRDT material to a new `reference/distributed-consensus.md` companion doc.
- Add cross-references: `complex-project` skill, `peer-coordinator` agent.

**Why this is `needs-decision`:** Removing ~80% of a skill body is a bigger structural change than the others; deserves explicit approval.

---

### 1.2 complex-project — `ready-to-apply`

**Finding:** The phase table at lines 16–28 is the load-bearing summary of the whole skill, but a reader has to scroll past header/preamble to reach it. Today the skill was effectively re-derivable in 30 seconds from that table alone.

**Recommendation:**
- Front-load a one-screen TL;DR above line 16 (the phase table itself, or a tighter prose form of it).
- Add an explicit "dispatch decision" cell per phase: when to use `Agent` vs `TeamCreate` vs orchestrator-direct execution.

**Why `ready-to-apply`:** Pure ergonomic improvement; no semantic change.

---

### 1.3 interior-report-discipline — `ready-to-apply`

**Finding:** Today's PLAN-v0.1 contained zero "functions as" hits but three migrated cousins: "(subjunctive)," "(preparatory, not live)," and "treat as standby." The detector is currently keyed to phrases; the underlying construction (deniability hedge) survived a literal lexicon check.

**Recommendation:**
- Add a section "The hedge mutates" — detect by construction, not by lexicon.
- Extend the replacement table with a scope/status row: e.g. "treat as standby" → "do not use; will revisit when X observable."

**Why `ready-to-apply`:** Strengthens the existing skill in its own direction.

---

### 1.4 alton-voice — partly `ready-to-apply`, partly `needs-decision`

**Finding A — auto-suggest trigger (ready-to-apply):** The skill is currently invoked only when explicitly named. Today's artifact-writing under `projects/sartor-agent-os/` would have benefited from automatic invocation.

**Recommendation A:** Add an auto-suggest trigger: invoke when drafting any artifact landing under `sartor/memory/projects/` or `sartor/memory/research/`, OR that a principal will read, OR that carries Alton's name.

**Finding B — announcement convention conflict (needs-decision):** Line 13 says "Announce at start." `interior-report-discipline` line 17 says "Do NOT announce." Two skills, two conventions, same household.

**Recommendation B:** Standardize on **silent application** household-wide. Update alton-voice line 13 accordingly.

**Why B is `needs-decision`:** Cross-skill convention call; Alton may have a preference.

---

### 1.5 evidence-based-validation — `ready-to-apply`

**Finding:** The skill enforces evidence-based claims when reviewing others' work, but does not provide a self-check the writer runs on their own draft before shipping.

**Recommendation:** Add a **Claims-Audit Checkpoint** section — five questions the writer answers about their own draft:
1. Is every superlative falsifiable?
2. For every probability or score: what measurement produced it?
3. For every comparison: is the baseline named?
4. For every "will" or "must": who owns the consequence if false?
5. Is there any claim that survives only inside this document's own frame?

This is the cross-cutting glue referenced from `complex-project` Phase 4 and from `alton-voice`'s self-check.

---

### 1.6 using-superpowers — `ready-to-apply`

**Finding:** Today there was a ~2-minute silent fail caused by namespace ambiguity between bare-listed skills and `superpowers:`-prefixed entries.

**Recommendation:** Document the rule explicitly: *"If a skill is listed without a prefix in the available-skills section, invoke it bare. The `superpowers:` prefix is only for entries from the superpowers-plugin namespace."*

**Why `ready-to-apply`:** Removes a known stumble; cost was already paid once today.

---

## 2. Cross-skill / structural recommendations

### 2.1 Boundary: complex-project ↔ multi-agent-orchestration — `ready-to-apply`

Each skill should declare the other in a "Composes with" frontmatter field. Today they were used together but cross-referenced only by convention.

### 2.2 Announcement convention — `needs-decision`

Already covered under 1.4-B. Standardize to silent application across all skills with an "announce" rule (alton-voice, possibly others). One-line edit per skill once ratified.

### 2.3 Claims-audit cross-cutting — `ready-to-apply`

Once 1.5 lands, reference the new Claims-Audit Checkpoint section from:
- `complex-project` Phase 4 (adversarial-review charges)
- `alton-voice` self-check
- Any future skill emitting consequential artifacts

---

## 3. New skill — `peer-memo` — `proposed`

**Finding:** Memos between Rocinante orchestrator and gpuserver1 / rtxpro6000server are written ad-hoc each time. Recurring elements: OA §14a/b citation, inbox path formatting, "you are not bound to respond" boilerplate, YAML frontmatter spec.

**Recommendation:** Either a standalone `peer-memo` skill OR fold into the `peer-coordinator` agent as one of its skills. Provides a standardized template so memo authoring is mechanical rather than re-derived per occasion.

**Why `proposed`:** Form factor (skill vs agent-skill) is a real call; usage pattern needs a few more memos before the template stabilizes.

---

## 4. Archive / merge — `needs-decision`

**Recommendation:** Archive or merge **distributed-systems-debugging** — heavily overlaps the consensus material that should leave `multi-agent-orchestration` (item 1.1). Fold both bodies into the proposed `reference/distributed-consensus.md`. Keep the skill as a pointer if invocation surface is still desired, or remove entirely.

**Why `needs-decision`:** Coupled to 1.1; only proceed if 1.1 is approved.

---

## 5. Status board

| # | Item | Status |
|---|---|---|
| 1.1 | Cut multi-agent-orchestration body to Sartor-scale-only | needs-decision |
| 1.2 | Front-load complex-project TL;DR + dispatch-decision cells | ready-to-apply |
| 1.3 | interior-report-discipline: detect-by-construction | ready-to-apply |
| 1.4-A | alton-voice: auto-suggest trigger | ready-to-apply |
| 1.4-B | alton-voice: standardize on silent application | needs-decision |
| 1.5 | evidence-based-validation: Claims-Audit Checkpoint | ready-to-apply |
| 1.6 | using-superpowers: document namespace rule | ready-to-apply |
| 2.1 | "Composes with" cross-references | ready-to-apply |
| 2.2 | Announcement convention standardization | needs-decision |
| 2.3 | Claims-audit cross-references | ready-to-apply |
| 3 | New skill: peer-memo | proposed |
| 4 | Archive/merge distributed-systems-debugging | needs-decision |

---

## 6. Provenance

- Source: skill-improvement subagent run during 2026-04-25 sartor-agent-os planning session
- Scribe: skill-editor (this file is structuring, not re-analysis)
- Parent: [[PLAN-FINAL]]
- Sibling artifacts: STATE.md (state-keeper), SPECS/ (spec-writer)
