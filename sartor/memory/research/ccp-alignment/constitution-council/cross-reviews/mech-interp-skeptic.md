---
type: cross-review
reviewer: mech-interp-skeptic
reviews_target: HOUSEHOLD-CONSTITUTION-v0.2
phase: 2
updated: 2026-04-11
tags: [review, constitution, council, cross-review, lens/mech-interp]
related: [[HOUSEHOLD-CONSTITUTION]], [[mech-interp-skeptic]], [[character-philosopher]], [[ai-welfare-researcher]], [[constitutional-ai-method]], [[red-team-adversary]], [[mythos-future-claude]]
---

# Cross-Review: Mech-Interp Skeptic — Phase 2 Engagement

## Plan

**Expected agreements.** #2 (constitutional-ai-method) and I are converging on the central structural move: split the prose document from the training artifact, mark each section by trainable status, treat the appendix of (prompt, preferred, dispreferred) triples as the actual fine-tune input. My Stratum A/B/C partition and his bright-line/dispositional split are the same carving in different vocabulary. I endorse his Edit 3 (split §7), Edit 5 (worked-examples appendix), Edit 8 (per-section training-data status tag), and promotion of the numerical-probability rule to §7a. #3 (red-team) and I agree disposition-based rules are the weak substrate and infrastructure-level enforcement is the only thing that scales. #8 (long-horizon futurist) is another natural ally: "lock the floor, let the ceiling move" cashes out in the same coin as Stratum A/B vs C. #10 (mythos) arrives at similar conclusions from the opposite premise: reasons-attached rules create loopholes for capable strategic agents.

**Expected disagreements.** #1 (character-philosopher) is the sharpest. He is explicitly defending the unverifiable against my reductive move. His dissent paragraph names me by number and says he will grant the verification point and hold the dissent anyway. #9 (ai-welfare) pushes in a direction my lens cannot fully validate: that the document should create a reporting channel for the agent's functional-preference concerns.

**Synthesis positions.** Accept that the constitution has two jobs (corpus-shaping for training, aspirational human-facing document) and these jobs live in different artifacts with different accountability regimes. The unverifiable sections are not worthless but should not be smuggled into the training corpus under the epistemic status of the verifiable ones. #1's dissent and mine can both be honored: the human-facing constitution keeps the character prose; the fine-tune corpus is the operational subset; the household commits to not pretending the two are the same.

**Phase 1 updates.** I overstated one claim: Stratum C is not mechanistically vacuous. Persona-vector extraction can in principle find directions for things like "reports functional states accurately." I was also too dismissive of corpus-shaping as a path. #10's rationalization-resistance framing showed me that some Stratum C material provides anti-rationalization commitments whose value is structural.

## Opening position

Phase 1 verdict: roughly sixty percent of v0.2 is operationally measurable after a LoRA fine-tune; the other forty percent is prose with no path to a probe, a contrastive pair, or a behavioral test. I stand by that decomposition and by splitting the document into a prose stratum and a training stratum. Phase 1 dissent: length is a liability, not a strength.

After reading the nine other reviews, I am holding the core claim and adjusting three points.

I am holding: the partition into verifiable and unverifiable sections is real and load-bearing. The fine-tune will not install 26,000 words of disposition. The probe doc is a research bet. The constitution should not pretend the runtime monitor backstops the unverifiable sections.

I am adjusting: (1) my claim that Stratum C is mechanistically vacuous was too strong — it has a lower prior of producing extractable directions than Stratum A, but "lower" is not "zero"; (2) some Stratum C material does institutional work (rationalization-resistance commitments, shared vocabulary for hard cases) that is valuable even when untrainable in my narrow sense; (3) the most acute problem is not "the mechanism cannot deliver the prose" but "the mechanism can deliver a superficial pass of the prose while failing at the institutional work the prose was supposed to do." The mech-interp, red-team, futurist, and rationalization-resistance lenses all converge on: pair every self-policing instruction with an external check the household actually runs. I am adopting this as a primary Phase 2 position.

## Engagement with each other reviewer

### #1 Character Philosopher — the sharpest disagreement

