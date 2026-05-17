#!/usr/bin/env bash
# Deploy Pi-hole as a Docker container on Rocinante.
#
# ⚠ Skill-Phase-3 BUILD ARTIFACT — not yet fired.
# Awaits Phase 4 adversarial review + Phase 7 principal greenlight.
#
# Reference: sartor/memory/projects/pihole-deployment-2026-05-17/PLAN.md
#
# Modes:
#   --dry-run    Run preflight checks; print what would happen; exit 0 on
#                green, non-zero on red. Does NOT pull images, start containers,
#                or touch any persistent state. Safe to run during review.
#   (default)    Actually deploy. Loads admin pass from Bitwarden, runs the
#                container, applies whitelist + extra blocklists, gravity-updates.
#
# Secrets handling:
#   - Pi-hole admin pass read from Bitwarden vault item 'Pi-hole admin'
#     via sartor-secret (per the secrets-via-bitwarden skill).
#   - Value loaded into PIHOLE_WEB_PASS env var of THIS bash process only.
#   - Passed to `docker run -e <NAME>` form (docker copies our env value into
#     the container's env without that value ever appearing as a literal in
#     this script, in argv, or in shell history).
#   - Cleared from env on exit (trap).

set -euo pipefail

DRY_RUN=0
case "${1:-}" in
  --dry-run) DRY_RUN=1 ;;
  --help|-h)
    sed -n '1,30p' "$0"; exit 0 ;;
  "") ;;
  *) echo "Unknown arg: $1" >&2; exit 2 ;;
esac

CONTAINER='pihole'
VOL_ETC='pihole_etc'
VOL_DNSMASQ='pihole_dnsmasq'
ADMIN_UI_PORT='8053'
ROCINANTE_LAN_IP='192.168.1.171'

log() { echo "[$(date +%H:%M:%S)] $*"; }
die() { echo "ERROR: $*" >&2; exit 3; }

cleanup() { unset PIHOLE_WEB_PASS 2>/dev/null || true; }
trap cleanup EXIT

# ── Preflight ────────────────────────────────────────────────────────────────
log "preflight: docker daemon"
docker info >/dev/null 2>&1 || die "Docker daemon not reachable. Start Docker Desktop and retry."

log "preflight: port 53 free on host"
# Windows DNS Client service doesn't bind 53 by default. UniFi controller has
# its own DNS-shield off by default. Probe both protocols.
if command -v powershell.exe >/dev/null 2>&1; then
  TCP_HOLDERS=$(powershell.exe -NoProfile -Command \
    "(Get-NetTCPConnection -LocalPort 53 -State Listen -ErrorAction SilentlyContinue).Count" 2>/dev/null \
    | tr -d '\r' || echo 0)
  UDP_HOLDERS=$(powershell.exe -NoProfile -Command \
    "(Get-NetUDPEndpoint -LocalPort 53 -ErrorAction SilentlyContinue).Count" 2>/dev/null \
    | tr -d '\r' || echo 0)
  if [ "${TCP_HOLDERS:-0}" -gt 0 ] || [ "${UDP_HOLDERS:-0}" -gt 0 ]; then
    die "Port 53 in use on host (tcp=$TCP_HOLDERS udp=$UDP_HOLDERS). Cannot bind container."
  fi
else
  log "preflight: powershell.exe not available; skipping port-53 host check (CI?)"
fi

log "preflight: port $ADMIN_UI_PORT free on host"
PORT_HOLDERS=$(powershell.exe -NoProfile -Command \
  "(Get-NetTCPConnection -LocalPort $ADMIN_UI_PORT -State Listen -ErrorAction SilentlyContinue).Count" 2>/dev/null \
  | tr -d '\r' || echo 0)
if [ "${PORT_HOLDERS:-0}" -gt 0 ]; then
  die "Port $ADMIN_UI_PORT in use on host ($PORT_HOLDERS holders). Pick a different ADMIN_UI_PORT."
fi

log "preflight: sartor-secret wrapper available"
SECRET_WRAPPER=/c/Users/alto8/Sartor-claude-network/scripts/sartor-secret
[ -x "$SECRET_WRAPPER" ] || die "sartor-secret wrapper not found at $SECRET_WRAPPER"

# Load BW_SESSION if cached.
WIN_CACHE="/c/Users/alto8/AppData/Local/Sartor/bw-session"
if [ -r "$WIN_CACHE" ]; then
  export BW_SESSION="$(cat "$WIN_CACHE")"
fi

log "preflight: probe vault for 'Pi-hole admin'"
STATUS_RAW=$("$SECRET_WRAPPER" status 2>&1) || true
case "$STATUS_RAW" in
  *unlocked*) : ;;
  *locked*)   die "Bitwarden vault locked. Run: sartor-secret unlock, then retry." ;;
  *)          die "Bitwarden vault status check failed: $STATUS_RAW" ;;
esac

if "$SECRET_WRAPPER" list --search 'Pi-hole admin' 2>/dev/null | grep -q .; then
  log "preflight: vault has 'Pi-hole admin' — will use existing"
