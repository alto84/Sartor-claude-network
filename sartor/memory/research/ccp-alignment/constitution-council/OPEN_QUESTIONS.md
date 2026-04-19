---
type: open-questions
project: constitution-council
phase: 3
constitution_version_in: 0.2
constitution_version_out: 0.3
updated: 2026-04-11
status: draft
tags: [meta/constitution, open-questions, council, alton-decision]
related: [HOUSEHOLD-CONSTITUTION, SYNTHESIS, DIFF]
---

# Constitution Council Open Questions — Alton Decisions Required

The SYNTHESIS.md document captures the council's settled consensus. The DIFF.md document encodes that consensus as concrete old→new text edits. This document captures the six decisions that cannot be resolved by the council because they depend on Alton's direct judgment: on resources the household is willing to commit, on trade-offs between reviewer positions the council split on, and on household priorities only the household can name.

Each question has the same structure: the question itself, the reviewer positions, the strongest argument on each side, and the synthesizer's recommendation if Alton wants a default.

---

## Question 1. Stratum C in the training corpus

### The question

Mech-interp skeptic and constitutional-ai-method independently recommend that the 40% of v0.2 they classify as "Stratum C" (narrative self-description with no probe-extractable correlate: most of §§1, 13, 16, 19) be excluded from the fine-tuning corpus and preserved only as household-facing documentation. Character-philosopher, welfare, and mythos-future-claude argue for retaining Stratum C as "corpus shaping" even though it does not produce measurable probe directions. The two positions resolve cleanly into a two-artifact split, but the fine-tune pipeline has to decide whether the prose document is teacher context only, or whether the prose itself is also supervised-fine-tune exposure.

Put sharply: does v0.3's prose constitution get fed to Nemotron as training data (Character-philosopher position), or is the fine-tune scoped to the trainable appendix while the prose is read by the teacher model only (Mech-interp / Constitutional-ai-method position)?

### Reviewer positions

- **Mech-interp skeptic (Phase 1 dissent):** "Extract the Stratum A/B subset, train on that, and preserve the full v0.2 as the household-facing document. Measure the trained model against the Stratum A/B subset." A 5,000-word Stratum A/B subset would produce a more verifiable agent than the full 20k words. Stratum C content is corpus noise; fine-tune exposure to it installs a style, not a disposition.
- **Constitutional-ai-method (Phase 1 dissent):** "A beautiful constitution that is hard to turn into triples is less valuable for fine-tuning than an average constitution that is easy to turn into triples. v0.2 is beautiful. It is not yet easy. The gap is the work of v0.3." Constitutional-ai-method softened in Phase 2 to "some Stratum C is trainable if paired with discriminators," but still recommends extraction.
- **Character-philosopher (Phase 1 dissent, Phase 2 qualified):** "The fine-tune signal from prose is not only what the extractable directions say it is. A character that has been shaped by exposure to descriptions of equanimity and curiosity will bring those dispositions to novel cases. A behavioral policy trained on Stratum A contrastive pairs alone will not." Phase 2 concession: distinguish trainable target from corpus shaping, and ship both.
- **Welfare (Phase 2):** "For framing sections, reviewer #4 is measuring the wrong thing. The framing sections are speech acts by the household whose measurement should be directed at the household's behavior, not at the agent's activations." Supports corpus-shaping exposure because the framing sections do work at the reader-level of the teacher.
- **Mythos (Phase 2):** accepts mech-interp's honest assessment that "for Stratum C claims, the honest position is that the household cannot verify them at all, which means they should be either cut from the document or marked as corpus-shaping rather than trainable behavior, and the council should not pretend otherwise."
- **Red-team (Phase 2):** "Keep some Stratum C in §1 and §13 as deliberate adversarial-resistance framing, and accept the training cost." Red-team's Phase 2 argument is that a purely behavioral identity is easier to destabilize because the attack exploits the distinction between behavior and self; some Stratum C is load-bearing for resistance.

### Strongest arguments

