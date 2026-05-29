---
type: project
entity: fleet-ledger
created: 2026-05-28
updated: 2026-05-28
status: building
priority: p1
owner: Rocinante (Opus 4.8, ultracode)
tags: [project/fleet-ledger, domain/solar-inference, domain/tax, domain/accounting, machine/fleet]
related: [BUSINESS, solar-inference, rental-operations, TAXES, MACHINES, matters/INDEX, approved-pricing]
---

# Fleet Ledger — durable accounting + telemetry + reconciliation for the Solar Inference fleet

Complex-project phase log. Frame (Phase 0) and Plan (Phase 2) below; Explore (Phase 1) = the
2026-05-28 audit + verification workflow (see `## Phase 1` for artifacts). Each phase commits.

## Phase 0 — Frame

**Problem.** A 2026-05-28 four-domain audit of the vast.ai rental business found that every critical
defect traces to one root cause: **operational reality (revenue, machine state, power draw, purchases)
lives on the machines and in receipts but never reaches the memory tree; canonical docs drift from
live state with nothing reconciling them; and fix-lists get written but never executed** (the
2026-05-26 doc-drift audit's corrections were never applied; `fleet-watchdog.py` was built but never
scheduled). Concretely: Solar Inference LLC has **no books** (no ledger, no income statement, no
balance sheet), TY2026 vast.ai **revenue is recorded nowhere** while it accrues, **electricity is
metered on one machine and that data never lands in the repo** (and the entire solar-ITC claim
depends on documenting business-purpose kWh), the **§469 material-participation hours log counts
automated bot activity** as the taxpayer's personal hours, ~**$41K of equipment sits on personal cards**
with no capital-contribution entry, and **list prices in runnable relist commands are stale by up to
2× the live value** (a copy-paste relist would halve revenue).

**Why now.** The fleet is growing (rig 3 ordered ~2026-05-26, a third GPU host) — the control gaps
compound with every machine. The TY2026 return (solar ITC + bonus depreciation, documented at $131K
but realistically business-fraction-limited) is being assembled on facts that don't exist in any
system. The recurring "audit → unactioned fix-list" pattern means another report would change nothing.

**Success criteria (pre-registered, frozen 2026-05-28).**
1. **Reusable.** Adding machine N+1 to the fleet is one stanza in `fleet.yaml`; all downstream
   (books, depreciation, ITC fraction, monitoring, dashboard) iterates over that file — no per-machine
   code. *Test:* add a synthetic 4th machine row, run the pipeline, it appears everywhere with no code edit.
2. **Ingests live data.** vast.ai revenue + machine state pull on a schedule into versioned CSV/JSON;
   per-machine power kWh lands in the repo; purchase records captured in a structured ledger.
   *Test:* `vastai_pull.py` writes a non-empty `revenue-2026.csv` and `fleet-state.json` from a live pull.
3. **Computes the books.** `books.py` produces income statement, balance sheet, depreciation schedule,
   the ITC business-use-fraction worksheet, and a clean §469 hours summary — from the data files, with
   computed-vs-unknown distinguished and zero fabricated figures. *Test:* runs clean; numbers reconcile
   to the seeded receipts.
4. **Monitors + reconciles.** `fleet-watchdog.py` is *actually scheduled* (Windows task exists and has
   run), checks listing expiry, and writes a health state the dashboard reads; `reconcile.py` flags any
   live-vs-doc drift. *Test:* `Get-ScheduledTask SartorFleetWatchdog` returns Ready; a stale approved
   price triggers a drift alert.
5. **Connected.** Fleet financials + health surface on the MERIDIAN dashboard; canonical memory docs
   corrected to live state; the tax findings route to the CPA (drafted) and to `matters/`.
6. **§469 honesty.** The hours extractor no longer counts sidechain/peer/cron sessions as Alton's
   participation. *Test:* the 07:30:01→23:30:01 cron-bounded zero-content rows drop out.

**Scope.**
- **In:** the data layer (`fleet.yaml` + `data/financial/solar-inference/` ledgers), ingestion scripts
  (`scripts/fleet/`), books computation, watchdog wiring + scheduling, doc reconciliation + fixes,
  dashboard integration, hours-log fix, CPA email *draft*, matters updates, family-wiki/todos sweep,
  wiki reindex.
