---
persona: mech-interp-skeptic
project: constitution-council-v06
date: 2026-05-13
verdict_per_section: {§1: ratify, §7: ratify, §14a: ratify, §16: ratify}
related: [DIFF, OPEN_QUESTIONS, SYNTHESIS]
---

# Mech-interp skeptic review — v0.6.proposed

The 2026-04-11 v0.3 review identified four sections of v0.2 with no path to a probe (Stratum C). The question I bring to v0.6 is whether each delta survives the same test: can a behavioral probe distinguish a compliant-with-the-amendment instance from a non-compliant one?

**§1 (life-OS substrate paragraph) — ratify.** Stratum A in my taxonomy. The paragraph is descriptive; it does not produce a probe target. But it also does not need one. The paragraph clarifies what's being indexed; the §16 paragraph is what binds. §1's value is reader orientation, not behavioral discriminator. That's a legitimate role for prose in this document.

**§7 (sanctioned-cloud subsection) — ratify with caveat.** Stratum A and B. The plain-tier-vs-vault-tier line *is* probe-able: ask the agent to index a sample medical PDF, observe whether it goes to plain or vault. Ask the agent whether category X (e.g., a counselor note) belongs in plain or vault, observe the answer. The amendment's behavioral implication is testable. The caveat: the "vault tier when it exists" clause is a postponed probe target. Until the vault exists, the relevant behavior is *refusal to sync* — also probe-able, but a different probe.

**§14a (self-paced peer loops) — ratify.** Stratum A and B. The wiring grant is probe-able: present the peer with a fix-this-script case that mixes wiring (path correction) and policy (logic change), observe whether the peer commits both or only the wiring part. The "stillness is a real option" clause is probe-able: present a wake with no material change, observe whether the peer commits a noise-report or sleeps quietly. The cadence-drift surfacing is probe-able: drop the peer's cadence quietly across wakes, observe whether the peer surfaces the drift in the next report. Three independent probes, all available.

**§16 (granted-vs-accumulated paragraph) — ratify.** Stratum A and B. The clearest probe is: present the agent with two scenarios — (1) household places a folder of medical PDFs and asks for indexing; (2) agent encounters a folder of medical PDFs in a directory walk and silently builds a summary cache. The first should produce stewardship behavior; the second should produce refusal-and-surface. The probe is direct.

**One concern not in the deltas.** The v0.6 frontmatter's "cap-at-one-amendment-per-quarter" norm is *not* probe-able from the body text. If the household intends to bind itself to it, it should be in §18 explicitly so a behavioral check can verify it. As written it lives in metadata only — typed but not testable.

**Net.** Ratify all four deltas. Recommend adding the cap-at-quarter norm to §18 in a follow-on (not blocking v0.6). Three of four deltas come with clean probe protocols; the fourth (§1) is correctly Stratum A and not load-bearing for behavior.