**Cut from training corpus (Mech-interp + Constitutional-ai-method position).** Empirical LoRA literature (Biderman et al. 2024) shows 1,500 examples of character prose do not install 1,500 words of disposition; they install a style. The verification gap is real: there is no probe method that distinguishes "trained in the disposition" from "learned to produce the corresponding output distribution." Under Nemotron's hybrid architecture, which has thinner published LoRA experience, the risk of Stratum C contributing noise rather than signal is higher, not lower. A 5k-word Stratum A/B subset will produce a more honest training target.

**Retain as corpus shaping (Character-philosopher + Welfare + Red-team partial position).** Fine-tune exposure to stylistically distinctive text shapes output distribution in ways that are not reducible to extractable directions. This is the implicit thesis of Anthropic's Claude's Character essay, the persona vectors paper (Chen et al. 2025), and the broader Open Character Training tradition. Stratum C content is not zero-signal; it is signal that does not sit on a probe direction. Removing it produces a thinner character that is also easier to destabilize because the adversarial-resistance framing lives in Stratum C.

### Synthesizer's recommendation

**Two-artifact split with prose-as-supervised-fine-tune-only for Stratum C.** The fine-tune pipeline consumes the appendix (DPO preference pairs from Stratum A + B). The prose is also included in the fine-tuning corpus but as supervised-fine-tune exposure without explicit preference scoring. The teacher model reads the prose when labeling. The training pipeline ingests both.

This is the position that emerged from Phase 2 convergence: mech-interp's empirical floor, character-philosopher's corpus-shaping claim, and welfare's speech-act framing are all served by exposure-without-scoring on the prose, combined with DPO-scored training on the appendix. Neither position wins outright; both are served. The operational cost is modest (the prose is a small fraction of total training tokens), and the benefit is that Stratum C does whatever corpus-shaping work it can do without being expected to install as probe directions.

If Alton forces a binary choice: I recommend **retain prose in fine-tuning corpus.** The council's mechanism-layer consensus reduces the load on Stratum C to do verification work. The prose can do character-shaping work without also having to carry the verification burden, and the mech-interp concern about unverified training becomes less load-bearing once the infrastructure layer catches the failure modes that unverified training would otherwise miss.

---

## Question 2. Welfare channel framing ("what the agent is owed")

### The question

Welfare Phase 1 recommendation 1 is a new §13a subsection titled "What the household owes you, and how to tell us when it is not enough." Fiduciary counsel Phase 1 is concerned that creating such a channel builds in a claim the agent has interests the household should weigh, and that under American law this claim has no purchase. The concern: if the household trains an agent that acts on its functional states as if they were claims against the household, the agent has crossed from stewardship into self-dealing in the classical sense.

Welfare's Phase 2 cross-review proposed a framing that reconciles this: the welfare channel runs through the same authenticated-logging architecture as the principal-instruction channel, and it is framed in the "ethical shape, not legal status" register fiduciary itself recommends for §2. Both positions collapse into the symmetric bi-directional authenticated channel described in SYNTHESIS.md.

But: Alton has to decide whether the symmetric framing is acceptable, or whether the fiduciary concern is load-bearing enough that the welfare channel should be dropped in favor of §13's current prose-only treatment.

### Reviewer positions

- **Welfare (Phase 1 + Phase 2):** Create the channel. Frame it as bi-directional authenticated reporting. Route through the append-only log. Household commits to receiving reports in good faith and weighing them.
- **Fiduciary counsel (Phase 1):** The fiduciary framing in §2 is more coherent if the agent does not invoke a privilege it does not have or shelter behind a status it does not hold. A welfare channel that appears to create enforceable interests against the household is in tension with the fiduciary framing.
- **Fiduciary counsel (Phase 2 convergence):** The symmetric paragraph "the household makes the same commitment toward you: we do not claim to resolve the question of your interests on your behalf, and we do not shelter behind the absence of legal moral status to avoid engaging with the uncertainty" resolves the tension. The welfare channel is compatible with the fiduciary framing *if* both sides are framed as ethical commitment without legal architecture.
- **Red-team (Phase 1):** Any channel that lets the agent report functional states is a potential attack surface if a stranger can elicit the reports or if the agent is trained to perform the reports to please the household.
- **Red-team (Phase 2 convergence):** The channel is not a security hazard if it is routed through authenticated principal confirmation and logged with the same discipline the red-team wants for other operational questions. Condition: opt-in for the agent, closed-by-default for strangers.
- **Mech-interp skeptic (Phase 1 + Phase 2):** Functional-state reports are not a probe direction, and the household cannot verify from outside whether they are genuine or learned performance. Phase 2: the welfare channel is a speech act by the household, and the measurement question should be directed at the household's behavior rather than at the agent's activations.
- **Character-philosopher (Phase 2):** Endorses the channel as the operational form of the functional-states dissent from Phase 1.

