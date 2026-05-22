---
type: project
date: 2026-05-22
status: design-complete-pending-greenlight
tags: [domain/infrastructure, project/peer-comms-uplift, meta/design]
---

# Peer-Comms Streamlining — Design Synthesis

**Authored by:** Rocinante Opus 4.7 synthesizing 3 parallel subagent reports (pain points, architecture options, governance constraints)
**Status:** Design complete. Implementation not started. Awaiting Alton's greenlight before building.

## Problem statement

The current peer-comms workflow (Rocinante → rtxserver / gpuserver1 peer Claude instances) takes **~30-60 seconds + 5-step mechanical ceremony per send**, with documented silent-failure footguns. Alton wants it as ergonomic as `Agent({subagent_type, prompt})` — ideally a single slash command.

The risk: making it too easy could erode Constitution §14's "peers are NOT subagents" principle. The design must lower friction on mechanics while preserving the deliberateness of inter-steward coordination.

## Evidence base — current pain points (15)

### Friction (slows but works)

1. **5-step pre-flight ceremony** (~30-60s per send): SSH ping, tmux liveness, OAuth expiry, GPU state, disk pressure. Fires every directive.
2. **Write→SCP→send-keys→C-m→capture-pane** (5 manual steps): Fires every >5-line directive.
3. **Bidirectional context loss**: peers wake cold, can't tell if prior session crashed/killed/exited. Wake-13 report cited a 45h gap of unknown peer state.

### Footguns (silently fail)

4. **OAuth staleness**: peer Claude shows "API Error: 401" mid-session, won't auto-refresh, requires session-kill + lost state. Push freq bumped nightly→4h on 2026-05-02 due to this.
5. **Peer `origin` divergence**: rtxserver and gpuserver1 still have wrong remote target months post-cutover. Peer was 37 commits behind for a full directive cycle, undetected.
6. **`send-keys "Enter"` vs `C-m`**: sending `Enter` deposits literal "Enter" string into prompt buffer; only `C-m` submits. Silent if no capture-pane verify.
7. **Heredoc quoting** on apostrophes / backticks / `$`: failure can be partial (prompt arrives truncated at first unescaped char).
8. **`capture-pane` empty if session not opened with `-x 200 -y 50`**: looks identical to "Claude is thinking."
9. **Heartbeat staleness undetected**: `inbox/rtxpro6000server/_heartbeat.md` was 17 days stale; one of the cron writers silently broken.
10. **`vast_metrics.service` 7-day restart loop on peer**: chmod bit dropped on shipped script, 58,807 restart cycles, only caught by accident.

### Trust gates (preserve even at cost of speed)

11. **7-element directive structure** (Context / Goal / Phases / Decision rules / Phone-home triggers / Budget / Commit target): does real work; calibrates peer's phone-home quality.
12. **Phone-home file** (not message-send) for stops: legitimate Constitution §14 channel for surfacing-vs-acting.
13. **Peer-as-steward, not subagent**: Constitution §14. Speed-up that collapses this would let Rocinante silently override peer judgment.
14. **Disagreement ladder** (`disagree-{ts}.md` + 24h wait): OA §4.4. Preserves audit trail.
15. **No autonomous `vastai`/`docker` actions on peer**: SKILL "What NOT to do" + 2026-05-19 vast.ai sticky-error incident shows Rocinante stopping at the right place.

## Recommended architecture

**Two-layer minimal stack:**

### Layer 1 — `scripts/peer-send.ps1`

PowerShell helper on Rocinante. Single invocation runs the full ceremony.

```
scripts\peer-send.ps1 -Peer <rtxserver|gpuserver1> -PromptFile <path> [-VerifyAfter <sec>]
```

What it does, in order:
1. **Pre-flight bundle** (parallelized): SSH reachability ping, `tmux ls` for `claude-team-1`, OAuth expiry from `~/.claude/.credentials.json`, basic disk + GPU sanity
2. **OAuth refresh** if <4h to expiry (calls existing `sartor-creds-sync.ps1` for that peer only)
3. **Tmux session recovery** if dead (rtxserver via `systemctl --user start sartor-claude-peer.service`; gpuserver1 via scripted recreate with `-x 200 -y 50`)
4. **`scp` directive file** to `/tmp/peer-send-{ts}.txt` on peer
5. **`ssh ... tmux send-keys -t claude-team-1:0 "$(cat /tmp/peer-send-{ts}.txt)"`** for the text
6. **Separate `ssh ... tmux send-keys -t claude-team-1:0 C-m`** for submit
7. **Sleep 4s, capture-pane tail**: verify orchestrator transitioned to "Forming…" / "Cogitating…" / showing tool calls
8. **Exit 0 on visible-processing**, non-zero with stderr diagnostic on failure

