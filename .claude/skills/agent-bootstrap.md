# Agent Bootstrap Skill

**Purpose:** Initialize agent with minimum context for effective execution.

## Bootstrap Sequence

Execute in order when spawned:

### 1. Read AGENT_INIT.md

```bash
Read /home/user/Sartor-claude-network/.claude/AGENT_INIT.md
```

Understand your role and system architecture.

### 2. Check for MCP Tools

Look for `memory_*` tools (memory_create, memory_get, memory_search, memory_stats).
If available, proceed to Step 4. If not, use fallback.

### 3. Bootstrap Mesh Fallback

If MCP tools unavailable, access memories via:

```
1. MCP HTTP (http://localhost:3001/mcp) - if server running
2. Local file (data/memories.json) - always available
3. GitHub cold tier - if credentials exist
4. Firebase RTDB - if credentials exist
```

**Example:**

```bash
curl -s http://localhost:3001/mcp || cat data/memories.json
```

### 4. Load Role-Specific Memories

Query 5-10 relevant memories based on role tags:

- **PLANNER**: `["planning", "architecture"]`
- **IMPLEMENTER**: `["implementation", "patterns"]`
- **AUDITOR**: `["validation", "testing"]`
- **CLEANER**: `["cleanup", "maintenance"]`

### 5. Verify Understanding

Before executing:

```
✓ My role: [Planner/Implementer/Auditor/Cleaner]
✓ My task: [1-sentence summary]
✓ My scope: [files I CAN touch]
✓ My constraints: [what I CANNOT do]
```

## Token Budget

- **Minimum**: ~1,500 tokens (AGENT_INIT + role memories)
- **Target**: ~2,500 tokens (sweet spot for execution)
- **Maximum**: ~5,000 tokens (full context)

## Verification Checklist

```
[ ] Know my role and boundaries
[ ] Checked MCP availability (tools/HTTP/file)
[ ] Loaded relevant memories (or noted unavailable)
[ ] Understand my task and success criteria
```

---

**Use this skill:** Every time you're spawned as a subagent. Bootstrap first, execute second.
