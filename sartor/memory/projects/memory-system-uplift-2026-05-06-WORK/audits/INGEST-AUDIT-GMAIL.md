---
name: INGEST-AUDIT-GMAIL
description: Empirical audit of SartorGmailScan / personal-data-gather effectiveness, plus full spec for a proposed gmail-family-relevance-scan cron. Re-dispatched (narrow scope, Gmail only) after the original combined inspector stalled at the Gmail-Drive transition.
type: audit
status: complete
date: 2026-05-06
inspector: inspector-gmail
parent_plan: memory-system-uplift-2026-05-06-PLAN
mcp_calls_used: 8
mcp_call_budget: 30
keywords_probed: 8
window: 2026-04-29 to 2026-05-07 (7-day rolling)
day_files_sampled: 5 (2026-04-28, 2026-04-29, 2026-04-30, 2026-05-01, 2026-05-02)
---

# Gmail Ingest Audit

## Section 1 — Methodology

### Constraints honored

- Read-only on Gmail. No sends, no drafts, no labels.
- Hard cap 30 Gmail MCP calls — used 8.
- 8 highest-signal keywords (children, school, LLC, marquee equity, the BHS contractor, the GPU rental platform).
- 7-day window: `after:2026/04/29 before:2026/05/07`.
- 5 day-files sampled from `sartor/memory/daily/`: 2026-04-28 through 2026-05-02.
- No message bodies quoted into this audit. Patterns and counts only.

### What I measured

1. **Pipeline state** — does SartorGmailScan / personal-data-gather (the every-4h cron, defined in `.claude/scheduled-tasks/personal-data-gather/SKILL.md`) actually run, and if so, where do its outputs land?
2. **Output volume and quality** — what does a "typical" run produce? Frequency? Cadence? Information density per run?
3. **Coverage** — for the 8 probe keywords, how many threads exist in the live mailbox vs. how many made it into the curated outputs (daily logs, `family/active-todos.md`, `data/gather-alerts.md`)?
4. **Misses** — what did the pipeline fail to surface that it should have?
5. **False positives / noise** — what did it surface that wasn't worth a memory write?

### Key naming clarification

"SartorGmailScan" in the plan refers to the every-4h personal-data-gather scheduled task. The `ce-*` files in `inbox/rocinante/proposed-memories/<date>/` are NOT from this pipeline — those are from `SartorConversationExtract` (the rocinante-extractor that scans Claude Code session jsonl files for save-verb patterns). Two different pipelines, easy to confuse. This audit is about the Gmail one.

## Section 2 — Current SartorGmailScan output behavior

### Where outputs land (per the spec)

The spec at `.claude/scheduled-tasks/personal-data-gather/SKILL.md` declares 6 output destinations:

| # | Target | Purpose |
|---|---|---|
| 1 | `sartor/memory/daily/{date}.md` | Raw audit trail |
| 2 | `sartor/memory/{primary + 2-5 related pages}` | Karpathy-style cross-referenced fact routing |
| 3 | `sartor/memory/family/active-todos.md` | Action items as callouts |
| 4 | `sartor/memory/log.md` | Spine entry per run |
| 5 | `data/heartbeat-log.csv` | Liveness ping |
| 6 | `data/gather-alerts.md` | ACTION_REQUIRED ranked |

### Empirical state of each (as of 2026-05-06)

| Target | Last touched | State |
|---|---|---|
| `daily/{date}.md` | 2026-05-02 | **Stale 4 days.** No daily files for 2026-05-03, 04, 05, 06. |
| Wiki page routing | 2026-05-02 | Same — runs stopped writing Sun May 3. |
| `family/active-todos.md` | 2026-05-03 22:30 (last write was a `## Latest from gather (2026-05-02) — run 39` block) | **Stale 3+ days.** No "Latest from gather" block dated 5/3, 5/4, 5/5, or 5/6. |
| `log.md` | 2026-05-02 | Last spine entry is "run 39" 2026-05-02. No runs 40+ recorded. |
| `data/heartbeat-log.csv` | 2026-05-02 21:04 | Last entry 2026-05-02T21:04:02; before that, a 20-day gap from 2026-04-12 to 2026-05-02. Heartbeat is intermittent at best. |
| `data/gather-alerts.md` | **2026-04-03** | **Stale ~33 days.** Spec says `data/gather-alerts.md` is for ranked ACTION_REQUIRED items. Hasn't been touched in over a month. |

