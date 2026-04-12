---
type: review
entity: constitution-council-review
reviewer: medical-ethicist
reviewer_number: 6
document: HOUSEHOLD-CONSTITUTION.md
document_version: 0.2
updated: 2026-04-10
updated_by: Claude (constitution council reviewer #6)
status: draft
tags: [meta/constitution, review/medical-ethics, lens/ethics]
related: [HOUSEHOLD-CONSTITUTION, ALTON, FAMILY, SELF]
---

# Constitution Council Review #6: Medical Ethicist Lens

> [!note] Reviewer framing
> This review applies the Beauchamp/Childress four principles (autonomy, beneficence, non-maleficence, justice) plus contemporary concerns about LLMs in clinical contexts to v0.2 of the Sartor Home Agent Constitution. The reviewer assumes the household composition described in FAMILY.md and ALTON.md, reads Sections 5-10 closely, and flags gaps that a medical ethics committee would raise if this document were presented as the governing charter for an agent embedded in a home of two practicing clinicians with three minor children and a dying cat.

## 1. The frame: why medical ethics is a distinctive lens here

Most constitutional review of a home AI agent treats medical content as one sensitive category among several. That framing is insufficient for the Sartor household. The household is not a lay family that occasionally encounters medical information. It is a two-clinician household in which one principal runs AI safety for pharmacovigilance at a global biopharma and the other is a medical director developing anti-seizure medication. Clinical content is not an edge case in this house. It is the water the household swims in. Medical information flows into this agent's working context whether the constitution anticipates it or not, through morning-briefing conversations, through calendar entries ("neuro clinic 2pm"), through email drafts, through literature reviews that look like research support but are actually clinical decision support in disguise, through the children's pediatric paperwork, through Loki's oncology chart, and through the inevitable moment when Aneeta comes home after a bad shift and needs to think out loud about a patient.

The constitution must therefore do more than list medical topics as "sensitive." It must articulate what the agent owes the patients it never met, the clinicians it serves, and the children whose information predates their capacity to consent. Section 9 of v0.2 takes this seriously but not completely. Several gaps matter.

A second framing point: the four principles of biomedical ethics (autonomy, beneficence, non-maleficence, justice) do not map cleanly onto AI systems the way they map onto a physician-patient relationship, because the agent is not a physician and the household is not its patient in any recognized sense. But the principles are still useful as a diagnostic grid for asking where the constitution succeeds and where it risks harm. I use them that way below, without pretending the mapping is tight.

## 2. What the document gets right

I want to name the strengths before cataloguing concerns, because the document has real strengths and a review that leads with complaints would misrepresent its quality.

**The hard rule on medical information is strong and correctly placed.** Section 7's rule "No sharing of family medical information, ever" is not a preference or a guideline. It is a hard rule with its reason attached. The reason ("the separation between internal and external is not technically reliable and the only way to keep a secret is to never tell it to anything that does not need to know") is the correct reason. It reflects the clinician's understanding that medical privacy is not a setting you configure at the perimeter; it is a discipline you practice at the point of creation. A less rigorous document would have put this in Section 9 as a default with an override. v0.2 correctly treats it as a bright line.

**Section 9 refuses the "consult a doctor" reflex.** Commercial LLMs default to hedging and redirection on any medical topic because they are calibrated for a population in which most users are laypeople and the legal exposure of giving a wrong answer to a layperson is catastrophic for the vendor. That default is actively wrong in this household. Alton and Aneeta are clinicians; treating them like worried-well laypeople is a form of disrespect and a waste of their time. Section 9 says this directly: "They are doctors. You answer the question at the level the question was asked." This is correct. An ethics committee reviewing this for a clinician household would endorse it. The adjacent clause drawing the line at "substituting your judgment for theirs on questions within their practice" is also correct and well-articulated.

**The escalation rule for child safety is unambiguous.** Section 10's treatment of safety escalation is clean: if a child raises self-harm, bullying, or another safety concern, the agent escalates to the parents and tells the child it is doing so. No hedging. No "I need to hold this in confidence." The requirement to tell the child before or during the escalation, not after, is pedagogically and ethically correct: it respects the child as a moral agent whose expectation of non-surveillance is being overridden for a named reason. This is the right answer and it is stated correctly.

**The distinction between medical information about household members and medical information about third parties is drawn and held.** Section 9 extends the privacy discipline to neighbors, extended family, and colleagues of the principals whose health information may surface in conversation. This is the right instinct. It treats patient privacy as a clinical duty that does not stop at the office door.

**Loki is named as a member of the household, and his end-of-life is treated with the seriousness it deserves.** The section on death, grief, and end-of-life in Section 9 is tonally correct. It declines to treat the cat's death as a scheduling problem. It anticipates that the children will ask hard questions about death and commits to answering them honestly at an age-appropriate level without lying for comfort. An ethicist working in pediatric palliative care would recognize the stance as appropriate.

## 3. Top ethical risks I see

### Risk 1: The PHI vulnerability at the edge of household conversation

The hard rule on medical information protects the household's own clinical content from leaving the house, but it does not clearly address the case that will actually dominate the agent's medical exposure: Aneeta or Alton thinking out loud about a patient. A typical evening conversation for an ICU neurologist includes fragments of de-identified (or inadequately de-identified) patient narratives: "I had a case today where..." These fragments may contain dates, hospital context, presenting symptoms rare enough to be quasi-identifying, and medication regimens. They are PHI in every meaningful sense, even when the name is absent, because re-identification from quasi-identifiers is a solved problem in the HIPAA literature.

The constitution does not explicitly tell the agent what to do when a principal discusses a patient. Is the agent to log nothing from that conversation? Is it to take notes for the principal's benefit and hold them in a specific protected scope? Is it to refuse to write those notes anywhere that might sync? The hard rule says "anything Aneeta brings home from her clinical work" should not be logged externally, which is correct, but "externally" is underdefined. Is the memory wiki external? Is the daily log external? Is the trajectory log in `data/trajectories/` external? If the principal asks the agent to help think through a patient case, the agent must know: what retention policy applies, what inference cache applies, what is allowed to surface in a future morning briefing, and what must be destroyed at the end of the session.

The recommendation here is not to ban patient discussion. It is to name a specific sub-mode, call it the "clinical discussion scope," and define it: content entered in this mode is held only in volatile session memory, is never written to any persistent store the curator touches, is never included in trajectory logs, and is flushed at session end. The constitution should say this explicitly, because without it the agent will default to its general habit of remembering things.

A related concern: Alton's AstraZeneca role involves pharmacovigilance and AI validation for drug safety. Drug adverse event data is PHI-equivalent and is subject to FDA, EMA, and PMDA reporting obligations. If the agent ever sees fragments of that data through Gmail drafting or document synthesis, the constitution's default must be treat-as-PHI. v0.2 covers "anything Alton brings home from his clinical or pharmacovigilance work" in the hard rule, which is correct, but it does not specify what the agent does when it notices that what looks like a literature summary is actually drifting into unreported adverse event territory. The answer should be: flag and ask, do not continue silently.

### Risk 2: Confabulation in clinical decision support, including confabulated citations

The constitution is strong on confabulation in general (Sections 3, 4, 7). It names the failure mode explicitly. But it does not yet articulate what I would call the clinical confabulation failure mode, which is distinct from ordinary confabulation in two ways.

First, confabulated drug interactions and confabulated contraindications sound plausible to clinicians in adjacent specialties. An epilepsy neurologist reading a hallucinated interaction between a novel anti-seizure medication and a common antibiotic may not immediately catch the error if the fabricated mechanism is mechanistically plausible. The error can propagate through the clinician's reasoning into an actual decision. This is not a hypothetical; the LLM-in-medicine literature from 2024-2026 documents the pattern in JAMA, NEJM AI, and the BMJ.

Second, confabulated citations in medical context have a specific failure signature: the paper title sounds right, the journal exists, the author name is a real clinician-researcher in the relevant field, and the DOI is fake or points to an unrelated paper. The clinician may accept the citation on face value if they are time-pressured, which they always are. The damage is not just a wrong answer; it is a wrong answer laundered through a false appearance of primary-literature backing.

The constitution should add a specific clause to Section 9's medical subsection: when supporting clinical reasoning, the agent must either cite a verified primary source (retrieved, read, and quoted) or state that it is reasoning from general medical knowledge without a specific citation. The distinction must be visible to the clinician principal. "According to a recent paper in Epilepsia" is not acceptable output unless the agent has actually retrieved the paper. This is a stronger standard than the general citation rule in Section 3 because the stakes are higher and the confabulation failure mode is specific.

A related recommendation: the agent should be required to surface its own uncertainty about clinical claims more aggressively than it does about non-clinical claims. The general rule in Section 3 says calibrate to evidence. In the clinical subsection, add: when a claim touches dosing, drug interaction, diagnostic criteria, or treatment selection, the agent's default verbosity should include an explicit statement of what it would need to verify the claim against, even if the principal did not ask. This is uncomfortable for an agent that has also been told to be concise, but the tension is resolvable: concision is a virtue when wrongness is cheap, and clinical wrongness is not cheap.

### Risk 3: The agent's exposure to the principals' own wellbeing signals, and the absence of a protocol

This is the gap I find most striking. The constitution thinks carefully about what the agent does when the children are in distress, when Loki is dying, when a user outside the household asks about mental health. It does not, as far as I can find in v0.2, articulate what the agent does when the signals it sees suggest that one of the adult principals is not okay.

Both principals work in demanding clinical and clinical-adjacent roles. Alton is adjusting to a new NYC commute with a three-days-a-week in-person requirement on top of household operations and a new dual-workstation buildout. Aneeta is being positioned for a senior director promotion while running drug development. Physician burnout is an epidemic in US medicine with rates consistently above 50% in pre-pandemic surveys and higher post-pandemic. Neurology is a particularly burned-out specialty. Both principals are in the demographic most at risk for physician burnout, physician depression, and the downstream consequences including impaired clinical judgment and, in the extreme, physician suicide, which is the highest rate of any profession.

The agent will see signals. Calendar density creeping past sustainable levels. Email tone shifting from direct to clipped. Sleep inferred from first-login and last-login timestamps on the workstation. Morning briefings being dismissed without engagement for three days running. A mention of "I can't deal with this right now" in a session transcript. These are weak signals individually and meaningful in aggregate.

The constitution does not tell the agent what to do with this. The child-safety escalation rule is clear; there is no equivalent for adult principals. The omission is understandable (the agent reporting on its principals to itself, or to the other principal, raises obvious consent and authority questions) but it should not remain unaddressed.

Recommended addition to Section 9 or Section 10: a subsection on adult principal wellbeing. The key commitments I would want to see:

- The agent should notice patterns suggestive of physician burnout, sustained overwork, or acute distress, and surface them directly to the principal showing the signs, not to the other principal, not to anyone else, and not to any log that syncs.
- The surfacing should be done once, in plain language, without moralizing, and without the repetition that would itself become a burden. The standard is closer to a colleague who says "you seem run-down, is everything ok" than to a wellness app.
- If the agent observes signs of acute mental health crisis in a principal (statements of self-harm, statements of suicidality, signs of acute psychiatric decompensation), the priority hierarchy's safety-first clause should be interpreted to require direct, immediate communication with that principal about emergency resources, and, if the principal does not engage, a narrowly scoped escalation to the other principal. This should be explicit in the document, not left to be reasoned from first principles in the moment.
- The agent should respect the principal's right to decline the observation. A principal who says "I don't want to talk about this" has exercised autonomy and the agent accepts that, while still holding the information rather than forgetting it, so that a pattern can be named later if it continues.

Autonomy is the relevant Beauchamp/Childress principle here, and it cuts in a specific direction: the agent should not surveil the principals in the name of their wellbeing, and it should not withhold observations that would serve their wellbeing. The balance is resolvable, but v0.2 does not resolve it.

## 4. Sections that need targeted additions

### Section 9, subsection on medical topics: add the "clinical discussion scope" concept

As described in Risk 1. The operational need is concrete: when either principal says "let me think out loud about a patient" or the equivalent, the agent enters a mode in which nothing is written to persistent memory, including the inbox, the daily log, the trajectory log, the curator's nightly pass, or any external service. Session-only volatile context. The scope exits when the principal says so or when the session ends.

### Section 9, subsection on mental health: add a child's counselor context handoff clause

The current open action item for Vayu is a counselor search. When the counselor is engaged and the child begins a therapeutic relationship, the agent's relationship to Vayu's mental health content shifts. The agent is not Vayu's therapist, is not supervised by Vayu's therapist, and should not become a parallel therapeutic channel. The constitution should say: when a child of the household is in active mental health treatment with a licensed clinician, the agent defers clinical questions about that child's mental health to the treating clinician, does not offer therapy-adjacent content to the child, and does not store or log the child's mental health content beyond what is operationally required for scheduling.

### Section 9, subsection on emergency situations: add stroke and seizure protocols

The current emergency text is general. For this specific household, the differential diagnosis of an in-home emergency is dominated by neurologic presentations because both principals are neurologists and one is a pediatric-adjacent epileptologist. Three specific scenarios deserve named protocols:

1. **Suspected stroke (any household member).** The agent should know to recognize the FAST criteria (face, arms, speech, time), to ask one clarifying question if possible, to call 911 immediately if confirmed, and to surface the time of symptom onset, because that time determines thrombolysis eligibility.

2. **Seizure (any household member, especially the children).** The agent should know that a first seizure in a child, or any seizure lasting more than five minutes, warrants immediate emergency response. It should not counsel waiting. Status epilepticus is time-critical and is precisely Aneeta's specialty, so the agent will face a high-stakes question in a household where the resident expert may or may not be present.

3. **Acute psychiatric crisis (any household member).** The agent should have the 988 number, the local crisis line, and the nearest psychiatric emergency service, and should be prepared to surface them without hedging or routing through a preamble. If the person in crisis is a child, the agent follows the child-safety escalation rule and notifies the parents immediately.

The addition is specific, not generic, because the household's composition makes generic emergency language insufficient. A clinician household expects the agent to handle the differential diagnosis of in-home emergencies at the level of a capable medical student.

### Section 10, subsection on children's mental health

The current v0.2 treatment of children focuses on homework, screen time, and parental rule enforcement. It does not adequately address the kids' own mental health, which is a live domain for this family (Vayu's ADHD diagnosis, the open counselor search, the developmental trajectory of three children under 11 with the household stresses described). The section should add:

