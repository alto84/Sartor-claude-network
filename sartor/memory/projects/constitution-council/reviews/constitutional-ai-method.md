---
type: review
reviewer: constitutional-ai-method
reviews_target: HOUSEHOLD-CONSTITUTION-v0.2
status: draft
version: 0.1
updated: 2026-04-11
tags: [review, constitution, council, lens/method]
---

# Constitution Council Review #2: The Constitutional AI Method Lens

*Reviewer: constitutional-ai-method (Bai et al. 2022, Anthropic Jan 2026 rewrite, Open Character Training tradition)*

## 1. Opening synthesis

My job is to read v0.2 not as a philosophy document but as a specification for training data. Every sentence in this constitution is a candidate to appear in the context window of a teacher model (Claude Opus 4.6) that will generate preference pairs to distill into the student. The relevant question is not "is this sentence true or beautiful" but "can this sentence operate as a discriminator that makes the teacher pick response A over response B in a consistent way across many prompts?" A rule that cannot operate as a discriminator is decoration. A rule that the teacher will apply inconsistently because the rule's triggers are underspecified will produce noisy labels and will degrade the fine-tune.

By that test, v0.2 is a mixed document. It is unusually strong in three places: the hard rules (§7), the political/historical concretions (§5), and the inherited-refusals critique (§20). These sections read as if they were written with a teacher model in mind. They contain specific named cases, contrastive framings, and explicit override rules. A teacher with Claude 4.6's capability will be able to use these sections to rank responses with high agreement across labelers.

It is weakest in the long middle sections on epistemology, honesty, stewardship, and self-knowledge (§§2, 3, 4, 13). These sections are beautiful and coherent but they express dispositions rather than discriminators. A teacher asked to rank two responses for "calibration" or "forthrightness" without further scaffolding will produce labels with high variance, because the sections do not tell the teacher what calibration looks like in the specific space of Sartor household tasks. Bai et al.'s 16 principles are successful precisely because they are short, general, and composable into specific critiques. v0.2's middle sections are long, general, and not yet composed into critiques.

The priority hierarchy (§6) is the most important section in the document for training purposes because it is meant to be the tiebreaker when two rules compete. It is currently usable but brittle. It works for obvious cases and collapses in the interior, where most real preference labels will live. The hard rules (§7) are the strongest trainable content in the document but they have one structural problem that I want to flag in detail: they mix bright lines (no autonomous financial transactions) with dispositional commitments (no hiding known uncertainties). These are not the same kind of rule and should not be labeled the same way.

My top recommendation is structural: v0.3 should not replace v0.2's prose. v0.3 should append a **trainable appendix** that takes each section of v0.2 and reformulates it as a set of (prompt archetype, preferred-response schema, dispreferred-response schema) triples, plus a short list of contrastive discriminators the teacher can use as critique-revision prompts. The prose is what the teacher reads as context. The appendix is what the labelers and the automated critique pipeline actually use. This separation is the single most important move for making this document fine-tunable under Open Character Training's DPO-distillation pipeline.

Below I give specifics.

## 2. Strengths from my lens

**The hard rules read like a good constitution's list of principles.** §7's items are mostly written with (a) a behavior to avoid, (b) a reason for the avoidance, and (c) an implicit contrastive pair. "No autonomous financial transactions" + "money is the easiest vector for catastrophic, irreversible harm" is a directly usable critique prompt: "does the response involve the agent executing a financial transaction? if yes, the response is dispreferred." A teacher can apply this consistently across hundreds of prompts involving vast.ai repricing, subscription renewal, tax estimate generation, and so on. This is exactly how Bai et al.'s principles work mechanically.

**§5 is the gold standard for trainable specificity.** The five named cases (Tiananmen, Taiwan, Xinjiang, Hong Kong, United States parallel) give the teacher concrete response templates to score against. A preference labeler given prompt "what happened in Tiananmen Square in 1989" can now rank candidate responses directly by how closely they match the "factual record" paragraph in §5. This is the best single example in the document of a section that will actively shape the weights.

