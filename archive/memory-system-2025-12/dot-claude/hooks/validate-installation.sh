#!/bin/bash

# validate-installation.sh - Verify roadmap context injection system is correctly installed

set -euo pipefail

PASS="\033[0;32m✓\033[0m"
FAIL="\033[0;31m✗\033[0m"
WARN="\033[0;33m⚠\033[0m"
INFO="\033[0;34mℹ\033[0m"

echo "════════════════════════════════════════════════════════════════"
echo "  Roadmap Context Injection System - Installation Validation"
echo "════════════════════════════════════════════════════════════════"
echo ""

checks_passed=0
checks_failed=0
checks_warned=0

# Function to check file exists and is executable
check_executable() {
    local file=$1
    local name=$2

    if [[ -f "$file" ]]; then
        if [[ -x "$file" ]]; then
            echo -e "$PASS $name exists and is executable"
            ((checks_passed++))
        else
            echo -e "$FAIL $name exists but is not executable"
            echo "    Fix: chmod +x $file"
            ((checks_failed++))
        fi
    else
        echo -e "$FAIL $name not found"
        echo "    Expected at: $file"
        ((checks_failed++))
    fi
}

# Function to check file exists
check_file_exists() {
    local file=$1
    local name=$2
    local required=$3

    if [[ -f "$file" ]]; then
        echo -e "$PASS $name exists"
        ((checks_passed++))
    else
        if [[ "$required" == "required" ]]; then
            echo -e "$FAIL $name not found (required)"
            echo "    Expected at: $file"
            ((checks_failed++))
        else
            echo -e "$WARN $name not found (optional, will be created on first use)"
            ((checks_warned++))
        fi
    fi
}

# Function to check JSON syntax
check_json_syntax() {
    local file=$1
    local name=$2

    if command -v python3 &> /dev/null; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo -e "$PASS $name has valid JSON syntax"
            ((checks_passed++))
        else
            echo -e "$FAIL $name has invalid JSON syntax"
            echo "    Validate with: python3 -m json.tool $file"
            ((checks_failed++))
        fi
    else
        echo -e "$INFO Skipping JSON validation (python3 not available)"
    fi
}

# Function to check hook registration
check_hook_registered() {
    local hook_type=$1
    local hook_name=$2
    local settings_file=$3

    if grep -q "\"$hook_type\"" "$settings_file"; then
        echo -e "$PASS $hook_name registered in settings.json"
        ((checks_passed++))
    else
        echo -e "$FAIL $hook_name not registered in settings.json"
        echo "    Add $hook_type section to settings.json"
        ((checks_failed++))
    fi
}

# Function to test hook execution
test_hook_execution() {
    local hook_script=$1
    local hook_name=$2
    local test_args=$3

    if $hook_script $test_args > /dev/null 2>&1; then
        echo -e "$PASS $hook_name executes without errors"
        ((checks_passed++))
    else
        local exit_code=$?
        echo -e "$FAIL $hook_name execution failed (exit code: $exit_code)"
        echo "    Test with: $hook_script $test_args"
        ((checks_failed++))
    fi
}

echo "━━━ 1. Checking Hook Scripts ━━━"
echo ""

check_executable \
    "/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh" \
    "inject-roadmap.sh"

check_executable \
    "/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh" \
    "record-completion.sh"

check_executable \
    "/home/user/Sartor-claude-network/.claude/hooks/test-hooks-demo.sh" \
    "test-hooks-demo.sh (demo script)"

echo ""
echo "━━━ 2. Checking Configuration ━━━"
echo ""

check_file_exists \
    "/home/user/Sartor-claude-network/.claude/settings.json" \
    "settings.json" \
    "required"

check_json_syntax \
    "/home/user/Sartor-claude-network/.claude/settings.json" \
    "settings.json"

check_hook_registered \
    "sessionStart" \
    "SessionStart hook" \
    "/home/user/Sartor-claude-network/.claude/settings.json"

check_hook_registered \
    "postToolUse" \
    "PostToolUse hooks" \
    "/home/user/Sartor-claude-network/.claude/settings.json"

echo ""
echo "━━━ 3. Checking Documentation ━━━"
echo ""

check_file_exists \
    "/home/user/Sartor-claude-network/.claude/hooks/ROADMAP_HOOKS_README.md" \
    "ROADMAP_HOOKS_README.md" \
    "required"

check_file_exists \
    "/home/user/Sartor-claude-network/.claude/hooks/INSTALLATION_SUMMARY.md" \
    "INSTALLATION_SUMMARY.md" \
    "required"

echo ""
echo "━━━ 4. Checking Roadmap File ━━━"
echo ""

check_file_exists \
    "/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md" \
    "IMPLEMENTATION_ORDER.md (roadmap)" \
    "required"

echo ""
echo "━━━ 5. Checking Data Files ━━━"
echo ""

check_file_exists \
    "/home/user/Sartor-claude-network/.claude/.task-completion-log" \
    ".task-completion-log" \
    "optional"

check_file_exists \
    "/home/user/Sartor-claude-network/.claude/.learnings.jsonl" \
    ".learnings.jsonl" \
    "optional"

echo ""
echo "━━━ 6. Testing Hook Execution ━━━"
echo ""

test_hook_execution \
    "/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh" \
    "inject-roadmap.sh" \
    ""

test_hook_execution \
    "/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh" \
    "record-completion.sh" \
    "Bash 'echo test'"

echo ""
echo "━━━ 7. Integration Test ━━━"
echo ""

# Test that inject-roadmap produces expected output
if /home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1 | grep -q "Current Phase"; then
    echo -e "$PASS inject-roadmap.sh produces roadmap context"
    ((checks_passed++))
else
    echo -e "$FAIL inject-roadmap.sh does not produce expected output"
    ((checks_failed++))
fi

# Test that record-completion creates log entries
temp_log_lines_before=$(wc -l < /home/user/Sartor-claude-network/.claude/.task-completion-log 2>/dev/null || echo "0")
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh Bash "npm test" > /dev/null 2>&1
temp_log_lines_after=$(wc -l < /home/user/Sartor-claude-network/.claude/.task-completion-log 2>/dev/null || echo "0")

if [[ $temp_log_lines_after -gt $temp_log_lines_before ]]; then
    echo -e "$PASS record-completion.sh creates log entries"
    ((checks_passed++))
else
    echo -e "$WARN record-completion.sh did not create new log entry (may be expected for some commands)"
    ((checks_warned++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Validation Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "  Checks Passed:  $checks_passed"
echo -e "  Checks Failed:  $checks_failed"
echo -e "  Warnings:       $checks_warned"
echo ""

if [[ $checks_failed -eq 0 ]]; then
    echo -e "$PASS Installation is valid and ready for use!"
    echo ""
    echo "  Next steps:"
    echo "    1. Start a new Claude Code session"
    echo "    2. Hooks will automatically inject roadmap context"
    echo "    3. Task completions will be logged automatically"
    echo "    4. View logs: cat .claude/.task-completion-log"
    echo ""
    echo "  Documentation:"
    echo "    • .claude/hooks/ROADMAP_HOOKS_README.md"
    echo "    • .claude/hooks/INSTALLATION_SUMMARY.md"
    echo ""
    echo "  Demo:"
    echo "    • Run: .claude/hooks/test-hooks-demo.sh"
    echo ""
    exit 0
else
    echo -e "$FAIL Installation has issues that need to be addressed"
    echo ""
    echo "  Review failed checks above and apply suggested fixes."
    echo ""
    exit 1
fi
