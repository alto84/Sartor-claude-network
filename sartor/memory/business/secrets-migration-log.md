---
name: secrets-migration-log
description: Log of credential migrations into the Bitwarden vault. Append-only. Records dates, services, and rotation method. NEVER contains values.
type: log
created: 2026-05-03
updated: 2026-05-03
tags: [meta/secrets, business/infrastructure]
related:
  - .claude/skills/secrets-via-bitwarden/SKILL.md
---

# Secrets migration log

Append-only record of credentials moved into the Bitwarden vault. References secrets by name, never by value.

| Date | Vault item name | Service | Method | Notes |
|---|---|---|---|---|
| 2026-05-03 | `BMC rtxserver` | ASUS WRX90E-SAGE SE BMC at 192.168.1.156, account 4 (`admin`) | Redfish PATCH `/AccountService/Accounts/4` with `If-Match` ETag header, 20-char generated, OLD-pwd auth for the rotation, NEW-pwd verified via subsequent GET. Leaked-source: was "household default" entered in `d920f507.jsonl:8805` Apr 29 + auto-tried at line 14966 May 2. Old value confirmed rejected (HTTP 401) post-rotation. | First migration. Discovered AMI MegaRAC quirks: `MaxPasswordLength=20` and `If-Match` required for PATCH. Skill updated with both. |

