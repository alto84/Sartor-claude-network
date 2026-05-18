# Sartor UniFi controller control script.
#
# Wraps the bundled-JRE invocation that lib/ace.jar uses so the controller
# can be started, stopped, restarted, or status-checked from one command
# instead of remembering the seven-line `java --add-opens ...` incantation.
#
# Verbs:
#   start    Launch the controller in the background. Idempotent: returns 0
#            if already up. Waits up to 120s for the API to respond.
#   stop     Graceful stop via `ace.jar stop` (IPC; no UAC needed). Idempotent.
#   restart  stop, wait, start. Used after firmware.json patches or upgrades.
#   status   Print whether the API responds + java PID + uptime. Exit 0 if
#            healthy, 2 if API down, 3 if process running but API not yet up.
#   logs     Tail the last 50 lines of server.log. Read-only.
#
# Intentional design notes:
#   - No NSSM, no Windows service registration. The controller install at
#     C:\Users\alto8\Ubiquiti UniFi is a "user install" (no service
#     scaffolding). NSSM would require an admin install pivot. Scheduled
#     task at boot trigger is the lighter substitute.
#   - Uses the BUNDLED JRE at .\jre\bin\java.exe. System Java is NOT on
#     PATH on Rocinante (start.bat fails for this reason); the bundled JRE
#     is what Ubiquiti tests against.
#   - Waits for the API not just the process. The JVM starts in seconds but
#     Spring boot + Mongo init takes 15-30s before HTTPS responds 200.
#   - Stays on host. No remote operation. Operating on the controller from
#     a different machine requires SSH, which Rocinante doesn't expose for
#     this kind of administrative action.

param(
  [Parameter(Position = 0)]
  [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
  [string]$Verb = 'status'
)

$ErrorActionPreference = 'Stop'

$UniFiHome    = 'C:\Users\alto8\Ubiquiti UniFi'
$JavaExe      = Join-Path $UniFiHome 'jre\bin\java.exe'
$AceJar       = Join-Path $UniFiHome 'lib\ace.jar'
$ServerLog    = Join-Path $UniFiHome 'logs\server.log'
$ApiProbeUrl  = 'https://192.168.1.171:8443/status'   # designated health endpoint; 200 OK when controller is up
$ProbeTimeout = 5
$StartTimeout = 120

$JvmArgs = @(
  '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
  '--add-opens', 'java.base/java.time=ALL-UNNAMED',
  '--add-opens', 'java.base/sun.security.util=ALL-UNNAMED',
  '--add-opens', 'java.base/java.io=ALL-UNNAMED',
  '--add-opens', 'java.rmi/sun.rmi.transport=ALL-UNNAMED'
)

function Test-Api {
  # PowerShell 5.1's Invoke-WebRequest + UniFi's TLS does not negotiate
  # cleanly (errors with "underlying connection was closed"); curl.exe
  # works fine. Shelling out is the path of least resistance.
  try {
    $code = & curl.exe -k -s -o NUL -w '%{http_code}' --max-time $ProbeTimeout $ApiProbeUrl 2>$null
    if ($LASTEXITCODE -ne 0) { return $false }
    $codeInt = [int]$code
    return $codeInt -ge 200 -and $codeInt -lt 500
  } catch {
    return $false
  }
}

function Get-UniFiJvm {
  # Return the java.exe PID that's running ace.jar. Returns $null if none.
  $proc = Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*ace.jar*" } |
    Select-Object -First 1
  return $proc
}

function Invoke-Start {
  if (Test-Api) {
    Write-Host "UniFi already up; API responding at $ApiProbeUrl"
    return 0
  }
  $existing = Get-UniFiJvm
  if ($existing) {
    Write-Host "JVM running (PID $($existing.ProcessId)) but API not yet up; waiting..."
  } else {
    Write-Host "Starting UniFi via bundled JRE..."
    $allArgs = $JvmArgs + @('-Xmx1024M', '-jar', 'lib\ace.jar', 'start')
    Start-Process -FilePath $JavaExe -ArgumentList $allArgs `
                  -WorkingDirectory $UniFiHome -WindowStyle Hidden `
                  -PassThru | Out-Null
  }
  # Poll for API up
  $elapsed = 0
  $interval = 3
  while ($elapsed -lt $StartTimeout) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    if (Test-Api) {
      Write-Host "UniFi API up after ${elapsed}s"
      return 0
    }
  }
  Write-Error "UniFi API did NOT respond within ${StartTimeout}s. Check $ServerLog"
  return 4
}

function Invoke-Stop {
  if (-not (Test-Api) -and -not (Get-UniFiJvm)) {
    Write-Host "UniFi already stopped (no JVM, API not responding)."
    return 0
  }
  Write-Host "Stopping UniFi (IPC via ace.jar stop)..."
  $allArgs = $JvmArgs + @('-jar', 'lib\ace.jar', 'stop')
  & $JavaExe @allArgs
  # Wait up to 30s for the JVM to clear out
  $elapsed = 0
  while ((Get-UniFiJvm) -and $elapsed -lt 30) {
    Start-Sleep -Seconds 2
    $elapsed += 2
  }
  if (Get-UniFiJvm) {
    Write-Warning "JVM still running after 30s. Manual intervention may be needed."
    return 5
  }
  Write-Host "UniFi stopped."
  return 0
}

function Invoke-Restart {
  $rc = Invoke-Stop
  if ($rc -ne 0) { return $rc }
  return Invoke-Start
}

function Invoke-Status {
  $jvm = Get-UniFiJvm
  $apiUp = Test-Api
  if ($apiUp) {
    $pidLine = if ($jvm) { "PID $($jvm.ProcessId) since $($jvm.CreationDate)" } else { "PID unknown" }
    Write-Host "UniFi: UP   API responding   $pidLine"
    return 0
  }
  if ($jvm) {
    Write-Host "UniFi: STARTING   JVM PID $($jvm.ProcessId) but API not yet responding"
    return 3
  }
  Write-Host "UniFi: DOWN   no JVM, API not responding"
  return 2
}

function Invoke-Logs {
  if (-not (Test-Path $ServerLog)) {
    Write-Host "No server log found at $ServerLog"
    return 1
  }
  Get-Content -Path $ServerLog -Tail 50
  return 0
}

switch ($Verb) {
  'start'   { exit (Invoke-Start) }
  'stop'    { exit (Invoke-Stop) }
  'restart' { exit (Invoke-Restart) }
  'status'  { exit (Invoke-Status) }
  'logs'    { exit (Invoke-Logs) }
}
