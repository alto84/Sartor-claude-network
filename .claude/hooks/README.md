# Claude Code Hooks Documentation

This directory contains hook scripts that enforce Evidence-Based Validation principles during Claude Code sessions.

## Overview

The hooks system integrates with Claude Code's tool lifecycle to:
- **Validate** TypeScript compilation after edits
- **Detect** anti-patterns in generated code (fabricated metrics, vague language, missing error handling)
- **Block** dangerous bash operations before execution
- **Enforce** the five core principles from UPLIFTED_SKILLS.md

## Core Principles Enforced

1. **No Metric Fabrication** - All numbers require measurement methodology
2. **Measurement Over Opinion** - Claims need data, not superlatives
3. **Uncertainty Acknowledgment** - "I don't know" is better than fabricating
4. **Skepticism as Default** - Assume unproven until demonstrated
5. **Language Precision** - Specific observations replace vague excellence

## Files

### `/home/user/Sartor-claude-network/.claude/settings.json`

The main configuration file that defines when hooks run:

```json
{
  "hooks": {
    "postToolUse": {
      "Edit": { "script": "quality-check.sh", "blocking": false },
      "Write": { "script": "quality-check.sh", "blocking": false }
    },
    "preToolUse": {
      "Bash": { "script": "safety-check.sh", "blocking": true }
    }
  }
}
```

**Hook Triggers:**
- `postToolUse.Edit` - Runs after Claude edits a file
- `postToolUse.Write` - Runs after Claude writes a new file
- `preToolUse.Bash` - Runs BEFORE executing bash commands

### `/home/user/Sartor-claude-network/.claude/hooks/quality-check.sh`

**Purpose:** Validates code quality and evidence-based practices after file modifications.

**Exit Codes:**
- `0` - Success (all checks passed)
- `1` - Warnings (should review, but not blocking)
- `2` - Errors (blocking issues found)

**Checks Performed:**

1. **TypeScript Compilation** (for .ts/.tsx files)
   - Runs `tsc --noEmit` to check types
   - Reports compilation errors

2. **Fabricated Metrics Detection**
   - Percentages without evidence keywords (measured, benchmark, output, etc.)
   - Suspiciously round numbers (100%, 0%, exactly X)
   - Quality scores without rubric definitions
   - Performance claims without baseline measurements

3. **Vague Language Detection**
   - "should work", "probably", "might work", "seems to", "appears to"
   - Superlatives: "best", "optimal", "perfect", "excellent"
   - Suggests: Replace with specific observations or admit uncertainty

4. **Missing Error Handling** (for code files)
   - async functions without try-catch blocks
   - Promise.then() without .catch() handlers
   - Suggests: Add error handling for async operations

5. **Completion Status Precision**
   - Claims of "complete", "done", "production-ready"
   - Checks for enumeration of incomplete items
   - Suggests: List what IS and IS NOT complete

**Example Output:**

```
[INFO] Checking: /home/user/Sartor-claude-network/services/firebase.ts
[INFO] Running TypeScript type check...
[OK] TypeScript compilation passed
[INFO] Checking for fabricated metrics...
[WARN] Line 42: Percentage claim without evidence: 95% coverage
  Suggestion: Add measurement methodology (tool used, timestamp, exact output)
[INFO] Checking for vague language...
[WARN] Vague language found: 'should work'
  Line 108: This should work in production
  Suggestion: Replace with 'tested to work' or 'not yet tested' or 'unknown'
[INFO] Checking for error handling patterns...
[OK] Quality check passed: 2 warnings
================================================
```

### `/home/user/Sartor-claude-network/.claude/hooks/safety-check.sh`

**Purpose:** Blocks dangerous bash operations BEFORE execution.

**Exit Codes:**
- `0` - Safe to proceed
- `1` - Blocked (dangerous operation detected)

**Protections:**

1. **Git Safety**
   - Blocks force push to main/master
   - Blocks destructive operations: `git reset --hard`, `git clean -fd`, `git branch -D`
   - Prevents accidental data loss

2. **Filesystem Safety**
   - Blocks recursive deletion of protected directories (.git, node_modules, .claude, /, /home, /usr)
   - Blocks wildcard deletions: `rm -rf *`
   - Blocks system file modifications

3. **Security Patterns**
   - Blocks pipe-to-shell: `curl ... | bash`
   - Blocks environment variable exfiltration
   - Warns on Firebase deletion operations
   - Warns on global npm/yarn installs

**Example Blocked:**

```
[BLOCKED] Force push to main/master is not allowed
  Command: git push --force origin main
  Use a feature branch or get explicit approval
```

**Example Warning:**

```
[CAUTION] Firebase deletion operation detected
  Command: firebase database:remove /users
  Ensure you have backups before proceeding
```

## Customization

### Adjusting Enforcement Level

Edit `/home/user/Sartor-claude-network/.claude/settings.json`:

```json
{
  "enforcementLevel": "warn",  // Options: "warn" | "error" | "off"
  "hooks": {
    "postToolUse": {
      "Edit": {
        "blocking": false  // Set to true to block commits on warnings
      }
    }
  }
}
```

### Adding Custom Checks

To add custom validation patterns to `quality-check.sh`:

1. **Add Pattern Detection:**

```bash
# Check for custom anti-pattern
if grep -niE 'your-pattern-here' "$FILE_PATH" > /dev/null 2>&1; then
    log_warning "Custom anti-pattern found"
    log_info "  Suggestion: How to fix it"
fi
```

2. **Add Blocking Check:**

```bash
if grep -nE 'blocking-pattern' "$FILE_PATH" > /dev/null 2>&1; then
    log_error "Blocking issue found"
    # This will cause exit 2 at the end
fi
```