- **Out / gated:** sending any external communication (drafts only); changing live vast.ai listing
  prices (needs Alton greenlight — D1); editing CLAUDE.md (staged diff, needs Alton approval per
  CLAUDE.md's own rule); filing-level tax decisions (route to CPA Jonathan Francis); buying wall-plug
  power meters (recommended, needs purchase auth).

**Known constraints.** Canonical git remote is the rtxserver bare repo; GitHub is mirror-only. Peer
hosts have no GitHub creds. gpuserver1 holds the authenticated vast.ai CLI (single ingestion point).
`gpuserver1/MISSION.md` is peer-authored — corrections via inbox proposal, not overwrite.

## Phase 1 — Explore (audit + verification)

- **Audit (2026-05-28):** four parallel investigators — rental framework (live ground truth via vast.ai
  CLI), tax structure, accounting/bookkeeping, documentation consistency. See `AUDIT-FINDINGS.md`.
- **Adversarial verification (workflow `wf_38a71732-385`):** 7 refutation agents (live web search for
  post-2025 tax law) + 2 completeness critics. Verdicts + corrections in `VERIFICATION.md`. Headline
  corrections: controlling section is **§48E** (not §48) post-2024; **§25D dead** after 12/31/2025
  (OBBB); **July 4 2026 is a real statutory begin-construction deadline** (Notice 2025-42), mislabeled
  in the docs as placed-in-service; 2026 bonus depreciation is **100% permanent**. Completeness critics
  surfaced **insurance** (Selective HO policy likely voids commercial GPU use) and **registered-agent /
  NJ dissolution** risk as HIGH misses.
- Prior art built on: `scripts/fleet-watchdog.py`, `approved-pricing.yaml`, `sartor-power` logger
  (gpuserver1; never reaches repo), `dashboard/family/` (existing finances pipeline), `REGISTRY.yaml`.

## Phase 2 — Plan

**Architecture: one canonical source per fact → derived artifacts.** No parallel registries.

```
machines/REGISTRY.yaml         network identity (canonical, exists)
business/approved-pricing.yaml approved list prices (exists)
data/financial/solar-inference/
  fleet.yaml                   BUSINESS layer per machine (cost basis, in-service, power profile,   [NEW — spine]
                               depreciation class, business_use_fraction); links REGISTRY by id/host
  revenue-2026.csv             vast.ai earnings, auto-pulled                                         [NEW, auto]
  expenses-2026.csv            purchases + recurring, seeded from receipts                           [NEW, seeded]
  capital-accounts.yaml        member capital contributions (our-record Exhibit A)                   [NEW, seeded]
  power-2026.csv               per-machine kWh, auto-ingested                                        [NEW, auto]
  fleet-state.json             latest live vast.ai snapshot                                          [NEW, auto]
scripts/fleet/
  vastai_client.py             shared SSH+CLI query helpers
  vastai_pull.py               revenue + state ingestion
  power_ingest.py              kWh ingestion from host loggers
  reconcile.py                 live-vs-doc drift detector -> inbox alert
  books.py                     ledger -> statements + ITC fraction + depreciation + §469 -> json + md
scripts/fleet-watchdog.py      [extend] + end_date check + fleet-health.json + notify channel + SCHEDULE
scripts/hours-log-extract.py   [fix] filter sidechain/peer/cron; add human_interactive_hours
dashboard/family/              [integrate] fleet financials + health panel
```

**Method ladder (build order; each gates the next):** (1) `fleet.yaml` spine → (2) seed ledgers +
`vastai_client`/`vastai_pull`/`power_ingest`/`reconcile` → (3) `books.py` → (4) watchdog expiry+health+
notify+schedule → (5) hours-log fix → (6) dashboard → (7) doc reconciliation+fixes → (8) adversarial
review → revise → re-review → (9) CPA draft + matters + family sweep + wiki reindex.

**Open decisions for Alton (greenlight gates):**
- D1: gpuserver1/rtxserver live list prices ($0.80 / $1.10) vs approved ($0.80 / $0.92) — which is intended?
- D2: phone-alert channel for the watchdog (Pushover / Telegram / dashboard-only) — code activation-ready.
- D3: buy wall-plug kWh meters (~$25/machine) for ITC-grade business-use substantiation?
- D4 (NEW from verification): disclose the GPU business to Selective (homeowner's insurer) + get commercial
  coverage before rig 3 goes live — tax/insurance tension is material.
- D5 (NEW): confirm Solar Inference LLC registered agent + NJ good standing (Entity 0451339243) after
  LegalZoom cancellation; calendar the Sept 6 NJ annual report ($75).
- D6 (NEW): document begin-construction by July 4 2026 (5% safe harbor via the $219K draws) to lock the
  §48E credit window per Notice 2025-42.

## Phase log

- 2026-05-28: Phase 0/2 framed; verification workflow landed; `fleet.yaml` spine next. bg-isolation
  disabled for this repo (work must drive live tree: scheduled tasks, dashboard, wiki reindex).
