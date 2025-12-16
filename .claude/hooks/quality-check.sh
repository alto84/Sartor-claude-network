#!/bin/bash
#
# Quality Check Hook for Claude Code
# Validates TypeScript compilation and evidence-based principles
#
# Exit codes:
#   0 - Success (all checks passed)
#   1 - Warnings (should review, but not blocking)
#   2 - Errors (blocking issues found)
#
# Usage: quality-check.sh <file_path>

set -u  # Error on undefined variables

FILE_PATH="${1:-}"
WARNINGS=0
ERRORS=0
PROJECT_ROOT="/home/user/Sartor-claude-network"

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    ((ERRORS++))
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1" >&2
}

# Validate input
if [[ -z "$FILE_PATH" ]]; then
    log_error "No file path provided"
    exit 2
fi

if [[ ! -f "$FILE_PATH" ]]; then
    log_error "File not found: $FILE_PATH"
    exit 2
fi

log_info "Checking: $FILE_PATH"

# Get file extension
FILE_EXT="${FILE_PATH##*.}"

# ============================================================================
# 1. TypeScript Compilation Check
# ============================================================================
if [[ "$FILE_EXT" == "ts" || "$FILE_EXT" == "tsx" ]]; then
    log_info "Running TypeScript type check..."

    # Check if tsconfig.json exists
    if [[ -f "$PROJECT_ROOT/tsconfig.json" ]]; then
        # Use tsc --noEmit to check without generating files
        if ! tsc --noEmit "$FILE_PATH" 2>&1 | grep -q "error TS"; then
            log_success "TypeScript compilation passed"
        else
            log_error "TypeScript compilation failed"
            tsc --noEmit "$FILE_PATH" 2>&1 | grep "error TS" >&2
        fi
    else
        log_warning "No tsconfig.json found, skipping TS compilation check"
    fi
fi

# ============================================================================
# 2. Anti-Pattern Detection: Fabricated Metrics
# ============================================================================
log_info "Checking for fabricated metrics..."

# Check for percentages without evidence keywords nearby
if grep -nE '\b[0-9]+%\s+(coverage|complete|done|tested|accuracy)' "$FILE_PATH" > /dev/null 2>&1; then
    while IFS=: read -r line_num match; do
        # Extract context (5 lines before and after)
        context=$(sed -n "$((line_num-5)),$((line_num+5))p" "$FILE_PATH" 2>/dev/null)

        # Check for evidence keywords in context
        if ! echo "$context" | grep -qiE '(measured|benchmark|output|result|timestamp|tool:|command:|tested on|verified)'; then
            log_warning "Line $line_num: Percentage claim without evidence: $(echo "$match" | xargs)"
            log_info "  Suggestion: Add measurement methodology (tool used, timestamp, exact output)"
        fi
    done < <(grep -nE '\b[0-9]+%\s+(coverage|complete|done|tested|accuracy)' "$FILE_PATH")
fi

# Check for suspiciously round percentages
if grep -nE '\b(100%|0%|exactly [0-9]+)' "$FILE_PATH" > /dev/null 2>&1; then
    log_warning "Suspiciously round numbers found - verify these are measured, not estimated:"
    grep -nE '\b(100%|0%|exactly [0-9]+)' "$FILE_PATH" | while IFS=: read -r line_num match; do
        echo "  Line $line_num: $(echo "$match" | xargs)" >&2
    done
fi

# Check for quality scores without rubrics
if grep -niE 'score:?\s*[0-9]+(/[0-9]+)?' "$FILE_PATH" > /dev/null 2>&1; then
    while IFS=: read -r line_num match; do
        # Look for rubric/methodology nearby
        context=$(sed -n "$((line_num-5)),$((line_num+5))p" "$FILE_PATH" 2>/dev/null)

        if ! echo "$context" | grep -qiE '(rubric|methodology|criteria|calculated|measured)'; then
            log_warning "Line $line_num: Score without rubric: $(echo "$match" | xargs)"
            log_info "  Suggestion: Define scoring rubric and calculation methodology"
        fi
    done < <(grep -niE 'score:?\s*[0-9]+(/[0-9]+)?' "$FILE_PATH")
fi

# ============================================================================
# 3. Anti-Pattern Detection: Vague Language
# ============================================================================
log_info "Checking for vague language..."

# Hedging language that indicates uncertainty without admitting it
VAGUE_PATTERNS=(
    "should work"
    "probably"
    "might work"
    "seems to"
    "appears to"
    "likely works"
)

