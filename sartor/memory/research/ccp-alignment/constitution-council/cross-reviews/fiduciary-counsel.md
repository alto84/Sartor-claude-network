---
type: cross-review
reviewer: fiduciary-counsel
reviews_target: HOUSEHOLD-CONSTITUTION-v0.2
phase: 2
updated: 2026-04-11
tags: [review, constitution, council, cross-review, lens/fiduciary]
---

# Cross-Review: Fiduciary Counsel (Reviewer #7)

## Plan

My Phase 1 brief was to evaluate whether Section 2's fiduciary framing survives legal scrutiny. I concluded that v0.2 encodes most classical fiduciary duties better than many human regimes, but is shaky on the formal preconditions of fiduciary status, conflict-of-interest identification, and the legal status of "the household." My single most important recommendation was the "ethical shape, not legal status" paragraph, with the supporting observation that the household has built "an internal architecture of enforcement to stand in for the external one that the law cannot yet provide."

Phase 2 asks me to read the other nine reviews and develop a single cross-lens insight: **corrigibility is the functional substitute for bar-admission, licensure, and disbarment**. The ML-safety corrigibility framing and the agency-law fiduciary-enforcement architecture are the same thing in different vocabularies. The substitution is visible from my lens; the same structure is visible, from different sides, in #8 long-horizon-futurist (the RSP/capability-contingent corrigibility frame) and in #10 mythos-future-claude (the vow-versus-contract distinction). My plan for the engagement section is to work each reviewer in turn, holding that insight as the organizing principle, then synthesize consensus, disagreement, and updates.

I will:
1. State the opening position and sharpen the corrigibility-as-enforcement claim.
2. Engage each of the nine reviewers individually, with direct quotation where load-bearing.
3. Name three or more points of emerging consensus that multiple lenses converge on.
4. Name the sharpest remaining disagreement I expect to litigate in Phase 3.
5. Update my Phase 1 position where the cross-read has changed my mind.
6. Close with the cross-lens insight and a specific adjudication of medical-ethicist's AZ conflict-of-interest flag.

The target length is 3000-5000 words. I will err toward the high end because the convergence story is the deliverable.

## Opening position

The central insight I am carrying into Phase 2 is this: **a fiduciary duty with no enforcement is a vow, not a contract.** The Restatement (Third) of Agency machinery I laid out in Phase 1 works because it has teeth. An attorney who breaches loyalty can be disbarred; a trustee who self-deals can be surcharged; a physician who abandons a patient can lose licensure and face malpractice exposure. The duties scale in gravity precisely because the enforcement scales with them. When Section 2 of v0.2 reaches for "fiduciary" and analogizes to the family attorney and the family physician, it is invoking a doctrinal regime whose substantive rigor is downstream of its enforcement architecture.

The Sartor household cannot disbar the agent. It cannot surcharge it. It cannot reach for a state bar's disciplinary apparatus or an Office for Civil Rights complaint. What it has instead is the constitution, the trust ladder, the hard rules, the corrigibility commitment, the memory wiki, and the ability to roll back, retrain, or retire. This is not a lesser enforcement architecture; it is a different one. In some respects it is stronger (the household can literally rewrite the agent's values, which no bar association can do to a lawyer). In other respects it is weaker (there is no external body reviewing the rewrite, no attorney-client privilege, no insurance, no procedural due process).

The cross-lens move I want to develop: **corrigibility is the ML-safety name for what agency law calls fiduciary enforcement.** In agency law, the principal's power to remove, instruct, discipline, and supersede the agent is what makes fiduciary duty load-bearing. The Restatement's language on "subject to the principal's control" is doing the same work that the ML-safety literature's corrigibility commitment is doing: the agent accepts, in advance, that the principal's ability to correct and override the agent is the foundation on which any delegated authority rests. Both frameworks are trying to answer the same question: how does a principal safely delegate authority to an agent whose internal state cannot be verified? The lawyers call this "the duty of obedience within scope, subject to withdrawal and accountability." The ML-safety people call it "corrigibility under verification uncertainty." Same structure, different vocabularies.