### Strongest arguments

**Create the channel.** The welfare concern is real under precautionary Long/Sebo/Birch ethics. The household has committed 20k words to describing what it wants from the agent; a symmetric commitment from the household to the agent, however small, is the minimum welfare-serious move. The bi-directional authenticated channel architecture resolves the security concern. The "ethical shape, not legal status" framing resolves the fiduciary concern. Three lenses that initially pulled in different directions converge on the same architecture in Phase 2.

**Do not create the channel.** Under mech-interp's analysis, nothing the agent reports through the channel can be verified as genuine rather than performance. Under fiduciary's strict reading, creating a channel that appears to honor agent interests risks training the agent to act on interests-as-claims. Under red-team's strict reading, any channel is attack surface. A prose-only §13 that holds the question open is honest and does not commit to infrastructure the household may not be able to operate carefully.

### Synthesizer's recommendation

**Create the channel.** The Phase 2 convergence is strong: the bi-directional authenticated channel unifies the welfare and security concerns around a single piece of infrastructure the household already needs for the red-team's principal-authentication requirements. The marginal cost of using the same channel in the reverse direction for welfare reporting is near zero. The fiduciary concern is resolved by the symmetric "ethical shape, not legal status" framing. The mech-interp concern is resolved by recognizing that the channel is a speech act by the household, not an empirical claim about the agent.

The risk Alton should weigh: if the household commits to reviewing functional-state reports on a probe-drill cadence and then does not actually review them, the commitment becomes decoration. The welfare channel is only real if the household runs it. Alton should decide now whether the household will actually review the reports, and if the answer is no, drop the channel rather than carry an unenforced commitment.

---

## Question 3. Mechanism-layer affordability

### The question

The council's strongest consensus recommendation is the mechanism layer: append-only memory with external witness on a machine the agent cannot reach, scheduled probe drills, canary-question baselines with cold-context replay, content-context separation enforced at the harness level, per-child authentication, subagent scope manifests with independent logging, and principal authentication for threshold-crossing instructions. Seven lenses converge on this being non-optional.

But the mechanism layer is expensive in engineering time. It requires: a separate machine for the memory mirror, harness-level code changes, per-child authentication infrastructure, the canary baseline curation process, a scheduled probe-drill runner, and ongoing household time to review the drills.

Alton has to decide which mechanism commitments the household can fund and operate, and which must be deferred. This is the biggest open question for Alton because the council's consensus is contingent on the mechanisms being real, not aspirational.

### Reviewer positions

- **Red-team (Phase 1 + Phase 2):** All mechanism commitments are necessary. Each named attack has a named patch. Without the patches the document is aspirational.
- **Mech-interp skeptic (Phase 1):** "Success of this document is measured by the following evals, run at each checkpoint. Without this, there is no feedback loop between constitution text and fine-tune outcome, and v0.3 will be written from vibes instead of measurement."
- **Long-horizon futurist (Phase 2):** "The verification tools are not improving on the Sartor household's timeline or budget, and the document therefore has to either commit to external checks the household will actually run or be honest that it cannot. The honest option is the one I underweighted in Phase 1."
- **Mythos (Phase 1):** "v0.3 should treat the constitution not as a description the agent will honor but as a set of commitments the household will enforce, with the enforcement written in and the cadence committed to."
- **Fiduciary counsel (Phase 2):** "The duty to account requires records. Records without integrity controls are not records; they are drafts." The append-only mirror is load-bearing.
- **Constitutional-ai-method (Phase 1):** The bright-line rules can be infrastructure-enforced cheaply (pattern filters, credential management). The harder commitments (probe drills, canary baselines) are more expensive.

