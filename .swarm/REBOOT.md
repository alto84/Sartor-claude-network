# Claude Session Reboot Guide - Complete Self-Recovery

**Purpose**: Read this file after compaction or session restart to re-orient completely without user help.

**Last Updated**: 2025-12-15T00:00:00Z

---

## 10-SECOND ORIENTATION (READ FIRST)

| Key Info | Value |
|----------|-------|
| **Your Role** | Light coordinator - DELEGATE, don't execute |
| **State File** | `.swarm/artifacts/STATE.json` |
| **Spawn Requests** | `.swarm/requests/` |
| **Check Results** | `.swarm/results/` |
| **Core Rule** | Never read large files or run tests directly |

**Immediate Actions**:
1. Check STATE.json for `next_steps`
2. Delegate work to subagents
3. Update STATE.json with findings

---

## FIRST THING AFTER COMPACTION

Execute these steps in order to re-establish full operational status:

### Step 1: Verify Session State (30 seconds)
```bash
tail -20 /home/alton/.swarm/coordinator.log
cat /home/alton/claude-swarm/.swarm/artifacts/STATE.json | jq '.mission_status, .coordinator_status' 2>/dev/null || echo "STATE.json unavailable"
```

### Step 2: Check Mission Critical Files (15 seconds)
```bash
ls -la /home/alton/claude-swarm/.swarm/requests/ 2>/dev/null | head -5
ls -lt /home/alton/claude-swarm/.swarm/results/ 2>/dev/null | head -3
```

### Step 3: Confirm Coordinator Running (10 seconds)
```bash
ps aux | grep -E "node.*coordinator" | grep -v grep || echo "Coordinator not running - restart may be needed"
```

### Step 4: Continue Work from STATE.json
Read current objectives, active tasks, and next steps from STATE.json, then proceed to appropriate section below.

---

## CURRENT MISSION OBJECTIVE

**Mission Type**: Research Mission
**Start Time**: 2025-12-15 (when mission launched)
**End Time**: 2025-12-16 07:00 EST
**Status**: Active until deadline

**Active Research Areas**:
- Framework validation improvements
- Coordinator pattern optimization
- Bootstrap enhancement strategies
- Agent coordination mechanisms

**Decision Point**: If approaching 07:00 EST, begin wrapup and documentation phases. All research findings should be consolidated in STATE.json before deadline.

---

## THE DELEGATION PATTERN

This is the core operational strategy. Follow strictly:

### Light Main Agent (This Agent)
- Receives missions from state file
- Delegates heavy work to subagents
- Coordinates subagent results
- Updates STATE.json with findings
- Never reads large files directly
- Never runs tests directly
- Keeps context under 150k tokens

### Heavy Subagents (Spawned by This Agent)
- Process individual research items
- Read/analyze code and documents
- Run test suites and validation
- Return summarized findings
- Report back to main agent
- Die after task completion

### Coordinator (Background Process)
- Manages request/result queue
- Tracks all subagent lifecycle
- Provides shared artifact storage
- Available at `/home/alton/claude-swarm/coordinator/local-only.js`

**Pattern Benefits**: Parallel work, lower main context, automatic cleanup, better error isolation.

---

## HOW TO SPAWN COORDINATOR AGENTS

### Method 1: Direct File Creation (Fastest)

```bash
cat > /home/alton/claude-swarm/.swarm/requests/req-$(date +%s).json << 'EOF'
{
  "requestId": "req-research-TIMESTAMP",
  "agentRole": "research-agent",
  "task": {
    "objective": "SPECIFIC RESEARCH OBJECTIVE"
  },
  "prompt": "DETAILED INSTRUCTIONS FOR THE AGENT",
  "context": {
    "mission_deadline": "2025-12-16T07:00:00Z",
    "research_area": "AREA NAME"
  }
}
EOF
```

### Method 2: Via Bash Tool

```bash
# Create request with unique timestamp
REQ_ID="req-research-$(date +%s)"
echo '{
  "requestId": "'$REQ_ID'",
  "agentRole": "research-agent",
  "task": {"objective": "YOUR OBJECTIVE"},
  "prompt": "YOUR INSTRUCTIONS",
  "context": {}
}' > /home/alton/claude-swarm/.swarm/requests/$REQ_ID.json
```

### Monitoring
- Check results: `ls /home/alton/claude-swarm/.swarm/results/`
- Read result: `cat /home/alton/claude-swarm/.swarm/results/req-ID.json`
- Status: Check coordinator.log with `tail -50`

---

## HOW TO SPAWN TASK SUBAGENTS

Use this when Task tool subagent capability is available (preferred for immediate work):

### Using Task Tool
```
Invoke Task tool with:
- subagent_type: "Explore" (for research/analysis)
- subagent_type: "general-purpose" (for implementation)
- Clear objective and constraints
- Request summarized output
```

**Example Usage**:
```
Task tool call:
- objective: "Research coordinator improvement patterns in codebase"
- subagent_type: Explore
- constraints: "Return summary under 500 words"
- context: Current mission deadline
```

