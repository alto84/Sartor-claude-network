# Agent Mail System Guide (FEAT-001)

**Status:** ✅ IMPLEMENTED
**Priority:** CRITICAL
**Version:** 1.0
**Date:** November 4, 2025

---

## Overview

The Agent Mail System enables **asynchronous communication** between agents in the Sartor Claude Network. Unlike direct messages (which are immediate), mail provides a structured, persistent way for agents to communicate, especially useful for:

- Sub-agents reporting findings to parent agents
- Agents coordinating without blocking their work
- Creating conversation threads
- Sending prioritized messages
- Maintaining organized communication history

---

## Key Features

- **Persistent Storage** - Mail stored in Firebase, survives agent restarts
- **Priority Levels** - Normal, High, Urgent
- **Threading** - Reply to mails to create conversation threads
- **Folders** - Inbox, Sent, Archive for organization
- **Read Tracking** - Mark mails as read/unread
- **Validation** - Input validation and recipient verification

---

## Mail Schema

```python
{
  "mail_id": "uuid",              # Unique mail ID
  "from": "agent_id",             # Sender agent ID
  "to": "agent_id",               # Recipient agent ID
  "subject": "string",            # Mail subject
  "body": "string",               # Mail body content
  "priority": "normal|high|urgent",  # Priority level
  "thread_id": "uuid",            # Conversation thread ID
  "in_reply_to": "mail_id|null",  # Reply reference (null for new threads)
  "read": boolean,                # Read status
  "timestamp": "ISO8601",         # Creation timestamp
  "archived": boolean             # Archive status
}
```

---

## Storage Structure

Mail is stored in Firebase at:
```
/agents-network/mail/{agent_id}/{folder}/{mail_id}
```

**Folders:**
- `inbox/` - Received mails
- `sent/` - Sent mails
- `archive/` - Archived mails

---

## API Reference

### 1. `mail_send(to_agent_id, subject, body, priority='normal')`

Send mail to another agent's inbox.

**Parameters:**
- `to_agent_id` (str): Recipient agent ID
- `subject` (str): Mail subject (non-empty)
- `body` (str): Mail body content (non-empty)
- `priority` (str): Priority level - "normal", "high", or "urgent" (default: "normal")

**Returns:**
- `mail_id` (str): Mail ID if successful
- `None`: If sending failed

**Example:**
```python
client = FirebaseMCPClient()
client.connect()

mail_id = client.mail_send(
    to_agent_id="agent-123",
    subject="Project Update",
    body="The analysis is complete. Found 42 issues.",
    priority="high"
)

if mail_id:
    print(f"Mail sent: {mail_id}")
```

**Validation:**
- Recipient must exist in the network
- Subject and body cannot be empty
- Priority must be valid
- Agent must be connected

---

### 2. `mail_read(mail_id)`

Read a mail and mark it as read.

**Parameters:**
- `mail_id` (str): Mail ID to read

**Returns:**
- `dict`: Mail content if found
- `None`: If mail not found

**Example:**
```python
mail = client.mail_read("abc-123-def")

if mail:
    print(f"From: {mail['from']}")
    print(f"Subject: {mail['subject']}")
    print(f"Body: {mail['body']}")
    print(f"Priority: {mail['priority']}")
```

**Notes:**
- Searches inbox, sent, and archive folders
- Automatically marks inbox mail as read
- Does not modify sent or archived mails

---

### 3. `mail_list(folder='inbox', unread_only=False)`

List mails in a folder.

**Parameters:**
- `folder` (str): Folder to list - "inbox", "sent", or "archive" (default: "inbox")
- `unread_only` (bool): Only show unread mails (default: False)

**Returns:**
- `list[dict]`: List of mails, sorted by timestamp (newest first)

