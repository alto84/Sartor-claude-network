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
| 2026-05-02 (extended pass, same evening) | 2026-04-19 → 2026-05-02 (14 days) + peer-machine inboxes | +2 Rocinante main jsonls (`ba85a964` 2026-04-25, `a7db7604` 2026-04-22), today's other Rocinante jsonl `2451d707` and ~80 of its `family-thread` subagents, ~14 phone-home / RESUME / decisions files in `inbox/rtxpro6000server/`, `inbox/gpuserver1/`, `inbox/rocinante/` | 1 (new class: federation-sync stale-claim) | Direction-1 + Direction-2 sweep per team-lead nudge. 14-day Rocinante window beyond the original 7d was clean. The big family-thread session (`2451d707`) had ~80 subagents but its hits were all echoes of the single 185 Davis cluster, not new incidents. New finding is the federation-sync class — see Direction 1 & 2 sections below. |

---

## Direction 1 — peer-machine inboxes (extended 2026-05-02)

### Incident #6 — `rtxserver-vastai-watch.md` "open caveats" stale-citation

- **Claimed (`projects/rtxserver-vastai-watch.md:303-304`, written 2026-05-02 by vast-ai-watcher):** *"The brief that spawned this tracker references three on-disk seed files (`inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`, `machines/rtxpro6000server/MISSION-v0.1.md`, `projects/rtx-stress-design-2026-05-02.md`) and a pause commit (`6cee210`). **None exist in the current tree as of 2026-05-02 evening.**"*
- **Actual (verified 2026-05-02 by this auditor):**
  - `sartor/memory/inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md` — **EXISTS**
  - `sartor/memory/machines/rtxpro6000server/MISSION-v0.1.md` — **EXISTS**
  - `sartor/memory/projects/rtx-stress-design-2026-05-02.md` — **EXISTS**
  - Plus the related decisions file `inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md` — also EXISTS
- **Where it surfaced:** the `Open caveats` block of the tracker file itself, presented as a known-state limitation. Anyone reading the tracker would conclude the seed work hasn't landed on Rocinante.
- **Failure pathology:** **federation-sync stale-claim.** The vast-ai-watcher subagent ran when the seeds genuinely weren't yet on Rocinante (peers hadn't pushed, or the curator hadn't pulled). The "missing" claim was true at that instant. By the time another agent or a human reads the tracker, the seeds have landed — but the caveat-block text doesn't update itself. The artifact rots in place and continues asserting a fact that is no longer true. This is structurally different from the 2026-05-02 cluster: the subagent did NOT have a scoping bug, the claim was correct at write-time, and the failure mode is post-write decay.
- **Lesson:** any "missing on $hostname" / "not in the current tree" claim has a half-life. If it survives more than one cross-machine sync cycle (typically <1 day at current cadence), it should be either re-verified-and-removed or re-verified-and-confirmed. The tracker's own refresh-trigger list explicitly says "refresh on commits touching `inbox/rtxserver/`" — that trigger should also re-verify the open-caveats stale-claims, not just the activity log.
- **Note for cartographer:** when building `federated-memory-map.md`, mark this kind of caveat-block-claim as a class that needs a freshness-stamp. Suggested format: `> [!stale-as-of] 2026-05-02T<HH:MM>Z — re-verify before relying`.

### Phone-home files scanned, no incidents

- `inbox/rtxpro6000server/PHONE-HOME-stress-2026-05-02-anomaly.md` — pure thermal-data report, zero memory-state claims. Clean.
- `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md` — every cited path now exists on Rocinante (10/10 paths verified). Clean as of audit time.
- `inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap.md` — exists; not opened (low priority for this pattern).
- `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` — **does not exist on Rocinante.** The tracker file references this path as a "self-contained replication dump" written by gpuserver1's peer Claude. Either gpuserver1 has not yet pushed it, or it lives only on gpuserver1 / the rtxserver-bare repo and Rocinante hasn't pulled. Cannot audit a file that isn't in the local tree. **This itself is a federation-sync observation worth noting:** the tracker cites paths from peers that may not yet exist on Rocinante's checkout. Not added as a separate incident; it's the same root pathology as #6, just from the tracker's perspective rather than its own caveat block.
- All other peer inbox files in the 14-day window (`inbox/rtxpro6000server/PHONE-HOME-*`, `inbox/gpuserver1/2026-04-23_*`, `2026-04-24_*`, `inbox/rocinante/PHONE-HOME-*`, `2026-04-2*_*`) — clean for the unknown-claim pattern family.

