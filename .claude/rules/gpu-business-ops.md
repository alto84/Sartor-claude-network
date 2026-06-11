# GPU Business Operations Rules

For infrastructure details (machine ID, pricing, server IP), see sartor/memory/MACHINES.md and CLAUDE.md Domain 1.

## Operational Rules

- **Autonomous-pricing carve-out (fleet-wide since 2026-06-10):** The `scripts/fleet/reprice.py` v3 occupancy-band controller IS the standing-approved mechanism for idle on-demand per-GPU price changes across every `fleet.yaml` machine with `listing.dynamic.enabled`. Those moves do not need per-change Alton confirmation — the guardrails (electricity floor, P75-peer ceiling + $3.00/GPU cap, 30% step cap, 30-min interval, idle-only) are the authorization. See `feedback_autonomous_dynamic_pricing.md`. What still requires explicit Alton approval: end-date extensions, reserved-contract decisions, listing creation/deletion, and any manual price override outside reprice.py.
- Outside that carve-out, never modify marketplace listings without explicit confirmation from Alton
- Never expose API keys or authentication tokens
- Log all marketplace interactions to the audit trail
- Check pricing competitiveness against comparable GPU class listings before any repricing recommendation
- Alert if downtime or utilization drops below 60% for more than 6 consecutive hours

## Financial Tracking

- Track depreciation schedules for commercial equipment
- All financials pass through Solar Inference LLC books, not personal accounts

## Security

See CLAUDE.md §Global Constraints → Security for the hard-rule floor (Constitution §7 + operational specifics on credentials and git). The GPU-specific operational specifics:

- vast.ai API key, SSH keys, and billing info never appear in generated output. Pull credentials via `/secrets-via-bitwarden`.
- Marketplace actions (manual repricing, listing edits) require confirmation before execution; this is Constitution §7's first hard constraint applied to the rental business. The exception is the autonomous-pricing carve-out above — reprice.py v3's idle on-demand adjustments on dynamic-enabled machines are pre-authorized (`feedback_autonomous_dynamic_pricing.md`); §7's first constraint governs *money movement and manual listing changes*, not the bounded controller Alton delegated.