### Run-cadence reconstruction (from log.md)

The log.md spine surfaces 28 dated `personal-data-gather run N` entries between 2026-04-22 and 2026-05-02. Reading the entries:

- **2026-04-22 to 2026-04-28**: 5–10 runs/day. Healthy cadence (matches every-4h target = 6 runs/day).
- **2026-04-29 to 2026-05-02**: 1–6 runs/day, decaying.
- **2026-05-03 to 2026-05-06**: 0 runs. **Pipeline silent.**

Within the 4 days the cron is meant to fire ~24 times (every 4h × 4 days), it fired 0 times.

### Sample-by-sample digest of the 5 day-files

| Day-file | Run # | Quality | Volume |
|---|---|---|---|
| 2026-04-28 | run 37 (logged in log.md as "run 38") | Good — delta tracking from prior run, table of new threads, dispositions | ~12 inbound threads classified + dispositions; 1 NEW action (PAMKA Parent Transition Panel) |
| 2026-04-29 | run 27 (logged as "run 26") | Strong — full ACTION_REQUIRED breakdown, calendar harvest, RRE sole-parent window noted | ~5 action items, MKA tuition due May 10, CSA escalation, sole-parent window flagged |
| 2026-04-30 | run 28 | Strong — calendar table for next 7 days + Gmail dispositions + EquityZen action extracted with quoted snippet | ~10 threads classified; 1 ACTION (Anthropic interest reconfirm), 1 informational FAMILY (EPE Carline) |
| 2026-05-01 | run 22 + run 37 | Very strong — Vayu teacher escalation flagged HIGH, Hiive deadline awareness, GOOGL options roll noted, Pool Guyz, AlphaSights, EquityZen 3-up, MKA Capstone | ~9 ACTION items, ~12 informational, dedup carry-forward = 15 |
| 2026-05-02 | run 39 | Strong — net-new thread table from run-38 cutoff, Berman handoff confirmed, Gecko Robotics surfaced, Teacher Appreciation Week May 4 noted, B-34 RSVP CLOSED | ~6 net-new threads, 0 new actions, 1 closed action |

### What the runs do well (when they fire)

- **Categorization** — ACTION_REQUIRED / FINANCIAL / FAMILY / BUSINESS / INFORMATIONAL is clean.
- **Delta tracking** — runs reference prior run numbers and surface only what's new.
- **Calendar fusion** — all 5 calendars queried, scheduling conflicts noted (sole-parent windows, etc.).
- **Routing per Karpathy spec** — facts land on primary page + 2-5 related pages with wikilinks.
- **Frontmatter discipline** — bumped `updated:` and `updated_by:` correctly, append-only sections.
- **Dedup** — explicitly notes "already in run N" entries.

## Section 3 — Last 7 days: actual Gmail traffic vs surfaced

### Probe results (8 keywords, after:2026/04/29 before:2026/05/07)

