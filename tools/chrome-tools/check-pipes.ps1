# Check for named pipes related to Claude
$pipes = [System.IO.Directory]::GetFiles("\\.\pipe\") | Where-Object { $_ -match "claude|anthropic|mcp|chrome" }
if ($pipes) {
    foreach ($p in $pipes) {
        Write-Output "Found pipe: $p"
    }
} else {
    Write-Output "No claude/mcp/chrome named pipes found"
}

# Also check TCP ports that might be used
$listeners = netstat -ano | Select-String "LISTENING" | Select-String "node"
if ($listeners) {
    foreach ($l in $listeners) { Write-Output $l.Line.Trim() }
}
