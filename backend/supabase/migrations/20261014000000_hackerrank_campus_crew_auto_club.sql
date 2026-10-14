-- Migration: Auto-provision hackerrankcampuscrew club per campus
-- Location: backend/supabase/migrations/20261014000000_hackerrank_campus_crew_auto_club.sql

-- 1. Ensure clubs table has index on name and college
CREATE INDEX IF NOT EXISTS idx_clubs_name_college ON public.clubs(name, college);

-- 2. Insert default HackerRank Campus Crew for MIET if not exists
INSERT INTO public.clubs (id, name, slug, description, category, college, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'hackerrankcampuscrew',
    'hackerrankcampuscrew',
    'Official HackerRank Campus Crew community chapter focused on algorithms, coding sprints, hackathons, and technical interview preparation.',
    'Coding & DSA',
    'MIET',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    college = EXCLUDED.college;
