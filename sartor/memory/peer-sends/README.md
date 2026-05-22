---
type: meta
tags: [domain/infrastructure, meta/audit, project/peer-comms-uplift]
---

# peer-sends/ — audit log for Rocinante → peer Claude directives

Per the 2026-05-22 peer-comms streamlining design.

## What lives here

- `{YYYY-MM}.jsonl` — one record per send. Schema:
  ```json
  {
    "ts": "2026-05-22T18:45:30+00:00",
    "peer": "rtxserver",
    "path": "light" | "heavy",
    "slug": "first-line-slug",
    "content_hash": "12-char-sha256-prefix",
    "content_preview": "first 200 chars",
    "char_count": 47,
    "commit_sha": "abc123..." | null,   // heavy path only
    "ack_seen": true | false,
    "ack_snapshot": "last 1500 chars of capture-pane",
    "judgment_flags": ["vast.ai pricing/listing change"] | [],
    "status": "sent" | "send-failed",
    "error": "..."   // optional
  }
  ```

- `RECENT.md` — auto-regenerated rollup of last 20 sends with links to inbox files (heavy path) or content_preview (light path). Built by the morning-briefing scheduled task.

## Light vs heavy

- **Light** (default; <500 chars and <5 lines): direct tmux send-keys + C-m. Audit lives in the JSONL row + the capture-pane snapshot. No inbox file, no git commit.
- **Heavy**: inbox file at `sartor/memory/inbox/{peer}/{ts}-{slug}.md` + git commit + push. The commit IS part of the audit trail; the JSONL also records the SHA.

## Why this exists

Every peer-send is a coordination act between two stewards. The audit trail lets Alton see what was sent recently, lets a peer verify what was actually committed, and lets future Claudes reconstruct the conversation.

## Constitutional grounding

Per HOUSEHOLD-CONSTITUTION §14: peers are NOT subagents. The audit log makes it possible for a peer to dispute a send (see `disagree-{ts}.md` convention in Operating Agreement §4.4). Without the trail, "I never sent that" and "I never received that" become unresolvable.
