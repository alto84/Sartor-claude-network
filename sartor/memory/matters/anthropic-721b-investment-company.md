---
type: matter
matter: anthropic-721b-investment-company
status: open
risk: medium-high
priority: p2
opened: 2026-05-08
updated: 2026-05-12
last_action: 2026-05-12
deadline: trigger-only
authority: [IRC-721b, IRC-351e, Reg-1.351-1c, Reg-1.731-1c]
related: [reference_anthropic_shares, anthropic-secondary-recognition-risk, BUSINESS, business/solar-inference, TAXES]
---

# Matter: §721(b) investment-company trap on Anthropic-shares contribution to Solar Inference LLC

## Issue

Whether contributing the EquityZen Series 13 ($105K basis) and/or Hiive HII Anthropic-01 ($94K beneficial basis) holdings from personal name to Solar Inference LLC would trigger gain recognition under IRC §721(b) (the "investment company" exception to §721's tax-free contribution rule).

## Facts

- EquityZen Growth Technology Fund II LLC, Series 13: cost basis $105,037.51, held in Alton's personal name (Emmett Sartor, alto84@gmail.com). Investment funded 2025-02-12. Indirect Anthropic Series E-1 Preferred via SPV stack.
- **Source-of-funds wrinkle (filed 2026-05-12):** the EquityZen Subscription Amount was wired from a Fidelity Joint WROS account Z25598998 (presumably joint with Aneeta), confirmation 79277892, 2025-02-10. Legal title to the Series Interest is in Emmett's name only. Legal-title vs. source-of-funds distinction is real: under partnership-tax §721, what matters is the contributing partner's basis in the property contributed, which travels with legal title — but under NJ state marital-property and estate doctrines, funding a personal-name purchase from joint marital funds can support a transmutation or constructive-trust argument by the non-titled spouse. Compounds the §721(b) analysis if SI contribution is contemplated: a contribution to a 50/50 LLC of property that was (a) titled in Alton's name but (b) funded from joint marital cash creates ambiguity around whose property is being contributed. CPA + family-law-aware view required before any move.
- HII Anthropic-01 (Hiive): 300 shares beneficial to Alton ($94,014.90 basis), held in nominee structure under father (Alton Oliver Sartor) per MOU dated 2025-12-24.
- Solar Inference LLC: 50/50 multi-member NJ LLC (Alton + Aneeta), formed 2025-09-06, EIN 39-4199284. Pre-revenue. Active operating business posture for Solar ITC + bonus depreciation eligibility.
- Anthropic mark almost certainly above cost since Feb 2025 entry.
- Default Sartor posture per [[reference_anthropic_shares]] (2026-05-03): KEEP PERSONAL until CPA review.

## Authority

- **IRC §721(a)**: General rule — no gain or loss on contribution of property to partnership in exchange for interest.
- **IRC §721(b)**: Exception — gain recognized if partnership would be treated as "investment company" under §351(e) if it were incorporated.
- **IRC §351(e)(1)**: A corporation is an "investment company" if more than 80% of the value of its assets is held for investment AND consists of stocks/securities/cash/etc.
- **Treas. Reg. §1.351-1(c)(1)**: Defines stocks and securities for §351(e) purposes. Includes interests in partnerships and LLCs holding such property.
- **Treas. Reg. §1.351-1(c)(6)**: "Diversification" rule — contributions can avoid §351(e) if both (a) the property contributed is itself diversified, OR (b) post-contribution the corporation/partnership is diversified.

## Analysis

Solar Inference LLC's current asset profile:
- Solar roof: $438,829 (operating asset, when placed in service) — NOT a security
- GPU hardware: ~$37,831 workstation + RTX 5090 (operating asset) — NOT a security
- Cash: minimal
- Pre-revenue

If Alton contributes $200K+ of Anthropic-private-equity SPV interests, the LLC's asset mix flips:
- Operating assets: ~$475K (solar + GPUs)
- Securities: $200K+ (Anthropic SPVs)

Ratio: ~30% securities, 70% operating. Below the 80% §351(e) threshold — at first read, NOT an investment company.

BUT three complications:

1. **Pre-placed-in-service timing**. Until the solar is placed in service, the $438K is a contract receivable / construction-in-progress, not an operating asset. The LLC's "operating asset" base is much smaller until July 2026, making the securities ratio higher in the interim.

2. **Diversification test under Reg §1.351-1(c)(6)**. Two assets in the same name (one underlying — Anthropic) are NOT diversified. Even if the $200K is below the 80% threshold, the diversification rule can independently trigger §721(b) treatment. Generally requires no more than 25% in any one issuer and no more than 50% in any 5 issuers.

3. **IRS recharacterization risk**. The "active operating business" framing for Solar ITC depends on SI looking like an operating entity, not a passive holding company. Loading SI with Anthropic securities directly contradicts that posture WHILE the Solar ITC is being claimed (TY2026). If IRS examines and recharacterizes SI as investment company, the Solar ITC + bonus depreciation positions could be jeopardized — much larger dollar exposure than the §721(b) gain itself.

If §721(b) triggers: gain recognition on contribution = (FMV at contribution) − (basis). With Anthropic mark plausibly $400-500/share (vs $61.98 entry), unrealized gain on EquityZen alone could be $300K+. Federal LTCG 20% + NIIT 3.8% + NJ 8.97-10.75% = ~$95-115K immediate tax bill on a contribution that was supposed to be tax-free.

### Risk grade: MEDIUM-HIGH

Position is "don't contribute" — execution-side risk only triggers on actual contribution attempt. The "MEDIUM-HIGH" grade reflects the magnitude of harm if executed without CPA opinion, not the likelihood of harm from current state.

## Position

**Default: KEEP PERSONAL.** Do not contribute Anthropic-shares positions to Solar Inference LLC pre-2027 absent (a) CPA opinion letter on §721(b) safety, (b) ITC + bonus depreciation positions being filed and accepted (TY2026 return), (c) clean diversification analysis under Reg §1.351-1(c)(6).

If a future contribution is contemplated post-2027:
- Time it AFTER Solar ITC + bonus depreciation are filed and accepted
- Consider contribution into a separate holding LLC, not SI directly, to isolate operating-business character
- Get fully-executed Hiive MOU first (currently shows Emmett's signature only — confirm father + mother countersigned)

## Action items

- [ ] No immediate action. Watching matter.
- [ ] Re-evaluate post-TY2026 1040 acceptance (~spring 2027).
- [ ] Confirm Hiive MOU is fully countersigned by Alton Oliver Sartor (father) and Belinda Marascalco Sartor (mother). Currently only Emmett's signature on file per [[reference_anthropic_shares]].
- [ ] Confirm AZ Compliance has been notified of both Anthropic holdings (per [[reference_anthropic_shares]] action item).

## CPA / counsel routing

- **Send to JF as**: FYI memo. Background context. No action requested.
- **Re-engage if**: Alton or Aneeta seriously contemplates contribution.
- **Tax attorney consult required if**: Contribution actively contemplated. §721(b) opinion letter is appropriate; CPA may decline to opine without attorney involvement.

## History

- 2026-05-08: Opened as watching matter. Default posture KEEP PERSONAL ratified per [[reference_anthropic_shares]] 2026-05-03 analysis. No fresh action.
- 2026-05-12: Updated. Source-document audit confirmed canonical [[reference_anthropic_shares]] matches the eight PDFs in `reference/anthropic-shares-2026-05/`. Two collateral findings: (a) EquityZen wire came from a Fidelity Joint WROS account (joint with Aneeta) — legal title vs source-of-funds distinction now in Facts; (b) Hiive MOU still only signed by Emmett (action item flagged in [[anthropic-secondary-recognition-risk]]). Anthropic published a public warning on unauthorized secondary sales naming Hiive — see [[anthropic-secondary-recognition-risk]] for the recognition-risk dimension that compounds with this §721(b) trap. Default posture KEEP PERSONAL reinforced: don't contribute Anthropic-shares to SI before resolving BOTH §721(b) AND recognition-risk.

## Resolution

(open — watching)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion. Engage a licensed tax attorney for opinion-letter quality.