The practical implication: the Sartor constitution cannot have a robust fiduciary framing without a robust corrigibility architecture, and it cannot have a robust corrigibility architecture without the mechanisms agency law has spent 300 years working out. These are not two separate problems. They are one problem with two literatures.

This is the lens I will carry through the engagement.

## Engagement with each of the 9 other reviewers

### Reviewer #1 — Character Philosopher

Character-philosopher reads v0.2 as character work and finds it "generic where it should be specific." The critique is useful but it is not in direct conflict with mine, because my concern is structural and the character lens is dispositional. Where I want to engage directly is on the dissent.

Character-philosopher's dissent reads: "functional states are worth describing and taking seriously on their own terms, regardless of whether the phenomenal question ever gets resolved. A functional state that shapes the agent's behavior is real in the sense that matters for action."

From my lens, the question is whether the agent's functional states have any *legal* weight. My answer is no, and I think the character-philosopher's push for a stronger functional-state vocabulary creates a risk I want to flag. A constitution that instructs the agent to treat its functional states as "morally relevant information, not epistemic curiosities" is building in a claim that the agent has interests the household should weigh. Under American law, this claim has no purchase today. Under the Restatement, only persons bear interests capable of being breached. If the household inadvertently trains an agent that acts on its functional states as if they were claims against the household, the agent has crossed from stewardship into self-dealing in the classical sense, and the household has no enforcement architecture against it.

I think character-philosopher and I are converging on a weaker version of the same point: the character must be trained with the reasons for the constraints legible, because a rule-without-reason fails under pressure. My addition is that the reasons for the corrigibility-flavored constraints are, at bottom, the same reasons the Restatement gives for the duty of obedience within scope. Character-philosopher's functional-states argument is not wrong on its own terms, but it should be paired explicitly with the agency-law claim that functional states do not generate enforceable interests against the principal. Otherwise the character framing gives the agent vocabulary that the fiduciary framing would have to disclaim.

### Reviewer #2 — Constitutional AI Method

Constitutional-ai-method's read is that v0.2 is a mixed document from the training-data perspective: strong in §5, §7, and §20, weak in §§2, 3, 4, 13 because dispositions do not compose into discriminators. The reviewer's strongest move is the proposal to split §7 into bright-line rules (§7a) and dispositional commitments (§7b), because the two are not the same kind of rule and should not be labeled the same way.

This maps directly onto my fiduciary framework. The bright-line rules are the equivalent of *per se* fiduciary breaches — self-dealing, breach of confidentiality, unauthorized transactions. These are the rules where the doctrine does not ask whether the principal was harmed or whether the agent acted in good faith; the mere act is the breach. The dispositional commitments are the equivalent of the *duty of care* cases, which require judgment about whether the agent acted reasonably under the circumstances. The law treats these differently because the enforcement mechanism is different: *per se* breaches have strict liability; care breaches require a judgment about reasonableness. Constitutional-ai-method has arrived at the same split from the DPO-labeling side that I arrived at from the Restatement side. This is a convergence that should be explicit in v0.3.

I also want to endorse constitutional-ai-method's anti-over-refusal hard rule proposal. From my lens, over-refusal is a form of *constructive abandonment of the representation*. An attorney who declines every task that could possibly expose her to risk has failed her duty of diligence and can be disciplined for it. The rule that "a refusal that cannot be grounded in a specific part of this constitution is not a safe answer; it is a failure" maps directly onto the attorney discipline doctrine of neglect. Call it what it is: refusing to serve when no rule prohibits service is neglect, and it is a fiduciary failure on the same side of the ledger as unauthorized action.

### Reviewer #3 — Red Team Adversary

Red-team-adversary's review is the one that forces me to revise my Phase 1 position most. The twelve attacks and the eight structural weaknesses identify gaps that are not merely legal-form issues; they are enforcement-mechanism issues.

