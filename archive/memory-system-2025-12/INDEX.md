# Archive: sartor-memory-system platform (Dec 2025 era)

Archived 2026-06-09 as part of the system-uplift purge pass
(`sartor/memory/projects/system-uplift-2026-06/GOAL.md`, item U6).
Last substantive commits to these trees: Dec 2025 – Jan 2026.
Verified before archival: zero imports/references from the live system
(sartor/, scripts/ live set, .claude/ live set, dashboard/family/, tools/).
The live MCP config is `.mcp.json`; the archived `dot-claude/mcp-config.json`
defined servers running from the archived `src/mcp/` and was never the live path.

## Contents

| Path | What it was | Tracked files |
|------|-------------|---------------|
| claude-network/ | Multi-agent network platform (TypeScript) | 177 |
| src/ | Memory-system core incl. src/mcp servers (memory/obsidian/gdrive prototypes) | 163 |
| framework/ | Agent framework layer | 110 |
| .swarm/ | Swarm orchestration state/config | 262 |
| coordinator/ | Coordination service | 9 |
| workers/ | Worker processes | 18 |
| mcp-server/ | Standalone MCP server prototype | 13 |
| firebase/ | Firebase functions/config | 3 |
| python/ | Python utilities (platform-era) | 6 |
| memories/ | Pre-`sartor/memory` memory dir | 1 |
| plans/ | Platform-era plans | 4 |
| skills/ | Pre-`.claude/skills` duplicates | 4 |
| commands/ | Pre-`.claude/commands` duplicates | 2 |
| github/ | GitHub-sync scripts | 2 |
| examples/ | Platform examples | 4 |
| hooks/ | Platform hooks (root; distinct from archived .claude hook system) | 5 |
| config/ | Platform config | 5 |
| tests/ | Platform tests | 5 |
| package.json / package-lock.json / tsconfig.json / jest.config.js / example-usage.ts | Root Node/TS toolchain for the above | 5 |
| scripts/ (here) | Root-tsconfig-dependent TS/JS scripts orphaned by the move (benchmark, demos, mcp tests, completion-check, setup-firebase) | 9 |
| dot-claude/ | Unwired Dec-2025 .claude hook system (hooks/, hooks.json, AGENT_ROLES.md, FILES_CREATED.txt) + dead mcp-config.json | — |

## Notes

- `dot-claude/../completion-check.ts` and `src`-era files contain a
  hardcoded Obsidian REST bearer token (uplift item C4) — rotate in the
  Obsidian plugin; the value here is then inert. Do not copy it forward.
- Root `node_modules/` (562 MB, gitignored) was deleted from disk in the same
  pass; `package-lock.json` here can regenerate it if this platform is ever
  resurrected.
- Restoration: `git mv` any tree back and `npm install` against the archived
  package.json. History is preserved (moves, not deletes).
