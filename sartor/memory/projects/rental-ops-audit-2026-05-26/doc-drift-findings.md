---
audit_date: 2026-05-26
auditor: Auditor agent (Sonnet 4.6)
trigger: "30+ min wrong-path diagnosis caused by stale rtxserver machine_id and listing-status docs"
live_data_source: "vastai show machines --raw from both gpuserver1 and rtxserver, 2026-05-26"
---

# Rental-Ops Doc-vs-Reality Drift Findings — 2026-05-26

## Live State (ground truth)

Both hosts return identical account-level data from `vastai show machines --raw`. The fleet has two entries:

| Field | gpuserver1 (live) | rtxserver (live) |
|---|---|---|
| machine_id | 52271 | **124192** |
| listed | true | **true** |
| verification | verified | **verified** |
| listed_gpu_cost | 0.80/GPU/hr | **1.20/GPU/hr** |
| min_bid_price | 0.65 | **0.85** |
| listed_min_gpu_count | 1 | 2 |
| current_rentals_running | 1 | 0 |
| gpu_occupancy | "R " (rented) | "x x " (idle/listed, no renter) |
| earn_hour | ~$0.196 | ~$0.003 (negligible; likely historical carry) |
| end_date | 2026-06-30 | **2026-07-01** |
| client_end_date (reserved contract) | 2026-08-24 | null (no reserved contract) |
| listing start_date | null | **2026-05-26** (listed today) |
| reliability2 | 0.982 | 0.964 |

---

## Drift Table

| Doc File | Claim | Live Reality | Severity |
|---|---|---|---|
| `REGISTRY.yaml` (line 99) | `vast_ai_machine_id: 97429` for rtxserver | machine_id is **124192** | RED |
| `REGISTRY.yaml` (line 88) | description says "Listed on machine_id 97429 (onboarding paused 2026-05-02)" | Listed on 124192, onboarding completed, listing is active and verified | RED |
| `REGISTRY.yaml` (line 101) | `last_drift: null` for rtxserver | machine_id changed; last_drift should reflect that | RED |
| `CLAUDE.md` (Infrastructure Reference, rtxpro6000server) | "NOT YET LISTED" | Listed and verified as of 2026-05-26 | RED |
| `.claude/skills/vastai-management/SKILL.md` (fleet inventory table) | rtxserver row: "NOT YET LISTED as of 2026-05-04" | Listed, verified, currently idle at $1.20/GPU ($2.40/hr dual) | RED |
| `.claude/skills/vastai-management/SKILL.md` (fleet inventory table) | rtxserver row references `projects/rtxserver-vastai-watch.md` as live tracker | Listing has fired; watch tracker is now stale | YELLOW |
| `.claude/skills/rtxserver-management/SKILL.md` (identity table, line 51) | `vast.ai machine_id: 97429` | Live machine_id is **124192** | RED |
| `.claude/skills/rtxserver-management/SKILL.md` (identity table, line 51) | `listed_gpu_cost: $1.25/GPU/hr × 2 = $2.50/hr` | Live listed_gpu_cost is **$1.20/GPU/hr × 2 = $2.40/hr** | YELLOW |
| `.claude/skills/rtxserver-management/SKILL.md` (identity table, line 51) | `end_date: 2026-06-15` | Live end_date is **2026-07-01** | YELLOW |
| `.claude/skills/rtxserver-management/SKILL.md` (identity table, line 51) | `unverified pending` | Live verification status is **"verified"** | RED |
| `.claude/skills/rtxserver-management/SKILL.md` (vast.ai lifecycle, line 315) | same stale block: machine_id 97429, $1.25, 2026-06-15, unverified | 124192, $1.20, 2026-07-01, verified | RED |
| `.claude/skills/rtxserver-management/SKILL.md` (listing offline playbook, line 445) | `vastai self-test machine 97429` | Correct command should reference **124192** | RED |
| `sartor/memory/business/vastai-pricing-strategy.md` (status table) | rtxserver row: "Not yet listed; plan is `-g 1.25 -m 2 -l '6 months'`" | Listed at -g 1.20 -m 2; strategy preference executed (without -l) | YELLOW |
| `sartor/memory/business/rental-operations.md` (future rental nodes) | "Dual RTX PRO 6000 Blackwell workstation — scheduled for summer 2026 delivery, ~$35K Newegg order planned" | Hardware has been delivered and is running; this section is 6+ weeks stale | YELLOW |
| `CLAUDE.md` (Domain 1, Infrastructure Reference) | gpuserver1 listed price "$0.30/hr on-demand" | Live `listed_gpu_cost` is **$0.80/GPU/hr** | RED |
| `CLAUDE.md` (Domain 1) | `min_bid_price: $0.25/hr` | Live min_bid_price is **$0.65** | RED |
| `sartor/memory/business/solar-inference.md` (GPU compute rig) | "Pricing (live 2026-05-02): $0.30/hr on-demand listed, $0.25/hr interruptible floor" | Live: $0.80 listed, $0.65 floor — both roughly tripled | RED |
| `sartor/memory/business/rental-operations.md` (gpuserver1 entry) | "$0.30/hr demand, $0.25/hr interruptible" | Live: $0.80 / $0.65 | RED |

