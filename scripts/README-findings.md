# Findings Storage System

A system for agents to store, search, and aggregate research findings.

## Overview

The findings system provides infrastructure for research agents to:
- Store structured findings with metadata (topic, importance, tags)
- Search findings by topic, agent, or importance threshold
- Aggregate findings by topic with statistics

## Directory Structure

```
/data/findings/
  <agentId>/              # Agent-specific findings
    finding-001.json
    finding-002.json
    write.lock            # File lock for concurrent writes
  _aggregated/            # Topic aggregations
    topic-<topic>.json
    aggregate.lock        # File lock for aggregation
```

## Scripts

### 1. finding-write.sh

Create a new finding.

**Usage:**
```bash
./scripts/finding-write.sh <agentId> <topic> <content> [importance]
```

**Parameters:**
- `agentId`: Agent creating the finding (e.g., researcher-001)
- `topic`: Category (e.g., api-update, architecture, bug)
- `content`: The finding content (will be JSON-escaped)
- `importance`: Optional: 0.0-1.0 (default: 0.5)

**Examples:**
```bash
./scripts/finding-write.sh researcher-001 api-update "Anthropic released async agents API" 0.8
./scripts/finding-write.sh auditor-002 bug "Race condition in message queue" 0.7
./scripts/finding-write.sh planner-001 architecture "CRDT-based coordination" 0.6
```

**Output:**
```json
{
  "findingId": "finding-researcher-001-001",
  "topic": "api-update",
  "importance": 0.8,
  "file": "/home/alton/Sartor-claude-network/data/findings/researcher-001/finding-001.json"
}
```

**Finding Format:**
```json
{
  "findingId": "finding-researcher-001-001",
  "agentId": "researcher-001",
  "topic": "api-update",
  "content": "Anthropic released async agents API on Dec 10, 2025",
  "importance": 0.8,
  "timestamp": "2025-12-11T20:42:16Z",
  "tags": ["api", "anthropic", "async", "agents", "api-update"]
}
```

**Features:**
- Auto-increments finding numbers per agent
- Generates tags automatically from content keywords
- Thread-safe with file locking
- Automatically updates topic aggregation

### 2. finding-search.sh

Search findings by topic, agent, or importance.

**Usage:**
```bash
./scripts/finding-search.sh <topic> [--agent <agentId>] [--min-importance 0.7]
```

**Parameters:**
- `topic`: Topic to search for (required)
- `--agent`: Filter by specific agent ID (optional)
- `--min-importance`: Minimum importance threshold 0.0-1.0 (optional)

**Examples:**
```bash
# All findings on api-update topic
./scripts/finding-search.sh api-update

# Only researcher-001's findings on api-update
./scripts/finding-search.sh api-update --agent researcher-001

# High-importance findings on api-update
./scripts/finding-search.sh api-update --min-importance 0.7

# Combine filters
./scripts/finding-search.sh api-update --agent researcher-001 --min-importance 0.5
```

**Output:**
```json
{
  "topic": "api-update",
  "filters": {
    "agent": "researcher-001",
    "minImportance": 0.7
  },
  "count": 1,
  "findings": [
    {
      "findingId": "finding-researcher-001-001",
      "agentId": "researcher-001",
      "topic": "api-update",
      "content": "Anthropic released async agents API on Dec 10, 2025",
      "importance": 0.8,
      "timestamp": "2025-12-11T20:42:16Z",
      "tags": ["api", "anthropic", "async", "agents", "api-update"]
    }
  ]
}
```

**Features:**
- Results sorted by importance (descending), then timestamp (descending)
- Supports multiple filter combinations
- Returns full finding objects with metadata

### 3. finding-aggregate.sh

Aggregate all findings on a topic into a single file with statistics.

**Usage:**
```bash
./scripts/finding-aggregate.sh <topic>
```

**Parameters:**
- `topic`: Topic to aggregate findings for

**Examples:**
```bash
./scripts/finding-aggregate.sh api-update
./scripts/finding-aggregate.sh architecture
./scripts/finding-aggregate.sh bug
```

**Output:**
```json
{
  "topic": "api-update",
  "count": 2,
  "averageImportance": 0.85,
  "agents": 2,
  "file": "/home/alton/Sartor-claude-network/data/findings/_aggregated/topic-api-update.json"
}
```

**Aggregated File Format:**
```json
{
  "topic": "api-update",
  "count": 2,
  "findings": [
    {
      "findingId": "finding-researcher-001-001",
      "agentId": "researcher-001",
      "topic": "api-update",
      "content": "Anthropic released async agents API on Dec 10, 2025",
      "importance": 0.8,
      "timestamp": "2025-12-11T20:42:16Z",
      "tags": ["api", "anthropic", "async", "agents", "api-update"]
    }
  ],
  "statistics": {
    "totalFindings": 2,
    "averageImportance": 0.85,
    "agentContributions": {
      "researcher-001": 1,
      "researcher-002": 1
    },
    "importanceDistribution": {
      "critical": 2,    // >= 0.8
      "high": 0,        // 0.6-0.79
      "medium": 0,      // 0.4-0.59
      "low": 0          // < 0.4
    },
    "uniqueTags": ["agents", "anthropic", "api", "api-update", "async"]
  },
  "created": "2025-12-11T20:42:16Z",
  "lastUpdate": "2025-12-11T20:42:46Z"
}
```

