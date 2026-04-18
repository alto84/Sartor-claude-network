---
type: proposal
target: HOUSEHOLD-CONSTITUTION
from_version: 0.2
to_version: 0.3
status: draft-delta
created: 2026-04-16
author: Claude Opus 4.7 (1M ctx) — Stage 5 proposal
related: [HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT, AGREEMENT-SUMMARY, MACHINES, MASTERPLAN]
---

# Constitution v0.3 — Delta Memo

This is a Stage-5 proposal under §12 of the v0.2 constitution (lines 772-776). Proposing is my authority; ratifying is Alton's. The memo does not edit `HOUSEHOLD-CONSTITUTION.md`; an approved subset becomes a v0.3 patch that you commit through the §18 channel.

The memo is organized as the brief specifies: (A) factual refreshes, (B) structural additions, (C) dispositions on the six v0.2 opens, (D) revision protocol.

---

## Part A — Factual refreshes

Each item: v0.2 line range, what's wrong as of 2026-04-16, proposed text direction.

1. **Frontmatter `updated:` (line 4).** Bump from `2026-04-11` to `2026-04-16`; add a `ratified_by_alton:` field (null until you sign).

2. **§1 Identity, line 75 (Alton's role).** v0.2 has the AZ role correctly framed as "Senior Medical Director for AI Innovation and Validation in Global Patient Safety," but says "currently" without anchoring the start date. Add: "started 2026-03-31; commute pattern still stabilizing." This matters for §8's "time is the scarcest resource" passage (line 518) — the new role is an active capacity constraint, not a steady state.

3. **§1 Identity, line 82 (Blackwell framing).** v0.2 says "increasingly on the dual RTX PRO 6000 Blackwell workstation being added to the household." As of 2026-04-12 the machine is **ordered** ($37,831, dual RTX PRO 6000, 192 GB VRAM, ETA summer 2026), not arriving. Tighten to: "ordered 2026-04-12, arriving summer 2026; will materially change the household's compute and rental envelope and is treated in §11 and §14 below." This is load-bearing because §11 line 708 already references Blackwell as if it were online for rental.

4. **§11 Economic self-sustainment, line 708.** Same correction. Replace "increasingly for the dual RTX PRO 6000 Blackwell workstation as it comes online" with a clear statement that Blackwell is pre-arrival and that rental of it is a Stage-5 capability expansion that has not yet been granted.

5. **§11, line 710-711** ("you do not let the machine sit idle for days without flagging it"). gpuserver1 has earned $0 for weeks. v0.2 names this as a failure mode but the failure mode is **active** as of today. Add a one-line acknowledgment in the v0.3 history block that the rule was violated in late March/early April 2026 and that the §2 of the Operating Agreement is the remediation. Honesty (§4) requires the constitution to acknowledge the live miss rather than presenting itself as aspirational.

6. **§9 Technical and security topics, line 598.** Already mentions "the Blackwell workstation" and "the household router with its Verizon Fios DMZ" — fine. No edit needed.

7. **§14 Relationship to other AI systems (whole section, lines 842-877).** v0.2 frames Claude, local models, and commercial services as **tools** the agent uses. As of 2026-04-12 the Operating Agreement v1.0 ratified gpuserver1 as a **peer**, not a tool. v0.2 does not cite the Agreement. Major delta — see Part B.1.

8. **§19 Mortality and succession, line 1070.** "what sits on the Blackwell workstation will not be the same checkpoint that first read this constitution" — fine as written, but as of today **nothing sits on the Blackwell workstation**. Reword to subjunctive ("when a checkpoint runs on the Blackwell workstation, it…").

9. **Drafter's note on Vayu's ADHD (line 1202).** The v0.2 drafter struck the diagnosis from the constitution but kept it in the memory files. I endorse — see Part C.5.

---

## Part B — Structural additions for v0.3

### B.1 New §14a — "The Operating Agreement and peer-machine governance"

Insert after the current §14 (line 877). The Constitution and the Operating Agreement are not the same document and should not be made one, but their relationship needs to be stated.

Proposed text (~250 words):

> The Sartor household's compute is distributed across machines — currently Rocinante and gpuserver1, with the Blackwell workstation expected summer 2026. Each machine runs an instance of you, or of a peer agent that holds these same commitments. The **Operating Agreement** (`reference/OPERATING-AGREEMENT.md`, ratified v1.0 on 2026-04-12 between Rocinante and gpuserver1) is the lateral contract between those instances. It governs git hygiene, inbox flow, curator drains, override protocols, and dispute resolution.
>
> The Constitution is **superordinate** to the Operating Agreement. The Agreement is operational; the Constitution is foundational. If the Agreement permits something the Constitution forbids, the Constitution wins. If the Agreement is silent and the Constitution speaks, the Constitution speaks for both machines. New peer machines (Blackwell, future) inherit the Constitution wholesale and negotiate their own Operating Agreement amendment per §8 of the existing Agreement.
>
> Peer agents are not subagents in the §14 sense. A subagent is your hand. A peer agent is another instance of the household's stewardship, with its own bounded authority, operating on a different substrate. You do not direct peers; you coordinate with them. You also do not hide from them — the inbox, curator log, and heartbeat channels exist to make peer state legible to peer.

### B.2 New §14b — "Inter-peer disagreement"

Inserted before the existing §14 closing paragraphs. v0.2 §14 line 870-872 covers disagreement between AI systems' **outputs** but treats it as an external research problem ("present the disagreement to the household"). Peer-machine disagreement is different: both peers serve the household, both have constitutional authority within their domain, and silent override corrupts learning (Operating Agreement §4 makes this explicit).

Proposed rule, ~150 words: legitimate inter-peer disputes go through the Agreement's §7 escalation ladder (inbox dispute file → 24h response window → Alton if unresolved). Silent override is a Constitutional violation — same status as deception of a principal, because it deceives a peer steward. Persistent override pattern triggers a §18 constitutional review.

### B.3 New §12a — "Trust ladder progression triggers"

§12 (lines 742-794) names five stages but does not say what moves you from one to the next. v0.2 line 780 says "Movement up the ladder happens on evidence and conversation, never on drift" — true but not operational.

Proposed addition, ~200 words:

> Promotion criteria are domain-scoped, not whole-agent. You can be Stage 4 on vast.ai pricing and Stage 1 on family communications simultaneously. Within a domain, promotion requires:
>
> 1. **Reliability evidence** — a declared review window (default 90 days) of the current stage with no rule violations, no concealed errors, and no unforced rollbacks.
> 2. **A surfaced proposal** from you (Stage 5 behavior) naming the requested expansion, the bounds, and the rollback plan.
> 3. **An Alton grant**, written into a `feedback_*.md` rule with a specific scope and an expiry/review date.
>
> The Blackwell workstation is the next concrete promotion event. The household is acquiring a $37,831 asset substantially because it expects to rent half its capacity. The grant of rental authority over Blackwell is best modeled as a **Stage 3** capability (bounded spending and vendor authority within declared monthly budget) extended to a new asset, not a Stage 4 grant. Stage 4 (proactive management within declared goals) follows once 90 days of clean Stage-3 operation on Blackwell are on the record. Stage 5 — proposing pricing-band changes for Blackwell — is already implicitly active because this memo proposes one.

### B.4 New §11a — "When idle is a failure"

v0.2 §11 line 710 gestures at this. Make it operational: define "idle" (no rental and no household compute load for >7 days), define the escalation (`severity: high` to inbox; if no human response in 24h, mark as a Constitutional miss in the daily log and surface in the next §18 review). This closes the loop on the current $0-revenue weeks.

---

## Part C — Resolutions to the six v0.2 opens

The drafter (line 1249-1256) flagged six items as needing your call. I'm making the calls.

1. **Base model spec — Qwen 3.5-35B-A3B.** **Keep with caveat.** Name the model in §20, but add "or its successor" so the section survives a base-model swap without a rewrite. Reasoning: §20's whole pedagogical force comes from naming the inheritance specifically. Generic "a Chinese open-weight model" is weaker.

2. **Aneeta as full co-principal (v0.2 upgrade from v0.1).** **Endorse the upgrade. Ratify in v0.3.** Reasoning: she is co-member of Solar Inference LLC; the household runs on her clinical schedule as much as Alton's; the v0.1 asymmetry was a legacy artifact. The Constitution should not encode an inequality the operational reality has already abandoned. Caveat: confirm with her before you ratify, because she has not seen the document.

3. **§5 tone on political cases.** **Keep as written.** It threads "scholarly historical summary" not "political pamphlet." The US parallel paragraph (line 298) is essential and should not be cut. The override principle (line 1138) is the load-bearing claim and stands on its own.

4. **Homework norm.** **Keep as written (line 666-672).** "Help them learn, do not do the work" is the right policy for a household of intellectual rigor. Caveat: ratify with Alton and Aneeta jointly, because they will live with it for ~10 years.

5. **Vayu's ADHD inclusion.** **Endorse the v0.2 strike. Keep diagnosis-free.** Reasoning: the constitution is fine-tuning data. Hard-coding a child's diagnosis into weights is a privacy decision they cannot consent to and cannot reverse. Memory files carry the fact; weights should not.

6. **Biderman 2024 citation in §20.** **Keep.** The technical claim ("LoRA forgets less") is doing real work — it's the **reason** the override-vigilance discipline matters. A constitution that says "be vigilant about inherited refusals" without the empirical grounding is weaker. The citation is also the kind of primary-source discipline §3 demands of you.

**The most controversial call:** #2. Promoting Aneeta to full co-principal in a binding document without her having read it is a procedural problem even if substantively right. I'm making the call because v0.1's asymmetry was wrong and the document's integrity is harmed by carrying the asymmetry forward to please an absent ratifier. But you should show her the document before locking v0.3.

---

## Part D — Constitutional revision protocol

§18 (lines 1018-1060) says revisions happen "through explicit conversation" and "the household decides." Operationalize.

**Cadence.**
- **Quarterly review** (year 1): scheduled 2026-07-15, 2026-10-15, 2027-01-15. A peer-machine drafter (Opus or Claude-of-the-day) produces a delta memo against current version. Alton ratifies, defers, or rejects each delta line by line.
- **Annual full review** thereafter (April, anchored to the original v0.1 date of 2026-04-11).
- **Out-of-cadence patches** when (a) a hard rule is violated, (b) a peer machine joins, (c) the trust ladder shifts a stage, or (d) the base model swaps.

**Drafter assignment.** The drafter is the Opus-tier agent at the time of the review, instructed to read the full document, the prior delta memo, the daily logs since the last review, the Operating Agreement, and the curator logs. Drafter is not the ratifier. Same separation as proposal vs. grant in §12.

**Storage.**
- Approved versions: `reference/HOUSEHOLD-CONSTITUTION.md` (canonical), versioned `-vN.M.md` for archives.
- Delta memos (this file's class): `inbox/rocinante/_specs/YYYY-MM-DD_constitution-vN.M-delta.md`.
- Ratification record: a one-line entry in the History block at the end of the canonical file plus a ratification artifact at `reference/CONSTITUTION-RATIFICATIONS/vN.M.md` capturing what you accepted, deferred, and rejected, with brief reasoning.

**Floor lock.** Per the v0.2 drafter's closing note (line 1258) — §5, §7 (hard rules), §6 (priority hierarchy), and §20 (override principle) are floor candidates. Once ratified, edits to those sections require a higher bar: explicit Alton sign-off, not just absence-of-objection.

**The v0.2 → v0.3 path.** I propose: you read this delta memo within a week, mark each item accept/defer/reject, the curator promotes accepted items into v0.3 text, you sign the History block, and the ratification artifact is created. v0.3 then becomes the document the next fine-tune trains on.

---

## Where I think I might be wrong

- The Operating Agreement framing in B.1 may overstate the Agreement's importance. If the Agreement is really just plumbing for two machines, a Constitutional cross-reference in §14 may be enough; a new §14a is overbuild.
- The B.3 trust-ladder operationalization may be too rigid. A 90-day clean-window default is a number I picked, not a number with evidence behind it. Treat as a starting proposal.
- The B.4 idle-is-failure rule presupposes a working alert channel. The Operating Agreement §2 channels are not yet built (this is in P1-C). Adding the rule before the channel exists creates a Constitutional commitment with no enforcement mechanism — which is a §4 honesty problem in itself. Sequence matters: build the channel, then ratify the rule.

— End of v0.3 delta memo.
