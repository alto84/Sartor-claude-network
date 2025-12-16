#!/bin/bash
# Hook: SessionStart
# Purpose: Inject swarm skills availability into session context
# Exit 0: Output context about available swarm capabilities

cat << 'EOF'
{
  "additionalContext": "SWARM SKILLS AVAILABLE:\n\n1. swarm-coordinator - Spawn and coordinate nested agent hierarchies\n2. agent-messaging - File-based async messaging between agents\n3. progress-tracker - Track state across agent handoffs\n\nSwarm directory structure:\n.swarm/\n├── requests/    # Drop agent requests here\n├── results/     # Completed results appear here\n├── mail/        # Agent mailboxes\n├── artifacts/   # Shared outputs\n├── state.json   # Current swarm status\n└── PROGRESS.md  # Human-readable log\n\nEnvironment variables (if spawned by coordinator):\n- SWARM_REQUEST_ID: Your request ID\n- SWARM_PARENT_ID: Parent's ID (if nested)\n- SWARM_AGENT_ROLE: Your assigned role"
}
EOF

exit 0