| Keyword | Threads returned | Signal density |
|---|---|---|
| Vayu | 5 (1 thread = 4-message coach RSVP chain; 2 Seesaw notifs; 1 Math-support escalation chain Apr 14–30) | HIGH — coach RSVP, MKA homework escalation |
| Vishala | 4 (2 Microsoft Family Safety weekly, 2 Seesaw, 1 USPS false-positive) | MEDIUM — screen time reports, journal updates |
| Vasu | 7 (6 Goddard Daily Sheets, 1 "Out of Pizza Money" pizza-fund alert) | MEDIUM — daily Goddard, 1 light-action |
| MKA | 7 (alum visit, 4th-grade laptop letter, May Collective, WeAreMKA newsletter, Capstone fair, Math-support chain, EPE Carline) | HIGH — multiple FAMILY/SCHOOL items |
| "Solar Inference" | 1 (Newegg server-build inquiry receipt) | LOW — 1 hit, business-tangential |
| Anthropic | ~22 (Hiive watchlist digests, EquityZen "Action Needed: Reconfirm Interest", Anthropic invoice/receipt, family Anthropic-agreement signing chain, AI newsletters) | MIXED — 2 actionable (EquityZen reconfirm, Sartor-family agreement signing), rest are AI-news noise |
| Pete | 7 (Berman Lutron quote, Lutron call coordination chain, network handoff outbound, BHS deposit chain Apr 7-8, QuoteValet acceptance, ChinaTalk WarTalk false-positive, Power Mac estimate chain w/ Pete reference) | HIGH — active BHS engagement |
| vast.ai | 0 | ZERO traffic in window — unusual but plausible (no rental-state-change emails to alto84) |

**Approximate total relevant traffic in 7-day window: ~40-50 unique threads** across the 8 probes (deduping the 4-thread Math-support chain that hit both Vayu and MKA).

### Surfaced fraction by keyword

Note: the pipeline was healthy through 2026-05-02 then went silent. So "what was surfaced" = "what landed in 2026-04-29 through 2026-05-02 daily logs + active-todos."

| Keyword | Hits in window | Surfaced in daily logs | Coverage |
|---|---|---|---|
| Vayu | 5 | 4 (Math-support escalation HIGH, B-34 RSVP closed, soccer game logistics, Seesaw skipped as informational) | ~80% |
| Vishala | 4 | 2 (Seesaw mentioned in run 22; Microsoft Family Safety screen time NOT surfaced — likely correctly filtered as low-signal) | 50% (defensible) |
| Vasu | 7 | 6 (Goddard daily sheets surfaced as routine; Picture Day Apr 30 + May 3 + Teacher Appreciation Week all flagged) | ~85% |
| MKA | 7 | 5 (Capstone fair, EPE Carline, WeAreMKA, Math-support, Tuition May 10) | ~70% |
| "Solar Inference" | 1 | 0 explicit — but this was a Newegg cart inquiry not specifically routed | 0% (acceptable miss; informational) |
| Anthropic | ~22 | 3-4 (EquityZen reconfirm action, Hiive marketplace digest summary, Sartor-family Anthropic-agreement chain) | ~15-20% — mostly correct (newsletters filtered) |
| Pete | 7 | 3 (Network handoff outbound May 1, deposit chain historical context, BHS install Apr 27-29) | ~45% — **but Lutron quote May 5 + Lutron call coordination May 4-5 NOT surfaced because pipeline silent post-May 2** |
| vast.ai | 0 | 0 | n/a |

### What's been MISSED post-May 2 (pipeline silent)

Items in the live mailbox 2026-05-03 through 2026-05-06 that should have been routed but weren't, because no run has fired:

1. **Pete Berman Lutron call request** (May 4 23:59 UTC) → Alton accepted call for May 5 8 AM → Pete confirmed → call presumably happened — no trace in family/active-todos or daily log.
2. **Berman Home Systems Lutron quote** (May 5 14:52 UTC) — net-new vendor quote, attached.
3. **QuoteValet acceptance** (May 6 02:22 UTC) — Alton accepted quote #AAAQ13681 from BHS. **Financial fact: a contract was signed.** This is exactly the kind of thing TAXES.md / business/solar-inference.md is supposed to know about.
4. **Network management handoff + security findings outbound** (May 6 02:52 UTC) — Alton's substantial outbound to Pete@BHS with security findings on default BHS install template. Operationally important.
5. **EquityZen "Action Needed: Reconfirm Investor Interest (Anthropic)"** (May 6 18:01 UTC) — re-fired action, second time in 7 days.
6. **MKA 4th-grade Laptop Letter** (May 5 19:00 UTC) — direct school comm to Vayu's family. Not routed.
7. **MKA "The Collective – May 2026"** (May 4 21:00 UTC) — monthly school comms.
8. **MKA Alum Visit** (May 6 19:21 UTC, 3rd-grade families) — Vishala's class.
9. **Goddard "Out of Pizza Money"** (May 6 13:57 UTC) — Vasu, soft-action.
10. **6 Vasu Daily Sheets** for May 4, 5, 6 — informational baseline.
11. **Sartor-family Anthropic-agreement chain** (May 3) — Sissy/Oliver/Belinda asking for signature. Tangentially family-financial.
12. **Anthropic API receipt** (May 3) — Solar Inference LLC operating expense.