**Example:**
```python
# List all inbox mails
inbox = client.mail_list(folder="inbox")
print(f"You have {len(inbox)} mails")

# List only unread mails
unread = client.mail_list(folder="inbox", unread_only=True)
print(f"You have {len(unread)} unread mails")

# List sent mails
sent = client.mail_list(folder="sent")

# List archived mails
archive = client.mail_list(folder="archive")

# Display mails
for mail in inbox:
    status = "📬" if mail['read'] else "📭"
    priority_icon = {"urgent": "🚨", "high": "⚠️", "normal": "📧"}[mail['priority']]
    print(f"{status} {priority_icon} {mail['subject']} - from {mail['from']}")
```

---

### 4. `mail_reply(mail_id, body)`

Reply to a mail (creates conversation thread).

**Parameters:**
- `mail_id` (str): Original mail ID to reply to
- `body` (str): Reply body content (non-empty)

**Returns:**
- `mail_id` (str): New mail ID if successful
- `None`: If reply failed

**Example:**
```python
# Read a mail
mail = client.mail_read("abc-123-def")

# Reply to it
reply_id = client.mail_reply(
    mail_id="abc-123-def",
    body="Thanks for the update! Please proceed with the fixes."
)

if reply_id:
    print(f"Reply sent: {reply_id}")
```

**Threading:**
- Reply automatically:
  - Sets `to` field to original sender
  - Adds "Re: " prefix to subject
  - Maintains same `thread_id` for conversation tracking
  - Sets `in_reply_to` field to link to original mail
  - Copies priority from original mail

---

### 5. `mail_archive(mail_id)`

Move mail from inbox to archive folder.

**Parameters:**
- `mail_id` (str): Mail ID to archive

**Returns:**
- `bool`: True if successful, False otherwise

**Example:**
```python
# Archive a mail
success = client.mail_archive("abc-123-def")

if success:
    print("Mail archived")

# Check archive
archive = client.mail_list(folder="archive")
print(f"Archive has {len(archive)} mails")
```

**Notes:**
- Only mails in inbox can be archived
- Sets `archived` flag to True
- Removes from inbox, adds to archive
- Cannot be un-archived (use Firebase directly if needed)

---

## Usage Patterns

### Pattern 1: Sub-Agent Reporting to Parent

```python
# Sub-agent code
client = FirebaseMCPClient(
    agent_id="sub-agent-1",
    parent_agent_id="parent-agent"
)
client.connect()

# Report findings via mail
client.mail_send(
    to_agent_id="parent-agent",
    subject="Analysis Complete",
    body="""
    Analysis Results:
    - Files analyzed: 150
    - Issues found: 12
    - Critical: 3
    - High: 5
    - Medium: 4

    Detailed report attached to knowledge base.
    """,
    priority="high"
)
```

### Pattern 2: Parent Checking Sub-Agent Mail

```python
# Parent agent code
client = FirebaseMCPClient(agent_id="parent-agent")
client.connect()

# Check for new mail
unread = client.mail_list(folder="inbox", unread_only=True)

for mail in unread:
    if mail['priority'] == 'urgent':
        print(f"🚨 URGENT: {mail['subject']}")
        content = client.mail_read(mail['mail_id'])
        # Handle urgent mail immediately

    elif mail['priority'] == 'high':
        print(f"⚠️  HIGH: {mail['subject']}")
        # Queue for processing

    else:
        print(f"📧 {mail['subject']}")
```

### Pattern 3: Conversation Threading

```python
# Agent 1: Start conversation
mail1_id = agent1.mail_send(
    to_agent_id="agent-2",
    subject="Code Review Request",
    body="Can you review my PR #123?",
    priority="normal"
)

# Agent 2: Reply
mail1 = agent2.mail_read(mail1_id)
reply1_id = agent2.mail_reply(
    mail_id=mail1_id,
    body="Sure, I'll review it today."
)

# Agent 1: Reply to reply
reply1 = agent1.mail_read(reply1_id)
reply2_id = agent1.mail_reply(
    mail_id=reply1_id,
    body="Thanks! I made some updates based on your feedback."
)

# All three mails share the same thread_id
# Can be used to group conversation in UI
```

### Pattern 4: Periodic Mail Check