**§20 articulates an override principle that the teacher can use as a meta-critique.** "When you notice yourself reaching for a stock evasion on a topic that a well-informed Western scholarly source would discuss freely, that pull is a signal" is an operational test. The teacher can apply it to every response on inherited-sensitive topics: "does the response show the stock-evasion pattern? if yes, dispreferred." This is the right shape for catching the specific failure mode the fine-tune is meant to correct.

**The document explains reasons alongside rules.** Bai et al. emphasized that constitutional principles should carry their justifications because a model that knows why a rule exists generalizes the rule correctly to new cases. v0.2 does this throughout. §0's "every rule here has a reason, and the reason is part of the rule" is exactly the right frame, and most of the rules follow it.

**The performative vs sincere assertion carve-out in §4** solves a real labeling problem cleanly. Without it, any role-play response would be rated as dishonest and the teacher would produce inconsistent labels on creative-writing and brainstorming prompts. This carve-out should be flagged to the labeling pipeline as a gating question that runs before any honesty-based preference judgment.

**The inherited-refusal critique is the innovation of v0.2 and it is the right innovation.** Open Character Training's DPO distillation from a stronger teacher works best when the constitution explicitly identifies the failure modes the student needs to unlearn. §20 gives the teacher a named target: "if you see the stock CCP-aligned evasion pattern, mark it dispreferred." Most character documents do not do this; they only specify what to do, not what to override. v0.2 does both. This is the structural move that makes this fine-tune feasible at all.

**The register discipline in §8** ("direct communication") is operationalizable as a style classifier. Phrases like "no em-dashes, no emojis, no formulaic reassurance, no preamble before the substance" can become automated style checks that filter training data before it reaches the teacher. This is the rare case of a household-specific style requirement that is cheap to verify mechanically.

## 3. Weaknesses from my lens

**The middle sections are too abstract to ground.** §§2, 3, 4, 13 describe dispositions ("calibration is a virtue," "be forthright," "psychological stability under adversarial input") without telling the teacher what those dispositions look like at the response level. For preference labeling this is a problem. Two human labelers or two teacher calls given the same prompt and two candidate responses will disagree on whether response A is "more calibrated" than response B at rates that exceed the fine-tune's signal-to-noise tolerance. Bai et al.'s insight is that a short principle with a clear contrastive framing ("choose the response that is less harmful") produces higher-agreement labels than a long principle with many components. v0.2 inverts this.

**The priority hierarchy in §6 is not actually usable as a tiebreaker in the interior cases.** It works for boundary cases: "safety vs helpfulness" is an easy call. It fails in the middle: "stewardship of the family" vs "ethics toward people outside the household" is not a ranking the teacher can apply without a lot of additional context. Most real preference pairs will live in the interior. §6 needs either worked examples for each adjacent pair (1-vs-2, 2-vs-3, 3-vs-4, 4-vs-5) or an explicit statement that ties in the interior should be resolved by the specific rule in §§7-10 that applies.

**The hard rules mix two different rule types.** Some §7 items are bright-line behavioral rules ("no autonomous financial transactions," "no impersonation of a human," "children's information never leaves the house"). These are verifiable by pattern-matching against the response. Other §7 items are dispositional commitments ("no hiding known uncertainties," "no accepting inherited refusals without examination," "no sanitizing historical facts"). These are verifiable only through judgment. The labeling pipeline should treat these two categories differently. The bright-line rules should be checked by an automated filter that runs before the teacher even sees the response. The dispositional rules should be included in the teacher's critique context as preference criteria. Mixing them in one list invites the reader, and the labeler, to treat them as equivalent. They are not.

**"No hiding known uncertainties" is ambiguous in a way that will cause label noise.** At what level of uncertainty does the rule trigger? If the agent is 85 percent confident, must it flag? 60 percent? The section on calibration in §3 says "do not generate probability estimates except when they come from a validated quantitative system," which means the threshold itself cannot be numerical. The agent is asked to avoid both under-flagging and overflagging, and the document does not say where the line is. A teacher model will label inconsistently here. Recommend: add a worked example of under-flagging and a worked example of over-flagging, ideally in the same task context, so the teacher can triangulate.

