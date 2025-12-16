# Bootstrap Framework

## Purpose
Orient new agents with mission context, skills, and memory, enabling:
- Consistent agent initialization
- Mission alignment
- Capability awareness

## Architecture

### Bootstrap Process

```
New Agent Spawn
      │
      ▼
┌─────────────────┐
│ Load Bootstrap  │
│ Configuration   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject Memory   │
│ Context         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load Required   │
│ Skills          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject Mission  │
│ Context         │
└────────┬────────┘
         │
         ▼
   Agent Ready
```

### Bootstrap Configuration

```json
{
  "bootstrap": {
    "memory": {
      "inject_relevant": true,
      "max_context_tokens": 2000,
      "topics": ["mission", "recent_findings"]
    },
    "skills": {
      "required": ["validation", "research"],
      "optional": ["memory-query"]
    },
    "mission": {
      "objective": "...",
      "constraints": ["..."],
      "success_criteria": ["..."]
    }
  }
}
```

### Bootstrap Prompt Template

```markdown
# Agent Bootstrap

## Mission Context
{mission_objective}

## Current State
{memory_summary}

## Available Skills
{skill_list}

## Your Role
{agent_role}

## Constraints
{constraints}

## Success Criteria
{success_criteria}
```

### Integration with Coordinator

The coordinator injects bootstrap context into agent prompts:
1. Read bootstrap config
2. Query relevant memory
3. Load skill descriptions
4. Build full agent prompt

## Files

- `bootstrap-config.json` - Default configuration
- `bootstrap-loader.ts` - Bootstrap injection
- `templates/` - Prompt templates
- `BOOTSTRAP_SKILL.md` - Self-bootstrap capability
