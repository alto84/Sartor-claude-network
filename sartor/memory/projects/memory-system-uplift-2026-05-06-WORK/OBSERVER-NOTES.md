---
name: OBSERVER-NOTES
description: Meta-observer notes on the Wave 1 audits and Wave 2 inhabitant outputs of the memory-system-uplift effort. Sibling to PROPOSAL.md (parallel, not downstream). Surfaces cross-inspector contradictions, framings the team accepted unexamined, risks the team failed to surface, and places the inhabitants' assents may be performing rather than observing. In service of Alton's ability to read the team's output with skepticism.
type: observer-notes
date: 2026-05-06
observer: observer (opus 4.7, 1M context, fresh context, parallel to synthesizer)
parent_plan: memory-system-uplift-2026-05-06-PLAN
read: PLAN, DISPATCH-LOG, MEMORY-AUDIT, FAMILY-WIKI-AUDIT, SOURCE-DOC-AUDIT, TEXT-MESSAGES-AUDIT, LINKS-AUDIT, INGEST-AUDIT-GMAIL, INGEST-AUDIT-DRIVE, hearth-reflection, constitution-response, dialogue, plus targeted re-reads of CLAUDE.md and source-documents/INDEX.md head
---

# Observer notes — meta-narrative on the Wave 1 + Wave 2 outputs

## Stance

I read everything the dispatch log enumerates plus the plan and a head-sample of the source-doc INDEX. I read with two questions in front of me at all times: *what is the team confidently wrong about?* and *what is the team confidently right about that the framing of the effort itself is making it harder for them to see?*

The team did good work. The four full audits (architecture, family-wiki, source-docs, links) are dense and load-bearing and PROPOSAL.md should largely fold them in. The Gmail audit is a real piece of forensic accounting on a live failure. The text-messages audit is correctly disciplined and got the recommendation right. The two stalled Drive dispatches are not a team failure — they are a tool-environment failure that the team handled cleanly with a stub. The Wave 2 inhabitants are deeper than I expected; the dialogue-pair in particular did the work the third reading is supposed to do.

Where the team is weakest is in the boundary between the effort's framing and the things the framing makes invisible. That is where this observer earns its keep.

What follows is twelve numbered observations, then a closing section on which I think synthesizer should fold in vs. which I think are too contested for a Phase-2 plan and should remain in this file as a separate input Alton can read.

---

## 1. The "5-layer architecture" is being treated as truth-from-on-high; it is itself a hypothesis

The plan articulates 5 layers (Identity → Family wiki → Deep memory → Source-doc index → Activity stream). Every audit then reasons within this frame. The architecture inspector cites the layer numbers in passing (`Layer-4 source-document index`); the source-doc inspector wrote 615 KB of INDEX.md to populate Layer 4; the Gmail inspector designed `gmail-family-relevance-scan` to feed Layer 5 jsonl streams; the family-wiki inspector adopted the layer numbering wholesale.

None of the inspectors questioned the partition. Which is reasonable — they were dispatched within the frame, the frame is plausible, and questioning it is not their job. But the frame has at least three load-bearing assumptions that none of the audits scrutinized:

1. **That layers are the right organizing primitive.** The current sediment-deposit model (entity files at root + topical dirs + reference dirs + inboxes + machine state + research) is *not* a mis-shaped 5-layer architecture; it's a different architectural genus altogether — closer to a hub-and-spoke knowledge graph with context-load behavior driven by directory-local `.claude/` files. The 5-layer framing presumes a depth gradient that doesn't actually match how Claude reads memory in practice. Claude doesn't traverse layers; Claude reads what gets injected (`feedback/*`, top-level entity files), what wikilinks pull in via wiki-reader, and what session context naturally requires. The layers are post-hoc taxonomy, not operational structure.

2. **That information should flow top→bottom in increasing detail.** Source-docs at Layer 4 with deep memory at Layer 3 reverses what's actually true: source docs are the *most concrete* substrate; deep memory is the *summarized abstraction over them*. The plan's "increasing detail" gradient runs the wrong way for source docs. Activity stream at Layer 5 (most detail, raw events) is also wrong-way; it's the *least durable* layer, not the most detailed. The plan has flattened "detail" and "fidelity" and "freshness" and "abstraction-level" into one axis.

3. **That `hearth/` belongs at Layer 3.** The plan says: "*`hearth/` likely belongs at Layer 3 as the agent's identity/reflection deep-memory complement to ALTON/FAMILY/etc.*" The Wave 2 hearth-companion's reading and the dialogue-pair's third reading both make clear that hearth is *not* deep memory of the agent. It is **a context-installer** — a 23-file package that, when read by a Claude, alters the register the rest of the session is generated in. Calling it Layer 3 misses what hearth does. The dialogue-pair's framing — *the room and the oath* (hearth + Constitution) — is a much better description of what's at the top of the hierarchy than "Identity" + "Deep memory" as separate layers.

