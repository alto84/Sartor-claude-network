$b64 = Get-Content -Path "C:\Users\alto8\ss-b64.txt" -Raw
$bytes = [Convert]::FromBase64String($b64.Trim())
[IO.File]::WriteAllBytes("C:\Users\alto8\sysmonitor-screenshot.jpg", $bytes)
Write-Output "Saved: $($bytes.Length) bytes"
