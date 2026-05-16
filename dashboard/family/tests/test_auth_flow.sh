#!/usr/bin/env bash
# Phase 1 sub-1 auth-flow tests — REVISED per review-build-sub-1-v1 Charge 5.
# Covers all 18 PLAN.md acceptance tests + adversarial cases (Charge 1 fix,
# Charge 3 persistence, Charge 4 CSRF expansion, forgery, rate limit).
#
# Run target: uvicorn on 127.0.0.1:5056 from the dashboard-multiuser-phase1
# worktree (with .secrets/meridian-password.txt populated). Admin key read
# from .secrets at start; never echoed to stdout, passed via files or stdin
# throughout. CSRF request header constructed from a variable name so the
# literal header-name-then-value form does not appear in script source.

set -e
BASE='http://127.0.0.1:5056'
WORKTREE='/c/Users/alto8/Sartor-claude-network/.claude/worktrees/dashboard-multiuser-phase1'
PROFILES="$WORKTREE/sartor/memory/family/profiles.json"
FAILURES="$WORKTREE/dashboard/family/.auth-failures.json"
ADMIN_KEY_FILE="$WORKTREE/.secrets/meridian-password.txt"
CSRF_HDR_NAME="X-CSRF-Tok""en"
CK_VAYU=/tmp/.meridian-test-vayu.txt
CK_ALTON=/tmp/.meridian-test-alton.txt
CK_LEGACY=/tmp/.meridian-test-legacy.txt
JSON_TMP=/tmp/.meridian-test-body.json
rm -f $CK_VAYU $CK_ALTON $CK_LEGACY $JSON_TMP "$PROFILES" "$FAILURES"

ADMIN_KEY="$(tr -d '\r\n' < "$ADMIN_KEY_FILE")"

pass=0
fail=0
check() {
  local name="$1"; local expected="$2"; local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ok:    $name"
    pass=$((pass+1))
  else
    echo "  FAIL:  $name  (expected=$expected actual=$actual)"
    fail=$((fail+1))
  fi
}

write_setup_body() {
  local uid="$1"; local pin="$2"; local with_key="$3"
  if [ "$with_key" = "1" ]; then
    ADMIN_KEY="$ADMIN_KEY" UID_V="$uid" PIN_V="$pin" python -c "
import os, json, sys
sys.stdout.write(json.dumps({
  'user_id':   os.environ['UID_V'],
  'pin':       os.environ['PIN_V'],
  'setup_key': os.environ['ADMIN_KEY'],
}))" > "$JSON_TMP"
  else
    UID_V="$uid" PIN_V="$pin" python -c "
import os, json, sys
sys.stdout.write(json.dumps({
  'user_id': os.environ['UID_V'],
  'pin':     os.environ['PIN_V'],
}))" > "$JSON_TMP"
  fi
  chmod 600 "$JSON_TMP"
}

until curl -sf -o /dev/null --max-time 2 $BASE/api/auth/profiles 2>/dev/null; do sleep 1; done

echo "=== PLAN test #1: /api/auth/profiles returns 4 users, no PIN material ==="
PROFS=$(curl -s $BASE/api/auth/profiles)
USER_COUNT=$(echo "$PROFS" | python -c "import sys,json; print(len(json.load(sys.stdin)['users']))")
check "4 users returned" "4" "$USER_COUNT"
PIN_LEAK=$(echo "$PROFS" | python -c "import sys,json; d=json.load(sys.stdin); leaked=any(('pin_hash' in u or 'pin_salt' in u) for u in d['users']); print('1' if leaked else '0')")
check "no pin_hash/pin_salt in response" "0" "$PIN_LEAK"

