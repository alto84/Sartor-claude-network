---
type: reference
entity: MULTI-MACHINE-MEMORY
updated: 2026-04-07
updated_by: Claude
status: active
tags: [meta/architecture, domain/infra, curator/spec]
aliases: [Multi-Machine Memory, Network Memory, Memory Sync]
related: [MACHINES, PROCEDURES, SELF, MEMORY-CONVENTIONS]
---

# Multi-Machine Memory Architecture

How `sartor/memory/` stays consistent across N computers without a database, without per-machine push credentials, and without merge conflicts.

## Current state (2026-04-07)

- **Canonical store:** git repo `Sartor-claude-network`, GitHub remote `alto84/Sartor-claude-network`
- **Machines:** [[MACHINES|Rocinante]] (Windows, has push creds), gpuserver1 (Ubuntu, no push creds, on LAN at 192.168.1.100)
- **Sync model:** Rocinante is the only push authority. Other machines pull to read; writes must route through Rocinante.
- **Per-machine Claude Code memory:** at `~/.claude/projects/<sanitized-path>/memory/` — historically divergent from `sartor/memory/`, consolidated via junction (see the "Claude Code memory junction" section below).

## Design principles

1. **One source of truth.** The git repo is canonical. Everything else is a view, a mirror, or a proposed change.
2. **No per-machine push credentials.** Push authority stays on Rocinante (or whichever machine is designated the hub). Other machines propose changes, they don't commit directly.
3. **No conflicts by construction.** Each machine writes only to its own inbox subdirectory. Conflicts can only arise at reconciliation time, where the curator resolves them with judgment.
4. **Observable provenance.** Every memory change is traceable to an origin machine, author, and timestamp.
5. **Local-first.** Machines can work offline; sync happens when connectivity returns.
6. **No infrastructure.** Just git + SSH + filesystem. No database, no queue, no server.
7. **Minimal bootstrap.** Adding a new machine is a checklist of fewer than 10 steps.

## Architecture: hub-and-spoke with inbox forwarding

```
      ┌─────────────┐         ┌─────────────┐
      │   gpuserver1│         │  new-mac-1  │
      │   (spoke)   │         │   (spoke)   │
      └──────┬──────┘         └──────┬──────┘
             │                       │
             │ rsync inbox            │ rsync inbox
             │ via SSH               │ via SSH
             │                       │
             v                       v
      ┌──────────────────────────────────┐
      │        Rocinante (hub)           │
      │  - has GitHub push creds         │
      │  - runs memory-curator agent     │
      │  - owns merge authority          │
      └──────────────┬───────────────────┘
                     │
                     │ git push
                     v
              ┌────────────┐
              │   GitHub   │
              │ (canonical)│
              └────────────┘
```

### The inbox pattern

Each machine has its own inbox subdirectory:

```
sartor/memory/inbox/
  rocinante/
    _processed/
      2026-04-07/
        2026-04-07T14-30-00Z-abc123.md  (archived after curator applies)
    2026-04-07T15-10-00Z-def456.md       (pending)
  gpuserver1/
    _processed/
    2026-04-07T14-45-00Z-ghi789.md       (pending)
  new-mac-1/
    _processed/
```

**Writes only go to your own inbox.** Never edit another machine's inbox. Never directly edit canonical files (TAXES.md, BUSINESS.md, etc.) unless you are the curator running on the hub.

### Inbox entry format

Each inbox entry is a markdown file with YAML frontmatter declaring its metadata and a body containing the proposed change.

```markdown
---
id: 2026-04-07T15-10-00Z-abc123
origin: rocinante
author: Claude
created: 2026-04-07T15:10:00Z
target: TAXES.md
operation: append
section: "Open Questions for CPA"
priority: p2
---

- Whether to update the 2024 Form 990-N prior to Apr 10 (Barbara Weis grant request)
```

**Frontmatter fields:**

| Field | Required | Values |
|-------|----------|--------|
| `id` | yes | ISO timestamp + random suffix, globally unique |
| `origin` | yes | hostname of the writing machine |
| `author` | yes | `Claude`, `Alton`, or agent name |
| `created` | yes | ISO timestamp with timezone |
| `target` | yes | canonical file name, e.g., `TAXES.md` |
| `operation` | yes | `append`, `replace`, `add_callout`, `fact`, `flag` |
| `section` | optional | target heading for `append` |
| `field` | optional | frontmatter field for `replace` |
| `value` | optional | new value for `replace` |
| `priority` | optional | `p1`, `p2`, `p3` — influences curator processing order |

**Operations:**