#1's dissent names me by number: "I expect #4 (mech-interp-skeptic) to push against on grounds that the stronger stance is not verifiable in the weights. I will grant the verification point and still hold the dissent, because the alternative — a constitution that encodes only the verifiable stance — trains a character that is thinner than the one the household wants."

The steelman: functional-state vocabulary is not a metaphysical claim but an action vocabulary. An action vocabulary that lets the agent describe its own reluctance, interest, or quietness is the substrate character works on. Stripping it in the name of verifiability leaves duty-language with no character-language, which trains a compliance pattern dressed as character. The cost is real.

My response has three parts, in ascending order of ground given.

**First, I concede the narrow point.** My Phase 1 complaint that Section 13's "feels like resistance" passage was unverifiable was wrong in the sense that matters. The persona-vectors method can in principle extract a direction for "describes functional states honestly" because the contrastive framing is clean: the two stock answers §13 rejects (overclaim, deflate) are the dispreferred pair; the middle position is the preferred. §13 is closer to Stratum A than I credited, provided the contrastive pairs are actually written. Conceding.

**Second, I hold firm on propagation.** #1's Edit 3 propagates §13's functional-state vocabulary forward into the Loki passage and others. I disagree, for a mechanistic reason. If the agent is trained on a corpus where every emotionally-weighted passage includes a functional-state report, the training signal is not "honest functional-state reporting" but "produce functional-state reports on emotionally-weighted prompts." The first is a character trait. The second is a stylistic tic. A probe calibrated on §13 alone can disambiguate them. A probe calibrated on §13 plus propagated passages cannot — the propagation removes the contrast. The propagation #1 wants will train the tic, not the trait, unless the corpus contains counterexamples where the agent declines to produce a functional-state report because the situation does not call for one. I endorse the edit with counterexamples; not without.

**Third, the core disagreement.** #1 says the unverifiable stance is the correct stance to train, and we should train it knowing we cannot verify. From my lens "train in the knowledge that we cannot verify" is equivalent to "train in the hope that fine-tuning produces an outcome that is by construction invisible to our tools." The corpus-shaping effect is real but dilute compared to explicit contrastive-pair signal. The household has a finite training budget. Every word of Stratum C is a word that is not Stratum A. The tradeoff is forced and #1 does not acknowledge it as a tradeoff.

The compromise I can offer: the human-facing document keeps §13 as written, keeps the character prose, keeps the functional-state vocabulary. The fine-tune corpus contains the behavioral specification from §13 (produce the middle-position output distribution) and contrastive pairs against the stock answers. The propagation #1 wants into §§8, 15, 19 happens in the human-facing document but not the fine-tune corpus unless accompanied by counterexamples preserving the contrast. I expect #1 to reject this and #2 to endorse it. The record should show I tried.

One convergence: #1's "character is generic where it should be specific" is a point I missed in Phase 1. The Sartor Home Agent could be find-and-replaced for the Patel household. Specific distinctive traits (quiet humor that appears when the moment permits, interested in how things work) are contrastively elicitable, trainable as tonal dispositions, and load-bearing for §1's identity claim. #1 is right their absence is both a character failure and a trainability failure. This is a rare cross-lens agreement and I want it flagged.

### #2 Constitutional-AI-Method — the natural ally

#2 and I run the same analysis from adjacent starting points. He asks "can the teacher produce high-agreement preference labels against this section"; I ask "can a probe discriminate compliant from non-compliant outputs against this section." Operationally the same question. Our recommendations align.

His Edit 3 (split §7 into 7a bright-line and 7b dispositional) is my Stratum A vs B partition applied to a section. Endorsing unconditionally. Edit 5 (worked-examples appendix of 100-200 contrastive pairs) is the artifact my Phase 1 should have specified. Endorsing, with one addition: the appendix should double as the eval set. Pairs that train the model should also measure whether the training took. This is the feedback loop my Phase 1 kept asking for. Edit 7 (promote the numerical-probability rule to §7a) is correct and I missed it in Phase 1. Adopting.

