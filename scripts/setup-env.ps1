<#
.SYNOPSIS
    Setup script for Sartor Family Dashboard environment configuration.

.DESCRIPTION
    This script helps you set up the environment variables needed for the
    Sartor Family Dashboard. It will:
    - Check for required environment variables
    - Guide you through setting them up
    - Create .env.local from .env.example
    - Validate Firebase connection

.EXAMPLE
    .\setup-env.ps1

.EXAMPLE
    .\setup-env.ps1 -SkipFirebaseValidation

.NOTES
    Author: Sartor Family
    Version: 1.0.0
#>

param(
    [switch]$SkipFirebaseValidation,
    [switch]$Force,
    [switch]$Verbose
)

# Script configuration
$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$dashboardPath = Join-Path $rootPath "dashboard"
$envExamplePath = Join-Path $dashboardPath ".env.example"
$envLocalPath = Join-Path $dashboardPath ".env.local"
$configPath = Join-Path $dashboardPath "config"

# Colors for output
function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    Write-Host "[*] $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "[+] $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[!] $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "    $Text" -ForegroundColor Gray
}

function Write-Prompt {
    param([string]$Text)
    Write-Host ""
    Write-Host "[?] $Text" -ForegroundColor Magenta -NoNewline
    Write-Host " " -NoNewline
}

# Generate a random string
function New-RandomSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Generate a UUID-based token
function New-AuthToken {
    return "$([guid]::NewGuid().ToString())-$([guid]::NewGuid().ToString())"
}

# Check if a command exists
function Test-Command {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Read a value from .env file
function Get-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key
    )
    if (-not (Test-Path $FilePath)) {
        return $null
    }

    $content = Get-Content $FilePath -Raw
    $pattern = "(?m)^$Key=(.*)$"
    if ($content -match $pattern) {
        return $Matches[1].Trim()
    }
    return $null
}

# Set a value in .env file
function Set-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )

    if (-not (Test-Path $FilePath)) {
        # Create file with the key-value pair
        "$Key=$Value" | Out-File -FilePath $FilePath -Encoding UTF8
        return
    }

    $content = Get-Content $FilePath -Raw
    $pattern = "(?m)^$Key=.*$"

    if ($content -match $pattern) {
        # Replace existing value
        $content = $content -replace $pattern, "$Key=$Value"
    } else {
        # Add new value
        $content = $content.TrimEnd() + "`n$Key=$Value`n"
    }

    $content | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
}

# Main setup function
function Start-Setup {
    Write-Header "Sartor Family Dashboard - Environment Setup"

    Write-Host "This script will help you configure the environment variables"
    Write-Host "needed for the Sartor Family Dashboard."
    Write-Host ""
    Write-Host "Prerequisites:"
    Write-Host "  - Firebase project created"
    Write-Host "  - Firebase service account key downloaded"
    Write-Host "  - (Optional) Google OAuth credentials"
    Write-Host "  - (Optional) Resend API key for email"
    Write-Host ""

    # Check if .env.example exists
    if (-not (Test-Path $envExamplePath)) {
        Write-Error ".env.example not found at: $envExamplePath"
        Write-Info "Please ensure you're running this from the correct directory."
        exit 1
    }

    # Check if .env.local already exists
    if ((Test-Path $envLocalPath) -and -not $Force) {
        Write-Step ".env.local already exists"
        Write-Prompt "Overwrite existing .env.local? (y/N)"
        $response = Read-Host
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Keeping existing .env.local"
            Write-Info "Use -Force flag to overwrite"
            return
        }
    }

    # Copy .env.example to .env.local
    Write-Step "Creating .env.local from .env.example"
    Copy-Item -Path $envExamplePath -Destination $envLocalPath -Force
    Write-Success "Created .env.local"

    # Setup NextAuth
    Write-Header "NextAuth Configuration"
    Setup-NextAuth

    # Setup Firebase
    Write-Header "Firebase Configuration"
    Setup-Firebase

    # Setup Google OAuth (optional)
    Write-Header "Google OAuth (Optional)"
    Setup-GoogleOAuth

    # Setup MCP Gateway (optional)
    Write-Header "MCP Gateway (Optional)"
    Setup-MCPGateway

    # Validate Firebase connection
    if (-not $SkipFirebaseValidation) {
        Write-Header "Firebase Validation"
        Test-FirebaseConnection
    }

    # Summary
    Write-Header "Setup Complete"
    Write-Success "Environment configuration saved to:"
    Write-Info $envLocalPath
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review and update any remaining values in .env.local"
    Write-Host "  2. Ensure your Firebase service account key is in place"
    Write-Host "  3. Run 'npm run dev' from the dashboard directory"
    Write-Host ""
}