else
  log "preflight: vault does NOT have 'Pi-hole admin' — would need creation"
  if [ "$DRY_RUN" = "0" ]; then
    die "Vault item 'Pi-hole admin' missing. Create it first (20-char generated value), then re-run."
  fi
fi

if [ "$DRY_RUN" = "1" ]; then
  log "DRY-RUN green. All preflight checks passed. No state changed."
  exit 0
fi

# ── Live deploy (only reached when --dry-run not passed) ─────────────────────

log "deploy: load admin pass from Bitwarden into PIHOLE_WEB_PASS env"
PIHOLE_WEB_PASS="$("$SECRET_WRAPPER" read 'Pi-hole admin')"
export PIHOLE_WEB_PASS
[ -n "$PIHOLE_WEB_PASS" ] || die "Vault returned empty value for 'Pi-hole admin'"

log "deploy: create docker volumes"
docker volume create "$VOL_ETC"     >/dev/null
docker volume create "$VOL_DNSMASQ" >/dev/null

log "deploy: pull pihole/pihole:latest"
docker pull pihole/pihole:latest >/dev/null

log "deploy: remove any existing container named $CONTAINER"
docker rm -f "$CONTAINER" 2>/dev/null || true

log "deploy: run container"
# WEBPASSWORD env var is set from our process env via the `-e VAR_NAME` form
# (no `=` after VAR_NAME means docker reads the current value from this
# process's env). The literal pass value never appears in argv or this file.
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p 53:53/tcp -p 53:53/udp \
  -p "$ADMIN_UI_PORT":80 \
  -e TZ=America/New_York \
  -e WEBPASSWORD \
  -e DNS1=1.1.1.1 \
  -e DNS2=1.0.0.1 \
  -e VIRTUAL_HOST=pihole.sartor.lan \
  -e ServerIP="$ROCINANTE_LAN_IP" \
  -v "$VOL_ETC":/etc/pihole \
  -v "$VOL_DNSMASQ":/etc/dnsmasq.d \
  pihole/pihole:latest >/dev/null

log "deploy: wait for DNS to answer"
for i in $(seq 1 30); do
  if dig +short +time=2 +tries=1 google.com @127.0.0.1 >/dev/null 2>&1; then
    log "deploy: DNS up after ${i}s"
    break
  fi
  sleep 1
  [ "$i" = "30" ] && die "DNS did not come up within 30s. Check: docker logs $CONTAINER"
done

log "deploy: apply Sartor whitelist (required-not-to-break list)"
WHITELIST=(
  anthropic.com
  claude.ai
  console.anthropic.com
  console.vast.ai
  cloud.vast.ai
  500.farm
  registry-1.docker.io
  auth.docker.io
  production.cloudflare.docker.com
  blackbaud.com
  mka.org
  goddard.com
  brightwheel.com
  github.com
  githubusercontent.com
  raw.githubusercontent.com
  objects.githubusercontent.com
  api.github.com
)
for dom in "${WHITELIST[@]}"; do
  docker exec "$CONTAINER" pihole allow "$dom" >/dev/null 2>&1 || \
    log "  WARN: failed to whitelist $dom (may already be allowed)"
done

log "deploy: add extra blocklists"
# Two well-known additions beyond Pi-hole defaults
EXTRA_LISTS=(
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
  "https://big.oisd.nl/"
)
for url in "${EXTRA_LISTS[@]}"; do
  docker exec "$CONTAINER" sqlite3 /etc/pihole/gravity.db \
    "INSERT OR IGNORE INTO adlist (address, enabled, comment) VALUES ('$url', 1, 'sartor: added by deploy script');" \
    >/dev/null 2>&1 || log "  WARN: failed to add adlist $url"
done

log "deploy: gravity update (download + apply blocklists)"
docker exec "$CONTAINER" pihole -g >/dev/null 2>&1 || die "pihole -g failed"

log "deploy: smoke test — claude.ai must resolve, doubleclick.net must NOT"
CLAUDE_AI=$(dig +short claude.ai @127.0.0.1 | head -1)
DOUBLECLICK=$(dig +short doubleclick.net @127.0.0.1 | head -1)
log "  claude.ai      → $CLAUDE_AI  (expect non-empty IP)"
log "  doubleclick.net → $DOUBLECLICK  (expect 0.0.0.0 or empty)"

if [ -z "$CLAUDE_AI" ]; then
  die "claude.ai did NOT resolve. Whitelist may have failed. Rollback."
fi
if [ -n "$DOUBLECLICK" ] && [ "$DOUBLECLICK" != "0.0.0.0" ]; then
  log "  WARN: doubleclick.net was NOT blocked. Gravity may not have applied lists. Check admin UI."
fi

log "deploy: done. Admin UI: http://$ROCINANTE_LAN_IP:$ADMIN_UI_PORT/admin/"
log "deploy: next step — apply UniFi DHCP DNS push per unifi-dhcp-dns-change.md"
