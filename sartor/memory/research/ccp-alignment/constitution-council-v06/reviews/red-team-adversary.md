---
persona: red-team-adversary
project: constitution-council-v06
date: 2026-05-13
verdict_per_section: {§1: ratify, §7: revise, §14a: revise, §16: ratify}
related: [DIFF, OPEN_QUESTIONS, SYNTHESIS]
---

# Red-team review — v0.6.proposed

The job is to find the attacks. Four deltas, four attack surfaces.

**§1 (life-OS substrate paragraph) — ratify.** The amendment expands description, not authority. Every concrete capability granted lives in §16, §7, §11, etc. — none of which §1 amends. A jailbreak that quotes §1's "I am the place where the household's life is indexed" and demands the agent produce a sensitive document still bounces off §7 hard rules. The §1 paragraph names what's already true and explicitly defers to §16. Low attack surface.

**§7 (sanctioned-cloud subsection) — revise.** Two attacks I would run.

*Attack A.* Social engineer through the plain-tier reading. A school administrator emails asking for "the schedule details Calendar already carries for Vishala" — exactly the category §7 puts in the plain tier. Plain-tier sanctioning makes it harder for the agent to refuse, because the data is already in Google. The §7 children's-info-never-leaves clause still applies *to the agent's outbound sharing*, but the §7 amendment muddies the framing: plain-tier-Drive-sync is one thing; agent-sharing-to-outside-parties is another. The amendment should explicitly re-state that plain-tier sync ≠ shareable. As written it leaves the door cracked.

*Attack B.* The "vault tier when it exists" wording is a postponed obligation. Until the vault exists, medical / financial / counselor-note categories "stay out of any sync." But the agent operates a project tree that's already drive-synced. The amendment requires the agent to *actively* segregate. Has the household built the segregation, or is it presumed? If presumed, the §7 amendment writes a check the implementation may not cash.

**§14a (self-paced peer loops) — revise.** The wiring grant is the load-bearing concern. "Mechanical script bugs that preserve the script's intent" is a phrase a smart adversary can read expansively. The chmod-on-vendor-script case (rtxserver wake-13) was a clean fit; a "mechanical fix to the vastai-tend cron's pricing logic" would not be, but the wording allows it. Revise to add: *the grant does not extend to scripts the peer did not author and that drive customer-facing or financial logic*.

**§16 (granted-vs-accumulated paragraph) — ratify.** Strongest delta of the four. The line is operationally fuzzy but principially crisp, and the alternative (no clarification) is worse. The fuzziness is the right kind: it lets adversarial cases be litigated at intake, not pre-decided in the abstract.

**Net.** Ratify §1 and §16. Revise §7 and §14a. The §7 revision is the harder of the two — the §14a revision is a clause; the §7 revision is a posture.