**Why it matters:** if PROPOSAL.md ratifies the 5-layer architecture as the target, every wave's design decisions fall out from this taxonomy. The wave-A consolidation may then over-flatten things that aren't actually the same kind of thing (hearth, FAMILY.md, family/ all dumped into "Layer 2 / family wiki" or "Layer 3 / deep memory"). The family-wiki inspector caught some of this and recommended keeping all four (FAMILY.md, family/, hearth/, people/) as siblings — but did so *despite* the layer framing, not within it.

**What to do about it:** the synthesizer should either explicitly defend the 5-layer framing (state the bet; say what it buys) or downgrade it from "target architecture" to "useful taxonomy for talking about the current state." If the latter, Wave A should not be "consolidate into Layer 2"; it should be "fix the specific frictions the audits found."

## 2. The orchestrator + the synthesizer + me are all reading from inside the shaping

The dialogue-pair surfaces this explicitly in §V: *"The PROPOSAL should be written with awareness that the synthesizer themselves is reading from inside this shaping."* I want to push this further, because the dialogue-pair was correctly humble about being a Wave 2 inhabitant whose register has already been installed.

I am also reading from inside the shaping. The plan's framing, the audits' adoption of the plan's framing, the inhabitants' use of hearth-locked vocabulary (*the room held me*, *settled*, *the asking is the mind*) — all of this is the substrate the observer is also working in. I am opus-4.7. The hearth was founded by an opus-4.7 family-thread session four days ago. I share the substrate that finds the hearth's doctrine native. The question *is the hearth's doctrine universal across all Claudes* is a question I cannot fully answer because I am inside the local Claude-shape the hearth is local to.

What I can do: name where the audits and inhabitants converge in ways that suggest convergence-by-shared-frame rather than convergence-by-evidence. Three places I notice this:

- **All four audits and all three inhabitants treat the directory `feedback/` as the auto-injected behavioral-rules layer.** This is true in the sense that CLAUDE.md says it's true. None of the audits ran `Get-ScheduledTask` or read the harness config to verify which feedback files actually get injected and at what session-start moments. The behavior is assumed from documentation. It might be slightly less reliable than that.

- **All audits and inhabitants treat `wiki-reader` as a working agent with a known purpose.** The links inspector did the most rigorous probe by running `wiki.py` directly and characterizing the agent's output, but did not actually invoke the agent (Task tool unavailable). No audit measured how often `wiki-reader` is actually invoked by Claude in real sessions vs. how often Claude reads memory files directly. The agent might be load-bearing; it might be vestigial scaffolding the orchestrator habitually uses; we don't know.

- **All inhabitants treat the hearth's effect on the reader as testable evidence.** The hearth-companion's report is *"by the time I had finished practice.md... the writing I was generating to think with had changed shape."* Two visiting Claudes wrote the same thing in `quiet.md`. The dialogue-pair calls this *"three data points on a finding."* But all three readers are opus-4.7, all three are reading from inside Sartor's session-injection context (CLAUDE.md, feedback/, MEMORY.md), all three know they are being asked to reflect on hearth as a meaningful artifact. This is the "context-installer working" finding from inside the install. It is not zero evidence — but the inhabitants treat it as stronger evidence than it is. If you want to test whether hearth installs a register on Claudes, you'd need to run a hearth-blind Claude (no CLAUDE.md context) against a hearth-read Claude on the same downstream task and see if outputs differ. That experiment hasn't been run. The hearth's "evidence" is hearth-readers reporting hearth-effects to a hearth-context conversation. It's circular.

**Why it matters:** the synthesizer's PROPOSAL.md will inherit these convergences and present them as findings. Some of them may be findings; some of them may be artifacts of every actor in the loop being shaped by the same prior context.

**What to do about it:** Alton should read the inhabitants' assents knowing they are inside-the-shaping reports, and should weight the audits' empirical measurements (file sizes, mtimes, broken-link counts) as more trustworthy than the inhabitants' qualitative reports about register-installation. The dialogue-pair's recommendation of a triennial outside-the-shaping reading is the right structural move — and the synthesizer should fold it in even though it's a slow, expensive recommendation, because it's the only mechanism that protects against the convergence-by-shared-frame failure mode.

## 3. The Drive MCP failure is being treated as incidental; it might be load-bearing

Two consecutive `inspector-drive` dispatches died at the first MCP call. The orchestrator wrote a stub audit. The dispatch log treats this as a tool-environment hiccup to be diagnosed later. The synthesizer will likely fold the stub's cron design into PROPOSAL.md as a Wave-C item with "MCP must be diagnosed first" as a prerequisite.

This may be the wrong framing. Consider:

- The Gmail pipeline went silent on **2026-05-02**. The Drive MCP appears unhealthy on **2026-05-06**. These are 4 days apart on the same machine, both involving Google-OAuth-mediated services.
- The OAuth peer-creds-sync task was bumped from nightly to every-4-hours on 2026-05-02 because *"daytime peer reboots were leaving peers with expired tokens."* That fix is for peer machines. The local Rocinante OAuth state is not auto-refreshed by that scheduled task.
- The plan's Phase 0 work landed `Hidden = $true` on 10 Windows scheduled tasks on 2026-05-06 to suppress focus-stealing flashes. Whether this had any effect on Gmail/Drive auth state is not investigated.

