# Memory Write Quick Reference for Subagents

## Basic Command
```bash
./scripts/memory-write.sh "your content here" [type] [importance] [tags]
```

## Memory Types
- `episodic` - Events, completions, observations (default)
- `semantic` - Facts, directives, knowledge
- `procedural` - Procedures, patterns, how-tos
- `working` - Temporary state, current context

## Importance Guidelines
- `0.9-1.0` - Critical directives, system-level knowledge
- `0.7-0.8` - Important patterns, successful procedures
- `0.5-0.6` - Regular events, standard completions
- `0.3-0.4` - Working memory, temporary state
- `0.1-0.2` - Debug info, transient data

## Quick Examples

### Task Completion (Episodic)
```bash
./scripts/memory-write.sh \
  "IMPLEMENTER: Created memory-write.sh wrapper successfully" \
  "episodic" \
  "0.6" \
  '["task","implementation","success"]'
```

### Learning/Pattern (Procedural)
```bash
./scripts/memory-write.sh \
  "Pattern: Use flock for concurrent file writes in bash" \
  "procedural" \
  "0.8" \
  '["pattern","concurrency","file-io"]'
```

### Directive (Semantic)
```bash
./scripts/memory-write.sh \
  "DIRECTIVE: Always validate inputs before processing" \
  "semantic" \
  "0.95" \
  '["directive","validation","safety"]'
```

### Current State (Working)
```bash
./scripts/memory-write.sh \
  "Processing batch 3/10, 45% complete" \
  "working" \
  "0.3" \
  '["status","temporary"]'
```

## Tag Recommendations

**Role Tags**: `implementer`, `planner`, `auditor`, `cleaner`

**Activity Tags**: `task`, `analysis`, `review`, `coordination`

**Outcome Tags**: `success`, `failure`, `blocked`, `learning`

**Domain Tags**: `memory`, `coordination`, `file-io`, `testing`

## Output Format
```json
{"id":"mem_1765477479985_2a4c455b","status":"created"}
```

## Common Patterns

### After Task Success
```bash
./scripts/memory-write.sh \
  "Task ${TASK_ID} completed: ${DESCRIPTION}" \
  "episodic" \
  "0.6" \
  "[\"${ROLE}\",\"task\",\"success\"]"
```

### On Learning
```bash
./scripts/memory-write.sh \
  "Learned: ${LESSON}" \
  "procedural" \
  "0.75" \
  "[\"${ROLE}\",\"learning\",\"pattern\"]"
```

### On Error
```bash
./scripts/memory-write.sh \
  "Error in ${COMPONENT}: ${ERROR_MSG}" \
  "episodic" \
  "0.5" \
  "[\"${ROLE}\",\"error\",\"${COMPONENT}\"]"
```

## File Locations
- Script: `/home/alton/Sartor-claude-network/scripts/memory-write.sh`
- Storage: `/home/alton/Sartor-claude-network/data/memories.json`
- Queue: `/home/alton/Sartor-claude-network/data/memory-queue.jsonl`

## Full Documentation
See: `/home/alton/Sartor-claude-network/docs/memory-write-wrapper.md`