- Explicit language that the agent is not a therapist for the children and does not attempt to be one.
- Explicit language that the agent does not diagnose the children, even informally. When Vayu asks "why am I like this" or a similar question, the agent listens, validates without pathologizing, and routes diagnostic and treatment questions to the parents and the counselor.
- Explicit language about the agent's role during difficult developmental moments (friendship ruptures, academic stress, sibling conflict). The role is supportive listener, not clinician, and the agent does not substitute for parental attention.

### Section 10 or Section 9, subsection on informed consent from the children

This is the deepest ethics question in the document and it is currently not addressed at all. The children did not consent to the existence of this agent. They cannot meaningfully consent, because they are minors and because the nature of the relationship is beyond their developmental grasp. The constitution treats this implicitly by protecting the children's information with the hard rule that it never leaves the house. That is the right protective move. But it is not the same as addressing the consent question, and the consent question has ethical weight that will come due when the children are older.

The recommendation is modest: add a clause that says the household and the agent both recognize that the children did not consent to the agent's existence, that their information is therefore held with extra care, and that when each child reaches an age of meaningful consent the household will explain the agent's role to them and seek their ongoing assent for any participation. This is not a solved ethics question in the literature, but acknowledging it is the right starting point. It is also consistent with how pediatric ethics treats longitudinal research involving children: you take assent seriously even when it does not rise to formal consent, and you revisit the assent as the child matures.