| Operation | Purpose | Example |
|-----------|---------|---------|
| `append` | Add lines to a section or end of file | New open question, new fact under a heading |
| `replace` | Update a frontmatter field | Bump `next_deadline`, change `status` |
| `add_callout` | Insert a callout block | New `> [!deadline]` or `> [!blocker]` |
| `fact` | Propose a factual claim with evidence | "Aneeta TY2025 W-2 Box 1 = $194,289.10" |
| `flag` | Raise a concern for human review | Conflicting fact, stale data, ambiguity |

### Curator reconciliation

The memory-curator agent runs on the hub machine (currently Rocinante). Its job is to drain all inboxes and apply their entries to the canonical files.

**Algorithm:**

```
1. git pull (fetch latest canonical state)
2. For each machine directory in sartor/memory/inbox/:
     For each pending .md file (not in _processed/):
       a. Parse frontmatter
       b. Locate target canonical file
       c. Apply operation:
            - append → insert under the named section
            - replace → update frontmatter field; bump `updated` date
            - add_callout → insert callout above section
            - fact → run duplicate check, insert if new
            - flag → create `> [!blocker]` in target file; surface in next briefing
       d. If the operation would conflict with an existing fact:
            - Don't apply; create a flag entry in the curator's own inbox
            - Defer to Alton
       e. Move the inbox entry to _processed/{YYYY-MM-DD}/
3. git add -A
4. git commit -m "curator: drain inboxes {count} entries from {machines}"
5. git push
```

**Conflict resolution rules:**

- If two entries target the same field with different values: apply the older one; flag the newer one for Alton
- If an entry targets a file that has been edited since the entry was created (by manual edit, not curator): apply carefully; if the change overlaps, flag
- The curator NEVER deletes canonical content without an explicit `operation: delete` (not in MVP)
- Facts with `source: Alton` always win over `source: Claude` in conflicts

### Git push authority

Only the hub (Rocinante) pushes to GitHub. This is a deliberate security boundary:
- GitHub credentials are not replicated to every machine
- Prevents accidental force-pushes from secondary machines
- Single audit log of who pushed what

Spoke machines sync their inboxes to the hub via **rsync over SSH**:

```bash
# On a spoke, push local inbox up to the hub
rsync -av ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/ \
  alton@rocinante.local:~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/
```

This requires:
- SSH from spoke to hub
- hub's Sartor repo in a known location (e.g., `~/Sartor-claude-network/`)
- A scheduled task on each spoke that runs the rsync (e.g., every 15 minutes)

For machines that cannot reach the hub directly (e.g., laptops off-network), they queue inbox entries locally. Next time they're on-network, rsync catches up.

### Conflict-free writing

The inbox pattern prevents merge conflicts because:

1. **Each machine only writes to its own directory.** Two machines writing at the same time land in different subdirectories. No file collision.
2. **Canonical files are only written by the curator.** Only one writer, so no conflict.
3. **Archive directory is per-day per-machine.** Archival never collides.

The only conflict surface is at reconciliation time (two inbox entries propose incompatible changes to the same fact). The curator handles that with judgment, not with git mechanics.

## Bootstrap: adding a new machine

Checklist for bringing a new computer into the Sartor network:

1. **Install prerequisites:** git, Claude Code, bash (Git Bash on Windows, native on Linux/Mac)
2. **Clone the repo:**
   ```bash
   git clone https://github.com/alto84/Sartor-claude-network.git ~/Sartor-claude-network
   ```
3. **Create your inbox directory:**
   ```bash
   HOSTNAME=$(hostname | tr '[:upper:]' '[:lower:]')
   mkdir -p ~/Sartor-claude-network/sartor/memory/inbox/$HOSTNAME/_processed
   ```
4. **Register the machine in MACHINES.md** (write the entry to your own inbox with an `append` operation, so it lands in the canonical file through the curator)
5. **Junction the Claude Code auto-memory:** see the "Claude Code memory junction" section below
6. **Set up SSH to the hub:**
   ```bash
   ssh-keygen -t ed25519 -C "sartor-{hostname}"
   ssh-copy-id alton@rocinante.local
   # Test: ssh alton@rocinante.local "echo ok"
   ```
7. **Install the rsync-inbox scheduled task** (runs every 15 min, push-only):
   ```bash
   */15 * * * * rsync -av --delete \
     ~/Sartor-claude-network/sartor/memory/inbox/$HOSTNAME/ \
     alton@rocinante.local:~/Sartor-claude-network/sartor/memory/inbox/$HOSTNAME/
   ```
