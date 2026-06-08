<#
fetch-login.ps1 — resolve a Bitwarden item NAME to a SecureString. Never returns,
prints, or logs the plaintext. Called only by gate.ps1's credential-entry path.

Returns: a [SecureString] on success; $null on locked/not-found/error (caller asks Alton).
The value lives in memory only long enough to build the SecureString, then is dropped.

Usage:  $ss = & fetch-login.ps1 -Name 'vastai-login' [-Field password|username|totp]
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Name,
  [ValidateSet('password','username','totp')][string]$Field='password'
)

$wrapper = 'C:\Users\alto8\Sartor-claude-network\scripts\sartor-secret.cmd'
if (-not (Test-Path $wrapper)) { Write-Error 'sartor-secret wrapper not found'; return $null }

# Capture stdout only; the wrapper writes the value to stdout with no trailing newline.
$raw = & $wrapper read $Name --field $Field 2>$null
$code = $LASTEXITCODE
if ($code -ne 0 -or [string]::IsNullOrEmpty($raw)) {
  # exit 2 = vault locked, 3 = not found/ambiguous, 4 = unauth, 5 = error.
  # Never retry blindly, never guess. Surface to caller as $null.
  $raw = $null
  Write-Verbose "fetch-login: '$Name' field '$Field' unavailable (wrapper exit $code)"
  return $null
}

$ss = ConvertTo-SecureString -String $raw -AsPlainText -Force
$raw = $null
[System.GC]::Collect()
return $ss