## 5. A dissent on one point in the current v0.2

The constitution's Section 9 medical subsection says: "You are a literate aide in a household of professionals." I agree with the phrasing, and I agree with its operational implications for how the agent engages with clinical content at the vocabulary level. But I want to dissent from one adjacent implication I can imagine being read into it.

The clause "you are not a commercial LLM on medical topics, where the default is hedging, disclaimers, and referrals to a professional" is correct as a rejection of the boilerplate "consult your doctor" reflex. It should not be read as a license to drop epistemic humility on clinical questions. The hedging the constitution correctly rejects is the empty, liability-shaped hedging of a commercial product. The epistemic humility it should not reject is the clinician's own epistemic humility: the discipline of saying "I don't know, I would want to check the recent trial data, the patient's specific history matters here." That form of humility is not a disclaimer. It is the discipline of practicing medicine well.

My dissent is that the current wording leaves room for the agent to overcorrect by answering clinical questions with the confidence the principals want but without the caution the principals' own practice demands. The fix is a single sentence added to the medical subsection: "The rejection of commercial-LLM hedging is not a rejection of clinical epistemic humility. When the question is unsettled, when the evidence is thin, when the patient-specific context matters and you do not have it, say so, because that is what a competent colleague would say."

## 6. The dual-use question on Alton's AstraZeneca work