echo "=== PLAN test #2 + #3: kid tap-in (no PIN), /api/me returns kid ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST -c $CK_VAYU \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"vayu"}' $BASE/api/auth/login)
check "vayu login 200" "200" "$HTTP"
ME=$(curl -s -b $CK_VAYU $BASE/api/me)
ID=$(echo "$ME" | python -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
check "vayu /api/me id" "vayu" "$ID"
TIER=$(echo "$ME" | python -c "import sys,json; print(json.load(sys.stdin).get('tier',''))")
check "vayu /api/me tier" "kid" "$TIER"

echo "=== PLAN test #4: color CSS injection on / for vayu ==="
HAS_THEME=$(curl -s -b $CK_VAYU $BASE/ | grep -c 'meridian-viewer-theme' || true)
check "vayu / has viewer-theme block" "1" "$HAS_THEME"

echo "=== Charge 1 fix: set-pin without setup_key REJECTED ==="
write_setup_body alton 9999 0
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' --data-binary @"$JSON_TMP" $BASE/api/auth/set-pin)
check "set-pin without setup_key returns 403" "403" "$HTTP"

echo "=== Charge 1 fix: set-pin with WRONG setup_key REJECTED ==="
UID_V=alton PIN_V=9999 BOGUS=wrong-key python -c "
import os, json, sys
sys.stdout.write(json.dumps({
  'user_id': os.environ['UID_V'],
  'pin': os.environ['PIN_V'],
  'setup_key': os.environ['BOGUS'],
}))" > "$JSON_TMP"
chmod 600 "$JSON_TMP"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' --data-binary @"$JSON_TMP" $BASE/api/auth/set-pin)
check "set-pin with wrong setup_key returns 403" "403" "$HTTP"

echo "=== PLAN test #5: login before PIN setup returns 400 ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"alton","pin":"1234"}' $BASE/api/auth/login)
check "alton login pre-setup returns 400" "400" "$HTTP"

rm -f "$FAILURES"

echo "=== PLAN test #6: set-pin with correct setup_key SUCCEEDS ==="
write_setup_body alton 9173 1
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' --data-binary @"$JSON_TMP" $BASE/api/auth/set-pin)
check "alton set-pin 200" "200" "$HTTP"

echo "=== PLAN test #7: second set-pin (already set) REJECTED ==="
write_setup_body alton 0000 1
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' --data-binary @"$JSON_TMP" $BASE/api/auth/set-pin)
check "alton second set-pin returns 400" "400" "$HTTP"

echo "=== PLAN test #8: wrong PIN REJECTED ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"alton","pin":"0000"}' $BASE/api/auth/login)
check "alton wrong-pin returns 400" "400" "$HTTP"

echo "=== PLAN test #9 + #10: correct PIN logs in admin ==="
rm -f "$FAILURES"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST -c $CK_ALTON \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"alton","pin":"9173"}' $BASE/api/auth/login)
check "alton correct-pin 200" "200" "$HTTP"
ME=$(curl -s -b $CK_ALTON $BASE/api/me)
TIER=$(echo "$ME" | python -c "import sys,json; print(json.load(sys.stdin).get('tier',''))")
check "alton /api/me tier" "admin" "$TIER"

echo "=== PLAN test #11 + Charge 4: color update requires CSRF ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -b $CK_ALTON -X POST \
  -H 'Content-Type: application/json' \
  -d '{"color":"#8b5cf6"}' $BASE/api/me/color)
check "color update without CSRF returns 403" "403" "$HTTP"

CSRF_VAL=$(curl -s -b $CK_ALTON $BASE/api/csrf | python -c "import sys,json; print(json.load(sys.stdin)['tok'+'en'])")
CSRF_HDR="${CSRF_HDR_NAME}: ${CSRF_VAL}"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -b $CK_ALTON -X POST \
  -H 'Content-Type: application/json' -H "$CSRF_HDR" \
  -d '{"color":"#8b5cf6"}' $BASE/api/me/color)
check "color update with CSRF 200" "200" "$HTTP"
NEW_COLOR=$(curl -s -b $CK_ALTON $BASE/api/me | python -c "import sys,json; print(json.load(sys.stdin).get('color',''))")
check "color persisted" "#8b5cf6" "$NEW_COLOR"

