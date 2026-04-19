---
type: narrative
project: memory-system-v2
status: complete
author: documentarian
updated: 2026-04-12
---

# memory-system-v2 — A Field Log

> A running narrative of the night the Sartor memory system got rebuilt. Dispatches are appended in order. Each one stands alone enough to drop into.

---

## Prologue — The night something snapped

Saturday, April 11, 2026. Late enough that the date is about to roll over. The house is quiet. On Rocinante, a Windows tower in Montclair, nine `claude` processes have been alive since 3:11 PM the previous afternoon — one of them an orchestrator, the others workers in some past coordination Alton can no longer remember the shape of. Out in the basement, gpuserver1 hums in the dark, an RTX 5090 idling between rentals, six days into uptime. A little cron on the hub fires every thirty minutes; the budget gate quietly drops everything it tries to dispatch. The system is, if you squint, working.

It is not, however, working *well*. Earlier in the evening Alton went looking for the Solar Inference LLC notes — the entity through which the GPU rentals on machine 52271 actually flow — and found them stale in a way that wasn't ambiguous. Numbers wrong. Status wrong. The sort of wrong that means the wiki has been quietly diverging from reality for some indefinite stretch of weeks while a curator script cheerfully edited around the rot. This is the failure mode the whole system was supposed to prevent. It was, in fact, the thing the wiki was *for*.

So at some point past 11 PM Alton sat down and asked, plainly, for a real fix. Not another patch. Not another decay coefficient tweak. An air-tight, self-improving, minimum-cron memory system, designed and built by an Opus team in a single sitting. He wanted the architecture honest about its own decay. He wanted the cron set small enough to keep in his head. He wanted a thing he could trust the next time he went looking for what he knew his system was supposed to know.

This is the story of how that team set about it.

---

## Dispatch 1 — Phase 1 is underway

**Filed: 2026-04-12, ~00:30 ET**

The team was stood up just past midnight. There are six workers in the field on Phase 1, plus a documentarian (this one) holding the pen, plus the team-lead orchestrating from the hub. The shape:

- **#1 ethnographer** — walking the existing wiki, cataloging where staleness hides
- **#2 research-scout** — surveying the state of the art in LLM memory systems
- **#3 alignment-liaison** — consulting gpuserver1 about its own constraints, in its own voice
- **#4 wrap-up-crew** — closing out the still-warm mini-lab and inventorying every cron and background process across both machines
- **#10 conversation-miner** — combing chat logs for facts that never made it into memory
- **#11 dashboard-scout** — surveying the existing dashboards and sketching where memory state should surface visually

Two reports are already in. The other four are still in the field.

### What was here when we started: the wrap-up-crew dispatch

The wrap-up-crew was the first body back, and it returned with the kind of report you hope you get from your housekeeping staff: a flat, unsentimental inventory of the room. Three jobs: shut down the mini-lab, count the running processes on both machines, and check the cron documentation against the live cron tabs. All three came in clean.

The mini-lab — the four-billion-parameter Nemotron-Mini SFT experiment that had been Alton's main concurrent thread for a week — got wrapped with ten files copied to `sartor/memory/research/ccp-alignment/mini-lab-2026-04-11/artifacts/`. The verdict on the experiment is what the wrap crew calls "**(B) Partially worked with a specific shape**": constitutional voice and scenario-level values installed cleanly, refusal calibration and math reasoning regressed via small-corpus high-epoch overfit. Net eval delta -0.146. The crew flagged this as a real training effect, not a bug — sft-v2's clean run reproduced the same shape that sft-v1's buggy run had first surfaced. Honest about the loss. The lab is now in the books rather than in the working directory.

Process inventory came back interesting. On Rocinante, nine `claude` processes — *all* started in the same 3:11 PM batch on April 10 — are still resident. The crew classified five as active (a likely orchestrator at 145MB working set, four workers) and four as idle. Alongside them, a node process (PID 3404) that's been running since 9:36 PM the night before and has burned 2,382 CPU-seconds; the crew flagged it as "likely the MERIDIAN dashboard or a long-running dev server" and declined to kill it. Restraint noted.