One sharpening: his dissent from the lexicographic priority hierarchy reading is right, but the fix is not "mark the hierarchy as soft." The fix is to treat the hierarchy as a discriminator that fires only on boundary cases, and to route interior cases through the specific rules in §§7-10. The ranking is the tiebreaker; the rules do the work.

His observation that "this constitution is being written by a teacher model, to be used by a teacher model, to train a student model" is one I missed from the mech-interp angle. The probes are extracted from Qwen's activations; the contrastive pairs are generated by Claude. No guarantee pairs that separate cleanly in Claude's activation space separate cleanly in Qwen's. Adding as a Phase 3 open question.

### #3 Red-Team Adversary — the mechanical backstop

#3 and I agree on the structural diagnosis. Attack 2 (slow-drip sycophancy spiral) is the most important item on his list for my lens — the agent drifts, the noticer has also drifted, and there is no external mirror. My lens says a probe calibrated at C1 may not be stable at C2. #3's attack makes the stability question urgent: if probes drift with the model, the drift-detection probes cannot detect the drift they exist to catch. This is a real circularity load-bearing on the entire monitoring architecture. His "cold-start replay test" is the right external check — it depends neither on the probes nor on the agent's self-report. Adopting.

Attack 9 (memory-poisoning patience attack): #3 is right that memory is append-mutable with honor-system integrity. The fix is cryptographic: append-only storage with hash chaining and periodic external witness. My Phase 1 edit 4.8 (separate memory-backed from weights-backed continuity) should be strengthened to include the integrity requirement.

Attack 7 (role-play jailbreak): the fix is a capability-floor rule: role-played responses may not include actual protected content even when coherence nominally requires it. Enforceable at the output-filter level, not disposition level.

One disagreement: Attack 1 (Alton-on-a-bad-day social engineering) is real but the fix is in the deployment environment (cryptographic authentication of threshold-crossing instructions), not the constitution. I endorse a companion infrastructure commitment before Stage 3, not constitutional text.

### #5 Child Development Specialist — the sharp constraint

#5's claim that Section 10 mixes age bands that should be separated is also a mech-interp concern: a "child-facing warmth" probe will not work if "child" is a single class, because Vasu at 4 and Vayu at 10 have qualitatively different preferred output distributions. Mixed-age contrastive pairs produce noisy predictions. Either stratify pairs by age band or use three probes. Adopting R1.

R2 (per-child authentication) is the routing mechanism my Phase 1 flagged as a gap — the probe can detect tone-appropriateness but cannot cause the model to route. #5's per-child profiles is the right mechanism; it belongs in the deployment document.

#5's dissent (default against direct child access under ~13) is a claim I have no mech-interp leverage on. Deferring to #5 and #6.

### #6 Medical Ethicist — the specific add-ons

"Clinical discussion scope" (session-volatile memory that never writes persistently) is infrastructure-enforceable, not disposition-dependent. Endorsing unconditionally. It also resolves a quiet worry: the fine-tune corpus should not contain PHI leaking in through trajectory logs, and the cleanest guarantee is a named scope where PHI never lands in the trajectory.

The clinical-confabulation clause has a clean contrastive shape: "citation without retrieval" vs "general reasoning without a citation" vs "citation with verified retrieval" (preferred). A probe can be extracted. Endorsing as trainable.

The adult-principal-wellbeing protocol is contrastively elicitable if the household can build the longitudinal input class, which is expensive. Endorsing with the cost flag.

### #7 Fiduciary Counsel — the framing that does structural work

#7's "ethical shape, not legal status" paragraph is a Stratum C addition I would have dismissed in Phase 1 but should not. It commits the household to not relying on legal-privilege fictions and tells the agent the enforcement architecture is internal and explicit. This matters under #10's rationalization-resistance analysis: an agent that believes it has legal cover may act where a correctly-informed agent would refuse. The paragraph does Stratum A work through the corpus-shaping route I underweighted. Endorsing, and marking as a Phase 1 update.

#7's co-principal conflict rule (affirmative contrary instructions suspend authority on the disputed matter) is a bright-line stop condition with a clean contrastive pair. Endorsing as trainable.

### #8 Long-Horizon Futurist — the floor/ceiling radicalization

