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

**Wrapper subcommands:**

| Subcommand | Purpose | Exit codes |
|---|---|---|
| `read <NAME> [--field password\|username\|uri\|totp\|notes]` | Retrieve one field from one item. Default field is `password`. Emits the value to stdout with NO trailing newline. | 0 ok / 2 locked / 3 not-found-or-ambiguous / 4 not-logged-in / 5 other |
| `status` | Vault state, no values. Use to probe whether a follow-up `read` will succeed. | 0 unlocked / 2 locked / 4 unauthenticated / 5 other |
| `unlock` | Interactive: prompt for master pwd, cache the session token. | 0 ok / 4 prereq-missing / 5 other |
| `list [--search SUBSTR]` | NAMES ONLY (no values). Audit/discovery primitive. | 0 ok / 2 locked / 5 other |

There is intentionally no `bulk read`, no `--all-fields`, no JSON output. Add only if a real need surfaces; the surface area cost is high.

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
| `BMC rtxserver` | ASUS WRX90E-SAGE SE BMC, account 4 (`admin`) | `https://192.168.1.156` (Redfish at `/redfish/v1/`) | Migrated 2026-05-03 | Redfish PATCH (see Playbook 1) |
| `BMC gpuserver1` | gpuserver1's IPMI/BMC if exposed | TBD — gpuserver1's motherboard may or may not have BMC; verify | Pending | TBD per board |
| `Fios admin` | Verizon Fios CR1000A router | `https://192.168.1.1` | **Not yet held** — Alton has never had admin to this router. Sticker default `6GDPD3G3H` was tried during takeover, did not work. Need to either: factory-reset CR1000A (loses ISP-side provisioning), call Verizon to recover, or pivot to UCG-Pro and put CR1000A in bridge mode | Web UI Vue.js SPA via Chrome MCP + clipboard (no API). See Playbook 2 caveat. |
| `UniFi superadmin` | UniFi local controller (Rocinante-hosted) | `https://192.168.1.171:8443` | Leaked 2026-05-01 during takeover (`alton:;lkjpoiu0987` appears in `unifi-takeover-2026-05-01.md` Step 3 example payload + adoption-pushed AP creds) | Controller API or MongoDB-direct (Playbook 3) |
| `UniFi local-admin <ap-hostname>` | Per-AP `mgmt.authkey` (used for adoption handshake, not interactive login) | each AP via SSH | n/a — controller-managed, not user-rotatable. Master copy is `C:\Users\alto8\backups\unifi\ap-authkeys-2026-05-01.json` (file-only, treated like `.ssh/`, not in vault, not in git). | Controlled by adoption |
| `WiFi LGP123 PSK` | The household WiFi network's WPA passphrase | UniFi controller → Settings → WiFi | Live (broadcast in the air), rotation = "all family devices reconnect" event | UniFi controller UI; coordinate with Aneeta |
| `Meridian dashboard` | MERIDIAN family dashboard login (single-password cookie-auth, no username) | `http://127.0.0.1:5055/login` (`dashboard/family/server.py`) | Imported 2026-05-13 from runtime source `.secrets/meridian-password.txt` (gitignored). File is still the runtime source — `server.py` reads it directly; vault entry is the manageable copy. | To rotate: generate new value, save to vault FIRST (hygiene rule #6), overwrite `.secrets/meridian-password.txt`, restart uvicorn. No vendor API. |
| `Anthropic API key` | Anthropic Console | `https://console.anthropic.com` | n/a (Claude Code uses OAuth; separate path via `Sartor Peer Creds Sync`) | Console regen |
| `Bitwarden master` | The vault itself | `https://vault.bitwarden.com` | n/a — only in Alton's head; recovery via Bitwarden's emergency-access if ever set up | Web UI (vault settings) |

Other things that look like secrets but DON'T live in Bitwarden:
- **vast.ai API key** — already at `~/.config/vastai/vast_api_key` mode 600 per-machine. Generated fresh per machine on host onboarding.
- **SSH keys + passphrases** — `~/.ssh/` per machine, key-based auth. Key passphrases (if any) live in OS keychain (Windows Credential Manager / `ssh-agent`). No rotation needed unless compromise.
- **AP `mgmt.authkey` per UniFi device** — file `ap-authkeys-2026-05-01.json` outside repo, mode-600, controller-managed.
- **Anthropic Claude OAuth tokens** — refreshed by `Sartor Peer Creds Sync` Windows Scheduled Task every 4h.
- **TLS / Cloudflare API tokens** — n/a (Sartor doesn't expose anything via TLS-with-domain-cert today).
- **MongoDB on Rocinante (UniFi backing store)** — no auth, loopback-only at `mongodb://127.0.0.1:27117/ace`. The "credential" is host access to Rocinante itself.

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
6. **Vault save FIRST, rotate second.** Every time you import an existing-but-leaked password into the vault, save the NEW value to the vault before sending it to the service. If the service rotation fails, the new value still has a home; if vault save fails, you don't strand yourself with a service-only credential. The vault entry replaces the leaked value.
7. **Never echo a value to stdout in a way that lands in shell history.** `bw get password X` then copying from terminal is acceptable; `echo $PASS >> some.log` is not. Never use `Get-Clipboard` to "verify" a value — it prints to stdout.
8. **Clipboard discipline.** After Playbook 2's clipboard-paste pattern, immediately overwrite the clipboard with `Set-Clipboard -Value ' '` (or `xclip -selection clipboard < /dev/null` on Linux). The clipboard is a per-session global accessible to any other window. Treat clipboard residue like a temp file — clean up.
9. **Don't put secrets in env vars of long-running processes.** A service-manager-launched daemon that holds `BW_SESSION` or a service password in its env exposes the value to anyone with `/proc/<pid>/environ` read on Linux (root or same-uid). For one-shot scripts: env is fine and short-lived. For systemd services: use `EnvironmentFile=` pointing at a mode-600 file, or load secrets at use-time, not boot-time.
10. **Shell-special chars in secrets.** Bitwarden generates values with `$`, backtick, `!`, `\`, quotes. Always quote: `"$NEW"` not `$NEW`. For JSON bodies: use `python3 -c 'json.dumps(...)'` not `printf` substitution. For SSH remote command: use stdin (`<<<"$NEW"`) not interpolation. Playbook 5 has the patterns.
11. **Process listing is public on Linux.** Any user can `ps -ef`. Argv is public; env is per-uid-private. Never put a secret as a command-line argument.

## Decision tree — given a new service, how do I rotate

```
Is this a known-leaked household-default password we found in a new place?
├── YES → list every service we know uses it (search memory + chat for the value's neighbors),
│         rotate ALL of them, then rotate the underlying default itself if it lives anywhere
│         (e.g., a sticker, a wiki page). Treat as a multi-service migration; one row per service in
│         the migration log, plus a "supersedes household default" note.
│
└── NO, single service:

    Does the service have a REST/JSON API for credential change?
    ├── YES → use API (curl + JSON body in mode-600 file)
    │   ├── Redfish (BMCs: ASUS WRX90E, Supermicro X12/X13, Dell iDRAC, HPE iLO)
    │   │   → Playbook 1. Supermicro IPMI 2.0 + Redfish: same Playbook 1 pattern; quirks vary
    │   │     by BMC vendor (Supermicro: AccountService schema slightly different — confirm
    │   │     `MaxPasswordLength` and `If-Match` behavior at first run).
    │   ├── UniFi controller        → Playbook 3 (or MongoDB-direct fallback)
    │   ├── vast.ai / Anthropic / OpenAI / Claude.ai
    │   │   → API-key regen on the vendor console. NOT a Bitwarden migration in v0 because
    │   │     the value lives in a per-machine token file (`~/.config/vastai/`, `~/.config/anthropic/`).
    │   │     Optional: ALSO save to vault as a backup/audit trail.
    │   ├── SaaS with admin portal (Stripe, Zapier, Notion, Linear, GitHub, etc.)
    │   │   → Most expose API-key regen via the dashboard, not via API. That's Playbook 2 (web UI).
    │   │     If they DO have a credentials API (rare), Playbook 5.
    │   └── Other API               → Playbook 5 (generic) as template
    │
    ├── NO, web UI only:
    │   ├── Browser-friendly admin (Fios, simple routers, ASUS routers)
    │   │   → Playbook 2 (Chrome MCP + clipboard pattern)
    │   ├── IoT camera / smart-home device (Google Nest, Ring, Wyze, generic ONVIF)
    │   │   → Playbook 2 if there's a web admin; many have ONLY a mobile app, in which
    │   │     case the rotation requires Alton's phone — not a Claude-automatable path.
    │   │     Document the device + app-only constraint and stop.
    │   ├── SaaS dashboard (Stripe API-key regen, GitHub PAT regen, etc.)
    │   │   → Playbook 2; clipboard pattern still applies to the "show new key once" reveal step.
    │   └── Application admin (some appliances, vendor portals)
    │       → Playbook 2 still applies; treat as plain web form
    │
    ├── Linux/Unix user account on a peer machine:
    │   → Playbook 4. For Sartor peers: skip (NOPASSWD: ALL configured; verified 2026-05-03 on gpuserver1).
    │
    ├── SSH key passphrase:
    │   → NOT a sartor-secret target. Use `ssh-keygen -p -f <key>` interactively;
    │     store the new passphrase in vault as `SSH key <machine> <username>` if you set one.
    │     For Sartor peers, current convention is no-passphrase keys + per-host
    │     `authorized_keys` access control — passphrase rotation is moot.
    │
    └── Hardware-only (BMC at console, OOB serial, sticker-default-only-no-network):
        → out of scope for sartor-secret; document per-device, escalate to Alton.
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
- `MaxPasswordLength: 20` on rtxserver's BMC (not 24, not unlimited). **If you generate at 24 first, the BMC will silently truncate or reject — discover the policy at step 1, not at PATCH-time.** The 2026-05-03 rotation hit this, regenerated at 20, and saved a second value into the vault before re-PATCHing.
- `If-Match` header is **required** for PATCH on Accounts — returns HTTP 428 (Precondition Required) without it. Capture from `ETag` response header on a prior GET. The ETag changes after every PATCH; re-harvest before each retry.
- `Chassis/Self/Power → PowerSupplies[].Status.State == "Absent"` for the second PSU on rtxserver's WRX90E-SAGE SE BMC even though the system runs on a single PSU. This is **expected** for single-PSU builds with redundancy-capable boards; do not treat as alert noise. (Discovered during the same 2026-05-03 forensics window.)
- `bw` CLI on Windows is named `bw.cmd` (a shim). Python's `subprocess.run(["bw",...])` won't find it without `shell=True` or full path. Avoid: do `bw` calls in bash, use Python only for stdin-stdout JSON manipulation.
- `BW_SESSION` doesn't auto-source in Git Bash on Windows (only PowerShell via `$PROFILE`). Source explicitly: `export BW_SESSION="$(cat /c/Users/alto8/AppData/Local/Sartor/bw-session)"`.
- Vault item edit (vs create) uses `bw edit item <id>` with the FULL updated item JSON, not a partial patch. Pull current via `bw get item <id>`, mutate, push back. Concrete recipe (used 2026-05-03 to swap a 24-char value to a 20-char value):

  ```bash
  ID=$(bw get item 'BMC rtxserver' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  NEW="$(bw generate --uppercase --lowercase --number --special --length 20)"
  # Mutate JSON in-process (NEW only via env to keep argv clean)
  NEW="$NEW" bw get item "$ID" \
    | NEW="$NEW" python3 -c "import sys,json,os; j=json.load(sys.stdin); j['login']['password']=os.environ['NEW']; sys.stdout.write(json.dumps(j))" \
    | bw encode \
    | bw edit item "$ID"
  unset NEW
  # Verify
  test "$(sartor-secret read 'BMC rtxserver' | wc -c)" -eq 20 && echo OK
  ```

### Playbook 2 — Web UI only (Fios CR1000A, generic admin panels)

When there's no API. Last resort. The risk is the new password value landing in `form_input value=NEW` tool-call args. The clipboard pattern routes around this: PowerShell sets the clipboard from a value never displayed, Chrome MCP pastes via `Ctrl+V` keystroke, value never appears in any tool argument.

> [!warning] **Fios CR1000A precondition: Alton has no admin credential today.** Per `sartor/memory/reference/federated-memory-map.md` (2026-05-02), Verizon retains admin to the CR1000A. Sticker default `6GDPD3G3H` was tried during the 2026-05-01 takeover and did not work. Recovery options: (a) factory-reset CR1000A via the rear pinhole — loses Verizon-side provisioning, requires a phone call to re-provision; (b) call Verizon support for an admin reset; (c) pivot to UCG-Pro and put CR1000A in bridge mode (admin moot). Until one of these happens, Playbook 2 cannot be exercised against Fios. The playbook is still correct for a future Fios reset and for any other web-only admin panel.

**The generic clipboard pattern.** PowerShell value-in-variable, never displayed; Chrome MCP focuses the field via `mcp__claude-in-chrome__computer` click, then `mcp__claude-in-chrome__shortcuts_execute` sends Ctrl+V; after submit, clipboard is cleared.

```powershell
# Single PowerShell session; the value stays in $pw, never displayed, never logged
$pw = & "C:\Users\alto8\Sartor-claude-network\scripts\sartor-secret.cmd" read 'Fios admin'
Set-Clipboard -Value $pw
# Hand off to Chrome MCP: click the password input field, then send Ctrl+V keystroke
# After form submit, clobber the clipboard:
Set-Clipboard -Value ' '
Remove-Variable pw
[GC]::Collect()
```

**Concrete Chrome MCP invocation pattern** (load via `ToolSearch` first per the chrome-automation skill):

1. `mcp__claude-in-chrome__navigate` to the change-password URL (or the admin page, then click through).
2. `mcp__claude-in-chrome__find` with a description like "old password input" to locate the field; capture its element id.
3. `mcp__claude-in-chrome__computer` click on the located field. **Do NOT use `form_input value=...`** — that puts the secret in the tool-call argument, which is the entire failure mode this pattern avoids.
4. `mcp__claude-in-chrome__shortcuts_execute` with `keys: "Ctrl+V"` (or, fallback, `mcp__claude-in-chrome__javascript_tool` to fire a synthetic paste event).
5. Repeat for new-password and confirm-new-password fields, with PowerShell `Set-Clipboard` re-set between fields if values differ.
6. Submit via click; verify success by re-navigating and reading page text via `mcp__claude-in-chrome__get_page_text`.

**Generic flow checklist:**
1. Generate + save-to-vault as in the migration recipe (steps 2-4 above).
2. Drive Chrome MCP to the password-change page.
3. Set OLD password into clipboard via PowerShell; paste into OLD field; **clear clipboard** (`Set-Clipboard -Value ' '`).
4. Set NEW password into clipboard; paste into NEW + confirm fields; **clear clipboard**.
5. Submit.
6. Verify: log out, log back in via the same clipboard pattern. If re-auth succeeds, value is correct in both vault and service. If it fails, you're stranded — see hygiene rule #6 (vault save FIRST means at least the vault has it).
7. **Final clipboard clobber + GC** before ending the PowerShell scope.

**Verifying the new password without leaving it visible.** The Fios CR1000A admin presents a logout link in the top nav; logout drops you back to the login page; pasting the new value via the same clipboard pattern and getting a 200 + admin landing page is sufficient verification. Do not use `Get-Clipboard` to inspect — that prints the value to PowerShell's stdout, which lands in shell history.

**Fios CR1000A specifics (Vue.js SPA):**
- Self-signed cert; expect a Chrome interstitial. The chrome-automation profile already trusts it after the first manual through-click.
- Some Verizon firmware revisions require **re-authentication on the change-password form itself** (current password as an extra third field). Treat this as a "yes" — populate from clipboard with the OLD value, paste, then move on.
- CSRF tokens are embedded in the page DOM as a hidden input; the Vue.js form picks them up automatically when you click-and-paste into the visible inputs. You should NOT need to pull the CSRF token explicitly.
- The admin SPA aggressively redirects on session timeout — keep the session alive by working in a single Chrome MCP run.

**Status: sketched, not yet executed.** Run will happen the first time we have an admin credential to work with. Update this section after.

### Playbook 3 — UniFi controller API (or MongoDB-direct fallback)

UniFi controller exposes `/api/...` endpoints with cookie-based auth from `/api/login`. The login JSON shape is verified from the 2026-05-01 takeover work: `{"username": "...", "password": "...", "remember": false}` (NOT `strict:true` — that's a different concept; `remember` is the persistent-cookie flag and `false` is correct for a one-shot rotation).

```bash
# 1. Login (POST credentials, capture session cookie)
USER_VAL="$(sartor-secret read 'UniFi superadmin' --field username)"
PASS_VAL="$(sartor-secret read 'UniFi superadmin')"
USER_VAL="$USER_VAL" PASS_VAL="$PASS_VAL" python3 -c "import os,sys,json; sys.stdout.write(json.dumps({'username': os.environ['USER_VAL'], 'password': os.environ['PASS_VAL'], 'remember': False}))" > /tmp/.unifi-login.json
chmod 600 /tmp/.unifi-login.json

curl -k -s -c /tmp/.unifi-cookie.txt -X POST \
    -H "Content-Type: application/json" \
    --data @/tmp/.unifi-login.json \
    "https://192.168.1.171:8443/api/login"
chmod 600 /tmp/.unifi-cookie.txt
unset USER_VAL PASS_VAL
rm -f /tmp/.unifi-login.json

# 2. Find the admin account ID
curl -k -s -b /tmp/.unifi-cookie.txt "https://192.168.1.171:8443/api/stat/admin" \
    | python3 -c "import sys,json; [print(a.get('_id'), a.get('name'), a.get('email')) for a in json.load(sys.stdin)['data']]"

# 3. Change password — verify the right endpoint for your version (see caveat below).
#    Best-known shape for v8.x super-admin self-edit:
NEW="$(bw generate --uppercase --lowercase --number --special --length 32)"
NEW="$NEW" python3 -c "import os,sys,json; sys.stdout.write(json.dumps({'x_password': os.environ['NEW']}))" > /tmp/.unifi-patch.json
chmod 600 /tmp/.unifi-patch.json

curl -k -s -b /tmp/.unifi-cookie.txt -X PUT \
    -H "Content-Type: application/json" \
    --data @/tmp/.unifi-patch.json \
    "https://192.168.1.171:8443/api/s/default/admin/<admin_id>"
# Update vault BEFORE the call too — see hygiene rule #6.

# 4. Cleanup
rm -f /tmp/.unifi-cookie.txt /tmp/.unifi-patch.json
unset NEW
```

> [!caution] **API endpoint shape NOT verified at the time of this skill's writing.**
> UniFi has shipped at least three different admin-management API shapes across v6/v7/v8. The known-good ones across versions:
> - `PUT /api/s/default/admin/<admin_id>` with `{"x_password": "..."}` — most common in v7-v8.
> - `POST /api/cmd/sitemgr` with `{"cmd": "update-admin", "admin_id": "...", "x_password": "..."}` — also accepted in some v7/v8 builds.
> - `PUT /api/users/self` — for self-update, sometimes restricted to non-super-admin roles.
>
> First-time runners: probe with a no-op `GET /api/stat/admin`, eyeball the JSON, then try the v8 `PUT` shape above with verbose logging. If it returns a non-zero `meta.rc` (i.e. anything but `"ok"`), fall back to the `cmd/sitemgr` shape. Capture which one worked here after first execution.

**MongoDB-direct fallback (Plan B).** The UniFi controller backs onto `mongodb://127.0.0.1:27117/ace` with no auth (loopback only — host access to Rocinante IS the credential). When the API misbehaves, the admin password lives in the `admin` collection as a bcrypt hash in the `x_shadow` field (NOT a reversible password). Set a new bcrypt hash directly and the controller picks it up immediately:

```python
# On Rocinante. NEW value via environment, never argv. Generates the hash
# from the value already in the vault — never types it on the command line.
import os, bcrypt
from pymongo import MongoClient  # pymongo<4 because UniFi MongoDB is wire-version 6

NEW = os.environ['NEW']  # set by caller via: NEW="$(sartor-secret read 'UniFi superadmin')" python3 ...
hashed = bcrypt.hashpw(NEW.encode(), bcrypt.gensalt(rounds=10)).decode()

db = MongoClient('mongodb://127.0.0.1:27117').ace
db.admin.update_one({'name': 'alton'}, {'$set': {'x_shadow': hashed}})
del NEW, hashed
```

The MongoDB path is more reliable than the API across UniFi version bumps because the schema is stable. It's also the only path when the controller's HTTP layer is misbehaving (e.g., during a Spring boot reload).

**Status: sketched + MongoDB fallback designed but not yet executed.** Update this section after first UniFi rotation runs.

### Playbook 4 — Linux user account on a peer

**Sartor peers: this playbook is essentially never needed.** Verified 2026-05-03 on gpuserver1: `alton` has `(ALL) NOPASSWD: ALL` configured. The user password is never prompted for `sudo`. SSH key auth handles login. Same applies to rtxserver per `MACHINES.md`.

The only Sartor scenario where you'd actually rotate a Linux user password:
- A peer is breached and the bcrypt hash in `/etc/shadow` is suspected leaked.
- A locally-physical-access attacker is in the threat model and console-login-without-key matters.
- A Sartor service genuinely requires interactive password (none today).

For non-Sartor servers (third-party VPS, school admin lab, etc.) the recipe is:

```bash
# Push the new password to the user via chpasswd, value via env so it doesn't land in argv on the local side.
NEW="$(sartor-secret read 'Linux <hostname> alton')"
ssh -T alton@<peer> "sudo chpasswd" <<<"alton:$NEW"
unset NEW
# Note: the NEW value still transits SSH (encrypted), and lands in chpasswd's stdin (not argv).
# Avoid `passwd` interactive — it expects a tty and the old-pwd-confirm dance.
```

Skip this playbook for Sartor unless explicitly asked.

### Playbook 5 — Generic API with Basic auth or bearer token

Template for new services. Adapt the curl invocation:

```bash
NEW=$(sartor-secret read '<vault item>')
OLD=$(... obtain from vault if previously migrated, else from a temp file ...)

# Build patch body in mode-600 file — value never in argv
NEW="$NEW" python3 -c "import os,sys,json; sys.stdout.write(json.dumps({'<password-field-name>': os.environ['NEW']}))" > /tmp/.patch.json
chmod 600 /tmp/.patch.json

# PATCH/PUT/POST as the API requires.
# Use --data-binary @file (NOT --data @file) — --data strips newlines and can corrupt some bodies.
curl <auth-flag> --data-binary @/tmp/.patch.json -H "Content-Type: application/json" "<URL>"

# Verify (re-auth with new value)
# Cleanup
rm -f /tmp/.patch.json
unset NEW OLD
```

**Shell-special characters in secrets.** Bitwarden's generator can produce values containing `$`, backtick, `!`, `\`, single-quote, double-quote — all of which have meaning in bash. Two safety patterns:
- **Always pass via env, not argv.** `NEW="$(sartor-secret read X)"; some-command "$NEW"` is fine because `"$NEW"` is one fully-quoted argv slot. `some-command $NEW` (unquoted) is wrong and will mis-tokenize on whitespace.
- **For embedding in JSON:** use Python with `json.dumps()` (as in the template) — never `printf '%s'` or `sed` substitution. JSON requires escapes for `"`, `\`, control chars; `json.dumps` handles all of them. Equivalent for embedding in URLs: `python3 -c "import os,urllib.parse;print(urllib.parse.quote(os.environ['NEW'],safe=''))"`.
- **For ssh remote command:** `ssh peer "cmd $NEW"` mis-quotes (the value gets re-parsed by the remote shell). Use stdin: `ssh peer cmd <<<"$NEW"` or `ssh peer "cmd \"\$NEW\""` with the variable expanded only once on the remote side. The `chpasswd <<<"user:$NEW"` pattern in Playbook 4 is correct.

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
- **Fios admin: not currently held.** Either factory-reset the CR1000A (loses Verizon-side provisioning), call Verizon for an admin reset, or pivot to UCG-Pro + bridge mode. Tracked in `unifi-takeover-2026-05-01-INDEX.md` UCG-Pro section.
- **UniFi rotation: API endpoint shape needs first-execution validation.** Playbook 3's `PUT /api/s/default/admin/<id>` shape is best-known-but-unverified for v8.x. First runner: probe + log the working endpoint here.
- **BMC gpuserver1 verification.** Whether the i9-14900K motherboard in gpuserver1 has a BMC at all. If yes, add to inventory. If no, drop the row.

## Auditor notes

Audit pass 2026-05-03 (auditor-Claude): walked all 5 playbooks, decision tree, hygiene rules, wrapper. Verified live: `sartor-secret status/read/list/not-found` paths all return correct exit codes. Confirmed `(ALL) NOPASSWD: ALL` for `alton` on gpuserver1 (Playbook 4 is essentially never needed for Sartor). Confirmed CR1000A admin precondition gap (Alton has no credential). UniFi controller reachable; admin-update endpoint shape NOT live-verified (no vault item to test with — `UniFi superadmin` migration still pending). Confirmed UniFi MongoDB at `127.0.0.1:27117/ace` is the documented Plan B. Wrapper changes: better error pattern matching for `bw` error strings, new `list` subcommand returning names only.

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
