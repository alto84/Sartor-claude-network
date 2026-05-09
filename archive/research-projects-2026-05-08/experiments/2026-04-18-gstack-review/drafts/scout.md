# Scout — gstack architecture map

## 1. What gstack is

gstack is an MIT-licensed Claude Code skill pack published by Garry Tan (YC President/CEO) that installs into `~/.claude/skills/gstack/` and ships a library of slash-commands covering plan, design, build, review, QA, ship, and retro stages of a software workflow. It is structurally a collection of `SKILL.md` files per slash-command plus two compiled Bun binaries (`browse/` for a persistent headless Chromium daemon, `design/` for image generation). Sibling repo `gbrain` is a separate knowledge/memory system; gstack itself does not ship a memory layer.

## 2. Directory layout

Top-level files: `README.md`, `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE.md`, `BROWSER.md`, `DESIGN.md`, `ETHOS.md`, `SKILL.md` + `SKILL.md.tmpl`, `CHANGELOG.md`, `CONTRIBUTING.md`, `TODOS.md`, `VERSION`, `LICENSE`, `conductor.json`, `package.json`, `bun.lock`, `setup`, `connect-chrome`, `.env.example`, `slop-scan.config.json`, `actionlint.yaml`.

Top-level directories: `agents/`, `bin/`, `lib/`, `scripts/`, `docs/`, `contrib/`, `extension/`, `hosts/`, `test/`, plus one directory per slash-command (see section 3). The `agents/` dir currently holds only `openai.yaml`.

## 3. The 23 tools

The README calls out "23 Core Skills" but the repo has more slash-command directories than that. All are invokable as `/<name>`:

**Plan (think):** `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/autoplan`, `/plan-tune`.

**Design:** `/design-consultation`, `/design-shotgun`, `/design-html`, `/design-review`.

**Build/review:** `/review`, `/investigate`, `/devex-review`, `/pair-agent`, `/codex` (cross-model second opinion), `/cso` (security), `/learn`, `/careful`, `/freeze`, `/guard`, `/unfreeze`.

**Test:** `/qa`, `/qa-only`, `/benchmark`, `/health`, `/checkpoint`.

**Ship:** `/ship`, `/land-and-deploy`, `/canary`, `/document-release`, `/retro`, `/gstack-upgrade`.

**Infrastructure (not personae):** `/browse`, `/open-gstack-browser`, `/setup-browser-cookies`, `/setup-deploy`, plus the `browse/` Playwright daemon, `supabase/`, `openclaw/`, `hosts/` adapter configs.

Role-persona count in marketing copy (CEO, eng manager, designer, DX lead, staff engineer, debugger, designer-coder, DX tester, design explorer, design engineer, QA lead, QA reporter, multi-agent coordinator, CSO, release engineer, SRE, technical writer, performance engineer, session manager, memory manager, safety guardrail, second-opinion cross-model reviewer) is ~23 — that is where the number comes from, not the command count.

## 4. Conductor-agent pattern — mechanics

`conductor.json` is a config consumed by the external `Conductor` app, which spawns N parallel Claude Code sessions each rooted in its own git worktree. gstack's contribution is (a) per-workspace isolation of the `browse/` daemon by writing a `.gstack/browse.json` state file containing PID + random port (10000–60000) + UUID bearer token, and (b) localhost-only bind. That is the entire mechanism: worktree isolation comes from Conductor; gstack just makes sure its Chromium daemon does not collide across workspaces. The "10–15 parallel sprints" claim is workspace parallelism, not agent coordination.

## 5. gstack vs gbrain

Separate repos, separate concerns. gbrain (`~/.gbrain/`) is a TypeScript/Bun app with a PGLite-or-Supabase Postgres backend, pgvector embeddings, reciprocal-rank-fusion hybrid search, an auto-wiring entity graph, and a "Minions" Postgres-backed job queue. gbrain markets itself as host-agnostic ("designed to be installed and operated by an AI agent") and names OpenClaw and Hermes Agent as target hosts alongside Claude Code. The bridge file `hosts/gbrain.ts` in gstack lets a coding skill query the brain. One is skills-over-Claude-Code; the other is a standalone memory service. They are not tightly coupled.

## 6. Mirrors in Sartor's architecture

- Role-persona slash-commands map onto Sartor's per-machine `CLAUDE.md` + `feedback/` files, though Sartor's roles are behavioral rules rather than invocable commands.
- The `SKILL.md` pattern (one directory per capability, templated docs) is structurally similar to Sartor's `sartor/memory/reference/` + `projects/` layout.
- Worktree-based parallelism via Conductor is absent in Sartor; Sartor uses scheduled tasks and per-machine inboxes instead.
- Neither system ships what Sartor's memory index provides: a persistent, human-curated knowledge graph of the user. gbrain is the nearest analog but is entity/page-centric (17,888 pages, 4,383 people in the reference deployment), not narrative-memory-centric.

## 7. What is not in gstack that the hype implies should be

No memory, no continuity, no learning across sessions. `/learn` is a single command, not a persistent store — gbrain is the separate product for that. The repo is fundamentally a prompt library (SKILL.md files) plus one browser daemon plus one image binary. The "virtual engineering team" framing is sequential prompt templates with strong role-separation; there is no inter-agent message bus, no shared blackboard, no planner-executor split in code. `/pair-agent` is browser-tab coordination, not agent coordination.

Claude-fingerprint tells in the docs themselves: README opens with a Karpathy pull-quote then immediately pivots to metric-driven validation (810×, 240×, "11,417 vs 14 logical lines/day"); ETHOS.md uses "Boil the Lake," "Eureka Moment," "Golden Age" capitalized-phrase pattern; ARCHITECTURE.md leans on the "Hand-maintained docs always drift from code" aphorism structure. These are consistent with Claude-polished prose. Not disqualifying, worth naming.

## Sources

- [github.com/garrytan/gstack](https://github.com/garrytan/gstack)
- [raw README.md](https://raw.githubusercontent.com/garrytan/gstack/main/README.md)
- [raw CLAUDE.md](https://raw.githubusercontent.com/garrytan/gstack/main/CLAUDE.md)
- [raw ARCHITECTURE.md](https://raw.githubusercontent.com/garrytan/gstack/main/ARCHITECTURE.md)
- [raw ETHOS.md](https://raw.githubusercontent.com/garrytan/gstack/main/ETHOS.md)
- [github.com/garrytan/gstack/tree/main/agents](https://github.com/garrytan/gstack/tree/main/agents)
- [github.com/garrytan/gbrain](https://github.com/garrytan/gbrain)
- [gstacks.org](https://gstacks.org/)
