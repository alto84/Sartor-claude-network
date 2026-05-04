---
name: secrets-via-bitwarden
description: Use whenever a credential (password, API key, login) is needed for a service that doesn't already have a per-service token file. Loads the Bitwarden CLI workflow, the sartor-secret wrapper, the locked-vault handling, the per-machine setup, and the migration recipe for known-leaked passwords. Reference secrets by name, never by value.
---

# secrets-via-bitwarden

The Sartor convention for retrieving credentials. **Reference secrets by name, never by value** — in chat, memory files, scripts, or git commits. The vault is the only sanctioned location for credential values.

## When this applies

Invoke when about to:
- Access a BMC, router, switch, or other web admin that doesn't have an API key
- Use a password "we know" — first stop is the vault, never paste from chat history
- Add a new service that needs a credential — create the vault entry first, then write the code that reads from it

Skip for: services that already have per-service token files (`~/.config/vastai/`, `~/.ssh/`, `.git-credentials`, etc.). Those follow their own conventions.

## The retrieval pattern

```bash
# Inline use — preferred, password never lands in argv twice
curl -k -s -u "admin:$(sartor-secret read 'BMC rtxserver')" \
     "https://192.168.1.156/redfish/v1/Systems/Self/LogServices/SEL/Entries"

# Short-lived shell var when same secret is reused several times in a script
PASS="$(sartor-secret read 'BMC rtxserver')" || exit $?
```

The wrapper at `Sartor-claude-network/scripts/sartor-secret` (Python; `.cmd` shim on Windows) is the only sanctioned entry point. Don't call `bw get` directly — the wrapper exists so the locked-vault behavior is uniform.

## Vault item naming convention

Predictable names so I can guess without searching. Lowercase-friendly. One canonical name per service.

| Pattern | Example |
|---|---|
| `BMC <hostname>` | `BMC rtxserver` |
| `<Network-device> admin` | `Fios admin`, `UniFi superadmin` |
| `<Service> API key` | `Anthropic API key`, `OpenAI API key` |
| `<Service> <account-purpose>` | `Bitwarden master`, `Chase business` |

When uncertain, search the vault by URI rather than guessing repeatedly.

## Service inventory

Sartor services that hold credentials, with the canonical vault item name. Update on each migration. **Names only — no values.** The vault is the source of truth for *what value*; this table is a map of *what name to ask for*.

| Vault item name | Service | URL / endpoint | Migration status | Rotation method |
|---|---|---|---|---|
| `BMC rtxserver` | ASUS WRX90E-SAGE SE BMC, account 4 (`admin`) | `https://192.168.1.156` (Redfish at `/redfish/v1/`) | ✅ Migrated 2026-05-03 | Redfish PATCH (see playbook) |
| `BMC gpuserver1` | gpuserver1's IPMI/BMC if exposed | TBD — gpuserver1's motherboard may or may not have BMC; verify | ⏳ Pending | TBD per board |
| `Fios admin` | Verizon Fios CR1000A router | `https://192.168.1.1` | ⏳ Leaked (sticker `6GDPD3G3H`); rotate next | Web UI via Chrome MCP + clipboard pattern (no API) |
| `UniFi superadmin` | UniFi local controller (Rocinante-hosted) | `https://192.168.1.171:8443` | ⏳ Leaked Friday during takeover | Controller API (`/api/users/`) |
| `UniFi local-admin <ap-hostname>` | Per-AP `mgmt.authkey` | each AP via SSH | n/a — controller-managed; not user-rotatable | Controlled by adoption |
| `Anthropic API key` | Anthropic Console | `https://console.anthropic.com` | n/a (uses OAuth via Claude Code; separate) | Console regen |
| `Bitwarden master` | The vault itself | `https://vault.bitwarden.com` | n/a — only in your head | Web UI (vault settings) |

