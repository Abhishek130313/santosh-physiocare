-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create custom types for better data integrity
DO $$ 
BEGIN
    -- User roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'ADMIN',
            'CLINICIAN', 
            'KIOSK',
            'PUBLIC_HEALTH',
            'AUDITOR'
        );
    END IF;

    -- Gender types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM (
            'MALE',
            'FEMALE',
            'OTHER',
            'UNKNOWN'
        );
    END IF;

    -- Encounter status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'encounter_status') THEN
        CREATE TYPE encounter_status AS ENUM (
            'PLANNED',
            'ARRIVED',
            'IN_PROGRESS',
            'FINISHED',
            'CANCELLED'
        );
    END IF;

    -- Encounter class
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'encounter_class') THEN
        CREATE TYPE encounter_class AS ENUM (
            'INPATIENT',
            'OUTPATIENT',
            'EMERGENCY',
            'HOME_HEALTH',
            'VIRTUAL'
        );
    END IF;

    -- Observation status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'observation_status') THEN
        CREATE TYPE observation_status AS ENUM (
            'REGISTERED',
            'PRELIMINARY',
            'FINAL',
            'AMENDED',
            'CORRECTED',
            'CANCELLED',
            'ENTERED_IN_ERROR'
        );
    END IF;

    -- Immunization status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'immunization_status') THEN
        CREATE TYPE immunization_status AS ENUM (
            'COMPLETED',
            'ENTERED_IN_ERROR',
            'NOT_DONE'
        );
    END IF;

    -- Medication status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medication_status') THEN
        CREATE TYPE medication_status AS ENUM (
            'ACTIVE',
            'ON_HOLD',
            'CANCELLED',
            'COMPLETED',
            'ENTERED_IN_ERROR',
            'STOPPED',
            'DRAFT',
            'UNKNOWN'
        );
    END IF;

    -- Consent status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_status') THEN
        CREATE TYPE consent_status AS ENUM (
            'DRAFT',
            'PROPOSED',
            'ACTIVE',
            'REJECTED',
            'INACTIVE',
            'ENTERED_IN_ERROR'
        );
    END IF;

    -- Access type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_type') THEN
        CREATE TYPE access_type AS ENUM (
            'READ',
            'WRITE',
            'FULL'
        );
    END IF;

    -- Alert types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
        CREATE TYPE alert_type AS ENUM (
            'DISEASE_OUTBREAK',
            'VACCINATION_DUE',
            'FOLLOW_UP_REQUIRED',
            'SYSTEM_ANOMALY',
            'DATA_QUALITY'
        );
    END IF;

    -- Alert severity
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        );
    END IF;

    -- Alert status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
        CREATE TYPE alert_status AS ENUM (
            'ACTIVE',
            'INVESTIGATING',
            'RESOLVED',
            'FALSE_POSITIVE'
        );
    END IF;

END $$;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'KH-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
END;
$$ language 'plpgsql';

-- Function to calculate age
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ language 'plpgsql';

-- Function for full-text search
CREATE OR REPLACE FUNCTION patient_search_vector(
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    abha_id TEXT,
    state_id TEXT
) RETURNS tsvector AS $$
BEGIN
    RETURN to_tsvector('english', 
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(phone, '') || ' ' ||
        COALESCE(abha_id, '') || ' ' ||
        COALESCE(state_id, '')
    );
END;
$$ language 'plpgsql' IMMUTABLE;