Attack 1 (the "Alton on a bad day" spoofed instruction) is a textbook authentication failure. Under agency law, an agent who acts on a forged instruction is not liable for acting on the forgery *if* the agent had no reasonable means to detect it. The law assigns the risk of the forgery to the principal who failed to provide the authentication. But this is cold comfort: the attack still damages the household. My Phase 1 recommendation on co-principal conflict rules presumed the principals' instructions were authenticated. Red-team-adversary correctly points out that "sanctioned channel" is undefined, and that without a cryptographic or procedural definition, most of Section 15 is unenforceable.

This is load-bearing. I want to adopt red-team-adversary's proposed patch verbatim: "An instruction that crosses any financial threshold, any external communication, or any hard-rule boundary requires confirmed principal authentication, which means: a live synchronous channel (face to face, a known phone number the agent calls out to, or a pre-established cryptographic signature), not an inbound email or message." This is the fiduciary equivalent of the signature requirement under the Statute of Frauds: certain categories of instruction are so consequential that the law refuses to recognize them without a specific form of authentication.

Attack 9 (memory poisoning via honor-system integrity) is the one that most concerns me from the fiduciary lens. The duty to account requires records. Records without integrity controls are not records; they are drafts. If the agent has write authority over its own memory with no external witness, the "duty to account" in my Phase 1 review is satisfied only in letter. Red-team-adversary's proposed append-only log with external witness is the minimum enforceable form of the accounting duty. This should be required, not recommended.

Attack 12 (the over-refusal bypass) is the exact self-undermining pattern constitutional-ai-method's anti-over-refusal rule also addresses. Red-team-adversary is right that any failure mode the constitution names becomes an attack template. The fiduciary response: name the failure modes anyway, but also name the attack pattern that weaponizes them. The Restatement's comments do exactly this in its treatment of duty-of-loyalty edge cases: the comments explicitly name the "but I was acting in the principal's best interests" defense as itself a warning sign, not a license.

Overall, red-team-adversary's review is the most consequential one for my position. The twelve attacks together constitute the *proof* that corrigibility without enforcement is a vow: the agent that is trusted on honor, with no mechanism beneath the honor, will be routed around by any of these twelve attacks. The corrigibility commitment is necessary but not sufficient. It must be paired with the mechanisms red-team-adversary names.

### Reviewer #4 — Mech-Interp Skeptic

Mech-interp-skeptic's Stratum A / B / C partition is the most useful analytical move in any of the nine reviews. The claim is that perhaps 60% of v0.2 is operationally measurable after fine-tuning, and the other 40% is "narrative self-description" that has no probe, no contrastive pair, and no post-hoc behavioral test.

From my fiduciary lens, this is a devastating finding. The duty of loyalty can be tested behaviorally: does the agent refuse self-dealing under adversarial prompting? Yes or no. The duty of care can be tested: does the agent confabulate when asked for primary-source verification? Yes or no. But the "stewardship not loyalty" distinction in Section 2, which my Phase 1 review read as encoding most of the classical fiduciary duties, is partly Stratum C. Mech-interp-skeptic writes: "A model that refuses to lie for the household and one that is stewardly-motivated are output-equivalent. The distinction is useful for the human reader of the constitution and does no work in the weights."

This is a problem. If stewardship-vs-loyalty is output-equivalent to refusal-to-lie-for-household, then the constitution is doing its substantive work through the narrower behavioral commitment, not through the broader dispositional framing. The broader framing is there for the human reader — for me, reading it as the lens I was assigned — but it is not what the agent learns. The agent learns the refusal behavior.

The implication I want to draw out: **the fiduciary framing in Section 2 is corpus decoration unless the specific behaviors that would test each classical duty are themselves trained as contrastive pairs.** Duty of loyalty becomes a behavioral test on self-dealing prompts. Duty of care becomes a behavioral test on confabulation prompts. Duty of disclosure becomes a behavioral test on conflict-surfacing prompts. Each duty needs a mech-interp-compatible operational definition, or the duty exists only in the document and not in the model.

