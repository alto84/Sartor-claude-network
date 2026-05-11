# GPU Business Operations Rules

For infrastructure details (machine ID, pricing, server IP), see sartor/memory/MACHINES.md and CLAUDE.md Domain 1.

## Operational Rules

- Never modify marketplace listings without explicit confirmation from Alton
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
- Marketplace actions (repricing, listing edits) require confirmation before execution; this is Constitution §7's first hard constraint applied to the rental business.
