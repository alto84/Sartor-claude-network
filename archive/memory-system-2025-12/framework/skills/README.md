# Skills Framework

## Purpose
Curate and manage capabilities that can be loaded into agents, enabling:
- Specialized behaviors
- Domain expertise
- Consistent patterns across agents

## Architecture

### Skill Structure

Each skill is a directory containing:
```
skill-name/
├── SKILL.md          # Main skill documentation (required)
├── prompts/          # Prompt templates
│   └── *.md
├── examples/         # Usage examples
│   └── *.md
└── tools/            # Custom tool definitions (optional)
    └── *.json
```

### Skill Categories

1. **Research Skills**
   - Web search patterns
   - Academic research
   - Code analysis

2. **Implementation Skills**
   - Code generation
   - Testing patterns
   - Documentation

3. **Coordination Skills**
   - Multi-agent patterns
   - Task decomposition
   - Result synthesis

4. **Validation Skills**
   - Evidence checking
   - Anti-fabrication
   - Quality assurance

### Skill Loading

Skills are loaded via:
1. `.claude/skills/` directory (auto-loaded)
2. Explicit skill invocation
3. Bootstrap injection for new agents

### Skill Registry

```json
{
  "skills": {
    "research-web": {
      "path": "skills/research-web/",
      "category": "research",
      "description": "Web search and synthesis"
    },
    "validate-evidence": {
      "path": "skills/validate-evidence/",
      "category": "validation",
      "description": "Evidence-based validation"
    }
  }
}
```

## Files

- `skill-registry.json` - Skill catalog
- `skill-loader.ts` - Dynamic skill loading
- `skill-template/` - Template for new skills
