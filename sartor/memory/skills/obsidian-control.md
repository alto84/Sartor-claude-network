---
type: skill
entity: obsidian-control
updated: 2026-04-11
---

# obsidian-control

> [!summary]
> How to use MCP tools to interact with Alton's live Obsidian vault. Covers available tools, safety rules, and the decision rule for when to use MCP vs direct filesystem writes.

## Setup status

- Plugin: `obsidian-local-rest-api` v3.4.2 installed and running (Obsidian 1.11.7)
- Server: HTTPS on `127.0.0.1:27124` (localhost only, NOT exposed to LAN)
- MCP wrapper: `mcp-obsidian` v0.2.2 installed via pip3
- Config: `.mcp.json` at repo root, launch wrapper at `.secrets/mcp-obsidian-launch.bat`
- API key: `.secrets/obsidian-api-key.txt` (gitignored, never commit)

## Vault location: critical distinction

Alton runs **two separate vaults**:

| Vault | Path | Purpose |
|-------|------|---------|
| Personal Obsidian vault | `C:\Users\alto8\Documents\Obsidian Vault` | Alton's daily-driver personal notes. REST API serves this vault. |
| Memory wiki | `C:\Users\alto8\Sartor-claude-network\sartor\memory\` | Claude Code's agent memory system. No Obsidian plugin installed here. |

The `mcp__obsidian__*` tools operate on the **personal vault only**. They cannot read `sartor/memory/` notes unless Alton opens that vault in Obsidian.

## Available MCP tools

After Claude Code restarts with `.mcp.json` loaded, these tools are available as `mcp__obsidian__*`:

| Tool | What it does |
|------|-------------|
| `list_files_in_vault` | List all files in the vault root |
| `list_files_in_dir` | List files in a specific vault subdirectory |
| `get_file_contents` | Read the full content of a note by path |
| `batch_get_file_contents` | Read multiple notes at once (efficient) |
| `search` | Full-text search using Obsidian's index |
| `complex_search` | JsonLogic structured search |
| `append_content` | Append text to the end of a note |
| `patch_content` | Surgical edit relative to heading, block-ref, or frontmatter field |
| `delete_file` | Delete a note permanently |
| `get_periodic_note` | Read today's / this week's daily or weekly note |
| `get_recent_periodic_notes` | List recent periodic notes |
| `get_recent_changes` | List recently modified files |

## Safety rules

1. **Never write to a note Alton currently has open.** Check `get_recent_changes` or `get_periodic_note` to see if a note is active before patching it. Obsidian does NOT lock files; a simultaneous write will cause a conflict that Alton has to resolve manually.
2. **Prefer `patch_content` over `append_content` for structured notes.** Appending to a YAML-fronted memory file can corrupt the frontmatter block.
3. **Never call `delete_file` without explicit instruction from Alton.** This is permanent and Obsidian's trash does apply, but it's irreversible from Claude's side.
4. **Read-only by default.** Any search or read operation is safe at any time. Writes require specific intent.
5. **No FAMILY, financial, or TAXES content via dashboard proxy** until MERIDIAN has authentication (EX-8).

## §8.2 Decision rule: MCP vs direct filesystem write

Use this logic to pick the right surface:

```
IF target is sartor/memory/ (agent memory wiki):
    → Use direct filesystem tools (Read, Write, Edit)
    → Reason: the memory wiki is not in the Obsidian personal vault;
      MCP tools cannot reach it. Filesystem writes appear in Obsidian
      only because sartor/memory/ is a separate vault Alton can open.

IF target is Documents/Obsidian Vault (personal notes):
    → Prefer MCP tools (mcp__obsidian__patch_content, etc.)
    → Reason: edits via REST API apply through Obsidian's own engine,
      so sync, backlinks, and Alton's live view update immediately.
    → Exception: if Alton has the note currently open and actively editing,
      wait or ask before writing.

IF the goal is navigation (focus a note in Alton's UI):
    → Use obsidian:// URI via Bash: start obsidian://open?vault=...&file=...
    → The REST API /open/{path} endpoint also works but requires a fresh
      curl call; the URI scheme is simpler for one-off focus operations.
```

## Smoke test results (2026-04-11)

- `curl -sk -H "Authorization: Bearer ..." https://127.0.0.1:27124/` returned status OK, plugin v3.4.2
- `GET /search/simple/?query=gpuserver1` returned 2 hits (files in Claude/ subfolder)
- Bind address confirmed `127.0.0.1:27124` only (not 0.0.0.0)
- `mcp-obsidian` v0.2.2 imported cleanly; exe at `C:\Users\alto8\AppData\Roaming\Python\Python313\Scripts\mcp-obsidian.exe`

## Restarting / reconnecting

Claude Code loads MCP servers at startup. After adding `.mcp.json`, restart Claude Code to activate the `mcp__obsidian__*` tools. The Obsidian REST API server starts automatically when Obsidian opens and requires no manual restart.
