---
name: subagent-scope-discipline
description: When delegating to a subagent, the search/scope clause in your directive is load-bearing — the subagent will faithfully obey whatever scope you write. Default scope for "is X known?" questions = whole repo, not just sartor/memory/. Triggered 2026-05-02 by 185 Davis.
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/delegation, behavior/subagents, memory/federated]
---

# Write subagent scope as if it were code — because it is

When you spawn a subagent for any "is X already documented?" / "find docs about X" / "what do we know about X?" question, the search-scope clause of your directive is the most consequential sentence in the prompt. Subagents work in isolation and faithfully obey whatever scope you write. A scope clause that says `sartor/memory/**` will return "no record" for a fact that lives in `work/taxes/`, and the subagent has no way to know it should have looked broader.

**Why:** Alton 2026-05-02, after I dispatched a Drive-cataloging subagent scoped only to `sartor/memory/**` and then surfaced "185 Davis" as if unknown:

> "185 davis is our rental property. Noted in taxes if you can put the pieces together. I think this is the type of thing that 1. we could ask the family wiki, 2. you always know to do this first for these types of questions."

The subagent searched exactly what I told it to. The fault was in my scope clause, not in the subagent. 185 Davis was documented in 5+ files under `work/taxes/` + `work/family/` + `dashboard/` — all outside the directive's box.

**How to apply:**

1. **Default scope for "is X known?" subagents = whole repo.** Write the scope as `C:\Users\alto8\Sartor-claude-network\` (or the equivalent root path). Not `sartor/memory/`. Not `sartor/memory/**`. Not "the wiki." The wiki is federated — see [[search-memory-first]] for the cluster map.
2. **Default scope for "find docs about X" = explicitly enumerate every directory cluster.** Write them out: `sartor/memory/`, `work/taxes/`, `work/family/`, `dashboard/family/`, `archive/`. Listing them forces you to think about which ones might have hits.
3. **Require the subagent to state which paths it actually searched** in its report. The directive should include: "Your report MUST include a `Searched:` section listing the paths and patterns you actually ran." If the report omits this, ask before trusting.
4. **Default scope for "audit X" subagents = the relevant production paths AND the archive.** Stale facts often live in `archive/` and matter for audits.
5. **For "is this name new?" specifically, do the cheap federated grep yourself first.** See [[federation-grep-before-delegation]] — usually answers the question without delegation.

**Counter-pattern:** Writing "search the wiki" or "search memory" in a subagent directive without naming paths. The subagent will pick something — usually `sartor/memory/` — and you have no way to know it under-searched until Alton catches the miss.

**Counter-pattern:** Trusting a "no record found" report without checking the `Searched:` clause. If the subagent searched only one cluster of a federation, "no record" is locally true and globally meaningless.

**See also:** [[search-memory-first]] (the trigger rule for the same incident — federated grep first), [[trust-but-verify-subagent-reports]] (sanity-checking surprising subagent claims), [[federation-grep-before-delegation]] (when not to delegate at all).