Other things that look like secrets but DON'T live in Bitwarden:
- **vast.ai API key** — already at `~/.config/vastai/vast_api_key` mode 600 per-machine. Generated fresh per machine on host onboarding.
- **SSH keys** — `~/.ssh/` per machine, key-based auth. No rotation needed unless compromise.
- **Anthropic Claude OAuth tokens** — refreshed by `Sartor Peer Creds Sync` Windows Scheduled Task every 4h.
- **TLS / Cloudflare API tokens** — n/a (Sartor doesn't expose anything via TLS-with-domain-cert today).

Add new rows when migrating. Don't pre-populate — only after the vault entry exists and works.

## When the vault is locked (exit 2 with `[BW_LOCKED]`)

**Do NOT:**
- Re-prompt for the master password yourself
- Search filesystem / chat history / `.jsonl` files for the value
- Guess "household defaults"
- Bypass the wrapper

**DO:**
- Halt the operation that needed the secret
- Surface the lock state to Alton in chat
- Ask him to run `sartor-secret unlock` (or `bw unlock` + cache the token), then retry

## Per-machine install (one-time, by Alton)

### Rocinante (Windows 10)

```powershell
# Install bw CLI
npm install -g @bitwarden/cli
# (or) winget install Bitwarden.CLI

# First-time login (interactive — master password prompt)
bw login alton@example.com

# Add Sartor scripts to PATH
$current = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$current;C:\Users\alto8\Sartor-claude-network\scripts", "User")

# Test
sartor-secret status
```

### Linux peers (rtxserver, gpuserver1)

```bash
# Install bw CLI
sudo npm install -g @bitwarden/cli

# First-time login
bw login alton@example.com

# Add scripts to PATH (in ~/.bashrc)
echo 'export PATH="$HOME/Sartor-claude-network/scripts:$PATH"' >> ~/.bashrc
chmod +x ~/Sartor-claude-network/scripts/sartor-secret

# Test
sartor-secret status
```

## After every reboot (per machine)

Vault re-locks on reboot. Alton must unlock once:

```bash
sartor-secret unlock     # prompts for master password, caches session
```

Then either re-source the profile (`. $PROFILE` on Windows, `source ~/.bashrc` on Linux) OR open a new shell. The cache file is written to `~/.config/sartor/bw-session` (Linux) / `%LOCALAPPDATA%\Sartor\bw-session` (Windows), mode 600.

## Auto-source on shell start (recommended)

Add once to `~/.bashrc` (Linux) so new shells auto-load the cached session:

```bash
if [ -r ~/.config/sartor/bw-session ]; then
  export BW_SESSION="$(cat ~/.config/sartor/bw-session)"
fi
```

Git Bash on Windows — same pattern but Windows path:

```bash
# in ~/.bashrc on Git Bash
WIN_CACHE="/c/Users/alto8/AppData/Local/Sartor/bw-session"
if [ -r "$WIN_CACHE" ]; then
  export BW_SESSION="$(cat "$WIN_CACHE")"
fi
```

PowerShell `$PROFILE`:

```powershell
$bwCache = "$env:LOCALAPPDATA\Sartor\bw-session"
if (Test-Path $bwCache) {
    $env:BW_SESSION = (Get-Content $bwCache -Raw).Trim()
}
```

## Hygiene rules (these are the point of the skill)

1. **Reference secrets by name in code/chat/memory:** `sartor-secret read 'BMC rtxserver'` — never the literal value.
2. **No secrets in `sartor/memory/`:** the wiki holds *references*, never values.
3. **No secrets in chat:** when discussing a credential, name it (`the BMC password for rtxserver`); don't paste it.
4. **No secrets in commit messages or PRs.**
5. **Process substitution `$(...)`** keeps secrets out of `argv` (visible to `ps -ef`); prefer it to setting persistent env vars when only one call needs the value.
6. **Rotate after migration.** Every time you import an existing-but-leaked password into the vault, rotate it at the service first or immediately after. The vault entry replaces the leaked value.
7. **Never echo a value to stdout in a way that lands in shell history.** `bw get password X` then copying from terminal is acceptable; `echo $PASS >> some.log` is not.

## Decision tree — given a new service, how do I rotate

```
Does the service have a REST/JSON API for credential change?
├── YES → use API (curl + JSON body in mode-600 file)
│   ├── Redfish (BMCs)         → see Playbook 1
│   ├── UniFi controller        → see Playbook 3
│   ├── vast.ai / Anthropic     → API-key regen on console; not a Bitwarden migration
│   └── Other API               → use Playbook 5 (generic API) as template
│
├── NO, web UI only:
│   ├── Browser-friendly admin (Fios, simple routers, ASUS routers, etc.)
│   │   → see Playbook 2 (Chrome MCP + clipboard pattern)
│   └── Application admin (some appliances, vendor portals)
│       → Playbook 2 still applies; treat as plain web form
│
├── Linux/Unix user account on a peer machine:
│   → see Playbook 4 (`passwd` over SSH, key-based auth)
│
└── Hardware-only (BMC at console, OOB serial):
    → out of scope for sartor-secret; document per-device, escalate to Alton
```

## Migration recipe — generic procedure

For each credential currently in chat history, `.jsonl` files, sticker photos, etc.:

1. **Discover the service's password policy first.** Don't generate a 24-char password and find out at rotation-time the service caps at 20. For Redfish BMCs: `GET /redfish/v1/AccountService` returns `MinPasswordLength` / `MaxPasswordLength`. For routers/switches: check the password-change form's HTML constraints or the docs. For everything else: docs.
2. **Generate** at the policy-allowed maximum: `bw generate --uppercase --lowercase --number --special --length <max>`. Capture into a shell variable; do NOT echo.
3. **Save to vault FIRST**, before rotating at the service. If service rotation fails, the new value still has a home; if vault save fails, you don't strand yourself with a service-only credential. Use `bw get template item | python3 -c '...mutate...' | bw encode | bw create item`.
4. **Verify vault retrieval** matches the generated value. Diverge here = abort, investigate.
5. **Rotate at the service** using the appropriate playbook (below).
6. **Verify the new value** by re-authenticating. Old value should now reject.
7. **Append to migration log** (`sartor/memory/business/secrets-migration-log.md`): one row, no values. Update the Service inventory table above.
8. **Don't try to scrub the old value** from chat history / `.jsonl` files — that data is durable. Rotation kills the value; the old leak is now harmless.

## Per-service rotation playbooks

### Playbook 1 — Redfish PATCH (BMCs running AMI MegaRAC)

Used 2026-05-03 for `BMC rtxserver`. Path for ASUS WRX90E-SAGE SE and likely any AMI MegaRAC BMC.

```bash
# 1. Find the admin account ID (UserName="admin", not "Administrator" / "fwupd")
curl -k -s -u "admin:$OLD" "https://<bmc>/redfish/v1/AccountService/Accounts" \
    | python3 -c "import sys,json; [print(m['@odata.id']) for m in json.load(sys.stdin)['Members']]"
# inspect each: look for UserName="admin", RoleId="Administrator", PasswordChangeRequired=false

# 2. Discover length policy
curl -k -s -u "admin:$OLD" "https://<bmc>/redfish/v1/AccountService" \
    | python3 -c "import sys,json; j=json.load(sys.stdin); print(j.get('MinPasswordLength'), j.get('MaxPasswordLength'))"

# 3. GET the account to harvest ETag (PATCH requires If-Match)
ETAG=$(curl -k -s -D - -o /dev/null -u "admin:$OLD" "https://<bmc>/redfish/v1/AccountService/Accounts/<id>" \
       | grep -i '^etag:' | head -1 | awk '{print $2}' | tr -d '\r\n')

# 4. PATCH (NEW value via mode-600 file so it doesn't land in argv)
curl -k -X PATCH -H "Content-Type: application/json" -H "If-Match: $ETAG" \
     -u "admin:$OLD" --data @/tmp/.patch.json \
     "https://<bmc>/redfish/v1/AccountService/Accounts/<id>"
# Expected: HTTP 200 or 204 (no content)
```

**AMI MegaRAC quirks worth remembering:**
- `MaxPasswordLength: 20` on rtxserver's BMC (not 24, not unlimited).
- `If-Match` header is **required** for PATCH on Accounts — returns HTTP 428 (Precondition Required) without it. Capture from `ETag` response header on a prior GET.
- `bw` CLI on Windows is named `bw.cmd` (a shim). Python's `subprocess.run(["bw",...])` won't find it without `shell=True` or full path. Avoid: do `bw` calls in bash, use Python only for stdin-stdout JSON manipulation.
- `BW_SESSION` doesn't auto-source in Git Bash on Windows (only PowerShell via `$PROFILE`). Source explicitly: `export BW_SESSION="$(cat /c/Users/alto8/AppData/Local/Sartor/bw-session)"`.
- Vault item edit (vs create) uses `bw edit item <id>` with the FULL updated item JSON, not a partial patch. Pull current via `bw get item <id>`, mutate, push back.

### Playbook 2 — Web UI only (Fios CR1000A, generic admin panels)

When there's no API. Last resort. The risk is the new password value landing in `form_input value=NEW` tool-call args. The clipboard pattern routes around this: PowerShell sets the clipboard from a value never displayed, Chrome MCP pastes via `Ctrl+V` keystroke, value never appears in any tool argument.

```powershell
# Run as a single PowerShell script; password value stays in $pw, never displayed
$pw = & "C:\Users\alto8\Sartor-claude-network\scripts\sartor-secret.cmd" read 'Fios admin'
Set-Clipboard -Value $pw
# Now Chrome MCP: click the password input, then key "ctrl+v"
# After the form submits, clear the clipboard:
Set-Clipboard -Value ' '
Remove-Variable pw
```

Generic flow:
1. Generate + save-to-vault as in the recipe (steps 2-4)
2. Drive Chrome MCP via `chrome-automation` skill to the password-change page
3. Set old password into clipboard via PowerShell, paste via `key("ctrl+v")` on the OLD field, clear clipboard
4. Set new password into clipboard via PowerShell, paste via `key("ctrl+v")` on the NEW field, clear clipboard
5. Submit
6. Verify by re-logging in (also via clipboard paste)

**Sketched but not yet executed for Fios.** Will be run as part of Fios admin migration; document any quirks in this section after.

### Playbook 3 — UniFi controller API

UniFi controller exposes `/api/...` endpoints with cookie-based auth from `/api/login`. Used to manage device adoption keys (the `mgmt.authkey` per-AP) and the local controller's own admins.

```bash
# 1. Login (POST credentials, capture session cookie)
curl -k -s -c /tmp/.unifi-cookie.txt -X POST \
    -H "Content-Type: application/json" \
    -d "$(printf '{"username":"%s","password":"%s","strict":true}' \
        "$(sartor-secret read 'UniFi superadmin' --field username)" \
        "$(sartor-secret read 'UniFi superadmin')")" \
    "https://192.168.1.171:8443/api/login"
chmod 600 /tmp/.unifi-cookie.txt

# 2. Find the admin account ID
curl -k -s -b /tmp/.unifi-cookie.txt "https://192.168.1.171:8443/api/stat/admin"

# 3. Change password — admin self-edit endpoint
curl -k -s -b /tmp/.unifi-cookie.txt -X PUT \
    -H "Content-Type: application/json" \
    --data @/tmp/.unifi-patch.json \
    "https://192.168.1.171:8443/api/s/default/admin/<admin_id>"

# Body in /tmp/.unifi-patch.json:
# { "x_password": "<NEW>", "name": "<existing>", "email": "<existing>" }

# 4. Cleanup
rm -f /tmp/.unifi-cookie.txt /tmp/.unifi-patch.json
```

**Sketched, not yet executed.** Verify exact endpoint shape against your controller's API before running. UniFi's admin endpoints have changed format across versions.

### Playbook 4 — Linux user account on a peer

For accounts where SSH key auth gets you in but you want to rotate the password (e.g., for sudo prompts). You always need either current pwd or sudo-NOPASSWD already configured.

```bash
# Push the new password to the user via passwd, with both old and new piped in
ssh alton@<peer> "echo -e \"$(sartor-secret read 'Linux <hostname> alton')\n$(sartor-secret read 'Linux <hostname> alton')\" | passwd"
```

But the simpler reality: SSH key auth is the auth path; user passwords on the peer matter only for `sudo`. If you've configured `NOPASSWD: ALL` for `alton` (default on Sartor peers) you don't need to rotate user passwords at all. **Sartor peers: skip this playbook unless explicitly needed.**

### Playbook 5 — Generic API with Basic auth or bearer token

Template for new services. Adapt the curl invocation:

```bash
NEW=$(sartor-secret read '<vault item>')
OLD=$(... obtain from vault if previously migrated, else from a temp file ...)

# Build patch body in mode-600 file — value never in argv
NEW="$NEW" python3 -c "import os,sys,json; sys.stdout.write(json.dumps({'<password-field-name>': os.environ['NEW']}))" > /tmp/.patch.json
chmod 600 /tmp/.patch.json

# PATCH/PUT/POST as the API requires
curl <auth-flag> --data @/tmp/.patch.json -H "Content-Type: application/json" "<URL>"

# Verify
# Cleanup
rm -f /tmp/.patch.json
unset NEW OLD
```

Document any new service's quirks in this skill after the first successful rotation.

## Account topology

| Phase | Setup | When |
|---|---|---|
| **v0 (now)** | Single Bitwarden Free account (Alton's). I borrow his unlocked session per machine. | Today |
| **v1** | Free 2-user Organization. Items in a "Household Infrastructure" Collection visible to Alton + Aneeta. Subscription stays $0. | When Aneeta needs household-shared secret access |
| **v2** | Bitwarden Premium ($10/yr) for TOTP storage; or Secrets Manager (separate paid product) for true headless machine accounts | Only if real friction emerges |

## Open follow-ups (not blocking v0)

- **`sartor-claude-peer.service` integration:** peer-Claude on rtxserver/gpuserver1 needs `BW_SESSION` available at boot. v0: Alton unlocks each peer once after reboot. v0.1 option: extend the existing `Sartor Peer Creds Sync` Windows Scheduled Task (every 4h) to also push fresh BW_SESSION tokens to peers. Trade-off: couples peer secret-access to Rocinante's vault-unlock state. Defer until needed.
- **Subscription tracker** (separate Sartor work item) — Bitwarden free tier means no new subscription, but the broader "what do I pay for monthly" gap still wants closing.

## Related

- `Sartor-claude-network/scripts/sartor-secret` — the wrapper
- `Sartor-claude-network/scripts/sartor-secret.cmd` — Windows shim
- `sartor/memory/business/secrets-migration-log.md` — created on first migration
- `peer-comms` skill — peers retrieve secrets the same way once installed

## What this skill does NOT cover

- The actual rotation of any specific credential — that's per-service procedure
- SSH key management — already handled by `~/.ssh/` conventions
- vast.ai API keys — already handled by `~/.config/vastai/vast_api_key` per-service token file
- OAuth tokens (Anthropic Claude OAuth) — already handled by `Sartor Peer Creds Sync` task
