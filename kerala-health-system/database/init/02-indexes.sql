-- Create indexes for better performance after Prisma migration

-- Wait for tables to be created by Prisma
-- This script will be run after the main migration

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id) WHERE abha_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_state_id ON patients(state_id) WHERE state_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_qr_code ON patients(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district) WHERE district IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_origin_state ON patients(origin_state) WHERE origin_state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_work_site ON patients(work_site) WHERE work_site IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_birth_date ON patients(birth_date);

-- Full-text search index for patients
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients USING GIN (
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(phone, '') || ' ' ||
        COALESCE(abha_id, '') || ' ' ||
        COALESCE(state_id, '')
    )
);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_patients_first_name_trgm ON patients USING GIN (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_last_name_trgm ON patients USING GIN (last_name gin_trgm_ops);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_facility ON users(facility) WHERE facility IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login) WHERE last_login IS NOT NULL;

-- Encounter indexes
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_clinician_id ON encounters(clinician_id) WHERE clinician_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_start_time ON encounters(start_time);
CREATE INDEX IF NOT EXISTS idx_encounters_facility ON encounters(facility) WHERE facility IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON encounters(created_at);

-- Composite index for patient encounters
CREATE INDEX IF NOT EXISTS idx_encounters_patient_start_time ON encounters(patient_id, start_time DESC);

-- Observation indexes
CREATE INDEX IF NOT EXISTS idx_observations_encounter_id ON observations(encounter_id);
CREATE INDEX IF NOT EXISTS idx_observations_code ON observations(code);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_observations_effective_date ON observations(effective_date_time);
CREATE INDEX IF NOT EXISTS idx_observations_status ON observations(status);

-- Composite index for vital signs queries
CREATE INDEX IF NOT EXISTS idx_observations_encounter_code ON observations(encounter_id, code);

-- Immunization indexes
CREATE INDEX IF NOT EXISTS idx_immunizations_patient_id ON immunizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_vaccine_code ON immunizations(vaccine_code);
CREATE INDEX IF NOT EXISTS idx_immunizations_occurrence ON immunizations(occurrence_date_time);
CREATE INDEX IF NOT EXISTS idx_immunizations_status ON immunizations(status);

-- Medication request indexes
CREATE INDEX IF NOT EXISTS idx_medication_requests_encounter_id ON medication_requests(encounter_id);
CREATE INDEX IF NOT EXISTS idx_medication_requests_status ON medication_requests(status);
CREATE INDEX IF NOT EXISTS idx_medication_requests_authored_on ON medication_requests(authored_on);

-- Binary (attachments) indexes
CREATE INDEX IF NOT EXISTS idx_binaries_patient_id ON binaries(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_binaries_encounter_id ON binaries(encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_binaries_content_type ON binaries(content_type);
CREATE INDEX IF NOT EXISTS idx_binaries_created_at ON binaries(created_at);

-- Consent indexes
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);
CREATE INDEX IF NOT EXISTS idx_consents_date_time ON consents(date_time);

-- Patient access indexes
CREATE INDEX IF NOT EXISTS idx_patient_access_patient_id ON patient_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_user_id ON patient_access(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_granted_at ON patient_access(granted_at);
CREATE INDEX IF NOT EXISTS idx_patient_access_expires_at ON patient_access(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_access_revoked_at ON patient_access(revoked_at) WHERE revoked_at IS NOT NULL;

-- Composite index for active patient access
CREATE INDEX IF NOT EXISTS idx_patient_access_active ON patient_access(patient_id, user_id) 
WHERE revoked_at IS NULL;

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type) WHERE resource_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- Composite indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_timestamp ON audit_logs(patient_id, timestamp DESC) 
WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC) 
WHERE user_id IS NOT NULL;

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_district ON alerts(district) WHERE district IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON alerts(detected_at);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Composite index for active alerts
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(status, detected_at DESC) 
WHERE status IN ('ACTIVE', 'INVESTIGATING');

-- Geospatial indexes (if we add location data later)
-- CREATE INDEX IF NOT EXISTS idx_patients_location ON patients USING GIST (location) WHERE location IS NOT NULL;

-- Performance monitoring views
CREATE OR REPLACE VIEW patient_statistics AS
SELECT 
    COUNT(*) as total_patients,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as patients_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as patients_last_7_days,
    COUNT(DISTINCT district) as districts_covered,
    COUNT(DISTINCT origin_state) as origin_states,
    COUNT(*) FILTER (WHERE gender = 'MALE') as male_patients,
    COUNT(*) FILTER (WHERE gender = 'FEMALE') as female_patients,
    COUNT(*) FILTER (WHERE abha_id IS NOT NULL) as patients_with_abha,
    COUNT(*) FILTER (WHERE qr_code IS NOT NULL) as patients_with_qr
FROM patients 
WHERE is_active = true;

CREATE OR REPLACE VIEW encounter_statistics AS
SELECT 
    COUNT(*) as total_encounters,
    COUNT(*) FILTER (WHERE start_time >= CURRENT_DATE - INTERVAL '30 days') as encounters_last_30_days,
    COUNT(*) FILTER (WHERE start_time >= CURRENT_DATE - INTERVAL '7 days') as encounters_last_7_days,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(DISTINCT facility) as facilities,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
FROM encounters 
WHERE status = 'FINISHED';

-- Add comments for documentation
COMMENT ON INDEX idx_patients_search IS 'Full-text search index for patient names, phone, ABHA ID, and state ID';
COMMENT ON INDEX idx_patients_first_name_trgm IS 'Trigram index for fuzzy matching on first names';
COMMENT ON INDEX idx_patients_last_name_trgm IS 'Trigram index for fuzzy matching on last names';
COMMENT ON INDEX idx_encounters_patient_start_time IS 'Composite index for efficient patient encounter history queries';
COMMENT ON INDEX idx_patient_access_active IS 'Index for active patient access permissions';
COMMENT ON INDEX idx_audit_logs_patient_timestamp IS 'Composite index for patient audit trail queries';

-- Create materialized view for analytics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_patient_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_patients,
    COUNT(DISTINCT district) as districts,
    COUNT(*) FILTER (WHERE gender = 'MALE') as male_count,
    COUNT(*) FILTER (WHERE gender = 'FEMALE') as female_count,
    COUNT(*) FILTER (WHERE abha_id IS NOT NULL) as abha_linked
FROM patients 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON daily_patient_stats (date);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_patient_stats;
END;
$$ LANGUAGE plpgsql;