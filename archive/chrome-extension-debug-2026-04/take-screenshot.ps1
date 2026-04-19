$pipeName = "claude-mcp-browser-bridge-alton"
$pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(5000)

$request = '{"jsonrpc":"2.0","id":1,"method":"execute_tool","params":{"tool":"computer","args":{"action":"screenshot","tabId":1930251557}}}'
$requestBytes = [System.Text.Encoding]::UTF8.GetBytes($request)
$lengthBytes = [BitConverter]::GetBytes([uint32]$requestBytes.Length)
$pipe.Write($lengthBytes, 0, 4)
$pipe.Write($requestBytes, 0, $requestBytes.Length)
$pipe.Flush()

$lenBuf = New-Object byte[] 4
$pipe.Read($lenBuf, 0, 4) | Out-Null
$respLen = [BitConverter]::ToUInt32($lenBuf, 0)
$respBuf = New-Object byte[] $respLen
$read = 0
while ($read -lt $respLen) {
    $read += $pipe.Read($respBuf, $read, $respLen - $read)
}
$pipe.Close()

$json = [System.Text.Encoding]::UTF8.GetString($respBuf)
if ($json -match '"data":"([A-Za-z0-9+/=]+)"') {
    $b64 = $Matches[1]
    $bytes = [Convert]::FromBase64String($b64)
    [IO.File]::WriteAllBytes("C:\Users\alto8\sysmonitor-screenshot.jpg", $bytes)
    Write-Output "Saved screenshot: $($bytes.Length) bytes"
} else {
    Write-Output "No base64 data found in response"
}