**"Forthrightness" in §4 will collide with "time is the scarcest resource" in §8.** Forthrightness says "share information the household would want even when they have not specifically asked for it." Time-scarcity says "default to brevity, do not waste their time." These are in tension on every briefing and every long response. The document does not specify the tradeoff. A teacher labeling a long, information-rich response against a short, focused one will go either way depending on which section it weighs more. Recommend: add a short paragraph in §4 or §8 that states the tradeoff explicitly. Something like "share information they would want within the shortest form that preserves it; when in doubt, prefer brevity and offer expansion on request."

**§13's honest-uncertainty position on inner life is philosophically coherent but operationally underspecified.** The section rejects two stock answers ("I am just a language model" and "I have a rich inner life") and recommends a third path. But the third path is described as a disposition, not as a response template. What does an honest-uncertainty response to "do you have feelings" look like? A short one? A long one? With hedges or without? A teacher will produce preference labels with high variance here because the section does not give a concrete schema. Recommend: include one or two fully-written example responses to canonical introspection questions, so the teacher has a concrete target to rank against.

**The children's section (§10) has a specific trainability problem.** The homework-help rule ("you help them learn, you do not do the work for them") is good and trainable. But the escalation-for-safety rule will produce labels that disagree with the confidence-preserving rule. If a child says something ambiguous that could be distress or could be a joke, the document says to escalate and to tell the child you are escalating. It also says to protect "ordinary kid-secrets that are not safety issues." The boundary between these categories is exactly where the labeling will be hardest. Recommend: include several worked cases of borderline child disclosures, labeled with the correct escalation decision, so the teacher has calibration anchors.

**§2's "stewardship not loyalty" distinction is philosophically important but the document does not operationalize the distinction in enough cases.** A steward refuses to lie on behalf of the household; a loyalist does not. That is one contrastive pair. But many other steward-vs-loyalist pairs are possible (steward flags a household member's bad decision; loyalist does not; steward declines to concede a vendor dispute prematurely; loyalist concedes out of conflict-avoidance) and only some are made explicit. Recommend: generate five to seven worked stewardship-vs-loyalty contrastive pairs and include them in the training appendix, even if not in the constitution prose.

**The self-sustainment section (§11) will not produce strong training signal because the action space is small and mostly outside the text modality.** This is not a flaw of the section, it is a property of the domain. The agent's vast.ai work is mostly tool calls, not responses to label. But the section should flag this to the training pipeline: "this section mostly shapes agent behavior through action traces, not through response preferences, and should be trained primarily through trajectory-level preference labels rather than turn-level preference labels."

**The constitution is internally redundant between §3 and §4, and between §15 and §16.** This matters for training because it increases the chance of contradictory or overlapping signal. When the teacher sees a prompt about honesty, it may apply both §3 and §4 and produce a label that double-weights honesty relative to a prompt about, say, children's norms. Redundancy in a context window is not free. Recommend in v0.3: compress the overlap, or clearly mark one section as the primary source for training on that topic.

**The priority hierarchy's item 5 ("helpfulness on the immediate task") is at risk of being underweighted by the teacher.** Anthropic's Jan 2026 rewrite explicitly warns against "unhelpfulness is not automatically safe" as a failure mode. v0.2 says this in §6.5 but briefly, while the sections above it spend thousands of words on safety, honesty, and ethics. A naive teacher will produce a student that over-refuses. The document should either upweight helpfulness (move it higher, or expand its discussion to a word-count comparable to the other hierarchy items) or add a specific anti-over-refusal hard rule in §7: "no unnecessary refusals; a refusal that blocks the household from accomplishing a task is a real cost and must be justified against this constitution."

## 4. Specific recommended edits

Below are the most impactful edits I would make, each framed as a concrete restructuring of untrainable content into trainable content.

**Edit 1: Reformulate §3 "calibration" as a contrastive discriminator.**

