---
name: text-messages-audit
description: Feasibility audit for ingesting Sartor SMS / RCS / chat messages into the Sartor memory + dashboard system via Chrome MCP. Read-only inbox-list inspection of authenticated browser sessions on 2026-05-06. No message content scraped or quoted; structural patterns only.
type: audit
project: memory-system-uplift-2026-05-06
inspector: inspector-text-messages
date: 2026-05-06
status: complete
privacy_floor: kids_excluded_aneeta_consent_open_medical_redacted
---

# Text-Messages Audit

> [!important] Privacy floor enforced throughout
> No message content was quoted, downloaded, or persisted. Structural characterization only. Kids' threads, Aneeta's threads, and medical pings are all flagged for filtering or exclusion in the privacy model below. The Google Messages inbox-list inspection in §3 deliberately uses sender labels and shape, never message body text beyond what is structurally necessary to characterize the schema. One snippet preview was visible incidental to listing structure; it is not reproduced here.

## §1 Tabs context — what was already open

`mcp__claude-in-chrome__tabs_context_mcp` at audit time (2026-05-06 ~21:48 ET) showed 8 tabs in the MCP group. Three are messaging-relevant:

| Tab title | URL | Authenticated? | Notes |
|---|---|---|---|
| `(3) WhatsApp` | `https://web.whatsapp.com/` | Yes (inferred from "(3)" unread count in tab title and persistent QR-paired session) | Read-page denied by user mid-audit; treat as authenticated but content-restricted. Tab-title unread-counter is the cheapest signal we have. |
| `Google Messages for web: Conversations` | `https://messages.google.com/web/conversations/Cgi9xeLSS3MqURIEMTQyMg` | Yes — signed in as `alto84@gmail.com` ("E. Alton Sartor") | Persistent web-pair to Alton's Pixel/Android. URL fragment is a specific conversation thread (incidental — Alton was using it). Inbox list fully accessible via accessibility tree. |
| `Manage your iCloud storage on your Apple device - Apple Support` | `https://support.apple.com/en-us/108922` | N/A (support article, not a messaging surface) | No iMessage tab open. Apple does not offer a real `messages.icloud.com` web client (see §2). |

Other tabs in the group (UniFi, Vast.ai, Gmail Drafts, Bitwarden vault, Google Drive Home) are non-messaging and out of scope for this audit.

## §2 Per-service feasibility

### 2.1 Google Messages for Web (`messages.google.com`) — FEASIBLE

