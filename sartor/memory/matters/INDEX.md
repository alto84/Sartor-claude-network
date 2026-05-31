---
type: meta
entity: matters-index
updated: 2026-05-12
updated_by: Claude (Opus 4.7, 1M context)
status: active
tags: [meta/index, domain/tax, domain/legal]
related: [TAXES, BUSINESS, reference_solar_project, reference_heloc, reference_anthropic_shares]
---

# Matters Index

Open tax, legal, and financial-structuring matters for the Sartor household. Each matter lives at `sartor/memory/matters/{slug}.md`.

Maintained by the [[matter-tracker]] skill. Pairs with [[tax-counsel]] for IRAC analysis.

> [!important] Not legal advice
> These are working positions for discussion with **Jonathan Francis, CPA** (jf@francis-cpa.com, (914) 488-5727). Engagement is verbal-only as of 2026-05-08 — see [[matters/cpa-engagement-letter|cpa-engagement-letter]].

## Open — high priority (P1)

| Slug | Matter | Risk | Deadline | Last action |
|---|---|---|---|---|
| [solar-itc-48-vs-25d](solar-itc-48-vs-25d.md) | §48**E** ITC (business-use fraction) + begin-construction lock + LLC asset transfer | HIGH | 2026-07-04 (begin-construction) | 2026-05-28 |
| [insurance-commercial-coverage](insurance-commercial-coverage.md) | Homeowner's (Selective) voids commercial GPU op; tax/insurance tension | HIGH | 2026-06-15 | 2026-05-28 |
| [registered-agent-nj-standing](registered-agent-nj-standing.md) | NJ registered-agent lapse / dissolution risk post-LegalZoom; ITC ownership posture | HIGH | 2026-09-06 | 2026-05-28 |
| [heloc-163h3-tracing](heloc-163h3-tracing.md) | §163(h)(3) HELOC use-of-proceeds tracing | HIGH | 2026-10-15 | 2026-05-08 |
| [portfolio-restructure-2026-05](portfolio-restructure-2026-05.md) | Fidelity options-book restructure — §1092 harvest, §1259 exposure, upside roll-ups | MEDIUM | 2026-12-31 | 2026-05-31 |
| [climate-first-loan-llc-transfer](climate-first-loan-llc-transfer.md) | Climate First Loan deductibility post-LLC transfer | MEDIUM | 2026-07-04 | 2026-05-08 |
| [q2-2026-estimated-tax](q2-2026-estimated-tax.md) | Q2 2026 estimated tax (wage bump + new un-withheld LLC rental income) | MEDIUM | 2026-06-15 | 2026-05-28 |

## Open — medium priority (P2)

| Slug | Matter | Risk | Deadline | Last action |
|---|---|---|---|---|
| [anthropic-721b-investment-company](anthropic-721b-investment-company.md) | §721(b) investment-company trap on Anthropic-shares contribution | MEDIUM-HIGH | trigger-only | 2026-05-12 |
| [anthropic-secondary-recognition-risk](anthropic-secondary-recognition-risk.md) | Anthropic 2026-05-12 unauthorized-secondary-sales warning — Hiive named, EquityZen not | MEDIUM | trigger-only | 2026-05-12 |
| [hiive-mou-gift-tax](hiive-mou-gift-tax.md) | Hiive Anthropic-01 nominee structure §2503 gift-tax exposure | MEDIUM | TY2025 Form 709 | 2026-05-08 |
| [469-material-participation](469-material-participation.md) | §469 material participation hours documentation | MEDIUM | continuous | 2026-05-08 |
| [cpa-engagement-letter](cpa-engagement-letter.md) | Convert JF engagement from verbal to written | MEDIUM | next call | 2026-05-08 |

## Open — low priority (P3)

| Slug | Matter | Risk | Deadline | Last action |
|---|---|---|---|---|
| [nj-de-wage-attribution](nj-de-wage-attribution.md) | NJ vs DE wage-source attribution post-NYC role transition | LOW | TY2026 W-2 | 2026-05-08 |
| [equityzen-series13-k1](equityzen-series13-k1.md) | EquityZen Series 13 first K-1 review | LOW | Sept 15, 2026 | 2026-05-08 |
| [1411-niit-covered-calls](1411-niit-covered-calls.md) | §1411 NIIT on covered-call closes (recurring) | LOW | continuous | 2026-05-08 |
| [nj-168k-nonconformity](nj-168k-nonconformity.md) | NJ non-conformity to §168(k) bonus depreciation | LOW | continuous | 2026-05-08 |
| [sante-total-990ez-migration](sante-total-990ez-migration.md) | Sante Total 990-N → 990-EZ migration | LOW | TY2026 forward | 2026-05-08 |

## Watching

(matters with no immediate action but worth tracking)

| Slug | Matter | Note |
|---|---|---|
| (see VERIFICATION T6) | SE tax + guaranteed-payment characterization of LLC operating income | Now live — both machines earning. Active-business posture (for §48E/§469) pulls profit into SE tax. CPA to model. |
| (see VERIFICATION T4) | NJ sales/use tax — IaaS output taxability + vast.ai marketplace-facilitator status; ST-3 resale likely wrong instrument | CPA opinion; confirm vast.ai collects/remits. |
| (see VERIFICATION T7) | 1099-K TIN match — confirm Stripe/vast.ai registered under SI EIN 39-4199284, not Alton's SSN | Avoid CP2000 mismatch; reconcile gross vs fees in the new books. |
| (see VERIFICATION T8) | §183 profit-motive — don't rent below cost to "justify the ITC" | Mitigated 2026-05-28: both machines earning real revenue. Keep pricing above marginal cost. |
| (see VERIFICATION T3) | Montclair zoning / home-occupation vs commercial GPU op | Tax "business" assertion vs residential-zone limits. |

## Closed (last quarter)

(none yet — first seed 2026-05-08)

## Conventions

- Slug = kebab-case, immutable once assigned
- Risk grade drives sort within priority bucket
- Deadline drives priority bucket assignment
- Update this index on every matter open / update / close
- Matters cross-link to memory wiki via `> [!matter]` callouts in source files

## History

- 2026-05-08: Initial seed. 13 matters opened from tax-counsel pass over current Sartor financial state. Skills `tax-counsel` and `matter-tracker` written same session.
- 2026-05-28: Fleet-ledger audit + adversarial verification pass (see [[projects/fleet-ledger-2026-05-28/VERIFICATION]]). **Corrected** `solar-itc-48-vs-25d` (→ §48E, business-use fraction, July-4 begin-construction, §25D dead, 100% bonus) and `469-material-participation` (hours log counted bot activity — now uses human_interactive_hours; ITC strands against wages if passive). **Opened 2 new P1 matters**: `insurance-commercial-coverage`, `registered-agent-nj-standing`. Added 5 Watching items (SE tax, NJ sales tax, 1099-K, §183 profit-motive, zoning). Now 15 active matters + 5 watching.
