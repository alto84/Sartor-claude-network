---
name: secrets-migration-log
description: Log of credential migrations into the Bitwarden vault. Append-only. Records dates, services, and rotation method. NEVER contains values.
type: log
created: 2026-05-03
updated: 2026-05-13 (added Meridian dashboard import)
tags: [meta/secrets, business/infrastructure]
related:
  - .claude/skills/secrets-via-bitwarden/SKILL.md
---

# Secrets migration log

Append-only record of credentials moved into the Bitwarden vault. References secrets by name, never by value.

**Schema for each row:** Date | Vault item name (matches the vault) | Service description (URL/host/account) | Method (which playbook + concrete API/path used + leaked-source fingerprint + post-rotation verification) | Notes (vendor quirks, follow-ups, lessons).

| Date | Vault item name | Service | Method | Notes |
|---|---|---|---|---|
| 2026-05-03 | `BMC rtxserver` | ASUS WRX90E-SAGE SE BMC at 192.168.1.156, account 4 (`admin`) | Playbook 1 (Redfish PATCH `/AccountService/Accounts/4` with `If-Match` ETag header). 20-char generated, OLD-pwd auth for the rotation, NEW-pwd verified via subsequent GET. Leaked-source: "household default" entered in `d920f507.jsonl:8805` Apr 29 + auto-tried at line 14966 May 2. Old value confirmed rejected (HTTP 401) post-rotation. | First migration. Discovered AMI MegaRAC quirks: `MaxPasswordLength=20` and `If-Match` required for PATCH. Skill updated with both. |
| 2026-05-04 | `UniFi superadmin` | UniFi local controller at 192.168.1.171:8443, admin user `alton` (super flag). Same credential controls all 9 UniFi devices (1 switch + 8 APs) via the controller. | **Playbook 3 fallback: MongoDB direct write.** All 6 UniFi REST endpoint shapes tried (`PUT /api/s/default/rest/account/<id>`, `PUT /api/s/default/admin/<id>`, `POST /api/s/default/cmd/sitemgr`, `PUT /api/admin/<id>`, `PUT /api/s/default/self`, `PUT /api/users/self`) returned `api.err.IdInvalid` / `api.err.InvalidObject` / `api.err.NoSiteContext` on UniFi controller v10.3.55. Switched to direct write of `db.admin.x_shadow` field via `pymongo.MongoClient("mongodb://127.0.0.1:27117")`. 24-char generated. Leaked-source: `unifi-takeover-2026-05-01.md` credentials table (line ~45). Old value confirmed rejected (HTTP 400) post-rotation. | **CRITICAL QUIRK: UniFi v8.x/v10.x uses SHA-512 crypt (`$6$<salt>$<hash>` format), NOT bcrypt.** Initial attempt with `bcrypt.hashpw(pw, gensalt(rounds=10))` produced `$2a$10$...` hash; controller rejected on next login (`api.err.Invalid`) — neither old nor new worked because bcrypt format isn't recognized by UniFi's auth path. Recovery: re-wrote with `passlib.hash.sha512_crypt.using(rounds=5000, salt_size=8).hash(pw)`, then stripped explicit `rounds=5000$` segment to match UniFi's implicit-rounds format `$6$<salt>$<hash>`. Final hash length: 98 chars. **Update Playbook 3 in secrets-via-bitwarden skill with this hash format.** Also hit Windows Python `crypt` module unavailability — `passlib` is the cross-platform fix. |
| 2026-05-13 | `Meridian dashboard` | MERIDIAN family dashboard at http://127.0.0.1:5055 (`dashboard/family/server.py`). Single-password cookie-auth on `/login`, no username. | **Import only (no rotation).** Value copied from on-disk runtime source `C:\Users\alto8\Sartor-claude-network\.secrets\meridian-password.txt` (gitignored, never in git history) into the vault as a new item. 20 chars, length-verified via `sartor-secret read` (value never echoed). File remains the runtime source — `server.py` still reads it directly. Migration is so the credential is manageable from Bitwarden going forward. | First non-rotation import. Open question: migrate `server.py` to read from `sartor-secret read 'Meridian dashboard'` at startup? Trade-off: vault-single-source + cross-machine portability VS post-reboot-vault-unlock-required friction. Tracked for Alton's decision. |


