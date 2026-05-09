param(
    [Parameter(Mandatory=$true)][string]$Text
)

Add-Type -AssemblyName System.Windows.Forms

if ([string]::IsNullOrEmpty($Text)) {
    Write-Error "Text parameter cannot be empty."
    exit 1
}

try {
    # SendKeys requires special escaping for certain characters: +, ^, %, ~, (, ), {, }
    # We wrap each special char in braces to send it literally
    $escaped = $Text -replace '([+^%~(){}[\]])', '{$1}'

    [System.Windows.Forms.SendKeys]::SendWait($escaped)
    Write-Output "Typed $($Text.Length) characters to foreground window."
}
catch {
    Write-Error "Failed to type text: $_"
    exit 1
}
