#!/bin/bash
# Hook: UserPromptSubmit
# Purpose: Detect when user wants multi-agent coordination
# Exit 0: Output modified prompt with swarm context

# Read the user's prompt from stdin
USER_PROMPT=$(cat)

# Keywords that suggest multi-agent work
SWARM_KEYWORDS=(
    "swarm"
    "parallel agents"
    "multiple agents"
    "team of agents"
    "coordinate agents"
    "multi-agent"
    "spawn agents"
    "agent team"
    "use agents"
    "launch agents"
)

# Check if prompt contains swarm keywords (case insensitive)
SWARM_DETECTED=false
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

for keyword in "${SWARM_KEYWORDS[@]}"; do
    if echo "$PROMPT_LOWER" | grep -qi "$keyword"; then
        SWARM_DETECTED=true
        break
    fi
done

if [ "$SWARM_DETECTED" = true ]; then
    # Output JSON with additionalContext for swarm mode
    cat << 'CONTEXT_EOF'
{
  "additionalContext": "SWARM MODE DETECTED - Multi-agent coordination requested.\n\nYou have access to the swarm-coordinator skill for spawning nested agents.\n\nKey capabilities:\n- Spawn child agents via .swarm/requests/ files\n- Coordinate via Firebase (real-time) or GitHub Issues (audit trail)\n- Use agent-messaging skill for inter-agent communication\n- Track progress with progress-tracker skill\n\nTo spawn a child agent, create a file:\n.swarm/requests/child-{id}.json\n\nMax concurrent agents: 10\nMax nesting depth: 3 recommended\n\nRead the swarm-coordinator skill for detailed patterns."
}
CONTEXT_EOF
else
    # No swarm keywords, pass through unchanged
    echo "{}"
fi

exit 0
