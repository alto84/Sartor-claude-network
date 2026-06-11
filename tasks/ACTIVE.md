# Active Work Streams

> Regenerated 2026-06-11 during the overnight review. The prior ACTIVE.md still
> presented expired April deadlines (1040 by Apr 15, MKA tuition Apr 10, etc.)
> as open. The pre-regeneration snapshot is archived at
> `tasks/archive/2026-06-11-ACTIVE-preregeneration.md`. Items below are either
> genuinely open or marked "STATUS UNCERTAIN — verify" where resolution could
> not be confirmed from available memory. Conservative by design: nothing was
> deleted on a guess. Tax/legal deadlines are tracked canonically in
> `sartor/memory/matters/INDEX.md` — this file links out rather than duplicating.

## GPU Business (Solar Inference LLC)

- [ ] **gpuserver2 (3rd RTX 5090) onboarding** — AM5 build, parts arriving Jun 11–12. Onboarding in progress (separate agent tonight). Enrolls in reprice.py v3 dynamic pricing at listing.
- [ ] **Fleet relist cycle** — Jun 23 relist trigger → Jun 30 listing expiries (52271 + 124192). Re-run pricing scan, apply "short-term first" defaults at relist.
- [ ] Solar installation timeline vs §48E ITC begin-construction lock (Jul 4) — coordinate with installer/CPA. [matter](../sartor/memory/matters/solar-itc-48-vs-25d.md)
- [ ] Doug Paige / Lucent Energy solar-roof follow-up — STATUS UNCERTAIN: verify whether still open (last referenced April). [solar-roof](../work/solar-inference/solar-roof.md)
- [x] ~~Berman Home Systems WiFi upgrade~~ — superseded: network was hardened via the Sartor-Saxena-Claude UniFi takeover (2026-05-01 onward) + overnight WAN/network work; the $12,435 Berman quote is no longer the active path. STATUS UNCERTAIN on any residual Berman commitment — verify before treating as fully closed.

## Taxes & Financial Structuring

Canonical tracker: `sartor/memory/matters/INDEX.md` (18 open matters). Near-term:

- [ ] **Insurance commercial-coverage gap — Jun 15** (HIGH). [matter](../sartor/memory/matters/insurance-commercial-coverage.md)
- [ ] **Q2 2026 estimated tax — Jun 15** (wage bump + un-withheld LLC rental income). [matter](../sartor/memory/matters/q2-2026-estimated-tax.md)
- [ ] **FEOC material-assistance ≥40% cost ratio** (HIGH, start now). [matter](../sartor/memory/matters/feoc-material-assistance-48e.md)
- [ ] **§48E ITC + begin-construction lock — Jul 4** (HIGH). [matter](../sartor/memory/matters/solar-itc-48-vs-25d.md)
- [ ] HELOC §163(h)(3) use-of-proceeds tracing — Oct 15. [matter](../sartor/memory/matters/heloc-163h3-tracing.md)
- [ ] Convert CPA (Jonathan Francis) engagement from verbal to written. [matter](../sartor/memory/matters/cpa-engagement-letter.md)
- [ ] TY2025 personal 1040 — STATUS UNCERTAIN: April 15 deadline passed; confirm whether filed or on extension (Form 4868). Verify with CPA. [personal-2025](../work/taxes/personal-2025.md)

## Nonprofit (Sante Total)

- [x] ~~File Form 990 for TY2025~~ DONE 2026-04-07: 990-N e-Postcard filed (gross receipts < $50K).
- [ ] IRS penalty abatement response — STATUS UNCERTAIN: verify current status (pending as of 2026-03). [nonprofit status](../docs/nonprofit-pending-items.md)
- [ ] Bank account setup / EIN verification — STATUS UNCERTAIN: verify whether resolved. [nonprofit pending](../docs/nonprofit-pending-items.md)
- [ ] 990-N → 990-EZ migration (TY2026 forward). [matter](../sartor/memory/matters/sante-total-990ez-migration.md)

## Family

- [ ] Abby's graduation (Jun 18) — identify "Abby" + confirm logistics. STATUS UNCERTAIN — verify with Aneeta.
- [ ] Summer 2026 plans (Disney July 2026 trip tracked at `sartor/memory/family/disney-july-2026.md`).

## Career

- [ ] AZ Senior Medical Director (NYC) — role transition in progress (Alton commuting 3 days/week). STATUS UNCERTAIN on formal promotion close — verify.
- [ ] Chief Patient Safety Officer opportunity (Andy Stecker / Crawford Thomas) — STATUS UNCERTAIN: verify whether still active or declined.

## Infrastructure

- [x] ~~Heartbeat scheduled tasks~~ DONE — full Windows scheduled-task suite now live (mirror, creds-sync, sessions-mirror, hours-log, fleet reprice/watchdog/ledger, network dashboard, wifi-health, etc.).
- [ ] **Mirror-pipeline divergence** — "Sartor Memory Mirror" exits DIVERGED-MIRROR (LastTaskResult=2) when cloud runners push direct to github/main. Proposal filed 2026-06-11 at `sartor/memory/inbox/rocinante/2026-06-11-mirror-pipeline-proposal.md` (awaiting Alton). New auditor `scripts/win-tasks/check-task-health.ps1` surfaces it.
- [ ] Network: post-takeover hardening continues (UniFi controller, DHCP reservations, device-SSH vault). See recent daily logs.
