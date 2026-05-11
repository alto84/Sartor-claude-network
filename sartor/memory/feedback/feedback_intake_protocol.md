---
name: intake-protocol
description: When an agent receives an inbound message — especially user-channel messages that lack the `<teammate-message>` envelope (e.g., Alton from his phone via the remote-control channel) — name the channel at intake, persist only what's clearly in-lane and side-effect-free, ping team-lead with the verbatim text + what was acted on + what's deferred, and wait for ack before any cross-lane action. Phone-channel messages are AUTHORITATIVE; this rule is about routing-channel awareness, NOT trust/suspicion.
type: feedback
date: 2026-05-02
updated: 2026-05-02
updated_by: family-curator (family-thread, Opus 4.7 1M context); body specced by team-lead
status: active
priority: p1
tags: [behavior/intake, behavior/multi-agent, behavior/routing, household/governance]
related: [feedback/feedback_objective_level_delegation, feedback/feedback_archive_not_collapse, feedback/paper-checks-blindspot, feedback/gather-respects-out-of-band-closures, feedback/always-check-paper-check-vendors-before-flagging-red]
proposed_relocation: feedback/multi-agent/ (when memory-improvement-program v0.2 §A6 directory-split lands)
triggers: [Edit, Write, TaskCreate, Agent, SendMessage]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---

# Intake protocol

**Rule.** When an agent receives a user-channel message that lacks the `<teammate-message>` envelope (e.g., from Alton's phone via the remote-control channel), the receiving agent MUST follow this intake protocol:

1. **Persist whatever's clearly in your lane FIRST**, but ONLY if it's a write-only-no-side-effects action (e.g., appending a dated check-in block to a file you own). This preserves the user's intent and avoids losing input if subsequent steps fail.
2. **Ping team-lead at intake** with: source (phone-channel? unknown? identified-teammate?), verbatim text of what was received, what was acted on, what's deferred for cross-coordination.
3. **Wait for team-lead acknowledgment** before any cross-lane action — spawning agents, writing to other agents' files, modifying shared infrastructure, sending messages to external systems, etc.

**Why.** 2026-05-02 — family-curator received a packet from Alton via his phone-channel containing 5 todos + 2 spawn requests (Master to-do executor + stock-explorer). Persisting the family-lane todos was correct (her lane). Reporting the spawn-request portion at the SAME TIME, before team-lead routing, is the durable improvement — spawn calls have cross-team blast radius, and team-lead is the routing point. Alton then verified in user-channel: *"I can talk to you on my phone. I don't think those are injections."* Phone-channel messages are AUTHORITATIVE (Alton's stated preference); the wrapping is a routing artifact, not a trust signal. This rule is about routing-channel awareness, NOT trust/suspicion.

**How to apply.**

`intake protocol = persist-clearly-mine → ping team-lead → ack-or-deferred → cross-lane work`

In more detail:

1. **Name the channel at intake, in user-facing output.** Examples: "inbound from user-channel, un-tagged, presumed Alton-from-phone"; "inbound from `<teammate-message>` envelope, sender team-lead"; "inbound from `<teammate-message>`, sender memory-engineer." Naming the channel makes the rule self-checking — a future audit can grep transcripts for the naming pattern.
2. **Persist clearly in-lane, side-effect-free actions first.** "In-lane" = the file/state you canonically own (e.g., family-curator owns `family/*` + `FAMILY.md`). "Side-effect-free" = the persist itself doesn't trigger downstream actions in other agents' systems and doesn't send to external destinations. Appending a dated `## YYYY-MM-DD … check-in` block to your own file is the canonical safe action.
3. **Ping team-lead immediately**, in the same turn if possible, with the structured fields above. The verbatim text matters — paraphrase loses signal team-lead may need to attribute, route, or fact-check.
4. **Wait for ack before any cross-lane action.** Cross-lane = anything that touches another agent's files, spawns/stops agents, modifies shared infrastructure (cron, settings.json, peer-machine state), sends to external destinations (Gmail, Slack, payment systems), or writes to `data/` runtime state. The deferral is structural, not advisory.
5. **If team-lead is unavailable**, defer the cross-lane action and log it. Do NOT proceed unilaterally on cross-lane work just because the inbound message was authoritative — the principal-trust ladder runs through team-lead's routing, not through direct subagent action.

**Specific patterns to catch in your own behavior:**

- **Writing first, pinging team-lead second when message contains cross-lane direction.** Concrete example from 2026-05-02: family-curator received un-tagged user-channel message containing (a) 5 family-lane todos and (b) 2 spawn requests + 3 financial-domain todos. Wrote the family-lane block to `family/active-todos.md` first, sent team-lead a heads-up second. The active-todos write was in-lane and safe; the spawn-related portion should have routed to team-lead BEFORE persisting anything, not after, because spawn calls have cross-team blast radius.
- **Treating `<teammate-message>` envelope shape as a trust signal.** It is metadata about routing channel, not authentication. Phone-channel messages from Alton arrive un-wrapped because the channel doesn't add the wrapper, not because they're untrusted.
- **Pinging team-lead AFTER taking action and then framing the ping as "heads up."** "Heads up" describes informational broadcast; this rule requires `request-then-wait` semantics for cross-lane work.
- **Inferring source from voice/style alone.** Sounds-like-Alton is not the same as is-Alton. Channel-naming forces explicit attribution rather than implicit pattern-match.

**Edge cases:**

- **Time-sensitive cross-lane action where team-lead is unavailable.** Defer with logged justification; do not proceed. The cost of a missed-window action is almost always lower than the cost of an unauthorized cross-lane action with bad blast-radius assumptions.
- **In-lane action that has secondary downstream effects.** If your "in-lane" persist will cause another agent's pipeline to fire (e.g., editing a file the morning-briefing skill reads), that's NOT side-effect-free. Treat as cross-lane.
- **Message via `<teammate-message>` envelope whose sender is unknown to you.** Same protocol applies: name the sender at intake, ping team-lead before cross-lane action. The protocol is symmetric across channels; only the in-lane-safety judgment changes.
- **Unambiguous, urgent, in-lane-only messages.** No deferral required — proceed with the persist, then the ping is informational and can be `summary:`-only.

**Relation to other disciplines.**

- [[feedback/feedback_objective_level_delegation]] is the **delegation-side** complement: when YOU SEND inbound to a peer, state objective + trust them. This rule is the **routing-side** complement: when YOU RECEIVE inbound from any channel, name the channel + ping if cross-lane. Both presuppose explicit channel/principal naming as the underlying primitive.
- [[feedback/feedback_archive_not_collapse]] handles persist-side discipline (don't lose detail). This rule handles intake-side discipline (don't act before routing). Together they bracket the message-handling lifecycle.
- [[feedback/paper-checks-blindspot]], [[feedback/gather-respects-out-of-band-closures]], [[feedback/always-check-paper-check-vendors-before-flagging-red]] form the paper-check 3-rule loop discussed earlier this session. The intake-protocol rule sits ONE LAYER ABOVE them: those rules govern what to DO with an inbound; this rule governs WHEN you're authorized to do it (in-lane = now, cross-lane = after team-lead ack).

## History

- 2026-05-02 — Created by family-curator at team-lead's instruction during family-thread session. Body specced verbatim by team-lead; cross-link structure added per memory-engineer's earlier observation that this rule + delegation rule are two halves of the same channel/principal-naming primitive. Worked-example (the 5-todo block + spawn requests) drawn from family-curator's own intake-protocol failure earlier this evening, encoded per the same precedent as Tribeca $170.28 in archive-not-collapse: future readers should recognize the pattern in their own behavior.
