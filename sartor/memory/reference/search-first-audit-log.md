---
name: search-first-audit-log
description: Running log of incidents where Rocinante or a subagent treated something as unknown when it was actually documented in the federated wiki. Maintained by the search-first-auditor teammate of the memory-agents team. Each entry is a learning opportunity for rule-author.
type: audit-log
status: living-document
created: 2026-05-02
updated: 2026-05-02
created_by: search-first-auditor (memory-agents team)
related: [search-memory-first, federated-memory-map]
tags: [meta/audit, memory/federated, behavior/search-first]
---

# Search-first audit log

Each entry: an instance where a "no record / not documented / memory has no" claim was made in a Sartor session, and the term turned out to actually be in the federated wiki (`sartor/memory/` + `work/` + `dashboard/` + `archive/` + `sartor/conversation_extract.py`).

Goal: surface patterns of *how* the misses happen so the rule-author teammate can write feedback rules that actually prevent them, and the cartographer teammate knows where coverage is thin.

Format: timestamp, claim, actual location, failure pathology, lesson.

---

## 2026-05-02 — Drive cataloging session (single subagent run, 5 incidents)

All five incidents below trace to one subagent invocation: a Chrome-MCP-driven Google-Drive enumeration whose directive scoped "is this already in memory?" checks to `sartor/memory/**` only. The subagent's report was internally consistent given that scope. Rocinante then surfaced the report's "open questions" to Alton without re-checking against the broader federation. Alton corrected with: *"185 davis is our rental property. Noted in taxes if you can put the pieces together. I think this is the type of thing that 1. we could ask the family wiki, 2. you always know to do this first for these types of questions."*

The pattern is **not five independent failures** — it is **one scoping bug producing five visible symptoms** in a single subagent's output.

### Incident #1 — 185 Davis Avenue (canonical trigger)

- **Claimed:** "TY2025 1098 from LeaderBank for '185 Davis' surfaced; **memory currently has no record of this**. Likely a still-owned MA condo or Aneeta's pre-marital property."
- **Actual:** Documented as a jointly-owned rental condo, mortgaged through Leader Bank, insured through Vermont Mutual condo policy, in:
  - `work/taxes/reference/document-inventory.md`
  - `work/family/reference/important-docs.md` (line 123: Vermont Mutual Condo Policy 185 Davis Avenue)
  - `dashboard/family/finances.json` and `dashboard/family/update_finances.py`
  - `sartor/conversation_extract.py:406` — explicit `"Leader Bank": ("BUSINESS.md", "business", "185 Davis")` mapping
- **Where it surfaced:** `sartor/memory/reference/google-drive-catalog-2026-05-02.md` open-questions #1, then headline finding in Rocinante's status message to Alton
- **Failure pathology:** subagent directive scoped search to `sartor/memory/**` only; Rocinante didn't re-verify before surfacing
- **Lesson:** subagent scoping must default to the whole repo; "no record" claims need a federated-grep before passing through the orchestrator

### Incident #2 — Selective insurance (homeowners) on 85 Stonebridge

- **Claimed:** "Selective insurance (homeowners) policy — exists on local Downloads (`85 stonebridge Montclair NJ insurance Oct 2024-Oct2025.pdf`) but **NOT yet uploaded to Drive**. Should it be uploaded? If yes, into the 85 Stonebridge folder structure or the existing 'Car' insurance folder?"
- **Actual:** The Selective Insurance policy is already cataloged in `work/family/reference/important-docs.md` lines 120 and 122 (`Selective insurance 85 stonebridge.pdf` + `10-23-25 Selective insurance 985 payment.pdf`). The catalog claim was about Drive presence, but the *implicit framing* — that this is an unknown insurance carrier needing a memory home — is the missed search. Memory already knows Selective is the homeowners carrier on 85 Stonebridge.
- **Where it surfaced:** `google-drive-catalog-2026-05-02.md` open-questions #3
- **Failure pathology:** same single-subagent scoping bug; secondary issue is that "is X in Drive?" got conflated with "is X known to memory?" — separate questions, both worth answering
- **Lesson:** when asking "is this document in Drive?" also explicitly answer "is the underlying *fact* in memory?" — different questions, different scopes

### Incident #3 — UTMA account numbers (5390 Vayu / 5392 Vishala / 5396 Vasu)