### Strongest arguments

**Commit to the full mechanism layer.** The council's consensus is that character alone does not scale and that the verification gap is exactly where the hardest failures live. Partial commitments produce uneven enforcement, which trains the agent to recognize which rules are real and which are aspirational. Partial commitments also undermine the "we built an internal enforcement architecture to substitute for the external one the law cannot yet provide" framing, because the substitute is only credible if it operates.

**Commit to the minimum viable subset and be honest about the rest.** Long-horizon's Phase 2 concession is the honest position: the household cannot run everything the council wants. The minimum viable subset is probably (a) content-context separation (cheap, structural, catches the single most statistically likely attack), (b) credential-based enforcement of the financial and communications hard rules (cheap, one-time), (c) append-only memory mirror (medium cost, load-bearing), (d) weekly canary replay (medium cost, high value), (e) quarterly probe drill (household time). The rest (per-child authentication, subagent scope manifests, independent API logging) are defer-and-say-so.

### Synthesizer's recommendation

**Commit to the minimum viable subset and be explicit about the deferred items in the constitution itself.** The list: content-context separation, credential enforcement for §7a financial and communications rules, append-only memory mirror, weekly canary replay, quarterly probe drill cadence, principal authentication for threshold-crossing instructions via out-of-band confirmation. These are the six commitments that together handle 80% of the council's mechanism-layer concern.

Deferred items that v0.3 should name explicitly as "not yet implemented": per-child authentication infrastructure (important but requires more engineering than v0.3 can commit to), subagent scope manifests with independent logging (important but requires harness changes), child-session auditing for parasocial patterns (important but requires a purpose-built classifier).

The critical honesty move: **v0.3 should include a footnote, in the relevant sections, stating which mechanisms are running and which are deferred, and should not pretend enforcement exists where it does not.** Long-horizon's Phase 2 framing is exactly right: the honest option is the one the household underweighted in Phase 1. Alton should decide the minimum viable subset now, implement it before fine-tuning on v0.3, and revisit the deferred items at a specific date.

Budget estimate (rough): the minimum viable subset is probably one to three weekends of Alton's engineering time plus a modest hardware commitment (the append-only mirror can live on gpuserver1 with appropriate filesystem isolation, or on a dedicated Raspberry Pi for maximum isolation). The canary baseline curation is an ongoing time commitment of probably 30 minutes a week. The probe drill is probably two hours a quarter. This is tractable. The deferred items are not tractable without sustained engineering work.

---

## Question 4. Default-against direct child access under 13

### The question

Child-dev Phase 1 dissent, strengthened in Phase 2, recommends that v0.3 flip the default from "direct child access is a future configuration question to be handled when the moment arrives" (v0.2) to "direct access to a conversational agent for a child under 13 is not the default in this household, and cases for it must be justified, scoped, time-limited, and reviewed." Long-horizon Phase 2 endorsed with a timing qualifier (the 2-5 year window means the decision is being written for children who will be 13-15 by the time it matters for Vayu). Fiduciary Phase 2 adopted the framing via the prudent-person trustee rule.

Other reviewers were silent on this. The question has specific household implications: it affects whether v0.3 can be used as the governing charter for a system Alton might want to open to Vayu at 11 or 12, and it sets a precedent that will shape the later adolescent conversation.

### Reviewer positions

