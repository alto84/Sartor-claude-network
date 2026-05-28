---
type: audit-report
date: 2026-05-26
author: session-searcher
scope: rental-ops incidents last 60 days
---

# Rental Operations Incident Patterns — 60-day audit

## Incident category table

| Category | Incidents (60d) | Typical MTTR | Upstream-fix candidate |
|----------|---|---|---|
| vast.ai state drift: sticky error_description | 1 major (rtxserver 97429) | 12+ hours | API verb or auto-expire field |
| Network: dynamic IP reassignment | 3 (gpuserver1 .100→.199→.100; Rocinante .171→.169) | 1-4h + 2-6h cleanup | DHCP static reservations + REGISTRY-driven config |
| Hardware/thermal: AC failure | 1 major (2026-05-03) | 14 hours | Unclear; data limited |
| Thermal anomalies | 2+ (rtxserver single-card, BMC fan drift) | 2-4h diagnosis | BMC firmware persistence |
| NVML version mismatch | 1 (rtxserver 2026-05-20) | <5 min reboot; 12h detect | nightly nvidia-smi health check |
| Documentation lag | 6+ stale claims (rates, end_date, cron, storage unit) | 2h curator pass | Auto-generated LIVE STATE snapshot |
| Failed recovery paths | 2 (systemd confusion, bogus CLI verb) | 1-2h potential field failure | Pre-deployment documentation review |

## Top 3 repeat-offender patterns + fixability

### 1. Network IP drift (3 incidents, high fixability)

Every power event reshuffles Fios DHCP leases. IPs shift; 20+ hardcoded references break. 2-6h manual cleanup per incident.

Evidence: 2026-05-09 (.100→.199), 2026-05-19 (.199→.100 + .171→.169), 2026-05-20 (BMC unreachable).

Upstream fix: Static DHCP reservations (5-min manual) + REGISTRY-driven config auto-generation (3-4h code). Design complete; awaiting execution.

### 2. vast.ai sticky error_description (1 major, low-medium fixability)

Transient verification errors (Docker flags, NVML mismatch) set error_description. Even after fix + passing self-test 2×, field does NOT auto-clear. Blocks marketplace visibility.

Evidence: 2026-05-19 rtxserver (NVML error), 2026-05-02 (Docker storage flags). Both required support ticket to clear.

Root cause: vast.ai CLI has no clear verb; field is sticky.

Upstream fix: Request vast.ai add `vastai machine clear-error` verb or auto-expire after 72h healthy heartbeats. Our side: weekly health check flagging error_description ≠ None.

### 3. Documentation lag (6+ stale claims, very high ROI)

CLAUDE.md, MACHINES.md carry hardcoded vast.ai metadata. Live state drifts: rates via web UI, end_date auto-renew, cron changes, unit errors.

Evidence (2026-05-04 audit): $0.30 live vs $0.35–0.40 docs; 2026-10-24 live vs 2026-08-24 docs; storage unit wrong; cron cadence outdated.

Root cause: docs manual; live changes happen outside sync discipline (web UI, field maintenance).

Upstream fix: Auto-generated LIVE STATE section (vastai show machines --raw + cron inspection, 40-line script, weekly run). Reduces MTTR from 2h manual audit to 1-week cycle.

---

## Sessions for design phase

1. **2026-05-04: vast.ai truth audit** — `sartor/memory/inbox/rocinante/_memos/2026-05-04_vastai-truth-audit.md`
   - Full mapping of 8 doc-vs-live drift dimensions
   - Best detailed reference for state-drift operationally

2. **2026-05-04: vastai-management review** — `sartor/memory/inbox/rocinante/_memos/vastai-management-review-2026-05-04.md`
   - Catches field-failure risks in recovery paths (systemd confusion, bogus CLI)
   - Template for pre-deployment documentation review

3. **2026-05-20: IP-resistance-pattern** — `sartor/memory/projects/ip-resistance-pattern-2026-05-20.md`
   - Complete 4-layer design + ROI quantification
   - Ready for immediate execution

4. **2026-05-19: rtxserver support ticket** — `sartor/memory/inbox/rocinante/2026-05-19-vastai-support-ticket-draft.md`
   - Live error_description stickiness example
   - Template for sticky-field escalations

5. **2026-05-20: fios-overnight-check-1** — `sartor/memory/inbox/rocinante/2026-05-20-fios-overnight-check-1.md`
   - Autonomous reboot decision during cascade failure
   - Tuning autonomy thresholds

---

## Confidence + limitations

High: IP drift (3× in 60d), doc lag (6+ confirmed), error_description (12h incident).

Medium: NVML (single incident; likely pattern if unattended upgrades continue).

Low: AC failure / thermal (1 incident; need more context).

Out of scope: full .jsonl session transcripts for additional anecdotal patterns.
