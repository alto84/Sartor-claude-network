Start-Sleep -Seconds 20
$f1 = (Get-Item 'C:\Users\alto8\safety-research-system\src\api\static\index.html').Length
Start-Sleep -Seconds 5
$f2 = (Get-Item 'C:\Users\alto8\safety-research-system\src\api\static\index.html').Length
Write-Output "Size1: $f1  Size2: $f2  Stable: $($f1 -eq $f2)"