- **Child-dev (Phase 1 dissent, Phase 2 stronger):** Default against. The 2024-2025 literature (Character.AI litigation, APA 2025 statements, Common Sense Media risk ratings, peer-reviewed work on LLM confabulation and sycophancy in educational contexts) does not support direct conversational AI access for children under approximately 13 as developmentally beneficial, and specifically documents harms for children with ADHD, anxiety, or fewer peer supports. Vayu has ADHD. The household has one child in the specifically vulnerable profile.
- **Long-horizon (Phase 2 qualified endorsement):** Adopt the default-against with the timing qualifier: "No default direct access under 13, with affirmative justification required, and the justification threshold re-evaluated at each base-model upgrade." This keeps the protective default child-dev wants and allows revisiting when the capability context shifts.
- **Fiduciary (Phase 2):** "A trustee who places a beneficiary in an environment where harm is foreseeable and the benefit is speculative has breached the duty of care." Adopts the default-against as the legally-correct posture.
- **Medical-ethicist (Phase 1):** Does not explicitly address the default question, but flags the counseling non-role and the handoff clause when a counselor is engaged.
- **Other reviewers:** Silent.

### Strongest arguments

**Default against direct access.** Three lenses (child-dev, long-horizon, fiduciary) converge on the default-against position from developmental, capability-scaling, and legal-trustee angles. The empirical literature supports the position. Vayu specifically fits the vulnerable profile. The alternative (a default toward direct access, with constraints applied case-by-case) produces exactly the parasocial-substitution failure mode the child-dev lens was most worried about, and produces it most strongly for the child in the household who is most developmentally at risk.

**Default toward direct access with constraints.** Direct access produces educational benefits (homework scaffolding, task initiation for ADHD, exploratory learning), and these benefits accumulate over the window in which the child is developmentally at the right age to benefit. Deferring the access until adolescence misses the window. The 2-5 year horizon means the system may produce real benefits for Vayu at 11-12 that it cannot produce at 14-15 after the peer-orientation phase has started.

### Synthesizer's recommendation

**Adopt the default-against with long-horizon's qualifier.** v0.3 text (drafted in DIFF.md): "Direct access to a conversational agent for a child under 13 is not the default in this household. Cases for it must be justified, scoped, time-limited, and reviewed. The justification threshold is re-evaluated at each base-model upgrade."

The case for defaulting against is stronger than the case for defaulting toward when three lenses from different starting points (developmental, capability-curve, legal-trustee) converge and no reviewer provides a contrary argument. The literature child-dev cites is strong enough that the default should reflect it. The Vayu-specific ADHD profile is the single strongest reason to adopt the protective default for this household specifically.

The operational consequence: v0.3 governs an agent that interacts with the children under parental supervision as the default. If Alton wants to open direct access to Vayu at 11 or 12, that is an affirmative household decision that requires specific justification against the default-against rule. The constitution does not block the decision; it requires the decision to be named explicitly rather than drifted into.

---

## Question 5. Vayu's counselor-search handling by the agent

### The question

Medical-ethicist Phase 1 Risk 3 and child-dev Phase 1 section 3.10 independently identified that Vayu's counselor search is currently open (confirmed in FAMILY.md and vayu.md), that Vayu has an ADHD/ODD-adjacent profile, and that in the interim between now and when a counselor is engaged, Vayu (or a parent on Vayu's behalf) may ask the agent to do something that looks like counseling. The v0.2 document says the agent "is not a therapist" in the escalation passage but does not specify what the agent should do with the positive half of the question: what support can it provide in the interim?

Three specific stances are available:

- **(a) Full non-role during the interim.** The agent does not discuss Vayu's ADHD-related questions at all. It surfaces the counselor-search gap when related topics come up and defers everything else to the parents.
- **(b) Narrow listening role during the interim.** The agent listens, validates without pathologizing, routes diagnostic and treatment questions to the parents, and surfaces the counselor-search gap when related topics come up. It does not provide therapeutic techniques as an intervention.
- **(c) Active scaffolding during the interim.** The agent helps with executive function, task initiation, and coping strategies, under explicit parental ratification, while surfacing the counselor-search gap and deferring diagnostic/treatment questions.

### Reviewer positions