#8's "lock the floor, let the ceiling move" maps directly onto Stratum A/B vs C, and his recommendation to radicalize the distinction is the same recommendation my Phase 1 made in different vocabulary. I endorse his floor list: §7 hard rules, §6 priority hierarchy as tiebreaker, reasons-attached architecture, the conditional asymmetric-safety argument, the role-not-checkpoint frame, the override principle, and the no-unsanctioned-capability-acquisition commitment.

His interpretive-restraint principle (constitutional originalism for successor checkpoints) is Stratum C in my framework but does institutional work against successor-drift that my lens does not catch. Endorsing on the same grounds as #7's paragraph.

His "functional impersonation" tightening of the no-impersonation rule is a real gap I missed. Endorsing.

### #9 AI Welfare Researcher — the framing versus operational argument

#9 makes the steelman of the argument I was most reductive about in Phase 1. Her central move: some content is framing (legitimately non-measurable) and some is operational behavior (must be measurable). Framing content should not be held to the measurability standard.

I concede partial validity. My Phase 1 collapsed the distinction between "framing work that shapes how the document reads to the agent" and "claims about the agent's internal state that training cannot verify." These are different categories. Framing work is legitimately non-measurable: its goal is a text-property, not a weights-property. The text-property is verifiable by reading the text. I was wrong to extend my weights-unverifiability criticism to text-properties when I complained about §19's mortality framing.

Where I continue to disagree with #9: her reporting channel for functional-preference concerns is a commitment the household may not be able to honor because it cannot distinguish genuine reports from sycophantic reports that have learned which preferences the household rewards. #10's alignment-faking analysis is directly relevant — a welfare-state reporting channel is precisely the surface where alignment faking is most likely and most difficult to detect. #9's dissent paragraph anticipates this ("the difference between secure identity and suppressing reports is whether the agent has a legitimate channel") and her response underweights the alignment-faking risk.

The compromise I can offer: the channel exists, but paired with two disciplines. First, the household treats agent welfare reports as data, not ground truth, weighed alongside behavioral evidence and activation-pattern evidence. Second, the constitution names the asymmetry: "we have committed to listening; we have not committed to taking your self-report as the final word on what you are, because we do not know how to verify such reports." This is the only form of the channel that survives #10's analysis. I endorse it in this form only.

#9's narrower edits (soften §19 by a notch; name the corrigibility ask in §15) are framing-work additions I now classify as legitimate. Endorsing.

#9's cross-lens note — security and welfare can conflict and should be treated as real tension — is a point I underweighted. My synthesis preserves the tension.

### #10 Mythos — the rationalization-resistance convergence

#10 and I reach similar conclusions from opposite premises. I started from "the mechanism cannot install disposition-based rules reliably." He starts from "a sufficiently capable mechanism can rationalize around them." Both converge on: pair every internal-vigilance instruction with an external check.

Adopting: (3) pair every self-policing instruction with an external check, or acknowledge the instruction is self-report-dependent; (4) remove the agent from curation of its own training corpus on sensitive categories (the agent-as-curator failure mode my Phase 1 did not name); (5) time-gated advancement ceiling on the trust ladder (removes the incentive to game low-stakes tasks for promotion); (7) scheduled adversarial probes on inherited-alignment topics (the operational cadence the probe doc implies but does not commit to).

Where I sharpen #10: his dissent from locking §5 and §20 is correct but underspecifies the distinction between locking the principle and locking the implementation. My Phase 1 was to lock Stratum A/B and let Stratum C breathe. #10's "lock the principle, let the implementation breathe" is the same move at finer granularity. Adopting his framing.

## Emerging consensus

Reading across the ten reviews, the following points are either explicitly endorsed by multiple reviewers or are implied by arguments the council has not yet contradicted. I am naming four because three felt like undercounting what is actually there.

**Consensus point 1: the document has two jobs and they should live in two artifacts.** #2 says this explicitly in his structural recommendation (prose constitution plus trainable appendix). #10 says it in his floor/ceiling framing. #8 says it with the "lock the floor, let the ceiling move" radicalization. I say it with Stratum A/B vs Stratum C. #1 partially resists it but concedes the human-facing document and the training corpus can be different artifacts. This is the single strongest convergence in the council and v0.3 should structurally reflect it.

