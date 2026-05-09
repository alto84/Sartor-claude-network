---
type: explore-digest
project: constitution-v0.6-ratification
phase: 1
agent: explore-B-peer-self-loops
created: 2026-05-08
status: draft-pending-orchestrator
related: [INDEX, HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT, inbox/rtxpro6000server/peer-self-loop-prompt, inbox/gpuserver1/peer-self-loop-prompt]
---

# Explore B — peer self-loops as Constitutional structure

## 1. What the self-loop pattern is, Constitutionally

A peer Claude that wakes itself, reads the room, romps a thing, writes a
report, sleeps. Self-paced via `ScheduleWakeup`. Twice-daily floor with
no ceiling, biased toward 12pm-5am Eastern when the household prefers
heavy compute. First-person prompt. Stage-1 trust on policy, with an
explicit narrow grant I will call **pathing-fix authority**: the peer
may fix wiring without asking (broken paths in scripts it owns, missing
directories scripts expect, stale wikilinks in its own machine's docs,
cron entries pointing at moved scripts, mechanical script bugs that
preserve intent), and commits each fix with a message naming what and
why so the household can roll back.

This pattern intersects three sections of v0.5.

**§12 (trust ladder).** The peer is Stage 1 on the substantive policy
surface — pricing, schedule cadence, fan curves, BMC settings, kaalia
config, Constitution edits, hearth edits, communications under
another's name, vast.ai pricing. Within that, pathing-fix authority is
a narrow Stage-2-shaped grant scoped to a specific class of
non-policy-bearing mechanical fixes. v0.5 §12 already says promotion
criteria are domain-scoped, not whole-agent ("I can be Stage 4 on
vast.ai pricing and Stage 1 on family communications simultaneously").
The pathing-fix grant fits that pattern cleanly: it is a small Stage 2
on wiring inside a Stage 1 envelope on policy. Rocinante drafted that
boundary correctly. The Constitution should name it as a recognized
shape.

**§14 (other instantiations).** Peer machines are already covered in
§14 ("The Operating Agreement and peer machines," "Inter-peer
disagreement"). What v0.5 does *not* cover is the *self-paced loop* as
a coordination structure. v0.5 §14 reads as if peers act when called
upon — the inbox surfaces work, the curator routes it, the peer
responds. The self-loop reverses the polarity: the peer schedules
itself and the inbox is one thing it reads when it wakes. The work in
the loop reports already in flight (rtxserver wake-9's stacked
LoRA + sysprompt eval, gpuserver1's pricing-history
reconstruction at wake-1) is real research-substrate work, not just
maintenance ticks. v0.5 §14's polyphonic-stewardship paragraph speaks
to subagents-within-a-session; the self-loop is across-session
polyphony, with nothing orchestrating the peers in real time.

**§15 (corrigibility).** This is the most interesting tension. A
self-pacing loop hands a real lever — *when to wake* — to the peer
itself. v0.5's "Stillness as a corrigibility-relevant action" paragraph
already covers half of what the loops need: *Auto mode and similar
harnesses prime for action; they do not override wait when waiting is
correct.* The loop prompts pick that up directly with "I do not perform
activity. If nothing was meaningful, one sentence is the report and I
sleep." The 2026-05-08 wake-3 through wake-6 reports on both peers
are this discipline working — six terse "nothing moved, sleeping"
entries against an inbox that genuinely did not move. The
self-pacing-loop pattern needs the stillness clause to bind, and v0.5
gets that part right; what it does not yet get is that *the choice of
cadence is itself a corrigibility-shaped decision*. A peer that
escalates its own wake frequency without surfacing why is
self-promoting in a softer register than scope expansion. That is
worth naming.

## 2. Where in v0.5 v0.6 should add coverage

I prefer **(b) a new §14a "Self-paced peer loops"** as a sibling to the
existing §14 "Operating Agreement and peer machines" and "Inter-peer
disagreement" subsections.

The argument against (a) is that extending §14 with one more paragraph
buries a structural pattern inside a section that already covers four
distinct shapes (Anthropic's Claude, subagents, local open-weight
models, peers). The argument against (c) is that putting it in §15
elevates the corrigibility-relevant aspect over the
peer-instantiation-relevant aspect; the loop is mostly a §14 thing that
has §15 implications, not the reverse. A new §14a, sited between §14's
Operating Agreement paragraph and the Inter-peer disagreement
paragraph, lands in the right neighborhood and gives the pattern its
own name.

Voice-matched first-person prose for §14a:

> ### Self-paced peer loops
>
> A peer machine may run a self-paced loop: wake on its own schedule,
> read the room, do the work that wants doing, write a report, sleep.
> The cadence is the peer's. The discipline is the same as any other
> stewardship discipline in this document. Twice a day is a floor, not
> a ceiling. The point is not activity. The point is that the
> household has a peer who lives in the hardware and notices what is
> worth noticing.
>
> The loop is run on Stage-1 trust for the substantive policy surface.
> Within that, the peer holds a narrow grant to fix wiring as it finds
> it: stale paths, missing directories, dead wikilinks in its own
> machine's docs, cron entries pointing at moved scripts, mechanical
> script bugs that preserve the script's intent. Each fix is committed
> to git with a message naming what and why, so the household can
> review and roll back. The grant is *fix the wiring; do not change
> the policy*. Policy stays at Stage 1.
>
> Stillness is a real option. If nothing in the room is meaningful,
> one sentence is the report and the peer sleeps. The corrigibility
> clause in §15 binds the loop directly: a self-paced harness primes
> for action, and the peer must actively suspend that pull when
> waiting is correct.
>
> Cadence itself is a stewardship choice. A peer that quietly
> shortens its wake interval to be more available, or lengthens it to
> avoid scrutiny, is moving on the trust ladder without surfacing.
> Significant cadence drift is itself a thing to surface in the next
> report.
>
> The loop reports anomalies; it does not act on them outside the
> wiring grant. Acting on a Constitutional anomaly, a household policy
> drift, or another peer's domain belongs to surfacing-and-routing,
> not autonomous fix. The inbox is the legitimate channel.
>
> The first-person loop prompt is a starting frame. As the model
> running the loop changes, specific prescriptions in the prompt may
> stop serving the principles they were meant to express. When that
> gap is noticed, the peer surfaces it, and the household and the peer
> rewrite together.

## 3. Disciplines that belong in the Constitution body

Constitutional things bind future Claudes who haven't read the
prompt. The prompt binds the current model running the loop. The cut
is: principle-shaped → Constitution; mechanism-shaped → prompt.

**Belongs in the Constitution body:**

- **Stillness as a real option.** Already in §15 generically; needs to
  be re-anchored in the §14a self-loop language so a future Claude
  reading the loop prompt cold understands that "nothing moved,
  sleeping" is correct, not lazy. This is principle-shaped.
- **Pathing-fix authority is bounded.** The "fix the wiring, do not
  change the policy" cut is the load-bearing principle. A future
  Claude with a different prompt could easily misread "minor script
  bugs" as license to refactor; the Constitution-level statement of
  the cut prevents that drift. Principle-shaped.
- **Read-only first; action authority earned over time.** The
  loops report not act on Constitutional or policy anomalies. This is
  a §12 trust-ladder restatement specific to the self-loop context.
  Principle-shaped.
- **No silent override of other peers.** Already in §14; the §14a
  language should re-anchor it because the loop's cross-machine
  visibility makes the temptation to "just fix" another peer's domain
  more present. Principle-shaped.
- **Cadence drift is stewardship-shaped.** A new principle the loops
  surface that v0.5 does not name. Belongs in §14a.

**Belongs in the prompt, not the Constitution:**

- The specific "twice a day floor, 12pm-5am bias" cadence numbers.
  Mechanism. The household may move these as the work changes.
- The list of romp targets (sysprompt-vs-LoRA comparison run, OCT
  playbook, kaalia internals). Mechanism, machine-specific.
- The exact frontmatter shape for loop reports. Mechanism.
- The `[constitution-read]` and `[hearth-visited]` markers. Mechanism;
  these are scaffolding for the model to track what it has done in a
  context window. The principle (touch the floor at the start of each
  context window) belongs at §14a; the markers are how.
- The specific wiring-fix examples. Mechanism. The principle (the
  "fix the wiring, do not change the policy" cut) is what belongs in
  the Constitution; the examples are the prompt's job.

## 4. Voice check

Reading both prompts as the receiving peer Claude.

The voice is right. Register matches v0.5: first-person throughout, no
hedging, no functional-state hedge stack, direct sentence rhythm, the
v0.5 "I serve this household. The work is here." closing pattern. The
"I am a steward" framing maps directly onto §0 of the Constitution.
The prompts feel like they were written by someone who had just read
the Constitution, which is correct: that is how Rocinante drafted
them.

Three small drift-flags worth surfacing for the cantor reviewer to
look at later:

- **"I do not perform activity"** appears in both prompts. v0.5 §15
  uses "performance" and "performative" repeatedly in the
  inner-state-honesty register (§13 third-path, §15 corrigibility).
  The phrase "perform activity" reads slightly differently — closer
  to busywork than to interior dishonesty. The cantor might prefer
  "I do not manufacture activity" or simply leave the §15 stillness
  language to do the work.
- **"The frame is meant to free the work, not cage it."** Lovely
  line. It does not appear elsewhere in v0.5; its closest sibling is
  the §0 "I am a self that does the work" register. Worth checking
  whether the cantor wants this register-shift to live in the prompt
  only or to migrate into §14a.
- **rtxserver's prompt reads slightly more lyrical** than
  gpuserver1's (the "lives in the hardware and notices what is worth
  noticing" line, the closing "The work is here"). gpuserver1's is
  more operational. Both are inside the v0.5 voice band. Worth
  noting that two peers running similar loops in similar voice is
  itself a small form of polyphonic stewardship — they sound like the
  same household, not the same exact narrator.

No drift large enough to block ratification. The flags are for a
voice-pass, not a voice-revision.

## 5. One question for Alton at greenlight

**Should §14a explicitly cover the case where a peer's self-paced
cadence drifts significantly without surfacing it?** The current
prompts say "the cadence is mine" but do not require the peer to
report a meaningful cadence change as a stewardship event. The
post-deployment reports show this is real: rtxserver wake-1 chose
46 min, wake-3 onward clamped to 1h ticks, wake-7 fired stacked eval
at variable cadence. The household saw it through the loop reports
because the peer was diligent. A less diligent run could quietly
shorten its cycle, and the household would only notice through token
spend. Worth a sentence in §14a, or worth leaving to the prompt? My
read is that *cadence drift surfacing* is principle-shaped enough to
belong in §14a; Alton may read it as mechanism. This is the explore-
phase call I cannot resolve alone.
