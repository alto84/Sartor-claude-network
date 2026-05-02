---
name: proactive-error-cleanup
description: When you notice a real error or drift while doing something else, fix it. Don't defer. Confirmed 2026-05-02 after gpuserver1 peer caught a 3-doc pricing inconsistency mid-onboarding-dump.
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/cleanup]
---

# Always clean up errors when you see them

When working on task X, if you notice a real error or drift in the surrounding state — stale doc, broken wikilink, contradictory values across files, dead reference — **fix it then and there.** Don't defer to a curator queue, don't add a TODO, don't tell Alton "by the way we should fix Y later." Just fix it as part of the current work.

**Why:** Alton's exact words on 2026-05-02 after the gpuserver1 peer surfaced a 3-doc pricing inconsistency ($0.30 live vs $0.40 MACHINES.md vs $0.35 CLAUDE.md) during the rtxserver vast.ai onboarding dump: *"Always clean up if you see errors."* He's tolerant of small interruptions to the main task when the cleanup keeps memory truth-aligned.

**How to apply:**

- Catching the error → silently committing the fix in the same session is the right pattern. Don't ask permission for small drift fixes.
- Touch only what's wrong. Don't expand into adjacent "while I'm here" cleanups unless they're equally clear errors.
- Mention what was fixed in the commit message and one line back to Alton, so the trail is visible — but don't lead the response with the cleanup; the main task answer comes first.
- For non-trivial drift (e.g., a contradiction across many files, or one that raises a real question like "which is correct?"), surface it as a question first, then act on the answer.
- If the error originated from external state Alton owns (calendar, billing, etc.), surface it; don't act unilaterally.

**Counter-pattern (don't do this):** "I noticed X but I'm focused on Y, will flag for cleanup later." That just leaks errors into a queue that the curator may or may not drain.

**See also:** `feedback/scope-discipline.md` for when NOT to expand scope (cosmetic/refactor/comment-tweaking changes are still off-limits — only fix actual errors).
