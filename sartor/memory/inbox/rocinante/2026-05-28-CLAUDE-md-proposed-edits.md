# Proposed CLAUDE.md edits — fleet doc-drift fix (2026-05-28)

CLAUDE.md is not edited autonomously (changes require Alton's approval). The fleet
doc-drift fix-list applied across the rest of the repo on 2026-05-28 leaves these
exact line edits for CLAUDE.md. Ground truth is live-verified 2026-05-28. The
orchestrator / Alton should apply these.

Each block below is OLD → NEW. Line numbers are as of this writing (approximate;
search for the OLD string).

---

## Edit 1 — gpuserver1 list price (~line 46, Domain 1 Pricing line)

The "$0.30/hr on-demand listed" is stale; live is $0.80. The "$0.40/hr reserved" doc-fiction
correction stays. Listing-vs-contract distinction stays.

OLD:
```
**Pricing (live as of 2026-05-04, verified via `vastai show machines --raw`):** $0.30/hr on-demand listed, $0.25/hr interruptible floor (`min_bid_price`), $0.15/GB-month storage, $3.00/TB upload, $2.00/TB download. Currently rented under reserved contract C.34113802 (through 2026-08-24) at ~$0.20/hr realized — a long-term-discount price; profitable at this rate because the 5090 sips power vs. its earnings. **Note:** vast.ai exposes no machine-level "reserved rate" field; reserved is a per-rental contract attribute, not a host-set price. Earlier docs claiming "$0.40/hr reserved" were doc fiction (truth-up 2026-05-04).
```

NEW:
```
**Pricing (live as of 2026-05-28, verified via `vastai show machines --raw`):** $0.80/hr on-demand listed, $0.65/hr interruptible floor (`min_bid_price`), $0.15/GB-month storage, $3.00/TB upload, $2.00/TB download. Currently rented under reserved contract C.34113802 (through 2026-08-24) at ~$0.20/hr realized — a long-term-discount price; profitable at this rate because the 5090 sips power vs. its earnings. **Note:** vast.ai exposes no machine-level "reserved rate" field; reserved is a per-rental contract attribute, not a host-set price. Earlier docs claiming "$0.40/hr reserved" were doc fiction (truth-up 2026-05-04).
```

---

## Edit 2 — gpuserver1 listing expiry (~line 48)

Listing expiry is 2026-06-30, NOT 2026-10-24. Keep it distinct from the reserved-contract
end date (2026-08-24).

OLD:
```
**Listing expiry:** 2026-10-24 (auto-renewed via web UI from prior 2026-08-24). Reserved-contract C.34113802 still ends 2026-08-24 — distinct field. After that date, evaluate market and relist.
```

NEW:
```
**Listing expiry:** 2026-06-30. Reserved-contract C.34113802 still ends 2026-08-24 — distinct field. After the listing expiry, evaluate market and relist.
```

---

## Edit 3 — gpuserver1 relist command (~line 64, Key Commands block)

The relist command hardcodes the old `-g 0.40` and uses the reserved-contract date as
the listing end-date. Update `-g`/`-b` to live values and change `-e` to a placeholder
(listing expiry != contract date; the operator should set the intended expiry at relist time).

OLD:
```
ssh alton@gpuserver1 '~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"'
```

NEW:
```
ssh alton@gpuserver1 '~/.local/bin/vastai list machine 52271 -g 0.80 -b 0.65 -s 0.10 -m 1 -e "MM/DD/YYYY"'  # set -e to intended listing expiry (NOT the reserved-contract date)
```

---

## Edit 4 — rtxserver-management skill-table row machine_id (~line 253)

machine_id 97429 is stale; the real id is 124192. The "450W cap" parenthetical should
note the live 425W discrepancy. (Surgical option: just fix the machine_id; the 425W note
is optional but recommended.)

OLD (the machine_id fragment within the long table cell):
```
Operating manual for rtxpro6000server (192.168.1.157, dual RTX PRO 6000 Blackwell, machine_id 97429).
```

NEW:
```
Operating manual for rtxpro6000server (192.168.1.157, dual RTX PRO 6000 Blackwell, machine_id 124192).
```

Optional within the same cell, hardware-quirks parenthetical:
OLD: `hardware quirks (450W cap not persistent, ...`
NEW: `hardware quirks (425W live cap / service file says 450W — discrepancy, 450W cap not persistent, ...`

---

## Edit 5 — rtxserver infrastructure section "NOT YET LISTED" (~line 334)

rtxserver is now listed, verified, and rented on-demand. The "onboarding paused" framing
is stale.

OLD:
```
- **Vast.ai listing:** **NOT YET LISTED** — onboarding paused 2026-05-02 pending network topology pivot. State captured in `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`.
```

NEW:
```
- **Vast.ai listing:** **LISTED, verified, RENTED on-demand** (machine_id 124192) as of 2026-05-28. Live list $1.10/GPU; approved $0.92/GPU is a separate open decision (live-drift). Historical onboarding record: `projects/rtxserver-vastai-watch.md` (closed/superseded).
```

---

## Edit 6 (recommended, not strictly in the fix-list) — rtxserver power cap (~line, Infrastructure Reference rtxpro6000server block)

The Infrastructure Reference block states "Production cap 450W/card." Live is 425W/card
(service file still says 450W — a real discrepancy needing host-side reconciliation).

OLD (fragment):
```
**Production cap 450W/card** (auto-applied on boot via `/etc/systemd/system/nvidia-power-cap.service`).
```

NEW (fragment):
```
**Production cap 425W/card live** (as of 2026-05-28; the `nvidia-power-cap.service` file still specifies 450W — service-file vs live discrepancy, reconcile host-side).
```

(Search CLAUDE.md for "Production cap 450W" — it appears in the rtxpro6000server Infrastructure
Reference block. Flagging because it is the same 450W→425W drift; apply if Alton agrees.)