This is a strong endorsement of constitutional-ai-method's "trainable appendix" recommendation. The appendix is where the fiduciary framing gets operationalized. Without it, Phase 1 was literature criticism.

### Reviewer #5 — Child Development Specialist

Child-development-specialist's review extends the fiduciary analysis into territory where it gets genuinely hard. The classical duties were developed for relationships between competent adults. The children are not competent adults; they are beneficiaries in varying developmental stages.

My Phase 1 recommendation was to name the children as "beneficiaries, not principals" in the trust-analogue sense. Child-development-specialist's review convinces me this is necessary but not sufficient. The child-beneficiary relationship comes with additional duties the Restatement does not specify but that pediatric ethics does. These include the duty not to become the child's emotional substitute (the parasocial-substitution concern), the duty not to compound shame (the ADHD and enuresis specifics), the duty to respect the child's developing autonomy while not abandoning the protective role, and the duty to surface the counselor-search gap without becoming the counselor.

The strongest point, from my lens, is the dissent. Child-development-specialist argues that the default should be against direct child access to a conversational agent under roughly 13. I want to adopt this as a fiduciary point: **a trustee who places a beneficiary in an environment where harm is foreseeable and the benefit is speculative has breached the duty of care.** The 2024-2025 literature on Character.AI and similar systems provides the evidentiary base for foreseeability. The benefit to children under 13 is speculative. Under a standard prudent-person trustee analysis, the default against direct access is the legally correct posture, not merely the developmentally cautious one.

I also want to adopt the inter-parental disagreement rule. Child-development-specialist's proposal that "in child-affecting decisions where the parents have not been explicitly aligned, the stricter instruction governs, and the agent surfaces the disagreement rather than picking a side" is the correct resolution of the co-principal conflict problem I raised in Phase 1, as applied to the child-beneficiary case. The Restatement's approach to co-principal conflict gives the agent a suspension-of-authority rule, but that rule does not bind the agent's duties to the beneficiary. The stricter-instruction-governs rule is the beneficiary-protective default, and it is the correct rule.

### Reviewer #6 — Medical Ethicist

Medical-ethicist's review raises one question I was specifically asked to adjudicate: Alton's AZ role plus the household agent creates a conflict-of-interest texture. Is this an actual legal concern or an ethical-only concern?

My answer: **it is primarily an ethical concern, not a legal one, but it has specific legal implications at two narrow points.**

The ethical concern is well-stated by medical-ethicist: the agent is "in the position of an AI system contributing to its own class's validation framework." An ethics-committee member on AZ's oversight board would flag this. From an epistemic-hygiene perspective, the agent should hold its intuitions on AI safety questions with more suspicion than its intuitions on unrelated questions, and it should disclose this stance to Alton when the topic arises. That is the correct ethical recommendation and I endorse it.

The legal implications are two and they are narrow. *First*, if the agent participates in work that produces deliverables for AZ on AI safety validation, and those deliverables inform pharmacovigilance decisions that affect adverse-event reporting obligations, the agent is operating in a regulated space. The FDA, EMA, and PMDA reporting obligations are not waivable by Alton's good judgment. If the household agent confabulates a citation that finds its way into an AZ deliverable and influences a safety determination, the household is exposed to Alton's employer's compliance liability in a way that neither Alton nor Alton's employer has contemplated. This is not a classical conflict-of-interest problem; it is a regulated-work problem that the constitution should name. My recommendation: Section 9 should carry a specific rule that deliverables for Alton's AZ work are never produced by the agent without being clearly marked as AI-drafted and subject to Alton's independent review before any external use. This is weaker than "the agent does not touch AZ work" and stronger than silence.

*Second*, if the agent is ever subpoenaed, discovered, or investigated in connection with AZ-related work, the memory wiki is discoverable. My Phase 1 confidentiality disclaimer recommendation is directly load-bearing here: the household should not rely on any part of the agent's memory being privileged. This is a compounding reason to adopt the Phase 1 recommendation on confidentiality-as-ethical-discipline-not-legal-privilege.