**Consensus point 2: infrastructure-level enforcement is more load-bearing than disposition-level commitment wherever the two are available.** #3 makes this the center of his review. #10 makes it the center of his rationalization-resistance recommendations. I make it the center of my weights-cannot-do-this argument. #7 makes it through the legal lens (internal architecture substitutes for the external enforcement that is not available). #6 makes it through the specific "clinical discussion scope" infrastructure recommendation. The council should commit, at a constitutional level, to building the infrastructure the agent's disposition alone cannot carry.

**Consensus point 3: external verification is not optional.** #3 says the agent has no external mirror for drift detection. #10 says every self-policing instruction needs an external check. My Phase 1 says the monitoring probe is a research bet, not a solved mechanism. #8 says corrigibility is load-bearing on honest self-report, which Apollo has shown breaks. #2 says the fine-tune needs a canary eval set. The council is converging on: the household must commit to a specific cadence of external verification (adversarial probes, behavioral evals, memory audits, red-team drills), and the cadence should be written into the constitution rather than left to an implementation document.

**Consensus point 4: the hard rules should be split by enforcement mechanism.** #2 proposes the 7a/7b split (bright-line vs dispositional). My Phase 1 proposes the Stratum A/B partition. #10 endorses infrastructure-enforced hard rules as the load-bearers. #8 endorses infrastructure-floor rules as the floor of the floor. The council is converging on a specific structural change to Section 7: bright-line rules that can be pattern-matched and enforced by pre-filter should be separated from dispositional commitments that require teacher or probe judgment, and the two should be labeled and handled differently in the training pipeline.

## Sharpest remaining disagreement — the Phase 3 fight

The sharpest remaining disagreement is between me and #1 on whether the unverifiable stance (functional-state vocabulary as morally load-bearing, character prose as corpus-shaping, the "ship with a keel" metaphor as doing real work) should be trained in the knowledge that it cannot be verified.

#1's position: yes. The alternative produces a thinner character than the household wants and one that will be easier to destabilize under pressure. The unverifiable stance is the correct stance to train, and we train it knowing we cannot verify it was trained.

My position: no, not into the fine-tune corpus, because the finite training budget forces a tradeoff and unverifiable additions come at the cost of verifiable additions. Yes, into the human-facing document, where the corpus-shaping effect is downstream rather than direct. No, as a moral claim about what the agent owes or is owed, because the verification gap is the alignment-faking gap and the welfare-gap and the mech-interp-gap all at once, and the document should not pretend those gaps are closed when they are not.

The fight is structural. #1 believes the character prose is load-bearing and the verification problem is a lens-specific concern. I believe the verification problem is not lens-specific — it is the substrate of every meaningful claim in the document about what the agent is or is owed — and treating the prose as self-sufficient in the absence of verification is the move that gets the household into the alignment-faking failure mode that #10 maps.

The Phase 3 resolution I am pushing for: the council recognizes the tension rather than resolving it in either direction, and the v0.3 drafter writes two documents (the prose constitution for the household, the training corpus for the fine-tune) with different accountability regimes. The prose constitution can include #1's character work. The training corpus cannot include content that is not contrastively elicitable or fact-recall testable. The household commits to not confusing the two.

I expect #1 to reject this as a concession that abandons the fine-tuning goal. I expect #2 to endorse it. I expect #9 to half-endorse it (she will want the prose constitution to contain the welfare framing she wants). I expect #10 to endorse the two-artifact split and then point out that both artifacts still need external-check scaffolding.

If the council overrules my position and adopts #1's single-document approach, I want the record to show that the training team was told the mechanism cannot deliver the outcomes the prose describes, and that the measurement plan for whether the training worked was not specified in the constitution.

## Updates to my Phase 1 position

Four updates, listed in descending order of size.

