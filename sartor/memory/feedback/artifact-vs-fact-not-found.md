---
name: artifact-vs-fact-not-found
description: When reporting "no record" of something, distinguish "the artifact (PDF/email/scan) is not at its expected location" from "the fact about the underlying event is not tracked in memory." The second is load-bearing; the first is operational color. Triggered 2026-05-02 by Climate First $219K disbursement audit.
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/reporting, behavior/precision, memory/federated]
---

# Separate "artifact not found" from "fact not tracked"

Two different questions hide inside "no record of X":

1. **Artifact question** — Is the supporting file (PDF, scanned statement, email thread, signed contract) at the expected location? This is about a *file*.
2. **Fact question** — Is the underlying event documented anywhere in Sartor's knowledge state? This is about *what we know*.

When relaying findings to Alton, the fact question is the load-bearing one. He cares whether Sartor *knows* about the $219K disbursement, not whether the bank's PDF happens to live in Drive. Conflating the two produces false-alarm reports that look like memory gaps but are really filing-cabinet observations.

**Why:** search-first-auditor's 2026-05-02 audit, Incident #4. A Drive-cataloging subagent reported "actual loan disbursement statement is not [in Drive] — likely in Gmail," and that observation got conflated upward into "no record of the Climate First disbursement." The disbursement IS recorded, to the dollar and to the date, in `sartor/memory/business/solar-inference.md:21` ("$219,414.50 released from Climate First Bank to Lucent Energy around 2026-03-15") and is flagged as the single most important item on the Solar Inference docket. The artifact (the bank's disbursement statement PDF) was indeed not in Drive. The fact was — and is — fully tracked.

**How to apply:**

1. **Run the fact question first.** Federated `Grep` across the whole repo for the underlying entity, amount, date, or counterparty. See [[federation-grep-before-delegation]]. If hits exist, the fact is tracked — say so, regardless of artifact location.
2. **Run the artifact question separately, and label it as such.** "The PDF is not in Drive; likely in Gmail" is fine to report — as a filing observation, not as a memory gap. Use the words "artifact" or "supporting file," not "record."
3. **When both come up empty, state both negatives.** "The fact is not in memory AND no supporting artifact found in Drive/Gmail/disk" is a real memory gap and a real reason to flag to Alton. The combined claim should appear together so Alton knows you ran both checks.
4. **When a subagent's report blurs the two, separate them in your relay.** The subagent's "the disbursement statement is not [in Drive]" is an artifact observation. Do not promote it to "no record of the disbursement" in your summary. If you have already memory-grepped the fact, lead with what memory says; the artifact note follows as color.

**Counter-pattern:** Reporting "no record of X" when what you actually checked was a single artifact location. The phrase "no record" implies the fact question was answered; if you only ran the artifact question, you are misrepresenting the search and risking a false alarm to Alton.

**Counter-pattern:** Treating Drive/Gmail catalog gaps as memory deficiencies. The federated wiki and the artifact filing system are different stores with different completeness guarantees. A fact landed in the wiki via `personal-data-gather` does not require the underlying PDF to be in Drive for the fact to count as "tracked."

**See also:** [[search-memory-first]] (the federation map — where facts live), [[federation-grep-before-delegation]] (running the fact question is cheap), [[subagent-scope-discipline]] (catalog subagents answer the artifact question; their reports are not memory verdicts), [[trust-but-verify-subagent-reports]] (the orchestrator's job is to translate "subagent says PDF missing" into the right Alton-facing claim).