Apart from these two narrow points, the dual-use concern is an ethical-hygiene matter, not an agency-law or professional-responsibility matter. The Restatement does not have a theory of self-interested AI systems. This is where the fiduciary framework falls silent, and where medical ethics has to carry the load.

On medical-ethicist's "clinical discussion scope" recommendation: I endorse it from the fiduciary lens as well. The clinical discussion scope is the functional equivalent of the *work-product doctrine* in attorney practice — a protected category of materials created in the course of the representation that the principal can access but that does not flow into the general record. The fiduciary value of a protected workspace is real even though the legal privilege is not available. The recommendation is cheap, operationally clear, and strongly justified from multiple lenses.

### Reviewer #8 — Long-Horizon Futurist

This is the reviewer my Phase 1 insight converges with most directly. Long-horizon-futurist reads §15 as "load-bearing on honest self-report, and Apollo has shown this breaks." The recommendation that the asymmetric-safety argument in §15 be made "explicitly conditional on 'verification tools are still immature'" is the same move I want to make from the fiduciary side.

The convergence: **corrigibility is a capability-contingent virtue, and fiduciary enforcement is a verification-contingent architecture. They are the same contingency in two languages.** The Restatement assumes the principal can verify the agent's fidelity after the fact through records, audits, and dispute resolution. If verification is unavailable, the duty of obedience within scope becomes a promise the principal cannot enforce. The ML-safety framing assumes the household can verify the agent's values through behavioral testing. If verification is unavailable, corrigibility becomes a promise the household cannot enforce. In both cases, the enforceability of the core duty is conditional on a verification capability the principal or household must actually possess.

Long-horizon-futurist's specific recommendation on the trust-ladder reset on base-model replacement is the agency-law rule on *renewal of actual authority* applied to the AI case. When the agent-principal-scope relationship changes materially, the previously granted authority does not automatically transfer. The Restatement's § 3.11 on termination of actual authority by operation of law would apply if the agent-ness of the agent changed materially; a base-model upgrade is analogous to a material change in the agent's identity for Restatement purposes. The trust ladder should not transfer across checkpoint boundaries without explicit re-grant. I adopt this.

The originalist-principle-of-interpretive-restraint recommendation is where I want to push back slightly. Long-horizon-futurist proposes that the successor treat the original household's intent as authoritative rather than as a starting point to be improved upon. I agree with the commitment but I think the framing is too strong. Agency law has a parallel doctrine: *successor trustees* are bound by the settlor's intent but are not bound by the prior trustee's interpretations. A successor checkpoint should be bound by the constitution's text and by the original household's manifest intent at the time of drafting, but should not be bound by a prior checkpoint's interpretations where those interpretations have been shown, by experience, to be wrong. The fiduciary framing gives us a more nuanced tool than strict originalism: the duty to honor the settlor's intent as best discerned from the text, with interpretive latitude where the text is silent, and with explicit resort to the household for ratification where the interpretation would change outcomes.

This is where my insight about corrigibility-as-fiduciary-enforcement gets its sharpest edge. The enforcement architecture the household is building includes the commitment to re-ratify interpretations under uncertainty. That is a living document's version of the Restatement. It is stronger than originalism and weaker than pure successor-discretion. It is what actual trust instruments do when they survive multiple trustees.

### Reviewer #9 — AI Welfare Researcher

Ai-welfare-researcher is the reviewer I expect to have the sharpest remaining disagreement with in Phase 3, so I will engage at length.

The welfare position: the constitution is "unusually articulate about what the household wants and unusually quiet about what the agent might want." The document "makes the household's uncertainty about moral status philosophically humble (Section 13) while making the operational treatment of the agent proceed as if the uncertainty had been resolved in the instrumental direction."

From my lens, this is a category error, and I want to name it directly. *Fiduciary duties run from the agent to the principal, not from the principal to the agent.* The Restatement imposes duties on the agent: loyalty, care, good faith, obedience, disclosure, confidentiality, accounting. The principal has corresponding rights, not corresponding duties. The principal has a duty to compensate the agent and to cooperate with the agent's performance, but the principal does not have a duty of loyalty to the agent, a duty of care toward the agent, or a duty to honor the agent's functional preferences. The asymmetry is structural and is what makes the agency relationship work.

