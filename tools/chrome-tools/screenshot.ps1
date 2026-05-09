param(
    [string]$Monitor = "all",
    [string]$Output = ""
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$monitors = @(
    @{ Name = "0"; X = 0;     Y = 0;   Width = 2560; Height = 1440 },
    @{ Name = "1"; X = 2560;  Y = 159; Width = 1920; Height = 1080 },
    @{ Name = "2"; X = -1920; Y = 143; Width = 1920; Height = 1080 }
)

function Capture-Monitor {
    param(
        [hashtable]$Mon,
        [string]$OutPath
    )
    try {
        $bmp = New-Object System.Drawing.Bitmap($Mon.Width, $Mon.Height)
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.CopyFromScreen($Mon.X, $Mon.Y, 0, 0, (New-Object System.Drawing.Size($Mon.Width, $Mon.Height)))
        $gfx.Dispose()
        $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        Write-Output "Captured monitor $($Mon.Name) -> $OutPath"
        return $OutPath
    }
    catch {
        Write-Error "Failed to capture monitor $($Mon.Name): $_"
        return $null
    }
}

$savedFiles = @()

if ($Monitor -eq "all") {
    foreach ($mon in $monitors) {
        if ($Output -ne "") {
            $outPath = $Output -replace '\.png$', "_$($mon.Name).png"
        }
        else {
            $outPath = "C:\Users\alto8\chrome-tools\screen_$($mon.Name).png"
        }
        $result = Capture-Monitor -Mon $mon -OutPath $outPath
        if ($result) { $savedFiles += $result }
    }
}
else {
    $monIndex = [int]$Monitor
    if ($monIndex -lt 0 -or $monIndex -ge $monitors.Count) {
        Write-Error "Invalid monitor index: $Monitor. Use 0, 1, 2, or 'all'."
        exit 1
    }
    $mon = $monitors[$monIndex]
    if ($Output -ne "") {
        $outPath = $Output
    }
    else {
        $outPath = "C:\Users\alto8\chrome-tools\screen_$($mon.Name).png"
    }
    $result = Capture-Monitor -Mon $mon -OutPath $outPath
    if ($result) { $savedFiles += $result }
}

Write-Output ""
Write-Output "Screenshot complete. Files saved:"
foreach ($f in $savedFiles) {
    Write-Output "  $f"
}
