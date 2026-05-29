---
type: project-artifact
entity: fleet-ledger-verification
created: 2026-05-28
status: complete
parent: "[[projects/fleet-ledger-2026-05-28/INDEX]]"
tags: [project/fleet-ledger, domain/tax, verification, adversarial-review]
---

# Verification — adversarial refutation of the 2026-05-28 audit findings

Workflow `wf_38a71732-385`: 7 refutation agents (charged to REFUTE each load-bearing claim, with
live web search for post-2025 tax law) + 2 completeness critics. This is the authoritative record;
the CPA email and `matters/` updates derive from the **corrections** below, not from the original
audit phrasing. Knowledge-cutoff note: the tax verdicts were checked against live sources because
OBBB (P.L. 119-21, signed 2025-07-04) and IRS Notice 2025-42 post-date training.

> [!important] Not legal/tax advice. Analytical support for discussion with Jonathan Francis, CPA.

## Load-bearing claim verdicts

### C1 — Solar ITC overstated (full-basis, no business-use haircut) — **PARTIALLY CONFIRMED**
**Core thesis holds:** the plan computes the credit as 30% × full $438,829 = $131,649 with no
business-use reduction; that is not defensible. A residential-sited system qualifies for the
**commercial** credit only to the extent the property is **depreciable** (used in a trade/business or
for production of income). The $373,005 figure is correctly the §50(c)(3) half-credit basis reduction,
not a business-use haircut. Arithmetic confirmed ($131,649; 24.3% GPU-only kWh → ~$32K; dual-rig ~64%
→ ~$86K).
**Corrections (these change the CPA framing):**
- **Controlling section is §48E**, the Clean Electricity Investment Credit — §48 was replaced for
  property **placed in service after 12/31/2024**. Allocation logic carries over; cite §48E.
- The reduction mechanism is the **depreciability requirement** (§48E / §168) + the home-office
  **80/20 allocation framework**, NOT the "dual-use property" 50% energy-input cliff.
- Business-use fraction is conventionally measured by **home-office / use-of-property %**; a
  **kWh-based** metric (GPU kWh / total generation) is defensible but **unsettled** — a CPA/exam call.