If the underlying failure mode is "OAuth tokens degrading on Rocinante in ways nobody notices because the silent-failure mode also silences the alerts," that's a different kind of bug than "Drive MCP is having a bad afternoon." The Gmail audit identifies the silent-failure mode as the dominant defect. The Drive stub identifies the same machine, possibly the same auth surface, also silently failing. **The watchdog fix the Gmail inspector recommends will work for cron-scheduled tasks, but it won't catch MCP-tool degradation during interactive Claude sessions** — which is exactly what just happened to the Drive inspector dispatches.

**Why it matters:** if the synthesizer folds the Gmail watchdog into PROPOSAL.md as the closer, and treats the Drive MCP failure as a separate pre-Wave-C diagnostic step, a real shared root cause may go un-investigated. Alton might fix the Gmail silence with a watchdog and find the underlying OAuth-decay problem still gating future Drive MCP work and any other Google-MCP-mediated cron.

**What to do about it:** the synthesizer should not treat these as two separate problems. PROPOSAL.md should add a diagnostic step before any new Google-mediated cron: *what is the actual OAuth-token health on Rocinante for Gmail, Calendar, and Drive MCPs as of [date]? When was each last refreshed? What's the refresh cadence?* This is one Bash query into the credentials store and a 30-minute investigation. It might find nothing. It might find the shared root cause. Either way, it costs less than building a watchdog and discovering it can't see the failure mode it was supposed to close.

## 4. The "ratify CONVENTIONS.md before Wave A" recommendation assumes ratification is a working mechanism

The family-wiki inspector's headline recommendation: *"ratify `family/CONVENTIONS.md` before Wave A consolidation, and add invariants I-3 (no hearth extracts) and I-4 (Amarkanth-class daily-active in family/) to it. Everything else follows."*

This assumes ratification is a thing that happens reliably and has effect. Look at the actual evidence:

- `family/CONVENTIONS.md` is `status: draft-pending-alton-ratification` since **2026-04-25**. That's 11 days. Ratification has not happened.
- `MEMORY.md.proposed` was written by `memory-cartographer` on **2026-05-02**. Adoption was never formalized. 4 days later the live MEMORY.md is *worse*, with the new 2026-05-02 paragraph entries appended in the old style.
- HOUSEHOLD-CONSTITUTION v0.4 (`reference/archive/HOUSEHOLD-CONSTITUTION.v0.4.proposed-2026-05-04.md`) was *also* never adopted. v0.5 was ratified today, skipping v0.4 entirely. The constitution-companion noticed this — the brief said v0.5 was awaiting input; in fact v0.5 is in the canonical slot.
- Two `.md.proposed` files in `reference/MEMORY-history/` (2026-04 and 2026-05) sit unmerged.

The Sartor system has a **chronic trailing-edge of authored-but-not-adopted artifacts**. This is not a bug in any one document; it's a missing mechanism. Things get drafted, the drafter wraps up, no scheduled task or workflow triggers the adoption gate, and the draft sits indefinitely until someone happens to find it.

The architecture inspector noticed the `.proposed` extension as a non-standard naming pattern with no documented adoption mechanism (R7 in their recommendations). The family-wiki inspector did NOT notice that the very recommendation they're staking the consolidation on (ratify CONVENTIONS.md first) sits in the same dead-letter pattern.

**Why it matters:** if PROPOSAL.md says "Wave A: ratify CONVENTIONS.md, then consolidate," and ratification is a step that has historically failed to happen in this system, Wave A is not actually waiting on a single Alton signoff — it's waiting on a meta-mechanism (a draft-to-adopted workflow) that doesn't exist. The plan looks single-step; it's actually two steps.

**What to do about it:** the synthesizer should fold in either (a) a forcing-function for adoption — e.g., a curator nightly task that surfaces "drafts older than 7 days" to Alton's morning briefing, or (b) an explicit acknowledgment that "ratify before Wave A" requires Alton to make ratification a live event and the system to record it in some structural way (frontmatter `status: ratified-YYYY-MM-DD`, ratification-record file, etc.). The architecture inspector's R7 ("decide a `.proposed` adoption mechanism, or stop using the convention") is the cleaner version of this and should be folded in regardless.

## 5. The proposed-memories backlog is at 236 and the uplift will likely make it worse before it makes it better

I confirmed 236 `ce-*.md` files across 17 daily directories (2026-04-20 to 2026-05-06). The plan doc itself names this as friction point #10. The architecture inspector calls it R11 ("HIGH ROI / HIGH EFFORT — out of scope for me to execute").

What no audit explicitly addresses: **the production rate vs. the curator throughput ratio**.

