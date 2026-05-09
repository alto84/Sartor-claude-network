# Check what MCP client processes exist and what they're doing
Write-Host "=== Node.js processes ==="
$nodeProcs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" }
foreach ($p in $nodeProcs) {
    $cmdShort = $p.CommandLine
    if ($cmdShort -and $cmdShort.Length -gt 200) { $cmdShort = $cmdShort.Substring(0, 200) + "..." }
    Write-Host "  PID=$($p.ProcessId) Created=$($p.CreationDate)"
    Write-Host "    $cmdShort"
    Write-Host ""
}

Write-Host "=== Pipe connections ==="
# Check who's connected to the pipe
$pipeHandles = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -like "*chrome-native-host*" -or
    $_.CommandLine -like "*mcp*" -or
    $_.CommandLine -like "*claude*"
} | Select-Object ProcessId, Name, CreationDate, @{N='Cmd';E={
    $c = $_.CommandLine
    if ($c -and $c.Length -gt 150) { $c.Substring(0,150) + "..." } else { $c }
}}
$pipeHandles | Format-Table -AutoSize

Write-Host "=== MCP config ==="
# Check Claude Code MCP configuration
$mcpConfigPaths = @(
    "C:\Users\alto8\.claude\mcp.json",
    "C:\Users\alto8\.claude\settings.json",
    "C:\Users\alto8\AppData\Roaming\Claude\claude_desktop_config.json"
)
foreach ($path in $mcpConfigPaths) {
    if (Test-Path $path) {
        Write-Host "  Found: $path"
        $content = Get-Content $path -Raw
        if ($content.Length -gt 2000) { $content = $content.Substring(0, 2000) + "..." }
        Write-Host $content
        Write-Host ""
    }
}
