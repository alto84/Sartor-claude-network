---
type: reference
entity: gpuserver1-operations
updated: 2026-04-07
updated_by: Claude
status: active
tags: [domain/gpu, domain/infra, entity/machine]
aliases: [gpuserver1 Ops, GPU Server Ops]
related: [MACHINES, PROCEDURES, gpuserver1-delegation]
---

# gpuserver1 Operations Notes

Operational gotchas and disk management notes for gpuserver1. Originally lived at `~/.claude/projects/-home-alton/memory/MEMORY.md` on the server; consolidated here during the 2026-04-07 memory system upgrade.

## Disk Space Management (2026-02-27)

- Root disk is 98GB LVM. Docker is on a separate 1.8TB XFS mount at `/var/lib/docker`.
- **Biggest trap:** Docker uses containerd on ROOT (`/var/lib/containerd/`) for image content/snapshots, NOT on the Docker mount. This can silently eat 40+ GB on root while Docker mount stays nearly empty.
- `docker system prune -a --force` cleans both Docker images AND containerd content store. Single highest-impact cleanup.
- Vast.ai test images (`self-test-cu128`, `bandwidth-test-nvidia`, etc.) are ~46 GB combined but get re-pulled by Kaalia when needed for self-tests. Safe to prune when no active rentals.
- Docker also had stale `read_test`/`write_test` benchmark files (128 MB × 32 = 4 GB) on the Docker mount.
- Python packages in `~/.local/lib/python3.10/` are 7.6 GB (torch, nvidia CUDA, etc.) — needed for GPU work, don't touch.
- `psp-graph` project is 3.9 GB — user project, don't touch without asking.
- HuggingFace cache (~3 GB) in `~/.cache/huggingface/hub/` is re-downloadable.
- Old kernels accumulate — check `dpkg --list linux-image-*` and remove non-running versions.
- Snap cache at `/var/lib/snapd/cache` can be ~400 MB.
- Duplicate Docker apt source: both `/etc/apt/sources.list.d/archive_uri-*.list` and `docker.list` exist.

## Vast.ai Notes

- Machine ID: 52271
- Kaalia uses containerd via Docker runtime
- Don't prune Docker images during active rentals — Kaalia needs them
- Self-test images will be re-pulled automatically on next self-test

> [!warning]
> Before running `docker system prune`, confirm there are no active vast.ai rentals via `~/.local/bin/vastai show instances`. Pruning during active rentals has caused image-missing errors in the past.

## Claude Code on gpuserver1

- Claude Code 2.1.33 installed at `/usr/bin/claude`
- Two Claude Code project memory directories:
  - `~/.claude/projects/-home-alton/memory/` — for sessions started in `~/` (this file originally lived here)
  - `~/.claude/projects/-home-alton-Sartor-claude-network/memory/` — for sessions started in the repo
- Both are symlinked to `~/Sartor-claude-network/sartor/memory/` as of 2026-04-07 (see [[MULTI-MACHINE-MEMORY]])

## Related
- [[MACHINES]] — full machine inventory including gpuserver1 access details
- [[MULTI-MACHINE-MEMORY]] — multi-machine memory architecture
- For delegation patterns (SSH + `claude --dangerously-skip-permissions -p`) see MACHINES.md and PROCEDURES.md

## History
- 2026-02-27: Originally written as `~/.claude/projects/-home-alton/memory/MEMORY.md` on gpuserver1 after a disk space incident
- 2026-04-07: Migrated to canonical location in `sartor/memory/reference/` during memory system consolidation