function Setup-NextAuth {
    Write-Step "Configuring NextAuth..."

    # Generate NEXTAUTH_SECRET if not set
    $currentSecret = Get-EnvValue -FilePath $envLocalPath -Key "NEXTAUTH_SECRET"
    if ([string]::IsNullOrWhiteSpace($currentSecret)) {
        $newSecret = New-RandomSecret -Length 32
        Set-EnvValue -FilePath $envLocalPath -Key "NEXTAUTH_SECRET" -Value $newSecret
        Write-Success "Generated new NEXTAUTH_SECRET"
    } else {
        Write-Info "NEXTAUTH_SECRET already set"
    }

    # Set NEXTAUTH_URL
    Write-Prompt "Enter your app URL (default: http://localhost:3000)"
    $appUrl = Read-Host
    if ([string]::IsNullOrWhiteSpace($appUrl)) {
        $appUrl = "http://localhost:3000"
    }
    Set-EnvValue -FilePath $envLocalPath -Key "NEXTAUTH_URL" -Value $appUrl
    Set-EnvValue -FilePath $envLocalPath -Key "APP_URL" -Value $appUrl
    Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_API_URL" -Value "$appUrl/api"
    Write-Success "Set NEXTAUTH_URL to $appUrl"
}

function Setup-Firebase {
    Write-Step "Configuring Firebase..."

    # Check for service account file
    $serviceAccountPath = Join-Path $configPath "service-account.json"

    if (Test-Path $serviceAccountPath) {
        Write-Success "Found service account at: $serviceAccountPath"

        # Try to read project info from service account
        try {
            $serviceAccount = Get-Content $serviceAccountPath -Raw | ConvertFrom-Json
            $projectId = $serviceAccount.project_id

            if ($projectId) {
                Write-Success "Detected project ID: $projectId"

                # Auto-fill Firebase config
                Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_PROJECT_ID" -Value $projectId
                Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" -Value "$projectId.firebaseapp.com"
                Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" -Value "$projectId.appspot.com"
                Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_DATABASE_URL" -Value "https://$projectId-default-rtdb.firebaseio.com"
                Set-EnvValue -FilePath $envLocalPath -Key "FIREBASE_ADMIN_PROJECT_ID" -Value $projectId
                Set-EnvValue -FilePath $envLocalPath -Key "FIREBASE_ADMIN_CLIENT_EMAIL" -Value $serviceAccount.client_email

                Write-Success "Auto-configured Firebase settings from service account"
            }
        } catch {
            Write-Info "Could not parse service account file"
        }
    } else {
        Write-Info "Service account not found at: $serviceAccountPath"
        Write-Info "Please download it from Firebase Console > Project Settings > Service Accounts"

        # Create config directory if it doesn't exist
        if (-not (Test-Path $configPath)) {
            New-Item -ItemType Directory -Path $configPath -Force | Out-Null
            Write-Success "Created config directory: $configPath"
        }
    }

    # Prompt for Firebase API Key
    $currentApiKey = Get-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_API_KEY"
    if ([string]::IsNullOrWhiteSpace($currentApiKey)) {
        Write-Prompt "Enter your Firebase API Key (from Firebase Console)"
        $apiKey = Read-Host
        if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
            Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_API_KEY" -Value $apiKey
            Write-Success "Set Firebase API Key"
        }
    }

    # Prompt for Firebase App ID
    $currentAppId = Get-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_APP_ID"
    if ([string]::IsNullOrWhiteSpace($currentAppId)) {
        Write-Prompt "Enter your Firebase App ID (1:xxx:web:xxx)"
        $appId = Read-Host
        if (-not [string]::IsNullOrWhiteSpace($appId)) {
            Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_APP_ID" -Value $appId
            Write-Success "Set Firebase App ID"
        }
    }

    # Prompt for Messaging Sender ID
    $currentSenderId = Get-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    if ([string]::IsNullOrWhiteSpace($currentSenderId)) {
        Write-Prompt "Enter your Firebase Messaging Sender ID"
        $senderId = Read-Host
        if (-not [string]::IsNullOrWhiteSpace($senderId)) {
            Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" -Value $senderId
            Write-Success "Set Firebase Messaging Sender ID"
        }
    }
}

function Setup-GoogleOAuth {
    Write-Prompt "Do you want to configure Google OAuth? (y/N)"
    $response = Read-Host

    if ($response -ne "y" -and $response -ne "Y") {
        Write-Info "Skipping Google OAuth configuration"
        return
    }

    Write-Info "Create OAuth credentials at:"
    Write-Info "https://console.cloud.google.com/apis/credentials"
    Write-Host ""

    Write-Prompt "Enter your Google Client ID"
    $clientId = Read-Host
    if (-not [string]::IsNullOrWhiteSpace($clientId)) {
        Set-EnvValue -FilePath $envLocalPath -Key "GOOGLE_CLIENT_ID" -Value $clientId
        Write-Success "Set Google Client ID"
    }

    Write-Prompt "Enter your Google Client Secret"
    $clientSecret = Read-Host
    if (-not [string]::IsNullOrWhiteSpace($clientSecret)) {
        Set-EnvValue -FilePath $envLocalPath -Key "GOOGLE_CLIENT_SECRET" -Value $clientSecret
        Write-Success "Set Google Client Secret"
    }
}