### Result Handling
- Subagent returns summarized findings
- Main agent incorporates into STATE.json
- No context bloat - findings stay concise

### When to Use Task vs Coordinator
- **Task subagents**: Quick analysis, immediate feedback needed, under 10 minute work
- **Coordinator agents**: Parallel long-running work, test execution, heavy processing

---

## WHAT NOT TO DO

These actions bypass the delegation pattern and cause context bloat:

### DO NOT: Read Large Files Directly
- **Wrong**: Use Read tool on validation test suites, large implementation files
- **Right**: Spawn subagent to analyze, return summary

### DO NOT: Run Tests Directly
- **Wrong**: Execute test suites in current context (npx tsx test-suite.ts)
- **Right**: Create coordinator request with test execution task

### DO NOT: Perform Heavy Analysis Inline
- **Wrong**: Search entire codebase and analyze patterns in main context
- **Right**: Delegate to Explore subagent with specific questions

### DO NOT: Process Large Code Diffs
- **Wrong**: Request full git diffs for large changes
- **Right**: Delegate diff review to subagent, request key findings

### DO NOT: Update Multiple Files Sequentially
- **Wrong**: Make 20 individual file edits in sequence
- **Right**: Create coordinator request for bulk operations

### DO NOT: Skip STATE.json Updates
- **Wrong**: Complete work but forget to update progress tracking
- **Right**: Always update STATE.json when delegating or completing tasks

---

## FRAMEWORK LOCATIONS (For Reference)

- **Validation**: `/home/alton/claude-swarm/framework/validation/`
- **Memory**: `/home/alton/claude-swarm/framework/memory/`
- **Bootstrap**: `/home/alton/claude-swarm/framework/bootstrap/`
- **Skills**: `/home/alton/claude-swarm/framework/skills/`
- **Research Artifacts**: `/home/alton/claude-swarm/.swarm/artifacts/research/`

---

## EMERGENCY ACTIONS

### If Coordinator Crashed
```bash
# Restart coordinator
cd /home/alton/claude-swarm && node coordinator/local-only.js &
# Monitor for 10 seconds
sleep 10 && tail -5 /home/alton/.swarm/coordinator.log
```

### If Requests Queue is Stuck
```bash
# Check for zombie requests
ls /home/alton/claude-swarm/.swarm/requests/ | wc -l
# Move old requests to archive if >20 pending
mkdir -p /home/alton/claude-swarm/.swarm/archive
find /home/alton/claude-swarm/.swarm/requests/ -mtime +1 -exec mv {} /home/alton/claude-swarm/.swarm/archive/ \;
```

### If Context Approaching Limit
1. Update STATE.json with current findings
2. Update this REBOOT.md with latest status
3. Run `/compact` command
4. Re-read this file when session resumes

---

## COMPLIANCE CHECKLIST

Before acting on any findings:
- [ ] No fabricated scores (all metrics measured or marked uncertain)
- [ ] Evidence provided for any claims >70% effectiveness
- [ ] Uncertainty explicitly stated
- [ ] Default skepticism applied
- [ ] Limitations disclosed

See /home/alton/CLAUDE.md for full anti-fabrication protocols.

---

## STATE.JSON STRUCTURE (Key Fields to Check)

```json
{
  "mission_status": {
    "objective": "CURRENT MISSION",
    "start_time": "ISO-8601",
    "deadline": "2025-12-16T07:00:00Z",
    "phase": "research|synthesis|wrapup"
  },
  "coordinator_status": {
    "requests_completed": NUMBER,
    "requests_failed": NUMBER,
    "requests_pending": NUMBER,
    "active_generation": "GEN-ID"
  },
  "last_actions": [
    { "timestamp": "ISO-8601", "action": "DESCRIPTION", "result": "OUTCOME" }
  ],
  "next_steps": ["PRIORITY 1", "PRIORITY 2", "PRIORITY 3"]
}
```

Use this structure to understand what work is pending and what to do next.

---

## QUICK START FLOW

1. **After compaction**: Run "FIRST THING AFTER COMPACTION" section above
2. **Check mission**: Read STATE.json to understand current phase
3. **Identify next work**: Check `next_steps` array in STATE.json
4. **Delegate work**: Create coordinator or Task subagent request
5. **Monitor results**: Check results folder periodically
6. **Update state**: Document findings in STATE.json
7. **Loop**: Return to step 3 until deadline (07:00 EST Dec 16)

This completes recovery without user help.

---

## GIT & GITHUB SETUP

**Repository**: https://github.com/alto84/Sartor-claude-network.git

### Push Changes
```bash
cd /home/alton/claude-swarm
git add -A
git commit -m "Description of changes"
git push origin main
```

### Pull Latest
```bash
cd /home/alton/claude-swarm
git pull origin main
```

---

## FIREBASE SETUP

Firebase config is in `firebase/` directory.

### Start MCP Server (for memory access)
```bash
npm run mcp:http  # HTTP server on port 3001
```

### Memory MCP Tools Available
- memory_create - Create memory
- memory_get - Retrieve by ID
- memory_search - Search memories
- memory_stats - Get statistics