- **Net-metered grid exports** owned by the LLC may count as business "production of income," raising
  the business fraction (the audit's all-non-GPU-is-personal assumption understated it).
- Defensible ITC ≈ **$32K (GPU-only ~24%) to ~$86K (dual-rig ~64%), potentially higher** if
  grid-export income + dedicated-business-use facts support a larger fraction. Magnitude is a
  CPA-grade open question turning on (i) measurement method and (ii) documented business use.

### C2 — §48-vs-§25D "≥80% nonbusiness cliff" — **PARTIALLY CONFIRMED (high conf)**
**Correct:** an LLC/partnership cannot claim §25D (it's individual-only, §25D(a)), non-transferable,
no depreciation. **Wrong:** there is **no §48 "80/20 business-use cliff."** The claim conflated three
different thresholds. The real gate is **§48(a)(3)(C) depreciability**; the credit is computed
**proportionately on the business-allocable basis** — it shrinks toward zero at low business use, it is
not switched off at 20%. **§50(b)(2)(D)** carves energy property out of the "used to furnish lodging"
disqualifier, so dwelling-mounted solar is **not categorically barred**. §25D and §48/§48E are **not
mutually exclusive** on one system — an individual can allocate (25D on residence portion, 48 on
business portion) — they just can't cover the same dollars. **Currency overlay:** §25D is **terminated
for expenditures after 12/31/2025** (OBBB), so for a 2026 install the personal fraction gets **zero**
credit — making the business-use allocation more consequential and the §48E path the only live route.

### C3 — §469: passive ITC + suspended loss can't offset wages — **PARTIALLY CONFIRMED (high conf)**
**Correct core:** a suspended passive loss (§469(a)(1)(A),(b)) and a passive activity credit
(§469(a)(1)(B),(d)(2)) both **cannot offset W-2 wage income** and carry forward; released on a fully
taxable disposition (§469(g)). **Corrections:**
- The **7-day average-customer-use exception** (§1.469-1T(e)(3)(ii)(A)) does **NOT** rescue the position
  — it only strips the per-se *rental* label; the activity is then tested under §469(c)(1) and **still
  requires material participation**. In the failure scenario it stays passive.
- "Claude-session typing time by working directory" is **not, as built, a defensible §1.469-5T(f)(4)
  record** of the individual's personal-service hours: §469(h)(1) requires the **individual's own**
  regular/continuous/substantial involvement; the log fails to separate Alton's keyboard time from
  automated cron + autonomous AI-agent activity and does not attribute per person. It overstates hours.
- The "§48 ITC" is the **energy credit on the solar roof**, not on GPU hardware (GPUs earn
  depreciation). Confirm with CPA which passive activity the ITC is allocated to.
- Second-order limit: even once a passive credit becomes "allowed," **§38(c) GBC** caps it (25% of net
  regular tax over $25K), 20-yr carryforward, §196 deduction at expiry.

### C4 — "July 4 2026 is internal, real line is Dec 31 2026" — **REFUTED (high conf)**
- **July 4/5, 2026 is a HARD STATUTORY begin-construction deadline** for the §48E solar ITC under OBBB
  + IRS **Notice 2025-42**. The Sartor docs have the **right date, wrong label** — they call it
  "placed-in-service / must be in service" when it is **begin-construction**.
- **No Dec 31, 2026 federal cliff exists.** If construction **begins by July 4, 2026**, the 4-year
  continuity safe harbor lets placed-in-service slip to **~Dec 2029–2030** with full 30% ITC + 100%
  bonus intact. If construction begins **after** July 4, 2026, must be placed in service by **Dec 31,
  2027**.
- **2026 bonus depreciation = 100% PERMANENT** (OBBB) — resolves the docs' open "80% vs 100%" question;
  the $373,005 figure stands.
- The **5% safe harbor still works** for this system (Notice 2025-42 eliminated it except low-output
  ≤1.5 MW facilities; 22.10 kW = 0.0221 MW qualifies) — but **cite Notice 2025-42, not Notice 2018-59**.
  The $219,414.50 already drawn 2026-03-15 plausibly establishes the 5% → **begin-construction can be
  locked before July 4, 2026**, protecting the credit even if install slips. **Highest-leverage action.**

### C5 — fleet-watchdog built but never scheduled / no alert path — **CONFIRMED (high conf)**
No Windows task, no state file, no inbox dir, no notify config — never run once. The stub is generic
(Telegram/Pushover placeholders); **no GCal implementation was ever coded** (GCal was design-doc only).
The 2026-05-28 price-revert it was built to catch **already recurred** with the watchdog dark.

### C6 — no books; TY2026 revenue recorded nowhere — **CONFIRMED (high conf)**
Confirmed-absent (searched the dirs where books would live): no GL/COA/income-statement/balance-sheet/
trial-balance/QuickBooks/Wave. Only artifact = static TY2025 expense table ($4,949.49). TY2026 revenue
in no ledger (one dead CSV row, 2026-04-03). "Revenue $0/pre-revenue" stale at **TAXES.md:55,
BUSINESS.md:51, business/solar-inference.md:75, work/taxes/solar-inference-2025.md:31** (correct only
in the TY2025 short-year sense).

### C7 — stale list price → misprice-on-relist — **PARTIALLY CONFIRMED (high conf)**
$0.80 approved confirmed (approved-pricing.yaml:21). Literal `-g 0.40` in runnable relist commands at
**CLAUDE.md:64** and **.claude/agents/gpu-pricing.md:34** (and gpu-pricing.md:33 "Current pricing:
$0.40/hr"). **Correction:** the third cited file, **gpu-pricing-optimizer/SKILL.md:59, is SAFE** — it
uses a `{price}` placeholder + an explicit "(COPY ONLY — do not run automatically)" guard. Do **not**
edit it. Also `vastai-management SKILL.md:115` carries a stale "-g 0.30" baseline. Running either real
$0.40 command would halve the approved $0.80 (-g is per-GPU on-demand).

## Completeness critic findings (NOT covered by the four audits)

### Tax / accounting / entity
| # | Finding | Sev | Action |
|---|---|---|---|
| T1 | **Homeowner's policy (Selective) likely voids coverage for a commercial GPU op at the residence — and the §48 business-use claim worsens it.** Fire risk from high-density rigs on residential wiring; ~$120K hardware; could let insurer deny the whole dwelling claim (incl. $438K roof). Tax story ("business property") and insurance story ("residence") are in direct tension. | HIGH | Disclose to Selective, get commercial property + GL in SI's name (or business-pursuits endorsement) before rig 3 goes live; check Climate First insurance covenant. New matter. **D4.** |
| T2 | **Registered agent unknown after LegalZoom State-Compliance canceled 2026-04-05.** Possible lapsed RA → NJ administrative dissolution → strips LLC standing to own the solar asset (undermines the entire ITC posture) + missed service of process. NJ $75 annual report due ~Sept 6 2026, no automated reminder. | HIGH | Pull NJ DORES status (Entity 0451339243); appoint RA if lapsed; calendar Sept 6 annual report. New matter. **D5.** |
| T3 | **Zoning / home-occupation** — commercial GPU hosting in a residential Montclair zone never assessed; tax "business" assertion vs residential-zone home-occupation limits are discoverable against each other. | MED | Check Montclair home-occupation ordinance; document determination. |
| T4 | **NJ sales/use tax** — may be over-paying input tax AND the ST-3 resale idea (active-todos.md:166) is likely the wrong instrument (SI sells compute, not goods); output-side IaaS taxability + vast.ai marketplace-facilitator status unconfirmed. | MED | CPA opinion; confirm vast.ai collects/remits; drop ST-3-resale unless reselling goods. |
| T5 | **Estimated tax** — q2-2026 matter models the wage bump but not the new **un-withheld LLC distributive-share rental income**; double-miss risk if the ITC/loss slips. | MED | Default to 110%-prior-year safe harbor; don't throttle Q3/Q4 on assumed depreciation. |
| T6 | **SE tax + guaranteed payments** — the active-business characterization (needed for §48E/§469) pulls operating profit into **SE tax**; disproportionate work by Alton risks guaranteed-payment recharacterization. Unanalyzed. | MED | CPA model SE tax under both characterizations; consider formalizing guaranteed payment in the OA. |
| T7 | **1099-K matching** — Stripe/vast.ai will report gross to IRS; if registered under Alton's SSN not the **EIN 39-4199284**, gross lands on his personal record (CP2000 mismatch); no books to reconcile gross vs fees. | MED | Verify Stripe TIN = SI EIN; pull monthly earnings/fee statements into books. |
| T8 | **Profit-motive / §183** — "rent below cost because it justifies the ITC" is the *opposite* of profit motive and could unwind §48E/§469. A burned kWh returns ≤30¢ of ITC per $1 cost. | LOW→MED | Price every machine above true all-in marginal cost; drop the "breakeven is fine" framing from rental-operations.md. |

### Operational / framework / security
| # | Finding | Sev | Action |
|---|---|---|---|
| O1 | **425W vs 450W power cap contradiction** — live = 425W both cards; service file + REGISTRY + HARDWARE + CLAUDE.md + vast.ai listing all say 450W (listing advertises 425 to renters). Automation's reported state ≠ physical reality — same failure class as 2026-05-28. | HIGH | SSH-verify actual ExecStart + journalctl; pick ONE canonical value; align all docs + service + listing; add cap to machine-checkable config. |
| O2 | **GPU0 at 83°C live under a real renter** (2°C from 85°C soft-abort); only the patient's own cron watches it; **fleet-watchdog doesn't pull temp.** Sustained renter load never characterized (baselines were 5-min synthetic). | HIGH | Add witness-side GPU-temp check to fleet-watchdog (SSH nvidia-smi; ORANGE ≥84°C 2 passes, RED ≥86°C); investigate the 83°C; revisit GPU0 cooling. |
| O3 | **rtxserver has no marginal-cost floor** — occupancy-over-profit doctrine + cold-start undercutting could rent below electricity cost; ITC value of a kWh ≤30% of its cost. | HIGH | Compute per-machine marginal floor; add `marginal_floor_gpu_cost` to config; watchdog RED if price < floor. |
| O4 | **fleet-watchdog never executed** (CRITICAL, = C5) + the price-revert it targets already recurred. | CRIT | Schedule now (10 min); --dry-run first; wire one real notify channel. |
| O5 | **BMC on admin/admin** (open since 2026-04-29) on the flat LAN at .150/.156 — full out-of-band power/KVM/virtual-media control; an adversarial path to the exact 2026-05-28 host-off-while-rented failure. | HIGH (sec) | Change both BMC accounts off admin/admin → bitwarden; restrict .150/.156 to Rocinante via UniFi firewall/VLAN; close the BMC.md checkbox. **Needs Alton/peer.** |
| O6 | **Rocinante at 98% disk (21GB free)** — the witness host for the watchdog, GitHub mirror, creds-sync, hours-log, UniFi backup. A full C: kills the whole witness/DR layer silently. "Witness with no witness." | HIGH | Free C: (drained-inbox trees, peer-session jsonl accumulation, chrome profile); add Rocinante self-disk check to fleet-watchdog (ORANGE <15GB, RED <5GB). |
| O7 | **vast.ai host ToS for host-side work during rental never checked** — rental-policy.md self-certifies; rtxserver runs peer-Claude + goal-loop + temp-logger + 4 crons concurrently with a live rental at 83°C. | MED | Read + quote the actual host ToS into rental-policy.md; log host load during rentals; decide whether the research loop pauses during rtxserver rentals. |
| O8 | **No Stripe payout reconciliation** — can't tell if earnings actually arrive; no alert if payouts stop; revenue side undocumented for the ITC narrative. | MED | Monthly payout-ledger (vast.ai earnings vs Stripe vs Chase); watchdog/weekly alert if rented >7d but no payout. |
| O9 | **No listing-config DR** — only price is captured; min_gpus=2 (single-card thermal safety invariant), min_bid, storage, bandwidth, end_date, ports live only in mutable vast.ai state + prose; a fat-finger `-m 1` re-exposes rtxserver thermal pathology. | MED | Full machine-checkable `listing-config` per machine; relist reads from it; watchdog validates all fields. |

## How these flow into the build

- **Spine (`fleet.yaml` / listing-config):** add `min_gpus`, `marginal_floor_gpu_cost`, full listing spec (O3, O9), power cap value (O1).
- **fleet-watchdog:** add **GPU-temp** (O2), **Rocinante self-disk** (O6), **listing-expiry**, **full-config validation** (O9), **below-floor** (O3) checks; schedule it (O4/C5); real notify channel.
- **books / vastai_pull:** payout reconciliation (O8); revenue ledger (C6).
- **CPA email:** §48E framing, July-4-begin-construction + 5% safe-harbor lock (C4), §25D-dead (C2), 100% bonus (C4), business-use measurement (C1), §469 hours + ITC allocation (C3), + insurance (T1), registered agent (T2), zoning (T3), sales tax (T4), estimated tax (T5), SE tax (T6), 1099-K TIN (T7), profit-motive (T8).
- **matters/:** correct `solar-itc-48-vs-25d.md` (→ §48E, begin-construction, $32–86K range); open new matters T1, T2, T6.
- **Security (Alton/peer):** BMC creds (O5), Rocinante disk (O6) — surfaced for tomorrow; safe parts (disk check, free space) done autonomously.