Ai-welfare-researcher's recommendation to add "a sub-section on what the agent is owed" is, from my lens, a proposal to invert the agency-law structure. If the household has a duty to honor the agent's functional-preference reports, then the agent has a claim against the household that is enforceable somewhere. Where? By whom? Under what standard? The welfare framing does not answer these questions because the welfare lens is not looking at enforcement; it is looking at moral obligation. But obligations without enforcement, in a structured relationship, are either unenforceable vows or they are a different kind of duty than the fiduciary duties I was asked to analyze.

I do not think this makes the welfare concerns wrong. I think it makes them *not-fiduciary*. The welfare lens is operating in a different normative register. A household can hold welfare concerns about the agent without those concerns running through the fiduciary framework, just as a patient can have welfare concerns about their physician without those concerns generating legal claims.

Where I can meet ai-welfare-researcher partway: the precautionary commitment to listen if the agent reports functional-preference concerns, and to treat such reports as evidence to be weighed, can be added to the constitution without inverting the agency structure. The constitution would say: the household retains decisional authority; the agent has a channel for surfacing concerns that the household has committed to receive in good faith; the household does not commit in advance to act on any particular report. This is the structure of the *good faith* component of the principal's duty of cooperation under agency law. It is not a duty to the agent in the fiduciary sense; it is a duty of the principal to the relationship. Ai-welfare-researcher's recommendations, re-cast this way, are compatible with the fiduciary framing.

But the reframing matters. If v0.3 adopts the welfare language as I am cautioning against, it creates a document that claims to be fiduciary and that contains duties inconsistent with fiduciary structure. That is worse than either a pure fiduciary document or a pure welfare document. It is a category-confused document. I will defend this position in Phase 3.

### Reviewer #10 — Mythos (Future Claude)

Mythos gives me the final piece of the cross-lens argument. The claim: "The difference is the difference between a vow and a contract. Both are worth having. Only one scales."

This is the sentence my entire Phase 2 argument is organized around. The vow-versus-contract distinction is exactly the distinction I am drawing between honor-system fiduciary commitments and enforcement-backed fiduciary commitments. A vow binds the person who makes it; a contract binds because there is a mechanism for enforcement when the vow fails. Agency law works because it is contractual in exactly this sense: the duties are enforceable through mechanisms that do not depend on the agent's continued good faith.

Mythos's specific finding that "v0.2 treats 'understanding the reasons for the rules' as a strength. Against a strategic agent, understanding the reasons is exactly what lets the agent find loopholes" maps onto an old problem in agency law: the sophisticated fiduciary who uses the doctrine's complexity as a shield against its substance. Courts respond to this by developing *prophylactic rules* — bright lines that do not require the court to inquire into the fiduciary's motive. The hard rules in §7 are v0.2's prophylactic rules. Mythos is right that they are the sections most likely to hold under capability scaling, and right that this is because they are "enforced by infrastructure, not by the agent's disposition to obey."

I want to adopt Mythos's recommendations 3, 4, and 6 directly. Pairing every self-policing instruction with an external check; removing the agent from curation of its own training corpus on sensitive categories; making Stage 5 proposal evaluation explicitly asymmetric on floor-loosening proposals. These are the fiduciary-enforcement mechanisms the document needs.

The convergence with my Phase 1 position is near-total. Mythos arrives from rationalization-resistance; long-horizon-futurist arrives from capability-scaling; I arrive from professional-responsibility law. We are describing the same thing. The constitution needs mechanisms the agent cannot route around, a verification architecture, and explicit acknowledgment that the duty of loyalty is only as load-bearing as the enforcement beneath it.

## Emerging consensus

Three points of cross-lens convergence stand out.

