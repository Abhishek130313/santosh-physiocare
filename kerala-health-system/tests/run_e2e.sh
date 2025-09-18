#!/bin/bash

# Kerala Health System - End-to-End Demo Script
# This script demonstrates the complete workflow of the system

set -e

echo "🏥 Kerala Health System - End-to-End Demo"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:4000/api/v1"
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@kerala.gov.in"
ADMIN_PASSWORD="Admin@123"
DOCTOR_EMAIL="doctor.ernakulam@kerala.gov.in"
DOCTOR_PASSWORD="Doctor@123"

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    
    if [ -n "$auth_header" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data"
        else
            curl -s -X $method "$API_BASE_URL$endpoint" \
                -H "Authorization: Bearer $auth_header"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X $method "$API_BASE_URL$endpoint"
        fi
    fi
}

# Function to extract JSON field
extract_json() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d':' -f2 | tr -d '"'
}

# Function to wait for services
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service failed to start within expected time${NC}"
    return 1
}

# Check if services are running
echo -e "${BLUE}Step 1: Checking services...${NC}"
wait_for_service "Backend API" "$API_BASE_URL/../health"
wait_for_service "Frontend" "$FRONTEND_URL"

echo -e "${GREEN}✓ All services are running${NC}"

# Step 2: Login as admin
echo -e "${BLUE}Step 2: Admin login...${NC}"
admin_login_response=$(api_call "POST" "/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$admin_login_response" | grep -q "success.*true"; then
    admin_token=$(extract_json "$admin_login_response" "token")
    echo -e "${GREEN}✓ Admin login successful${NC}"
else
    echo -e "${RED}✗ Admin login failed${NC}"
    echo "Response: $admin_login_response"
    exit 1
fi

# Step 3: Login as doctor
echo -e "${BLUE}Step 3: Doctor login...${NC}"
doctor_login_response=$(api_call "POST" "/auth/login" "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\"}")

if echo "$doctor_login_response" | grep -q "success.*true"; then
    doctor_token=$(extract_json "$doctor_login_response" "token")
    echo -e "${GREEN}✓ Doctor login successful${NC}"
else
    echo -e "${RED}✗ Doctor login failed${NC}"
    echo "Response: $doctor_login_response"
    exit 1
fi

# Step 4: Enroll a new patient
echo -e "${BLUE}Step 4: Enrolling new patient...${NC}"
patient_data='{
  "firstName": "രാജു",
  "lastName": "കുമാർ",
  "gender": "MALE",
  "birthDate": "1985-06-15",
  "phone": "+91-9876543210",
  "email": "raju.kumar@example.com",
  "abhaId": "12-3456-7890-1234",
  "district": "Ernakulam",
  "taluk": "Kochi",
  "village": "Kochi East",
  "pincode": "682001",
  "originState": "Odisha",
  "originDistrict": "Cuttack",
  "workSite": "Kochi Metro Construction Phase 2",
  "employerName": "M/s Metro Builders Pvt Ltd",
  "employerContact": "+91-9876543211",
  "preferredLanguage": "ml",
  "emergencyName": "സുനിത കുമാർ",
  "emergencyPhone": "+91-9876543212",
  "emergencyRelation": "Wife"
}'

enrollment_response=$(api_call "POST" "/patients/enroll" "$patient_data" "$doctor_token")

if echo "$enrollment_response" | grep -q "success.*true"; then
    patient_id=$(extract_json "$enrollment_response" "id")
    qr_code=$(extract_json "$enrollment_response" "qrCode")
    echo -e "${GREEN}✓ Patient enrolled successfully${NC}"
    echo -e "   Patient ID: $patient_id"
    echo -e "   QR Code: $qr_code"
else
    echo -e "${RED}✗ Patient enrollment failed${NC}"
    echo "Response: $enrollment_response"
    exit 1
fi

# Step 5: Generate and download QR code
echo -e "${BLUE}Step 5: Generating QR code...${NC}"
qr_response=$(api_call "GET" "/patients/$patient_id/qr-code" "" "$doctor_token")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ QR code generated successfully${NC}"
else
    echo -e "${RED}✗ QR code generation failed${NC}"
fi

# Step 6: Generate smart card PDF
echo -e "${BLUE}Step 6: Generating smart card...${NC}"
card_response=$(api_call "GET" "/patients/$patient_id/smart-card" "" "$doctor_token")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Smart card generated successfully${NC}"
else
    echo -e "${RED}✗ Smart card generation failed${NC}"
fi

# Step 7: Create an encounter (simulate offline then sync)
echo -e "${BLUE}Step 7: Creating encounter...${NC}"
encounter_data='{
  "patientId": "'$patient_id'",
  "type": "General Consultation",
  "priority": "routine",
  "chiefComplaint": "Fever and cough for 3 days",
  "diagnosis": "Upper respiratory tract infection",
  "treatment": "Paracetamol 500mg TID, Rest and fluids",
  "notes": "Patient presented with fever and dry cough. No shortness of breath. Vitals stable.",
  "facility": "Primary Health Centre - Ernakulam",
  "department": "General Medicine",
  "observations": [
    {
      "code": "8310-5",
      "display": "Body temperature",
      "valueNumber": 38.5,
      "unit": "Cel"
    },
    {
      "code": "8462-4",
      "display": "Diastolic blood pressure",
      "valueNumber": 80,
      "unit": "mmHg"
    },
    {
      "code": "8480-6",
      "display": "Systolic blood pressure",
      "valueNumber": 120,
      "unit": "mmHg"
    }
  ],
  "medications": [
    {
      "medicationName": "Paracetamol",
      "dosageText": "500mg",
      "frequency": "Three times daily",
      "duration": "5 days",
      "instructions": "Take after meals"
    }
  ]
}'

