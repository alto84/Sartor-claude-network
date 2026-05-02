---
name: search-memory-first
description: Always search the FEDERATED Sartor wiki before treating any name/entity as unknown. Memory lives in sartor/memory/ AND work/ AND dashboard/ AND archive/ — search all four before flagging "no record." Triggered 2026-05-02 by the 185 Davis incident.
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/search-first, memory/federated]
---

# Search the federated wiki first; "no record" is hard to claim

When a previously-unmentioned name, entity, address, account, or document surfaces in a session — **before** treating it as unknown, search the entire Sartor wiki for it.

**The actual scope of "the wiki" is federated, not just `sartor/memory/`:**

| Location | What lives there |
|---|---|
| `sartor/memory/` | Primary memory tree — facts, projects, people, machines |
| `work/taxes/` | Tax-specific docs, document inventories, CPA correspondence |
| `work/family/` | Family-specific reference (school, important docs, medical references) |
| `dashboard/family/` | Live JSON state for finances, calendar, health (`finances.json`, `update_finances.py` line items) |
| `sartor/conversation_extract.py` | Explicit term → memory-file mappings (e.g., `"Leader Bank": ("BUSINESS.md", "business", "185 Davis")`) |
| `archive/` | Old material — sometimes the only place a fact still lives |

A `Grep` across the whole repo (no `path` restriction) is the cheapest first move. Cost is sub-second; cost of false-unknown is a wrong answer to Alton.

**Why:** Alton 2026-05-02, after I surfaced "185 Davis" from a Google Drive catalog as if it were unknown:

> "185 davis is our rental property. Noted in taxes if you can put the pieces together. I think this is the type of thing that 1. we could ask the family wiki, 2. you always know to do this first for these types of questions."

The Drive subagent had been told to search only `sartor/memory/**`; it correctly reported nothing there. Rocinante (me) then accepted "no record" without re-checking the broader federation. 185 Davis was documented in 5+ places under `work/taxes/` + `work/family/` + `dashboard/`.

**How to apply:**

1. **First pass: federated grep.** `Grep` for the term across the WHOLE repo (no `path:` filter). Sub-second.
2. **If grep hits exist:** read at least 2-3 of them before declaring you understand the entity. Pieces fit together — a 1098 + a Vermont Mutual condo policy + a "rental" line item in finances.json adds up to "rental condo, jointly owned, mortgaged through Leader Bank."
3. **If grep returns zero:** check whether your search pattern was overly narrow. Try synonyms (`"185 Davis"`, `"Davis Avenue"`, `"185 Davis Ave"`), variant capitalizations, partial matches.
4. **If still zero:** then it's truly new. Surface to Alton with "I searched X, Y, Z patterns across the full repo — nothing found. Can you confirm this is new?"
5. **Subagent directives must scope to the federation** by default. If you delegate "is X already known?" to a subagent, write the search scope as `C:\Users\alto8\Sartor-claude-network\` (the whole repo) NOT just `C:\Users\alto8\Sartor-claude-network\sartor\memory\`.

**Counter-pattern (don't do this):** Trust a subagent's "no record found" without checking what scope it actually searched. The subagent's report should always state which paths it covered; if not, ask.

**See also:** `feedback/proactive-error-cleanup.md` (catching errors when you see them), `feedback/completeness-principle.md` (related — don't half-answer when full answer is in reach).