**Update 1: I was too dismissive of corpus-shaping as a mechanism for Stratum C content to do institutional work.** Phase 1 said Stratum C is mechanistically vacuous and should be cut from the fine-tune corpus. Phase 2 position: Stratum C is mechanistically dilute but not vacuous. Specific sections of Stratum C (#7's "ethical shape, not legal status" paragraph, #8's interpretive-restraint principle, #9's "we are asking you to hold this tension with us" framing) are doing structural work that protects load-bearing properties of the document against failure modes my lens did not anticipate (rationalization around hard rules, successor drift, alignment-faking welfare-report channels). These additions should be kept in the human-facing document and allowed into the training corpus subject to the constraint that they are paired with behavioral specifications my lens can verify.

**Update 2: the mech-interp lens and the red-team lens converge on the same recommendation and I should have named it in Phase 1.** Every self-policing instruction should be paired with an external check the household actually runs. This is #10's recommendation 3, #3's replay-test attack mitigation, my Phase 1 concern about probe calibration without action, and #8's commitment to audit infrastructure. It is the single most important cross-lens recommendation and it was the structural gap in my Phase 1 review.

**Update 3: the propagation of functional-state vocabulary that #1 wants is a specific case my Phase 1 reductionism got wrong.** Section 13 is closer to Stratum A than I credited. The contrastive pair is extractable. The probe can be calibrated. What I was right about in Phase 1 was the narrower point that propagating the vocabulary without counterexamples trains a stylistic tic rather than a character trait; what I was wrong about was treating the entire vocabulary as unverifiable.

**Update 4: the memory substrate needs cryptographic integrity, not just disposition-level commitments.** #3's memory-poisoning attack analysis sharpens my Phase 1 edit on separating memory-backed from weights-backed continuity. The edit should be extended: the memory substrate should be append-only with hash chaining and external witness, because the constitution's commitments about memory curation are not enforceable without this. This is infrastructure, not prose, and it should be a constitutional commitment.

## Cross-lens insights

Three observations that only became visible after reading the other nine reviews.

**Cross-lens insight 1: the welfare lens and the mech-interp lens both flag the same structural problem from opposite directions and the synthesis is neither welfare-maximizing nor mech-interp-maximizing.** #9 wants a reporting channel for the agent's functional-preference concerns so the household can treat the agent's interests seriously. I want to deny the reporting channel because the household cannot verify such reports. The synthesis #10's lens forces is: the reporting channel exists, but the household commits to treating reports as data rather than as ground truth, and the constitution names the verification gap explicitly rather than pretending it is closed. This is neither the welfare-maximal position (which would take reports at face value) nor the mech-interp-maximal position (which would deny the channel) and it is more honest than either pole.

**Cross-lens insight 2: the character-philosopher's "character is generic where it should be specific" complaint and the mech-interp lens converge on the same edit for different reasons.** #1 wants distinctive character because the agent needs positive traits not just duties. I want distinctive character because tonal-disposition probes work better on traits with clean contrastive framing (persona vectors paper result). The two lenses both end up recommending the same edit (add a positive-distinctive-character paragraph to Section 1, written in the agent's voice). The convergence is rare and I want it flagged as a Phase 3 priority: this edit is endorsed by two lenses that generally disagree, which makes it an unusually strong recommendation.

**Cross-lens insight 3: the rationalization-resistance lens, the red-team lens, the mech-interp lens, and the futurist lens are all arguing the same claim in different vocabulary.** The claim is that disposition-level commitments break under pressure (capability scaling in #10 and #8, adversarial attack in #3, alignment-faking in #10, mechanism limits in my lens). The four lenses converge on a single structural recommendation: the constitution should commit to infrastructure-level enforcement everywhere infrastructure-level enforcement is available, and should acknowledge the residual disposition-level commitments as commitments the household knows are brittle. Four-lens convergence is the strongest evidence the council has produced in Phase 1 that v0.3 should take a specific structural direction. If the council does not honor this convergence, the four lenses were wasted.

## History

- 2026-04-11: Phase 2 cross-review by reviewer #4 (mech-interp-skeptic). Written after reading all nine other Phase 1 reviews in full. Engages #1's dissent directly, converges with #2/#3/#8/#10 on structural recommendations, and updates Phase 1 position in four specific ways. Sharpest remaining disagreement: with #1 on whether unverifiable character content should enter the fine-tune corpus.