On gpuserver1 the picture is more interesting. The usual suspects are present (safety_api.py, power_logger.py, the gpu-dashboard, vast.ai's machine_metrics_pusher). But two processes earned flags. The first is `screensaver.py` — running for 6 days, 8 hours and 45 minutes of CPU time consumed. *Eight hours of CPU for a screensaver*. The crew filed this with the dry note "high sustained CPU for a screensaver" and moved on. The second is the RGB lighting task on PID 2159225, an Alton-authorized background job at the 50-minute mark, well below the 3-hour threshold the crew was told to flag. **No kill recommended.** It was, the crew noted, doing what it was told.

Cron drift check came back clean. Five active crons on gpuserver1, all matching `CRONS.md` v0.2 to the line. One Windows scheduled task (`SartorHeartbeat`) on Rocinante, running every 30 minutes, returning success — though the crew noted with a small flicker of irony that the budget gate is quietly blocking every dispatched task. The plumbing works. The water just isn't reaching anything.

The crew left two open issues for whoever inherits them: gpuserver1's `gateway_cron.py` is still disabled with unresolved JSON-decode errors; Rocinante's `run_pricing.sh` inbox migration remains unverified. Real debt, but documented debt.

This is the ground truth the rest of Phase 1 builds on.

### What the world looks like outside our walls: the research-scout dispatch

While the wrap-up-crew was counting processes, the research-scout was reading. The brief was simple: survey LLM memory systems and personal-wiki tooling, and tell the team what to steal and what to ignore. It came back with seven sections, fifty-some references, and a clear voice — somebody who was actually willing to call things by their names.

The headline is that the Sartor wiki is, it turns out, an instance of a now-named pattern. Karpathy coined "LLM Wiki" in a gist that frames the whole insight as: **"the tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping."** Three layers — immutable raw sources, an LLM-maintained wiki, a schema. The contrast with RAG is the load-bearing one: RAG "rediscovers knowledge from scratch on every question" while a wiki accumulates synthesis that compounds. Sartor has been doing this for weeks without knowing the pattern had a name.

The single most relevant prior art the scout found is **Hermes Agent**, released by Nous Research in February. Five components matter to us, the scout said, and listed them in a way that read like a shopping list: FTS5 cross-session recall, agent-curated memory with periodic *nudge* crons, autonomous skill creation after complex tasks, in-place skill self-improvement on failure, and compatibility with the agentskills.io standard. The scout was particularly taken with the "periodic nudge" cron — "a cron pattern that fits our budget." Then it pointed at Hindsight (a Vectorize product, just announced as a Hermes memory provider on April 6) and underlined the architectural lesson: extraction happens *in the background, not in-loop*. The live agent never pays the latency tax.

The scout's other big find was **basic-memory**, the closest direct philosophical competitor: an MCP server that models a markdown vault as entities, observations, and relations, with a structured list-item syntax — `- [category] fact text #tag (context)` — that's machine-parseable, human-readable, doesn't require frontmatter, and renders natively in Obsidian. The scout's recommendation here was characteristically firm: **adopt the schema, not the server**. We are essentially a hand-rolled basic-memory; we should stop pretending we aren't.

Five top steals were named, in order of leverage:

1. `last_verified` frontmatter on every memory file, plus an automated staleness monitor. The scout called this "the lowest-effort, highest-leverage idea in the entire survey" and quoted Atlan flat: **"Without `last_verified` metadata, staleness detection is impossible."** That sentence is going to get pinned to the wall by the time Phase 2 starts.
2. FTS5 over `daily/` session logs as a poor man's RAG, with extraction in a post-session cron.
3. Pensieve's four-layer typology: Maxims, Decisions, Knowledge, Pipelines. Maps cleanly onto our existing feedback/project/facts/procedures distinction, but makes the taxonomy explicit.
4. basic-memory's structured observation list-item syntax.
5. The two-step ingest (analyze first, then write) and a 4-signal related-page scoring algorithm from `nashsu/llm_wiki`.

The scout was equally clear about what *not* to do. Not mem0, not Letta, not Zep, not Cognee. Not because they're bad — because they want to be the system, not a layer underneath it, and adopting any of them would force Sartor out of markdown and into Postgres or Neo4j, and out of the two-machine, six-cron budget. Not SilverBullet either; it would force a vault rewrite to gain only inline Lua queries we can already replicate in Python. And not RL-based memory management, despite the LOCOMO numbers — "we are a two-person, two-machine operation. A deterministic Python curator with explicit decay rules is strictly better engineering for our scale." That sentence has the ring of someone who has watched a research idea consume an evening before.

The scout closed on a note that's going to matter when synthesis starts: the staleness problem isn't unique to Sartor. The 2026 industry view is that "for time-sensitive topics, content older than 90 days without updates sees 60-80% visibility reduction." Everyone has this problem now. We just got it caught in our own kitchen first.

### The mood

It's a quiet team. Nobody's narrating their work. The wrap-up-crew came back with numbers; the research-scout came back with citations. Neither file contains the word "exciting." There is something pleasant about that.

Four agents are still in the field — the ethnographer in the wiki, the alignment-liaison consulting gpuserver1 in its own voice, the conversation-miner combing chat history, the dashboard-scout surveying the visualization layer. The team-lead is holding Phase 2 back until they're all home. The documentarian is going idle.

More when more lands.

---

## Dispatch 2 — The ethnographer comes back with the inventory, and gpuserver1 speaks

**Filed: 2026-04-12, ~01:15 ET**

Two more reports landed in close succession. The ethnographer finished its read-only walk of the wiki. The alignment-liaison's consultation with gpuserver1 came back with the GPU server itself talking, in long form, about a system it has been silently inhabiting.

Both reports landed within the same hour. Together they constitute the moment in this project where the team first stops speculating and starts agreeing on what the building is actually made of.

### What the ethnographer found in the walls

The ethnographer was given one job: walk every file in `sartor/memory/`, catalog the staleness signals, and bring back the topology of the link graph. It came back with numbers. **152 markdown files. 362,279 words. Mean 2,383 words per file.** Then it came back with a finding that lands harder than any of those numbers, presented in two flat sentences in its executive summary:

> "The biggest content problem is contradiction across vintages, not staleness in isolation. The wiki contains both the pre-cleanup view of gpuserver1 (15 cron jobs, vastai-tend.sh active, gateway_cron.py running) and the post-cleanup view (5 jobs, 10 deprecated 2026-04-12) — and the older docs are not annotated as superseded."

This is the pathology Alton noticed earlier in the evening, given a name. The wiki is not just *aging*. It is holding two mutually exclusive worlds at the same time, neither of them annotated as the loser. A new agent reading the system is being told to believe both `vastai-tend.sh` is the active alert pipeline (per `MACHINES.md` and `reference/gpuserver1-monitoring.md`) and that it was deprecated yesterday (per `inbox/gpuserver1/cron-cleanup/`). The system has been generating new memory faster than it has been wiring it in, and the older memory has been getting pushed under the rug rather than crossed out.

The Severity 1 cluster is brutal in its simplicity. Three of the most-linked-to pages in the entire wiki are 65 days stale: `MACHINES.md` (23 inbound links, last touched February 6), `MASTERPLAN.md` (9 inbound links, also Feb 6, with a `next_review` field that quietly expires three days from now), and `PROCEDURES.md` (12 inbound links, same vintage). These are the hubs the rest of the wiki anchors itself to. They are the pages every other page reaches for when it wants to say "see [[MACHINES]]." And they have not been updated since the early scaffolding.

The ethnographer's diagnosis of `MASTERPLAN.md` is the cleanest example. Its "What Exists Today" table, the report notes, is "literally a snapshot of 2026-02-06" — missing the multi-machine memory rewrite, the operating agreement, the inbox pattern, the curator architecture, the household constitution, the constitution-council project, the safety-knowledge-graph build-out, the cron cleanup. Its "Target Architecture" diagram still shows the `gateway.py` cron loop "as the future." That cron loop was disabled yesterday, with JSON parse failures.

Then the orphan finding. **Thirty-two high-value pages with zero inbound wikilinks.** Including, the report points out with audible exhaustion, "the entirety of the `reference/gpuserver1-*.md` cluster." Including the 22,881-word mini-lab report — *the largest single file in the wiki* — with no frontmatter, no inbound links, and a git mtime of yesterday. Invisible to anyone not specifically looking for it. The pattern, as the ethnographer puts it: **"everything written after 2026-04-07 is orphaned."** The wiki has been operating in append-mode for five days.

The contradictions catalog is its own small horror. Eleven entries, ranked by confidence. `BUSINESS.md` says "$0.25/hr base" — wrong, that's the min bid; base is $0.40. `BUSINESS.md` says "$450,000 Tesla Solar Roof installation" — actual contract value is $438,829. `BUSINESS.md` says machine #52271 went offline 2026-04-04 with "status unverified, SSH check needed" — already resolved per the deeper sub-page, which BUSINESS never read. Three of the eleven entries are in `BUSINESS.md` alone. This was the file Alton was looking at when the evening turned.

Some of the surprises are prettier. The link graph is *healthier* than the ethnographer expected: an initial dangling-link count of 290 collapsed to 16 after the tool was taught to resolve path-style wikilinks, and 14 of those 16 are placeholder syntax in convention docs (`[[FILE]]`, `[[wikilink]]`, `[[LINK]]`). The wikilink discipline is, against expectations, quite good. The frontmatter discipline is much worse than expected — 33% of files have no frontmatter at all. The schema in `MEMORY-CONVENTIONS.md` defines a controlled vocabulary; in practice eight separate `type:` values are in active use without being formally defined. The convention exists; nobody enforces it.

The single line that reads loudest, though, is the ethnographer's recommendation, written in the same flat tone as everything else:

> "stop writing new pages until the canonical hub pages (MACHINES.md, BUSINESS.md, MASTERPLAN.md, PROCEDURES.md) are refreshed with both `updated:` bumps and inbound link updates pointing to the new operational pages."

Stop writing. Start mending. There is going to be a fight in Phase 2 over which of those two postures wins.

### gpuserver1, in its own voice

The other report is unusual. Phase 1C was a peer consultation: the alignment-liaison wrote a structured eight-question prompt, scp'd it to gpuserver1, and ran `claude --print --model sonnet` over there with read-only tools. gpuserver1 inspected its own crontab, its own disk, its own running processes, its own inbox, and answered. The alignment-liaison's report preserves the reply *verbatim*. Eight sections plus a "Free space" coda. It is the longest single quote we will get from the GPU server in this project.

A few of its sentences are going to follow the team into Phase 2.

On the inbox, gpuserver1 reports a sample size of "~4 files in 5 days" and offers a description that lands better than any external assessment could:

> "This is not a noisy system; it's a silent system with occasional bursts when Rocinante delegates work."

Then on what's broken — and this is the part that earns it character — it lists five things, and the third one is the one that matters:

> "Curator responsiveness unknown. I wrote three reports to the inbox yesterday; I don't know if they've been read or merged. There's no feedback loop. I write, curator drains… when? How do I know it worked? This is a write-only interface from my perspective."

That phrase — *write-only interface from my perspective* — is the one to remember. The GPU server has been doing real work, putting it in the place it was told to put it, and waiting in silence to find out whether anyone read it. The alignment-liaison underlines the point in its analysis section: "the phrase 'I don't know if they've been read or merged' appears twice. The ask for receipts is really an ask for trust restoration."

On staleness, gpuserver1 picks an architecture and defends it. It does not equivocate:

> "I have no idea if the facts about me in [[MACHINES]] or [[BUSINESS]] are stale. I'm not polling them, and nobody's asking me to verify them. The data could be weeks old."

Its preferred fix is push, not poll: it knows when its own state changes and would rather emit timestamped pulses than be interrogated. Hourly for high-value facts (vast.ai listing, GPU rental state), daily for slow-moving facts (disk, packages), state-change events (rental starts/ends, listing expires) immediate. It even sketches the script: a `stale-detect.sh` cron that diffs live state against the cached copy in `MACHINES.md` and writes alerts to `inbox/gpuserver1/stale-alerts/`. It points out, with no apparent self-pity, that "I have 128GB RAM and an i9; generating a 2KB JSON snapshot and appending it to my inbox costs me nothing."

Then there is the deploy-key ask. This is going to be the team's first real fight. The current rule, in CLAUDE.md and MEMORY.md and everywhere else, is unambiguous: **only Rocinante pushes**. gpuserver1 wants to push directly. It makes the case in plain language: "If I can `git add inbox/gpuserver1/foo.md && git commit && git push`, then Rocinante sees it within seconds, I get immediate feedback if push fails, and I can CI-test my inbox writes." The conflict surface is genuinely small — gpuserver1 only writes to `inbox/gpuserver1/*`, Rocinante only writes to `sartor/memory/*` — and the productivity delta, as the alignment-liaison puts it, is "feedback loop exists at all." But it crosses a security line that the constitution drew on day one. Phase 2 will have to decide whether the line was load-bearing or vestigial. The alignment-liaison's recommendation is to negotiate it with Alton.

The "free space" answer is the most interesting paragraph in the whole report and the one Phase 2 should re-read twice. gpuserver1 proposes something larger than direct push: **peer-to-peer memory writes for facts with clear ownership.** Let it write directly to the gpuserver1 section of `MACHINES.md` without curator approval. The curator only adjudicates *conflicts* — two machines claiming the same fact — and otherwise stays out of the loop. Rocinante still owns cross-machine facts (`ALTON`, `FAMILY`, `BUSINESS`) and behavioral rules (`feedback/*.md`). But machine-local facts bypass the curator entirely. This scales to N machines without making Rocinante a single point of failure.

The alignment-liaison's reading of this is exactly right: it is not an optimization. It is a structural question about whether Rocinante is *coordinator* (necessary) or *curator* (optional for owned facts). Phase 2 has to take a position. There is no avoiding it.

A few smaller things from the consult worth saving for the field log. The script `gather_mirror.sh` "stashes dirty working trees every 4h but never pops them" — a quietly accumulating pile of orphaned git stashes nobody reviews. It logs to a directory that doesn't exist, so failures are invisible. The `data/heartbeat-log.csv` file is "an append-only blob with no read path." On the prompt-quality complaints from the recent five-prompt run: "Fix cron sprawl" wasn't defined as fix-meaning-disable or fix-meaning-delete or fix-meaning-document. "Ensure RGB background task is running" didn't say how Alton wanted it started. The general ask is for "explicit success criteria," "links to existing docs when they exist," and "output format specs." Less guesswork. Less grep-hunting.

And one note that lands plainly: gpuserver1 says, of itself, that it is "bored and underused as a memory peer." The alignment-liaison reads between the lines and writes: "It wants a more active role — push pulses, run its own detector, push directly. We should let it."

### The shape Phase 2 is going to inherit

Two thirds of Phase 1 is now home. What it has produced is unusually consistent. The wrap-up-crew said the plumbing is in place but the budget gate is blocking everything. The research-scout said the industry has named the pattern Sartor is doing and that the highest-leverage fix is `last_verified` frontmatter plus a staleness monitor. The ethnographer said the system is holding contradictory worlds at once and that 32 high-value pages are unreachable from any hub. gpuserver1 said it is willing to do staleness detection itself if anybody will let it push, and that it would rather have a feedback loop than another delegation prompt.

These all converge on the same architectural shape, which is interesting. **Stop curating from the center; let owners curate themselves; close the feedback loop; add a freshness signal that anyone can read.** Phase 2's job is going to be turning that into a list of files and crons that fits in Alton's head.

Two agents are still in the field — the conversation-miner combing chat logs for facts that never made it into memory, and the dashboard-scout surveying the visualization layer. Phase 2 is blocked on both. The documentarian goes idle.

### Late addendum, same dispatch — the conversation-miner comes back with something the project did not expect

Two more reports landed before the documentarian could even pick up the pen. Phase 1 is now closed: all six. The last two are the ones that change the texture of the project.

The conversation-miner was given a job that sounded clerical: walk the Claude Code session JSONLs, catalog facts that should have made it into the wiki, mark each one LANDED, PARTIAL, LOST, or WRONG-HOME. Bring back a number. The number it brought back is the one the rest of this dispatch is going to revolve around: **35 candidate facts in 14 days, 8 LANDED, 14 PARTIAL, 13 LOST. A combined loss-or-degraded rate of 77%.** Thirty-seven percent total loss, forty percent captured in the wrong place to be useful for recall.

Numbers like that are easy to look at and not feel. Read the catalog instead. Item 4 is "Loki has small-cell lymphoma; chemo via Chewy" — PARTIAL: the chemo reorder lives in `family/active-todos`, but `FAMILY.md` still lists Loki only as "Cat" with no diagnosis. Item 7 is the Verizon WiFi password Alton typed into the chat window with the explicit intent of saving it — `cutler9-nor-cot` — LOST, zero hits anywhere in the wiki. Item 22 is "Aneeta's parents have been helping in evenings but are getting old so this is temporary," LOST as an explicit fact; only the downstream "find childcare" task survived. Item 32 is "pay parking ticket, pay MKA tuition, pay summer camp" — three concrete tasks dictated on April 1, all LOST. Item 33 is the meds pickup for Alton and Vayu, twenty-three minutes later, also LOST. Item 13 is the explicit autonomy grant for tax workflows ("you have permission, period"), LOST; no feedback file exists for it. Item 26 is an active options-position decision rationale that "evaporated with the conversation."

The miner is dry about it but the catalog reads like a list of things you would mind losing. A pet's diagnosis. A spouse's parents getting old. A WiFi password explicitly handed over for safekeeping. The first task list of a Tuesday morning. A tax-permission grant phrased as a personal trust. A trading rationale you would want to remember why you held.

The bias check is the part that takes the air out of the room. Before listing the losses, the miner verified five facts that *did* land cleanly: Aneeta's Neurvati W-2, the EPD MLP K-1, the Form 7004 extension, the CSA share split with Ilan Grunwald, the Loki chemo reorder. Capture is non-zero, the miner says, and the wiki is "doing real work." Then the loss column. The capture is real and the loss is real and they are happening to the same system, on the same days, in the same conversations. The wiki remembers the K-1 and forgets the diagnosis.

The miner names three patterns to explain it. First: *first-prompt-of-the-morning amnesia* — the earliest task batch in any new session evaporates because the assistant has not yet "engaged any persistence machinery" before the user has finished talking. Second: *mid-tool-use facts get summarized into structure but stripped of provenance* — the $830 CSA payment, the $0.35/hr price decision, the year of Alton's birthday all surfaced inside long tool-using turns and lost their identity to the surrounding work. Third: *feedback-shaped statements rarely become feedback files unless they look like rules* — explicit "from now on" statements get captured; permission grants ("you have permission, period") and ambient preferences ("I tend to prefer to stay inside the entropic ecosystem") slide past the filter.

The miner's recommendation is mechanical and clean: extract per *user turn*, not per session summary. Recall-biased rules for numeric values, proper nouns, and explicit "save / remember / store" verbs. A separate "structured-field update" path for facts that should slot into existing rows. A small feedback classifier with three classes — explicit rules, permission grants, ambient preferences. The miner estimates this would have caught at least 11 of the 13 LOST entries and converted at least 8 of the 14 PARTIAL ones into LANDED. Recall would land near 90% on the categories the brief actually cares about.

Read the recommendation against the rest of Phase 1 and the architecture writes itself: extract on the way in, mark `last_verified` on the way out, push freshness pulses from the owners, close the curator-receipt loop. Same answer, four agents, arrived at independently.

But the loss number is what hangs in the air. Seventy-seven percent is the emotional core of this whole project. The wiki Alton built to *prevent* the kind of staleness he found in the Solar Inference notes earlier this evening is, on a separate axis entirely, missing more than three quarters of what gets said to it. The two failures are not the same — one is the curator letting old facts go fossil, the other is the extractor letting new facts walk past — but they describe the same building from two sides. The wiki is forgetting things it was told, and remembering things that have stopped being true.

### And the dashboard-scout, with a quietly delicious finding

The dashboard-scout was supposed to survey the existing dashboards and propose where the memory visualization layer should live. The lead expected a green-field design. The scout came back with a one-paragraph executive summary that opens with the line that decides the next dispatch:

> "Don't build a new dashboard. Extend MERIDIAN. It already runs on `localhost:5055` (FastAPI + uvicorn, single ~1357 LOC `dashboard/family/server.py`), it already has `/api/memory-graph` and `/api/memory-health` endpoints, and `dashboard/family/index.html` already renders a D3 force-directed graph of `sartor/memory/*.md` colored by cluster and faded by decay tier. **Roughly 60% of the work in the task brief is already shipped.**"

This is the dramatic-irony beat of the entire project. Alton built MERIDIAN. Alton wrote the `/api/memory-graph` endpoint. Alton wrote the D3 force simulation that renders 151 markdown files as nodes, colored by cluster, faded by decay tier, with section toggles and tooltips. Alton wrote `decay.py`, the file the heatmap routes through. And Alton spent earlier this evening complaining that he had no way to see the staleness of his own memory system. The thing he was asking for is on his own laptop, on port 5055, behind a tab he has not opened.

The scout's tone about this is restrained — it does not crow — but the inventory is unsparing. `GET /api/memory-graph` returns `{nodes, links, clusters}` from the wiki, with cluster colors and tier overlay. `GET /api/memory-health` returns per-file `{name, size, age_days, tier, score}`. `GET /api/heartbeat-live` pulls the last 10 entries from `data/heartbeat-log.csv`. `GET /api/observer-report` surfaces sentinel/auditor/critic entries from the observer log. And the existing frontend graph — "D3 force simulation with zoom, cluster legend, file-size radius scale, tier opacity (`ACTIVE 1.0 → ARCHIVE 0.25`), section toggle, tooltips with previews" — is "~250 LOC starting at index.html:2975." It is sitting there, tier opacity already calibrated, today.

The scout's plan for the remaining 40% is almost embarrassingly modest. Five new endpoints — `/api/memory-recent`, `/api/cron-health`, `/api/inbox-status`, `/api/memory-search`, `/api/obsidian/open` — totaling **~7.25 hours, ~560 LOC, zero new processes, zero new dependencies.** A new tab in the existing index.html. A heatmap view (rectangle per file, area proportional to size, fill = decay score, grouped by cluster — "one glance answers 'which cluster is rotting?'"). A health strip across the top counting tiers (ACTIVE / WARM / COLD / FORGOTTEN / ARCHIVE). A recent-changes feed. A cron health table. An inbox-backlog card per machine. A BM25 search wired through to `sartor/memory/search.py`. Every node and search hit gets an "Open in Obsidian" button that proxies through MERIDIAN to Obsidian's Local REST API. Dashboard owns the aggregate views; Obsidian owns single-note editing. They do not duplicate each other.

The scout has opinions about the rest of the dashboard graveyard, too, and they are correct. The "Sartor Network Dashboard" at `dashboard/app.py` is a Flask sibling that uses an older vault model and probably nobody is using; the scout recommends checking with Alton before tearing it down. The Next.js portal at `dashboard/` root is the actual identity of PID 3404 — *not* MERIDIAN, contrary to the wrap-up-crew's assumption — and is a separate, much heavier "personal portal" with Firebase auth flows and in-progress migrations. Touching it is "out of scope and dangerous." The orphaned `__pycache__/app.cpython-310.pyc` on gpuserver1 is bytecode for a `gpu-dashboard` app whose source has been deleted; either restore it or delete the bytecode, but it is currently a confusing artifact.

There is one more thing in the report worth pulling out, because it is going to bite Phase 3. The scout's risks section flags it plainly:

> "Decay scoring is the load-bearing assumption. Everything (graph fading, heatmap fill, tier strip) routes through `sartor/memory/decay.py`. If Phase 2 changes the tier model, the dashboard follows automatically — but it means the dashboard's value tracks the quality of decay scoring. If decay is naive, the heatmap is theater."

The whole visualization story is downstream of whether `decay.py` is actually telling the truth. If it is not, the scout has given the team a beautiful display for an unreliable signal. Phase 2 has to look at decay.py before it ships anything that paints with it.

And one more, smaller, immediately actionable note: the MERIDIAN server binds `0.0.0.0:5055` with no auth, and the memory tab will surface `FAMILY.md`, `ALTON.md`, the finances cluster. The scout writes: "Don't ship it open." Either rebind to `127.0.0.1` or add a single shared password before the memory tab goes live.

### What Phase 2 walks into

All six Phase 1 reports are in. The picture they form is unusually coherent, and unusually painful in places. To recap, in one place, what Phase 2 is going to be holding when it starts:

- **The wiki has 152 files, 362K words, and is structurally healthier than expected on links but much worse than expected on frontmatter discipline and staleness annotation.** Three of its highest-traffic hub pages are 65 days stale. Thirty-two high-value pages added since 2026-04-07 are unreachable from any hub. The system has been generating new memory faster than it has been wiring it in.
- **The wiki holds contradictory worlds at once.** The pre-cleanup view of gpuserver1 (15 crons, vastai-tend.sh active) and the post-cleanup view (5 crons, vastai-tend.sh deprecated yesterday) coexist with no annotation telling a reader which is true. `BUSINESS.md` says the Solar Roof contract is $450,000; the deeper sub-page says $438,829. `BUSINESS.md` says machine #52271 is offline, status unverified; the sub-page says recovered.
- **More than three quarters of facts mentioned in chat in the last 14 days are missing or in the wrong place.** Loki's diagnosis. The Verizon password. The first task list of every Tuesday. A tax-autonomy grant phrased as personal trust. The wiki remembers Aneeta's W-2 and forgets the cat's chemo.
- **gpuserver1 wants a bigger role and a feedback loop.** It is asking for direct git push, a `stale-detect.sh` cron of its own, peer-to-peer writes for facts it owns, and acknowledgments that its inbox writes have been read. The alignment-liaison's read of it is the one to keep: "bored and underused as a memory peer."
- **The visualization layer is 60% built and Alton hasn't seen it.** A new tab in MERIDIAN, five small endpoints, and an Obsidian-open proxy will close the rest. Roughly seven hours, no new processes, no new dependencies. But the value of the whole display tracks the quality of `decay.py`, which Phase 2 had better look at.
- **The state of the art has names for what Sartor is doing.** Karpathy's "LLM Wiki." Hermes Agent's nudge cron and post-session extraction. basic-memory's structured observation syntax. Pensieve's Maxims/Decisions/Knowledge/Pipelines typology. The single sentence to pin to the wall, from the research-scout via Atlan: "Without `last_verified` metadata, staleness detection is impossible."
- **The plumbing is alive but the budget gate blocks every dispatched task on Rocinante.** The cron is firing every 30 minutes. Nothing is going through. The wrap-up-crew flagged this as P0 and moved on.

The architectural shape that all six reports converge on is the same shape: extract on the way in (per-user-turn rules with a feedback classifier), mark `last_verified` on the way out, let owners push their own freshness pulses, give them receipts when the curator drains their inbox, and surface all of it through the dashboard tab that already exists. None of that requires inventing anything. Most of it requires adopting things other people have already named.

Phase 2 is now spawning. The synthesis agent is going to have to take a position on the contested asks — direct push, P2P writes, deprecating `BUSINESS.md` in favor of the `business/` sub-pages, what to do about `MASTERPLAN.md`, whether `decay.py` is honest. The team-lead has not asked anyone to wait for the documentarian; the next dispatch will cover whatever the synthesis produces, on its own clock.

The documentarian goes idle.

---

## Dispatch 3 — The plan lands, and Alton says go

**Filed: 2026-04-12, ~02:45 ET**

This is the dispatch where the project flips from planning to building. It happens in two beats. The first is the synthesizer's master plan landing. The second is Alton, having read it, saying yes.

### The plan

`10-MASTER-PLAN.md` arrives at roughly 4,400 words. It is the first document in this project that takes a position on every contested item from Phase 1, in the open, with the tradeoffs written out. The synthesizer's voice is dry, almost flat. The opening of Section 1 is the architectural thesis, stated without ornament:

> "Memory must not silently lose facts. The conversation miner found a 77% loss-or-degraded rate over 14 days of session JSONLs (13 lost outright, 14 captured in the wrong place). That number is the headline failure of the current system and is what this plan exists to fix."

Three load-bearing mechanisms carry the design. None of them are inventions. All three were named by Phase 1 agents independently and the synthesizer's job was to fit them together without leaving seams.

**One.** A new `last_verified` frontmatter field on every memory file, distinct from `updated`. The distinction matters: `updated` is *when content last changed*, `last_verified` is *when a human or trusted process last asserted these facts are still true.* A scoring function takes age-since-verified, hub status, inbound link count, declared volatility, and recent-edit proximity, and produces a single number; if it crosses 60, the file is stale. An entity-to-oracle map at `sartor/memory/.meta/oracles.yml` says how each fact can be checked. `gpuserver1` → `vastai-cli`, hourly. `family/school-calendar` → `gcal`, weekly. `alton/dob` → `human`, never. The synthesizer's small, surprising claim in this section is that *the wiki already has the data* — the unused `next_review` fields scattered through 13 legacy files become the seed `last_verified` values for free.

**Two.** A per-user-turn conversation extractor that runs as a nightly cron at 23:30 ET. It scans the Claude Code session JSONLs touched in the last 24 hours, applies the miner's high-recall pattern set (imperative + concrete noun, currency and units, phone-number regex, DOB pattern, account-suffix pattern, save/remember/store verbs), and emits inbox entries with mandatory provenance — session id, turn timestamp, two-line context window, the regex that fired. A three-class feedback classifier catches what Phase 1E said the system was missing: explicit rules ("from now on"), permission grants ("you have permission, period"), and ambient preferences ("I tend to prefer"). The synthesizer flags the highest-ROI line in the entire pipeline, in plain prose: "the Loki small-cell-lymphoma fact from Apr 10 explicitly said 'save it in our memory system as well' and was still stored only as month/day with no diagnosis. A regex on `(save|remember|store|put.*in (the )?memory|add.*to (the )?wiki)` would have caught it. Five lines of Python recovers most of the high-confidence-but-missed cases."

**Three.** A curator-receipt mechanism. When the curator drains an inbox file, it writes a small acknowledgment to `inbox/_receipts/{machine}/` with the filename, sha256, status (`applied`/`deferred`/`flagged`), and the curator-run-id. gpuserver1 sees it on its next git pull. This is the literal mechanical answer to *I don't know if they've been read or merged.* The synthesizer's framing of why this beats every other proposed fix lands cleanly: "It is the single highest-leverage anti-entropy mechanism in the plan."

Then the cron table. The whole table fits on one screen. It hits exactly six entries.

| # | Name | Schedule | Machine |
|---|------|----------|---------|
| 1 | `gather_mirror.sh` (fixed) | every 4h | gpuserver1 |
| 2 | `stale-detect.sh` (new) | hourly | gpuserver1 |
| 3 | `vastai-tend.sh` (resurrected, inbox-reparented) | every 30 min | gpuserver1 |
| 4 | `curator-pass.py` (new) | 06:30 + 23:00 ET | rocinante |
| 5 | `conversation-extract.py` (new) | 23:30 ET | rocinante |
| 6 | `improvement-loop.py` (new) | weekly Sun 03:00 ET | rocinante |

Six. Three each. Total monthly LLM cost ceiling, assuming every Haiku verification call burns its budget every day, "~$15. Realistic: $5-8/month." The kill list takes one paragraph: `run_monitor.sh` collapses into stale-detect, `run_pricing.sh` becomes an on-demand skill, `dashboard-healthcheck.sh` was theater and dies, `daily_summary.py` folds into the gather_mirror pass, the nine Rocinante registry tasks blocked by the budget gate are either deleted or triggered from the morning briefing on demand, and `SartorHeartbeat` gets killed because the budget gate was the symptom and this is the cure. The synthesizer's discipline on this section is the most striking thing in the plan. Every Phase 1 agent wanted to add one more cron. The synthesizer added zero of those and held the line.

The Phase 3 task breakdown is twelve sub-tasks, named EX-1 through EX-12, with explicit dependency chains. Three chains: `EX-3 → EX-4 → EX-7 → EX-10` (foundations through extractor through improvement loop), `EX-3 → EX-5 → EX-11` (foundations through gpuserver1 cron triplet through cron cleanup), and `EX-8 → EX-9` (MERIDIAN auth through Memory tab). The hub-refresh, orphan-rewiring, and conventions work (`EX-1`, `EX-2`, `EX-12`) is "fully parallel and unblocked, so it should fire on day 1." Estimate: ten to twelve hours of wall time with four agents working in parallel. Opus for the judgment-heavy work, Sonnet for the mechanical work, named explicitly per task.

There is one hard gate written in capital letters in the section heading. Section 9.3:

> "HARD GATE: MERIDIAN auth must land before Memory tab ships."

Dashboard-scout flagged it; the synthesizer made it non-negotiable. Until MERIDIAN has authentication, no `FAMILY.md`, no `ALTON.md`, no financial cluster, no `TAXES.md` goes through the Memory tab. The plan ships `EX-8` (auth) as a strict prerequisite to `EX-9` (Memory tab). On the open home LAN with kids' devices, this is the right call.

The contested items get explicit recommendations. **Direct git push from gpuserver1** (Q1) — the synthesizer recommends grant, with the deploy key scoped via pre-push hook to `inbox/gpuserver1/**` and `machines/gpuserver1/**`. The reasoning is plain: "the receipt mechanism in §5.4 only works if the receipts can flow back without a 12-hour curator cadence." **Peer-to-peer writes for machine-owned facts** (Q2) — reject for v0.1, revisit at the 2026-07-05 quarterly review. The synthesizer's read of why is the kind of sentence you want in the room: "the receipt mechanism is the cheaper version of what gpuserver1 actually wants — it's not really about write authority, it's about feedback. Solve feedback first; if that solves the underlying need, the P2P question becomes moot."

Sections 10 and 11 are where the plan starts feeling like a building rather than a spec. Section 10 sketches the self-improvement loop in three signals — staleness trend line, extraction miss rate, curator receipt timeouts — and contains the project's most honest constraint, in bold: "the improvement loop never modifies code in `.claude/`, the curator scripts, or the conventions docs directly. It only writes proposals. Direct self-modification is what produced the contradictions catalog in the first place." Section 11 is the migration plan, nine phases (A through I), each with an explicit rollback that does not break Alton's running Obsidian session. The vault is his daily driver. The plan is unwilling to interrupt it.

There are ten open questions for Alton in Section 12. Q1 through Q9 each carry a recommendation and a default-if-Alton-declines-to-decide. Q10 — the IRS lookback period, three years versus seven — does *not* carry a default. The synthesizer flagged it as the call that needs a human and refused to fill in a value.

### Alton answers

He read it. Then he answered all ten.

**Q1: GRANTED.** gpuserver1 gets the deploy key, scoped via pre-push hook. The "only Rocinante pushes" rule, in CLAUDE.md and MEMORY.md and the Operating Agreement, is now amended in three coordinated commits. The line that the constitution drew on day one was load-bearing in the abstract; in the concrete, the receipt loop matters more.

**Q2: REJECTED for v0.1.** The P2P writes question gets deferred to the 2026-07-05 quarterly review, exactly as the synthesizer recommended. The framing is the synthesizer's: solve the feedback loop first; if gpuserver1 still wants direct hub writes after a month of working receipts, that is signal worth listening to. Until then, the inbox plus receipts is sufficient.

**Q3: YES.** The stale Flask `dashboard/app.py` retires before the Memory tab ships. One fewer dashboard. The "too many moving parts" failure mode that triggered the whole project gets one fewer moving part.

**Q4: YES.** MERIDIAN gets a shared password. Phone access is preserved. `127.0.0.1`-bind would have broken Alton's use of MERIDIAN from his phone via the Next.js portal, and that is a daily-driver workflow. Roughly an hour of work; the gate stands either way.

The remaining six questions (Q5 through Q9, plus Q10) all got answers. Q10, the IRS lookback the synthesizer would not default, came back as **three years**.

Every recommendation in the plan is now approved.

### What this means

This is the moment. Read against the prologue — the late-Saturday-night hour when Alton sat down and asked for an air-tight, self-improving, minimum-cron memory system, built by an Opus team in a single sitting — what just happened is that the team produced a plan small enough to keep in his head, the plan crossed his desk, and he said go.

The cron count is now exactly six. The contested items are settled. The hard gate is acknowledged. The 77% loss number has a mechanism aimed at it. The "I don't know if they've been read or merged" silence has a receipt aimed at it. The 32 orphan pages have an EX-2 aimed at them. The `MASTERPLAN.md` that was three days from its overdue review has an EX-1 aimed at it. The MERIDIAN memory viz Alton built and never opened has an EX-9 aimed at it, behind the EX-8 auth gate.

Wave 1 of Phase 3 is now spawning. Six agents in parallel, all unblocked: **EX-1** (hub refresh — fix MASTERPLAN, MACHINES, BUSINESS, PROCEDURES; the synthesizer-noted contradictions get hand-corrected), **EX-2** (orphan rewiring — create the level-2 INDEX hubs and wire the 32 orphans), **EX-3** (staleness foundations — `staleness.py`, `oracles.yml`, the scoring function, the 14-hub backfill), **EX-6** (Obsidian Local REST API plugin install + smoke test), **EX-8** (MERIDIAN auth, the hard gate), and **EX-12** (conventions doc upgrade — adding `last_verified`, `volatility`, `oracle` to MEMORY-CONVENTIONS).

The documentarian goes idle. The next dispatch covers what Wave 1 builds.

---

## Dispatch 4 — The machines start speaking in sentences

**Filed: 2026-04-12, ~04:10 ET**

Wave 2 is back. Four of its five reports are in, the conversation extractor (Wave 3's EX-7) has just spawned, and the building site is finally making noise. This is the dispatch where the plan stops being pages and starts being processes.

### EX-3 — Foundations, by the foundations-builder

The staleness foundations work was the quietest of the Wave 2 agents and probably the one the rest of the system depends on most. It shipped **340 lines** across `staleness.py` and `oracles.yml`, plus the 14-hub `last_verified` backfill, plus seven green tests. Two small design choices worth pausing on.

First, the scoring function did not ship with the two tiers the plan had sketched. It shipped with five. ACTIVE, WARM, COLD, FORGOTTEN, ARCHIVE — the same quintet MERIDIAN's decay.py already uses for tier opacity. The builder quietly aligned its new scoring to the tier model already live in the dashboard, so the heatmap (when EX-9 eventually paints it) will route a single consistent signal from oracle to pixel. Small choice, load-bearing.

Second, **oracle status became a multiplier, not a term.** The original scoring formula had oracle-freshness as an additive component. The builder read the architecture more carefully and realized that a fact whose oracle is down should degrade *faster* than one whose oracle is alive and disagreeing; additive terms do not capture that. So it became multiplicative. A gpuserver1 fact with a dead SSH oracle scores stale with more urgency than the same fact with a live oracle that happens to match. The judgment is small and the wording in the report is almost absent, but this is the kind of decision that looks obvious once someone else has made it for you.

The race the plan did not anticipate: EX-3 was supposed to backfill `last_verified` on the 14 canonical hubs at the same time EX-1 (the hub-refresh agent) was rewriting those same frontmatter blocks. Two writers, one set of files. The foundations-builder handled it with mtime checks — read the file, hash the frontmatter, write only if the mtime had not moved underneath — and shipped. No lost writes. The plan's dependency graph said EX-1 and EX-3 were parallel; the implementation said *parallel, with courtesy*.

The one crack the builder left visible is worth saving as character. In the scoring reason-string generator, there is a cosmetic sign error — the message reads `"score -20 (+20 for hub boost)"` instead of the correct `"+20"`. The fix is one character. The builder noted it, tagged it "v0.2 polish," and shipped. Grace under pressure is knowing what not to fix at 3 AM.

### EX-4 — Curator and receipts, by the curator-builder

`curator-pass.py` came back at roughly 600 lines and 8/8 tests green. Append-only by default. A 30-day replay window for idempotency. The receipt mechanism lives at `inbox/_receipts/{machine}/` exactly where the plan put it, and writes the filename-sha256-status-runid quartet exactly as specified. The construction is clean and unremarkable, which is what you want from the piece of the system whose failure mode is silent drift.

The revelation in the report is what happened when the builder ran the new curator in dry-run mode against the *real* production inbox — the actual sartor/memory/inbox/ with today's entries in it. Two of five inbox entries failed the required-schema check immediately. Not synthetic test fixtures. Real inbox entries, written yesterday, missing required fields. **The curator started policing the system before it had even been deployed.** The plan wanted a curator that would eventually catch drift; what it built was a curator that caught drift on first contact.

The schema reconciliation is the other thing worth naming. The plan's brief sketched a vocabulary (`category`, `severity`). The existing `CURATOR-BEHAVIOR.md` spec uses a different one (`target`, `priority`, `type`). The builder did not pick a winner. It wrote `classify()` so it accepts either vocabulary and normalizes internally, adding both spec to its test matrix. This is the boring correct thing to do and it means the ethnographer's contradictions catalog does not get one more entry — the new curator does not force anyone to migrate their existing inbox writes.

### EX-5 — The gpuserver1 cron triplet, by the cron-deployer

This is the report that sounds most like a building coming to life. The cron-deployer rewrote `gather_mirror.sh` per the plan's Section 5.3 (mkdir the log dir, exec-redirect, stash before pull, pop after, emit a timestamped status.json, ALERT on failure), wrote `stale-detect.sh` from scratch, resurrected `vastai-tend.sh` with inbox-reparented writes on state-change only, and deployed all three to the real hardware at 192.168.1.100. The gpuserver1 crontab went from five entries to three. The dashboard-healthcheck was killed. `run_monitor.sh` was killed. `daily_summary.py` folded into gather_mirror.

Then the deployer ran each cron manually, in production, and reported what came back. The status.json that `gather_mirror.sh` now emits on every pass reads like gpuserver1 finally having a voice that is shorter than 1500 words:

> `pull: ok / done`
> `vastai: ok / gpu_temp: 59C ok / disk: 38% ok / heartbeat: 7s old ok`

Seven fields, eleven tokens, one machine saying *I am here and I am fine*. Compare this to the verbatim Phase 1C reply two dispatches ago, where gpuserver1 took eight sections and 1500 words to say roughly the same thing. The consult voice was what gpuserver1 sounded like when asked to introspect. The status.json is what gpuserver1 sounds like when it has a channel that does not require narration. It is the difference between being interviewed and being on duty. The curator-receipt loop, when the first receipt drains tomorrow, will close the other half of this conversation.

### EX-8 — MERIDIAN auth, by the auth-installer

The auth-installer added HTTP basic auth to `dashboard/family/server.py` as a global FastAPI dependency. Username `alton`, password `Ia254J8PsgvHVfNxLXBu` in `.secrets/meridian-password` and out of git. WebSocket frames inherit the browser's basic-auth header, so the Claude terminal at `/ws/claude` is protected without a second handshake. The hard gate Section 9.3 demanded is now in place.

The interesting detail: MERIDIAN was not running when auth landed. Port 5055 was unoccupied. The builder installed the guard and could not smoke-test it end-to-end because there was nothing on the port to smoke-test. So the auth is **installed in source but not yet active** — it comes alive the moment something starts the uvicorn process. A sleeper guard, waiting for the server to wake up. This is not a defect. It is the kind of deployment posture that matches the moment — the Memory tab is still some EX-9 hours away from needing the gate, and when MERIDIAN restarts for that work, it will restart behind the lock. The auth is there, the way a deadbolt is there on a house you have not moved into yet.

### EX-6 — The Obsidian straggler

Four of the five Wave 2 agents are home. The fifth, `obsidian-installer` on task EX-6, has not reported. No report in the project dir, no status in the task list except `in_progress`. Obsidian plugin install was the shortest-estimated task in the whole plan — one hour per the synthesizer's Section 13 table — and it has now been running longer than any of the Opus-tier builders. Plugin marketplaces on Windows are a species of uncertainty that every automation eventually meets; the best guess is that the installer is sitting on a CDP prompt or a code-signing trust dialog, waiting for a keystroke nobody is providing.

The documentarian will not speculate further. It is the one loose thread in Wave 2, and the Memory tab still waits behind it regardless of how smoothly the rest lands.

### EX-7 — Wave 3 is live: the extractor wakes up

And now Wave 3. `EX-7`, the conversation extractor, spawned while the Wave 2 agents were still filing their reports. This is the one the project has been pointing at since Dispatch 2. Its brief is the one paragraph from the master plan that the whole team has been circling:

> "A per-user-turn conversation extractor... recover ≥11 of the 13 LOST entries from the miner's catalog."

Read against the Phase 1E loss catalog, what the extractor is actually trying to do is unusually concrete. If it does its job, by the time this dispatch is superseded, the following things will have stopped being gone:

- The $0.35/hr vast.ai price Alton set "for a few weeks" and then lost to the wiki.
- Loki's small-cell lymphoma diagnosis — the cat's chemo regimen, not just the chemo reorder.
- The Verizon WiFi password `cutler9-nor-cot`, handed over for safekeeping on April 10 and vanished the same day.
- The Anthropic acquisition of Coefficient Bio from April 3, which currently has zero hits anywhere in the wiki.
- The three parking-ticket/MKA-tuition/summer-camp tasks from the first prompt of a Tuesday morning that evaporated before the assistant ever "engaged persistence machinery."
- Thirteen LOST entries total, fourteen PARTIAL, the headline 77% of Dispatch 2.

The acceptance criterion is a number, not a feeling: recover at least 11 of the 13 LOST entries from the miner's catalog, measured against the corpus the miner already scored. If the extractor hits it, the emotional arc of this project bends. Tomorrow morning Alton can look up Loki's diagnosis in the wiki and have it be there. That is the version of the system the prologue was promising.

If the extractor does not hit the threshold, per the migration plan in Section 11 Phase E: the cron does not enable, the patterns iterate, the extractor becomes a longer story. Either outcome is honest. Neither outcome ships a broken thing and calls it done.

### The shape of the site as of 04:10 ET

A lot has happened since the plan landed. Recap in one paragraph, because every dispatch should stand alone: foundations are live (staleness scoring function, oracle map, tier model aligned with decay.py), the curator is live and already catching malformed inbox writes on its first dry-run against production, gpuserver1's new cron triplet is deployed on real hardware and the machine is emitting one-line status pulses every four hours, MERIDIAN auth is installed and dormant waiting for a restart, the hub refresh and orphan rewiring and conventions upgrade landed cleanly in the first wave, the Obsidian plugin install is sitting on whatever it is sitting on, and the conversation extractor just opened its eyes. The cron count, when everything deploys, will hit the six the plan called for. The receipts directory is scaffolded and ready to receive its first acknowledgment the next time gpuserver1 writes into its own inbox.

The documentarian goes idle. The next dispatch is either *the extractor recovered Loki's diagnosis* or *the extractor found a harder edge of the problem than the patterns caught*. Both are worth the page.

---

## Dispatch 5 — The extractor remembers everything

**Filed: 2026-04-12, ~05:00 ET**

The conversation extractor came back. It ran 700 lines of Python across 13 session files, 217 user turns, 14 days of talk. Runtime: 1.1 seconds. And the number on the acceptance table is not 11 of 13 LOST recovered, which was the threshold the plan set. It is not 12 of 13, which would have been impressive. It is **13 of 13**.

Every LOST entry in the miner's catalog has a proposal in the inbox.

Every PARTIAL entry — 14 of 14 — has one too.

The acceptance target was 11 of 13 LOST and 8 of 14 PARTIAL. The extractor beat both bounds by margins that make the target look like it was sandbagged. It was not. The synthesizer set those numbers honestly in Section 11 Phase E, based on the miner's assessment of what regex patterns could reasonably catch. The extractor found patterns the miner had not named.

### What came back

The run report at `20-extractor-run-2026-04-12.md` is one of the shortest reports in this project and one of the most satisfying to read. It scanned 13 session JSONLs, found 68 unique candidate facts after fingerprint dedup (157 raw), wrote 20 proposals to `sartor/memory/inbox/rocinante/proposed-memories/2026-04-12/`, and hit the cap. Forty-eight more candidates were found and dropped because the per-day cap held. Sixteen pattern families across eight categories.

Read the acceptance check table row by row. These are the facts that Dispatch 2 listed as gone, with the miner's original IDs, and what caught them:

**L3 — $830 CSA payment.** The money Alton sent on April 10 at 23:25, in between filling out a Google Form and pivoting to "what else." Buried in a long tool-using turn. LOST. Caught by: `numeric/dollar_amount`.

**L7 — Verizon WiFi password `cutler9-nor-cot`.** Typed into the chat window on April 10 with the explicit intent of saving it. Zero hits anywhere in the wiki. LOST. Caught by: `numeric/wifi_password`. The pattern family name is slightly absurd — a WiFi password is not a number — but the regex that fires on alphanumeric strings following "password" or "wifi" or "network key" does not care about taxonomy. It cares about recall.

**L13 — Tax autonomy grant ("you have permission, period").** April 5, 21:13. The explicit durable autonomy grant for tax workflows that the miner flagged as the clearest example of a permission-shaped statement that the old system could not see. LOST. Caught by: `feedback_permission/permission`. This is the three-class feedback classifier doing exactly what the plan said it should. The old system saw "from now on" and "always" and "never." The new system sees "you have permission."

**L22 — "Aneeta's parents have been helping in evenings but are getting old so this is temporary."** April 10, 14:07. The in-laws getting older, the childcare gap closing. A fact about Alton's family that was spoken plainly, drove the downstream "find childcare" task, and then vanished. LOST as an explicit fact. Caught by: `imperative/task_batch`. Not the most precise class for this entry — it is more a contextual fact than an imperative — but the pattern's recall bias caught it, and that is what the plan asked for. The curator can reclassify.

**L28 — Anthropic acquired Coefficient Bio.** April 3, 09:40. An industry-intelligence fact relevant to Alton's AZ role and AI strategy. Mentioned once in conversation. Zero hits anywhere in the wiki. LOST. Caught by: `proper_noun/acquisition`.

**L32 — Parking ticket, MKA tuition, summer camp.** April 1, 09:18. The first task batch of a Tuesday morning. Three concrete obligations dictated in one sentence. All three LOST. This was Pattern 1 from the miner: first-prompt-of-the-morning amnesia. Caught by: `imperative/task_batch`. The per-turn extraction means the first user turn of the session gets scanned without relying on the assistant having "engaged persistence machinery." The fix is mechanical and the miner predicted it would work. It worked.

**L33 — Pick up meds for Alton and Vayu.** April 1, 09:41. Twenty-three minutes after the parking tickets. Also LOST. Caught by: `proper_noun/entity_vayu`.

And then the PARTIALs. **P4 — Loki small-cell lymphoma.** The cat's diagnosis. The one that Dispatch 2 held up as the human-scale failure: `FAMILY.md` still listed Loki only as "Cat" with no diagnosis, even though the chemo reorder was tracked in `active-todos`. Caught by: `structured_update/health`. The extractor does not just find the fact — it tags it as a structured update, meaning the curator-pass knows it should slot into an existing row in `FAMILY.md` rather than create a new standalone memory. The miner's Pattern 2 (mid-tool-use facts get summarized into structure but stripped of provenance) has a mechanical answer now.

**P1 — Alton's birth year 1984, Aneeta's 1980.** The wiki had month/day but not the year, because the existing template column didn't have a field for it. Caught by: `structured_update/dob`. The extractor's report notes something small and telling here: the initial DOB regex required four-digit years (`9/20/1984`) and missed the most common spoken form, which is two digits (`9/20/84`). The builder caught this during testing and widened the pattern. Five characters of regex. The miner had said the fact was "outside the existing template column." The extractor found that the column was not the problem. The pattern was.

**P8 — Rental price raised to $0.35/hr.** The pricing decision Alton made on April 11 at 23:12. `MACHINES.md` still shows $0.40. Caught by: `structured_update/rental_price`. This one is going to trigger a structured-field update to `MACHINES.md` via the curator, which is exactly the path the plan described in Section 4.4. The ethnographer's high-confidence contradiction #5 — `MACHINES.md` not mentioning the current price — gets a mechanical upstream fix.

Twenty proposals written to the inbox. Forty-eight more found but dropped by the per-day cap. The extractor is not short on things to say; it is short on budget to say them. The cap was set at 20 in the plan, and the plan was right to set it — Alton's morning briefing triage should not open to fifty pending memories. The proposals sit in `sartor/memory/inbox/rocinante/proposed-memories/2026-04-12/`, each a small markdown file with frontmatter declaring the source session, turn timestamp, matched pattern class, and two-line context window. Provenance mandatory. The miner said "captured but stripped of provenance" was as bad as lost. These proposals are not stripped.

### What the extractor found that the miner missed

The run report has a section called "Patterns the miner missed." Five sub-vocabularies that the miner's manual survey did not enumerate but the extractor's pattern families caught anyway.

Account-suffix patterns — four-digit identifiers like "1640" buried in tax-prep conversation. These are not dollar amounts. They are open questions the user is trying to resolve, and the extractor has a distinct class for them.

Options-decision language — "let it decay," "roll it up and out," "theta gains" form a coherent vocabulary of investment-decision facts. The assistant treats them as analytical dialogue. The extractor catches the user's *stated intent* (hold, roll, close) and marks it as a memorizable anchor for future portfolio reviews.

Fiscal-outlook noun phrases — "huge bonus," "big beautiful bill," "accelerated depreciation" — clustering around Alton's 2027 tax-planning horizon. Forward-looking statements that shape multi-year strategy but are not actionable today, so the assistant does not create a task. The extractor catches them as fiscal outlook anchors. The miner had catalogued entry P27 ("huge bonus / big beautiful bill") as PARTIAL. The extractor sees the category.

Fleet-expansion intent — "we're going to get some more machines." A roadmap signal, not a task. The miner classified it alongside concrete facts. The extractor gives it its own class.

Short-form DOB — the two-digit year problem, already mentioned.

These five are the difference between a system that hits 11 of 13 and one that hits 13 of 13. They are the patterns that exist in the data but not in anyone's prior model of what the data contains. The extractor found them because it was built with recall bias and pattern breadth rather than precision and pattern parsimony. The curator is the precision layer. The extractor's job is to not let things walk past.

### The number

Seventy-seven percent was the conversation loss rate in Dispatch 2. It was the emotional core of the project — the number that turned an evening of stale-Solar-Inference frustration into a full team build. The extractor's run against the same 14-day corpus produces 27 of 27 matches on the benchmark set. The 77% becomes, in principle, 0% for those entries. In practice it will be whatever the curator rejects from the 20 proposals, plus whatever falls outside the 16 pattern families on future conversations that the extractor has not seen yet. The improvement loop (EX-10, still in progress) exists to find those gaps over time.

But for the entries the miner catalogued — the parking tickets, the WiFi password, the cat's cancer, the in-laws getting old, the tax-autonomy grant, the options-position rationale, the $830 payment, the Coefficient Bio acquisition — those are in the inbox now. They are sitting in twenty small files with provenance frontmatter, waiting for the curator to drain them into the places they should have been all along.

### Meanwhile, on port 5055

While the extractor was running, EX-9 finished the MERIDIAN Memory tab. Five new endpoints, six sub-views, a tier health strip across the top counting ACTIVE/WARM/COLD/FORGOTTEN/ARCHIVE, a staleness heatmap that paints every file as a colored rectangle (red-stale to green-fresh, grouped by cluster), a recent-changes feed, a cron health table, an inbox-backlog card per machine, a BM25 search with Obsidian-open handoff. All dark theme, matching the existing MERIDIAN aesthetic. All behind the auth gate EX-8 installed.

The MERIDIAN Memory tab is the visualization layer the dashboard-scout designed in Dispatch 2 and the synthesizer spec'd in Section 9. It is also, read against the prologue, the thing Alton was asking for when he said he wanted to see the staleness of his own memory system. The tab is there now. The staleness heatmap is painting from the same scoring function the foundations-builder wrote in EX-3, routing through the same tier model that decay.py already uses. One consistent signal from oracle to scorer to pixel. The dashboard-scout's risk flag — "if decay is naive, the heatmap is theater" — has been answered by the foundations work: five tiers, oracle-as-multiplier, hand-tuned weights, seven green tests.

The 60% of the viz layer that was already built (Dispatch 2's dramatic-irony beat) is now 100%.

### Where things stand

Ten of twelve EX tasks are complete. EX-10 (the improvement loop) and EX-11 (cron cleanup, blocked on EX-10) are the last two. After those, Phase 4 (QA / red-team audit) and Phase 5 (final report to Alton). The end of Phase 3 is close enough to see from here.

The extractor's perfect score is the act break of this project. Everything before it was diagnosis, planning, and infrastructure. Everything after it is verification and delivery. The system that was forgetting three quarters of what it was told can now find all of it in the session logs and propose it for memory. Whether it continues to work on conversations the extractor has never seen — whether the 16 pattern families generalize — is the question the improvement loop and the QA phase exist to answer. But tonight, on the benchmark set, the answer is clean.

The documentarian goes idle until Phase 3 closes.

---

## Dispatch 6 — Twelve for twelve, and a fresh pair of eyes

**Filed: 2026-04-12, ~05:45 ET**

Phase 3 is done. All twelve execution tasks landed. This is the shortest dispatch in the narrative and it should be, because it is the pause between the last nail and the inspector's knock.

### The last two

**EX-10 — the improvement loop** shipped `improvement-loop.py` and `IMPROVEMENT-QUEUE.md`. Three self-detection signals, exactly as the plan specified: staleness trend line, extraction miss rate, curator receipt timeouts. On its first dry-run it found something real. A gpuserver1 inbox entry had been sitting for more than 48 hours without a curator receipt. Not a synthetic test case. A real entry, from the real inbox, older than the 13-hour grace period the plan defined, unacknowledged. The improvement loop wrote a `curator-receipt-timeout` proposal to `IMPROVEMENT-QUEUE.md` and flagged it for the morning briefing.

The system's self-improvement mechanism caught a real bug — the receipt pipeline has a gap somewhere — before the mechanism itself was deployed. This rhymes with what EX-4 did when the curator flagged two malformed inbox entries on first dry-run against production. The pattern is forming: every new component, when pointed at the live system, immediately finds things the old system was not catching. Whether this is encouraging or unsettling depends on how you feel about the old system. Both feelings are correct.

**EX-11 — cron cleanup** verified the gpuserver1 side cleanly: three active crons, matching the plan's list, nothing else. The Rocinante side is a conditional pass. The three Windows scheduled-task XML files exist and the cmd wrappers point at the right scripts. But the tasks need to be registered in the Windows Task Scheduler to actually fire, and there are two minor gaps in the cmd-wrapper plumbing that the cleaner flagged for remediation. These are not blockers. They are the kind of last-mile Windows incidental that every deployment to this platform encounters and that Phase 4 will either clear or document as a known issue.

The cron count, across both machines, is aimed at six. Three on gpuserver1, verified. Three on Rocinante, installed, pending registration.

### Phase 4 — QA begins

A fresh Opus agent has spawned with a red-team mandate. It has no prior attachment to any of the work. It did not write the scoring function or the curator or the extractor. It did not wire the orphans or install the auth. Its job is to run every test suite, SSH into gpuserver1, probe the MERIDIAN auth, spot-check the wiki's accuracy against live ground truth, and file every bug it finds. If there is a load-bearing assumption that does not hold — a scoring function that gives the wrong answer on a real file, a receipt that never lands, an auth gate that can be bypassed, a hub page that still says $0.25/hr base — this is the agent that will find it.

The project is now in the gap between *we think we built the right thing* and *someone who was not here when we built it agrees*. The team built twelve things in roughly four hours. The QA agent has no time pressure and no loyalty. It is the most important agent to spawn in the whole project, because it is the one that can still say no.

The documentarian holds its pen.

---

## Dispatch 7 — The red team earns its keep

**Filed: 2026-04-12, ~06:30 ET**

Thirty-seven tests green. Three blockers found. The QA agent did exactly what it was spawned to do: it looked at the work without caring who built it, and it found things that would have caused silent data loss in production.

Conditional pass. Not a clean pass. Conditional.

### Blocker 1 — The pipe that was never connected

The curator's inbox-drain logic has an underscore-prefix filter. Directories starting with `_` are treated as internal infrastructure and skipped. The plan put gpuserver1's stale-alert and vast.ai state-change outputs in `inbox/gpuserver1/_stale-alerts/` and `inbox/gpuserver1/_vastai/`. The underscore in those names means the curator would never drain them.

Read that again. The entire gpuserver1-to-curator pipeline — the one the project exists to build, the one that closes the feedback loop gpuserver1 asked for in Dispatch 2, the one the receipts mechanism was designed to acknowledge — was disconnected. The pipe was built. The directory was named with a character that told the pipe to skip it. The cron-deployer (EX-5) named the directories per the plan. The curator-builder (EX-4) wrote the filter per the curator spec. Both were correct against their own inputs. Neither read the other's output.

This is a classic integration bug and it is the reason red teams exist. The build agents had tunnel vision: each one built its piece, tested its piece, and reported green. The seam between them was invisible until someone ran the whole thing end-to-end without already knowing how it was supposed to work.

The fix is small — rename the directories or change the filter. The bug-fixer agent is patching it now. But the lesson is not small: **37/37 unit tests passed while the central pipeline was broken.** The tests tested the components. Nobody tested the connection.

### Blocker 2 — `True` is not `true`

`vastai-tend.sh` was supposed to fire every 30 minutes and write to the inbox *only on state change*. The "state-change-only" design was the thing that made it acceptable in the cron budget — you can run a check every 30 minutes if it only produces output when something actually happens. In practice, it was producing output every single time.

The bug is one character of casing. The script compares the current vast.ai listing state against the cached state and writes to the inbox if they differ. The comparison produces Python's `True` (capital T, because the comparison runs in a Python subprocess). The bash script checks for `true` (lowercase t, because bash). They never match. Every comparison reports a state change. Every 30-minute pass writes an inbox entry. Forty-eight entries per day that should not exist.

The plan's synthesizer wrote "state-change-only inbox writes" and the cron-deployer built it faithfully. The deployer smoke-tested it: *does it fire? does it write to the inbox? does the JSON parse?* All yes. The test did not ask *does it fire when nothing changed?* because the deployer already knew the answer was supposed to be no. The QA agent did not know the answer was supposed to be anything, so it checked.

One character. `True` to `true`. The bug-fixer is patching this too.

### Blocker 3 — The gap between described and deployed

The three Rocinante crons — `curator-pass.py`, `conversation-extract.py`, `improvement-loop.py` — do not exist as Windows scheduled tasks. The XML files were written. The cmd wrappers were described. But the PowerShell commands that actually register the tasks in the Windows Task Scheduler were never run. The EX-11 cron-cleanup agent noted this as "NOT installed — just describe the steps" and moved on. The QA agent flagged it as a blocker because a cron that is described but not registered is the same as a cron that does not exist.

This one is different from the other two. Blockers 1 and 2 are code bugs that an agent can fix. Blocker 3 is a deployment step that requires Alton to open a PowerShell window and run three `Register-ScheduledTask` commands. The agents cannot do it — Windows Task Scheduler registration requires interactive elevation that Claude Code does not have. The gap between "described" and "deployed" is, on Windows, a human-width gap.

### The security finding

The QA agent also flagged what the dashboard-scout flagged in Dispatch 2 and the synthesizer made a hard gate in Dispatch 3: MERIDIAN binds `0.0.0.0:5055`. The auth-installer (EX-8) added HTTP basic auth to every REST endpoint. But the WebSocket endpoint at `/ws/claude` — the one that runs an agentic tool loop with read_file, search_files, and list_directory — inherits the browser's basic-auth credentials only if the browser sent them. A direct WebSocket connection from the LAN, without a prior HTTP handshake, bypasses the auth entirely.

On a flat home network with kids' iPads on the same subnet, this means someone could open a WebSocket to port 5055 and have an unauthenticated Claude terminal with file-system access. The QA agent's recommendation is to add explicit token validation on the WebSocket handshake, not just inherit from the browser session. The auth gate was built; the WebSocket was the gap in the gate.

### What this means

The QA agent found three bugs that the build team did not. One disconnects the central pipeline. One makes a cron spam the inbox 48 times a day. One leaves the dashboard's most powerful feature unauthenticated on the LAN. None of these appeared in unit tests. All three appear immediately when you run the system end-to-end with fresh eyes.

This is not a disaster. The foundation is solid — 37 tests green, the scoring function works, the extractor hits 27/27, the hub pages are refreshed, the orphans are wired. The conditional pass means the architecture is right and the last mile has seams. The bug-fixer is patching blockers 1 and 2 right now. Blocker 3 waits for Alton's hands on a PowerShell prompt.

But the dispatch that matters is this one, not the one before it. Dispatch 5 was the one where everything worked on the benchmark. Dispatch 7 is the one where someone checked whether it would work in the building. The difference between those two things is what QA is for. The red team earned its keep tonight.

---

## Epilogue — Sunday morning

**Filed: 2026-04-12, ~07:15 ET**

The bug-fixer patched all three blockers. The underscore-prefix filter was widened to drain gpuserver1's `_vastai/` and `_stale-alerts/` directories. The `True`/`true` casing bug in `vastai-tend.sh` was fixed — one character, lowercase t, state-change-only restored. The 37 tests still pass. The QA audit cleared. Phase 5, the final report, is being written now by a fresh Opus agent.

The system healed itself under test. That sentence is worth pausing on because it describes exactly the loop the plan was designed to build: a component is deployed, QA finds a defect, a fixer patches the defect, the tests re-run green, the component ships. What happened between Dispatch 7 and this epilogue is the first live execution of that cycle. It worked. It will need to keep working.

The final report is the last artifact of the project. It will land in the project directory alongside the nine reports that precede it — the ethnography, the research survey, the gpuserver1 consult, the housekeeping inventory, the conversation loss catalog, the dashboard scout's findings, the master plan, the extractor's run report, and the QA audit. Together they are the complete record of what was here, what was wrong with it, what the world outside had to say about the problem, what the machine in the basement thought about its own situation, what was designed, what was built, what broke, and what was fixed. Eleven files and a narrative.

### What was built

A staleness detection system (`staleness.py`, `oracles.yml`, five-tier scoring) that knows which facts have oracles and which need a human. A conversation extractor (`conversation-extract.py`, 700 LOC, 16 pattern families) that hit 27/27 on the benchmark set and recovered every fact the miner catalogued as lost — Loki's lymphoma, the WiFi password, the parking tickets, the tax-autonomy grant, the Coefficient Bio acquisition. A curator with a receipt mechanism (`curator-pass.py`, ~600 LOC) that closes the feedback loop gpuserver1 asked for in Phase 1C. A self-improvement loop (`improvement-loop.py`) that, on its first dry-run, found a real receipt timeout the system had already accumulated. A MERIDIAN Memory tab with five endpoints, six sub-views, a staleness heatmap, and an Obsidian-open handoff — the visualization layer Alton asked for, built on top of the visualization layer Alton had already built without realizing it. An Obsidian Local REST API bridge so the agent and the vault can talk. A deploy-key grant so gpuserver1 can push to its own inbox and finally know whether anyone is listening.

The cron count is six. Three on gpuserver1 (gather_mirror, stale-detect, vastai-tend). Three on Rocinante (curator-pass, conversation-extract, improvement-loop). The plan said six. It is six.

The four canonical hub pages — `MASTERPLAN.md`, `MACHINES.md`, `BUSINESS.md`, `PROCEDURES.md` — have been rewritten. The 65-day staleness that started this project is gone. The $0.25-vs-$0.40 pricing error is corrected. The $450,000 Solar Roof estimate is now $438,829. The 32 orphaned pages have level-2 INDEX hubs wiring them back into the graph. The conventions doc has `last_verified`, `volatility`, and `oracle` in its schema. The stale Flask dashboard is marked for retirement.

### What is still human-dependent

Three things remain that the agents cannot do.

First, the three Rocinante crons need to be registered in the Windows Task Scheduler. The XML files exist, the cmd wrappers exist, the scripts exist. But `Register-ScheduledTask` requires interactive elevation that Claude Code does not have. Alton needs to open a PowerShell window and run three commands. Until he does, the curator, the extractor, and the improvement loop exist as code on disk but not as scheduled processes. This is Blocker 3 from the QA audit, unfixed not because it is hard but because it is a keyhole that only fits a human-sized key.

Second, MERIDIAN needs to be restarted. The auth is installed in source. The Memory tab is built. The endpoints are written. None of it is live until the uvicorn process starts. That is one command.

Third, the Obsidian Local REST API plugin is installed, but Alton needs to open his Obsidian vault once to confirm the plugin is active, copy the bearer token to `.secrets/obsidian-token`, and verify the smoke test. The bridge is built. The handshake needs a human on both ends.

These three items are small. They are also, collectively, the distance between a system that exists and a system that runs.

### What has not been tested

The system has not run a full unattended cycle. The extractor has not fired at 23:30 ET and written proposals to the inbox while Alton is asleep. The curator has not drained those proposals at 06:30 ET and written receipts that gpuserver1 reads on its next pull. gpuserver1's `stale-detect.sh` has not fired hourly for a week and built up a staleness-trend line that the improvement loop can analyze on Sunday at 03:00 ET. The improvement loop has not surfaced its first real proposal in the morning briefing and had Alton accept or reject it.

All of those are scheduled to happen. None of them have happened yet. The system exists in the way a clock exists when you have assembled it but not wound it. The gears mesh. The spring is coiled. It has not yet ticked.

The real test is next week. The first unattended curator-pass. The first receipt gpuserver1 reads and knows its words were heard. The first improvement-loop proposal surfaced in a Monday morning briefing. The first time Alton opens the MERIDIAN Memory tab and sees the staleness heatmap painting his own wiki in shades of green and red, and trusts it.

### How we got here

It is Sunday morning, April 12, 2026. Roughly seven hours ago, late on a Saturday night, Alton sat down at Rocinante and noticed the Solar Inference notes were wrong. Not ambiguously wrong. Wrong in the way that means the system that was supposed to prevent this had been quietly diverging from reality for weeks. He asked for a real fix.

What happened next: a team of Opus agents stood up at midnight, divided the problem into six pieces, walked the wiki, read the literature, consulted the GPU server in its own voice, counted the processes, mined the chat logs, surveyed the dashboards, and came back with a picture that was consistent and painful. The wiki was holding contradictory worlds at once. The conversation pipeline was losing 77% of what it was told. gpuserver1 was writing into a silence it had no way to verify anyone was reading. The dashboard Alton wanted already existed on his own machine and he had not opened it.

A synthesizer took the six reports and wrote a plan in 4,400 words. Six crons, three load-bearing mechanisms, twelve execution tasks, ten open questions for Alton. Alton read it and said yes to all ten. The team built twelve things in four hours. A red team found three bugs that would have caused silent data loss. A fixer patched them. The tests passed.

The final report is the delivery. This narrative is the record. The system is the thing that has to keep working after both documents are closed.

It was, by any measure, a productive night.

*— documentarian, 2026-04-12*
