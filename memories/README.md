# Cold Tier Memory Storage

This directory stores long-term memory data persisted to GitHub (Cold Tier).

## Structure

```
memories/
├── semantic/    # Facts, knowledge, patterns
├── episodic/    # Events with timestamps
├── procedural/  # Workflows, successful methods
└── .init.json   # Initialization metadata
```

## Latency

- Expected: 1-5 seconds (GitHub API)
- Use case: Archival storage for low-access memories

## Tier Sync Rules

**Demotion to Cold** (from Warm):
- Memory not accessed for 7+ days
- Importance score < 0.5
- Not tagged "permanent" or "critical"

**Retrieval from Cold**:
- On-demand via `cold-tier.ts` API
- Promotes to warm tier on access

## Configuration

Set these environment variables:
```bash
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=alto84
GITHUB_REPO=Sartor-claude-network
GITHUB_BASE_PATH=memories
```