- **Claimed (in privacy-flag #8 of catalog open-questions):** "UTMA account numbers (5390 Vayu / 5392 Vishala / 5396 Vasu) — visible in 1099 filenames. **Memory currently doesn't store these**; recommend keeping out of any committed file."
- **Actual:** All three account-number suffixes are explicitly stored in:
  - `sartor/memory/TAXES.md:104-106` — `1099 Fidelity UTMA 5390 Vayu`, `5392 Vishala`, `5396 Vasu`
  - `work/taxes/reference/document-inventory.md:60-61` — `Fidelity 1099 UTMA #5390`, `#5392`
- **Where it surfaced:** `google-drive-catalog-2026-05-02.md` privacy-flag list
- **Failure pathology:** same subagent-scoping bug; the numbers were even in `sartor/memory/`, which suggests the subagent didn't actually grep `sartor/memory/` either — possibly only consulted the files it loaded into context for cataloging, not the whole tree
- **Lesson:** even when scope is set to `sartor/memory/**`, "didn't appear in my prompt context" is not the same as "isn't in `sartor/memory/`." A `Grep` over the directory is the cheap definitive answer

### Incident #4 — Climate First Bank $219K disbursement

- **Claimed:** "Climate First Bank loan disbursement — the prequalification + boilerplate Terms/Conditions are in Drive (Oct 24, 2025), but **the actual $219K disbursement statement is not**. Likely in Gmail. Want me to search Gmail for the Climate First disbursement letter and add the reference?"
- **Actual:** The disbursement *event* is documented to the dollar and date in `sartor/memory/business/solar-inference.md:21` — *"$219,414.50 released from Climate First Bank to Lucent Energy around 2026-03-15."* The bank-issued PDF letter being absent from Drive is a real artifact-question; the framing that this is a memory-side gap is not.
- **Where it surfaced:** `google-drive-catalog-2026-05-02.md` open-questions #4
- **Failure pathology:** artifact-vs-fact conflation. The catalog conflated "I can't find the bank's PDF" with "we don't track this disbursement" — the second statement is false
- **Lesson:** when reporting a missing artifact, separate "no PDF in Drive" from "no record of the underlying event in memory." The two questions need separate answers

### Incident #5 — Catalog headline-summary echo

- **Claimed (in Rocinante's status report to Alton):** "Discovery: 185 Davis property — TY2025 1098 from LeaderBank for '185 Davis' surfaced; memory currently has no record of this."
- **Actual:** same as Incident #1
- **Where it surfaced:** Rocinante's main-thread reply to Alton, lines 13422 / 13424 / 13575 / 13582-13583 of `d920f507-391d-4d21-9a8c-dce4bbe1c2fe.jsonl`
- **Failure pathology:** orchestrator (Rocinante) accepted the subagent report without re-running the federated check. This is the failure that drew Alton's correction
- **Lesson:** the orchestrator's job is not to repeat the subagent's report verbatim; it is to verify the highest-stakes claims. "Memory has no record" is a high-stakes claim because the whole point of the wiki is to compound; flagging a real fact as new wastes Alton's time and pollutes future memory

---

## Cross-incident pattern (2026-05-02)

All five symptoms collapse to **one root cause + one amplifier**:

- **Root cause:** subagent search scope was `sartor/memory/**`, not the federated wiki (`sartor/memory/` + `work/` + `dashboard/` + `archive/` + `sartor/conversation_extract.py`)
- **Amplifier:** orchestrator passed the subagent's "no record" claims through without re-verifying any of them against the broader scope. Five claims in a row, all wrong on the same axis, none caught.

A single `Grep` per term across the whole repo (zero `path:` filter) would have caught all five before they reached Alton.

Subagent directives that ask "is X already known?" should bake the federated scope into the prompt, not leave it implicit.

The orchestrator's fail-safe is: any subagent claim of the form "memory has no record" / "not in memory" / "previously absent" is a high-stakes claim that triggers a cheap federated `Grep` before the claim leaves the orchestrator's mouth. Rocinante didn't run that check today.

---

## Patterns observed (running list, append per audit)

1. **Subagent narrow-scope bug** — directives scoped to `sartor/memory/**` produce false-unknown reports because the federation extends past that directory. Five symptoms, one cause, on 2026-05-02.
2. **Orchestrator pass-through** — orchestrator surfaced subagent claims without re-verifying high-stakes "no record" assertions. Cheapest fix: a 1-line `Grep` over the full repo before any claim of unknown-ness leaves the orchestrator.
3. **Artifact-vs-fact conflation** — "I can't find the PDF in Drive" conflated with "we don't track this fact." The two questions need separate answers; the second is the load-bearing one for memory-state claims.
4. **Selection bias inside the subagent's own context** — even when scope is set correctly, "didn't appear in my prompt context" is not the same as "isn't in the directory." A directory `Grep` is the definitive check.

---

## Method (for future runs of this auditor)

1. List session jsonls under `C:\Users\alto8\.claude\projects\C--Users-alto8\` since the last audit-log entry
2. Across each, `Select-String` for the unknown-claim pattern family (`no record`, `memory currently has no`, `memory has no`, `not in memory`, `couldn't find`, `previously-unmentioned`, `absent from memory`, `nowhere in memory`, `treated as unknown`, `not yet in memory`, `first appearance`)
3. For each candidate, `Grep` the whole repo (no `path:` filter) for the term
4. If hits exist → audit incident; record claim, location, pathology, lesson
5. If grep returns zero → genuinely unknown, skip
6. Distinguish *artifact* misses (PDF/email not found at expected location) from *memory-state* misses (the underlying fact is or isn't tracked); the latter is the audit's primary target
7. Recognize echoes — if N claims trace to one subagent run, file as one incident-cluster with N symptoms, not N independent failures

Don't double-count subagent transcripts that themselves *are* this auditor's transcript. Self-reference produces noise.

---

## Run history

| Date | Window covered | Sessions scanned | Incidents added | Notes |
|---|---|---|---|---|
| 2026-05-02 | 2026-04-26 → 2026-05-02 (7 days) | 5 jsonls (3 large, 2 stub); main-thread `d920f507` and 5 subagent transcripts | 5 (all one cluster, single subagent run) | Initial run. All five symptoms trace to the Drive-catalog subagent's narrow scope. Pattern documented in feedback/search-memory-first.md the same day. |
