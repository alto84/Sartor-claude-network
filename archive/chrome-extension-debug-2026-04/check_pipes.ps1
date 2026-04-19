[System.IO.Directory]::GetFiles("\\.\pipe\") | Where-Object { $_ -match "claude|anthropic" } | ForEach-Object { Write-Host $_ }
