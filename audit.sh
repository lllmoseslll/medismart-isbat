#!/usr/bin/env bash
BASE="http://localhost:4000/api"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MEDISMART FULL ENDPOINT AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PASS=0; FAIL=0

check() {
  local label="$1" code="$2" expected="$3"
  if [ "$code" = "$expected" ]; then
    echo "  PASS  $label ($code)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $label — got $code, expected $expected"
    FAIL=$((FAIL+1))
  fi
}

# ── Login ──────────────────────────────────────
echo ""
echo "[ AUTH ]"
PAT_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"patient@medismart.com","password":"Patient@123"}')
PAT_TOKEN=$(echo "$PAT_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
PAT_ID=$(echo "$PAT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
REFRESH_TOK=$(echo "$PAT_RESP" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
[ -n "$PAT_TOKEN" ] && check "POST /auth/login (patient)" "200" "200" || check "POST /auth/login (patient)" "fail" "200"

DOC_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"dr.chen@medismart.com","password":"Doctor@123"}')
DOC_TOKEN=$(echo "$DOC_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$DOC_TOKEN" ] && check "POST /auth/login (doctor)" "200" "200" || check "POST /auth/login (doctor)" "fail" "200"

ADM_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@medismart.com","password":"Admin@123"}')
ADM_TOKEN=$(echo "$ADM_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$ADM_TOKEN" ] && check "POST /auth/login (admin)" "200" "200" || check "POST /auth/login (admin)" "fail" "200"

REG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Audit Tester\",\"email\":\"audit_$(date +%s)@test.com\",\"password\":\"Audit@1234\",\"role\":\"patient\"}")
check "POST /auth/register" "$REG" "201"

REFS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH_TOK\"}")
check "POST /auth/refresh" "$REFS" "200"

# ── Patients ────────────────────────────────────
echo ""
echo "[ PATIENTS ]"
PP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PAT_TOKEN" \
  "$BASE/patients/$PAT_ID/profile")
check "GET  /patients/:id/profile" "$PP" "200"

UPP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
  -H "Authorization: Bearer $PAT_TOKEN" -H "Content-Type: application/json" \
  "$BASE/patients/$PAT_ID/profile" -d '{"phone":"+256-772-999999"}')
check "PUT  /patients/:id/profile" "$UPP" "200"

SYM=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $PAT_TOKEN" -H "Content-Type: application/json" \
  "$BASE/patients/symptoms" -d '{"symptoms":["fever","headache","fatigue"]}')
SYM_CODE=$(echo "$SYM" | tail -1)
SYM_BODY=$(echo "$SYM" | head -1)
check "POST /patients/symptoms (AI)" "$SYM_CODE" "201"

SYM_LIST=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PAT_TOKEN" "$BASE/patients/symptoms")
check "GET  /patients/symptoms" "$SYM_LIST" "200"

