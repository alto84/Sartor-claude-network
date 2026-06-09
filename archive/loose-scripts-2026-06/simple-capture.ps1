# Simple webcam capture using Windows Media Foundation
$outputPath = "C:\temp\webcam-capture.jpg"
$wslPath = "\\wsl$\Ubuntu\home\alton\vayu-learning-project\webcam-photo.jpg"

# Create temp directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "C:\temp" | Out-Null

# Use CommandCam if available, otherwise guide manual capture
$commandCamPath = "C:\Windows\System32\CommandCam.exe"

# Try using ffmpeg from Windows if available
$ffmpegPaths = @(
    "ffmpeg",
    "C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    "C:\ffmpeg\bin\ffmpeg.exe"
)

$ffmpegFound = $false
foreach ($path in $ffmpegPaths) {
    try {
        $result = & where.exe $path 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Found ffmpeg at: $path"
            # Capture single frame from webcam
            & $path -f dshow -i video="Logi Webcam C920e" -frames:v 1 -y $outputPath 2>$null
            $ffmpegFound = $true
            break
        }
    } catch {
        continue
    }
}

if (-not $ffmpegFound) {
    # Fallback: Use PowerShell to interact with Windows Camera
    Write-Host "FFmpeg not found. Opening Windows Camera app..."
    Start-Process "microsoft.windows.camera:"
    Write-Host "Please take a photo and press Enter when done..."
    Read-Host

    # Try to find the latest photo in Camera Roll
    $cameraRollPath = "$env:USERPROFILE\Pictures\Camera Roll"
    if (Test-Path $cameraRollPath) {
        $latestPhoto = Get-ChildItem $cameraRollPath -Filter "*.jpg" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestPhoto) {
            Copy-Item $latestPhoto.FullName -Destination $wslPath -Force
            Write-Host "Photo copied to WSL: $wslPath"
            exit 0
        }
    }
}

# If we captured with ffmpeg, move to WSL path
if (Test-Path $outputPath) {
    Copy-Item $outputPath -Destination $wslPath -Force
    Remove-Item $outputPath
    Write-Host "Photo captured and moved to: $wslPath"
} else {
    Write-Host "Could not capture photo automatically."
}
