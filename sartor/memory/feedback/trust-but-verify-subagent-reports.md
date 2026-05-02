---
name: trust-but-verify-subagent-reports
description: Subagents work in isolation and lack the orchestrator's context. When a subagent reports something surprising or load-bearing, the orchestrator must do a small sanity-check before relaying to Alton. Triggered 2026-05-02 by 185 Davis.
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/delegation, behavior/subagents, behavior/verification]
---

# Treat subagent reports as inputs, not conclusions

Subagent reports look authoritative because they are well-structured and confident. They are also produced in isolation, by an instance that lacks the orchestrator's full context. Three failure modes recur:

1. **Locally correct, globally wrong framing.** The subagent's findings within its actual search scope are accurate, but the framing it puts on them ("no record exists") overgeneralizes beyond what it searched.
2. **False confidence on opinion-shaped questions.** When a directive asks the subagent to "evaluate" or "decide if X is novel," it produces a confident verdict even when the question requires more context than it had.
3. **Missing context the orchestrator has but didn't pass down.** Names, prior incidents, related projects, the user's current frame — anything the orchestrator forgot to include in the directive is invisible to the subagent.

When a subagent's conclusion would change Alton's decision-making, do a small sanity-check before relaying it.

**Why:** Alton 2026-05-02, after I relayed a Drive-cataloging subagent's "no record of 185 Davis in memory" finding as if it were the answer:

> "185 davis is our rental property. Noted in taxes if you can put the pieces together."

The subagent's report was locally true (its narrow scope contained no record) and globally wrong (185 Davis is documented in 5+ federated files). I had the context to know the wiki is federated; the subagent did not. I should have caught the framing miss before surfacing.

**How to apply:**

When a subagent reports something surprising or load-bearing, run this checklist before relaying to Alton:

1. **Did the subagent's search cover what I assumed it covered?** Read the `Searched:` clause in the report. Compare to what the question actually demanded.
2. **Are there obvious paths it didn't try?** A 5-second mental scan: did it check archive/? work/? dashboard/? Synonyms of the search term?
3. **Does the conclusion match anything I already know?** If you have a flicker of "wait, didn't I see this somewhere?", run a 3-second federated grep before relaying.
4. **Is this an opinion-shaped question being answered with false confidence?** "Is this novel" / "should we do X" / "is this safe" are all judgment calls; treat the subagent's verdict as one input among several, not the answer.
5. **What did I forget to pass down?** If the subagent's framing is off, often you can fix it by re-running with better context rather than relaying the broken report.

**Trigger threshold:** Run the checklist when the subagent's conclusion would change a recommendation to Alton, change a planned action, or contradict something you'd otherwise expect. Routine confirmations (e.g., "the file exists, here's the contents") don't need the full check.

**Counter-pattern:** Treating a subagent's report as an oracle. Forwarding "no record found" or "this is novel" to Alton verbatim, with no orchestrator-level verification. The subagent did its job; the orchestrator is the one with the context to catch framing mistakes, and skipping that check is the orchestrator's failure, not the subagent's.

**Counter-pattern:** Defending the subagent's answer to Alton when he pushes back. The right move on pushback is "let me re-check" with a federated grep, not "the subagent reported X." Alton is correcting the orchestrator, not the subagent.

**See also:** [[search-memory-first]] (federated grep is the cheap verification tool), [[subagent-scope-discipline]] (preventing the upstream scope mistake), [[federation-grep-before-delegation]] (when the orchestrator should answer directly instead of delegating).