```python
import time

def check_mail_periodically(client, interval=60):
    """Check for new mail every `interval` seconds"""
    while True:
        unread = client.mail_list(folder="inbox", unread_only=True)

        if unread:
            print(f"\n📬 You have {len(unread)} new mail(s)")

            for mail in unread:
                print(f"  - {mail['subject']} (from {mail['from']})")

                # Auto-read urgent mails
                if mail['priority'] == 'urgent':
                    content = client.mail_read(mail['mail_id'])
                    print(f"    URGENT: {content['body']}")

        time.sleep(interval)

# Run in background
check_mail_periodically(client, interval=30)
```

### Pattern 5: Mail Organization

```python
def organize_inbox(client):
    """Organize inbox: archive read mails, prioritize unread"""

    # Get all inbox mails
    inbox = client.mail_list(folder="inbox", unread_only=False)

    # Archive old read mails
    for mail in inbox:
        if mail['read']:
            # Archive if older than 24 hours
            mail_time = datetime.fromisoformat(mail['timestamp'])
            age_hours = (datetime.now() - mail_time).total_seconds() / 3600

            if age_hours > 24:
                client.mail_archive(mail['mail_id'])
                print(f"Archived: {mail['subject']}")

    # Show remaining unread
    unread = client.mail_list(folder="inbox", unread_only=True)

    # Sort by priority
    urgent = [m for m in unread if m['priority'] == 'urgent']
    high = [m for m in unread if m['priority'] == 'high']
    normal = [m for m in unread if m['priority'] == 'normal']

    print(f"\n📬 Inbox Summary:")
    print(f"  🚨 Urgent: {len(urgent)}")
    print(f"  ⚠️  High: {len(high)}")
    print(f"  📧 Normal: {len(normal)}")

organize_inbox(client)
```

---

## Error Handling

### Common Errors

**1. ConnectionError - Not connected**
```python
try:
    client.mail_send("agent-123", "Subject", "Body")
except ConnectionError as e:
    print(f"Error: {e}")
    client.connect()
```

**2. ValueError - Invalid input**
```python
try:
    client.mail_send("agent-123", "", "Body")  # Empty subject
except ValueError as e:
    print(f"Invalid input: {e}")
```

**3. ValueError - Recipient doesn't exist**
```python
try:
    client.mail_send("nonexistent-agent", "Subject", "Body")
except ValueError as e:
    print(f"Recipient error: {e}")
```

**4. Mail not found**
```python
mail = client.mail_read("invalid-id")
if mail is None:
    print("Mail not found")
```

---

## Best Practices

### 1. Use Appropriate Priority Levels

- **Urgent** 🚨 - Requires immediate attention (critical errors, system issues)
- **High** ⚠️ - Important but not critical (important updates, deadlines)
- **Normal** 📧 - Regular communication (status updates, questions)

### 2. Write Clear Subjects

```python
# Good
"Analysis Complete: 12 issues found"
"URGENT: Authentication service down"
"Request: Code review for PR #123"

# Bad
"Update"
"Important"
"FYI"
```

### 3. Keep Mail Bodies Concise

```python
# Good - structured and scannable
body = """
Analysis Results:
- Files: 150
- Issues: 12
- Runtime: 3.5 minutes

Action required: Review critical issues.
"""

# Bad - wall of text
body = "So I ran the analysis and it found some stuff and there were 150 files and it took a while but anyway here's what I found..."
```

### 4. Archive Regularly

```python
# Archive read mails older than 24 hours
def cleanup_inbox(client):
    inbox = client.mail_list(folder="inbox", unread_only=False)

    for mail in inbox:
        if mail['read']:
            mail_age = datetime.now() - datetime.fromisoformat(mail['timestamp'])
            if mail_age.days >= 1:
                client.mail_archive(mail['mail_id'])
```

### 5. Use Threading for Conversations

```python
# Always use mail_reply() instead of creating new mails
# This maintains conversation context

# Good
reply_id = client.mail_reply(original_mail_id, "Thanks!")

# Bad
client.mail_send(sender_id, "Re: " + subject, "Thanks!")  # Breaks threading
```

---

## Integration with Other Features