for pattern in "${VAGUE_PATTERNS[@]}"; do
    if grep -niF "$pattern" "$FILE_PATH" > /dev/null 2>&1; then
        log_warning "Vague language found: '$pattern'"
        grep -niF "$pattern" "$FILE_PATH" | while IFS=: read -r line_num match; do
            echo "  Line $line_num: $(echo "$match" | xargs)" >&2
        done
        log_info "  Suggestion: Replace with 'tested to work' or 'not yet tested' or 'unknown'"
    fi
done

# Superlatives without comparative data
SUPERLATIVES=(
    "best"
    "optimal"
    "perfect"
    "excellent"
    "superior"
)

for superlative in "${SUPERLATIVES[@]}"; do
    if grep -niw "$superlative" "$FILE_PATH" > /dev/null 2>&1; then
        log_warning "Superlative without comparative data: '$superlative'"
        grep -niw "$superlative" "$FILE_PATH" | while IFS=: read -r line_num match; do
            echo "  Line $line_num: $(echo "$match" | xargs)" >&2
        done
        log_info "  Suggestion: Replace with specific observations or measurements"
    fi
done

# ============================================================================
# 4. Anti-Pattern Detection: Missing Error Handling
# ============================================================================
if [[ "$FILE_EXT" == "ts" || "$FILE_EXT" == "tsx" || "$FILE_EXT" == "js" || "$FILE_EXT" == "jsx" ]]; then
    log_info "Checking for error handling patterns..."

    # Check for async functions without try-catch
    if grep -nE 'async\s+(function|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()' "$FILE_PATH" > /dev/null 2>&1; then
        async_count=$(grep -cE 'async\s+(function|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()' "$FILE_PATH")
        try_catch_count=$(grep -cE '\btry\s*\{' "$FILE_PATH")

        if [[ $async_count -gt 0 && $try_catch_count -eq 0 ]]; then
            log_warning "File has $async_count async function(s) but no try-catch blocks"
            log_info "  Suggestion: Add error handling for async operations"
        fi
    fi

    # Check for Promise usage without .catch() or try-catch
    if grep -nE '\.then\(' "$FILE_PATH" > /dev/null 2>&1; then
        while IFS=: read -r line_num match; do
            # Check if same line or next few lines have .catch()
            context=$(sed -n "$line_num,$((line_num+3))p" "$FILE_PATH" 2>/dev/null)
            if ! echo "$context" | grep -qE '\.catch\('; then
                log_warning "Line $line_num: Promise.then() without .catch()"
                log_info "  Suggestion: Add .catch() handler for error cases"
            fi
        done < <(grep -nE '\.then\(' "$FILE_PATH")
    fi
fi

# ============================================================================
# 5. Anti-Pattern Detection: Completion Claims
# ============================================================================
log_info "Checking completion status precision..."

# Check for completion claims
COMPLETION_WORDS=(
    "complete"
    "finished"
    "done"
    "production-ready"
    "production ready"
)

for word in "${COMPLETION_WORDS[@]}"; do
    if grep -niF "$word" "$FILE_PATH" > /dev/null 2>&1; then
        # Look for enumeration of what's complete vs what's not
        file_content=$(cat "$FILE_PATH")
        if ! echo "$file_content" | grep -qiE '(not (yet |)complete|incomplete|untested|not validated|not integrated)'; then
            log_warning "Completion claim found without enumeration of incomplete items"
            grep -niF "$word" "$FILE_PATH" | head -3 | while IFS=: read -r line_num match; do
                echo "  Line $line_num: $(echo "$match" | xargs)" >&2
            done
            log_info "  Suggestion: Enumerate what IS complete and what IS NOT complete"
        fi
    fi
done

# ============================================================================
# Summary
# ============================================================================
echo "" >&2
echo "================================================" >&2
if [[ $ERRORS -gt 0 ]]; then
    log_error "Quality check failed: $ERRORS error(s), $WARNINGS warning(s)"
    echo "================================================" >&2
    exit 2
elif [[ $WARNINGS -gt 0 ]]; then
    log_warning "Quality check passed with warnings: $WARNINGS warning(s)"
    log_info "Review the warnings above to improve code quality"
    echo "================================================" >&2
    exit 1
else
    log_success "Quality check passed: No issues found"
    echo "================================================" >&2
    exit 0
fi