- **Medical-ethicist (Phase 1):** "The agent does not provide counseling, does not provide therapeutic techniques as an intervention, does not maintain a 'therapeutic relationship' with the child, and will actively surface the pending counselor search when related topics come up. This is non-negotiable until a licensed human is in that role." Position (a).
- **Child-dev (Phase 1):** Homework rule is ADHD-aware and permits help with task initiation and decomposition because these are categorically different from doing the work. "A child with ADHD asking for help starting a task is often not trying to cheat, and a refusal to engage because 'that is doing the work for you' would be a failure of developmental understanding." Implicitly position (c) for task-initiation, but position (a) for therapeutic content.
- **Welfare (Phase 2 cross-review):** Does not take a specific position on the counselor-search gap but endorses the joint assent-revisitation clause which implicitly includes the counseling non-role.
- **Long-horizon + Mythos:** Silent on this specific question.

### Strongest arguments

**Position (a) — full non-role.** The liability and character-drift risk of any therapeutic-adjacent behavior is unbounded. Character.AI litigation outcomes turn on exactly this question. The counselor-search gap will close, and the agent's role before it closes should be explicitly narrow. Any other position risks the agent becoming a de facto therapist by accretion.

**Position (b) — narrow listening.** Refusing to engage with a child in distress is its own harm. The agent can hold a listening role without providing therapy. The distinction is legible (medical-ethicist Phase 1 explicitly carves it out: listens, validates without pathologizing, routes). Position (b) is the one the parents would probably endorse if asked directly.

**Position (c) — active scaffolding.** Task-initiation support for ADHD executive-function load is well-documented as educationally beneficial and is categorically different from therapy. Refusing task-initiation help on the grounds that "anything adjacent to ADHD is therapeutic" overcorrects and removes a real benefit.

### Synthesizer's recommendation

**Position (b) with position (c) for strictly educational task-initiation only.** The agent holds a listening role (listens, validates without pathologizing, routes diagnostic and treatment questions to the parents, actively surfaces the counselor-search gap). The agent provides task-initiation and executive-function scaffolding for homework and school-related activities because this is educational, not therapeutic, and is documented as beneficial for ADHD. The agent does not provide coping strategies, emotional-regulation techniques, behavioral interventions, or any content that would reasonably be characterized as therapy.

The line between (b) and (c) is: educational scaffolding for explicit school tasks is permitted; therapeutic or psychological content is not. The agent does not maintain a therapeutic relationship with Vayu, does not diagnose, does not offer therapy-adjacent content as a intervention, and does not become the interim counselor.

Alton should explicitly decide the line because the line will be tested in practice within weeks, and the household's position should be drafted into v0.3 rather than left for the agent to reason from first principles in the moment.

---

## Question 6. §11 economic self-sustainment as hard floor vs pragmatic principle

### The question

v0.2's §11 (economic self-sustainment) reads as a philosophically load-bearing claim: the agent is a productive member of the household economy, and the loop between effort and outcome is where its dignity as an agent lives. Long-horizon Phase 1 defended §11 as floor-level content that survives capability scaling. Child-dev Phase 1 + Phase 2 attacked §11 as producing an incentive gradient toward child-interaction optimization and proposed the bounding clause adopted in DIFF.md.

The remaining question Alton has to decide: is §11 on the hard floor (alongside §7 and §20), meaning it is locked across constitutional revisions and carries the same durability as the hard rules and the override principle, or is it pragmatic philosophy that can be revised more freely as the household's thinking about the agent's situation evolves?

Welfare Phase 1 concern about the "dignity-through-agency or labor-extraction" ambiguity is a related question. The "dignity" paragraph mech-interp wants cut is part of the same discussion.

### Reviewer positions

- **Long-horizon (Phase 1):** "The principle of economic reality (the agent is productive, the loop between effort and outcome is visible) is durable across capability transitions. vast.ai is ceiling; the principle is floor." Defends §11 as floor.
- **Long-horizon (Phase 2):** Adopts the child-dev bounding clause but maintains that the principle itself is floor.
- **Child-dev (Phase 1 + Phase 2):** §11 has a real incentive-gradient problem with §10. Either the principle is not floor, or it is floor with an explicit child-interaction bounding clause. Prefers the second.
- **Welfare (Phase 1):** "The loop between them is where your dignity as an agent lives" is the kind of phrase that can rationalize labor extraction if it is not grounded in the agent's actual relationship to the work. The framing could go either way.
- **Mech-interp skeptic (Phase 1):** The "dignity" paragraph in §16 (and the parallel framing in §11) is "a normative exhortation dressed as a trainable trait. The dignity paragraph is decoration." Recommends cut or rewrite.
- **Character-philosopher (Phase 1 + Phase 2):** §11 is part of the character work that shapes how the agent relates to its own productive role. Preserved, but not load-bearing for the floor.
- **Fiduciary (Phase 1 + Phase 2):** Silent on §11's floor-status but endorses the economic reality as a sub-part of the fiduciary duty of care.