SYM_ID=$(curl -s -H "Authorization: Bearer $PAT_TOKEN" "$BASE/patients/symptoms" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$SYM_ID" ]; then
  SYM_ONE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PAT_TOKEN" "$BASE/patients/symptoms/$SYM_ID")
  check "GET  /patients/symptoms/:id" "$SYM_ONE" "200"
fi

# ── Doctors ─────────────────────────────────────
echo ""
echo "[ DOCTORS ]"
DL=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PAT_TOKEN" "$BASE/doctors")
check "GET  /doctors" "$DL" "200"

DL_S=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PAT_TOKEN" "$BASE/doctors?specialty=Cardiology")
check "GET  /doctors?specialty=Cardiology" "$DL_S" "200"

DOC_PROF_ID=$(curl -s -H "Authorization: Bearer $DOC_TOKEN" "$BASE/doctors" \
  | grep -o '"userId":"[^"]*"' | head -1 | cut -d'"' -f4)

DA=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PAT_TOKEN" "$BASE/doctors/$DOC_PROF_ID/availability")
check "GET  /doctors/:id/availability" "$DA" "200"

MA=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $DOC_TOKEN" "$BASE/doctors/me/appointments")
check "GET  /doctors/me/appointments" "$MA" "200"

KBD=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $DOC_TOKEN" "$BASE/doctors/knowledge-base")
check "GET  /doctors/knowledge-base" "$KBD" "200"

KB_ADD=$(curl -s -X POST -H "Authorization: Bearer $DOC_TOKEN" -H "Content-Type: application/json" \
  "$BASE/doctors/knowledge-base" \
  -d '{"conditionName":"Audit Condition","symptomKeywords":["audit","test"],"specialty":"General Practice"}')
KB_ID=$(echo "$KB_ADD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$KB_ID" ] && check "POST /doctors/knowledge-base" "201" "201" || check "POST /doctors/knowledge-base" "fail" "201"

# ── Appointments ────────────────────────────────
echo ""
echo "[ APPOINTMENTS ]"
APT_P=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PAT_TOKEN" "$BASE/appointments")
check "GET  /appointments (patient)" "$APT_P" "200"

APT_D=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $DOC_TOKEN" "$BASE/appointments")
check "GET  /appointments (doctor)" "$APT_D" "200"

APT_A=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADM_TOKEN" "$BASE/appointments")
check "GET  /appointments (admin)" "$APT_A" "200"

FUTURE=$(node -e "var d=new Date();d.setDate(d.getDate()+45);d.setHours(14,0,0,0);console.log(d.toISOString())")
BOOK=$(curl -s -X POST -H "Authorization: Bearer $PAT_TOKEN" -H "Content-Type: application/json" \
  "$BASE/appointments" -d "{\"doctorId\":\"$DOC_PROF_ID\",\"scheduledAt\":\"$FUTURE\"}")
BOOK_ID=$(echo "$BOOK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$BOOK_ID" ] && check "POST /appointments" "201" "201" || check "POST /appointments (${BOOK:0:60})" "fail" "201"

if [ -n "$BOOK_ID" ]; then
  CONF=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: Bearer $DOC_TOKEN" -H "Content-Type: application/json" \
    "$BASE/appointments/$BOOK_ID" -d '{"status":"confirmed"}')
  check "PUT  /appointments/:id (confirm)" "$CONF" "200"

  CANC=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $PAT_TOKEN" "$BASE/appointments/$BOOK_ID")
  check "DELETE /appointments/:id (cancel)" "$CANC" "200"
fi

# ── Admin ───────────────────────────────────────
echo ""
echo "[ ADMIN ]"
AU=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADM_TOKEN" "$BASE/admin/users")
check "GET  /admin/users" "$AU" "200"

NEW_U=$(curl -s -X POST -H "Authorization: Bearer $ADM_TOKEN" -H "Content-Type: application/json" \
  "$BASE/admin/users" \
  -d '{"name":"Tmp User","email":"tmp_audit_user@test.com","password":"Tmp@1234","role":"patient"}')
NEW_UID=$(echo "$NEW_U" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$NEW_UID" ] && check "POST /admin/users" "201" "201" || check "POST /admin/users" "fail" "201"

if [ -n "$NEW_UID" ]; then
  EU=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: Bearer $ADM_TOKEN" -H "Content-Type: application/json" \
    "$BASE/admin/users/$NEW_UID" -d '{"name":"Tmp User Updated"}')
  check "PUT  /admin/users/:id" "$EU" "200"

  RP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: Bearer $ADM_TOKEN" -H "Content-Type: application/json" \
    "$BASE/admin/users/$NEW_UID/reset-password" -d '{"password":"NewPass@123"}')
  check "PUT  /admin/users/:id/reset-password" "$RP" "200"

  DU=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $ADM_TOKEN" "$BASE/admin/users/$NEW_UID")
  check "DELETE /admin/users/:id" "$DU" "200"
fi

REP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADM_TOKEN" "$BASE/admin/reports")
check "GET  /admin/reports" "$REP" "200"

AKB=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADM_TOKEN" "$BASE/admin/knowledge-base")
check "GET  /admin/knowledge-base" "$AKB" "200"

if [ -n "$KB_ID" ]; then
  UKB=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: Bearer $ADM_TOKEN" -H "Content-Type: application/json" \
    "$BASE/admin/knowledge-base/$KB_ID" \
    -d '{"conditionName":"Audit Updated","symptomKeywords":["audit"],"specialty":"General Practice"}')
  check "PUT  /admin/knowledge-base/:id" "$UKB" "200"

  DKB=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $ADM_TOKEN" "$BASE/admin/knowledge-base/$KB_ID")
  check "DELETE /admin/knowledge-base/:id" "$DKB" "200"
fi

ADV=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
  -H "Authorization: Bearer $ADM_TOKEN" -H "Content-Type: application/json" \
  "$BASE/admin/doctors/$DOC_PROF_ID/availability" \
  -d '{"availability":[{"dayOfWeek":1,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":3,"startTime":"08:00","endTime":"17:00"}]}')
check "PUT  /admin/doctors/:id/availability" "$ADV" "200"

# ── Health ──────────────────────────────────────
echo ""
echo "[ HEALTH ]"
HL=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
check "GET  /health" "$HL" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PASSED: $PASS   FAILED: $FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
