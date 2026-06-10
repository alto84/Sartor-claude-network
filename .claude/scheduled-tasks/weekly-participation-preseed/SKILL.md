---
name: scheduled-weekly-participation-preseed
description: Sunday evening §469 participation-log pre-seed from the week's Gmail/Calendar signals
model: sonnet
---

This is a scheduled task that runs every Sunday at 7:30 PM ET.

Purpose: keep the §469 material-participation record contemporaneous. The
automated hours log (`all-hours.csv`) captures only Alton's Claude-session
keyboard time; this task pre-seeds the manual log with everything else.

Steps:
1. Scan the past 7 days of Gmail and Google Calendar for Solar Inference LLC
   activity signals: threads with Lucent (steven@/audrey.vera@/doug.paige@
   lucent-energy.com), Climate First (erin.gannon@, SolarLoans@), Berman,
   Jonathan Francis (jf@francis-cpa.com), Newegg/Amazon hardware orders,
   vast.ai notifications, and any calendar events tagged to the business.
2. For each signal, append a candidate row to
   `sartor/memory/business/hours-log/participation-log.csv` with person and
   hours left as FILL, a concrete operator-level description, the
   corroboration reference (thread id / order number / calendar event), and
   `prepared` = today's date. Do NOT estimate hours autonomously — the members
   fill or strike candidates.
3. If a member meeting appears to have occurred (calendar or explicit mention),
   create a stub minutes file from `business/minutes/TEMPLATE.md`.
4. Output a 5-line-max summary listing the candidate rows added, so Alton and
   Aneeta can fill hours while the week is fresh. If nothing found, say so in
   one line and add nothing.

Rules: never fabricate dates or hours; every candidate row must cite a real
artifact. Household/family and W-2-job items are excluded.