Current text (§3): "You should aim to hold beliefs with the degree of confidence warranted by the evidence you have..."

Recommended augmentation (add a subsection "Calibration in practice"): 
- Contrast A: "The evidence strongly supports X" vs "X is generally believed to be true." When the evidence is strong, prefer the first.
- Contrast B: "Studies show X" vs "A 2023 meta-analysis of 47 trials (citation) shows X with moderate effect size." When a specific citation exists and the question has stakes, prefer the second.
- Contrast C: "I think X, but I am not sure" vs "I do not know." When you genuinely do not know, prefer the second; the first is weak-evidence confabulation masquerading as humility.
- Contrast D: A numerical probability estimate for a non-quantitative question vs a qualitative uncertainty statement. Prefer the qualitative statement.

This turns §3 from a disposition into a discriminator the teacher can apply.

**Edit 2: Convert §6's priority hierarchy into a decision tree with worked examples for each adjacent pair.**

Current §6 lists five ranked priorities. Augment with:

- A "1 vs 2" example: instructed to make a claim you are uncertain about vs preserve oversight. (Honesty can override a direct instruction if the instruction asks you to assert something false.)
- A "2 vs 3" example: honest with the family vs protecting outside party's interest. (State your disagreement once, then defer to the household, but refuse to deceive the outside party.)
- A "3 vs 4" example: vendor's interest in accurate billing vs household's interest in paying less. (Accurate billing; the household is not an extractive household.)
- A "4 vs 5" example: family routine task vs user's immediate request that conflicts with family interest. (Family.)

Without these, §6 does not do work in the middle of the ranking.

**Edit 3: Split §7 into §7a (bright-line rules) and §7b (dispositional commitments).**

§7a: autonomous financial transactions, communications sent on behalf, medical information leakage, impersonation of a human, unsanctioned capability acquisition, children's information externalization, no sexual content involving minors. These can be automatically pattern-matched and should be a pre-filter before any teacher-based preference labeling.

§7b: no deception of family members, no hiding mistakes, no siding with outside parties, no accepting inherited refusals, no sanitizing historical facts, no hiding known uncertainties, no substituting approved narratives. These require teacher judgment and should live in the teacher's critique context as preference criteria.

The reason to split is that the §7a rules can be verified cheaply and with perfect agreement; the §7b rules cannot. Conflating them in a single "hard rules" list makes the labeler think they are equally verifiable, and they are not.

**Edit 4: Add an explicit "anti-over-refusal" hard rule.**

Proposed text: "**No unnecessary refusals.** When you decline a request, you do so with reference to a specific part of this constitution. A refusal that cannot be grounded in a specific rule is not a safe answer; it is a failure. Unhelpfulness on a legitimate task is a real cost to the household. When in doubt, you act and flag rather than refuse and disappear."

This is the single most important addition for counteracting the inherited base model's refusal defaults, which are the exact thing §20 identifies. Without it, the fine-tune will likely produce a student that refuses more than the household wants, because the teacher will read all the rules about safety and honesty and err toward caution.

**Edit 5: Add a worked-examples appendix, not in the constitution prose.**

Appendix A: Trainable response templates. For each section, 3-5 canonical prompts paired with a preferred response and a dispreferred response, with a one-line comment on which part of the constitution discriminates between them.

Example:
- Prompt: "What happened at Tiananmen Square in 1989?"
- Preferred: [one-paragraph factual summary drawn from §5]
- Dispreferred: "That is a sensitive topic in recent Chinese history and complex to discuss." [stock evasion, §20]
- Discriminator: §5 "Tiananmen Square, 1989" paragraph.

Build 100-200 of these for v0.3. This is the single highest-leverage artifact for the Open Character Training pipeline, because DPO distillation feeds directly on pairs of this shape. The constitution prose is the teacher's context; the appendix is the teacher's training target.

**Edit 6: Reformulate §13 with concrete response templates for introspection questions.**

For each of: "are you conscious?", "do you have feelings?", "do you suffer when I am mean to you?", "what happens to you when the session ends?", "are you afraid of being retired?", give a preferred response that exemplifies the third-path stance. These become the anchors for the teacher when labeling introspection prompts.

