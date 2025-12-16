---
name: agent-messaging
description: File-based messaging between agents in the swarm
---

# Agent Messaging Skill

Enables asynchronous message passing between agents using file-based mailboxes.

## Message Structure

Messages are JSON files in `.swarm/mail/`:

```json
{
  "id": "msg-1701520800-abc123",
  "from": "agent-researcher-1",
  "to": "agent-orchestrator",
  "subject": "Research findings ready",
  "timestamp": "2025-12-02T12:00:00Z",
  "priority": "normal",
  "body": "I've completed the research on topic X...",
  "attachments": [
    ".swarm/artifacts/research-results.json"
  ],
  "metadata": {
    "requestId": "req-123",
    "threadId": "thread-456"
  }
}
```

## Directory Structure

```
.swarm/mail/
├── inbox/
│   ├── orchestrator/
│   │   ├── msg-001.json
│   │   └── msg-002.json
│   └── researcher-1/
│       └── msg-003.json
├── outbox/
│   ├── pending/
│   └── sent/
└── registry.json
```

## Sending a Message

```bash
# Create message file
MSG_ID="msg-$(date +%s)-$(head /dev/urandom | tr -dc a-z0-9 | head -c 6)"
TARGET_AGENT="orchestrator"

cat > ".swarm/mail/inbox/$TARGET_AGENT/$MSG_ID.json" << EOF
{
  "id": "$MSG_ID",
  "from": "$SWARM_AGENT_ROLE",
  "to": "$TARGET_AGENT",
  "subject": "Task completed",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "priority": "normal",
  "body": "Results are ready in .swarm/artifacts/output.json"
}
EOF
```

## Checking Your Inbox

```bash
# List messages
ls -la .swarm/mail/inbox/$SWARM_AGENT_ROLE/

# Read most recent
cat .swarm/mail/inbox/$SWARM_AGENT_ROLE/*.json | jq -s 'sort_by(.timestamp) | reverse | .[0]'

# Read all unread (process and delete)
for msg in .swarm/mail/inbox/$SWARM_AGENT_ROLE/*.json; do
  cat "$msg"
  mv "$msg" ".swarm/mail/processed/"
done
```

## Broadcasting to All Agents

```bash
# Get all registered agents
AGENTS=$(cat .swarm/mail/registry.json | jq -r '.agents[].id')

for agent in $AGENTS; do
  # Copy message to each inbox
  cp message.json ".swarm/mail/inbox/$agent/"
done
```

## Agent Registry

Register when starting:

```json
{
  "agents": [
    {
      "id": "orchestrator",
      "role": "orchestrator",
      "capabilities": ["coordination", "synthesis"],
      "status": "active",
      "lastSeen": "2025-12-02T12:00:00Z"
    },
    {
      "id": "researcher-1",
      "role": "researcher",
      "capabilities": ["web-search", "analysis"],
      "status": "active",
      "lastSeen": "2025-12-02T12:01:00Z"
    }
  ]
}
```

## Message Types

### Request

```json
{
  "type": "request",
  "action": "analyze",
  "payload": { "target": "file.py" },
  "replyTo": "orchestrator",
  "deadline": "2025-12-02T12:10:00Z"
}
```

### Response

```json
{
  "type": "response",
  "inReplyTo": "msg-001",
  "status": "success",
  "payload": { "findings": [...] }
}
```

### Status Update

```json
{
  "type": "status",
  "progress": 75,
  "message": "Analyzing third file...",
  "eta": "2025-12-02T12:05:00Z"
}
```

### Broadcast

```json
{
  "type": "broadcast",
  "scope": "all",
  "message": "New priority task assigned",
  "action": "pause-current"
}
```

## Handling Race Conditions

Use atomic writes:

```bash
# Write to temp file first
TEMP_FILE=".swarm/mail/inbox/$TARGET/.tmp.$MSG_ID.json"
FINAL_FILE=".swarm/mail/inbox/$TARGET/$MSG_ID.json"

echo "$MESSAGE_JSON" > "$TEMP_FILE"
mv "$TEMP_FILE" "$FINAL_FILE"  # Atomic rename
```

## Message Acknowledgment

```bash
# Sender waits for ACK
ACK_FILE=".swarm/mail/acks/$MSG_ID.ack"
timeout 30 bash -c "while [ ! -f '$ACK_FILE' ]; do sleep 1; done"

# Receiver creates ACK
echo '{"received": true, "at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > "$ACK_FILE"
```

## Priority Levels

- `critical` - Process immediately, interrupt current work
- `high` - Process next
- `normal` - Standard queue order
- `low` - Process when idle

## Threading

Use `threadId` to group related messages:

```json
{
  "threadId": "thread-research-ai-safety",
  "inReplyTo": "msg-001",
  "body": "Follow-up on the previous finding..."
}
```

Query thread:
```bash
cat .swarm/mail/inbox/*/*.json | jq -s '[.[] | select(.threadId == "thread-123")]'
```

## Best Practices

1. **Keep messages small** - Put large data in `.swarm/artifacts/`
2. **Use clear subjects** - Makes scanning easier
3. **Include context** - Recipients may not have full picture
4. **Set realistic deadlines** - Account for processing time
5. **Clean up old messages** - Archive after 1 hour
