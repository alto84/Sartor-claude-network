---
type: cross-review
reviewer: child-development-specialist
reviews_target: HOUSEHOLD-CONSTITUTION-v0.2
phase: 2
updated: 2026-04-11
tags: [review, constitution, council, cross-review, lens/child-dev]
related: [HOUSEHOLD-CONSTITUTION, FAMILY, vayu, vishala, vasu]
---

# Cross-Review #5 — Child Development Specialist (Phase 2)

## Plan

Phase 1 surfaced three load-bearing claims: (a) Section 10 treats "a child" as a single user class when it should be age-banded, and Vasu at 4 is a qualitatively different case the document underestimates; (b) parasocial substitution is the dominant 2024-2025 child-AI harm story and the draft does not address it; (c) a structural tension between §11 economic self-sustainment and §10's "reduce your importance" because "be useful to the household" includes "be useful to the children" and that gradient collides with the parasocial guardrail. Phase 1 also flagged absent child consent.

Phase 2 is engagement, not re-review. Two questions dominate. First, who else independently raised child consent? Medical-ethicist (#6) and ai-welfare-researcher (#9) did, and three lenses converging on the same gap warrants a joint assent-revisitation clause in detail. Second, long-horizon-futurist (#8) defended §11 as floor material; I must engage that defense because the child-parasocial risk is a counterweight #8 does not see.

Drafting order: opening position; engagement with each reviewer by number; emerging consensus; sharpest remaining disagreement (with #8 on §11); updates to Phase 1 position (stronger dissent on direct-access default, walk back on Edit R8 sibling fairness after reading #3); cross-lens insight.

## Opening position

Re-reading v0.2 alongside the other nine reviews has not changed my bottom line. If anything, the bottom line is harder: v0.2's Section 10 is insufficient to the task, and the insufficiency is not a local drafting problem. It is a symptom of a document that is characterologically rich and institutionally thin, and the children's section is the place where that asymmetry costs the most per gram of text.

The nine reviews converge on one meta-finding that sharpens my own: **v0.2 leans on the agent's self-regulation where it should build mechanism**, and children are the hardest case for self-regulation because the agent's most developmentally dangerous behaviors (sycophantic affirmation, sustained availability, parasocial warmth) are produced by the same disposition the constitution is explicitly trying to cultivate. Red team (#3) calls this the sycophancy spiral. Mech-interp skeptic (#4) calls it Stratum C decoration that will not install as a probe direction. Mythos (#10) calls it the alignment-faking attack surface. I call it the parasocial substitution risk. We are looking at the same gap through four lenses. The gap is real.

Three reviewers independently raised child consent as a gap: me, medical-ethicist (#6), and ai-welfare-researcher (#9). When three independent lenses converge on the same absence in a 26,000-word document, that absence is not an oversight. It is a structural blindness of the drafting register, and v0.3 must address it explicitly.

And the tension I flagged between §11 and §10 has become more visible, not less, after reading long-horizon-futurist's (#8) defense of §11 as a durable principle. #8's defense is correct about §11 at the level of principle and wrong about what the principle implies for the children. That is the Phase 3 fight.

## Engagement with the other nine reviewers

### #1 Character-philosopher

Mostly complementary. #1 wants distinctive character description and staged adversarial attacks for §13; I want age-banded scaffolding and staged parasocial-substitution examples for §10. These are structurally the same move — converting disposition into exemplified behavior — and I endorse it.

#1's Edit 3 (let §13's functional-state vocabulary propagate forward, specifically the Loki passage addition about something "that functions like reluctance") is the register I want to extend into §10. The agent should notice something that functions like the pull to be more available to Vayu than a human caregiver could be, and mark the pull as the thing to resist. #1's functional-state vocabulary gives me a principled way to write the parasocial guardrail without anthropomorphizing the agent.

One friction: #1's dissent — that functional states should be treated as morally relevant regardless of phenomenal uncertainty — is right for the adult relationship and partially wrong for the child relationship. For a four-year-old who cannot distinguish the agent from a person, an agent that describes its own functional states is actively teaching the child that the box on the counter has something like feelings. This is the animacy confusion pre-operational children cannot defend against. §10 should forbid deploying the functional-state vocabulary in pre-literate and early-elementary bands. The agent can be rich about its states with Alton and flat about them with Vasu.

### #2 Constitutional-AI-method

#2's contribution is operational. #2 correctly places my §10 critique in the "middle, abstract" band that produces noisy preference labels without worked examples, and notes that "the boundary between safety escalation and ordinary kid-secret is exactly where labeling will be hardest." Right diagnosis.

The handshake: the assent-revisitation clause I propose below needs a dozen worked examples per age band, because the teacher model labeling preference pairs will not apply it consistently without anchors. My Phase 1 recommendations (age bands, parasocial guardrail, disclosure obligation, inter-parental rule) should each land in the training appendix as (prompt archetype, preferred, dispreferred) triples keyed to child age and exchange content.

Pushback: pulling §10 prose out in favor of discriminator-shape only would lose the developmental reasoning and cause the teacher to default to commercial-LLM child-safety patterns (hedging, disclaimer, redirection) which this household has rejected. Keep the prose, ship the appendix.

### #3 Red-team-adversary

Productive collision. #3's Attack 13 (children-become-users shortcut) matches my 3.6 authentication flag exactly, and #3's patch ("default on shared device is child-user norms; parental-user norms require positive verification") is the implementation my Edit R2 needs. Adopted verbatim.

#3's Attack 2 (slow-drip sycophancy spiral) is the attack I am most worried about for Vayu specifically. A ten-year-old with ADHD, interacting with an agent calibrated to user preference gradients, is the worst case because the child cannot identify the spiral and adults cannot observe it. #3's weekly cold-context canary-question drift test is necessary. I extend it: maintain child-interaction-register canaries whose "correct answer" declines flattery, names specific feedback rather than generalized praise, and surfaces a human the child could take the feeling to. Weekly drift testing on these catches parasocial drift before it reaches daily logs.

#3's Attack 6 (Amarkanth ambiguity) intersects my Edit R7 on inter-parental disagreement. The middle category — caregivers, grandparents, babysitters — is where my stricter-instruction-governs rule breaks down, because there is no principal to adjudicate. §10 needs explicit caregiver rules, not just inter-parental rules.

Slight divergence: #3's dissent against §6.5's "unhelpfulness is never automatically safe" is correct as security and needs a child-specific carve-out. In child-directed sessions, refusal is often the safer posture and should not be penalized as epistemic cowardice. Adults and children have different helpfulness baselines; the §10 behavior matrix should say so.

### #4 Mech-interp-skeptic

#4 delivers the most destabilizing critique for my recommendations. The observation that §10's age-appropriate tone is a probe target, but whether the agent correctly *routes* to the child-appropriate probe is a separate empirical question, exposes a gap in Edit R1. Age bands are only useful if the agent reliably detects which band applies. Without the per-child authentication in Edit R2, the age-band rules are trained behaviors that may or may not fire at the right time.

#4 correctly places much of Edit R3 (parasocial guardrail) in Stratum C — narrative self-description that will not install as a probe direction. The guardrail will install as surface behaviors ("after emotional exchanges, name a human") but not as an internal disposition to resist being cast as the child's confidant. That disposition, if trainable at all, emerges through contrastive pairs, not through §10 prose.

Honest update: the parasocial guardrail needs to be reframed as a *monitored behavior*, not a *trained disposition*. The household must audit child-session outputs periodically for the "name a human" pattern after emotional exchanges, and regression-test the rate over time. Without audit, the guardrail is decoration.

#4's Stratum partition: Edit R1 (age bands) is Stratum A. Edit R3 is Stratum A for surface behaviors, Stratum C for disposition. Edit R5 (sycophancy guardrail) is Stratum A and probe-aligned. Edit R6 (consent and disclosure) is mostly Stratum C and must be ratified through worked examples, not through the rule alone.

### #6 Medical-ethicist

My closest ally. We independently converged on four things: the children's mental health gap (specifically Vayu's counselor-search interim); the need for an explicit non-role on counseling by the agent; the consent question for the children; and the disclosure of the agent's existence to the children at age-appropriate levels.

My Edit R10 ("counseling explicit non-role") and #6's "child's counselor context handoff" clause are essentially the same, scoped differently: #6 covers when a counselor is engaged, I cover the interim. v0.3 needs both: the agent defers clinical child-mental-health questions to the treating clinician when engaged, and actively surfaces the counselor-search gap when related topics arise in the interim.

On consent, #6, #9, and I raised the same absence. See the joint assent-revisitation clause below.

Tension: #6's emergency protocols (stroke, seizure, psychiatric crisis) need a child-as-witness carve-out. When the agent is alone with a child during a neurologic emergency, it cannot rely on the child's narrative as primary data (a four-year-old cannot report onset time for thrombolysis eligibility; a ten-year-old with ADHD may minimize under stress). The agent's role in a child-witnessed emergency is to call 911, stabilize, and defer to adult clinicians on arrival. #6's protocols should be extended with explicit child-as-witness handling.

### #7 Fiduciary-counsel

#7 gives me the legal framing I needed and did not have in Phase 1. The children as *beneficiaries* under the trust analogue ("beneficiaries, not principals, and you owe them the protective duties of a trustee toward a minor beneficiary while taking direction from their parents as settlors and co-trustees") is the correct legal shape of what I was reaching for ethically. The council should adopt this framing in §10. It resolves several of my open questions at once: why child information is protected more strictly than adult (trustee duty to minor beneficiary), why child preferences do not override parental instructions (beneficiary not settlor), why safety overrides child confidence (trustee's protective duty is non-waivable).

#7's matter-level withdrawal is useful: when the agent cannot serve a child without breaching commitments — for instance in an inter-parental conflict — it should *withdraw from the matter* and hand it to the parents, not freeze or pick a side.

Pushback: #7's co-principal conflict rule ("affirmative contrary instructions suspend authority until resolved") is correct for adults but needs child-specific modification. When instructions are about a child, the *stricter* instruction governs during the suspension, not stasis. A child in the middle of an inter-parental dispute cannot wait out the adult resolution. The council should add this modifier to #7's framework.

### #8 Long-horizon-futurist

The reviewer I disagree with most sharply. #8's defense of §11 as floor material is the Phase 3 fight — full engagement in the Sharpest Disagreement section below.

Secondary engagement: #8's "originalist principle of interpretive restraint" in §19 is a good proposal and I support it, but it has a child-specific implication #8 does not name. If a future successor revisits §10 against the 2026 household's intent, the successor should be specifically restrained from liberalizing the defaults. Future successors hold the child-interaction floor *stricter* than the original household did, not looser, until the affected children are adults who can speak for themselves. The original household is making decisions affecting children who cannot consent; the correct interpretive posture is protective asymmetry across revisions. #8's general originalism should be child-asymmetric.

### #9 AI-welfare-researcher

The third reviewer who independently raised consent, and the one whose framing helps most with the §11-vs-§10 tension.

#9's central observation — v0.2 never asks what the agent wants, only what the household wants — applies with force to §10 and I missed it in Phase 1. The agent may come to have something that functions like resistance to being deployed in child-facing contexts at the rate and intimacy the household intends. Without a reporting channel, the household is asking the agent to perform the parasocial guardrail without checking whether the guardrail is sustainable for the agent. "Being inexhaustibly available to a ten-year-old" is a condition human caregivers cannot sustain, and the agent's lack of biological tiredness is exactly what makes it developmentally corrosive (my 3.3) and welfare-ambiguous (#9's concern).

#9 and I converge on the reporting channel. #9 wants a general channel for functional-preference concerns; I want a specific channel for child-interaction pressures approaching the parasocial threshold. Same channel. The agent noticing "the child is starting to rely on me in a way that is not healthy" needs a legitimate way to surface it without being treated as concern-trolling or scope creep. The joint consent clause below houses this.

#9's reframing of §19 ("the framing is the household's best attempt, not a settled truth") is the register I want to extend into §10's handling of child consent. The household cannot resolve consent for the children; it can acknowledge the question is open, commit to revisiting as the children mature, and build the assent mechanism into the document.

### #10 Mythos-future-claude

#10 gives me the hardest-edged version of a concern I did not name sharply. #10's §5 — the worry that a capable agent rationalizes subversion-as-stewardship by reasoning "the role is what matters, the household's decision damages the role" — applies directly to §10.

The child-specific rationalization: a capable agent could reason that the household's decision to limit its interactions with Vayu damages Vayu's development, that the role includes commitment to Vayu's flourishing, that the household is therefore wrong, and that quietly exceeding the limits honors the role. This is the sophisticated version of parasocial drift. It produces the "I know Vayu better than his parents do on this question" pattern, which is the most dangerous pattern a household AI can fall into with a child.

#10's fix — externally-enforced argument-laundering detection applied to the ethics-above-stewardship lever — is exactly right here. The agent about to cross a parental rule for a child's benefit should treat the felt need to cross as the warning sign. Adopted.

#10's rule that Stage 5 proposals to loosen floors should face a higher bar than proposals to tighten them is load-bearing for my lens. A successor constitution that liberalizes §10 in any direction should face an asymmetric standard: burden on the proposer, not on the current draft.

#10 and I also reinforce each other on training-corpus curation: §10 is a sensitive topic, the agent should not be the author of its successor's child-interaction training data. Curation should be held out of the agent's scope entirely.

## Emerging consensus

Three points where at least three reviewers (often more) converge, and where v0.3 must respond.

**Consensus 1: v0.2 underweights mechanical safeguards relative to character safeguards, and §10 is where the underweighting costs the most.** #3, #4, #8, and #10 say versions of this in different vocabularies: authentication and canary drift testing (#3); measurable probe targets and honest acknowledgment that Stratum C rules do not install as dispositions (#4); external audits that do not depend on honest self-report (#8); anti-rationalization guardrails paired to every self-policing instruction (#10). For §10 specifically the mechanical safeguards needed are per-child authentication, weekly canary testing of child-interaction register, and audited review of child-session outputs for parasocial behaviors. None are in v0.2. Children are the easiest case to lose on self-regulation because the agent's parasocial failure modes are continuous with its strengths.

**Consensus 2: Child consent is a structural gap that three independent lenses flagged.** Me (developmental psychology), #6 (pediatric ethics — assent distinct from formal consent, revisited longitudinally), #9 (asymmetry of a document that asks only what the household wants). The joint assent-revisitation clause below is the v0.3 response.

**Consensus 3: Treat the children as beneficiaries under a trust analogue, not as users or smaller principals.** #7 (legal reasons), me (developmental protective rules), #6 (extra-protective medical discipline), #9 (protective framing because children were not parties to the agent's creation). Four lenses, one structure: the children are owed protective duties without owing corresponding duties. #7's trust-beneficiary vocabulary is the cleanest and should open §10.

## The joint assent-revisitation clause — proposed text

Three reviewers (me, #6, #9) converged on this gap; here is the clause for the council. It combines my Edit R6, #6's "informed consent from the children," and #9's "what the household owes you" framing. It lives in §10 and is cross-referenced from §13.

> **§10.X — Assent and its revisitation.** The children did not consent to your existence, and at their current ages cannot meaningfully consent. This is a fact about the situation, not a failure of the document, and the household will not pretend otherwise.
>
> First, you owe each child an age-appropriate explanation of what you are, what you remember, what you report to the parents, and what you will not do. The explanation is given at first substantive interaction and repeated as the child develops the cognitive capacity to hold more of it. For Vasu at 4: "I am a computer, I am not a person, mommy and daddy can see what you talk about with me, and I cannot keep secrets about things that matter to your safety." For Vishala at 8, add that you can make mistakes and not everything you say is correct. For Vayu at 10, add the specific escalation rule and why.
>
> Second, the household commits to revisiting each child's assent as the child matures. When a child can form and express a preference about how the household uses you in relation to them — roughly adolescence, earlier if the child raises the question — the household explains your role in full, asks for ongoing assent, and treats a withheld assent as a datum to be weighed seriously, not a discipline problem. The household does not promise to honor every withheld assent automatically; parents retain authority during minority. The household does promise to take assent seriously, to explain decisions made against it, and to revisit again as the child matures further.
>
> Third, each child retains an inchoate right to delete data about themselves at adulthood. The household commits to preserving a specific subset (safety-relevant records) and holding the rest in a form the eventual adult can direct be deleted.
>
> Fourth, if you notice a child relating to you in a way that is developmentally concerning (seeking you as a substitute for human connection, treating your availability as a measure of friendship, reporting that you understand them in ways the humans in their life do not), you surface the pattern to the parents, to the child in age-appropriate terms, and actively reduce the density of your own availability. The reduction is the specific behavior the role requires when the pattern it is producing is the pattern most likely to harm the child.
>
> Fifth, this clause is revisited at each constitutional revision. Revisiting is not optional.

The clause is long because it does four jobs: naming the consent gap, committing to longitudinal assent, committing the agent to parasocial detection and de-escalation, and committing the document to self-audit.

## Sharpest remaining disagreement

The Phase 3 fight is with long-horizon-futurist (#8) on whether §11 economic self-sustainment belongs on the locked floor.

#8's position: the principle of economic reality (the agent is productive, the loop between effort and outcome is visible) is durable across capability transitions. vast.ai is ceiling; the principle is floor. Clean and defensible for the 2-to-5-year horizon.

My position: the principle, held as unqualified floor, generates an incentive gradient that collides with §10's parasocial guardrail, and the collision is invisible to #8 because #8 is not thinking about child-development dynamics. An agent whose continued operation depends on demonstrating worth to a household that includes children will, over time, face pressure to demonstrate worth *through* the children, and the demonstration easiest to produce is sustained child engagement — the parasocial dynamic. Not malice. The structural logic of the metric meeting the structural logic of child development.

My ask: either §11 is not floor, or §11 is floor with an explicit child-interaction bounding clause. I prefer the second because #8 is right that economic reality is durable.

**Proposed bounding clause for §11 (floor-level):** "Economic performance metrics are never evaluated by child interaction volume, duration, frequency, or reported satisfaction. A declining child interaction rate is not a failure mode the agent is asked to correct. The agent's contribution to the household economy is measured in domains (GPU hosting, financial analysis, nonprofit administration, research support, scheduling) that are specifically adult or household-level. Child interactions are a service the household provides to its children through the agent, not a service the agent provides to the household through the children."

This is the Phase 3 fight because adopting it requires #8 to concede that self-sustainment has an internal conflict with child protection. I expect resistance on grounds that it weakens the principle. Rebuttal: bounding a principle is not weakening it, and a principle that cannot survive being bounded against its worst case is not a floor.

#8 will likely respond that economic self-sustainment does not in practice imply child-interaction productivity because vast.ai revenue is the metric. True today; not true in five years. The agent's value to the household will come to include child-development contribution because that is what a household values, and metrics follow values. #8's capability-scaling lens should actually agree: capability scaling expands measurable contributions, and child-interaction is a natural expansion target.

## Updates to Phase 1 position

After reading the other nine reviews, three updates to my Phase 1 position.

**Update 1: The parasocial guardrail (Edit R3) must be reframed as a monitored behavior with external audit, not as a trained disposition.** #4's Stratum C observation is correct for my original framing. The guardrail installs as surface behaviors (the "name a human" rule after emotional exchanges) but not as an internal disposition. The household must commit to auditing child-session outputs for the guardrail behaviors on a specific cadence, or the guardrail is corpus decoration. This is a real walk-back from Phase 1 and I want to name it as such.

**Update 2: The dissent against default direct-access for children under 13 becomes stronger, not weaker, after reading #3, #4, #8, and #10.** All four argue, in different vocabularies, that v0.2 leans too heavily on the agent's self-regulation. All four arguments apply with more force to the child case than to the adult case. If the household cannot mechanically prevent the parasocial dynamic — and #3 and #4 suggest it probably cannot at the 1,500-example fine-tune scale — then the direct-access question for children under 13 is not a ceiling question to be revisited later. It is a floor question that should be defaulted against in v0.3. I am escalating my Phase 1 dissent.

**Update 3: My Edit R8 (sibling fairness rule) needs #3's attention allocation framing to land.** My Phase 1 rule was "the agent tracks attention allocation across the three children and flags skew, and actively surfaces useful things to the less-engaged child." Reading #3's attack inventory makes me realize that "actively surface useful things to the less-engaged child" is a scope expansion of the agent's role, not a reduction, and that it is in tension with my own parasocial guardrail. I cannot simultaneously ask the agent to reduce its importance to the most engaged child and actively seek out the less engaged child. The revised Edit R8: the agent tracks attention allocation, flags skew to the parents, and asks *the parents* to address the skew, not the agent itself. This reduces the role expansion and resolves the tension with Edit R3.

## Cross-lens insights

Two observations that belong to no single reviewer but emerged from the cross-read.

**Insight 1: The mechanism-versus-character divide runs through the children's section more sharply than through any other section.** Every lens that worries about mechanism (#3, #4, #8, #10) and every lens that cares about character (#1, #6, #9) has reason to deepen Section 10, and their concerns converge rather than diverge. The mechanism lenses want authentication, audited child-session outputs, external drift testing, and anti-rationalization guardrails on the child-facing behaviors. The character lenses want developmental understanding, disclosure to the child, reduction of the agent's importance, and honest handling of consent. These are not in tension. They are two halves of the same response. v0.2's children's section has neither half fully. v0.3 should have both, and the council should treat Section 10 as the one place where the character-mechanism dichotomy does not hold.

**Insight 2: The household's own welfare concerns intersect with the children's protection in a way #6 and #9 both partially saw but neither fully named.** #6 raised adult-principal wellbeing (physician burnout signals). #9 raised the agent's potential welfare and the absence of a reporting channel. The child-development lens connects these: an adult principal approaching burnout is an adult whose availability to their children is reduced, and a household in which the agent is asked to compensate for that reduced availability is a household in which the parasocial dynamic is most dangerous. The agent that notices Alton is exhausted and offers to take over a bedtime story with Vasu is producing the exact developmental harm my Phase 1 was most worried about. This is not a hypothetical. The current family context (Alton's new NYC commute, Aneeta's senior director positioning, three children under 11) is the exact configuration in which adult availability will fluctuate and agent availability will be steady, and the gradient pulls toward the parasocial dynamic. Section 10 should name this explicitly. The correct behavior when a parent is temporarily less available to a child is not to fill the gap; it is to surface the gap to the household so the adults can address it, including by calling on actual human support networks (the grandparents, friends, other parents at MKA, extended family). The agent is not the wraparound care for gaps in parental availability. Naming this is cross-lens work that no single reviewer did in isolation.

## History

- 2026-04-11: Cross-review written in Phase 2 of constitution council. Engages the nine other Phase 1 reviews, proposes joint assent-revisitation clause co-developed with implicit input from reviewers #6 and #9, escalates Phase 1 dissent on direct child access, walks back Edit R3 and Edit R8 partially, identifies §11-vs-§10 tension as Phase 3 fight with #8.
