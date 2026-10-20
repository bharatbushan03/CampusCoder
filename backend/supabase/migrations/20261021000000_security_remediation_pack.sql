-- =============================================================================
-- Migration: 20261021000000_security_remediation_pack.sql
-- Description: Closes SEC-02, SEC-03, and enables atomic capacity enforcement.
-- =============================================================================

BEGIN;

-- 1. Create Role Audit Logs Table
CREATE TABLE IF NOT EXISTS public.role_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_role TEXT NOT NULL,
    new_role TEXT NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view role audit logs" ON public.role_audit_logs;
CREATE POLICY "Admins can view role audit logs"
    ON public.role_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Add capacity column to events if missing
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT NULL CHECK (capacity IS NULL OR capacity > 0);

-- 3. Fix handle_new_user() trigger function (SEC-03 Part 1)
-- Permanently disregards raw_user_meta_data->>'role'. Default is ALWAYS 'student'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, college, branch, year)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        'student', -- Enforce student role regardless of metadata input
        COALESCE(new.raw_user_meta_data->>'college', ''),
        COALESCE(new.raw_user_meta_data->>'branch', ''),
        COALESCE(new.raw_user_meta_data->>'year', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger to Prevent Unprivileged Role Elevation (SEC-03 Part 2)
CREATE OR REPLACE FUNCTION public.prevent_profile_role_modification()
RETURNS trigger AS $$
DECLARE
    caller_role TEXT;
    is_service_role BOOLEAN;
BEGIN
    -- Check if execution is from Supabase service_role key
    is_service_role := (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role';
    
    IF is_service_role THEN
        RETURN new;
    END IF;

    -- Block attempts to modify id or role
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        -- Only existing admins can alter roles
        SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
        IF caller_role != 'admin' THEN
            RAISE EXCEPTION 'Access Denied: You lack permissions to modify user roles.';
        END IF;
    END IF;

    IF (OLD.id IS DISTINCT FROM NEW.id) THEN
        RAISE EXCEPTION 'Access Denied: Profile ID is immutable.';
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_profile_role_modification ON public.profiles;
CREATE TRIGGER tr_prevent_profile_role_modification
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.prevent_profile_role_modification();

-- 5. Revoke Column-Level Update on Role from Authenticated Clients
REVOKE UPDATE (role, id, created_at) ON public.profiles FROM authenticated;
REVOKE UPDATE (role, id, created_at) ON public.profiles FROM anon;

-- 6. Atomic Event Registration Function with Row Locks & Capacity Checks
CREATE OR REPLACE FUNCTION public.register_student_atomic(
    p_event_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_college TEXT,
    p_branch TEXT,
    p_year TEXT,
    p_coding_level TEXT,
    p_preferred_language TEXT,
    p_reason_to_join TEXT
)
RETURNS UUID AS $$
DECLARE
    v_event RECORD;
    v_current_count INTEGER;
    v_registration_id UUID;
    v_clean_email TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));

    -- Acquire an exclusive row lock on the target event
    SELECT id, status, date, registration_deadline, capacity
    INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    IF v_event.status != 'published' THEN
        RAISE EXCEPTION 'EVENT_CLOSED';
    END IF;

    IF v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline < now() THEN
        RAISE EXCEPTION 'EVENT_CLOSED';
    END IF;

    IF v_event.date < CURRENT_DATE THEN
        RAISE EXCEPTION 'EVENT_CLOSED';
    END IF;

    -- Duplicate check
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE event_id = p_event_id AND email = v_clean_email
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_REGISTRATION';
    END IF;

    -- Capacity enforcement
    IF v_event.capacity IS NOT NULL THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.registrations
        WHERE event_id = p_event_id;

        IF v_current_count >= v_event.capacity THEN
            RAISE EXCEPTION 'CAPACITY_EXCEEDED';
        END IF;
    END IF;

    -- Insert registration
    INSERT INTO public.registrations (
        event_id,
        full_name,
        email,
        phone,
        college,
        branch,
        year,
        coding_level,
        preferred_language,
        reason_to_join,
        registered_at,
        attendance_status
    ) VALUES (
        p_event_id,
        p_full_name,
        v_clean_email,
        p_phone,
        p_college,
        p_branch,
        p_year,
        p_coding_level,
        p_preferred_language,
        p_reason_to_join,
        timezone('utc'::text, now()),
        'registered'
    ) RETURNING id INTO v_registration_id;

    RETURN v_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