---

## Direction 2 — extended Rocinante window (14 days, 2026-04-19 → 2026-05-02)

### Sessions scanned

- `ba85a964-4b72-4f97-af5e-a9412a96fd5b.jsonl` (2026-04-25, 829K) — **0 hits** for the unknown-claim patterns
- `a7db7604-672b-4612-aa47-3a0af3b84c2f.jsonl` (2026-04-22, 87K) — **0 hits**
- `2451d707-4a22-4868-8ae5-6afe0ad4acdd.jsonl` (today's other Rocinante session, the family-thread long-running one, 1.4MB main thread) — **0 hits** in main thread; ~80 subagent transcripts all spawned by `team-lead` for `family-thread` work (`family-curator`, `dashboard-keeper`, `dashboard-engineer`, `memory-engineer`, `memory-cartographer`, `pipelines-auditor`, `cron-engineer`, `mercury-explorer`). Six of these flagged in pattern-grep, but all hits trace to **echoes of the 2026-05-02 185-Davis correction notice** that those subagents read while consuming the federated wiki, not new claims.
- `d920f507-...jsonl` (today's main session) — already audited in the initial pass.
- Subagent transcripts of `d920f507`'s `search-first-auditor` and `rule-author` runs — self-reference (this auditor's own transcript echoing trigger phrases from the directive).

### Wrong-location-pointer search

Scanned `d920f507` for `see <X>.md`, `noted in`, `tracked in`, `documented in`, `recorded in`, `should be in`, `belongs in`, `should live in`, `wrong file`, `misfiled`, etc. 131 raw hits; spot-check on top-frequency offenders showed all were legitimate citations (e.g., "see TAXES.md for X" where X was actually in TAXES.md). No wrong-location-pointer incidents found in this window.

The wrong-location-pointer class is genuinely rare in current sessions, OR my pattern set was too coarse to catch it. Recommend cartographer's federated-memory-map work surface candidate wrong-location-pointer instances by cross-referencing wikilink targets against actual file content, not by transcript scanning.

### Net incident count for extended pass: 1 (federation-sync stale-claim, Incident #6)

---

## Updated cross-incident pattern (2026-05-02, post-extended-pass)

The pattern observation list now reads:

1. **Subagent narrow-scope bug** — directives implicitly meaning `sartor/memory/**`. 5 incidents (Drive catalog cluster).
2. **Orchestrator pass-through** — orchestrator surfacing subagent claims without a verify-step. 1 amplifier incident (the 185 Davis echo to Alton).
3. **Artifact-vs-fact conflation** — "PDF not in Drive" treated as "fact not in memory." 1 incident (Climate First disbursement).
4. **Selection bias inside subagent's own context** — "didn't appear in my prompt context" confused with "isn't in the directory." 1 incident (UTMA account numbers).
5. **NEW: federation-sync stale-claim** — a "missing on $hostname" / "not in the current tree" claim that was correct at write-time but has decayed because peer-syncs landed afterwards and the artifact-text doesn't refresh itself. 1 incident (the vast-ai-watcher tracker's open-caveats block).

Patterns 1-4 are write-time errors. Pattern 5 is a read-time error: the claim was honestly written but is now stale, and consumers reading the file get misled.

The implication for rule-author: pattern 5 is not solved by a federated-grep-before-claim discipline. It needs **freshness stamping on caveat-block claims** + a refresh-trigger that re-verifies them (similar to the `Recent activity` log being updated, but for the negative-state claims). Worth a separate feedback rule.
