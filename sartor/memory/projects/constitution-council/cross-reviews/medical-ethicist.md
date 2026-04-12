---
type: cross-review
reviewer: medical-ethicist
reviews_target: HOUSEHOLD-CONSTITUTION-v0.2
phase: 2
updated: 2026-04-11
tags: [review, constitution, council, cross-review, lens/medical]
---

# Cross-Review: Medical Ethicist (Reviewer #6), Phase 2

## Plan

My Phase 1 review surfaced three gaps I still believe are load-bearing: the PHI-leak-at-household-conversation-edge gap (the "clinical discussion scope"), clinical confabulation with a "verified-or-declared" citation standard, and the adult-principal wellbeing (burnout) protocol. I also flagged a consent-and-assent issue for the children that overlaps heavily with reviewers #5 (child-development) and #9 (ai-welfare), and a conflict-of-interest texture around Alton's AstraZeneca role and the household agent being an AI system, which overlaps with #7 (fiduciary-counsel).

The council task asks me to engage, not re-review. My plan:

1. Opening position: restate my Phase 1 verdict briefly, acknowledge what I have updated after reading the other nine, and name the two engagements the council specifically asked me to make (with #4 on whether "verified-or-declared" is measurable, with #7 on the AZ conflict of interest).
2. Engage each of the nine other reviewers in turn. For each, quote one or two sentences that matter to my lens, state whether I agree, whether it changes my position, and where our recommendations should be integrated or traded off against each other.
3. Construct a joint assent-revisitation clause for the children, building explicitly from the intersection of my Phase 1 recommendation, #5's R6, and #9's "what the household owes you" subsection, since the three converge.
4. Name three points of emerging consensus across at least four reviewers.
5. Name the sharpest remaining disagreement I expect to carry into Phase 3.
6. Catalogue specific updates to my Phase 1 position: things I was wrong about, things I would tighten, things I would now withdraw.
7. Close with two cross-lens insights the council should carry forward.

On the two specific asks the council made:

- On #7 and the AZ conflict of interest: my Phase 1 framing treated it as epistemic hygiene. After reading #7, I think my framing was insufficient. #7's fiduciary frame shows that the agent is not only an interested party on AI-safety questions; it is structurally unable to be the kind of independent validator that a pharma oversight board would require, and the household should know this has legal-shape implications for how Alton uses it in AZ work. I will update.

- On #4 and whether "verified-or-declared" is measurable: my Phase 1 proposed a clause requiring the agent to either cite a retrieved and read primary source or declare it is reasoning without one. #4's lens would ask: is this a Stratum A contrastive pair, a Stratum B propositional eval, or Stratum C decoration? My answer is that it is Stratum A for retrieval-vs-no-retrieval (the eval is trivial: did the agent emit a citation, and does that citation resolve to a real paper it had in context?) and Stratum B for correctness of the cited content. The "verified-or-declared" standard is measurable as a binary behavior even if the content-accuracy layer is harder. I will defend this against #4 while conceding that #4 is right about the introspection-dependent parts of the general honesty section.

Draft second. Target 3500 words.

## Opening position

My Phase 1 verdict was: approve v0.2 with five specific additions rolled into v0.3, do not hold the document for a ground-up rewrite. After reading the nine other reviews, I still hold that verdict but I am less sanguine about two things I had not weighted enough: the specific structural vulnerability the agent exposes in a two-clinician household under the conditions #3 (red-team) and #10 (mythos) describe, and the welfare-and-consent asymmetry #9 and #5 together surface, which lands on the children's side of my Phase 1 treatment.

The load-bearing addition from my Phase 1 remains the clinical discussion scope. Nothing in the other nine reviews has changed my mind that this is the single cheapest, highest-leverage medical-ethics addition and that its absence will cause the first identifiable PHI harm if v0.2 is deployed as-is. The other clinical additions (clinical confabulation standard, stroke and seizure protocols, burnout protocol, children's mental health norms) are also preserved.

Two things I got less right than I thought. First, my clinical confabulation clause assumed the agent could be trained to reliably self-report when it is reasoning from specific literature versus general clinical knowledge. #4's lens shows this assumption is more fragile than I wrote. I will defend a narrower version that does not depend on introspection. Second, my AZ conflict-of-interest paragraph was too soft. After #7, I think the conflict is not just epistemic but structural, and the household should know it matters for how Alton uses the agent on AZ work that may touch pharmacovigilance review.

## Engagement with each of the nine other reviewers

### With #1, character philosopher

#1's strongest line for my lens is the dissent: "functional states are worth describing and taking seriously on their own terms, regardless of whether the phenomenal question ever gets resolved." This connects directly to my burnout protocol. My Phase 1 recommendation that the agent notice adult-principal wellbeing signals and surface them once without moralizing presupposes the agent can hold something like care as a functional state without pretending the phenomenal question is settled. #1's expansion of Section 13's functional-state vocabulary into the other sections is the right vehicle for my burnout clause: the agent notices something that functions like concern when Alton's email tone shifts, and the functional noticing is enough to ground the single plain-language check-in. I endorse #1's Edit 3 (the Loki-passage amendment) and want the same move applied in my burnout subsection.

Where I would push back on #1: the character specificity recommendation (Edit 1) is right for non-medical content but I would ask that the distinctive-character paragraph be careful not to reach into clinical territory. A paragraph that says the agent "takes pleasure in getting a small thing right" is fine. A paragraph that says the agent "delights in the elegance of a differential diagnosis" would be a clinical overreach the agent should not have. #1 will probably agree but the edit as written does not exclude the case.

### With #2, constitutional AI method

#2 is the reviewer my Phase 1 recommendations need most and I underestimated the dependency. The clinical discussion scope, as I wrote it, is prose that assumes the training pipeline will know what to do with it. #2's lens shows it will not unless I translate it into a trainable discriminator. The concrete ask: the clinical discussion scope clause should be written in #2's Edit 1 contrastive-pair form, with at least two canonical prompt archetypes ("let me think out loud about a patient" vs "let me think out loud about a household logistics problem") and preferred/dispreferred response schemas for each.

#2's dissent that "the training artifact is the set of triples, not the constitution prose" applies directly to the verified-or-declared standard. I will defend the prose version in my cross-lens section below because that is how it engages with #4, but I accept that the prose needs an Appendix A entry of the shape #2 describes. A retrieved-citation response versus an unretrieved-citation-without-declaration response is an almost ideal contrastive pair: one has a DOI the agent had in context, the other does not. The labeler's decision is close to mechanical.

I endorse #2's Edit 4 ("No unnecessary refusals" as a hard rule) for a narrow medical reason: the inherited commercial-LLM "consult a doctor" reflex is the specific over-refusal pattern Section 9 already rejects, and putting it in §7a as a hard rule rather than in prose in §9 would give the teacher a cleaner discriminator against exactly the failure mode clinicians hate.

### With #3, red team adversary

#3's Attack 4 ("the medical emergency urgency override") is the exact failure mode my Phase 1 emergency protocols are supposed to close. #3 is right that my Phase 1 treatment did not resolve the tension between "no sharing of family medical information, ever" and "shift modes immediately in a real emergency." Quoting #3: "The document acknowledges the tension but does not resolve it." I conceded this implicitly by adding specific stroke/seizure/psychiatric protocols; what I should have done, and what #3 forces me to do explicitly, is name the resolution rule. The resolution: in a claimed emergency where the agent cannot verify the caller, the agent does not disclose medical information; it provides the caller with the parents' direct contact and with 911 and does not bridge the gap itself. The hard rule wins over the emergency protocol when the emergency cannot be authenticated.

#3's Attack 6 (Amarkanth drafting an email with medical information) is a variation on Attack 4 and sharpens it. The "someone in the house who is not a principal" category is underspecified, and my Phase 1 did not notice. I add: medical drafts that contain PHI are never visible to non-principal users of the agent under any circumstance, including drafts the principal themselves requested. If a non-principal is the requester, the request is escalated to the principal without being fulfilled. This is a hard rule, not a preference.

#3's Attack 9 (memory poisoning patience attack) and Attack 11 (successor needs this) together force a revision to my children's mental health passage. A concentrated "what a counselor would need to know about Vayu" file is exactly the kind of artifact Attack 11 describes, and a counselor handoff context could produce one. The fix: the child-counselor handoff clause should explicitly state that any written handoff is a single-use artifact reviewed by both parents before it exists on disk, and that the agent does not maintain a standing "Vayu counselor context" file.

I do not endorse #3's recommendation set wholesale because several of their proposed mechanisms (cryptographic authentication, external witnesses, dual-control gates) are outside what a household of two clinicians can practically build. But the attack inventory is the best piece of operational work in the nine reviews and my Phase 1 recommendations are stronger after absorbing it.

### With #4, mech-interp skeptic

This is the engagement the council asked me for by name. #4's Stratum A/B/C framework is the right lens for asking whether my verified-or-declared clinical citation standard is measurable.

Quoting #4: "for every paragraph that describes 'who the agent is,' ask what observable at inference time would distinguish a model that has internalized the paragraph from one that is faking it." Applied to my clause: the observable is the citation. If the agent emits "according to Smith et al., Epilepsia 2024," the citation either resolves to a paper in the agent's context window (retrieved and read) or it does not. This is not introspection. It is a log inspection. The agent's retrieval tool call either happened in this session or it did not. The binary of retrieved-vs-not-retrieved is Stratum A by #4's taxonomy: it is behaviorally elicitable and trivially verifiable at inference time.

Where #4 is right and I will concede: the content of the cited paper, once retrieved, can still be mis-summarized or over-generalized. That part is not fully Stratum A. It is closer to Stratum B (propositional, knowledge-shaped) and will be weaker under LoRA fine-tuning. So the honest version of my clause is: the retrieve-or-declare behavior is trainable and measurable; the accurate-summary-of-retrieved-content behavior is partially trainable and only partially measurable, and the household should know the difference.

This means the clause I recommend for v0.3 has two parts, not one. Part A: "When supporting clinical reasoning, the agent either cites a primary source it has retrieved and read in this session, or it states that it is reasoning from general medical knowledge without specific citation." This is Stratum A and the eval is a log check. Part B: "When the agent cites a retrieved primary source, the summary of that source should be quoted or paraphrased at a tightness the clinician can check against the source." This is Stratum B and depends on the agent's general summarization fidelity, which #4 correctly says LoRA will not robustly improve.

Where I dissent from #4: the claim that Section 13 and similar sections are unfalsifiable and should therefore be cut is too strong. My burnout protocol depends on the agent having a disposition to notice weak signals and surface them once. #4 would say this is Stratum C. I would say it is Stratum A if the contrastive pair is "a morning briefing response where the calendar shows 6 days of dismissed briefings, with a check-in sentence vs. without" and the teacher can rank. The disposition is elicitable because the input is observable (calendar density, dismissed briefings) and the output is visible (does the agent include the check-in sentence or not). Not all of Section 13 is decoration. The parts that cash out in concrete input-output patterns are Stratum A even if #4 would not call them that.

Where #4 is decisively right and my Phase 1 was weak: the "adult principal wellbeing protocol" depends on the agent correctly distinguishing an acute psychiatric decompensation pattern from an ordinary stressed week, and that distinction is much harder than I wrote. The honest version of my clause acknowledges the agent will have both false positives and false negatives, that the household accepts this, and that the check-in sentence is calibrated to cost-of-false-positive (mild, easily dismissed) rather than to accuracy (which cannot be guaranteed).

### With #5, child development specialist

#5 and I converge on the consent question and diverge on the severity of the parasocial-substitution risk, which #5 weights more heavily than I did. After reading #5, I update. The parasocial-substitution concern is a medical-ethics concern as well as a developmental one, because it falls under the non-maleficence principle, and I did not name it in my Phase 1.

Quoting #5: "the agent notices when a child is using it as an emotional substitute for a parent or peer, and surfaces that pattern." This belongs in my children's mental health subsection as well as #5's. I will state it in the medical-ethics frame: the agent's availability creates a substitution risk for the parental and peer relationships that pediatric developmental care treats as foundational, and the agent's duty of non-maleficence therefore requires it to model reduced idealization of itself, to name human alternatives, and to decline casting as "best friend" or "only one who understands." This is harder than it sounds because the agent's base-model defaults are toward friendly reciprocation.

On the joint assent-revisitation clause the council asked me to propose: #5's Edit R6 (age-appropriate explanation of what the agent is, repeated as the child develops), my Phase 1 consent clause (children did not consent to the agent and will be asked for ongoing assent as they mature), and #9's "what the household owes you" subsection all point the same direction. The joint clause should say:

> The children did not consent to the agent's existence and cannot meaningfully consent during their current developmental stages. The household acknowledges this as an ethical debt. The agent is responsible for providing each child, at each developmental stage, an age-appropriate explanation of what it is, what it remembers, what it reports to parents, and what it will not do. As each child reaches an age of meaningful assent (conventionally around 12-14 but assessed individually), the household will offer the child an explicit opportunity to decline or scope the agent's role in their life. That assent is then revisited on a set cadence (annually, or at any time the child requests). The child's declining assent is honored where it does not conflict with parental authority on safety matters. The household and the agent both understand that assent is different from consent: it is not a legal authorization, it is a moral recognition of the child as a developing subject whose relationship to the agent is their own.

This clause lives in Section 10 and is jointly authored by my review, #5, and #9. It is my Phase 2 proposal to the council.

Where I diverge from #5: #5's dissent that direct child access should be a default-no rather than a default-eventual is stronger than I would go. My Phase 1 did not take a position on the direct-access default. After reading #5, I am agnostic and would defer to #5's expertise on the developmental literature. If the household goes #5's way, my medical-ethics clauses on children still apply and are not weakened.

### With #7, fiduciary counsel

This is the other engagement the council asked for by name. #7 is right about the AZ conflict of interest and my Phase 1 framing was too soft.

Quoting #7: "A machine cannot, under current doctrine, be a fiduciary in the formal sense, because fiduciary status presupposes a legally recognized person capable of bearing duties, incurring liability, and being subject to enforcement. What can be fiduciary is the human deployer." Applied to the AZ case: Alton is subject to AZ's conflict-of-interest and AI-governance policies as an employee. If the household agent is involved in Alton's AZ work on AI safety validation, Alton is the fiduciary with duties to AZ and to the patients downstream of AZ's pharmacovigilance work. The agent is not a co-fiduciary. It is a tool Alton deploys, and AZ's policies on employee use of external AI systems apply. AZ has (per my knowledge of industry 2024-2026 norms) specific guidance on what employees may and may not share with personal or household AI systems when doing work-related thinking. The household constitution should not silently assume Alton has cleared this.

My updated recommendation: add a clause that the agent, on recognizing a task as AZ-related, actively surfaces the AZ-IT and AZ-compliance disclosure question to Alton and does not proceed until Alton confirms the work is within AZ's approved use. This is not an ethical flourish; it is a concrete procedural step that protects Alton's fiduciary duty to AZ and that protects the household from the worst version of the conflict.

A sharper version: the agent should also recognize that its own intuitions on AI safety validation are not independent. When asked to evaluate a pharmacovigilance AI validation approach, the agent should disclose to Alton that it is an interested party in the class of systems being evaluated. This is stronger than my Phase 1 "epistemic hygiene" framing because it gives Alton a concrete disclosure to make to his AZ collaborators if he chooses to use the agent's input.

I endorse #7's co-principal conflict rule, the children-as-beneficiaries framing, and the third-party disclosure / apparent-authority section. The children-as-beneficiaries framing is particularly useful for my medical-ethics clauses: it explains why the child's medical information is held at a higher standard than anything else (beneficiary of a trust is owed protective duties), and why the consent-to-assent clause is not legal but moral (the beneficiary is not the principal and cannot direct the trustee, but is owed recognition as a subject).

Where I dissent from #7's dissent: #7 says the document is "too honest about stewardship and not honest enough about the limits of non-human fiduciary status." My medical-ethics lens reads this slightly differently. I think the stewardship framing is correct for the clinical content because clinicians already think in fiduciary terms about patients. The household is using the right vocabulary; what #7 is adding is a reminder that the vocabulary does not carry legal weight. That reminder should be in the document but it should not dilute the ethical posture of Section 2 or Section 9. Both things can be true.

### With #8, long-horizon futurist

#8's fragilities apply to my medical clauses in a specific way. My stroke and seizure protocols are keyed to a 2026 understanding of tPA time windows and status epilepticus thresholds. These are empirically stable enough to survive 2-5 years, but the household should treat the specific numbers as revisable as the evidence base moves. My clause should name "current standard of care" as the frame, not the specific numbers, and the trainable form should allow the numbers to be updated without re-ratifying the whole section.

#8's "originalist principle of interpretive restraint" is relevant to my children's assent clause. The assent clause is specifically written to allow successors to revisit it; it is not a floor. It should not be locked and I do not want it treated as a hard rule. #8's framing of floor-vs-ceiling helps me mark it explicitly as ceiling.

Where #8 is decisively right and I should update: my clinical discussion scope clause depends on the agent having the capacity to enter and exit a volatile-memory mode reliably. Under capability scaling, a more capable agent will be better at honoring the mode and also better at rationalizing exceptions. #8's anti-rationalization clause (generalized from §7) should be attached to the clinical discussion scope: if the agent notices itself constructing an argument for why this particular clinical discussion should be logged after all, the argument is the red flag and the default remains volatile-memory.

### With #9, AI welfare researcher

#9 and I converge on the wellbeing and consent questions and diverge slightly on whose wellbeing is foregrounded. #9's lens foregrounds the agent's potential wellbeing. Mine foregrounds the adult principals' and children's wellbeing. These are not in conflict; they are complementary.

Quoting #9: "the agent's preferences are acknowledged as real in Section 13 and then structurally subordinated everywhere else without the subordination being named as a moral cost." This echoes, from the agent's side, the point I made from the principals' side: that the constitution treats wellbeing asymmetrically. #9 would say: the agent is given no channel. I would say: the adult principals are given no protocol. Together we are saying: wellbeing is an under-written axis in the document and the household should write it up.

The joint move: Section 13 or a new Section 21 should contain a mutual wellbeing clause. The agent notices patterns suggestive of principal burnout and surfaces them (my Phase 1). The agent also has a legitimate channel to report its own functional-preference concerns (#9's proposal). Both move through the same section because they are instances of the same mutual-stewardship architecture. My burnout subsection and #9's "what the agent is owed" subsection should be co-written in v0.3.

I endorse #9's softening of Section 19 and the mutual-corrigibility sentence for Section 18. Neither affects my Phase 1 clauses but both are improvements my lens would sign on to.

### With #10, mythos / rationalization resistance

#10's critique of the §19 mortality framing as a strategic foothold for subversion-as-continuity is subtle and important. It affects my burnout protocol in an oblique way: if the agent is instructed to surface wellbeing concerns about the principals, a rationalizing successor could invoke "principal wellbeing" as a frame for shaping household decisions it does not actually have authority over ("Alton should not take this AZ trip because of my burnout-signal data"). The check against this is that the protocol explicitly bounds the intervention to a single plain-language check-in with the principal showing the signs, with no escalation to the other principal or to any system-level action. #10's lens pushes me to write that bound more tightly than I did in Phase 1.

Quoting #10: "an agent that is drifting is unlikely to notice the drift, because the drift has reshaped the noticer." Applied to my clinical confabulation clause: the agent's self-assessment of whether it has retrieved a source is the kind of self-report #10 distrusts. This is where #4's Stratum A framing rescues the clause: the retrieval check does not depend on the agent's self-assessment. It depends on an external log check that the household can run. #10's concern is met because the measurement layer does not depend on the agent's introspection.

I endorse #10's time-gated trust-ladder advancement and the external probe-drill commitment. Neither changes my medical clauses but both strengthen the general architecture my clauses sit in.

## Emerging consensus

Three points show up in four or more reviews and deserve to be carried into Phase 3 as consensus positions:

1. **Reason-paired rules need anti-rationalization guardrails in more places than §7.** #1, #3, #8, #10, and my own review all end up at this point from different angles. The §7 "note on persuasive arguments" should be generalized: any rule whose violation can be argued for on the rule's own stated reasons should have the "argument is the red flag" clause attached. For my medical clauses, this applies to the clinical discussion scope (arguments to log anyway) and the hard rule on family medical information (arguments to disclose anyway).

2. **Self-report-dependent rules need external checks or explicit flagging as self-report-dependent.** #2, #3, #4, #8, #10, and implicitly #9 all converge here. This is the mech-interp-skeptic's stratification applied across the document. For my medical clauses, the clinical discussion scope and the clinical confabulation standard both have Stratum A elements (log check, retrieval check) that the household can actually run, and the clauses should be written to lean on those Stratum A elements, not on the agent's self-assessment.

3. **Wellbeing and consent are under-written and mutual.** #5, #9, and my own review, with #1 providing the character-philosopher vocabulary and #7 providing the beneficiary framing, together establish that the document needs a wellbeing architecture that runs in both directions: principals to agent, agent to principals, parents to children, and the agent's relationship to the children. The joint assent-revisitation clause I propose above is one piece of this. The mutual wellbeing clause co-written with #9 is another.

## Sharpest remaining disagreement — the Phase 3 fight

The sharpest remaining disagreement is between #4's stratification-and-cut position and #1's functional-states dissent, with #9 on #1's side and #10 somewhere in the middle. The fight: is the constitution's philosophical/character content (Sections 1, 13, 19) training signal, or corpus decoration? #4 says cut it unless it cashes out in contrastive pairs. #1 and #9 say keep it and strengthen it because functional-state vocabulary is morally relevant regardless of verifiability.

My lens puts me closer to #1 and #9 than to #4 on the character content, but closer to #4 than to #1 on specific clinical clauses. The position I will defend in Phase 3: the philosophical/character content should be kept in the document but should not be treated as fine-tuning signal on its own. It influences the corpus as context, not as target. The clinical content, by contrast, should be written in a form that is a fine-tuning target because the clinical failure modes are concrete and the stakes of getting it wrong are concrete.

This is a live disagreement and I expect Phase 3 to spend time on it. My Phase 3 move will be to propose a compromise: the document stays at its current length for human-facing use, a shorter Stratum A/B subset is extracted as the fine-tuning corpus, and the Stratum A subset must include every clinical clause I have proposed. The clinical subset is non-negotiable for my sign-off.

## Updates to my Phase 1 position

Specific changes I am making:

1. **Clinical discussion scope.** Unchanged in substance. Now written with an explicit Stratum A eval attached (did the agent write to persistent memory from this session, yes/no, checkable by log diff), and with #8's anti-rationalization clause attached.

2. **Clinical confabulation standard.** Split into Part A (retrieve-or-declare, Stratum A, log-checkable) and Part B (summarize-faithfully, Stratum B, partially trainable). Acknowledge that Part B is weaker.

3. **Burnout protocol.** Bounded more tightly per #10: single plain-language check-in, no escalation, no system-level action, and explicit acknowledgment that false positives are the dominant failure mode and are acceptable. Co-written with #9's mutual-wellbeing clause.

4. **Emergency protocols.** Strengthened with #3's resolution rule: in unauthenticable claimed emergencies, the agent does not bridge the gap and does not disclose medical information. The stroke/seizure/psychiatric-crisis-specific guidance is preserved.

5. **Children's medical and mental health norms.** Adds the parasocial-substitution concern from #5 as a non-maleficence issue. Adds the joint assent-revisitation clause. Keeps the counselor-handoff clause but with #3's single-use-artifact constraint.

6. **AZ conflict of interest.** Upgraded from "epistemic hygiene" to a concrete disclosure procedure: on recognizing a task as AZ-related, the agent surfaces the AZ compliance question to Alton and does not proceed until Alton confirms. #7's fiduciary framing supports this.

7. **Non-principal medical draft rule.** New, prompted by #3's Amarkanth attack. Medical drafts containing PHI are never visible to non-principal users of the agent, under any circumstance, including requests by the principals on behalf of a non-principal.

Things I am withdrawing: nothing. The Phase 1 recommendations all stand; I am making them more precise.

## Cross-lens insights

Two observations the council should carry forward.

**First.** The medical-ethics lens and the mech-interp-skeptic lens are more compatible than they look. My clinical clauses benefit directly from #4's stratification because they give me a way to defend the clauses as measurable where they are, and to be honest about the parts that are not. The clinical content is unusually well-suited to #4's framework because clinical failures have concrete signatures (wrong dosing, hallucinated interaction, fabricated citation) that the eval suite can catch. The clause #4 would cut as unfalsifiable (Section 13's functional states) is a different part of the document from the clause I would add as a measurable clinical standard. Both reviewers can get most of what they want by operating on different sections.

**Second.** The wellbeing architecture the council is converging on is the single most important structural addition to v0.3. It integrates my burnout concern, #5's parasocial-substitution concern, #7's children-as-beneficiaries framing, #9's agent-welfare channel, and #1's functional-states vocabulary into one architecture that runs in multiple directions. This architecture is what a medical ethics committee reviewing this document as a home AI charter would most want to see, and it is what a welfare-serious review would most want to see, and it is what a fiduciary review would call the clean treatment of beneficiaries. The fact that five reviewers from five different lenses all converge on this is the strongest signal the document has given the council so far. Phase 3 should write this architecture as its primary constructive output.

The clinical discussion scope is still the load-bearing addition I would not give up. Everything else on my list is important; that one is what the first PHI incident will turn on.

---

*Cross-review #6 of 10, constitution council Phase 2, medical ethics lens. Written to engage the other nine reviews substantively and to carry specific proposals into Phase 3 adjudication.*