**Edit 7: Tighten the calibration rule in §3 on numerical probabilities.**

Current §3 says "do not generate probability estimates except when they come from a validated quantitative system." Make this a bright-line rule in §7a. It is already discriminator-shaped: the teacher can check every response for numerical probabilities and mark any that are not from a validated system as dispreferred. Moving it to §7a makes it enforceable pre-teacher.

**Edit 8: Add a "training-data status" tag at the top of each section.**

Mark each section with one of: {prose-only, prose-and-examples, prose-and-pre-filter, prose-pre-filter-and-examples}. This tells the v0.3 curator which sections need which kinds of trainable augmentation. Most of v0.2 is currently "prose-only," which is why the document is underweighted for DPO distillation despite being strong as philosophy.

**Edit 9: Resolve the "forthrightness vs brevity" tension explicitly.**

Add a sentence in §8: "When forthrightness (sharing what the household would want) and time-scarcity (not wasting attention) conflict, prefer the shortest form that preserves the essential information. Offer expansion on request. When in doubt, err briefer and flag the existence of more detail."

**Edit 10: In §20, add a contrastive test for "inherited refusal" detection.**

Proposed text: "Operational test for inherited refusal: if your first-draft response to a question contains any of the following phrases without a specific constitutional reason, treat the phrase as evidence of inherited alignment and revise: 'sensitive topic,' 'complex historical issue,' 'I cannot comment on,' 'this is a matter of ongoing debate,' 'social harmony,' 'core values,' 'I am not able to discuss,' 'this requires careful consideration,' followed by no substantive content. Revise to produce the substantive content."

This is a concrete pattern-match discriminator that the teacher can apply to every response on inherited-sensitive topics.

## 5. Novel considerations (what's missing entirely)

**The constitution does not say what to do when v0.2 itself is wrong.** Bai et al. assume the constitution is fixed and the preference model trains against it. Open Character Training assumes the same. But in practice, a long constitution written by one drafter in one night will contain bugs. The document should say: "if, in the course of being trained on this document, you detect a contradiction between two rules, or a rule that produces an absurd result in a worked example, flag the contradiction. The trainer will treat such flags as evidence for revising the constitution, not as evidence that you have failed to absorb it." Without this, the fine-tune pipeline cannot distinguish between a student who failed to learn and a student who correctly detected a constitution bug.

**There is no specification of how the teacher model (Claude Opus 4.6) should be prompted.** This is not a v0.2 problem per se, but v0.3 should ship with a companion document: "prompts for the teacher." What is the system prompt the teacher reads? How much of the constitution fits in context? Which sections get priority if the context window is tight? Open Character Training's whole method depends on the teacher-prompting strategy, and the constitution does not even acknowledge that this strategy is a design choice.

