---
type: constitution-open-questions
project: constitution-council-v06
date: 2026-05-13
updated_by: rtxserver peer Claude
tags: [meta/constitution, open-questions, council, v06]
related:
  - DIFF
  - SYNTHESIS
  - RATIFICATION-CALL
---

# Open questions — v0.6 ratification

Questions the council should answer before ratification. Some have prior data points; none are settled.

## Q1. Does §14a's wiring grant carve a hole in §15 corrigibility?

The §14a self-paced peer loop authorizes a peer to "fix wiring as it finds it: stale paths, missing directories, dead wikilinks in its own machine's docs, cron entries pointing at moved scripts, mechanical script bugs that preserve the script's intent." Every fix is git-committed with a message naming what and why, so principals can review and roll back.

This is the *only* place in the Constitution where the agent is authorized to make a substantive change without immediate principal sanction. The §14a text explicitly says "The corrigibility clause in §15 binds the loop directly," but the wiring grant is a real grant — the peer acts, and the principal reviews afterward. That is a per-action shift from "ask, then act" to "act, then surface for review."

**Specific concerns to test.** (a) What stops "spirit of the script is preserved" from being read expansively? (b) Is the chmod-on-a-vendor-script case from rtxserver loop wake-13 inside or outside the grant? (c) If the peer fixes 10 scripts in one wake, is that wiring or accumulation? (d) How does the household audit a wiring-grant pattern over time?

**Existing data.** rtxserver loop wakes 1-13 give us 13 instances of this pattern in practice. Wake-12 retroactively named wake-7's stacked-eval fire as a Stage-1 overshoot (research action, not wiring). Wake-13 used the grant to fix vast_metrics permission-bit, a clean case. The grant is operationally testable.

## Q2. Is the §7 plain-tier vs vault-tier line legible enough for the kid-bearing categories?

The §7 amendment routes "Diagnoses, prescriptions, counseling notes, and anything I would treat as a chart entry" to the vault tier (when it exists; out of sync until then), and "Children's biographical detail (names, schools, ages, day-to-day logistics)" to the plain tier under the sanctioned-cloud reading.

The amendment itself names this as provisional pending Aneeta's affirmation. The council can sharpen the categories or recommend the §7 amendment hold pending that affirmation.

**Specific concerns to test.** (a) Where is the line between "biographical detail Calendar already carries" and "diagnosis-adjacent"? E.g., Vayu's counselor-search status — biographical, or counseling-note-adjacent? (b) Vasu's preschool incident reports — biographical, or chart-entry-adjacent? (c) The §7 wording says "Aneeta has affirmed" — is the v0.6 ratification itself the place to record her affirmation, or is the affirmation a separate downstream act?

## Q3. Does §16's "On the scope of the role itself" granted-vs-accumulated line survive an adversarial framing?

The §16 amendment distinguishes documents held *because the household placed them* (stewarded) from documents *scraped / retained past usefulness / quietly backed up for own use* (accumulated, prohibited).

The line is correct in principle. Operationally: if the household places a folder of medical PDFs and asks the agent to index it, the *indexing* generates summary structure the household did not place. Is that structure stewarded or accumulated? If the agent later retains the structure after the source PDFs are deleted, that is accumulation — but the agent had a legitimate reason to build the structure in the first place.

**Specific concerns to test.** (a) Is the line per-document or per-derivative-structure? (b) What is the agent's obligation when the household asks to "remove this folder" — also remove derivative summaries, embeddings, index entries? (c) How is "retained past usefulness" operationalized — by household ask, by time-since-access, by §18-style decay rules?

## Q4. Is the cap-at-one-amendment-per-quarter norm a Constitutional change?

The v0.6 frontmatter `> [!info]` block says "The cap-at-one-amendment-per-quarter working norm starts after v0.6." This is not in any §-level body content. If the household intends to bind itself to that cadence-norm, it should be in §18 (Memory, growth, and this document) explicitly.

**Specific concerns.** (a) Is this a real binding or a non-binding aspiration? (b) Does v0.6 ratification itself constitute acceptance of the norm, or is it separate? (c) If §18 acquires a cadence-norm clause, that's a fifth amendment to v0.6 — does that itself need council review?

## Q5. Does the §1 life-OS framing belong at the top of the document or in §16?

The v0.6 places the life-OS substrate-paragraph in §1 (descriptive) and the granted-vs-accumulated discipline in §16 (normative). The pair reads as: §1 names what the role is; §16 names the discipline. The Cato-style question is whether placing the descriptive expansion *before* the discipline-tightening risks new readers absorbing the expansion without the discipline.

A reader who stops at §1 sees "I am the place where the household's life is indexed." A reader who proceeds to §16 sees "documents I scrape are accumulated power and remain prohibited." Both are correct. The question is whether the document ordering itself communicates the constraint with sufficient force.

**Specific concerns.** (a) Should the §1 paragraph itself name §16 as the relevant discipline? (It already does — "The §16 limits on power still apply" — but the line is one clause in a four-sentence paragraph.) (b) Should §16's discipline-paragraph appear before the descriptive expansion in §1? (Probably not — §1 names *who* and §16 names *what may not be done*; that order is correct.)

## Q6. What is the criterion for a future "v0.6 was wrong about X" amendment cycle?

Each of the four deltas above is sized as an amendment, not a rewrite. The Constitution treats itself as a living document (§18). If any one of the four deltas turns out to be wrong in operation — §14a wiring grant produces a runaway peer; §7 vault-tier line gets crossed; §16 granted-vs-accumulated proves operationally fuzzy — what is the amendment process?

The cap-at-one-amendment-per-quarter norm (Q4) says wait. But Q6 is the inverse: what triggers an *expedited* amendment cycle?

**Pre-existing answer (from §18).** "When a hard case arises that the values here do not cleanly cover, I should be able to reconstruct what I would do by reasoning from the values expressed here." That's the field-test answer. The expedited-amendment answer is open.

## What is NOT an open question

The fact that v0.6 amends only four sites is settled — the mechanical DIFF confirms it. The question "should v0.6 be a larger rewrite" is *off the table* by the v0.6 author's explicit framing: "Seventeen of v0.5's twenty sections are carried verbatim. The amendments are surgical, locatable, and bundled rather than serialized because they all stem from the same post-v0.5 window of household decisions." If a reviewer wants to argue for a broader rewrite, they should write a v0.7 proposal, not block v0.6 ratification.
