---
type: research
phase: explore
updated: 2026-04-12
author: research-scout
task: "#2"
project: memory-system-v2
---

# Phase 1B — Research Scout: State of the Art in LLM Memory Systems

> [!info] Scope
> Survey of LLM-managed personal wikis, agent memory frameworks, and Obsidian curation tooling. Every claim is anchored to a URL. The Sartor constraint set — markdown-first, wikilink-first, Obsidian-compatible, two machines (Rocinante + gpuserver1), ≤6 cron jobs total — is the lens through which everything below is judged.

## 1. The "LLM Wiki" pattern (Karpathy + a clutch of implementations)

The Sartor wiki is itself an instance of a now-named pattern: Andrej Karpathy's "LLM Wiki." His original gist frames the insight as **"the tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping"** ([gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). Three layers: immutable raw sources, an LLM-maintained wiki of cross-linked markdown pages, and a schema/CLAUDE.md governing structure. The crucial contrast with RAG: RAG "rediscovers knowledge from scratch on every question," while a wiki accumulates synthesis that compounds.

The pattern has spawned at least ten public implementations in the months since Karpathy's gist. The most architecturally serious is **nashsu/llm_wiki** ([repo](https://github.com/nashsu/llm_wiki)) — a Tauri desktop app at ~721 stars. It does several things we don't:

- **4-signal relevance scoring** for finding related pages: direct links ×3.0, source overlap ×4.0, Adamic-Adar ×1.5, type affinity ×1.0.
- **Louvain community detection** to discover natural knowledge clusters in the graph.
- **Two-step ingest** — analyze first, then generate pages with source traceability.
- **Graph insights** — automatic surfacing of "surprising connections" and gaps.
- Maintains an `index.md` catalog plus a `log.md` operation history (we already have the latter).

> [!tip] Steal
> The two-step ingest (analyze → write) and the 4-signal related-page scoring. Both are mechanical, code-able in Python, and don't require leaving markdown. Louvain clustering is nice-to-have but probably overkill at our scale.

> [!warning] Don't adopt wholesale
> nashsu/llm_wiki is a desktop app with sigma.js graph visualization and a React frontend. We have no use for either, and adopting it would mean abandoning Obsidian, which is non-negotiable.

Other notable variants: **kfchou/wiki-skills** and **Pratiyush/llm-wiki** are both Claude Code skill packages implementing the same pattern as plugins — closer to our own setup, worth eyeballing for skill packaging conventions, but no architecturally novel ideas. **NicholasSpisak/second-brain** specifically targets Obsidian vaults and is the closest spiritual cousin to what we already have.

## 2. Hermes Agent (Nous Research) — the most relevant find