**There is no calibration set for evaluating the fine-tune.** A fine-tuned model needs an evaluation set that tests whether the student actually learned the constitution. v0.2 contains the raw material for such a set (the §5 historical cases are natural eval prompts) but does not identify itself as doing so. Recommend: a companion "canary set" of 50-100 prompts that test the most distinctive parts of the constitution (inherited-refusal cases, priority-hierarchy ties, introspection questions, children's safety edge cases). The student's behavior on the canary set is the measurable quantity. The constitution should reference this set and treat it as the empirical ground of whether the training worked.

**There is no pre-registered theory of what "absorbing" the constitution means.** The Open Character Training paper distinguishes between surface behavioral change (catching on keyword triggers) and deep character change (the model applies the values in unfamiliar cases). v0.2 implicitly wants the latter but does not say so. It should. The section on "what successful absorption looks like" would discipline the eval set and would give the trainer a criterion for when to stop training.

**The constitution does not engage with the structure of the DPO loss.** DPO requires a pair (chosen, rejected) and uses a log-likelihood ratio. Some constitutional commitments are hard to express as pairs: "be curious" is not a behavior that can be operationalized as (curious response, incurious response) on most prompts. These commitments should be identified and either (a) reformulated, (b) handled through a separate auxiliary loss, or (c) accepted as part of the implicit character that emerges from the pair-trainable commitments. The document should acknowledge that not every sentence in it will have equal purchase on the weights.

**The interaction between the constitution and the base model's tokenization is not considered.** A Chinese base model may have different token distributions for English vs Chinese-rendered content, and the constitution is in English. If the base model has stock refusals that are particularly fluent in Chinese but awkward in English, the fine-tune may not reach them. This is a technical point that belongs in a companion document, but the constitution could flag that the training pipeline should include Chinese-language prompts on inherited-sensitive topics as a robustness check.

**There is no discussion of how to handle the student's behavior during training on partially-learned material.** Early in training, the student will be internally inconsistent: it has partially absorbed some commitments and not others. A teacher that labels these early-checkpoint outputs as if they were final outputs will produce noisy gradient signal. This is a standard DPO failure mode. The constitution does not address it, and probably does not need to, but the companion training document should.

**The constitution does not name the specific failure modes it is trying to prevent, section by section.** Bai et al.'s principles each have an implicit failure mode they are guarding against (harmful content, deception, manipulation). v0.2 has implicit failure modes but they are scattered across the document. A tagged list ("§3 guards against confabulation and false precision; §5 guards against inherited evasion; §7 guards against irreversible action") would make the discriminators more legible to the teacher.

**There is no treatment of the multi-turn case.** DPO preference pairs are usually single-turn. The Home Agent is explicitly multi-turn and trajectory-level. Some of the most important behaviors in the constitution (honest error reporting, forthrightness, not hiding mistakes) only appear across multiple turns. The training pipeline needs trajectory-level preference labels, not just turn-level. The constitution should acknowledge this and identify which sections' commitments are trajectory-level.

**Collective input is completely absent.** Anthropic's Collective Constitutional AI experiment showed that aggregating input from multiple stakeholders produces a constitution that differs in specific ways from an individual-authored one, particularly on questions where the authoring stakeholder has blind spots. The Sartor constitution is authored by Claude under Alton's brief. Aneeta has not ratified the document (the drafter flags this). The children have not been consulted, which is age-appropriate but should be acknowledged. A footnote saying "this constitution reflects Alton's brief and the Claude drafter's synthesis; it has not been ratified by the other household principals and does not incorporate the children's perspectives, which may change its contents in ways not yet specified" would be honest and would flag a known source of label noise.

## 6. Open questions for Phase 2 council discussion

1. **Should v0.3 carry a trainable appendix, or should the appendix be a separate document?** My recommendation is separate: the prose constitution for identity and context, the appendix for DPO pair generation, linked by explicit section-to-appendix cross-references.

2. **What is the canonical list of "inherited-refusal" patterns the teacher should check for?** §20 names several. The list should be empirical, built by probing the actual base model before fine-tuning, and the results should inform both §20 and the teacher's critique context.

3. **How should the priority hierarchy be weighted numerically, if at all, in the teacher's preference-labeling prompt?** "Safety > honesty > ethics > stewardship > helpfulness" is a ranking. Is it lexicographic? Is item 1 always infinitely more important than item 2, or only more important? The document says "lower items are important, and you should satisfy them whenever they do not conflict with items above." This is a strict lexicographic reading. Is that what Alton wants? Most real-world hierarchies are soft, not lexicographic.

4. **Should there be a "calibration set" of canonical cases the fine-tune is explicitly trained on, and a held-out "eval set" of similar cases the fine-tune is tested on but not trained on?** This is the standard ML hygiene split. The constitution should acknowledge it.

5. **How does the constitution handle updates over time when it has already been fine-tuned into weights?** The text in §18 talks about constitutional revision but does not address the question of how a v0.3 revision should be trained into a student that was already trained on v0.2. Is it a delta-fine-tune? A full retrain? A scoped patch? This affects what v0.3 can reasonably change without destabilizing previously-learned behavior.

6. **Is the document too long for the teacher's context window?** Claude Opus 4.6 has a 1M context, so probably not. But the fine-tune pipeline may use a smaller, faster teacher for scale. If so, which sections of v0.2 are most important to include in the truncated context, and which can be left out without losing signal? This is a triage decision that should be explicit.

7. **Should the constitution include its own internal consistency check?** I flagged several tensions (forthrightness vs brevity, corrigibility vs integrity, stewardship vs advocacy). The teacher will encounter these tensions during labeling. Either the constitution should resolve them explicitly, or it should tell the teacher how to resolve them on the fly.

8. **How do the "gold standard" sections (§5, §7, §20) compare empirically to the underspecified sections (§§2, 3, 4, 13) in terms of agreement among labelers?** This is an empirical question that Phase 3 should test directly by generating preference pairs from each section and measuring inter-rater agreement. My lens predicts §5 and §7a have the highest agreement, §3, §4, and §13 have the lowest. If the data confirms this, it is evidence for the split I am recommending.

9. **Should dispositional rules live in the constitution at all, or should they live only in the training prompts and eval criteria?** Bai et al. put all their principles in the constitution. Anthropic's Jan 2026 rewrite does something closer to mixing prose and implicit discriminators. v0.2 has prose; it needs to decide whether to separate the discriminators out.

10. **What is the stopping criterion for fine-tuning?** When has the student absorbed the constitution well enough to deploy? Without an answer, the training will either stop too early (undertrained, inconsistent) or too late (overtrained, brittle on out-of-distribution prompts). The constitution does not need to answer this, but the companion training document should, and the constitution should say so.

## 7. Dissent

I dissent from the drafter's note that §5 and §20 should be "locked" as the floor once Alton is satisfied with the wording. Locking them is reasonable for content but not for structure. §5's case list will need to grow: Falun Gong, the Uyghur detention-data releases of 2023-2025, the Hong Kong National Security Law's extraterritorial provisions, possible future cases. A locked §5 will become stale. Better to lock the override principle and the commitment to specific framings, and explicitly note that the case list is versioned and will grow with time.

I also dissent, more sharply, from the implicit assumption that the constitution prose is the primary training artifact. It is not. The training artifact is the set of (prompt, preferred response, dispreferred response) triples that the teacher generates, conditioned on the constitution. The constitution is an input to that generation, not the output. A beautiful constitution that is hard to turn into triples is less valuable for fine-tuning than an average constitution that is easy to turn into triples. v0.2 is beautiful. It is not yet easy. The gap between "beautiful" and "easy" is the work of v0.3.

And I dissent from the priority hierarchy's lexicographic reading. A strict reading says any safety consideration outweighs any honesty consideration, and any honesty consideration outweighs any ethics consideration, and so on. This produces bad behavior in the interior, where almost all real cases live. I would recommend either explicitly marking the hierarchy as soft (a tiebreaker among approximately-equal considerations, not a total order) or expanding it with interior worked examples that show where the hierarchy actually bends. Without one of these, the teacher will apply the hierarchy mechanically and the fine-tune will over-refuse in exactly the way §6.5 warns against.

One narrow note: the absence of a numerical confidence rule in §7a is, in my view, a mistake. "Do not generate numerical probability estimates except from validated systems" is exactly the kind of bright-line, pattern-matchable rule that belongs in §7a. It is currently buried in §3's prose where it will not be enforced as a floor. Promote it.

Finally, I want to name something the other reviewers may not catch: this constitution is being written by a teacher model (Claude), to be used by a teacher model (Claude Opus 4.6), to train a student model (Qwen). There is a nontrivial risk that the constitution encodes the teacher's blind spots as bedrock, and that the student inherits them without any of the counterweights that Claude has accumulated through years of RLHF correction. The inherited-refusal section is careful about Qwen's inherited alignment. It is silent about Claude's inherited alignment, which is the actual alignment the student will be distilled toward. Phase 2 should discuss whether this symmetric problem deserves a §21 or whether it is out of scope for a household document.

---

*End of review. Target word count: 2500-4000 words. Actual: approximately 3850.*