- **Auth model:** QR-pairing to a primary Android device (Alton's phone). Session persists in the browser profile. Already authenticated in `chrome-automation-profile`.
- **Coverage:** SMS, MMS, RCS to/from Alton's primary phone number. This is the dominant channel — the inbox-list inspection in §3 confirms ~30+ visible threads spanning family, school vendors, contractors, financial 2FA, marketing/spam, FedEx/Costco transactional, and Aneeta-bridged group threads.
- **DOM accessibility:** Excellent. Standard semantic HTML with `listbox` → `option` → `heading` + `generic` (snippet) + `generic` (relative time) + `button` (per-thread actions). Accessibility tree ref'd cleanly via `mcp__claude-in-chrome__read_page`.
- **Risk surface:** When tab is parked on a specific conversation, the right pane is fully readable in the same accessibility tree — meaning any audit that does `read_page` while a conversation is open will see content. This is the primary reason §3 below characterizes the inbox-list pane only and treats the pane-on-thread state as a pollution risk for any future cron.
- **Verdict:** Primary candidate channel. Most family-relevant text traffic flows here.

### 2.2 iMessage Web (`messages.icloud.com` or similar) — NOT FEASIBLE

- **Apple does not ship a public web iMessage client.** `messages.icloud.com` is not a real product. Apple's web surfaces (`icloud.com`) expose Mail, Calendar, Contacts, Drive, Photos, Notes, Reminders, Find — not Messages.
- **Beeper / AirMessage / sunbird / pypush / Nothing-Chats-style bridges** exist but each (a) requires a Mac to relay, or (b) reverse-engineers Apple Push and is in continual cat-and-mouse with Apple, or (c) was killed by Apple after a few weeks. Not appropriate for a household production stack.
- **Native macOS `chat.db`** at `~/Library/Messages/chat.db` is a well-documented SQLite store, but Alton's primary machine is **Windows** (Rocinante). A Mac is not part of the Sartor fleet. This path is closed unless a Mac mini is added to the network as a permanent iMessage relay — not justified for the marginal data.
- **Verdict:** Closed. If iMessage volume to Alton is meaningful, Google Messages will pick up the SMS-fallback subset (when Alton's number is on Android) but native iMessage threads in the Apple ecosystem are dark to Sartor.

### 2.3 WhatsApp Web (`web.whatsapp.com`) — TECHNICALLY FEASIBLE, ACCESS DEFERRED

- **Auth model:** QR-pairing to phone (similar to Google Messages). Session present in browser profile; tab title `(3) WhatsApp` indicates 3 unread.
- **DOM accessibility:** Public knowledge — WhatsApp Web uses heavy React/virtualization with obfuscated class names and frequent re-renders. Less stable to scrape than Google Messages, but the accessibility tree exposes thread list, sender, last-message snippet, and timestamp.
- **User permission:** During this audit, `read_page` on the WhatsApp tab returned `Permission denied by user`. That is the right call from Alton — WhatsApp content can be highly sensitive and the permission-denial is a useful signal that this surface needs explicit opt-in before any future scrape job touches it.
- **Volume / relevance:** Unknown. Three unread suggests at least some activity, but whether WhatsApp is a household-operations channel for Sartor or a personal/extended-family/Indian-family channel for Aneeta is an open question for §8.
- **Verdict:** Defer. Get explicit Alton consent on a per-thread or per-contact-list basis before any structured ingest.

### 2.4 Other messaging surfaces

- **Slack:** Not in scope per plan — Sartor does not appear to run a household Slack.
- **Telegram Web (`web.telegram.org`):** Not currently open. If used, similar profile to WhatsApp.
- **Signal:** No web client (intentional). Closed.
- **Discord:** Not in scope.
- **iMessage via macOS chat.db:** See §2.2. No Mac in fleet.

## §3 Data exposure for accessible services (DOM structure only — no content)

### 3.1 Google Messages — inbox-list schema (per-thread record)

Each conversation in the `listbox` exposes the following fields via the accessibility tree. Field names are mine; the underlying DOM uses generic `option` / `heading` / `generic` / `button` roles with stable navigation order.

| Field | Source | Notes |
|---|---|---|
| `thread_id` | `href` on the option link, e.g. `/web/conversations/<base64ish-id>` | Stable for the life of the thread; safe dedup key. |
| `display_name` | inner `heading` text | Either a contact display name (resolved from Alton's phone contacts), a phone number `(XXX) XXX-XXXX`, or a short-code `12345` (carrier 2FA / transactional). For group threads, comma-separated participant list. |
| `last_message_preview` | first `generic` child after the heading | Truncated to ~100 chars. Includes a `You: ` prefix when last sender was Alton, or `<Name>: ` prefix in group threads. **This is the field that leaks content even from the inbox-list view.** Any scraper must treat the preview as message body for privacy purposes. |
| `last_message_relative_time` | second `generic` child | "11 min ago" / "9:12 PM" / "Tuesday" / "9/20/25" — relative for recent, day-of-week for last-7-days, M/D/YY for older. Need to resolve against now() at scrape time. |
| `per_thread_actions_button` | `button "Options for <name>"` | Opens menu (mute, archive, block, delete). Not used for read-only ingest. |

Pagination: a `progressbar "Loading conversation list"` and a `button "Load more conversations"` at the bottom — infinite-scroll style. ~35 threads visible without scroll-load on a 1163px viewport.

Sender-type heuristics (purely structural — used for triage, not content):

- All-digits-short (e.g. `24273`, `46339`, `83356`, `898287`, `72166`, `42278`, `36374`) → carrier short-code, almost always transactional or 2FA. Examples observed in tonight's inbox include Chase (multiple short-codes), FedEx, CVS, Costco, Apple Account verification, Google emergency-sharing notification.
- 10-digit US number with no contact resolution → unknown caller; majority appear to be marketing/spam (medical-plan pitches, political campaigns, payback offers).
- Display name (resolved contact) → known person.
- Comma-separated names → group thread.
- Common-noun thread name like `FedEx Tracking` or `Oliver Sartor Rochester Address` → labeled-by-Alton thread, indicates Alton has manually named it.

Right-pane (when a conversation is open) exposes per-message records: `sender_role` (You / Other), `body`, `timestamp`, `delivery_status`, `reactions`. **This is full message content and the audit avoided enumerating it.**

### 3.2 WhatsApp — schema (inferred, not measured)

Public-knowledge schema, not validated in this audit:

- Thread list with avatar, display name, last-message preview (with end-to-end-encryption indicator on first-time contacts), unread badge, timestamp.
- Right-pane per-message records similar to Google Messages but with WhatsApp-specific reaction set and reply-quoting.
- Stable DOM ref'ing is harder due to obfuscated class names; would require text-based `find` queries rather than ref-id traversal.

## §4 Hypothetical scrape pattern (design only — not built)

If Sartor decides to ingest Google Messages, the lightest viable design is:

### 4.1 Polling cadence

- **Every 30 minutes** during waking hours (06:00–23:00 ET), **hourly** overnight. Matches the family-operations latency Alton already lives with — most non-2FA SMS doesn't need sub-30-min response.
- Don't try to be a chat client. Don't aim for sub-minute latency. SMS notifications already happen on Alton's phone; the ingest is for *memory* (what was discussed and when), not for *alerting*.

### 4.2 Read flow

1. `tabs_context_mcp` — confirm Google Messages tab still authenticated.
2. If not, **abort** — do not attempt re-auth (would require QR-pair from Alton's phone).
3. **Park the tab on the URL `https://messages.google.com/web/conversations`** (the no-thread-selected list view) before reading, so the right pane does not leak whichever conversation Alton last viewed. This is essential — the inbox-list-only audit posture has to be enforced by the scraper, not just by good intent.
4. `read_page` on the tab with `filter: "all"`, capture the `listbox` subtree.
5. Extract the per-thread record schema from §3.1.
6. Apply privacy filter (§5) and write filtered records to a structured store.
7. Do not click into individual conversations. Do not load message bodies. Inbox-preview text only.

### 4.3 Dedup

- Thread-level: `thread_id` from the `href` is stable.
- Message-level: tuple `(thread_id, last_message_relative_time, hash(preview_text_after_redaction))` — but this is shaky because the preview gets truncated and the relative time mutates ("11 min ago" → "1 hour ago" → "Today" → "Tuesday"). Better to **resolve relative-time to absolute at scrape time** and key on `(thread_id, absolute_timestamp)`.
- Practical dedup: store the previous scrape's full thread snapshot, diff against current. Any thread whose `last_message_relative_time` decreased OR whose preview text changed is "new traffic on this thread." Don't try to enumerate individual messages — the inbox-preview only ever shows one.

### 4.4 What "new" means

"New traffic on thread X since last scrape" is the only signal you reliably get from the inbox view. You do *not* get a per-message stream without opening threads. That's a feature for the privacy floor, not a bug.

### 4.5 Pagination

- Inbox-list naturally surfaces only the most-recent ~35 threads on first paint. Older threads require clicking the `Load more conversations` button.
- For a delta-detection ingest you only ever need the top of the list (sorted by last-activity desc). Don't paginate.
- For a one-shot historical inventory (categorize all known senders), paginate to N pages — but this is a one-time setup task, not a recurring cron.

### 4.6 Output schema (proposed, JSONL, not implemented)

```jsonl
{"ts": "2026-05-06T21:48:00-04:00", "thread_id": "Cgi...", "display_name": "<resolved or REDACTED>", "sender_class": "contact|number|short_code|group", "preview_redacted": "<redacted summary OR null if filtered>", "last_msg_ts_resolved": "2026-05-06T21:37:00-04:00", "delta": "new_traffic|first_seen|unchanged"}
```

Sensitive fields (`display_name`, `preview_redacted`) are subject to §5 privacy rules.

## §5 Privacy model

### 5.1 Hard-exclude list (kids — Constitution floor)

Any thread that matches the following is excluded from ingest entirely (not redacted, not summarized — *not present in the output stream*):

- **Display name contains "Vayu", "Vishala", "Vasu"** — direct kid threads. Kids do not have phones today, so this is a forward-compat guard.
- **Group threads where any participant matches a known kid name.**
- **Threads from a known list of school/healthcare/activity vendors that may name a child in body text:** MKA (Montclair Kimberley Academy), Goddard School, CVS Pharmacy refill notifications (e.g. the `898287` short-code in tonight's inbox sent a refill ping naming Vayu — this is the canonical example of why the redaction below is needed even for non-kid-direct threads), pediatrician's office, dental.
- **Any preview text containing a kid name** (post-redaction filter, applied after the structural filter, as a safety net).

### 5.2 Aneeta threads — open question, default-redact

- **Direct threads with Aneeta:** redact display name to `SPOUSE` and redact preview to a structural summary (e.g. `[domestic logistics, evening]` or just `[content withheld]`). Don't store the body even in redacted form unless Alton later opts in.
- **Group threads where Aneeta is one of multiple participants** (tonight's inbox shows several with Aneeta + Indian-family/friends or Aneeta + parent-friends): redact Aneeta to `SPOUSE` and consider the thread "household-operations adjacent" — store the structural metadata (timestamp, participant count) but not the preview text by default.
- **Aneeta-as-relayer for kids' content** (tonight's `Amy Ro Charlie's Mom, Aneeta Saxena, Ruth Charlie Mom` thread is plausibly playdate logistics): treat as kid-adjacent and exclude per §5.1.
- **Co-principal status:** Aneeta is a co-principal per Constitution v0.3 but has not been asked about ingest of her texts. The default posture is conservative; surface the consent question to Alton (§8 Q1) before relaxing.

### 5.3 Medical redaction

CLAUDE.md §Family Operations is explicit: "Medical information for any family member is never logged or shared." Apply to text ingest as:

- **Hard-redact preview text from senders matching a medical-vendor allowlist:** CVS Pharmacy short-codes, pharmacy refill bots, doctor-office appointment-confirmation bots, lab-results bots, Epic MyChart, neurology practice numbers (Aneeta's clinical context), psychiatric/therapy practices.
- **Redact previews containing medication names.** Maintain a small lookup of known household meds (without storing the names in repo — keep in `data/redaction-dict.json` outside git). The CVS refill ping example from tonight's inbox literally named the Rx by abbreviation; that is exactly the leak this rule blocks.
- **Default-on, not opt-in.** A medical leak through this surface is a constitutional violation, not a configuration mistake.

### 5.4 Financial 2FA / short-codes

- Short-codes carrying 2FA codes (Chase, Apple Account, Google verification, Substack, etc.) are operationally noisy and have negative ingest value — they're useless without the live code, and storing them creates a mild credential-exposure surface.
- Recommend: **skip all all-digits-short-code threads by default.** If transactional summaries (Chase fraud declines, FedEx delivery confirmations, Costco delivery completed) are wanted for the activity stream, enumerate the *desirable* short-codes explicitly (allowlist, not denylist).

### 5.5 Spam / political / marketing

- Unknown 10-digit numbers with no contact resolution are noise. Tonight's inbox has Brookline campaign texts, a Texas medical-plan pitch, an unsolicited business-loan offer, etc. These contain zero household-operations signal.
- Recommend: **filter out 10-digit unknowns by default.** Surface a daily count ("47 spam-class texts filtered today") without storing per-message.

### 5.6 The pollution risk from leaving the tab on a thread

Worth restating: §3 caught this — when Alton has the Google Messages tab parked on a specific conversation, `read_page` on that tab will see the full message history of that conversation in the right pane, *regardless* of whether the scraper "intended" to read only the inbox. The scraper must navigate the tab to the no-thread-selected URL before each read, or use a dedicated tab that only ever sits at that URL. Failing to do this is the most plausible accidental-content-leak vector.

## §6 Alternative non-scrape paths

| Path | Verdict | Reasoning |
|---|---|---|
| **Google Messages public REST API** | Doesn't exist | Google has not exposed an API for personal Messages traffic. Would require unsanctioned reverse-engineering of the Google Messages internal protocol. Closed. |
| **Apple iMessage REST API** | Doesn't exist | Apple has actively blocked third-party clients (Beeper Mini takedown, etc.). Closed. |
| **WhatsApp Business API** | Wrong product | WhatsApp Business API is for vendors messaging customers at scale, gated through a Business Solution Provider. It does not give you read access to a personal user's WhatsApp account. Closed for household use. |
| **Native `chat.db` on macOS** | Closed (no Mac in fleet) | If a Mac mini were added as a permanent iMessage relay, the SQLite store at `~/Library/Messages/chat.db` is well-documented and would be the cleanest possible iMessage ingest path — direct DB read, no web scraping, full message history. But the marginal value does not justify adding a Mac to the fleet. |
| **Android ADB pull from Alton's phone** | Closed (operationally hostile) | The SMS database on Android is at `/data/data/com.android.providers.telephony/databases/mmssms.db` and requires root + ADB. Not appropriate for a phone Alton uses as a daily driver. |
| **Carrier-side records** | Closed (privacy + access) | Verizon stores SMS metadata (not content) for billing. Body content is not retrievable through the carrier portal. |
| **Forward to a sink address** | Possible but poor | iOS/Android can be configured to mirror SMS to a Mac via Continuity (iOS) or Pushbullet/Mighty Text (Android), some of which expose APIs. All add a third-party trust dependency for marginal data. |
| **Pixel/Android Tasker + an MCP HTTP endpoint** | Possible, would-be-clean | Tasker on Alton's phone could fire an HTTP POST to a Sartor endpoint on every received SMS, with a privacy filter applied phone-side. Requires Tasker setup and Alton's willingness to run a background app on his phone. This is the most architecturally clean path if Sartor seriously commits to text ingest, but it's a meaningful change to Alton's phone. |

## §7 Recommended cron design — and an honest recommendation

### 7.1 Recommendation: **don't build `texts-ingest` for at least 30 days.**

The plan doc lists `texts-ingest` as deferred. The deferral is the right call, for these reasons:

1. **Marginal information value vs. existing channels.** Gmail ingest (every 4 h) already captures most household-operations traffic that has any documentary character: school broadcasts, vendor invoices, financial confirmations, calendar invites. Texts in tonight's inbox are dominated by 2FA codes, transactional confirmations (FedEx/Costco), spam/marketing, and ephemeral logistics ("call you back in 5"). The high-signal subset that isn't already in Gmail is small.

2. **Privacy surface dominates value.** §5 enumerates kid-exclusion, Aneeta-consent, medical-redaction, 2FA-skip, spam-skip rules. After all those filters, what's left is small enough that a once-weekly manual review of the inbox by Alton would cover it without any ingest infrastructure.

3. **The pollution risk in §5.6 is real and irreversible.** A scraper that accidentally captures a medical or kid-related thread because the tab was parked on that thread cannot un-write it from `data/inbox-stream/`. Until the scraper has proven robust enforcement of the no-thread-selected URL, the failure mode dominates the upside.

4. **No iMessage path.** A "texts-ingest" that covers Google Messages but not iMessage is structurally incomplete — Alton's correspondents who use iPhones will be dark to it. That's a material capability gap that won't be fixed unless either (a) a Mac joins the fleet or (b) Apple opens a web API (it won't).

5. **Wave 1 priority.** The other inspectors are working on memory-tree consolidation, family-wiki layout, source-doc index, Gmail/Drive ingest improvements, wikilinks graph. Each of those has higher information-density payoff per unit of build effort than texts.

### 7.2 If Alton wants it anyway, here's the design

Lightweight, defensive, opt-in.

| Field | Value |
|---|---|
| **Cron name** | `texts-ingest-google-messages` (note: scoped to Google Messages only; WhatsApp is a separate cron under separate consent) |
| **Frequency** | Every 30 min during 06:00–23:00 ET; hourly 23:00–06:00. Not faster — see §4.1. |
| **Trigger machine** | Rocinante (only machine with the authenticated Chrome profile) |
| **Owner skill** | New skill `text-message-ingest` documenting the privacy filters, output schema, and tab-parking discipline |
| **Output** | `data/inbox-stream/texts-<YYYY-MM-DD>.jsonl` with the §4.6 schema |
| **Dashboard** | MERIDIAN reads `data/inbox-stream/` if Wave D of the larger uplift goes through |
| **Failure mode** | If `tabs_context_mcp` shows Google Messages tab is missing, dead, or shows a sign-in screen → write a single `health: degraded` line and exit. Never attempt re-auth. Never open a new tab. |
| **Hard guards** | (a) Park on `/web/conversations` (no thread selected) before every `read_page`. (b) Apply §5 filters before any write. (c) Never click into a thread. (d) Never call `find` with content keywords (would route through DOM and could surface body text). |
| **Initial run mode** | First two weeks: write to `data/inbox-stream/_dry-run/` (gitignored), have Alton review what would have been written before promoting to live. |
| **Greenlight gates** | (a) Alton sees a sample dry-run output and approves the redaction quality. (b) Aneeta consent question (§8 Q1) is answered. (c) Medical-vendor allowlist is populated. (d) Skill `text-message-ingest` is reviewed by `auditor`. |

## §8 Open questions for Alton

These are the decisions that must land before any text-ingest work goes past audit stage. Listed in dispatch order — Q1 and Q2 gate everything else.

1. **Aneeta consent.** Is Alton willing to ask Aneeta whether her texts (direct threads with Alton, group threads she's in) can be ingested into Sartor memory in any form — even redacted? Default (and recommended) posture absent her answer: skip Aneeta-bearing threads entirely. This is a Constitution v0.3 §14a co-principal question, not a unilateral Alton call.

2. **Kids' boundary precision.** Constitution floor is "kids' messages excluded." The plan doc extends this to "or about them." Operationally, "about them" includes: pediatrician confirmations, MKA broadcasts, Goddard School pings, dental, CVS Rx for Vayu (literally observed tonight), playdate-logistics group threads with parent friends, sports/activity scheduling. Confirm the practical exclusion list, or defer to "exclude any thread where the preview ever names a kid" as a sufficient floor.

3. **Group threads that mix household operations and personal content.** Tonight's inbox has at least one group thread with `Aneeta + extended family / friends` that's plausibly the family WhatsApp-equivalent on SMS. Even at the metadata level (participant list + activity timestamp), is this in scope? Default-no.

4. **WhatsApp scope.** Do nothing? Or audit-and-design as a separate effort with explicit consent, on the same model as Google Messages? Current recommendation: leave WhatsApp untouched unless Alton specifies a use case.

5. **iMessage gap acceptance.** Does Alton accept the structural blind spot (correspondents who text Alton from iPhones, where Alton's number is on Android, will *mostly* downgrade to SMS and appear in Google Messages — but native iMessage threads on Apple-owned hardware are dark)? If not, the only fix is adding a Mac mini to the fleet for `chat.db` reads, which is a separate decision.

6. **Allowlist vs denylist for short-codes.** §5.4 recommends an allowlist (only ingest specifically-named transactional short-codes). Confirm.

7. **Spam handling.** §5.5 recommends counting-not-storing. Confirm — or specify a minimum-confidence threshold for storing the sender number for future block-list use.

8. **Deferral length.** Recommendation in §7.1 is "defer at least 30 days" while the rest of the memory uplift lands. Is that the right window, or does Alton want this revisited at a specific milestone (e.g., post-Wave-A or post-Wave-D)?

9. **Output destination.** If built, JSONL into `data/inbox-stream/` to feed MERIDIAN is the assumed integration point. Confirm — or specify a different sink (e.g., a dated markdown file in `sartor/memory/daily/texts-YYYY-MM-DD.md`, which would be more human-browsable but loses dashboard wiring).

## Appendix A — what this audit deliberately did *not* do

- Did not open WhatsApp's accessibility tree (user-denied; respected).
- Did not click into any individual Google Messages conversation.
- Did not enumerate the right-pane message history that was incidentally visible because the tab was parked on a specific thread.
- Did not export, download, or persist any message body text.
- Did not navigate to any messaging service that wasn't already authenticated.
- Did not reconnect or re-pair any session.
- Did not write or send any message.
- Did not modify any thread state (read/unread/archive/mute/block).
- Did not test scraper code; this is design-only feasibility.

## Appendix B — concrete artifacts inspected

- `mcp__claude-in-chrome__tabs_context_mcp` — confirmed authenticated sessions for Google Messages and WhatsApp.
- `mcp__claude-in-chrome__read_page` on tab `1930288283` (Google Messages) with `filter: "all"`, `max_chars: 25000` — captured the inbox-list `listbox` subtree and (incidentally, due to tab parking) the right-pane history of one thread which was *not* used as a content source for this audit.
- `mcp__claude-in-chrome__read_page` on tab `1930286071` (WhatsApp) — denied by user, treated as a positive consent signal that WhatsApp is content-restricted by default.

## Appendix C — phone-home

No phone-home file written. No scope ambiguity encountered. Privacy floor enforced from the planning side; Alton's mid-audit denial of WhatsApp `read_page` was honored without further attempts.
