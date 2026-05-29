---
type: matter
matter: insurance-commercial-coverage
status: open
risk: high
priority: p1
opened: 2026-05-28
updated: 2026-05-28
last_action: 2026-05-28
deadline: 2026-06-15   # before rig 3 goes live / before more business use is documented
authority: []
related: [BUSINESS, business/solar-inference, business/rental-operations, solar-itc-48-vs-25d, TAXES]
---

# Matter: Homeowner's policy vs commercial GPU operation at 85 Stonebridge

## Issue

The 85 Stonebridge homeowner's policy (Selective Insurance, annual Oct renewal) likely **excludes /
voids coverage** for a commercial GPU-rental business run from the residence — and the §48E business-use
tax posture (asserting to the IRS that the property is used in a trade or business) is the *exact* fact
an insurer uses to deny. The tax position and the insurance position are in direct tension and have
never been reconciled. Surfaced by the 2026-05-28 audit completeness pass (VERIFICATION.md T1).

## Facts

- Carrier: Selective Insurance, personal homeowner's policy (ref: "Selective insurance 85 stonebridge.pdf").
- No record that Selective was ever told Solar Inference LLC runs a 24/7 GPU-rental business at the home.
- Hardware at the residence now ~$120K+: RTX 5090 rig, dual RTX PRO 6000 rig (rtxserver), third rig
  ordered 2026-05-26.
- Climate First loan has an insurance covenant (full replacement-cost homeowner's coverage) —
  business use that voids the policy could also breach the loan covenant.

## Analysis

Two compounding exposures:
1. **Property loss on the GPU hardware** would likely be denied or capped at the HO business-property
   on-premises sublimit (~$2,500) — standard HO-3/HO-5 forms exclude "business pursuits" and business
   property above that sublimit.
2. **Far worse — a fire originating in a high-density GPU rig on residential wiring** (continuous 100%
   load, ~1100–1600W PSUs is a real ignition risk) could let the insurer deny the **entire dwelling
   claim** under business-use / material-misrepresentation / increased-hazard doctrines — putting the
   $438K solar roof and the home itself at risk.
3. **Tax/insurance tension:** to claim §48E the household is on record asserting trade-or-business use
   of the property; that assertion is discoverable and is precisely what supports a denial. The two
   stories ("business property" for the IRS, "residence" for Selective) cannot both be maximally true.

## Position

Disclose the business to Selective and obtain commercial coverage **before rig 3 goes live**. Cost of
a denied total-loss claim dwarfs the premium.

## Action items

- [ ] Call the Selective agent; disclose the GPU-rental business at 85 Stonebridge.
- [ ] Get written confirmation of whether the current policy excludes it.
- [ ] Obtain commercial general liability + commercial property (or a business-pursuits endorsement /
      separate inland-marine policy on the GPU equipment) in Solar Inference LLC's name; consider a
      personal umbrella that doesn't exclude home-business activity.
- [ ] Confirm the Climate First loan insurance covenant isn't breached by the business use.

## CPA / counsel routing

- Insurance broker first (this is an insurance action, not a CPA action). Flag to JF only for the
  tax/insurance-consistency angle (the business-use assertion).

## History

- 2026-05-28: Opened from the fleet-ledger audit completeness pass (VERIFICATION.md T1).

## Resolution

(pending)
