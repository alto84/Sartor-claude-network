# claude-peer.ps1 — fast SSH+tmux access to Sartor peer Claudes from Rocinante
#
# Usage:
#   . C:\Users\alto8\Sartor-claude-network\scripts\claude-peer.ps1
#   claude-rtx           # attach to rtxpro6000server peer Claude (claude-team-1)
#   claude-gpu           # attach to gpuserver1 peer Claude (claude-team-1)
#
# To make these load every shell, add the dot-source line above to $PROFILE.
#
# Detach from the peer Claude with Ctrl+b then d.
# Do NOT Ctrl+c — that kills Claude on the peer.

function claude-rtx {
    ssh -t alton@192.168.1.157 'tmux attach -t claude-team-1 || tmux new -s claude-team-1'
}

function claude-gpu {
    ssh -t alton@192.168.1.100 'tmux attach -t claude-team-1 || tmux new -s claude-team-1'
}

Write-Host "loaded: claude-rtx, claude-gpu" -ForegroundColor Cyan
