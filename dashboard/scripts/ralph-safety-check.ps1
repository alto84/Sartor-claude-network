# Ralph Safety Check Hook
# Prevents dangerous operations during iteration loop
# Exit codes: 0 = allow, 1 = block

param(
    [string]$Command
)

$dangerousPatterns = @(
    "rm -rf /",
    "rm -rf ~",
    "rm -rf \*",
    "format ",
    "deltree",
    "del /f /s /q C:",
    "Remove-Item -Recurse -Force C:",
    "git push --force",
    "git reset --hard HEAD~",
    "DROP TABLE",
    "DROP DATABASE",
    "npm publish",
    "yarn publish"
)

foreach ($pattern in $dangerousPatterns) {
    if ($Command -like "*$pattern*") {
        Write-Host "[RALPH SAFETY] Blocked dangerous command: $Command" -ForegroundColor Red
        Write-Host "[RALPH SAFETY] This command matches blocked pattern: $pattern" -ForegroundColor Red
        exit 1
    }
}

# Allow the command
exit 0