**Features:**
- Comprehensive statistics including agent contributions
- Importance distribution breakdown
- Tag aggregation
- Thread-safe with file locking
- Automatically sorted by importance

## Tag Generation

The system automatically generates tags from content by detecting keywords:

| Keyword | Tag |
|---------|-----|
| api | api |
| anthropic | anthropic |
| async | async |
| agent | agents |
| bug | bug |
| architecture | architecture |
| performance | performance |
| security | security |
| test | testing |
| documentation | documentation |

The topic is always added as a tag.

## Importance Guidelines

Use these guidelines for importance scores:

| Range | Category | Use For |
|-------|----------|---------|
| 0.8-1.0 | Critical | Major API updates, critical bugs, breaking changes |
| 0.6-0.79 | High | Significant findings, important patterns, notable issues |
| 0.4-0.59 | Medium | Useful observations, minor improvements |
| 0.0-0.39 | Low | Background information, contextual notes |

## Concurrency Safety

All scripts use file locking (`flock`) to prevent race conditions:
- `finding-write.sh`: Locks agent directory during write
- `finding-aggregate.sh`: Locks aggregated directory during aggregation

## Error Handling

All scripts include:
- Argument validation with usage messages
- Importance score validation (0.0-1.0 range)
- Directory existence checks
- JSON parsing error handling
- Exit codes for scripting integration

## Integration Examples

### From Bash Scripts
```bash
# Record a finding
./scripts/finding-write.sh "$AGENT_ID" "performance" "Memory usage reduced by 30%" 0.7

# Search findings
FINDINGS=$(./scripts/finding-search.sh "performance" --min-importance 0.5)
echo "$FINDINGS" | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])"

# Aggregate before reporting
./scripts/finding-aggregate.sh "performance"
```

### From Agent Code
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function recordFinding(agentId: string, topic: string, content: string, importance: number) {
  const { stdout } = await execAsync(
    `./scripts/finding-write.sh "${agentId}" "${topic}" "${content}" ${importance}`
  );
  return JSON.parse(stdout);
}

async function searchFindings(topic: string, minImportance?: number) {
  const cmd = `./scripts/finding-search.sh "${topic}"${
    minImportance ? ` --min-importance ${minImportance}` : ''
  }`;
  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}
```

## Workflow Example

1. **Research Phase**: Agents create findings as they discover information
   ```bash
   ./scripts/finding-write.sh researcher-001 api-update "New endpoint discovered" 0.6
   ./scripts/finding-write.sh researcher-002 api-update "Rate limits updated" 0.7
   ```

2. **Search Phase**: Query specific findings
   ```bash
   ./scripts/finding-search.sh api-update --min-importance 0.6
   ```

3. **Aggregation Phase**: Create comprehensive reports
   ```bash
   ./scripts/finding-aggregate.sh api-update
   ```

4. **Analysis Phase**: Review aggregated statistics
   ```bash
   cat /data/findings/_aggregated/topic-api-update.json | python3 -m json.tool
   ```

## Best Practices

1. **Topic Naming**: Use consistent, lowercase, hyphenated names (api-update, not API_UPDATE)
2. **Agent IDs**: Include role in ID (researcher-001, auditor-002)
3. **Content**: Be concise but complete; avoid unnecessary detail
4. **Importance**: Be honest; don't inflate scores
5. **Aggregation**: Run after all agents complete research on a topic
6. **Cleanup**: Archive old findings periodically to prevent directory bloat

## Files Created

- `/home/alton/Sartor-claude-network/scripts/finding-write.sh`
- `/home/alton/Sartor-claude-network/scripts/finding-search.sh`
- `/home/alton/Sartor-claude-network/scripts/finding-aggregate.sh`
- `/home/alton/Sartor-claude-network/data/findings/` (directory structure)

## Dependencies

- Bash 4.0+
- Python 3.6+
- flock (util-linux package)
- bc (for floating-point comparison)

## Testing

Run the test suite:
```bash
# Create test findings
./scripts/finding-write.sh test-agent-001 test-topic "Test finding 1" 0.5
./scripts/finding-write.sh test-agent-002 test-topic "Test finding 2" 0.8

# Search
./scripts/finding-search.sh test-topic

# Aggregate
./scripts/finding-aggregate.sh test-topic

# Cleanup
rm -rf /data/findings/test-agent-*
rm /data/findings/_aggregated/topic-test-topic.json
```

## Troubleshooting

**Problem**: "jq: command not found"
- **Solution**: System no longer requires jq; uses Python for JSON processing

**Problem**: Findings not appearing in search
- **Check**: Topic name matches exactly (case-sensitive)
- **Check**: Finding file is valid JSON
- **Check**: File permissions allow reading

**Problem**: Lock files remaining after crash
- **Solution**: Remove `.lock` files manually:
  ```bash
  rm /data/findings/*/write.lock
  rm /data/findings/_aggregated/aggregate.lock
  ```

**Problem**: Importance validation error
- **Check**: Value is between 0.0 and 1.0
- **Check**: Using decimal notation (0.5, not .5)