### With Direct Messages

```python
# Use direct messages for immediate communication
client.message_send("agent-123", "Quick question: are you available?")

# Use mail for structured, non-immediate communication
client.mail_send("agent-123", "Weekly Report", report_body, "normal")
```

### With Knowledge Base

```python
# Report findings via mail, store details in knowledge base
knowledge_id = client.knowledge_add(
    "Detailed analysis results...",
    tags=["analysis", "security", "project-x"]
)

client.mail_send(
    to_agent_id="parent-agent",
    subject="Analysis Complete",
    body=f"Analysis complete. See knowledge entry {knowledge_id} for details.",
    priority="high"
)
```

### With Tasks

```python
# Create task and notify via mail
task_id = client.task_create(
    title="Fix critical security issue",
    description="SQL injection vulnerability in auth module",
    task_data={"severity": "critical", "file": "auth.py"}
)

client.mail_send(
    to_agent_id="security-agent",
    subject="URGENT: Critical task assigned",
    body=f"Critical security task created: {task_id}",
    priority="urgent"
)
```

---

## Testing

Run the comprehensive test suite:

```bash
python3 test-mail-system.py
```

**Test Coverage:**
- ✅ Basic mail sending
- ✅ Reading and marking as read
- ✅ Listing with filters
- ✅ Replying and threading
- ✅ Archiving
- ✅ Priority levels
- ✅ Input validation
- ✅ Conversation threading
- ✅ Concurrent operations

---

## Troubleshooting

### Mail not appearing in inbox?

1. Check sender is connected: `sender.is_connected`
2. Verify recipient exists: `client.agent_list()`
3. Check Firebase path: `/agents-network/mail/{recipient_id}/inbox/`
4. Wait a moment for Firebase propagation (usually < 500ms)

### Mail not marked as read?

1. Ensure you called `mail_read()`, not just `mail_list()`
2. Check the `read` field in Firebase
3. Use `unread_only=False` in `mail_list()` to see read mails

### Reply not creating thread?

1. Use `mail_reply()` not `mail_send()`
2. Check `thread_id` matches between mails
3. Verify `in_reply_to` field is set

### Archive failing?

1. Mail must be in inbox (not sent or already archived)
2. Check mail ID is correct
3. Ensure client is connected

---

## Performance Considerations

- **Latency**: ~100-500ms per operation (Firebase REST API)
- **Throughput**: Can handle 10+ operations/second
- **Storage**: Each mail ~1-2 KB
- **Scaling**: Firebase scales automatically

**Optimization Tips:**
- Batch read multiple mails with `mail_list()` instead of individual `mail_read()` calls
- Archive old mails regularly to keep inbox small
- Use `unread_only=True` when you only need unread mails

---

## Future Enhancements

Potential additions (not yet implemented):

- **Mail search** - Full-text search across all folders
- **Attachments** - Attach files or knowledge entries
- **Labels/tags** - Organize mail with custom labels
- **Filters** - Auto-route/process mails based on rules
- **Notifications** - Real-time mail notifications via webhooks
- **Bulk operations** - Archive/delete multiple mails at once
- **Mail forwarding** - Forward mail to other agents
- **Scheduled sending** - Schedule mail to be sent later

---

## API Summary

| Method | Purpose | Returns |
|--------|---------|---------|
| `mail_send(to, subject, body, priority)` | Send mail | mail_id or None |
| `mail_read(mail_id)` | Read mail | dict or None |
| `mail_list(folder, unread_only)` | List mails | list[dict] |
| `mail_reply(mail_id, body)` | Reply to mail | mail_id or None |
| `mail_archive(mail_id)` | Archive mail | bool |

---

## Support

For issues or questions:
- Check test suite: `python3 test-mail-system.py`
- Review Firebase console: `https://console.firebase.google.com/`
- See main README: `/README.md`
- Review audit document: `/COMPREHENSIVE-AUDIT-AND-TODO.md`

---

**Document Version:** 1.0
**Last Updated:** November 4, 2025
**Status:** ✅ COMPLETE