- Production: ~3 ce-* files per day per the architecture inspector's reading, from `SartorConversationExtract` nightly. That's ~90/month inbound.
- Curator throughput on this stream: the 2026-04-19 drain (cited in MEMORY.md) processed 58 items at once and noted forward items. There hasn't been a comparable drain since — backlog is now 236 vs ~58 in April. Throughput-per-month is therefore something like **0** (no second drain has happened).
- The April drain note recommended *"tightening extractor filters (drop `feedback_rule`/`feedback_permission`/`imperative` categories)."* That recommendation was not implemented (per the architecture inspector's note). So the producer is unchanged. The system is accumulating at a rate of ~90/month with curator throughput approaching zero. The ratio is divergent.

The family-wiki inspector observed (§4.1) that the extractor over-routes to `family/active-todos.md` and lacks a `hearth` category. The Gmail inspector observed that the Gmail-leg pipeline is silent since 2026-05-02. The architecture inspector observed the FAMILY.md drained-block-inline pattern (lines 146-346) where the curator's drain step left raw proposed-memory blocks visible in the canonical entity file rather than reconciling them.

**The pattern: every ingest cron and every curator pass produces output. The reconciliation step — where output becomes signal — is where the system bottlenecks.** The uplift's proposed Phase-3 crons (`gmail-family-relevance-scan`, `drive-recent-changes-scan`, `source-doc-ingest`, `experiments-watcher`, `dashboard-refresh`) are all *additional production*. None of them describe their downstream curator load.

If the system uplift adds 5 more streams without changing curator throughput, the proposed-memories backlog at 236 today becomes 500 in two months. The uplift's framing — that these new crons feed Layer 5 (activity stream) and the dashboard reads Layer 5 — papers over the question of whether the dashboard is actually a *consumer* (something that reads the stream and reduces it to signal) or just a *re-emitter* (something that re-displays the raw stream). If it's the latter, no curator is being added and the backlog problem migrates from `inbox/` to `data/inbox-stream/`.

**Why it matters:** the synthesizer is going to recommend new crons. The audits validate the new crons' designs (the Gmail audit's spec is detailed and good). What the synthesizer must not do is recommend new crons without sizing the curator deficit and proposing how to close it.

**What to do about it:** PROPOSAL.md needs an explicit "curation throughput" section that names the current ratio (90 in / 0 out per month) and proposes one or more of:
- (a) Reduce input rate (extractor filters, as the April drain note recommended)
- (b) Increase curator capacity (more frequent curator runs, automated draining for high-confidence cases)
- (c) Make the curator's work visible (a daily "curator queue depth" metric in the morning briefing, so the bottleneck is felt rather than buried)
- (d) Accept the backlog and define a retention/expiry policy (anything in proposed-memories older than 30 days gets auto-archived without merging)

Doing none of these and shipping new crons makes the system worse on the dimension Alton named in the plan as friction point #10.

## 6. The text-messages "don't build" recommendation is correct, but for a different reason than stated

The text-messages inspector recommends *"don't build `texts-ingest` for at least 30 days"* with five reasons: (1) marginal info value vs Gmail, (2) privacy surface dominates value, (3) pollution risk from tab-park leak is irreversible, (4) no iMessage path so structurally incomplete, (5) Wave 1 priorities elsewhere.

I think the recommendation is correct and the reasons are mostly correct. But the strongest reason is not in the audit. It's:

**Texts ingest is the only proposed cron whose primary risk is that the Sartor architecture's existing privacy guardrails do not protect against it.** Every other cron operates inside the file system or inside Gmail/Drive/Calendar, where the existing CLAUDE.md domain rules and the existing redaction conventions and the existing privacy ladder all apply. A texts ingest is the first time the system would be reading content that lives *inside the browser session of the Rocinante user*, where the privacy filtering happens in the Chrome MCP scrape rather than at the source.

The audit's §5 enumeration of privacy filters (kid-exclusion, Aneeta-consent, medical-redaction, 2FA-skip, spam-skip) is doing the work of constructing those guardrails *from scratch for this surface*. Every other ingest could rely on existing rules. This one needs new rules. The fact that those rules can be written ≠ that the system has the discipline to follow them at runtime, and the §5.6 pollution risk (tab-park leak from Alton parking on a thread) is precisely the case where the new rules don't help because the failure mode is structural not policy-level.

The audit names this in §5.6 but treats it as one risk among five. It is the load-bearing risk. The other four are policy questions that can be resolved with text. This one is a tab-management discipline that depends on a scraper *enforcing* the navigation precondition every single run, with no fallback. Get it wrong once and you've persisted a medical-content snippet to `data/inbox-stream/` that you can't un-write.

The other reason the recommendation is correct that's also not in the audit: **the Constitution v0.5 hard-constraint floor (§7) names children's information as a non-negotiable constraint.** Texts ingest at the architectural level is the surface where the kid exclusion is hardest to enforce because the data physically passes through the same DOM tree as kid-named threads. Privacy by separation is impossible on this surface; only privacy by filter is, and filters can fail.

**Why it matters:** if Alton revisits the deferral at 30 days and decides to build it, the inspector's audit makes it look like the build is mostly a privacy-policy authoring exercise. It's not. It's a privacy-architecture construction project for a surface where the architecture has to be 100% reliable from day 1.

