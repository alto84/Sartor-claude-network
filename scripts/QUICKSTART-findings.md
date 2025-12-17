# Findings System - Quick Start

## TL;DR

```bash
# Write a finding
./scripts/finding-write.sh <agentId> <topic> "<content>" [importance]

# Search findings
./scripts/finding-search.sh <topic> [--agent <agentId>] [--min-importance 0.7]

# Aggregate findings
./scripts/finding-aggregate.sh <topic>
```

## Common Operations

### Create Finding
```bash
./scripts/finding-write.sh researcher-001 api-update "Anthropic released async agents" 0.8
```

### Search All Findings on Topic
```bash
./scripts/finding-search.sh api-update
```

### Search with Filters
```bash
# By agent
./scripts/finding-search.sh api-update --agent researcher-001

# By importance
./scripts/finding-search.sh api-update --min-importance 0.7

# Both
./scripts/finding-search.sh api-update --agent researcher-001 --min-importance 0.5
```

### Aggregate Topic
```bash
./scripts/finding-aggregate.sh api-update
```

### View Aggregation
```bash
cat /home/alton/Sartor-claude-network/data/findings/_aggregated/topic-api-update.json
```

## Importance Levels

| Score | Category | Example |
|-------|----------|---------|
| 0.9-1.0 | Critical | Breaking API changes |
| 0.7-0.89 | High | New major features |
| 0.5-0.69 | Medium | Minor updates |
| 0.3-0.49 | Low | Documentation changes |
| 0.0-0.29 | Trivial | Typo fixes |

## Common Topics

- `api-update` - API changes and updates
- `architecture` - System architecture findings
- `bug` - Bug discoveries
- `performance` - Performance observations
- `security` - Security findings
- `documentation` - Documentation issues

## Directory Structure

```
/data/findings/
  researcher-001/
    finding-001.json    # Individual findings
    finding-002.json
  researcher-002/
    finding-001.json
  _aggregated/
    topic-api-update.json    # Aggregated by topic
    topic-architecture.json
```

## Output Format

### Finding Write
```json
{"findingId":"finding-researcher-001-001","topic":"api-update","importance":0.8}
```

### Finding Search
```json
{
  "topic": "api-update",
  "count": 2,
  "findings": [...]
}
```

### Finding Aggregate
```json
{
  "topic": "api-update",
  "count": 2,
  "averageImportance": 0.85,
  "agents": 2
}
```

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required arguments | Too few parameters | Check usage: `--help` |
| Importance must be 0.0-1.0 | Invalid score | Use decimal between 0.0 and 1.0 |
| Findings directory not found | Missing directory | Created automatically on first write |

## Integration Example

```bash
#!/bin/bash
AGENT_ID="researcher-001"
TOPIC="api-update"

# Record findings
./scripts/finding-write.sh "$AGENT_ID" "$TOPIC" "Finding 1" 0.7
./scripts/finding-write.sh "$AGENT_ID" "$TOPIC" "Finding 2" 0.8

# Search
RESULTS=$(./scripts/finding-search.sh "$TOPIC" --agent "$AGENT_ID")
echo "$RESULTS"

# Aggregate
./scripts/finding-aggregate.sh "$TOPIC"
```

## See Also

- `README-findings.md` - Full documentation
- `scripts/memory-write.sh` - Memory system
- `scripts/checkpoint.sh` - Progress tracking