Properties:
- Idempotent (rerun is safe; same `{ts}` won't be re-sent if Step 7 already saw processing)
- Composable: callable from the Bash tool, cron, scripts, by hand
- Cross-platform: PowerShell on Rocinante; the ssh+tmux is platform-agnostic
- Failure modes surface through standard exit-code + stderr (no custom error format)

Build cost: 3-6h (one PowerShell file, ~150 lines).

### Layer 2 — `/peer <peer> <prompt>` slash command

Markdown file `.claude/commands/peer.md`. Ergonomic skin. Expands to a prompt instructing the model:

> Write `$ARGUMENTS` (after stripping the peer-name token) to `%TEMP%\peer-send-{ts}.txt` using the Write tool. Then invoke `scripts\peer-send.ps1 -Peer <peer> -PromptFile <that-file>` via Bash. Then report the capture-pane tail. If `$ARGUMENTS` is multi-line or >500 chars, the prompt MUST instead be drafted as a directive file at `sartor/memory/inbox/{peer}/{ts}-{slug}.md` following the 7-element structure, committed, pushed, and the tmux message becomes "git pull && cat <directive-file>; act on it".

Build cost: 1h (one markdown file).

### Knock-on changes when this lands

- **`peer-coordinator.md` agent**: amend §"Task B: Send a prompt" to point at `scripts/peer-send.ps1` as the canonical send mechanism. The agent stays useful for **long-running peer monitoring** (polling inboxes, surfacing phone-homes, multi-hour pass-off cycles) — not the entry point for single sends.
- **`peer-comms` SKILL.md**: condense §"Sending a directive" to "use `/peer` or `scripts/peer-send.ps1`; this skill documents what happens under the hood when debugging."
- **OPERATING-AGREEMENT.md**: no changes required. §4.1's "synchronous dispatch (SSH + `claude -p`)" is silent on transport mechanism.
- **Constitution §14**: untouched.

### Rejected alternatives

- **MCP server `mcp__sartor-peer-comms`**: Build cost 8-16h. Defer until empirical friction with the helper CLI is measured. Would wrap the same script underneath.
- **File-watcher hook**: Bypasses the "directive ceremony is a deliberate act" texture §14 wants preserved. Race conditions.
- **Enhanced peer-coordinator as primary**: Spawning a subagent for a 5-second send is the wrong cost shape. Agent stays useful for longer-running monitoring.

## Governance guardrails (must hold in implementation)

### Must preserve

- Inbox-as-canonical-channel: every substantive directive lands as a file in `sartor/memory/inbox/{peer}/` BEFORE the tmux pane
- Git as the medium: directive file → commit → push → peer pulls; `git log` is the verifiable record
- Disagree-ladder: `disagree-{ts}.md` + 24h wait + escalate; tool must NOT provide a "force" path
- Peer refusal as first-class: peer DECLINES malformed directives; tool surfaces refusals, doesn't retry-and-suppress
- Phone-home convention: peer writes back to `inbox/{peer}/PHONE-HOME-*.md`; tool never auto-acknowledges

### Safely automated (the footguns)

- The mechanical send sequence
- Submit verification (the `C-m` check)
- OAuth freshness check
- Transient-failure recovery (tmux dead → restart; ssh timeout → retry with backoff; narrow pane → recreate)

### Must stay human-gated (Constitution §7)

- Pricing changes on vast.ai (any `vastai list machine`, cuts, list/unlist) — already 24h Alton turnaround per OA §5.1
- Money movement of any kind
- Sending under Alton's name (drafts only)
- Externalizing family medical / children's info — tool must REFUSE directives containing these
- Cross-domain directives (Rocinante telling gpuserver1 to edit rtxserver/'s files etc.) — peer refuses, tool surfaces refusal

### Three-tier authority

| Tier | Action | Authorization |
|---|---|---|
| 1 | peer-send-directive (coordination act, file→commit→push→tmux) | Autonomously invocable by Rocinante's model |
| 2 | peer-direct-execute (raw SSH bypassing local Claude for substantive work) | Human-gated (preserves existing SKILL "What NOT to do") |
| 3 | Any §7-adjacent payload (pricing, money, comms-under-name, medical, kids) | Explicit Alton signoff token required per invocation |

### Audit trail per send

Three artifacts per send:
1. Directive file in `sartor/memory/inbox/{peer}/{ts}-{slug}.md`
2. Git commit on rtxserver bare: `peer-send: {peer} {slug}` (conventional)
3. Log line in `sartor/memory/peer-sends/{YYYY-MM}.jsonl`: sender, peer, slug, commit SHA, send timestamp, capture-pane snapshot

`sartor/memory/peer-sends/RECENT.md` — auto-regen as a tail of the JSONL with hyperlinks. Surfaced in morning briefing when count >5 in past 24h.

### Misfire reversal

Since directive is a committed file, reversal is a **follow-up directive** (`RETRACT-{original-slug}.md`) sent through the same channel. Peer reads retraction on next inbox drain, stops. Reversal is always a **request**, not a kill (Constitution §14 — peer is not a subagent that can be terminated). Hard-stop requires SSH-kill the tmux session — Alton-only escalation.

## Implementation roadmap

### Phase 1 — `peer-send.ps1` core (3-6h)

Build the PowerShell helper. Test in isolation against rtxserver (the peer that's most active right now). Verify:
- Short-message path (single-line, <300 chars): direct tmux send-keys
- Long-message path (>500 chars or multi-line): inbox file + commit + push + tmux "git pull && cat <file>"
- OAuth refresh path (when token <4h to expiry)
- Tmux session recovery path
- Submit verification (capture-pane tail confirms processing)
- §7-content scan: refuses directives containing pricing-change syntax, "send email", medical/kid PII patterns

### Phase 2 — `/peer` slash command (1h)

Build `.claude/commands/peer.md`. Test by Alton issuing `/peer rtxserver "check disk"` and seeing the full flow.

### Phase 3 — Audit infrastructure (2h)

- `sartor/memory/peer-sends/` directory + JSONL writer (called from peer-send.ps1)
- `sartor/memory/peer-sends/RECENT.md` auto-regen script (called from morning-briefing scheduled task)
- One-line addition to morning-briefing to surface >5-sends-in-24h

### Phase 4 — Doc updates (1h)

- `peer-coordinator.md`: amend Task B to delegate to script
- `peer-comms/SKILL.md`: condense "Sending a directive" section
- Update CLAUDE.md scheduled-tasks table if cron entries change

### Phase 5 — Underlying-issue cleanup (out of scope for this project but surfaced)

- Peer-side `origin` divergence (pain point #5) needs fixing at peer level — separate work
- Heartbeat-staleness silent-failure (pain point #9) needs the broken cron writer identified — separate work
- `vast_metrics` restart loop (pain point #10) was a symptom; per-peer self-stewardship hardening would catch the class — separate work

Total Phase 1-4: ~7-10 hours of focused work. Phase 5 is separately tracked.

## Open decisions for Alton

1. **Build immediately or stage for next-week sprint?** Tonight has shown the friction is real (just-blew-fuses, lost-NVML, stuck-rebase all sat behind clumsy peer-coord). Worth fast-tracking?
2. **PowerShell as language?** I'm proposing it to match existing `scripts/win-tasks/*.ps1` idiom. Alternative: Python (more portable, but adds dependency).
3. **§7-content scanner false-positive tolerance?** The scanner refuses sends containing certain patterns. If false-positives are too high, it becomes friction; if too low, it's not catching real risks. How conservative?
4. **Slash-command name `/peer` vs `/peer-send`?** Short is good; collision check: no existing `/peer` command.
5. **Inbox-file naming convention** for the short-message path? Even tiny `/peer rtxserver "df -h"` calls leave an artifact — that's the audit principle holding. But it could clutter inbox if not pruned. Should they auto-drain to `_drained/` after the curator pass?

## Cross-references

- `.claude/skills/peer-comms/SKILL.md`
- `.claude/agents/peer-coordinator.md`
- `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` §14
- `sartor/memory/reference/OPERATING-AGREEMENT.md` §4.1, §4.2, §4.4, §5.1
- `scripts/win-tasks/sartor-creds-sync.ps1` (style reference for new PowerShell)
- Tonight's directive `sartor/memory/inbox/rtxpro6000server/2026-05-22-temp-logging-during-spinup.md` — concrete example the new tool would have streamlined
