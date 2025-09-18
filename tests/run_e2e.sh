#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:4000}
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

echo "Enroll patient..."
ENROLL=$(curl -s -X POST "$BASE/api/v1/enroll" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"firstName":"Demo","lastName":"User","district":"Ernakulam","taluk":"Taluk1","allowClinical":true}')
PID=$(echo "$ENROLL" | jq -r '.patientId')

echo "Add encounter..."
curl -s -X POST "$BASE/api/v1/patient/$PID/encounter" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"type":"OPD","notes":"Cough","observations":[{"code":"fever","value":"39","unit":"C","district":"Ernakulam","taluk":"Taluk1"}]}' >/dev/null

echo "Fetch alerts..."
curl -s "$BASE/api/v1/alerts" -H "Authorization: Bearer $TOKEN" | jq '.'

echo "OK"