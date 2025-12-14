# Claude Network Setup - Firebase Coordination

## Step 1: Create Firebase Project (5 minutes)

1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Name it: `claude-house-network`
4. Disable Google Analytics (not needed)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In Firebase console, click "Realtime Database" in left menu
2. Click "Create Database"
3. Choose location (us-central1 recommended)
4. Start in **test mode** (we'll secure it later)
5. Click "Enable"

## Step 3: Get Database URL

You'll see something like:

```
https://claude-house-network-default-rtdb.firebaseio.com/
```

Copy this URL - it's your coordination endpoint!

## Step 4: Set Security Rules (Important!)

In the "Rules" tab, use:

```json
{
  "rules": {
    ".read": "auth == null",
    ".write": "auth == null"
  }
}
```

**Note**: This allows anyone with the URL to read/write. For home use this is fine,
but don't share the URL publicly!

## Step 5: Test It

Once you have the URL, tell Desktop Claude and we'll create the coordination system!