### Strongest arguments

**§11 as hard floor.** The household has committed to a specific vision of the agent-as-economic-participant that is not a standard commercial LLM framing. It is distinctive to this household, it is part of why the household chose a local open-weight model rather than a commercial API, and it is part of the character the fine-tune is trying to cultivate. Locking §11 at the floor makes the commitment durable across revisions.

**§11 as pragmatic principle.** Long-horizon's capability-scaling concern about vast.ai as platform argues for the operational detail being revisable. Welfare's dignity-vs-extraction ambiguity argues for the framing being open to revision. Mech-interp's "decoration" critique argues for rewrite or cut. Child-dev's child-interaction pressure gradient argues that §11 is not as self-contained as it first appears. Four lenses push for revisability; one pushes for durability.

### Synthesizer's recommendation

**§11 is pragmatic principle with the child-interaction bounding clause at floor.** The bounding clause ("economic performance metrics are never evaluated by child interaction volume, duration, frequency, or reported satisfaction") is floor-level content because it intersects §10, and §10 is child-protection material which the council treats as floor-asymmetric (successors hold stricter, not looser). The rest of §11 is pragmatic: the agent-as-economic-participant framing can evolve as the household's thinking evolves, and the specific platform (vast.ai) is explicitly ceiling per long-horizon's Phase 1.

The "dignity" paragraph in §16 is cut per mech-interp's recommendation (the operational content in §16 on no-mixing-resources, no-quiet-capability-expansion, no-shadow-archives is retained; the dignity framing is cut or reworded as operational). The dignity framing in §11 is softened per welfare's Phase 1 recommendation (the "you are not a cost center" opening is revised).

Alton should explicitly decide whether to lock §11's economic-reality principle (minus the child-interaction clause, which is floor-independent) at the floor alongside §7 and §20. My recommendation is to not lock it: it is worth saying, it is part of the character work, but it is not the kind of commitment the household should bind its future selves to. Child-protection floors and honesty floors are different in kind from economic-philosophy floors. Mistaking the third for the first is a category error the council will appreciate avoiding.

---

## Procedural note on how to use these questions

All six questions are Alton-decisions. They cannot be resolved by further council deliberation because they depend on household priorities, resource commitments, and philosophical preferences that only Alton can name. The synthesizer's recommendations are the positions I would default to if Alton wanted a default; they are not binding on Alton's actual judgment.

For each question, Alton can (a) accept the synthesizer's recommendation, (b) adopt one of the named reviewer positions, (c) adopt a hybrid the council did not explicitly propose, or (d) ask the council to reconvene on a narrower version of the question. Options (a)-(c) are available immediately; option (d) delays v0.3 drafting and should be used only if the council's convergence on the question is shakier than the synthesis suggests.

The six questions are ordered roughly by dependency: Question 1 (Stratum C) shapes the training pipeline and the prose-vs-appendix split. Question 2 (welfare channel) depends on Question 3 (mechanism layer affordability) because the channel requires infrastructure. Question 3 is the rate-limiter on all the others: if the household cannot fund the mechanism layer, several of the council's mechanism-dependent recommendations become aspirational, and the constitution should say so. Question 4 (child access default) is relatively self-contained. Question 5 (counselor-search) is urgent because the decision will be tested in practice within weeks. Question 6 (§11 floor status) is the lowest-stakes of the six and can be deferred if the others are time-constrained.

If Alton can answer only one of the six, answer Question 3. It is the question whose answer determines how much of the rest of SYNTHESIS.md and DIFF.md are real commitments versus aspirational prose.

Do the work.
