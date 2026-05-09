# Memory Analyst — gbrain vs Sartor memory

## 1. What gbrain actually is

gbrain is a **git-backed markdown repository plus an embedded-Postgres retrieval layer** for autonomous agents. The README's own framing: "Your AI agent is smart but forgetful. GBrain gives it a brain." And structurally: "The repo is the system of record. GBrain is the retrieval layer. The agent reads and writes through both."

Architecturally, it is not one thing; it is four stacked things:

1. A **markdown knowledge graph** with YAML frontmatter (`type`, `title`, `tags`) and wikilinks.
2. A **database mirror** — PGLite by default, Supabase with pgvector optionally, with bidirectional migration (`gbrain migrate --to supabase|pglite`).
3. A **skill registry** of 26 "fat markdown" skills dispatched through a `RESOLVER.md` ("thin harness, fat skills").
4. A **minion job queue** backed by Postgres for deterministic async work.

The load-bearing structural opinions are: "Compiled Truth + Timeline" (each page has current understanding above and an append-only dated evidence trail below); and a "self-wiring knowledge graph" that extracts entity references on write with no LLM calls, auto-typing links as `attended`, `works_at`, `invested_in`, `founded`, `advises`. That last part is the genuine architectural idea.

## 2. How gstack uses gbrain

Barely. gstack handles continuity through plain `CLAUDE.md` files, nested per directory, read at session start. The `/learn` skill curates project-scoped patterns into `.gstack/` or `~/.gstack/`. The mindstudio.ai writeup is explicit: gstack "doesn't maintain state between sessions — instead, it reconstructs context each time by reading documentation files."

gbrain is listed as one of ten install targets (`./setup --host gbrain` drops skills into `~/.gbrain/skills/gstack-*/`). That is packaging, not integration. gstack is functionally stateless at the framework level, with learnings bolted on.

## 3. Comparison to Sartor's memory architecture

| Sartor mechanism | gbrain equivalent | Verdict |
|---|---|---|
| YAML frontmatter (`type`, `updated`, `updated_by`, `tags`, `next_review`) | YAML frontmatter (`type`, `title`, `tags`) | gbrain rougher; Sartor schema is richer and staleness-aware |
| Wikilinks + [[MEMORY-CONVENTIONS]] | Wikilinks + auto-extracted typed links | gbrain stronger: typed link extraction is a real graph, not prose |
| Inbox-per-hostname + curator drain | `minion-orchestrator` child_done inbox | Different problem. gbrain inbox is job-queue completion, not multi-machine sync |
| Curator (nightly prune/archive) | "Auto-enrichment tiers escalate by mention count" | gbrain is signal-driven enrichment; Sartor is hygiene-driven curation |
| OPERATING-AGREEMENT (machine-to-machine protocol) | `soul-audit` generates `SOUL.md`, `USER.md`, `ACCESS_POLICY.md`, `HEARTBEAT.md` | Roughly analogous; gbrain's are self-reports, Sartor's is a negotiated contract |
| Heartbeat | No explicit heartbeat; cron-scheduler / daily-task-prep | Sartor has it, gbrain doesn't |
| Hub-and-spoke multi-machine with no per-machine credentials | Not addressed | Sartor solves a problem gbrain doesn't acknowledge |

## 4. Specific deltas

**Where Sartor dominates:**

- *Multi-machine topology.* Sartor's MULTI-MACHINE-MEMORY.md is an actual distributed-systems design: one-hub, N-spoke, inbox-per-hostname, "no conflicts by construction." gbrain assumes one agent, one repo, one DB. Nothing about credential segregation, offline-first writes, or reconciliation.
- *Staleness as a first-class field.* Sartor's frontmatter carries `updated`, `last_verified`, `next_review`, `status`. gbrain tracks mention counts and event timestamps but does not formalize "this page is due for review."
- *Negotiated operating agreement.* A written contract between machines is absent from gbrain; `HEARTBEAT.md` is a health ping, not a protocol.

**Where gbrain has something Sartor lacks:**

- *Typed link extraction at write-time, zero-LLM.* Sartor's wikilinks are uniform `[[LINK]]` — no type. gbrain deterministically tags the relation (`works_at`, `attended`, `advises`). This turns the vault into an actual graph queryable by relation, not just by node.
- *Compiled Truth + Timeline split on every page.* Sartor's daily logs live in `daily/` and domain files mix current state with history in prose. gbrain enforces the split on every page.
- *Postgres mirror for actual queries.* Sartor uses BM25 over markdown. gbrain has pgvector plus graph-structured joins.

## 5. One concrete recommendation

**Port gbrain's typed-wikilink convention into MEMORY-CONVENTIONS.md.** Add an optional `rel:` prefix, e.g., `[[works_at:AstraZeneca]]` or `[[invested_in:Solar Inference]]`. Keep untyped `[[LINK]]` as the default. Extend the curator to parse typed links into a small sidecar index (`data/graph.jsonl` or similar), not a new database. This gives Sartor a relation-queryable graph without the Postgres dependency, and it is a one-file spec change plus a curator patch. This is the one place where gbrain has a concretely better idea that is cheap to adopt.

The Compiled-Truth-plus-Timeline page convention is also tempting but would require rewriting every domain file and is probably not worth the churn unless memory-system-v2 is already planning a format migration.

## Sources

- https://github.com/garrytan/gbrain (README, skills/, docs/)
- https://github.com/garrytan/gstack (README, setup docs)
- https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework
- C:\Users\alto8\Sartor-claude-network\sartor\memory\MEMORY.md
- C:\Users\alto8\Sartor-claude-network\sartor\memory\reference\MEMORY-CONVENTIONS.md
- C:\Users\alto8\Sartor-claude-network\sartor\memory\reference\MULTI-MACHINE-MEMORY.md