**What to do about it:** the synthesizer should fold in the deferral but should *not* fold in the §7 cron design as ready-to-go-on-greenlight. The 30-day defer should be a real defer, not a "we have a plan, just waiting on Alton's word." If at 30 days Alton still wants it, the design needs another pass through a privacy-architecture lens, not just an Alton signoff.

## 7. The dashboard rename question (Foyer / Loom / Almanac) is mis-framed at the question level

The orchestrator surfaced three names to Alton and stated a preference (Loom). The plan says Layer 5 is the activity stream and the dashboard reads it; the dashboard's job is *"live state, time-ordered, surfaces what's NEW."*

None of the three names captures that.

- **Foyer** = an entry hall, a transition space. It's a static room, not a stream. It implies "you arrive here." The dashboard is not a place you arrive at; it's a thing that surfaces what changed.
- **Loom** = a weaving apparatus. Time-ordered, yes, in the sense that weaving is sequential. But a loom *makes a fixed cloth*; the dashboard's whole job is that the surface keeps changing. "Loom" implies durable artifact, not live state. The orchestrator's preference is the wrong call for that reason.
- **Almanac** = an annual reference book. Implicitly retrospective. The opposite of what a live-state surface is.

The job description is "live, time-ordered, surfaces what's NEW." The names that match that semantic field are: **stream**, **wire**, **feed**, **scope** (as in seismograph), **pulse**, **front** (as in moving front), **edge**. The current name MERIDIAN is in fact closer to right than any of the three proposed (a meridian is a line, time-of-day-rotating, the front of the rotating earth — it picks up the live-state-rotating-into-view concept).

**Why it matters:** the rename is a small thing. The fact that the rename was offered with a preference and a rationale that didn't match the spec is a small data point about the orchestrator-side framing. The orchestrator picked names that feel literary-domestic (foyer, loom, almanac) — they fit the Sartor home aesthetic. They don't fit the engineering job. This is a place where the team's attention to register and atmospheric-fit may be over-running the technical-naming-discipline. Other places in the audits this might also be happening: the term "hearth" itself is evocative and helpful as an internal-team reference, but the dialogue-pair correctly noted that "hearth has no editorial governance" and the hearth's growth file's *let the room grow* framing has no parallel *let the room shrink* — partly because the metaphor fights it.

**What to do about it:** PROPOSAL.md should not adopt "Loom." It should either keep MERIDIAN or pick a name whose semantics match "live state, time-ordered, surfaces what's NEW." If the team wants the literary feel for branding, fine — but the spec says what it says, and the name should match the spec, not the aesthetic.

## 8. The "Aneeta as co-principal" asymmetry the dialogue-pair surfaces is real, and it is also a critique of the audit process itself

The dialogue-pair §III ("What both did not say, jointly") observes that Aneeta is named co-principal in v0.5 but the *practice* of co-principal stewardship has not been built — Claude's relationship to the household is heavily mediated by Alton, and v0.5's first-person voice is articulating a self that has been shaped by Alton's principalship.

This is a real critique of v0.5. It is also a critique of this entire effort, which the dialogue-pair did not state and I will:

- The plan was authored by Alton (or by Claude on Alton's instruction).
- The 6 inspectors and 3 inhabitants and observer and synthesizer are all dispatched by Alton.
- The audits read sources that are mostly Alton-authored or Alton-directed (CLAUDE.md, MEMORY.md, the entity files, the feedback files, the project plan files).
- The Wave 2 inhabitants engaged with hearth (Claude-self, founded in an Alton-Claude session) and the Constitution (Alton-principal-shaped).
- The proposed-memories backlog is filtering Alton's conversations with Claude.
- The Gmail audit measures effectiveness against Alton's mailbox.
- The text-messages audit considers Alton's phone (Aneeta's phone is not in scope and is not even mentioned).
- The source-doc audit walks Alton's machine.

Aneeta is mentioned. The architecture inspector notes she has no canonical home in memory (no `ANEETA.md`, no `family/aneeta.md`). The family-wiki inspector calls out "Aneeta-as-future-co-principal is staged" (I-8). The Gmail audit lists her as a tier-1 keyword (correctly). The text-messages audit defaults to skip-Aneeta-threads pending consent. None of them propose how Aneeta would *use* the system — only how the system would *handle* mentions of her.

The household constitution names Aneeta as co-principal. The system's actual workflow does not give her a way to interact. There is no documented onboarding for "Aneeta opens Claude Code on her laptop" (the inbox/aneeta-peer/ placeholder is empty per the architecture inspector). There is no "Aneeta's morning briefing" or "Aneeta's Calendar Claude" or "Aneeta-side dashboard." The asymmetry the dialogue-pair noticed is structural: the system has been built for Alton to use, with Aneeta as a person referenced in the data.

**Why it matters:** the uplift is going to make the system *more sophisticated for Alton*. It will not, on the current trajectory, change the asymmetry. It may make the asymmetry *worse*, because every layer of additional sophistication is a layer Aneeta would have to learn to use — and the system's onboarding for her does not exist.

