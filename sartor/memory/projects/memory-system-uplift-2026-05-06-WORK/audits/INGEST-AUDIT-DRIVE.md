---
name: INGEST-AUDIT-DRIVE
description: Drive ingest audit — DEFERRED. Two consecutive sub-agent dispatches stalled at the Drive MCP layer (600s watchdog timeout). MCP appears unhealthy as of 2026-05-06 PM EDT. Stub written by Rocinante orchestrator after 2 stalled dispatches captures the recommended cron design from architectural knowledge so the synthesizer has something to fold in. Fresh Drive inspector dispatch should be re-tried after MCP issue is diagnosed.
type: audit-stub
status: deferred-mcp-unhealthy
date: 2026-05-06
inspector: rocinante-orchestrator (stub written after 2 dispatches stalled — original combined gmail+drive + narrow drive-only re-dispatch both froze at first Drive MCP call)
parent-plan: memory-system-uplift-2026-05-06-PLAN
---

# Drive Ingest Audit — DEFERRED

## §0 Why this is a stub

Two consecutive `inspector-drive` dispatches stalled with a 600 s stream-watchdog timeout. The first (combined gmail+drive) made it through the Gmail half then froze at the Gmail→Drive transition. The second (drive-only, narrower scope, hard 25-call cap, write-stub-first instruction) froze at "First, auth status and shared drives in parallel (calls 1-2)" — never produced output.

Pattern: both dispatches died at or near the first Drive MCP call. Likely root cause is Google Drive MCP unhealth, not an agent or scope issue. Re-attempting from a third sub-agent context is unlikely to succeed without diagnosing the MCP first.

## §1 What we know without running the audit

- `mcp__gdrive__*` tools are listed as available in the deferred-tool catalogue
- `mcp__claude_ai_Google_Drive__authenticate` and `mcp__claude_ai_Google_Drive__complete_authentication` exist as separate auth-flow tools — possibly indicating an auth-state issue
- No scheduled Drive ingest cron exists today (zero baseline)
- The source-document inspector (`SOURCE-DOC-AUDIT.md`) found 3,211 PDFs scattered across local Downloads + OneDrive; some classes (utility bills, paperless statements, school PDFs, signed contracts) likely arrive via Drive rather than local download — confirmed by the gmail inspector finding the 2026-05-06 BHS QuoteValet acceptance only via Gmail, with the actual signed PDF likely landing in Drive

## §6 Recommended `drive-recent-changes-scan` (sketch — to be validated when MCP recovers)

### Frequency
Nightly. Drive isn't as time-sensitive as email — overnight latency on new docs is acceptable. Watchdog every 4 h.

### Output
`data/inbox-stream/drive-<YYYY-MM-DD>.jsonl` — one row per changed file:
```json
{
  "ts": "<modifiedTime ISO>",
  "file_id": "<drive id>",
  "revision_id": "<rev id>",
  "name": "<filename>",
  "mime_type": "<mime>",
  "size_bytes": <int>,
  "owner": "<owner email>",
  "shared_with_me": <bool>,
  "parent_folder": "<folder name or path>",
  "category_guess": "<tax|brokerage|medical|legal|contract|school|other>",
  "needs_index_entry": <bool>
}
```

### State
`data/drive-state.json`:
```json
{
  "last_scan_iso": "...",
  "last_change_token": "...",   // Drive Changes API delta token
  "seen_revision_ids": [...]    // bounded LRU; dedup
}
```

### Selection logic
Use Drive's Changes API (`changes.list` with `pageToken`) for delta-since-last-scan, NOT a full file walk. Critical for cost + speed.

### §7 Integration with source-document INDEX
For any new Drive doc that maps to a Layer-4 source-doc category (tax, brokerage, medical, legal, contract, school), append a placeholder entry to `sartor/memory/source-documents/INDEX.md` with:
```
### [Drive] <filename>
- Path: `gdrive://<file_id>` (canonical Drive URI)
- Date: <modifiedTime>
- Category: <guess>
- Owner: <email>
- Contents: (placeholder — Drive-resident, not local)
```

Mirrors the local-PDF entry schema so the source-doc index is uniform across local + cloud.

### Watchdog
`drive-liveness-watchdog` every 4 h:
- Read `data/drive-state.json`
- If `last_scan_iso` > 30 h old → write `data/inbox-stream/_alerts/drive-stale.md` and ping the daily-household-health task
- This is the same closer pattern the Gmail audit recommended for `gmail-family-relevance-scan` — and the gmail inspector flagged that the watchdog pattern needs to apply to ALL Phase 3 ingest crons

## §8 Privacy + auth + risks

- Read-only on Drive. No writes, shares, permission changes.
- Skip files where `mimeType` indicates trashed or where `trashed: true`.
- Skip files in folders named `Private`, `Medical`, `Therapy` (or matching the medical-domain redaction rule from the gmail audit) — track them as `redacted: true` rows with name replaced by hash.
- Auth: use the existing OAuth (whichever of `mcp__gdrive__*` or `mcp__claude_ai_Google_Drive__*` is canonical — needs MCP diagnosis to confirm).
- Token cost: small (Drive Changes API is delta-based, low-call).

### Out of scope for this cron
- Don't `getGoogleDocContent` on every change — too expensive and most are noise. Content fetch happens on-demand via the source-doc index entries.
- Don't enumerate full Drive corpus periodically — Changes API delta only.
- Don't sync content to local — the index is the entrypoint; on-demand fetch when a deep-memory task references the doc.

## §9 What's missing because the audit stalled

- Empirical baseline of how many family-relevant docs are in Drive vs local
- Auth state (is Drive even authenticated currently?)
- Sample of actual recent activity to sanity-check the category-guess heuristics
- Confirmation of whether `mcp__gdrive__` or `mcp__claude_ai_Google_Drive__` is the canonical MCP path

## §10 Recommendation for the synthesizer

Treat this stub as a placeholder. The cron design above is reasonable and can go into PROPOSAL.md as a Wave-C item, BUT add an explicit prerequisite: **Diagnose Drive MCP health before implementing.** A fresh inspector-drive dispatch should be retried after the MCP issue is resolved (likely an auth-token re-issue or an MCP-server restart), and the audit completed before wiring the cron live.

## §11 Related findings from sibling inspectors

- **Gmail inspector (`INGEST-AUDIT-GMAIL.md`)**: Gmail pipeline silent since 2026-05-02; recommends paired `gmail-liveness-watchdog` every 30 min. The same watchdog pattern applies here at 4h cadence. **Critical adjacent finding the gmail inspector flagged for the broader plan: the watchdog pattern needs to apply to all Phase 3 ingest crons, not just Gmail.**
- **Source-doc inspector (`SOURCE-DOC-AUDIT.md`)**: 3,211 docs indexed locally, none from Drive yet. The Drive cron is the bridge that keeps the source-doc INDEX synchronized across both physical surfaces.
- **Text-messages inspector (`TEXT-MESSAGES-AUDIT.md`)**: recommended deferring texts-ingest 30 days. Drive is in a similar deferral posture for a different reason (MCP health vs marginal info value).