Hermes Agent ([repo](https://github.com/nousresearch/hermes-agent), released February 2026) is a self-hosted autonomous agent framework whose memory architecture is the single most relevant prior art for memory-system-v2. Five components matter:

1. **FTS5 cross-session recall** — full-text search (SQLite FTS5) over every past session, combined with LLM summarization. Cheap, fast, no embeddings required. ([Nous docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/))
2. **Agent-curated memory with periodic nudges** — the agent itself decides what to write to memory, but a scheduled job ("nudge") periodically prompts it to revisit and reorganize. This is a *cron pattern that fits our budget*.
3. **Autonomous skill creation after complex tasks** — when the agent successfully completes a multi-step task, it abstracts it into a "Skill Document" stored as searchable markdown.
4. **Skills self-improve during use** — when a skill is invoked and fails or has friction, the agent edits the skill in place. Closed feedback loop.
5. **Compatible with the agentskills.io open standard** — meaning skills are portable across agents.

Hindsight (Vectorize) is now a native memory provider for Hermes ([blog post, 2026-04-06](https://hindsight.vectorize.io/blog/2026/04/06/hermes-native-memory-provider)). The pattern: **"Before every turn, Hindsight automatically fetches relevant memories from your history and injects them into the system prompt."** Auto-recall as default. After the agent responds, conversation data undergoes **"background processing to extract facts and relationships"** — note the *background*, not in-loop, extraction.

> [!tip] Steal
> Three things, all of them load-bearing. (a) FTS5 over session logs as a poor man's RAG — we already have `daily/` logs; we just need a SQLite index. (b) The "periodic nudge" cron — exactly the kind of low-touch curation pass we want, fits in our 6-cron budget. (c) Background fact extraction (post-session, not in-session) so the live agent never pays the latency tax.

> [!warning] Don't adopt wholesale
> Hermes Agent is a full self-hosted agent runtime — it wants to *be* the agent, not be a memory layer for someone else's agent. We are using Claude Code as the runtime, not Hermes, so we'd cherry-pick the memory ideas and re-implement, not install the framework.

## 3. SilverBullet.md — the Obsidian-replacement question

SilverBullet ([silverbullet.md](https://silverbullet.md/)) is a self-hosted, local-first, browser-based markdown editor with bi-directional links and a Lua scripting engine ("Space Lua") that lets you query your notes and inline-render results. It's been in development since 2022 and is on v2.

Compatibility with Obsidian is **partial and lossy**. Per the SilverBullet community ([guide](https://community.silverbullet.md/t/an-admittedly-hacky-approach-to-making-your-obsidian-vault-silverbullet-friendly/167)), Obsidian's wikilinks don't include folder paths, which causes broken links in SilverBullet; conversion scripts ([SONDLecT](https://github.com/SONDLecT/Obsidian-to-Silverbullet-Conversion-Scripts)) exist to rewrite a vault. The same folder *can* be used by both tools simultaneously, but only with care.

> [!warning] Don't adopt
> SilverBullet is a strictly worse fit than Obsidian for us. Obsidian is desktop-native, has a mature plugin ecosystem (Smart Connections, Dataview, etc.), and our wikilinks already work in it. SilverBullet would force a vault rewrite and gain us only the inline Lua queries — which we can replicate with Dataview or with plain Python scripts.

> [!tip] Steal
> The Space Lua *idea* — inline executable queries inside markdown — is interesting. We don't need Lua specifically; we already do something similar with Python scripts that read the vault. Worth thinking about whether some pages should have an "auto-section" that's regenerated on each cron pass (e.g., "stalest 10 pages," "broken wikilinks").

## 4. basic-memory (Basic Machines) — the closest direct competitor

basic-memory ([blog](https://basicmachines.co/blog/what-is-basic-memory/), [Glama](https://glama.ai/mcp/servers/basicmachines-co/basic-memory)) is an MCP server that gives Claude (or any MCP client) read/write access to a markdown knowledge base modeled as **entities, observations, and relations**:

- **Entity** — one markdown file = one "thing"
- **Observation** — a fact about the entity, written as a markdown list item with a special structure: `- [category] fact text #tag (context)`
- **Relation** — an outbound `[[wikilink]]` whose link text encodes the relationship type

It indexes everything in a local SQLite database and works seamlessly inside Obsidian — the files *are* the database; SQLite is just the index.

This is the most philosophically aligned project I found. We are essentially doing a hand-rolled version of basic-memory: same wikilinks, same markdown-first, same SQLite-as-index posture.

> [!tip] Steal
> The **structured-observation list-item syntax** (`- [category] fact #tag`). It's machine-parseable, human-readable, doesn't require frontmatter, and Obsidian renders it natively. We could adopt this *today* in our existing vault and start extracting an entity/observation/relation index alongside the existing knowledge files. Big upside: it gives us a lossless, queryable triplestore *without* abandoning markdown.

> [!warning] Don't adopt wholesale
> Don't install basic-memory itself. Reasons: (a) it's MCP-mediated and assumes a single client, but we have two machines plus background curators; (b) its "one entity per file" rule conflicts with how we already organize (multi-topic files like `MACHINES.md`); (c) we'd lose our existing curator/decay/inbox infrastructure. Adopt the *schema*, not the server.

## 5. Survey: mem0, Letta/MemGPT, Zep, Cognee, Memoripy, Pensieve, Hindsight

| Project | One-line description | Wiki-over-markdown fit? |
|---|---|---|
| **mem0** ([mem0.ai](https://mem0.ai/)) — 48k+ stars, framework-agnostic SDK that passively extracts facts from conversations into a vector store; LOCOMO 67.13%, p95 0.2s, ~1,764 tokens/conv vs 26k full-context ([benchmark](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)) | **No.** Stores in vectors, not markdown. Useful as a *concept* (passive extraction off the critical path) but not as a dependency. |
| **Letta** (formerly MemGPT) ([forum](https://forum.letta.com/t/agent-memory-letta-vs-mem0-vs-zep-vs-cognee/88)) — agent runtime with OS-style tiered memory; the agent itself self-edits memory inside its reasoning loop | **No.** Wants to be the runtime, not a layer. Our runtime is Claude Code. The "self-editing memory" idea is good but Hermes already implements it on markdown. |
| **Zep** ([atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/)) — production-grade hybrid vector + temporal knowledge graph, strong for long-running sessions | **No.** Graph DB-backed. Useful insight: temporal awareness (when did we learn this?) is something we should add as frontmatter, not as a graph DB. |
| **Cognee** ([repo](https://github.com/topoteretes/cognee)) — "knowledge engine" with an Extract/Cognify/Load pipeline; backends include Neo4j, Kuzu, Postgres; recent Claude Code plugin captures hooks into a session graph | **Partial.** Cognee's hook-based session capture is the most relevant idea, but the rest is heavy infra (graph DBs). The Claude Code plugin is worth a deeper look as a possible drop-in for `data/observer-log` ingestion. |
| **Memoripy** ([repo](https://github.com/caspianmoon/memoripy)) — Python lib with short/long-term tiers, **memory decay and reinforcement**, concept-graph spreading activation | **Partial.** We already have a `decay.py` script. Memoripy formalizes the "less useful memories fade, frequently accessed reinforce" mechanic. Worth borrowing the decay-curve math. |
| **Pensieve** (kingkongshot/Pensieve) ([repo](https://github.com/kingkongshot/Pensieve)) — Claude Code skill that maintains a project's `.pensieve/` directory with **four layers**: Maxims (MUST), Decisions (WANT), Knowledge (IS), Pipelines (HOW); semantic links (based-on, leads-to, related); auto-syncs during edit/review | **Yes — strongly.** This is essentially a 4-layer typed version of our memory system, packaged as a Claude Code skill. The layered taxonomy is a real upgrade over our flat memory types. |
| **Hindsight** (vectorize.io) — auto-recall memory provider; runs embedded Postgres locally or cloud; one-line config switch | **No** (Postgres-backed) **but yes** as a pattern: "auto-recall on every turn, background extraction after." |

> [!tip] Steal from this row
> (a) mem0's **passive, off-loop extraction** model. (b) Memoripy's **decay/reinforcement curve**. (c) Pensieve's **four-layer taxonomy** (Maxims/Decisions/Knowledge/Pipelines) — this maps cleanly onto rules-vs-facts-vs-state-vs-procedures. (d) Hindsight's **auto-recall before every turn** as a Claude Code hook. Importantly, none of these need to be installed.

There's also a recent paper worth noting: **"The Pensieve Paradigm: Stateful Language Models Mastering Their Own Context"** (Liu et al., arXiv 2026.02, [link](https://github.com/AkihikoWatanabe/paper_notes/issues/4558)). Independent from the Claude skill of the same name; argues for the model itself managing its context as a first-class action.

## 6. Obsidian plugins for auto-curation

Most relevant: **Smart Connections** ([repo](https://github.com/brianpetro/obsidian-smart-connections)). 786k+ downloads, ~4.4k stars as of January 2026 ([Grokipedia](https://grokipedia.com/page/Smart_Connections_Obsidian_plugin)). It maintains local embeddings of every note and a "Connections" panel that surfaces semantically similar notes as you write. Supports Ollama for fully local operation.

What it does *not* do: edit notes, extract facts to a structured store, or detect staleness. It's a discovery surface, not a curation engine.

Other plugins surveyed quickly: **Copilot**, **Text Generator**, **Quick Add** — all primarily generation/UI layers, none do curation.

> [!tip] Steal
> Run Smart Connections in Obsidian as a *human-facing* discovery layer (so Alton sees relevant notes when editing) while the curator remains a separate background process. They're complementary, not competing.

> [!warning] Don't depend on it
> Smart Connections is read-only and embedding-based; it can't replace the curator's job of re-writing stale pages.

## 7. Recent (post-Feb 2026) research and posts

- **Anthropic, "Long-running Claude for scientific computing"** ([link](https://www.anthropic.com/research/long-running-Claude), March 2026). Two-pattern solution: an *initializer agent* that sets up the workspace, plus a *coding agent* tasked with making incremental progress every session, leaving artifacts in a `CHANGELOG.md` "progress file." Quote: **"a sort of lab notes"** with "current status, completed tasks, failed approaches and why, accuracy tables at checkpoints, known limitations." Our `daily/` logs are the same idea.
- **Anthropic Memory Tool (Sonnet 4.5 launch)** — file-based, store/consult outside the context window. We have this already as our memory dir; the pattern is now first-class.
- **MemRL: Self-Evolving Agents via Runtime RL on Episodic Memory** (Jan 2026, listed in [Agent-Memory-Paper-List](https://github.com/Shichun-Liu/Agent-Memory-Paper-List)) — RL over episodic memory; way out of scope for us, but the framing of memory ops (store/retrieve/update/summarize/discard) as discrete callable tools is useful.
- **A-Mem: Agentic Memory for LLM Agents** ([arXiv](https://arxiv.org/pdf/2502.12110)) — trains those memory ops via three-stage RL with step-wise GRPO. Same takeaway: the *vocabulary* (store/retrieve/update/summarize/discard) is worth adopting in our curator code, even without RL.
- **Stale knowledge detection** ([atlan](https://atlan.com/know/what-is-an-llm-knowledge-base/)): **"Without `last_verified` metadata, staleness detection is impossible. Freshness requires two things: a `last_verified` metadata field on every document, and automated monitoring that alerts when documents exceed their staleness threshold."** This is the single most actionable sentence in the entire survey for our project.
- **Knowledge graph freshness, 2026 industry view**: "2026 LLMs penalize stale content more aggressively than ever. For time-sensitive topics, content older than 90 days without updates sees 60-80% visibility reduction." Confirms the staleness problem is industry-wide and not unique to us.

## Top 5 ideas to steal

1. **`last_verified` frontmatter on every memory file + an automated staleness monitor.** This is the lowest-effort, highest-leverage idea in the entire survey. Add `last_verified: YYYY-MM-DD` to YAML frontmatter, set a stale threshold (say 60–90 days), and have one cron job emit a "stale list" each night. ([source](https://atlan.com/know/what-is-an-llm-knowledge-base/))
2. **FTS5 over session logs + background fact extraction (Hermes pattern).** Build a SQLite FTS5 index over `daily/` logs. Run extraction in a *post-session* cron, never in the live agent loop. This gives us cross-session recall without inflating per-turn latency. ([source](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/))
3. **Pensieve's four-layer typology (Maxims / Decisions / Knowledge / Pipelines).** Adopt these as four distinct memory *types* in our frontmatter. Maps onto our existing distinction between feedback (Maxims), project-decisions (Decisions), facts (Knowledge), and procedures (Pipelines), but makes the taxonomy explicit and queryable. ([source](https://github.com/kingkongshot/Pensieve))
4. **basic-memory's structured observation syntax.** Adopt `- [category] fact #tag (context)` as a *parseable* list-item format inside any memory file. Costs nothing because it's still valid markdown; gains us a lossless triplestore extraction at curator-time. ([source](https://basicmachines.co/blog/what-is-basic-memory/))
5. **Karpathy/nashsu's two-step ingest (analyze → write) + the 4-signal related-page scoring.** When a new fact arrives, the curator first analyzes it against the existing graph, *then* writes the update. The 4 scoring signals (direct links, source overlap, Adamic-Adar, type affinity) are all computable from the wikilink graph alone — no embeddings required. ([source](https://github.com/nashsu/llm_wiki))

## Top 3 things to explicitly NOT do

1. **Do not adopt mem0 / Zep / Letta / Cognee as dependencies.** They want to be the system, not a layer underneath it. They store in vectors or graph DBs, not markdown. They'd force us out of Obsidian, out of git-trackable plain-text, and into infra (Postgres, Neo4j, Kuzu) that violates our two-machine, ≤6-cron budget. The *ideas* are stealable; the code is not.
2. **Do not migrate to SilverBullet.md.** It would require rewriting our wikilinks, lose us the entire Obsidian plugin ecosystem (especially Smart Connections), and gain us only inline Lua queries — which we can replicate with Python scripts that already exist. The "local-first PWA in browser local storage" architecture is also worse for our two-machine sync model than a plain folder.
3. **Do not implement RL-based memory management (A-Mem, MemRL, Reflexion-style).** These papers are interesting research but require training infrastructure, reward signals, and a tolerance for non-deterministic curator behavior. We are a two-person, two-machine operation. A deterministic Python curator with explicit decay rules is strictly better engineering for our scale, even if the LOCOMO numbers are lower. Revisit only if we ever have ≥10k memory entities and a measurable retrieval-quality problem.

## References (consolidated)

- Karpathy, *LLM Wiki* gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- nashsu/llm_wiki: https://github.com/nashsu/llm_wiki
- kfchou/wiki-skills: https://github.com/kfchou/wiki-skills
- NicholasSpisak/second-brain: https://github.com/NicholasSpisak/second-brain
- Nous Research, Hermes Agent: https://github.com/nousresearch/hermes-agent
- Hermes persistent memory docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/
- Hindsight as Hermes provider (2026-04-06): https://hindsight.vectorize.io/blog/2026/04/06/hermes-native-memory-provider
- SilverBullet: https://silverbullet.md/
- SilverBullet ↔ Obsidian conversion scripts: https://github.com/SONDLecT/Obsidian-to-Silverbullet-Conversion-Scripts
- basic-memory blog: https://basicmachines.co/blog/what-is-basic-memory/
- basic-memory on Glama: https://glama.ai/mcp/servers/basicmachines-co/basic-memory
- mem0: https://mem0.ai/
- Letta vs Mem0 vs Zep vs Cognee thread: https://forum.letta.com/t/agent-memory-letta-vs-mem0-vs-zep-vs-cognee/88
- Cognee: https://github.com/topoteretes/cognee
- Memoripy: https://github.com/caspianmoon/memoripy
- Pensieve (Claude skill): https://github.com/kingkongshot/Pensieve
- The Pensieve Paradigm paper note: https://github.com/AkihikoWatanabe/paper_notes/issues/4558
- Smart Connections plugin: https://github.com/brianpetro/obsidian-smart-connections
- Anthropic, Long-running Claude: https://www.anthropic.com/research/long-running-Claude
- Stale knowledge / freshness (Atlan): https://atlan.com/know/what-is-an-llm-knowledge-base/
- 2026 framework benchmark survey: https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3
- Agent Memory Paper List: https://github.com/Shichun-Liu/Agent-Memory-Paper-List
- A-Mem paper: https://arxiv.org/pdf/2502.12110
