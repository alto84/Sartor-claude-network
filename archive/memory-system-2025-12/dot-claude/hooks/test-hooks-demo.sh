#!/bin/bash

# test-hooks-demo.sh - Demonstration of roadmap context injection system
# This script shows how the hooks work together to provide context and track progress

set -euo pipefail

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║       Roadmap Context Injection System - Live Demonstration         ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Demo 1: SessionStart Hook
echo "━━━ Demo 1: SessionStart Hook (inject-roadmap.sh) ━━━"
echo "Simulating agent session start..."
echo ""
/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1
echo ""
echo "✓ Agent now knows current phase, status, and next task"
echo ""
sleep 2

# Demo 2: Task Completion Detection
echo "━━━ Demo 2: Task Completion Detection (record-completion.sh) ━━━"
echo ""

echo "Simulating skill file creation..."
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh \
    Write \
    /home/user/Sartor-claude-network/.claude/skills/evidence-based-validation/skill.md 2>&1
echo ""
sleep 1

echo "Simulating test execution..."
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh \
    Bash \
    "npm test" 2>&1
echo ""
sleep 1

echo "Simulating git commit..."
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh \
    Bash \
    "git commit -m 'Implement evidence-based validation skill'" 2>&1
echo ""
sleep 1

# Demo 3: Learning Data
echo "━━━ Demo 3: Accumulated Learning Data ━━━"
echo ""

echo "Task Completion Log (.task-completion-log):"
echo "┌────────────────────┬──────┬─────────────────────────┬─────────┐"
printf "│ %-18s │ %-4s │ %-23s │ %-7s │\n" "Timestamp" "Tool" "Task" "Outcome"
echo "├────────────────────┼──────┼─────────────────────────┼─────────┤"
if [[ -f /home/user/Sartor-claude-network/.claude/.task-completion-log ]]; then
    tail -5 /home/user/Sartor-claude-network/.claude/.task-completion-log | while IFS='|' read -r timestamp tool task outcome; do
        # Truncate long fields
        timestamp_short=$(echo "$timestamp" | cut -c1-18)
        task_short=$(echo "$task" | cut -c1-23)
        printf "│ %-18s │ %-4s │ %-23s │ %-7s │\n" "$timestamp_short" "$tool" "$task_short" "$outcome"
    done
else
    printf "│ %-18s │ %-4s │ %-23s │ %-7s │\n" "(no data yet)" "" "" ""
fi
echo "└────────────────────┴──────┴─────────────────────────┴─────────┘"
echo ""
sleep 1

echo "Learnings (JSONL format):"
if [[ -f /home/user/Sartor-claude-network/.claude/.learnings.jsonl ]]; then
    tail -3 /home/user/Sartor-claude-network/.claude/.learnings.jsonl | head -3 | while read -r line; do
        echo "  $line" | head -c 70
        echo "..."
    done
else
    echo "  (no learnings yet)"
fi
echo ""
sleep 1

# Demo 4: Analysis Example
echo "━━━ Demo 4: Self-Improvement Analysis ━━━"
echo ""

if [[ -f /home/user/Sartor-claude-network/.claude/.learnings.jsonl ]] && command -v jq &> /dev/null; then
    echo "Task completion by tool type:"
    cat /home/user/Sartor-claude-network/.claude/.learnings.jsonl | \
        jq -r '.tool' | sort | uniq -c | \
        awk '{printf "  %s: %d completions\n", $2, $1}'
    echo ""

    total=$(cat /home/user/Sartor-claude-network/.claude/.learnings.jsonl | wc -l)
    echo "Total tasks completed: $total"
else
    echo "  Install jq for advanced analysis: apt-get install jq"
fi
echo ""
sleep 1

# Demo 5: Manual Phase Control
echo "━━━ Demo 5: Manual Phase Control ━━━"
echo ""

echo "Current phase detection: automatic (based on checkboxes)"
echo ""

echo "Setting manual phase override to Phase 1..."
echo "1" > /home/user/Sartor-claude-network/.claude/.roadmap-state
echo ""

echo "Roadmap context with manual override:"
/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1
echo ""

echo "Removing override..."
rm -f /home/user/Sartor-claude-network/.claude/.roadmap-state
echo "✓ Returned to automatic phase detection"
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                           Demonstration Complete                     ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "What you just saw:"
echo "  1. ✓ Automatic roadmap context injection at session start"
echo "  2. ✓ Task completion detection from tool usage"
echo "  3. ✓ Learning data accumulation (CSV + JSONL)"
echo "  4. ✓ Self-improvement analysis capabilities"
echo "  5. ✓ Manual phase control when needed"
echo ""
echo "Every agent session automatically receives this context."
echo "Every task completion contributes to collective learning."
echo ""
echo "Files created:"
echo "  • .claude/hooks/inject-roadmap.sh       (SessionStart hook)"
echo "  • .claude/hooks/record-completion.sh    (PostToolUse hook)"
echo "  • .claude/.task-completion-log          (completion log)"
echo "  • .claude/.learnings.jsonl              (learning data)"
echo "  • .claude/settings.json                 (hook registration)"
echo ""
echo "Read more: .claude/hooks/ROADMAP_HOOKS_README.md"
echo ""