### Disabling Specific Hooks

To temporarily disable a hook:

```json
{
  "hooks": {
    "postToolUse": {
      "Edit": {
        "enabled": false  // Disable this hook
      }
    }
  }
}
```

### Adjusting Protected Directories

Edit `safety-check.sh` to add/remove protected paths:

```bash
PROTECTED_DIRS=(
    "/home/user/Sartor-claude-network/.git"
    "/your/custom/path"  # Add your protected directory
)
```

## Debugging

### Testing Hooks Manually

**Test quality-check.sh:**

```bash
cd /home/user/Sartor-claude-network
./.claude/hooks/quality-check.sh /path/to/file.ts
echo $?  # Check exit code: 0=success, 1=warnings, 2=errors
```

**Test safety-check.sh:**

```bash
./.claude/hooks/safety-check.sh "git push --force origin main"
echo $?  # Check exit code: 0=safe, 1=blocked
```

### Viewing Hook Output

Hook output goes to stderr (visible in Claude Code console):

```bash
# Run with verbose output
bash -x ./.claude/hooks/quality-check.sh file.ts 2>&1 | less
```

### Common Issues

**Issue: Hook not running**
- Check that hook script has execute permissions: `chmod +x .claude/hooks/*.sh`
- Verify `settings.json` has correct paths (must be absolute)
- Check `enabled: true` in settings.json

**Issue: TypeScript check fails**
- Ensure `tsc` is in PATH: `which tsc`
- Check that `tsconfig.json` exists in project root
- Try manual compilation: `tsc --noEmit yourfile.ts`

**Issue: False positives**
- Adjust pattern matching in quality-check.sh
- Add exceptions for specific cases
- Change `blocking: false` to get warnings instead of errors

### Logging

To add debug logging to hooks:

```bash
# Add to top of script
DEBUG=true

# Use throughout script
[[ "$DEBUG" == "true" ]] && echo "Debug: checking $FILE_PATH" >&2
```

## Integration with Existing Hooks

This project also has pre-commit hooks in `/home/user/Sartor-claude-network/.claude/hooks/pre-commit`.

**Relationship:**
- **Claude Code hooks** (quality-check.sh) - Run during AI sessions when Claude edits files
- **Git pre-commit hooks** (pre-commit) - Run when YOU commit changes via git

Both enforce the same principles but at different times:
- Claude Code hooks: Real-time validation during AI edits
- Git hooks: Final validation before commits

### Running Pre-Commit Validators Directly

The TypeScript validators can be used independently:

```bash
cd /home/user/Sartor-claude-network/.claude/hooks

# Run specific validator
ts-node validators/metrics-validator.ts yourfile.ts

# Run full pre-commit check
./pre-commit
```

## Best Practices

### For Users

1. **Review warnings** - They indicate areas to improve, even if not blocking
2. **Update methodology** - Add measurement details near metrics
3. **Be explicit** - Replace "should work" with "tested on 2025-12-06 with input X"
4. **Enumerate completion** - List what's done AND what's not done

### For Hook Developers

1. **Test patterns carefully** - Avoid false positives that annoy users
2. **Provide actionable suggestions** - Every warning should suggest how to fix
3. **Use context windows** - Check surrounding lines for evidence keywords
4. **Exit codes matter** - 0=success, 1=warnings, 2=blocking errors
5. **Log to stderr** - stdout might interfere with tool output

## Examples

### Good: Evidence-Based Metric

```typescript
// TypeScript compilation check on 2025-12-06 at 14:32
// Tool: tsc --noEmit
// Result: No errors found
// Coverage: 87% line coverage (measured with jest --coverage)
const coverage = 0.87;
```

**Why it passes:**
- Includes timestamp
- Specifies tool used
- Shows exact command
- Precise number (87%, not "about 90%")

### Bad: Fabricated Metric

```typescript
// This has excellent test coverage (probably around 95%)
const coverage = 0.95;
```

**Why it fails:**
- No timestamp
- No tool specified
- Hedging language ("probably")
- Suspiciously round number (95%)

### Good: Honest Uncertainty

```typescript
/**
 * Database connection handling
 *
 * Status:
 * - ✅ Implemented: Basic connection pool
 * - ✅ Tested: Unit tests pass
 * - ❌ Not tested: Connection under high load
 * - ❌ Not tested: Reconnection after network failure
 * - ⚠️  Unknown: Performance with 1000+ concurrent connections
 */
```

**Why it passes:**
- Enumerates what IS complete
- Enumerates what IS NOT complete
- Admits unknowns explicitly
- No vague claims

### Bad: Completion Claim

```typescript
/**
 * Database connection - DONE
 * Production ready
 */
```

**Why it fails:**
- Claims "done" without enumeration
- Claims "production ready" without validation
- No listing of untested scenarios

## Version History

- **v1.0.0** (2025-12-06) - Initial release
  - TypeScript compilation checks
  - Evidence-based validation
  - Bash safety checks
  - Integration with UPLIFTED_SKILLS.md principles

## See Also

- `/home/user/Sartor-claude-network/UPLIFTED_SKILLS.md` - Core principles
- `/home/user/Sartor-claude-network/.claude/hooks/pre-commit` - Git pre-commit hook
- `/home/user/Sartor-claude-network/.claude/hooks/validators/` - TypeScript validators

## Support

For issues or improvements:
1. Check this README for debugging steps
2. Review hook output for specific errors
3. Test hooks manually to isolate issues
4. Adjust patterns in hook scripts as needed

Remember: **Hooks are guardrails, not gates**. They help maintain quality but shouldn't block legitimate work. Adjust sensitivity as needed for your workflow.
