# Ingest Workflow

How to bring content from the outside world into the wiki. The ingest workflow is the write-heavy core of the LLM-wiki pattern — when a new source arrives, the agent touches 10-15 related pages to preserve cross-references, appends a log entry, and flags contradictions. This document describes the workflow for several common source types.

## The general ingest contract

Regardless of source, every ingest follows the same 9-step contract:

```
1. READ the source (paper, email, doc, PDF, URL, structured data)
2. EXTRACT: title, author(s), date, key claims, citations, entities mentioned
3. IDENTIFY the entities relevant to this wiki: drugs, mechanisms, AEs, signals, studies
4. LOCATE existing pages for each entity (or flag new pages needed)
5. For each existing page:
     a. Decide what the source adds (new claim, contradicting evidence, new reference)
     b. UPDATE the page in place — right section, updated references, bumped `updated` field
     c. Add a `> [!warning]` callout if the source contradicts a prior claim
6. For each entity with no page yet, CREATE one from the appropriate template
7. APPEND a log entry to `log.md` summarizing the ingest (what was touched, what was new, contradictions flagged)
8. RUN `wiki.py --lint` to confirm no new orphans or broken links were introduced
9. COMMIT the changes to git (optional but recommended for provenance)
```

The Karpathy rule: **ingest touches 10-15 related pages, not just one**. If your ingest only touches one page, you're not maintaining the cross-reference graph — you're just appending notes. The compounding comes from the updates, not the additions.

## Source type 1: Scientific paper (PDF or arXiv)

The most common ingest. A new paper comes in, you (or the agent) read it, and it becomes permanent knowledge.

**Inputs:** PDF or arXiv URL, or a copy-pasted abstract + key excerpts.

**Expected outputs:**
- 1 new or updated "study" page for the paper itself (`templates/study.md.tmpl`)
- 1-5 mechanism pages updated with new evidence
- 1-3 drug pages updated if the paper reports drug-specific findings
- 1-3 AE pages updated if the paper describes new or corroborated adverse events
- 1 log entry in `log.md`

**Prompt template for the agent:**

```
You are ingesting a new paper into the safety research wiki. Follow the
9-step ingest contract in docs/INGEST.md.

Source: <paste abstract + key findings, or file path to PDF>

Before writing any file, list:
1. The entities (mechanisms, drugs, AEs) this paper touches
2. Which existing wiki pages each entity corresponds to (use wiki.py --tag
   mechanism/... and wiki.py --backlinks to find them)
3. What this paper adds to each page
4. Any contradictions with existing claims

Then make the updates. After all updates, run wiki.py --lint and report
any new orphans or broken links.
```

## Source type 2: Gmail thread (regulatory correspondence, collaborator discussion)

When an important email thread contains facts worth preserving — regulatory guidance, collaborator observations about a signal, an advisor's recommendation about a mechanism — the ingest workflow extracts the facts and weaves them into the wiki.

**Inputs:** A Gmail thread accessed via the Gmail MCP (claude.ai has one built-in; self-hosted options include `@isaacphi/mcp-gmail` and similar).

**Tools needed:**
- `gmail_search_messages` — find the thread
- `gmail_read_thread` — get the full content

