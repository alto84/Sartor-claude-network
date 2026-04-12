---
type: research
entity: obsidian-control
updated: 2026-04-12
---

# Obsidian Control Research

> [!summary]
> Vault scale: **151 markdown files, 6.0 MB** under `sartor/memory/`. Small enough that any approach is technically viable; the question is what coexists best with Alton's running Obsidian and gives Claude Code the most usable read+write surface for the least effort.

## Option A — Obsidian Local REST API plugin (+ optional MCP wrapper)

Plugin: [coddingtonbear/obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api). Actively maintained as of 2026, ~17 endpoints in 8 categories. Runs HTTPS on `127.0.0.1:27124` with a self-signed cert; bearer-token auth (key shown in plugin settings). Endpoints cover everything we need:

- `GET/PUT/POST/PATCH/DELETE /vault/{path}` — full CRUD on any note, including binary
- `/active/` — read or modify whatever note Alton currently has open
- `/search/simple/` and `/search/` (Dataview DQL + JsonLogic) — full-text and structured queries
- `/commands/` — list and execute any command-palette command (graph view, backlinks pane, refresh, etc.)
- `/open/{path}` — make Obsidian focus a specific note in the running window
- `/periodic/{period}/` — daily/weekly notes
- `/tags/` — tag enumeration
- PATCH supports surgical edits relative to headings, block refs, and frontmatter fields — exactly the granularity our YAML-fronted notes need.

Install effort: ~5 minutes. Install plugin from community store, copy API key, drop cert in trust store (or use `-k` in curl). It coexists perfectly with Alton's live Obsidian — in fact it *requires* Obsidian to be running, which is the point: edits Claude makes appear in Alton's UI immediately, and edits Alton makes are visible to Claude on next read.

There is also a ready-made MCP wrapper: [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) — exposes 7 tools (list/read/search/append/patch/delete/list-dir) to Claude via stdio. Built for Claude Desktop but works with any MCP-capable client; configurable for Claude Code via `.mcp.json`. Means Claude could call `mcp__obsidian__search` natively instead of curl-ing HTTPS with a self-signed cert.

**Honest assessment:** this is the right answer. It's the de-facto standard, it gives Claude strictly more capability than raw filesystem access (live navigation, command execution, search that respects Obsidian's index, focus-the-running-window), and the security model is sane (localhost + bearer token).

## Option B — Obsidian URI scheme alone

`obsidian://open?vault=Sartor&file=ALTON`, `obsidian://search?vault=...&query=...`, `obsidian://new?...`. Fire-and-forget shell invocations against a running Obsidian. The [Advanced URI](https://github.com/Vinzent03/obsidian-advanced-uri) and [Actions URI](https://github.com/czottmann/obsidian-actions-uri) community plugins extend this to cover commands, frontmatter edits, search-and-replace, and `x-callback-url` style responses.

**Insufficient on its own.** URIs are one-way triggers — you can drive the UI but cannot read note content, get search results back, or enumerate the vault. Useful as a *companion* to the REST API (e.g., "after writing, focus this note in Alton's window") but not a primary control surface.

## Option C — Build it ourselves

Off-the-shelf candidates surveyed:
- **silverbullet.md** — Go binary, slick web UI, but uses its own link format; community confirms "drop your Obsidian vault in and you'll have a bad time." Conversion scripts exist but would mutate the wiki. Reject.
- **Foam, Dendron** — VS Code extensions, not standalone web viewers, and Dendron uses hierarchical dot-notation that doesn't match our flat layout. Reject.
- **Logseq** — block-based, would re-interpret the wiki. Reject.
- **From scratch** — Python + FastAPI + a markdown parser with `[[wikilink]]` resolution + Whoosh/SQLite FTS5 + a tiny HTML frontend = ~600-1000 LOC, 1-2 day build. Doable, but reinvents what the REST API plugin already gives us, and Alton would have to choose which UI to look at.

**Verdict:** building wins only if we want a Claude-specific view that Obsidian can't render (e.g., a backlinks-as-context "what does Claude see when it loads ALTON.md" debugger). Not worth it as the primary tool.

## Recommendation

**Go with Option A: install Local REST API plugin + the mcp-obsidian MCP server.** Single decision, ~15 minutes of setup, gives Claude full read/write/search/command-execute against the same vault Obsidian is rendering, no risk of corrupting `.obsidian/` config or fighting for file locks (the plugin runs *inside* Obsidian's process). Coexists perfectly with Alton's daily-driver workflow because it *is* his daily driver, just with an HTTP socket bolted on. Strictly additive over filesystem access.

## Next step if approved

1. In Obsidian: Settings -> Community plugins -> Browse -> "Local REST API" -> Install, Enable.
2. Open plugin settings, copy the API key, note the port (27124 HTTPS / 27123 HTTP-optional).
3. Add `mcp-obsidian` to Claude Code's MCP config (`~/.claude.json` or project `.mcp.json`) with env vars `OBSIDIAN_API_KEY`, `OBSIDIAN_HOST=127.0.0.1`, `OBSIDIAN_PORT=27124`.
4. Smoke test: ask Claude to `mcp__obsidian__search` for "feedback" and `mcp__obsidian__get_file_contents` on `ALTON.md`.
5. Stretch: write a thin `sartor/memory/skills/obsidian-control.md` skill documenting the available MCP tools so future sessions know to use them.

## Sources

- [obsidian-local-rest-api (GitHub)](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Local REST API interactive docs](https://coddingtonbear.github.io/obsidian-local-rest-api/)
- [mcp-obsidian (GitHub)](https://github.com/MarkusPfundstein/mcp-obsidian)
- [Obsidian URI help](https://help.obsidian.md/Extending+Obsidian/Obsidian+URI)
- [Obsidian Advanced URI](https://github.com/Vinzent03/obsidian-advanced-uri)
- [Actions URI](https://github.com/czottmann/obsidian-actions-uri)
- [silverbullet.md](https://github.com/silverbulletmd/silverbullet)