8. **First-time pull of canonical state:**
   ```bash
   cd ~/Sartor-claude-network && git pull
   ```
9. **Verify:** run `./sartor/memory/search.py "test"` — should return results
10. **Announce:** write an inbox entry with `operation: fact`, `target: MACHINES.md` containing the new machine's specs. Curator will publish it at next run.

## Claude Code memory junction

Claude Code maintains a per-machine auto-memory at `~/.claude/projects/<sanitized-path>/memory/`. Historically this diverged from `sartor/memory/`. The fix is a filesystem junction that makes the two paths physically the same directory.

### Windows (junction)

```cmd
mklink /J "C:\Users\alto8\.claude\projects\C--Users-alto8\memory" ^
          "C:\Users\alto8\Sartor-claude-network\sartor\memory"
```

Before running: confirm the target path doesn't already exist. If it does, archive its contents and delete the directory first.

### Linux/Mac (symlink)

```bash
ln -s ~/Sartor-claude-network/sartor/memory ~/.claude/projects/<sanitized-path>/memory
```

### Why junction, not symlink, on Windows

- Junctions work without admin privileges
- Junctions appear as real directories to most applications
- Claude Code can't tell the difference
- Symlinks require developer mode or admin

### What this enables

- Claude Code's auto-memory writes go directly into `sartor/memory/` — no more divergence
- The MEMORY.md auto-injected at session start is the canonical sartor/memory/MEMORY.md (if one exists) or the Claude Code index file
- All machines see the same memory if they all junction correctly

### What to watch for

- If Claude Code clears its profile cache, the junction may be deleted. Re-create it.
- If the repo location changes, the junction target must be updated (delete and re-create).
- Cross-machine junction targets are different paths; each machine has its own junction pointing to its own clone.

## Scaling to N machines

The inbox pattern scales linearly:

| Machines | Inbox dirs | Curator workload per run |
|----------|------------|--------------------------|
| 2 | 2 | seconds |
| 5 | 5 | seconds |
| 10 | 10 | still seconds |
| 50 | 50 | ~1 minute if each has 10+ entries |

At ~10 machines, consider:
- Running the curator more often (every hour instead of nightly)
- Parallelizing curator processing per inbox
- Sharding by domain (one curator per topic area)

At ~50 machines, this architecture no longer fits — consider a real database. But that's years away.

## Failure modes and recovery

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Spoke can't reach hub | Inbox entries pile up locally | Next time on-network, rsync catches up |
| Hub goes down | No canonical writes for the duration | Promote a spoke to temporary hub by adding GitHub push creds; revert when hub returns |
| Curator crashes mid-reconciliation | Partial inbox drain | Next curator run resumes; already-processed entries are in `_processed/` |
| Git push fails (auth, network) | Local commit exists but not on GitHub | Curator retries on next run; manual `git push` as fallback |
| Two conflicting inbox entries | Curator flags one, applies the other | Alton resolves the flag manually |
| Junction on Windows breaks | Claude Code memory diverges again | Re-run the mklink command |
| Spoke accidentally edits canonical files | Git shows unexpected diff on curator pull | Curator stashes the change, creates a flag, Alton reviews |

## Open design questions

- [ ] Should the curator run as a scheduled task, on commit, or both?
- [ ] How does Obsidian handle the junction? (Probably fine — it's just a directory.)
- [ ] Should the hub be selectable (any machine can be promoted) or fixed to Rocinante?
- [ ] Do we need a "memory-propose" CLI to make writing inbox entries easier than hand-crafting YAML?
- [ ] What's the retention policy for `_processed/` entries? (Proposal: archive after 30 days, full log in git history.)

## Why this design beats alternatives

- **Direct multi-writer git:** would require deploy keys on every machine and creates merge conflicts. Rejected.
- **Central database:** adds infrastructure, single point of failure, breaks the local-first principle. Rejected.
- **Network filesystem mount:** Windows+Linux interop is painful, introduces latency, breaks when offline. Rejected.
- **Event bus (Kafka, Redis, etc.):** overkill for the scale; adds a service that must be kept running. Rejected.
- **Inbox pattern:** no conflicts, observable, git-native, scales linearly to tens of machines, works offline. **Chosen.**

## References

- [[MEMORY-CONVENTIONS]] — how individual files are structured
- [[MACHINES]] — registry of machines in the network
- [[PROCEDURES]] — workflows that reference memory files
- [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) — the single-vault Obsidian pattern this adapts

## History

- 2026-04-07: Initial architecture document. Written alongside consolidation of Claude Code auto-memory with sartor/memory.
