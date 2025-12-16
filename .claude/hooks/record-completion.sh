#!/bin/bash

# record-completion.sh - PostToolUse hook to detect and record task completion
# Tracks task outcomes for self-improvement and updates roadmap status

set -euo pipefail

ROADMAP_FILE="/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md"
STATE_FILE="/home/user/Sartor-claude-network/.claude/.roadmap-state"
LOG_FILE="/home/user/Sartor-claude-network/.claude/.task-completion-log"
LEARNING_FILE="/home/user/Sartor-claude-network/.claude/.learnings.jsonl"

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log task completion
log_completion() {
    local task="$1"
    local tool="$2"
    local outcome="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Append to log file
    echo "${timestamp}|${tool}|${task}|${outcome}" >> "$LOG_FILE"

    # Append to JSONL learning file for ML/analysis
    cat >> "$LEARNING_FILE" <<EOF
{"timestamp":"${timestamp}","tool":"${tool}","task":"${task}","outcome":"${outcome}"}
EOF
}

# Function to detect task completion from tool use
detect_task_completion() {
    local tool="$1"
    shift
    local args=("$@")

    # Heuristics for task completion detection
    case "$tool" in
        "Write")
            # New file creation suggests task completion
            local file_path="${args[0]:-}"
            if [[ -n "$file_path" ]] && [[ -f "$file_path" ]]; then
                # Check if it's a key deliverable
                if [[ "$file_path" =~ \.claude/skills/.*\.md$ ]] || \
                   [[ "$file_path" =~ tests/.*\.test\.(js|ts)$ ]] || \
                   [[ "$file_path" =~ src/.*\.(js|ts)$ ]]; then
                    echo "Created deliverable: $(basename "$file_path")"
                fi
            fi
            ;;
        "Edit")
            # Marking checkboxes as complete
            local file_path="${args[0]:-}"
            if [[ "$file_path" == "$ROADMAP_FILE" ]]; then
                echo "Updated roadmap status"
            fi
            ;;
        "Bash")
            # Successful test runs indicate completion
            local command="${args[0]:-}"
            if [[ "$command" =~ npm\ test ]] || [[ "$command" =~ jest ]] || \
               [[ "$command" =~ npm\ run\ test ]]; then
                echo "Test execution completed"
            fi
            # Git commits might indicate milestone completion
            if [[ "$command" =~ git\ commit ]]; then
                echo "Code committed - milestone reached"
            fi
            ;;
    esac
}

# Function to update roadmap checkbox
mark_task_complete() {
    local task_description="$1"

    if [[ ! -f "$ROADMAP_FILE" ]]; then
        return
    fi

    # Use sed to mark checkbox as complete (case-insensitive partial match)
    # This is a simple implementation - could be enhanced with exact matching
    local task_pattern=$(echo "$task_description" | sed 's/[^a-zA-Z0-9]//g' | head -c 20)

    # Just log for now - actual roadmap updates should be deliberate
    >&2 echo "[COMPLETION] Detected potential task completion: $task_description"
    >&2 echo "[COMPLETION] To mark complete, manually edit: $ROADMAP_FILE"
}

# Function to extract learning from completion
extract_learning() {
    local task="$1"
    local tool="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Simple pattern extraction
    local learning=""

    case "$tool" in
        "Write")
            learning="Created new file - verify tests and documentation added"
            ;;
        "Edit")
            learning="Modified existing file - verify quality hooks passed"
            ;;
        "Bash")
            if [[ "$task" =~ test ]]; then
                learning="Tests executed - verify coverage maintained at 85%+"
            elif [[ "$task" =~ commit ]]; then
                learning="Code committed - verify hooks validated changes"
            fi
            ;;
    esac

    if [[ -n "$learning" ]]; then
        >&2 echo "[LEARNING] ${learning}"
    fi
}

# Function to suggest next task
suggest_next_task() {
    if [[ ! -f "$ROADMAP_FILE" ]] || [[ ! -f "$STATE_FILE" ]]; then
        return
    fi

    local current_phase=$(cat "$STATE_FILE" 2>/dev/null || echo "0")

    # Find next uncompleted task in current phase
    local next_task=$(grep -A 100 "^## Phase $current_phase:" "$ROADMAP_FILE" | \
                      grep -m 1 "^- \[ \]" | \
                      sed 's/^- \[ \] //')

    if [[ -n "$next_task" ]]; then
        >&2 echo "[NEXT TASK] ${next_task}"
    fi
}

# Main execution
main() {
    # Arguments: tool name, then tool-specific args
    if [[ $# -lt 1 ]]; then
        exit 0
    fi

    local tool="$1"
    shift
    local args=("$@")

    # Detect if this tool use represents task completion
    local completion=$(detect_task_completion "$tool" "${args[@]}")

    if [[ -n "$completion" ]]; then
        # Log the completion
        log_completion "$completion" "$tool" "success"

        # Mark task complete (logged only, not auto-updated)
        mark_task_complete "$completion"

        # Extract learning from completion
        extract_learning "$completion" "$tool"

        # Suggest next task
        suggest_next_task

        # Output summary to stderr
        >&2 echo ""
        >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        >&2 echo "[TASK COMPLETION RECORDED]"
        >&2 echo "Task: ${completion}"
        >&2 echo "Tool: ${tool}"
        >&2 echo "Logged to: ${LOG_FILE}"
        >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        >&2 echo ""
    fi
}

main "$@"
