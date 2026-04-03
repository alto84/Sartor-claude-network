# Firebase Setup Guide

This guide walks you through setting up Firebase for the Sartor Memory System. Firebase provides the hot-tier storage (sub-100ms response time) for the multi-tier memory architecture.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Create a Firebase Project](#step-1-create-a-firebase-project)
- [Step 2: Enable Firebase Services](#step-2-enable-firebase-services)
- [Step 3: Download Service Account Credentials](#step-3-download-service-account-credentials)
- [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
- [Step 5: Test Your Connection](#step-5-test-your-connection)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before starting, ensure you have:

- A Google account
- Node.js >= 18.0.0 installed
- npm >= 9.0.0 installed
- Project dependencies installed (`npm install`)

---

## Step 1: Create a Firebase Project

### 1.1 Access Firebase Console

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"

### 1.2 Configure Your Project

1. **Project Name**: Enter a descriptive name (e.g., "sartor-memory-prod")
2. **Google Analytics**: You can enable or disable this (optional for this project)
3. Click "Create project" and wait for provisioning to complete

### 1.3 Note Your Project Details

Once created, you'll need:
- **Project ID**: Found in Project Settings (e.g., `sartor-memory-12345`)
- Keep this handy for the next steps

---

## Step 2: Enable Firebase Services

### 2.1 Enable Realtime Database

1. In the Firebase Console, select your project
2. Navigate to **Build > Realtime Database** in the left sidebar
3. Click "Create Database"
4. **Select location**: Choose a region close to your users/servers
   - US: `us-central1`
   - Europe: `europe-west1`
   - Asia: `asia-southeast1`
5. **Security rules**: Select "Start in locked mode" (we'll configure rules later)
6. Click "Enable"

### 2.2 Note Your Database URL

After creation, you'll see your database URL:
```
https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com
```

Save this URL - you'll need it for environment configuration.

### 2.3 Enable Firestore (Optional)

While the current implementation uses Realtime Database, you may want Firestore for future features:

1. Navigate to **Build > Firestore Database**
2. Click "Create database"
3. Choose production mode
4. Select the same region as your Realtime Database
5. Click "Enable"

---

## Step 3: Download Service Account Credentials

Service account credentials allow your application to authenticate with Firebase.

### 3.1 Access Service Accounts

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Navigate to the "Service accounts" tab

### 3.2 Generate New Private Key

1. Ensure "Firebase Admin SDK" is selected
2. Click "Generate new private key"
3. A dialog will appear warning you to keep this key secure
4. Click "Generate key"
5. A JSON file will download automatically (e.g., `sartor-memory-firebase-adminsdk-xxxxx.json`)

### 3.3 Secure Your Credentials File

**CRITICAL SECURITY STEP:**

```bash
# Create config directory if it doesn't exist
mkdir -p config

# Move the downloaded file to config directory
mv ~/Downloads/sartor-memory-firebase-adminsdk-xxxxx.json config/service-account.json

# Set restrictive permissions (Unix/Linux/macOS)
chmod 600 config/service-account.json

# Verify .gitignore excludes this file
grep -q "config/service-account.json" .gitignore || echo "config/service-account.json" >> .gitignore
```

**NEVER commit this file to version control!**

### 3.4 Understanding the Credentials File

Your `service-account.json` contains:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## Step 4: Configure Environment Variables

The system supports three methods for providing credentials. Choose the one that fits your deployment:

### Method 1: File Path (Recommended for Local Development)

Copy the example environment file:
```bash
cp config/.env.example config/.env
```

Edit `config/.env`:
```bash
# Point to your service account file
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json

# Your Realtime Database URL
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

### Method 2: Base64 Encoded (Recommended for CI/CD)

Encode your service account file:
```bash
# Generate base64 encoding
cat config/service-account.json | base64 | tr -d '\n' > config/service-account.base64

# The output is a long string like:
# eyJwcm9qZWN0X2lkIjoieW91ci1wcm9qZWN0IiwiY2xpZW50X2VtYWlsIjoiLi4uIn0=
```

Edit `config/.env`:
```bash
# Use base64 encoded credentials
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJwcm9qZWN0X2lkIjoieW91ci1wcm9qZWN0IiwiY2xpZW50X2VtYWlsIjoiLi4uIn0=

# Your Realtime Database URL
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

For GitHub Actions or other CI/CD, add this as a secret:
```yaml
# .github/workflows/deploy.yml
env:
  FIREBASE_SERVICE_ACCOUNT_BASE64: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_BASE64 }}
  FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
```

### Method 3: Environment Variables (Alternative)

You can also set these directly in your shell:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/config/service-account.json
export FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

Add to your `~/.bashrc` or `~/.zshrc` for persistence.

### Credential Loading Priority

The system tries credentials in this order:
1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable (file path)
2. `config/service-account.json` file
3. `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variable

**Tip**: Use Method 1 for local development, Method 2 for production/CI.

---

## Step 5: Test Your Connection

### 5.1 Run the Setup Wizard

The setup wizard validates your configuration:

```bash
node scripts/setup-firebase.js
```

Expected output if successful:
```
Firebase Setup Wizard
=====================

Checking for credentials...
✓ Found credentials: config/service-account.json
✓ Credentials file is valid JSON
✓ Required fields present: project_id, client_email, private_key

Checking for database URL...
✓ Database URL configured: https://your-project-id-default-rtdb.firebaseio.com

Testing Firebase connectivity...
✓ Successfully connected to Firebase
✓ Test write successful
✓ Test read successful

Configuration Status: READY
Storage Backend: Firebase Realtime Database

Your Firebase configuration is ready to use!
```

### 5.2 Test with MCP Server

Start the MCP server to verify end-to-end functionality:

```bash
npm run mcp
```

Expected output:
```
[Firebase Init] Loaded credentials from config/service-account.json
[Firebase Init] ✓ Firebase initialized successfully
[Firebase Init] Database URL: https://your-project-id-default-rtdb.firebaseio.com
[FirebaseStore] Using Firebase Realtime Database
[MCP Server] Started on stdio
```

Press `Ctrl+C` to stop.

### 5.3 Run Automated Tests

```bash
# Test Firebase backends
npm run test:firebase-backends

# Test Firestore integration (if enabled)
npm run test:firestore

# Full test suite
npm test
```

---

## Troubleshooting

### Issue: "No credentials found"

**Symptoms:**
```
[Firebase Init] ERROR: No credentials found. Please set one of:
  - GOOGLE_APPLICATION_CREDENTIALS environment variable
  - config/service-account.json file
  - FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable
```

**Solutions:**
1. Verify `config/service-account.json` exists:
   ```bash
   ls -l config/service-account.json
   ```
2. Check file permissions:
   ```bash
   chmod 600 config/service-account.json
   ```
3. Verify the file contains valid JSON:
   ```bash
   cat config/service-account.json | jq .
   ```
4. Ensure you're running from the project root directory

---

### Issue: "No database URL found"

**Symptoms:**
```
[Firebase Init] ERROR: No database URL found. Please set:
  - FIREBASE_DATABASE_URL environment variable
  - Or configure it in config/firebase-config.json
```

**Solutions:**
1. Check your `.env` file has the correct URL:
   ```bash
   grep FIREBASE_DATABASE_URL config/.env
   ```
2. Verify the URL format:
   ```
   https://PROJECT-ID-default-rtdb.firebaseio.com
   ```
   or for specific regions:
   ```
   https://PROJECT-ID-default-rtdb.europe-west1.firebasedatabase.app
   ```
3. Copy the URL from Firebase Console:
   - Navigate to Realtime Database
   - The URL is shown at the top of the Data tab

---

### Issue: "Permission denied" errors

**Symptoms:**
```
Error: PERMISSION_DENIED: Permission denied
```

**Solutions:**

1. **Check Realtime Database Rules**:
   - Navigate to Realtime Database > Rules
   - For development, use:
     ```json
     {
       "rules": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
     ```
   - Click "Publish"

2. **Verify Service Account Permissions**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to IAM & Admin > IAM
   - Find your service account (firebase-adminsdk-xxxxx@...)
   - Ensure it has "Firebase Admin" or "Editor" role

3. **Re-generate Service Account Key**:
   - If the key is old or compromised
   - Follow [Step 3](#step-3-download-service-account-credentials) again
   - Delete the old key from Firebase Console

---

### Issue: "ENOENT: no such file or directory"

**Symptoms:**
```
Error: ENOENT: no such file or directory, open 'config/service-account.json'
```

**Solutions:**
1. Verify you're in the project root:
   ```bash
   pwd  # Should show /path/to/Sartor-claude-network
   ```
2. Check if config directory exists:
   ```bash
   ls -ld config/
   ```
3. Verify file path in environment variable:
   ```bash
   echo $GOOGLE_APPLICATION_CREDENTIALS
   # Should be ./config/service-account.json or absolute path
   ```

---

### Issue: Fallback to file storage

**Symptoms:**
```
[FirebaseStore] Firebase unavailable, falling back to file storage
```

**What it means:**
- Firebase connection failed
- System is using local JSON files instead
- Functionality works but no cloud synchronization

**Solutions:**
1. Run the setup wizard to diagnose:
   ```bash
   node scripts/setup-firebase.js
   ```
2. Check network connectivity to Firebase:
   ```bash
   curl -I https://firebase.google.com
   ```
3. Verify credentials are correct
4. Check database URL is accessible

---

### Issue: "Invalid JSON" errors

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
```

**Solutions:**
1. Validate your service account JSON:
   ```bash
   cat config/service-account.json | jq .
   ```
2. Check for corrupted download:
   - Re-download from Firebase Console
   - Ensure complete file (ends with `}`)
3. Verify base64 encoding (if using Method 2):
   ```bash
   echo $FIREBASE_SERVICE_ACCOUNT_BASE64 | base64 -d | jq .
   ```

---

### Issue: Connection timeout

**Symptoms:**
```
Error: Timeout connecting to Firebase
```

**Solutions:**
1. Check firewall/proxy settings
2. Verify internet connectivity
3. Try a different network
4. Check Firebase status: https://status.firebase.google.com/

---

## Security Best Practices

### 1. Never Commit Credentials

Ensure these files are in `.gitignore`:
```gitignore
# Firebase credentials
config/service-account.json
config/service-account.base64
config/.env
.env

# Secrets
*.pem
*.key
```

### 2. Use Environment-Specific Credentials

```
config/
  service-account.dev.json    # Development
  service-account.staging.json # Staging
  service-account.prod.json    # Production
```

Load based on `NODE_ENV`:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.${NODE_ENV}.json
```

### 3. Rotate Keys Regularly

1. Generate new service account key
2. Update environment variables
3. Test thoroughly
4. Delete old key from Firebase Console

### 4. Use Least Privilege

Create custom service accounts with minimal permissions:
1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Click "Add"
3. Enter service account email
4. Assign only required roles:
   - Firebase Realtime Database Admin
   - (Not Editor or Owner)

### 5. Monitor Access

1. Enable audit logs:
   - [Logging](https://console.cloud.google.com/logs)
   - Filter by service account
2. Set up alerts for unusual activity
3. Review access logs monthly

### 6. Secure Database Rules

For production, use restrictive rules:

```json
{
  "rules": {
    "mcp-memories": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.firebase.sign_in_provider === 'custom'"
    }
  }
}
```

Apply in Firebase Console > Realtime Database > Rules.

---

## Advanced Configuration

### Using Firestore Instead of Realtime Database

If you prefer Firestore for the hot tier:

1. Enable Firestore (see Step 2.3)
2. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Modify initialization in `src/mcp/firebase-init.ts` to use Firestore SDK

Rules are defined in `firebase/firestore.rules`.

### Custom Database Paths

Change the base path for memories:

```typescript
// In src/mcp/firebase-store.ts
private basePath: string = 'custom-memories-path';
```

### Multi-Environment Setup

```bash
# Development
FIREBASE_DATABASE_URL=https://dev-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.dev.json

# Production
FIREBASE_DATABASE_URL=https://prod-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.prod.json
```

---

## Next Steps

After successful Firebase setup:

1. **Configure GitHub Storage** (cold tier):
   - See `docs/GITHUB_SETUP.md` (if available)
   - Or refer to `.env.example` for GitHub configuration

2. **Set up Vector Database** (semantic search):
   - See `docs/VECTOR_DB_SETUP.md` (if available)
   - Configure Pinecone or Weaviate

3. **Deploy Security Rules**:
   ```bash
   firebase deploy --only database
   ```

4. **Run the full system**:
   ```bash
   npm run mcp:http  # Start MCP HTTP server
   ```

5. **Read the architecture docs**:
   - `docs/ARCHITECTURE.md` - System overview
   - `docs/MEMORY_SYSTEM_SPEC.md` - Memory tier design

---

## Resources

- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Key Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/database/security)
- Project-specific docs in `docs/` directory

---

## Getting Help

If you encounter issues not covered here:

1. Run diagnostics:
   ```bash
   node scripts/setup-firebase.js
   npm run test:firebase-backends
   ```

2. Check logs:
   ```bash
   # Enable verbose logging
   DEBUG=firebase:* npm run mcp
   ```

3. Review existing documentation:
   - `docs/FIRESTORE_INTEGRATION.md`
   - `docs/ARCHITECTURE.md`

4. Create an issue with:
   - Error messages
   - Output of setup wizard
   - Node/npm versions
   - Operating system

---

**Last Updated**: December 2025
**Maintained By**: Sartor Team
