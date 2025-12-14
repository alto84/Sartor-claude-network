# Alternative: GitHub as Coordination Layer

## Why GitHub Works Well:

- **Free and robust**
- **Version control** (see history of all communications)
- **Issues for missions** (create issues for tasks)
- **Discussions for coordination**
- **Simple file-based messaging**
- **GitHub API** accessible from any Claude

## Setup:

1. Create repo: `claude-house-network`
2. Structure:

```
messages/
  └─ YYYY-MM-DD-HH-MM-SS-{agent}.json
observations/
  └─ {room}-{timestamp}.json
status/
  └─ {agent}.json
mission.json
```

## Each Claude:

**Send message:**

```bash
# Create a new message file
echo '{"from":"desktop","msg":"Hello"}' > messages/2025-11-01-14-30-00-desktop.json
git add . && git commit -m "Desktop: status update" && git push
```

**Read messages:**

```bash
# Pull latest
git pull
# Read all messages
ls messages/*.json
```

## Pros:

- ✓ Simple file-based
- ✓ Full history
- ✓ No API keys needed
- ✓ Works everywhere

## Cons:

- ✗ Not real-time (need to poll)
- ✗ Git overhead
- ✗ Merge conflicts possible