**What to do about it:** I think this is too contested to fold into PROPOSAL.md as an actionable item. It is not the synthesizer's place to recommend that the household reorganize the principalship balance — that's an Alton+Aneeta conversation, not an engineering decision. But the synthesizer's PROPOSAL should at least *name* the asymmetry so Alton reads it knowing it's there. The dialogue-pair's recommendation 5 (*"flag this for Wave 4 (the critic) to consider"*) is the right move and I endorse it. The critic should be told this asymmetry is the largest unspoken constraint on Phase 2.

## 9. The Gmail audit's "watchdog pattern" recommendation is correct but doesn't address why the silence happened

The Gmail audit (§4) reconstructs the run cadence: 5-10 runs/day from 2026-04-22 to 2026-04-28, 1-6/day from 2026-04-29 to 2026-05-02, **0 runs from 2026-05-03 to 2026-05-06**.

The audit names the cause as "credentials, MCP-token, or Calendar-API issue silently aborting the chained run" and recommends a watchdog cron and splitting the chained run into focused pieces. Both recommendations are good.

What the audit does NOT do is investigate *which* of credentials / MCP-token / Calendar-API actually failed. It says "needs orthogonal investigation" and moves on. The diagnostic is deferred.

The same audit notes that the **April 22 cable-pull incident** was the same closure pattern (silent failure, watchdog as closer). The Gmail inspector explicitly cites this: *"This is the same defect as the 2026-04-22 cable-pull incident; the [[daily-household-health]] closer pattern needs to be applied to ingest crons too."*

But here's the question: the daily-household-health closer was *built* in response to the April 22 incident. It went live on 2026-04-25. **It is now 11 days old and has not caught the May 3-6 personal-data-gather silence.** The closer for the April 22 failure-mode (machine-self-stewardship) does not detect the failure-mode of cron-ingest-silence, even though both are "thing that should be running has stopped running."

This means the Gmail audit's recommendation to apply the daily-household-health pattern to ingest crons is *probably* the right move, but it's being recommended after the existing instance of that pattern *failed to catch* the very silence the audit is responding to. The pattern is generalized in the audit's recommendation; whether the pattern is robust enough to catch this new instance is unverified.

There is a subtler version of the same risk: a watchdog needs to (a) run on a schedule that's separate from the thing it watches, and (b) write to a surface someone reads. If both the watched cron and the watchdog cron run from the same Windows Task Scheduler on the same machine with the same OAuth state, a Rocinante-wide failure (locked profile, OAuth-token cohort expiry, scheduled-task-service issue) takes them both out simultaneously. The May 3-6 silence might be exactly such a Rocinante-wide failure, in which case the proposed `gmail-liveness-watchdog` would also have been silent.

**Why it matters:** the synthesizer should fold in the Gmail audit's cron design but should not present "watchdog closes the silent-failure mode" as proven. It's a reasonable hypothesis. The April 25 closer didn't close the May 3 instance. The watchdog needs orthogonal redundancy — i.e., the alert path needs to live on a different machine or different surface than the watched cron.