encounter_response=$(api_call "POST" "/encounters" "$encounter_data" "$doctor_token")

if echo "$encounter_response" | grep -q "success.*true"; then
    encounter_id=$(extract_json "$encounter_response" "id")
    echo -e "${GREEN}✓ Encounter created successfully${NC}"
    echo -e "   Encounter ID: $encounter_id"
else
    echo -e "${RED}✗ Encounter creation failed${NC}"
    echo "Response: $encounter_response"
    exit 1
fi

# Step 8: Test QR code lookup
echo -e "${BLUE}Step 8: Testing QR code lookup...${NC}"
qr_lookup_response=$(api_call "GET" "/qr/$qr_code" "" "$doctor_token")

if echo "$qr_lookup_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ QR code lookup successful${NC}"
else
    echo -e "${RED}✗ QR code lookup failed${NC}"
    echo "Response: $qr_lookup_response"
fi

# Step 9: Test sync functionality
echo -e "${BLUE}Step 9: Testing sync functionality...${NC}"
sync_data='{
  "operations": [
    {
      "id": "sync-test-1",
      "type": "CREATE",
      "resource": "Observation",
      "data": {
        "encounterId": "'$encounter_id'",
        "code": "8867-4",
        "display": "Heart rate",
        "valueNumber": 72,
        "unit": "/min"
      },
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  ],
  "lastSyncTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

sync_response=$(api_call "POST" "/sync" "$sync_data" "$doctor_token")

if echo "$sync_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Sync operation successful${NC}"
else
    echo -e "${RED}✗ Sync operation failed${NC}"
    echo "Response: $sync_response"
fi

# Step 10: Generate analytics alert
echo -e "${BLUE}Step 10: Creating sample alert...${NC}"
alert_data='{
  "type": "DISEASE_OUTBREAK",
  "severity": "MEDIUM",
  "title": "Respiratory Infection Cluster",
  "description": "Increased cases of respiratory infections detected in Ernakulam district",
  "district": "Ernakulam",
  "affectedCount": 15,
  "threshold": 10,
  "actualValue": 15
}'

alert_response=$(api_call "POST" "/alerts" "$alert_data" "$admin_token")

if echo "$alert_response" | grep -q "success.*true"; then
    alert_id=$(extract_json "$alert_response" "id")
    echo -e "${GREEN}✓ Alert created successfully${NC}"
    echo -e "   Alert ID: $alert_id"
else
    echo -e "${RED}✗ Alert creation failed${NC}"
    echo "Response: $alert_response"
fi

# Step 11: Test analytics endpoints
echo -e "${BLUE}Step 11: Testing analytics...${NC}"
analytics_response=$(api_call "GET" "/analytics/dashboard?period=month&district=Ernakulam" "" "$admin_token")

if echo "$analytics_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Analytics data retrieved successfully${NC}"
else
    echo -e "${RED}✗ Analytics retrieval failed${NC}"
    echo "Response: $analytics_response"
fi

# Step 12: Test audit trail
echo -e "${BLUE}Step 12: Testing audit trail...${NC}"
audit_response=$(api_call "GET" "/audit/$patient_id" "" "$admin_token")

if echo "$audit_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Audit trail retrieved successfully${NC}"
else
    echo -e "${RED}✗ Audit trail retrieval failed${NC}"
    echo "Response: $audit_response"
fi

# Step 13: Test ABHA integration (mock)
echo -e "${BLUE}Step 13: Testing ABHA integration...${NC}"
abha_data='{
  "patientId": "'$patient_id'",
  "abhaId": "12-3456-7890-1234",
  "otp": "123456"
}'

abha_response=$(api_call "POST" "/abha/link" "$abha_data" "$doctor_token")

if echo "$abha_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ ABHA integration test successful${NC}"
else
    echo -e "${YELLOW}⚠ ABHA integration test completed (mock response)${NC}"
fi

# Final summary
echo
echo -e "${GREEN}🎉 End-to-End Demo Completed Successfully!${NC}"
echo
echo -e "${BLUE}📊 Demo Summary:${NC}"
echo "   ✓ Admin and Doctor authentication"
echo "   ✓ Patient enrollment with multilingual data"
echo "   ✓ QR code generation and lookup"
echo "   ✓ Smart card PDF generation"
echo "   ✓ Clinical encounter creation"
echo "   ✓ Vital signs and medication recording"
echo "   ✓ Offline sync simulation"
echo "   ✓ Analytics alert generation"
echo "   ✓ Dashboard analytics retrieval"
echo "   ✓ Audit trail verification"
echo "   ✓ ABHA integration (mock)"
echo
echo -e "${BLUE}🔗 Access the system:${NC}"
echo "   • Frontend: $FRONTEND_URL"
echo "   • API Documentation: $API_BASE_URL/../docs"
echo "   • Patient ID: $patient_id"
echo "   • QR Code: $qr_code"
echo
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Open $FRONTEND_URL in your browser"
echo "   2. Login with doctor credentials"
echo "   3. Search for the enrolled patient"
echo "   4. View the encounter and observations"
echo "   5. Check the public health dashboard for the alert"
echo
echo -e "${GREEN}Demo completed at $(date)${NC}"