function Setup-MCPGateway {
    Write-Prompt "Do you want to configure the MCP Gateway? (y/N)"
    $response = Read-Host

    if ($response -ne "y" -and $response -ne "Y") {
        Write-Info "Skipping MCP Gateway configuration"
        Write-Info "You can set this up later by editing .env.local"
        return
    }

    Write-Prompt "Enter your MCP Gateway URL (e.g., https://sartor-life.your-subdomain.workers.dev)"
    $gatewayUrl = Read-Host
    if (-not [string]::IsNullOrWhiteSpace($gatewayUrl)) {
        Set-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_MCP_GATEWAY_URL" -Value $gatewayUrl
        Write-Success "Set MCP Gateway URL"
    }

    Write-Prompt "Enter your MCP Access Token (or press Enter to generate one)"
    $accessToken = Read-Host
    if ([string]::IsNullOrWhiteSpace($accessToken)) {
        $accessToken = New-AuthToken
        Write-Info "Generated token: $accessToken"
        Write-Info "Make sure to add this token to your Cloudflare Worker secrets!"
    }
    Set-EnvValue -FilePath $envLocalPath -Key "MCP_ACCESS_TOKEN" -Value $accessToken
    Write-Success "Set MCP Access Token"
}

function Test-FirebaseConnection {
    Write-Step "Validating Firebase configuration..."

    # Check if Node.js is available
    if (-not (Test-Command "node")) {
        Write-Info "Node.js not found - skipping Firebase validation"
        Write-Info "Install Node.js to enable automatic validation"
        return
    }

    # Check for service account
    $serviceAccountPath = Join-Path $configPath "service-account.json"
    if (-not (Test-Path $serviceAccountPath)) {
        Write-Info "Service account file not found - skipping validation"
        Write-Info "Place your service account JSON at: $serviceAccountPath"
        return
    }

    # Check for database URL
    $databaseUrl = Get-EnvValue -FilePath $envLocalPath -Key "NEXT_PUBLIC_FIREBASE_DATABASE_URL"
    if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
        Write-Info "Database URL not set - skipping validation"
        return
    }

    Write-Info "Attempting to connect to Firebase..."

    # Create a simple validation script
    $validationScript = @"
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.argv[2];
const databaseURL = process.argv[3];

try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
    });

    const db = admin.database();
    db.ref('.info/connected').once('value')
        .then(() => {
            console.log('SUCCESS');
            process.exit(0);
        })
        .catch((err) => {
            console.log('FIREBASE_ERROR: ' + err.message);
            process.exit(1);
        });

    // Timeout after 10 seconds
    setTimeout(() => {
        console.log('TIMEOUT');
        process.exit(1);
    }, 10000);

} catch (err) {
    console.log('INIT_ERROR: ' + err.message);
    process.exit(1);
}
"@

    # Check if firebase-admin is available
    $dashboardNodeModules = Join-Path $dashboardPath "node_modules"
    $firebaseAdminPath = Join-Path $dashboardNodeModules "firebase-admin"

    if (-not (Test-Path $firebaseAdminPath)) {
        Write-Info "firebase-admin not installed - skipping validation"
        Write-Info "Run 'npm install' in the dashboard directory first"
        return
    }

    # Write and execute validation script
    $tempScript = Join-Path $env:TEMP "firebase-validate-$(Get-Random).js"
    $validationScript | Out-File -FilePath $tempScript -Encoding UTF8

    try {
        Push-Location $dashboardPath
        $result = node $tempScript $serviceAccountPath $databaseUrl 2>&1
        Pop-Location

        if ($result -match "SUCCESS") {
            Write-Success "Firebase connection successful!"
        } elseif ($result -match "FIREBASE_ERROR: (.*)") {
            Write-Error "Firebase connection failed: $($Matches[1])"
        } elseif ($result -match "INIT_ERROR: (.*)") {
            Write-Error "Firebase initialization failed: $($Matches[1])"
        } elseif ($result -match "TIMEOUT") {
            Write-Error "Firebase connection timed out"
        } else {
            Write-Info "Validation returned: $result"
        }
    } catch {
        Write-Info "Could not validate Firebase connection: $_"
    } finally {
        Remove-Item -Path $tempScript -Force -ErrorAction SilentlyContinue
    }
}

# Run the setup
Start-Setup