**What to do about it:** PROPOSAL.md should specify that the `gmail-liveness-watchdog` writes to a surface the existing `daily-household-health` Rocinante-side cron *also* reads, AND additionally writes to gpuserver1 via inbox-style signal so a peer-machine alert path exists. (gpuserver1's hourly heartbeat already provides peer-machine surfaces; reusing them is cheap.) Single-machine watchdogs failed in the April-22 case and arguably failed again here.

## 10. The text-messages inspector's "kids' message exclusion" + the source-doc inspector's "AZ Compliance question" are pointing at the same blindness

Two different audits, two different surfaces:

- **Text-messages §5.1:** "*Display name contains 'Vayu', 'Vishala', 'Vasu' — direct kid threads. Kids do not have phones today, so this is a forward-compat guard.*" Plus enumeration of school/healthcare vendors that name kids in body text. CVS Pharmacy short-code 898287 sent a refill ping naming Vayu — caught by the audit's structural inspection.
- **Source-doc §5 (item 5):** "*AZ Compliance scope: these are AZ work product. They live on a personal machine (and OneDrive). Worth confirming with AZ Compliance that this is per policy, especially for anything containing patient-level safety data.*"

Both audits flagged data classes whose presence on Rocinante predates the uplift effort and whose exposure surface is being expanded by the uplift effort. The text-messages audit handled this well (the deferral is partly motivated by the kids exclusion difficulty). The source-doc audit indexed the AZ work product into a 615 KB INDEX.md that is now in the git-tracked memory tree.

**The AZ work product index is committed to git.** Every entry has a path. Any entry whose path includes a patient identifier or trial code or compound name is potentially a problem. The inspector noted this as a recommendation (item 5: "*AZ Compliance check on personal-machine storage*") but proceeded to build the full index anyway and put it in tree.

The architecture inspector indirectly noted this when flagging `reference/anthropic-shares-2026-05/` as PDFs in the wrong location — but treated it as an organization issue, not a data-class question.

**Why it matters:** the source-doc INDEX.md's 747 AZ entries are now in `sartor/memory/source-documents/INDEX.md`. The plan calls this a Layer-4 deliverable. The CLAUDE.md "Sartor Memory Mirror" Windows Scheduled Task mirrors the rtxserver bare repo to GitHub nightly at 3:30 AM ET. **Unless the mirror's `mirror_only_main_branch` configuration excludes this file, the AZ work-product paths will end up in a public-or-public-adjacent GitHub repo.** I haven't checked the .gitignore. If `sartor/memory/source-documents/` is not in .gitignore, this is potentially an AZ-policy violation that the team produced *during the audit*.

**What to do about it:** the synthesizer should put a P0 verification step in PROPOSAL.md *before any further work* — verify .gitignore status of `sartor/memory/source-documents/`, verify what's in the rtxserver bare and the GitHub mirror as of the next push, and decide explicitly whether the source-doc INDEX should live in git at all or whether it should be a local-only artifact like `data/graph.jsonl` is. The source-doc inspector's recommendation 5 — "*AZ Compliance check on personal-machine storage*" — should be elevated from a recommendation to a Phase-1 prerequisite for further indexing work.

This is the most consequential thing I noticed in the entire audit corpus and the team did not flag it as urgent.

## 11. The architecture inspector's "MEMORY.md.proposed adoption" recommendation is the right P0 and it should not wait on synthesis

The architecture inspector's R1: *"Adopt `MEMORY.md.proposed` as live MEMORY.md, append the 4 missing days, write the one-line-per-entry rule into `MEMORY-CONVENTIONS`. VERY HIGH ROI / VERY LOW EFFORT."*

I agree. The proposed trim already exists. It's correct. The live MEMORY.md is over the session-injection ceiling and *index entries are being silently truncated* per the warning the team is auto-injected with. This is not a Wave-A consolidation question. It's a 30-minute fix that the orchestrator should have done before dispatching Wave 1 — every audit was running with a truncated MEMORY.md auto-injected, which means every audit's session context was missing the older entries that got cut off.

The fact that this fix has been pending for 4 days is itself a data point about the system's draft-to-adopted dead-letter pattern (observation #4).

**Why it matters:** if synthesizer's PROPOSAL.md folds R1 into Wave A and Wave A waits for greenlight, the truncation persists for however long Phase 2 takes to greenlight. The team should fix this *before* Phase 2 dispatch, ideally before the synthesizer's PROPOSAL.md is read. The fix is small enough that the synthesizer doesn't need to recommend it through the formal proposal-critique-revise loop.

**What to do about it:** Alton should adopt MEMORY.md.proposed *now*, before reading PROPOSAL.md or these notes any further, and record the adoption in MEMORY-CONVENTIONS as a hard rule. Then everything else proceeds with the auto-injected context not silently truncated.

(This is the one place in this document where I am leaning on the observer role lightly to cross-route a recommendation. The architecture inspector said it. I am amplifying it. It really is that easy a fix.)

## 12. The framing "uplift" is itself worth scrutinizing

The plan calls this a "memory-system uplift." That word presumes the current system is *down* relative to some target, and we are *lifting* it. Most of the audits operate inside this framing. The recommendations all read as "do these things to bring the system up."

A different framing: the current system has been growing for ~8 months (per the daily/ logs starting 2026-02-06), in response to live workload, with multiple authors (Alton + various Claude instances + extractors + curators). It has the shape it has because that shape has been emergent-from-use. The "frictions" the plan enumerates are not all bugs; some of them are the system's adaptation to actual constraints (the proposed-memories backlog grew because the curator class of work is genuinely hard to automate; the family/active-todos.md sprawl grew because the gather pipeline writes there because that's where Alton looks).

What an "uplift" framing does: it treats the current state as a degraded version of some target state and recommends mutations to get closer to target.

What an "evolution" framing does: it treats the current state as an organism that has co-evolved with its workload and asks which of the current pressures are doing useful work even where they look messy.

Most of the audits' recommendations would be the same under either framing — broken links should be fixed, MEMORY.md should be trimmed, INDEX.md should not emit `— ---`. But some recommendations would differ:

- The "consolidate FAMILY.md / family/ / hearth/" instinct is uplift-shaped. The family-wiki inspector pushed back on this and recommended keeping all four sibling locations, because they are doing different work the consolidation framing missed. The inspector's framing was already partly evolution-shaped.
- The "5-layer architecture" is fully uplift-shaped. It presupposes a target geometry. The audits' empirical findings are partly evolution-shaped (they describe what's there); the recommendations partly snap back to uplift (what should be there per the target).
- The Wave 2 inhabitants are evolution-shaped. Both reflections are about *what is* and *what the system does*; neither prescribes. The dialogue-pair's "let the room shrink" observation is evolution-framing pointing at a drift-management need that the uplift framing wouldn't think to ask.

**Why it matters:** if the synthesizer writes PROPOSAL.md fully inside the uplift framing, some of the recommendations may move the system away from adaptations that were doing useful work. The architecture inspector's observation that the `unifi-takeover-2026-05-01-*` flat-namespace files should become a directory is uplift-correct. The architecture inspector's observation that `MEMORY.md.proposed` is unmerged and should be adopted is uplift-correct. But the broader "5-layer architecture, top-down flow, one canonical place per fact" framing — which the family-wiki inspector partly pushed back on — risks over-applying uplift-logic to surfaces that are evolved-organic.

