-- Migration: Add Colleges Table and Multi-College Scoping
-- Location: backend/supabase/migrations/20261008000000_add_colleges_and_scoping.sql

-- 1. Create Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Colleges Policies
DROP POLICY IF EXISTS "Allow public read access to colleges" ON public.colleges;
CREATE POLICY "Allow public read access to colleges"
    ON public.colleges FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert colleges" ON public.colleges;
CREATE POLICY "Allow authenticated users to insert colleges"
    ON public.colleges FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admins full access to colleges" ON public.colleges;
CREATE POLICY "Allow admins full access to colleges"
    ON public.colleges FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed Default College (MIET)
INSERT INTO public.colleges (name, code)
VALUES ('MIET', 'MIET')
ON CONFLICT (name) DO NOTHING;

-- Populate existing distinct colleges from profiles table if any
INSERT INTO public.colleges (name)
SELECT DISTINCT TRIM(college)
FROM public.profiles
WHERE college IS NOT NULL AND TRIM(college) != ''
ON CONFLICT (name) DO NOTHING;

-- Populate existing distinct colleges from registrations table if any
INSERT INTO public.colleges (name)
SELECT DISTINCT TRIM(college)
FROM public.registrations
WHERE college IS NOT NULL AND TRIM(college) != ''
ON CONFLICT (name) DO NOTHING;

-- 2. Add college column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

UPDATE public.events 
SET college = 'MIET' 
WHERE college IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_college ON public.events (college);

-- 3. Add college column to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

UPDATE public.notes 
SET college = 'MIET' 
WHERE college IS NULL;

CREATE INDEX IF NOT EXISTS idx_notes_college ON public.notes (college);

-- 4. Add college column to note_folders table
ALTER TABLE public.note_folders 
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

UPDATE public.note_folders 
SET college = 'MIET' 
WHERE college IS NULL;

CREATE INDEX IF NOT EXISTS idx_note_folders_college ON public.note_folders (college);

-- 5. Add college column to resources table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

UPDATE public.resources 
SET college = 'MIET' 
WHERE college IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_college ON public.resources (college);

-- 6. Add college column to competitions table
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

UPDATE public.competitions 
SET college = 'MIET' 
WHERE college IS NULL;

CREATE INDEX IF NOT EXISTS idx_competitions_college ON public.competitions (college);
