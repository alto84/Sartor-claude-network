$json = powershell -ExecutionPolicy Bypass -File "C:/Users/alto8/chrome-tools/test-mcp-simple.ps1" -Tool "computer" -ArgsJson '{"action":"screenshot","tabId":1930251557}'
$match = [regex]::Match($json, '"data":"([^"]+)"')
if ($match.Success) {
    $b64 = $match.Groups[1].Value
    [IO.File]::WriteAllBytes("C:\Users\alto8\sysmonitor-screenshot.jpg", [Convert]::FromBase64String($b64))
    Write-Output "Saved screenshot"
} else {
    Write-Output "No base64 data found"
}