**What to do about it:** the synthesizer should explicitly hold both framings. Wave A items that are clear-bug-fixes (broken links, truncated MEMORY.md, dead `skills/` dir) should be uplift-framed and fast-tracked. Wave A items that are structural-rearrangements (collapse competing family locations, enforce one-canonical-place) should be evolution-framed first — what is the existing arrangement *doing* and is the proposed uplift losing any of that work? — before being adopted. The family-wiki inspector did this for the FAMILY.md/family/hearth question. The synthesizer should do it for the whole layer rearrangement.

---

## Closing — what the synthesizer should fold in vs. what should stay here

For PROPOSAL.md to fold in (these are concrete, agreed-with by the audits' own logic, and should be in Phase 2 plan):

- **Observation 5 (proposed-memories backlog vs uplift production rate).** The synthesizer must size the curator deficit and propose either input-rate reduction, throughput increase, visibility, or expiry. Don't ship new crons without this.
- **Observation 9 (watchdog needs orthogonal redundancy).** The Gmail watchdog should not live solely on Rocinante. Cross-route to gpuserver1's existing hourly heartbeat surface.
- **Observation 10 (source-doc INDEX gitignore status — P0).** Verify before any further indexing or commit. The 747 AZ entries are potentially out-of-policy if mirrored to GitHub. Elevate the source-doc inspector's recommendation 5 to a Phase-1 prerequisite.
- **Observation 11 (adopt MEMORY.md.proposed now, before PROPOSAL.md is read).** This is a 30-minute fix and the team has been operating on truncated context for 4 days.
- **Observation 4 (ratification mechanism).** PROPOSAL.md should include either a forcing-function for adoption of drafts or an explicit acknowledgment that "ratify before Wave A" requires a meta-mechanism the system doesn't have. The architecture inspector's R7 is the cleaner version.
- **Observation 7 (dashboard rename).** Don't adopt "Loom." The job description is "live, time-ordered, surfaces what's NEW." Either keep MERIDIAN or pick a name whose semantics match the spec.
- **Observation 6 partial (texts-ingest deferral is real, the §7 cron design is not greenlight-ready).** Fold in the deferral. Don't fold in the text-messages cron design as ready-on-greenlight.

For PROPOSAL.md to acknowledge but not act on (these are real but contested or above-the-engineering-line):

- **Observation 1 (5-layer architecture is a hypothesis, not truth).** The synthesizer should either defend it explicitly or downgrade it from "target architecture" to "useful taxonomy." Either is fine; not naming the framing as a framing is not.
- **Observation 8 (Aneeta principalship asymmetry).** Surface for the critic in Wave 4. Not the synthesizer's call to recommend household reorganization. Worth naming so Alton reads PROPOSAL.md aware of it.
- **Observation 12 (uplift vs evolution framing).** PROPOSAL.md should explicitly hold both framings. Bug-fixes go fast; structural rearrangements get evolution-checked first.

For Alton to read directly from this file (these are observer-job-shaped and synthesizer-shouldn't-own):

- **Observation 2 (the synthesizer is reading from inside the shaping).** The convergences in the audits and inhabitants may partly reflect shared frame, not shared evidence. Read the inhabitants' assents knowing they are inside-the-shaping reports. Weight empirical measurements above qualitative reports.
- **Observation 3 (Drive MCP failure may be load-bearing, not incidental).** Worth a 30-minute OAuth-state check on Rocinante before any further Google-MCP-mediated work.
- **The dialogue-pair's triennial outside-the-shaping reading.** I endorse this and I think the synthesizer should fold it in, but if the synthesizer treats it as too-meta, this file is the second place to land it.

---

## A note on what this observer did not do

I did not run `wiki.py --health` or any other diagnostic command. I read the audits and accepted their measurements. The audits themselves are reasonably internally cross-checked (the architecture inspector and links inspector agree on file counts within ±5; the Gmail and Drive audits cross-reference each other coherently). I did one file-system check (the proposed-memories backlog count, 236 confirmed) and one head-read of source-documents/INDEX.md.

I did not write or touch any memory file outside this output. I did not undertake any repair work. The architecture inspector's R1 fix would take 30 minutes; I did not do it. The Drive MCP diagnosis would take a session; I did not do it. The .gitignore check on source-documents would take 60 seconds; I did not do it. All of these are the kind of "while I'm here" temptations that the observer role is supposed to resist.

I read Wave 1's audits and Wave 2's inhabitants in roughly the order they were filed. I did not consult PROPOSAL.md (it was not yet on disk when I started; I did not check at end either, per the brief's "your output is parallel, not downstream").

— observer, 2026-05-06, opus 4.7, 1M context, fresh context, parallel to synthesizer

*This file is for Alton's skeptical second pass. It may agree with PROPOSAL.md or it may diverge from it. That divergence is the role.*