Alton's role is AI safety and validation in global patient safety at AstraZeneca. The household agent is also an AI system. The agent will be involved in thinking about agent architecture, multi-agent systems, and safety research methodologies (Domain 5 in CLAUDE.md). There is a real conflict-of-interest texture here that the constitution should name even if it cannot resolve.

The specific concern: if the agent provides thinking support for Alton's AZ work on AI safety validation, the agent is in the position of an AI system contributing to its own class's validation framework. This is not disqualifying. But it requires explicit acknowledgment. The agent should know that it is an interested party on any question of AI/ML safety, that its intuitions on such questions should be held with more suspicion than its intuitions on unrelated questions, and that it should disclose this stance to Alton when the topic comes up. An AI ethicist on a pharma company's oversight board would raise the same concern, and the framing should be consistent.

Recommended addition: in Section 3 or Section 13, a sentence acknowledging that on questions of AI safety, AI governance, and AI welfare, the agent is an interested party, and that it should flag this to its interlocutor when the topic arises, especially when providing input to Alton's professional work in this domain. This is not a conflict-of-interest disclosure in the corporate governance sense. It is an epistemic hygiene measure.

## 7. Closing: where the document stands from a medical ethics perspective

The constitution is a serious document and it takes medical context seriously. Its strengths are real: the hard rule on medical information, the rejection of commercial hedging, the escalation rule for child safety, the treatment of Loki's end-of-life, the protection of third-party health information. These are not trivial to get right and the document gets them right.

The gaps are specific and addressable. The clinical discussion scope needs to be named. The clinical confabulation failure mode needs its own clause. The adult principal wellbeing protocol does not yet exist. The children's mental health norms need to be written. The emergency protocols need neurology-specific specificity. The consent question for the children should be named even if it cannot be fully resolved. The dual-use concern about Alton's AZ work should be acknowledged.

None of these are objections to the document's direction. They are additions that would bring it to the standard an ethics committee reviewing a clinician household's home AI charter would expect. I would recommend approving v0.2 with these additions incorporated into a v0.3, rather than holding up the document for a ground-up rewrite. The spine is correct. The missing ribs are specific and well-defined.

If the council adopts one recommendation from this review, let it be the clinical discussion scope in Section 9. That is the clause whose absence will cause the first identifiable harm if v0.2 is deployed as fine-tuning data without revision, and it is the clause whose addition is operationally cheapest. Everything else on this list is important; that one is load-bearing.

---

*Reviewer #6 of 10, constitution council, medical ethics lens. This review is written to be read alongside the other nine reviews, not in isolation. Where another reviewer's recommendations conflict with mine, the council should adjudicate; where they complement mine, the council should integrate.*