**Expected outputs:**
- Source pages are NOT created for emails (they're provenance, not content)
- Affected entity pages get updated with new facts
- A log entry records: sender, date, subject, which pages were touched

**Prompt template for the agent:**

```
Ingest the following Gmail thread into the safety research wiki. Thread
identifier: <thread-id or subject>

Steps:
1. gmail_read_thread to get the full content
2. Extract facts relevant to the wiki's domain (drugs, mechanisms, AEs,
   signals we track)
3. For each fact, identify the target wiki page
4. Update the page(s) in place, adding the fact to the appropriate section
5. In the page's "Key References" or "Correspondence" section, cite the
   email with: sender name, date, one-line summary of what they said
6. Do NOT copy the full email text into the wiki — cite and paraphrase
7. Do NOT include personal or medical PII from the email
8. Append a log entry: `## [YYYY-MM-DD] ingest | Email from <sender>: <subject>`
9. Run wiki.py --lint
```

**Privacy rules for email ingest:**

- Never copy full email bodies into wiki pages
- Redact personal names unless they're public-facing (e.g., a published author)
- Redact patient-level data entirely
- Treat the email as a **source citation**, not source content

## Source type 3: Google Drive document (shared doc, spreadsheet, slide deck)

For internal documents shared via Drive — committee minutes, draft analyses, shared research notes.

**Inputs:** A Google Drive file accessed via a Drive MCP.

**MCP options (as of 2026-04):**

- **`@modelcontextprotocol/server-gdrive`** — the Anthropic-original, archived May 2025, still functional but unmaintained
- **`@isaacphi/mcp-gdrive`** — actively maintained successor. Drive readonly + Sheets read/write + Docs. Recommended.
- **`dguido/google-workspace-mcp`** — kitchen-sink option covering Drive + Docs + Sheets + Slides + Gmail + Calendar + Contacts in one server
- **`googleapis/gcloud-mcp`** — Google's first-party MCP, but it's for cloud infrastructure (compute, storage buckets), **not Drive**

**OAuth setup (one-time, ~5 minutes):**

1. Go to https://console.cloud.google.com/projectcreate and create a project
2. Enable the Drive API at https://console.cloud.google.com/apis/library/drive.googleapis.com
3. Configure the OAuth consent screen — pick "internal" if your org is a Google Workspace, else "external" and add yourself as a test user
4. Create OAuth Client ID, type "Desktop app"
5. Download the JSON, keep `client_id` and `client_secret`
6. Add the MCP server to your client config (Claude Desktop, Claude Code, or other) with `CLIENT_ID` and `CLIENT_SECRET` as environment variables

**Tools exposed (isaacphi version):**
- `gdrive_search` — find files by query
- `gdrive_read_file` — read file content
- `gsheets_read` — read spreadsheet data
- `gsheets_update_cell` — write to sheets

**Expected outputs from a Drive ingest:**
- For committee minutes: a log entry + updates to any signal or decision pages referenced
- For shared research notes: a new or updated mechanism/drug/AE page
- For spreadsheets (e.g., a signal tracking spreadsheet): multiple signal pages updated

**Prompt template for the agent:**

```
Ingest the following Google Drive document into the safety research wiki.
Document: <drive-file-id or URL>

Steps:
1. gdrive_read_file to get the content
2. Determine the document type:
   - Committee minutes -> extract decisions, update signal pages and drug pages
   - Research note -> extract claims, update mechanism and drug pages
   - Spreadsheet -> extract rows, update or create signal pages
3. For each extracted item, find or create the target wiki page
4. Update in place with a citation back to the Drive file (file name + date,
   NOT the file ID — IDs can rotate)
5. For contradictions, add a `> [!warning]` callout
6. Append a log entry: `## [YYYY-MM-DD] ingest | Drive: <document title>`
7. Run wiki.py --lint
```

## Source type 4: FDA / EMA / regulatory public documents

Regulatory correspondence, labeling changes, safety communications, boxed warnings.

**Inputs:** URL to the public document, or a downloaded PDF.

**Expected outputs:**
- Affected drug pages get a new entry in the "Labeling Changes" section with the date and summary
- Affected AE pages get a new entry in the "Signal History" section
- Affected mechanism pages may get new references
- A log entry
- A citation to the source URL or document ID (for FDA, the MAPP number; for EMA, the PSUSA number)

## Source type 5: Internal PV database query result

If you have access to an internal pharmacovigilance database (Argus, ArisGlobal, or similar), the wiki is the synthesis layer ON TOP of the database.

**Do NOT import raw case data.** The wiki never holds patient-level information. Instead, the ingest pattern is:

1. Run a query in the PV database (e.g., "all cases of hepatotoxicity grade 3-4 for drug X in last 12 months")
2. Summarize the **aggregate** findings (case count, severity distribution, time-to-onset range)
3. Create or update a signal page with the aggregate summary
4. Cite the query ID and date in the page
5. Append a log entry

The wiki is downstream of the PV database, never a substitute.

## Source type 6: Plain text / pasted content

For quick notes, meeting takeaways, Slack messages, or anything you copy-pasted.

**Inputs:** A block of text.

**Expected outputs:** Same as above — 1-5 pages updated, 1 log entry.

Use this liberally. It's the lowest-friction ingest path and keeps the wiki from going stale during busy weeks.

## Ingest cadence

**Daily:** 1-3 ingest events per day during active research. Even a single paper is enough.

**Weekly:** a lint pass and a review of recent log entries.

**Monthly:** prune stale signal pages, archive resolved signals, review orphans.

Compound kicks in after 2-4 weeks of daily habit. Below one ingest per day, the compounding signal is too weak to feel — the wiki stays inert.

## What the ingest workflow is NOT

- It is NOT automatic. You (or your agent) do the judgment work at ingest time. The wiki layer doesn't guess.
- It is NOT a dumping ground. If a source doesn't warrant at least one page update, don't ingest it. Not every paper is wiki-worthy.
- It is NOT a replacement for authoritative systems. Clinical trial databases, PV databases, regulatory portals remain the system of record. The wiki is the synthesis layer.
- It is NOT multi-user concurrent. If two people try to ingest the same source at the same time, you'll get merge conflicts. Coordinate or use single-author mode.

## Hard rules (summary)

1. Every ingest touches multiple pages (the Karpathy rule)
2. Every ingest appends a log entry
3. Every contradiction gets a `> [!warning]` callout with both citations
4. No patient-level data in the wiki
5. No full email or doc bodies copy-pasted — cite and paraphrase
6. Run `wiki.py --lint` after every ingest session
7. Commit to git for provenance (if you're using git)

## The payoff

A well-maintained safety research wiki becomes the first place you look when you need to answer a question. Three months in, you should be able to say:

- "What's the current state of evidence on CRS mechanism?" → open `CRS.md`, see everything
- "What drugs have been associated with this AE pattern?" → tag search + backlinks
- "Has this signal been investigated before?" → signal page + decision log
- "Who told us about this finding?" → citations in the relevant page

The wiki is the artifact. The ingest is how the artifact grows.