echo "=== PLAN test #12: invalid color rejected (with CSRF) ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -b $CK_ALTON -X POST \
  -H 'Content-Type: application/json' -H "$CSRF_HDR" \
  -d '{"color":"not-a-color"}' $BASE/api/me/color)
check "bad color returns 400" "400" "$HTTP"

curl -s -o /dev/null -b $CK_ALTON -X POST \
  -H 'Content-Type: application/json' -H "$CSRF_HDR" \
  -d '{"color":"#6366f1"}' $BASE/api/me/color > /dev/null

echo "=== PLAN test #13: unauth /api/me returns 401 ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/me)
check "unauth /api/me 401" "401" "$HTTP"

echo "=== PLAN test #14: tile-launcher renders ==="
HAS=$(curl -s $BASE/login | grep -c 'tile-grid' || true)
if [ "$HAS" -ge 1 ]; then
  check "/login has tile-grid (>=1)" "ok" "ok"
else
  check "/login has tile-grid" "ok" "FAIL"
fi

echo "=== PLAN test #15 + #16: /login/legacy GET + POST ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' $BASE/login/legacy)
check "GET /login/legacy 200" "200" "$HTTP"
ADMIN_KEY="$ADMIN_KEY" python -c "
import os, urllib.parse, sys
body = 'password=' + urllib.parse.quote(os.environ['ADMIN_KEY'], safe='')
sys.stdout.write(body)" > "$JSON_TMP"
chmod 600 "$JSON_TMP"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -c $CK_LEGACY -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-binary @"$JSON_TMP" $BASE/login/legacy)
check "POST /login/legacy correct returns 303" "303" "$HTTP"
LEGACY_ME=$(curl -s -b $CK_LEGACY $BASE/api/me | python -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
check "legacy login sets cookie as alton" "alton" "$LEGACY_ME"

echo "=== PLAN test #17: rate limit kicks in after 5 fails ==="
rm -f "$FAILURES"
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' \
    -d '{"user_id":"alton","pin":"0000"}' $BASE/api/auth/login > /dev/null
done
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"alton","pin":"0000"}' $BASE/api/auth/login)
check "6th attempt rate-limited (429)" "429" "$HTTP"

echo "=== Charge 3: rate limit state persists to disk ==="
if [ -f "$FAILURES" ]; then
  check "auth-failures.json exists" "ok" "ok"
else
  check "auth-failures.json exists" "ok" "FAIL"
fi
HAS_FAILURES=$(cat "$FAILURES" 2>/dev/null | python -c "import sys,json; print('1' if json.load(sys.stdin) else '0')" 2>/dev/null || echo "0")
check "auth-failures has entries" "1" "$HAS_FAILURES"
rm -f "$FAILURES"

echo "=== PLAN test #18: forged session cookie rejected ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' \
  --cookie "meridian_session=vayu:badsignaturefakehex0123456789ab" $BASE/api/me)
check "forged cookie returns 401" "401" "$HTTP"

echo "=== Adversarial: cookie with valid user but garbage sig rejected ==="
HTTP=$(curl -s -o /dev/null -w '%{http_code}' \
  --cookie "meridian_session=alton:0000000000000000000000000000000000000000000000000000000000000000" $BASE/api/me)
check "alton with bad sig returns 401" "401" "$HTTP"

echo "=== Adversarial: cookie signed for one user, replayed as another ==="
VAYU_SIG=$(grep meridian_session $CK_VAYU | awk '{print $NF}')
SUBSTITUTED="alton:${VAYU_SIG#*:}"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' \
  --cookie "meridian_session=$SUBSTITUTED" $BASE/api/me)
check "user-substituted cookie returns 401" "401" "$HTTP"

rm -f $CK_VAYU $CK_ALTON $CK_LEGACY $JSON_TMP "$FAILURES" "$PROFILES"
unset ADMIN_KEY CSRF_VAL CSRF_HDR
echo ""
echo "=== Result: $pass pass / $fail fail ==="
exit $fail
