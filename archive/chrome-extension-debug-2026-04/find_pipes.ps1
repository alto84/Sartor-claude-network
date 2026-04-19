# List ALL named pipes related to claude
Write-Host "=== All claude-related pipes ==="
$pipes = Get-ChildItem "\\.\pipe\" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*claude*" -or $_.Name -like "*mcp*" -or $_.Name -like "*browser*" -or $_.Name -like "*anthropic*" }
foreach ($p in $pipes) {
    Write-Host "  $($p.Name)"
}

# Also check for pipes with different username
Write-Host ""
Write-Host "=== All bridge pipes ==="
$bridges = Get-ChildItem "\\.\pipe\" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*bridge*" }
foreach ($p in $bridges) {
    Write-Host "  $($p.Name)"
}

# Check current username
Write-Host ""
Write-Host "whoami: $(whoami)"
Write-Host "USERNAME: $env:USERNAME"
Write-Host "USERPROFILE: $env:USERPROFILE"

# Check what the source code generates as pipe name
# The pipe name format is "claude-mcp-browser-bridge-<username>"
# Let's check with the os.userInfo() equivalent
$user = [System.Environment]::UserName
Write-Host "System.Environment.UserName: $user"

# Also check what Node.js os.userInfo() would return
Write-Host ""
Write-Host "=== Node.js username check ==="
$nodeCmd = 'console.log(require("os").userInfo().username)'
& "C:\Program Files\nodejs\node.exe" -e $nodeCmd
