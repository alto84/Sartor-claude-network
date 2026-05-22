Send a one-call directive to a Sartor peer Claude (rtxserver or gpuserver1).

Parse `$ARGUMENTS` as `<peer> <prompt>`:
- The FIRST token is the peer name (`rtxserver`, `rtxpro6000server`, or `gpuserver1`)
- EVERYTHING ELSE is the prompt (may contain spaces, newlines, quotes, anything)

Then invoke the helper script:

1. Write the prompt to a temp file using the Write tool:
   - Path: `C:\Users\alto8\AppData\Local\Temp\peer-send-{epoch-seconds}.txt`
   - Content: the prompt verbatim, no wrapping or rewriting
2. Call `python scripts/peer-send.py <peer> --from-file <temp-path>` via Bash
3. Report back the script's stderr + exit code, plus a short summary of what was sent

**Behavior the script handles automatically** (don't duplicate any of these manually):
- SSH + tmux preflight + recovery if session dead
- OAuth credential refresh if <4h to expiry
- Light path for short messages (direct tmux send-keys + C-m, JSONL log only)
- Heavy path for long/multi-line (auto-creates inbox file + git commit + push + tmux pull-and-read)
- Ack verification (capture-pane after 4s, look for "Cogitating"/"Forming"/tool-call indicator)
- §7 content judgment (warns on pricing/money/medical/kids patterns — does NOT block; peer can decline)
- JSONL audit log at `sartor/memory/peer-sends/{YYYY-MM}.jsonl`

**When you should NOT use `/peer-send`:**
- The directive requires the peer to make a pricing change on vast.ai — that's Alton-only per Constitution §7
- The directive requires money movement — Alton-only
- The directive sends under Alton's name to a third party — drafts only, never sent
- You're issuing a hard-stop / kill — that's SSH + raw tmux-kill, an explicit escalation

**Cross-references:**
- Design: `sartor/memory/projects/peer-comms-streamlining-2026-05-22.md`
- Script: `scripts/peer-send.py`
- Constitution §14 (peers are NOT subagents — they can decline)
- Operating Agreement §4.4 (disagree-ladder if peer pushes back)
