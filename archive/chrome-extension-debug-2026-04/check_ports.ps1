Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -lt 10000 -and $_.LocalPort -gt 3000 } | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort | Format-Table -AutoSize