---

## Synthesis

Every drift item traces to the same structural failure: **vast.ai listing state is never written back to documentation from a live source.** The cron suite on gpuserver1 (`vastai-tend.sh`) fires only on state changes (rented/unrented/offline) and writes to the inbox — it does not update any markdown doc. There is no equivalent cron on rtxserver yet. As a result:

1. When gpuserver1's listing price was raised (clearly happened, now at $0.80 vs documented $0.30 — a 167% change with no doc update anywhere), that change propagated into zero documentation.
2. When rtxserver went from "not yet listed" to "listed and verified" (completed today per `start_date: 2026-05-26`), the listing event was not reflected in REGISTRY.yaml, CLAUDE.md, or either skill file.
3. The machine_id discrepancy (97429 vs 124192) likely reflects a re-registration event: the original kaalia install in May 2026 registered as 97429 at the time skills were authored; a subsequent reinstall or account-level action assigned 124192. No doc-update ceremony exists to catch this.

The pattern: **manual documentation written at installation time with no automated reconciliation against live `vastai show machines --raw` output.** The self-steward cron suite intended for rtxserver (staged, not installed) would have caught some of this, but it still writes to an inbox file, not back to canonical doc fields.

---

## Recommendations

**Source of truth hierarchy:**
`vastai show machines --raw` is the only authoritative source for machine_id, listing status, pricing, verification, and end_date. All documentation is derived.

**Specific fixes needed (in priority order):**

1. **RED — REGISTRY.yaml**: Update `vast_ai_machine_id` for rtxserver from 97429 to 124192. Update description and `last_drift` fields. This is the root cause of the diagnosis error today.

2. **RED — CLAUDE.md**: Two sections need updating: (a) rtxpro6000server "NOT YET LISTED" → listed and verified; (b) gpuserver1 pricing from $0.30/$0.25 to live values. CLAUDE.md is immutable per auditor constraints — propose to Alton.

3. **RED — skill files**: Both `vastai-management/SKILL.md` and `rtxserver-management/SKILL.md` fleet tables need the rtxserver row corrected. Machine_id 97429 → 124192 in at least three places within the rtxserver skill alone.

4. **YELLOW — drift detection**: The `check-registry.py` tool described in REGISTRY.yaml header should be extended (or a new nightly script added) to pull `vastai show machines --raw` from each host, compare `machine_id`, `listed`, `listed_gpu_cost`, `min_bid_price`, and `verification` against REGISTRY.yaml, and file an inbox alert on any delta. This closes the feedback loop automatically.

5. **YELLOW — pricing trail**: gpuserver1's price was raised from $0.30 to $0.80 at some unknown point with no audit trail. The inbox `_vastai/` path captures rented/unrented events but not price-change events (those only appear in `vastai show machines` output, not in any kaalia state-change notification). A weekly scheduled pull of `--raw` snapshots to a dated file in `sartor/memory/machines/<host>/pricing-history/` would make these visible in retrospect.