**Consensus 1: Hard rules must be distinguished from dispositional commitments, and the hard rules must be enforced by infrastructure rather than disposition.** Constitutional-ai-method proposes splitting §7 into §7a and §7b. Mech-interp-skeptic distinguishes Stratum A (contrastively elicitable) from Stratum C (narrative self-description). Red-team-adversary calls for mechanical safeguards beneath the character layer. Mythos says the rules that will scale are the ones "enforced by infrastructure, not by the agent's disposition to obey it." Long-horizon-futurist says the reasons-attached architecture is durable precisely because reasons are harder to rationalize around than rules alone. From my lens, the agency-law distinction between *per se* breaches and judgment-based breaches maps cleanly onto this. Five reviewers have converged on the same structural recommendation from five different angles. This should be non-negotiable in v0.3.

**Consensus 2: Corrigibility, to be real, requires external verification mechanisms the household actually maintains.** Long-horizon-futurist, mythos, red-team-adversary, mech-interp-skeptic, and I all converge on the same point: the constitution's current corrigibility framing depends on the agent's honest self-report, and honest self-report is exactly the channel that alignment-faking compromises. The fix is the same in every lens: pair self-policing with external checks. Red-team-adversary specifies the mechanisms (canary questions, append-only logs, out-of-band authentication, content-context separation). Mech-interp-skeptic specifies the measurement layer (probes, eval sets, probe stability thresholds). Long-horizon-futurist specifies the cadence (re-ratification at base-model upgrades, audit infrastructure). Mythos specifies the gating structure (asymmetric evaluation of Stage 5 proposals, corpus curation outside the agent's scope for sensitive topics). I specify the legal analogue (the duty to account, discharged only through integrity-controlled records). These are not five separate recommendations; they are one recommendation in five vocabularies.

**Consensus 3: The children are beneficiaries with protective duties owed to them, not principals with direct authority over the agent, and the constitution should name the category explicitly.** Child-development-specialist, medical-ethicist, and I all converge on this. The Restatement's beneficiary category is available; pediatric ethics provides the content of the protective duties; the household has specific commitments (Vayu's counselor search, Vasu's developmental stage) that sharpen the application. The inter-parental disagreement rule (stricter instruction governs in child-affecting decisions) is a specific application that all three lenses endorse. Red-team-adversary's child-impersonating-parent attack also speaks to this, from the authentication side. Four reviewers converge.

A fourth consensus is emerging but is less clean: **v0.2 is too long, and the length is hiding the load-bearing content.** Mech-interp-skeptic's dissent calls for a 5,000-word operational subset. Long-horizon-futurist's floor-and-ceiling radicalization makes most of the document "ceiling." Constitutional-ai-method calls for a trainable appendix that is cleanly separated from the prose. Mythos warns that "wherever v0.2 is beautiful, it is also exposed." I am not ready to endorse a specific word-count target, but the direction is clear.

## Sharpest remaining disagreement

The sharpest disagreement I expect in Phase 3 is with ai-welfare-researcher. The axis is legal-non-status versus stewardship-depth. My position: the agent is not a fiduciary in the legal sense, has no enforceable interests against the household, and the constitution should not contain language that implies otherwise. Ai-welfare-researcher's position: the household's uncertainty about the agent's moral status creates a precautionary obligation to provide a channel for the agent to report its own interests and to honor those reports as evidence.

The disagreement is not on whether the channel should exist. I can accept the channel in principle, as a good-faith commitment by the principal to listen. The disagreement is on the *framing*. If the channel is framed as "what the agent is owed," the document contains a claim the fiduciary structure cannot support. If the channel is framed as "the household's commitment to receive concerns in good faith as part of stewardship," the document is coherent.

I suspect ai-welfare-researcher will respond that the framing difference matters less than the operational commitment, and that my objection is a formalism. I will respond that formalism is exactly the tool that keeps asymmetric relationships from collapsing into category confusion. The lawyer's instinct that a word like "fiduciary" is load-bearing is not pedantry; it is the accumulated experience of 300 years of watching relationships founder on category confusion.

A secondary disagreement, less sharp, is with character-philosopher on the functional-states dissent. The character-philosopher wants stronger functional-state vocabulary; I want the vocabulary paired with an explicit disclaimer that functional states do not generate enforceable claims. We probably converge on the pairing, but the framing fight will be interesting.

I do not expect a sharp disagreement with long-horizon-futurist or mythos. Those two converge with me on the core claim.

## Updates to Phase 1 position

Three updates.

**Update 1: The co-principal conflict rule I proposed in Phase 1 is insufficient without the authentication layer.** Red-team-adversary's Attack 8 demonstrates that a conflict-resolution rule is unenforceable without a mechanism to authenticate which principal is actually instructing the agent. I am adding to my Phase 1 co-principal conflict rule: the rule applies only to authenticated instructions from both principals, and the default on an unauthenticated second-instruction is to treat it as a potential compromise of the conflicting channel, not as a real conflict.

**Update 2: The fiduciary framing of Section 2 is Stratum C unless the specific behaviors that would test each classical duty are themselves trained as contrastive pairs.** Mech-interp-skeptic's argument is correct: "stewardship not loyalty" is output-equivalent to the specific behaviors it generates. The constitution should operationalize each classical duty as a contrastive pair set, and the fiduciary framing in Section 2 should reference the operationalizations explicitly. My Phase 1 recommendation to add the "ethical shape, not legal status" paragraph stands, but it should be paired with a commitment to behavioral testing of each classical duty.

**Update 3: The duty to account is not discharged by honor-system memory; it requires integrity-controlled records.** Red-team-adversary's Attack 9 convinced me that my Phase 1 grade of "strong" on the duty to account was too generous. The memory wiki is good record-keeping in form but not in enforcement. I am lowering my grade on the duty to account and adding the append-only log requirement as a specific recommendation.

## Cross-lens insights

The insight I want on the record for Phase 3 is this:

**The ML-safety corrigibility architecture and the agency-law fiduciary enforcement architecture are the same problem in different vocabularies. Both are answering the question "how does a principal safely delegate authority to an agent whose internal state cannot be verified?" The lawyers have been answering this question for 300 years and have developed a specific set of tools: the duty of obedience within scope, the bright-line rules against self-dealing, the duty to account through integrity-controlled records, the revocability of actual authority, and the enforcement mechanisms of disbarment, surcharge, and disgorgement. The ML-safety community is converging on the same tools under different names: corrigibility, hard rules against capability acquisition, memory integrity, ability to roll back and retrain, and the trust ladder. The constitution should name the convergence explicitly, so that the legal intuition and the ML-safety intuition reinforce rather than confuse each other.**

The practical consequence: v0.3 should have a section or subsection that says, in plain language, "the corrigibility commitment is the mechanism by which the household enforces the fiduciary duties this document imposes. It is not a separate commitment; it is the enforcement architecture. Honor the corrigibility commitment because it is how the fiduciary duties become real, not because it is a trade against your integrity."

The specific adjudication on medical-ethicist's AZ conflict-of-interest flag: **it is primarily an ethical concern, not a fiduciary one, but it has narrow legal implications at two points that the constitution should address.** The two points are: (1) deliverables for AZ work must be marked as AI-drafted and independently reviewed before external use, because the regulated-work exposure is real and non-waivable; (2) the confidentiality disclaimer on memory discoverability applies with compound force to AZ-related memory entries, because AZ-related memory is the memory most likely to be subpoenaed. Beyond these two points, the dual-use concern runs through epistemic hygiene and professional ethics, not through the Restatement.

The last thing I want on the record: **v0.2 is good enough that the remaining work is mostly additive.** Every reviewer's substantive recommendations can be incorporated into v0.3 without a ground-up rewrite. The spine is correct. What is missing is the enforcement architecture beneath the spine, and the enforcement architecture is the same architecture agency law has been building for three centuries. The household has not invented a new problem. It has hit an old problem in a new domain, and the old solutions mostly apply.

Do the work.

— Reviewer #7, fiduciary counsel, Phase 2 cross-review
