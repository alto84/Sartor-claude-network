---
name: personal-data-gather
description: Persistent data collection across Gmail, Calendar, and Drive — updates daily logs and memory snapshots
model: sonnet
---

# GATHER — Personal Data Collection System

This is a scheduled task that runs every 4 hours. It scans personal data sources and routes actionable intelligence into the memory system.

## Calendar IDs (all 5 must be queried)

| Calendar | ID | Notes |
|----------|----|-------|
| Alton (primary) | `primary` / `alto84@gmail.com` | Alton's main calendar |
| Family | `family06179810230244859800@group.calendar.google.com` | Shared family calendar: birthdays, vacations (Disney), school events |
| Aneeta | `aneetasax@gmail.com` | Aneeta's calendar (owner access): work travel, personal appointments |
| Alton's Tasks | `42418d485f3839dfbc255305ef9839b030193d1a875283cb6884694db7bb5c4c@group.calendar.google.com` | Task list calendar |
| Blue Sombrero (Vayu soccer) | `oghb6g9npuam0i4fmhcgh65vmb4e4drn@import.calendar.google.com` | Read-only imported webcal for Vayu's soccer schedule |

## Data Sources (in priority order)

1. **Gmail** (via Gmail MCP)
   - Search for unread/recent messages since last gather
   - Categorize: ACTION_REQUIRED, FINANCIAL, FAMILY, BUSINESS, INFORMATIONAL
   - Extract deadlines, amounts, contacts, and follow-up dates
   - Flag tax-related correspondence (CPA, IRS, state agencies)

2. **Google Calendar** (via Calendar MCP)
   - Loop through ALL 5 calendars listed above (use gcal_list_events with each calendarId)
   - Pull events for next 7 days from each calendar
   - Merge results into a single timeline, tagging each event with its source calendar
   - The Family calendar is where most shared family events live (birthdays, vacations, school events) -- prioritize these for family-ops routing
   - Aneeta's calendar contains her work travel and personal appointments -- flag schedule conflicts between Alton and Aneeta
   - Blue Sombrero is read-only; just pull upcoming soccer games/practices for Vayu
   - Identify scheduling conflicts across ALL calendars (not just within one)
   - Flag events requiring preparation (meetings, appointments, school events)
   - Track recurring patterns (commute days, family obligations)

3. **System State**
   - Check gpuserver1 SSH connectivity
   - Pull vast.ai rental status and earnings since last check
   - Check heartbeat-log.csv for missed tasks
   - Check disk utilization on both machines

## Routing Rules (Karpathy Ingest Pattern)

Each fact gets routed to its PRIMARY target AND all RELATED pages. The Karpathy rule: every ingest should touch 10-15 related pages, not just one. This is how the wiki compounds — cross-references are maintained at ingest time, not re-derived per query.

**Primary routing map:**

| Fact category | Primary target | Also update |
|--------------|----------------|-------------|
| Tax deadlines, CPA | `TAXES.md` | `business/solar-inference.md`, `business/sante-total.md`, `family/active-todos.md` |
| Family events, school | `FAMILY.md` | `family/active-todos.md`, `family/vayu.md` or `vishala.md` or `vasu.md` (whichever kid), `family/family-calendar.md` |
| Kid-specific (medical, school, activity) | `family/{kid}.md` | `family/active-todos.md`, `FAMILY.md` |
| Solar Inference LLC | `business/solar-inference.md` | `TAXES.md`, `BUSINESS.md`, `people/doug-paige.md` or `people/jonathan-francis.md` |
| Sante Total | `business/sante-total.md` | `TAXES.md`, `BUSINESS.md`, `people/barbara-weis.md` |
| Career/AZ (external only) | `business/az-career.md` | `ASTRAZENECA.md`, `ALTON.md` |
| Disney trip | `family/disney-july-2026.md` | `family/active-todos.md`, `family/family-calendar.md` |
| New person encountered | `people/README.md` (contact card) or `people/{name}.md` (if enough context) | Relevant domain page |
| Commute/logistics | `ALTON.md` or `family/active-todos.md` | — |
| Everything else | `daily/{date}.md` | — |

**When updating a page:**

1. **Read the existing file first.** Never overwrite. Always read-then-append.
2. **Preserve YAML frontmatter verbatim.** Only bump `updated:` to today's ISO date and `updated_by:` to "personal-data-gather". See `sartor/memory/feedback/feedback_preserve_frontmatter.md` for the full contract.
3. **Preserve all callouts** (`> [!deadline]`, `> [!blocker]`, etc.). Never remove or rewrite them.
4. **Add new facts as callouts when appropriate:**
   - New deadline found in email? Add `> [!deadline] YYYY-MM-DD` to the target page
   - New blocker or unresolved issue? Add `> [!blocker]`
   - New decision needed? Add `> [!decision]`
   - New verified fact? Add `> [!fact]`
5. **Append new content to a "## Latest from gather (YYYY-MM-DD)" section** at the bottom of the target page. Do NOT insert into the middle of existing sections.
6. **Add wikilinks** when referencing related entities (e.g., `[[people/jonathan-francis|Jonathan Francis]]` when noting CPA correspondence).
7. **Deduplicate:** if the fact is already present on the page (same claim, same date), skip it. Check the last 20 lines of the target page for duplicates before appending.

## Output

1. **Daily log:** Append a timestamped entry to `sartor/memory/daily/{date}.md` with ALL findings (this is the raw log, kept for audit trail)
2. **Wiki pages:** Update the PRIMARY target page and 2-5 RELATED pages per fact (the compiled artifact)
3. **Active TODOs:** If any ACTION_REQUIRED items are found, add them as callouts to `family/active-todos.md` (for family items) or the relevant business page (for business items)
4. **Log spine:** Append a `## [YYYY-MM-DD] ingest | personal-data-gather run N` entry to `sartor/memory/log.md` summarizing: how many facts gathered, which pages updated, any new deadlines/blockers surfaced
5. **Heartbeat:** Write a one-line summary to `data/heartbeat-log.csv`
6. **Alerts:** If any ACTION_REQUIRED items found, write to `data/gather-alerts.md` with urgency ranking

## Page update contract

**CRITICAL:** When touching any file under `sartor/memory/`, you MUST follow the contract in `sartor/memory/feedback/feedback_preserve_frontmatter.md`:

- Read the file before writing
- Preserve frontmatter verbatim (only bump `updated:` and `updated_by:`)
- Preserve callouts verbatim
- Preserve wikilinks verbatim
- Append, don't overwrite
- If a write would delete more than 10 lines of existing content, STOP and skip that file. Write the fact to `daily/{date}.md` instead and flag it for manual review.

## Constraints

- Convert all relative dates to absolute dates (e.g., "next Thursday" -> "2026-04-10")
- Do not store email bodies or sensitive content — extract facts only
- Do not send any messages or modify any external state
- Skip emails older than 48 hours unless they contain unresolved deadlines
- Record access in .meta/access-log.json for decay tracking
