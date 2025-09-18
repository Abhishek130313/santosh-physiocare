### FHIR Mapping (Simplified)

- Patient -> `Patient` model (id, name, gender, birthDate, telecom, address)
- Encounter -> `Encounter` (status=finished, class=AMB)
- Observation -> `Observation` (category=vital-signs, code e.g. fever)
- Immunization -> `Immunization` (status=completed, vaccineCode.text)
- Consent -> `Consent` (scope=treatment, category=privacy)
- Binary -> `Attachment` (contentType, data -> S3 encrypted)

Notes:
- ABHA id placeholder stored as `Patient.abhaId`
- Consent enforcement for analytics uses `Consent.allowAnalytics`
- Audit ledger is custom extension, not FHIR Provenance