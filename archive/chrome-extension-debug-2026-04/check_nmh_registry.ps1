# Check Native Messaging Host registry entries
Write-Host "=== HKCU NativeMessagingHosts ==="
$hkcuPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts"
if (Test-Path $hkcuPath) {
    Get-ChildItem $hkcuPath | ForEach-Object {
        $name = $_.PSChildName
        $val = (Get-ItemProperty $_.PSPath).'(default)'
        Write-Host "  $name"
        Write-Host "    Path: $val"
        if ($val -and (Test-Path $val)) {
            Write-Host "    File EXISTS"
            $json = Get-Content $val -Raw
            Write-Host "    Content: $json"
        } else {
            Write-Host "    File MISSING!"
        }
    }
} else {
    Write-Host "  Registry key NOT FOUND!"
}

Write-Host ""
Write-Host "=== HKLM NativeMessagingHosts ==="
$hklmPath = "HKLM:\Software\Google\Chrome\NativeMessagingHosts"
if (Test-Path $hklmPath) {
    Get-ChildItem $hklmPath | ForEach-Object {
        $name = $_.PSChildName
        $val = (Get-ItemProperty $_.PSPath).'(default)'
        Write-Host "  $name"
        Write-Host "    Path: $val"
        if ($val -and (Test-Path $val)) {
            Write-Host "    File EXISTS"
        } else {
            Write-Host "    File MISSING!"
        }
    }
} else {
    Write-Host "  Registry key NOT FOUND!"
}

# Also check the AppData location (where Claude Code puts it)
Write-Host ""
Write-Host "=== AppData NativeMessagingHosts ==="
$appDataPath = "C:\Users\alto8\AppData\Roaming\Claude Code\ChromeNativeHost"
if (Test-Path $appDataPath) {
    Get-ChildItem $appDataPath | ForEach-Object {
        Write-Host "  $($_.Name)"
        Write-Host "    Content: $(Get-Content $_.FullName -Raw)"
    }
} else {
    Write-Host "  Directory NOT FOUND"
}

# Check if the bat file it points to exists
Write-Host ""
Write-Host "=== Bat file check ==="
$bat = "C:\Users\alto8\.claude\chrome\chrome-native-host.bat"
if (Test-Path $bat) {
    Write-Host "  EXISTS: $bat"
    Write-Host "  Content: $(Get-Content $bat -Raw)"
} else {
    Write-Host "  MISSING: $bat"
}