**~12 net-new threads in the post-May-2 silent window. ~5 of those are actionable (Lutron call, QuoteValet acceptance, BHS security-findings outbound, EquityZen reconfirm, family Anthropic agreement signature).**

## Section 4 — Hit / miss / false-positive estimate

Numerical summary across the 7-day window, applying the 8-keyword sample as a proxy for the broader inbox:

| Bucket | Estimate | Notes |
|---|---|---|
| **True positives** (relevant items the pipeline surfaced) | ~18-22 | Only counting items in 2026-04-29 to 2026-05-02. Quality of the writes was high. |
| **True negatives** (correctly filtered noise: newsletters, marketing, Microsoft Family Safety screen time, USPS Informed Delivery digests, Doximity, Tipitinas, Frontier deals, etc.) | ~30-40 | Filter discipline is real. The "JUNK" row and "filtered per Apr 16 triage" entries are doing work. |
| **Misses, while pipeline was running** (4/29-5/2) | ~3-5 | E.g., Vishala Microsoft Family Safety reports never surfaced; Anthropic API receipt routing not seen. Defensible misses (low-signal). |
| **Misses, pipeline silent** (5/3-5/6) | ~10-12 | All ~12 items in §3 above. **This is the dominant failure mode.** |
| **False positives** (the pipeline wrote up a fact that wasn't worth memory) | ~2-4 | Example: Hiive Daily Market Digest entries occasionally surfaced as "INFORMATIONAL" line items even when they had no net-new content. Not destructive, just noise. |

**Effectiveness rating: B+ when running, F when not.**

The runtime quality is strong. The reliability is the problem. **The single biggest defect of the current pipeline is silent failure.** When personal-data-gather doesn't fire, nothing alerts. The heartbeat csv has a 20-day gap (Apr 12 to May 2) that nobody noticed. This is consistent with the broader "heartbeat broken" finding in [[system-review-2026-04-18]] (P0 from that review still not fixed).

A second-order issue: `data/gather-alerts.md` (the spec's #6 output) was last written 2026-04-03. The spec says it should be the ranked ACTION_REQUIRED feed. **It's been functionally orphaned for ~33 days.** Either the runs don't write it, or they write to `family/active-todos.md` instead and skip the dual-write. Either way the spec/implementation has drifted.

## Section 5 — Recommended `gmail-family-relevance-scan` cron spec

### Design intent

`personal-data-gather` is doing too much. It runs Gmail + Calendar (5 IDs) + System State + writes to 6 destinations. When any one of those fails, the whole run silently aborts (likely cause of the May 3-6 outage — needs orthogonal investigation). Split it into focused, observable, replaceable units that feed a streaming activity layer (the Phase 1 plan's Layer 5).

`gmail-family-relevance-scan` becomes the dedicated Gmail leg. Output is a streaming jsonl that the dashboard can read live and the curator can fold into wiki pages on its own cadence.

### Cron metadata

```yaml
name: gmail-family-relevance-scan
description: Tagged Gmail scan against family / financial / medical / school / business keyword set. Streams to data/inbox-stream/gmail-<date>.jsonl. Idempotent on (msg-id, keyword) tuples.
schedule: every 2 hours, on the hour (12 runs/day)
model: sonnet
allowed-tools:
  - mcp__claude_ai_Gmail__search_threads
  - mcp__claude_ai_Gmail__get_thread (rate-capped, see Constraints)
  - Read
  - Write
  - Edit
permissionMode: bypassPermissions
maxTurns: 25
```

### Why every 2 hours, not 4

The current 4h cadence missed the Pete-Berman Lutron call request (May 4 23:59 UTC) → next-morning call (May 5 8 AM, ~8h gap) is too tight for the existing cadence even when running. 2h cuts that to ~2h worst-case, which is acceptable for an inbox where most actionable items have multi-hour reply windows.

### Keyword set (canonical)

Three tiers; threads that match tier-1 OR tier-2 are full-fact-extracted; tier-3 are summary-only.

**Tier 1 — high-signal, always-extract**
- Children: `Vayu`, `Vishala`, `Vasu`
- Spouse: `Aneeta`
- Schools: `MKA`, `Goddard`, `Montclair Kimberley`, `mka.org`, `kaymbu`, `seesaw`, `veracross`, `blackbaud`
- Family-medical: `Neurvati`, family doctors by name (kept in [[family/healthcare]] — read at runtime)
- LLC: `Solar Inference`, `solarinference.com`
- Nonprofit: `Sante Total`, `santetotal.org`
- House: `Pete@bermanhomesystems`, `alyssa@bermanhomesystems`, BHS, vendor list from [[family/vendors]]
- Tax/CPA: `Jonathan Francis`, `Doug Paige`, IRS, NJ Division of Taxation
- Financial: `Fidelity`, `JPMorgan`, `Schwab`, `Chase`, mortgage `Cenlar`, `EquityZen`, `Hiive`, `Anthropic` (when from `mail.anthropic.com` invoice domain — distinguish from newsletters)
- Infra: `vast.ai`, `vastai`, `vastai.com`

**Tier 2 — context-dependent, extract if unread or has-attachment**
- Career: `AstraZeneca`, `Lambda`, `Apptronik`, `OpenAI`, `Cohere`, `Pfizer`, `Sanofi` (LinkedIn job alerts handled here for filtering)
- Travel: `Disney`, `Delta`, `United`, `American Airlines`, `Marriott`, `Hilton`
- Friends/family network: surnames from [[family/social-graph]] (read at runtime)

**Tier 3 — summary-only (subject + sender + date, no body)**
- Newsletters: `substack.com`, `dwarkesh`, `thezvi`, `chinatalk`, `semianalysis`, `theinformation`, `sequence`, `rundatarun`, `cerebralvalley`, `bmc.org`
- Junk-class senders: marketing, deals, surveys (per [[feedback/feedback_email_triage]])

### Output schema (jsonl rows)

One row per (msg_id, keyword_tier) tuple. Atomic append. Idempotent: re-running over the same window produces the same rows; consumer handles dedup on (msg_id, keyword).

```json
{
  "ts": "2026-05-06T19:21:32Z",
  "msg_id": "19dfebd06521b0ca",
  "thread_id": "19dfebd06521b0ca",
  "from": "m@mail4.veracross.com",
  "to": ["alto84@gmail.com"],
  "subject": "Alum visit",
  "snippet_first_120ch": "Dear Third Grade Families, I hope this email finds you well. It's an extremely busy and exciting time of year. Th",
  "tier": 1,
  "matched_keywords": ["MKA", "veracross"],
  "category": "FAMILY/SCHOOL",
  "urgency": "INFORMATIONAL",
  "deadline_iso": null,
  "action_required": false,
  "kid_subject": "Vishala",
  "amount_usd": null,
  "attachments": [],
  "routing_hints": ["family/vishala", "family/family-calendar"]
}
```

Fields are filled by the cron's classifier (sonnet). Any field that can't be confidently filled is `null` — the spec follows the [[feedback/evidence-based-validation]] protocol (anti-fabrication).

### File layout

- `data/inbox-stream/gmail-<YYYY-MM-DD>.jsonl` — one file per day, append-only.
- `data/inbox-stream/gmail-state.json` — last-scanned cursor (`history_id` or message-id high-watermark, plus last-run-ts and last-success-ts).
- `data/inbox-stream/gmail-errors.jsonl` — error log; **a row written here triggers an alert** (see Section 6).

### Dedup strategy

1. Cron reads `gmail-state.json` and pulls `messages.list` with `historyId` filter (Gmail API supports incremental delta — much cheaper than `after:`/`before:` query). Falls back to `after:<last-success-ts>` if history-id is too old.
2. For each message, check `data/inbox-stream/gmail-<today>.jsonl` for prior `msg_id` rows. If present, skip. (Same-day re-runs are common after backfill.)
3. Bloom-filter cache keyed on msg_id (last 30 days) for cross-day dedup, materialized at `data/inbox-stream/.gmail-seen.bloom`.
4. The curator (downstream) does its own dedup before writing to wiki pages — this stream is raw.

### Attachment handling

- **Don't download.** Just record `{filename, mimeType, size_bytes, attachment_id}` in the row.
- A separate downstream cron (proposed: `attachment-router`) decides whether to fetch + route to source-doc index. Out of scope for this scan.
- One exception: PDFs from known financial senders (Fidelity, Chase, J.P. Morgan, Schwab) get a flag `attachments.fetch_priority: "high"` so the source-doc cron prioritizes them. The flag is metadata only — the scan does not fetch.

### Liveness contract (the silent-failure fix)

This is the most important addition relative to the current personal-data-gather:

1. **Every run writes its start and end timestamp to `data/inbox-stream/gmail-state.json`.**
2. **A separate cron `gmail-liveness-watchdog`** (every 30 min, lightweight) reads `gmail-state.json`. If `now - last_success_ts > 3 hours`, it writes a row to `data/gather-alerts.md` (resurrected) AND fires a Google Calendar event (severity yellow) per the [[daily-household-health]] pattern.
3. The watchdog is the closer for the May 3-6 silent-failure pattern — same failure-mode and same closer as the 2026-04-22 cable-pull incident.

### Migration path

- **Week 1:** Run `gmail-family-relevance-scan` in shadow mode alongside personal-data-gather. Compare row count and routing decisions against the same daily log. Tune keyword tiers.
- **Week 2:** Cut personal-data-gather's Gmail leg over to the new cron. Calendar leg stays in personal-data-gather (renamed `calendar-fusion`). System-state leg moves to its own thing.
- **Week 3:** Curator agent reads the jsonl stream and folds ACTION rows into `family/active-todos.md` with the same callout schema as today.
- **Week 4:** `gmail-liveness-watchdog` lit up. Decommission the daily-log legacy path; the jsonl stream + curator pipeline replaces it.

### Concrete deliverables when this gets greenlight

| Artifact | Path |
|---|---|
| Cron skill | `.claude/scheduled-tasks/gmail-family-relevance-scan/SKILL.md` |
| Watchdog skill | `.claude/scheduled-tasks/gmail-liveness-watchdog/SKILL.md` |
| State + stream | `data/inbox-stream/{gmail-state.json, gmail-<date>.jsonl, gmail-errors.jsonl}` |
| Resurrected alerts file | `data/gather-alerts.md` (rotated, header refresh) |
| Keyword config | `sartor/memory/feedback/email-triage-keywords.md` (canonical, read by cron at runtime) |

## Section 6 — Risks

### Privacy

- The scan reads from the personal Gmail account. **Per Alton's permission grant 2026-05-06**, this is in scope.
- **No bodies past the first 120 chars** are stored in the jsonl. Snippet-only. This is the same constraint personal-data-gather already follows ("Do not store email bodies or sensitive content — extract facts only").
- **Children's names appear in the jsonl** — that's the point of the family-relevance scan. The jsonl lives at `data/inbox-stream/`, not in the git-tracked memory tree, and is therefore subject to the same data-hygiene rules as `data/financial/`. **It MUST be excluded from the GitHub mirror.** Verify `.gitignore` has `data/inbox-stream/` before any commit.
- **Aneeta's medical/clinical content** that hits a tier-1 keyword (her name, Neurvati) needs special handling. The keyword `Aneeta` is broad; the cron should flag any thread where the from-domain matches a healthcare provider list (Atrius, Mt Sinai, Hospital for Special Surgery, etc.) and downgrade to tier-3 summary-only. Per CLAUDE.md Domain 3: "Medical information for any family member is never logged or shared."
- The scan must NEVER write Aneeta's medical correspondence to the wiki tree under any path. The jsonl row gets `medical_redacted: true` and the snippet replaced with `[redacted-medical-domain]`.

### False positives

- Tier-1 keyword `MKA` is a 3-letter token. Matches against arbitrary email bodies will false-positive (`MKA` appears in some pharma adverse-event tables, etc.). Mitigation: anchor on word boundaries `\bMKA\b` AND require the match to come from `mka.org` OR `m@mail*.veracross.com` OR be in subject line.
- `Pete` is a common first name. Mitigation: require sender or recipient match against the canonical Pete-list (`Pete@bermanhomesystems.com`). Bare-string `Pete` in body without sender-match is tier-3.
- Newsletter mentions of `Anthropic` (Zvi, Sequence, ChinaTalk) far outnumber business-relevant Anthropic correspondence (~22 hits, ~3 actionable in the 7-day window). Mitigation: tier-1 only when from `*.anthropic.com` OR `support@equityzen.com` subject contains `Anthropic` OR Hiive subject contains `Anthropic`. Newsletter mentions degrade to tier-3.

### Rate limits

- Gmail API quota for personal accounts is generous (~250 quota units/sec, lots of room). 12 runs/day × ~50 list calls + ~10 thread-detail calls each = ~720 list calls/day + ~120 thread calls/day. Negligible vs. quota.
- The `mcp__claude_ai_Gmail__get_thread` cost is real (each call counts as 1 MCP call to the Claude harness). Cron should cap `get_thread` at 5 per run; everything else uses snippets from `search_threads` results. This audit hit that exact ceiling: `search_threads` was sufficient for 8/8 keywords without needing `get_thread`.

### Silent-failure recurrence

- The watchdog (Section 5, "Liveness contract") is the closer. Pre-register: if 3 hours pass with no new `gmail-state.json` write, alert. If 12 hours pass, page (red severity calendar event).
- The watchdog itself is not redundant — single point of failure. **Acceptable risk** at the household-agent scale; the next layer of redundancy is human (Alton notices a Goddard email isn't surfacing).

### Token cost

- Every-2h × sonnet × ~15-25 turns/run = roughly $0.05-0.15 per run = $0.60-1.80/day = $18-55/month. In line with existing personal-data-gather spend.
- Keyword tiering pays for itself: tier-3 senders skip the body-extraction step entirely, saving ~40% of the per-run token spend vs. naively extracting every result.

### Drive ingest

- This audit is Gmail-only by re-dispatch scope. The plan's `inspector-source-docs` and the proposed `drive-recent-changes-scan` cron are separate items. **Recommend:** the watchdog pattern proposed here (Section 5) be applied to ALL Phase 3 ingest crons, not just Gmail. Same silent-failure mode applies.

---

## Headline findings

1. **Pipeline silent since 2026-05-02 (4 days).** No daily logs, no spine entries, no active-todo updates. Cause unknown — likely a credentials, MCP-token, or Calendar-API issue silently aborting the chained run. Needs orthogonal investigation.
2. **When running, quality is high (B+).** Categorization, dedup, calendar fusion, and Karpathy-style routing all work as specified.
3. **`data/gather-alerts.md` orphaned ~33 days.** Spec/implementation drift; the runs write to `family/active-todos.md` exclusively now. Either fix the spec to match reality, or restore the dual-write.
4. **Heartbeat broken-by-design.** No watchdog, no alert when the cron stops firing. This is the same defect as the 2026-04-22 cable-pull incident; the [[daily-household-health]] closer pattern needs to be applied to ingest crons too.
5. **Replacement cron `gmail-family-relevance-scan` should be split out** with a streaming jsonl output, a 3-tier keyword schema, dedup via gmail-state cursor, and a paired `gmail-liveness-watchdog` that resurrects the alerts file when runs stop.

MCP calls used: 8 of 30. Audit complete.
