-- Migration: Add Clubs and Club-Based Scoping
-- Location: backend/supabase/migrations/20260924000000_add_clubs_and_scoping.sql

-- 1. Create Clubs Table
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Technical',
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Clubs Policies
DROP POLICY IF EXISTS "Allow public read access to active clubs" ON public.clubs;
CREATE POLICY "Allow public read access to active clubs"
    ON public.clubs FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Allow admins full access to clubs" ON public.clubs;
CREATE POLICY "Allow admins full access to clubs"
    ON public.clubs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 2. Insert Default Clubs (ACM, IEEE, LeetCode)
INSERT INTO public.clubs (id, name, slug, description, category) VALUES
    ('00000000-0000-0000-0000-000000000001', 'ACM', 'acm', 'Association for Computing Machinery student chapter focused on algorithms, systems, computing research, and hackathons.', 'Technical'),
    ('00000000-0000-0000-0000-000000000002', 'IEEE', 'ieee', 'Institute of Electrical and Electronics Engineers branch dedicated to engineering, hardware, IoT, and technological innovation.', 'Technical'),
    ('00000000-0000-0000-0000-000000000003', 'LeetCode', 'leetcode', 'Campus competitive programming community, daily DSA practice, algorithmic sprint contests, and technical interview preparation.', 'Coding & DSA')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- 3. Add club_id column to profiles (only organizers are linked to a club)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Ensure students and admins have no club_id
UPDATE public.profiles
SET club_id = NULL
WHERE role IN ('student', 'admin');

-- 4. Add club_id column to events (each event is hosted by a club)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Default existing events to ACM if unassigned
UPDATE public.events
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;

-- 5. Update handle_new_user trigger function (students & admins join without any club)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_club_id UUID := NULL;
BEGIN
    -- Only set club_id if specifically assigned (e.g. organizer role metadata)
    IF new.raw_user_meta_data->>'role' = 'organizer' AND new.raw_user_meta_data->>'club_id' IS NOT NULL AND (new.raw_user_meta_data->>'club_id')::text != '' THEN
        user_club_id := (new.raw_user_meta_data->>'club_id')::uuid;
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role, college, branch, year, club_id)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'student'),
        COALESCE(new.raw_user_meta_data->>'college', ''),
        COALESCE(new.raw_user_meta_data->>'branch', ''),
        COALESCE(new.raw_user_meta_data->>'year', ''),
        user_club_id
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
