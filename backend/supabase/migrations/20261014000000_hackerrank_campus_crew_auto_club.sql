-- Migration: Auto-provision hackerrankcampuscrew club per campus
-- Location: backend/supabase/migrations/20261014000000_hackerrank_campus_crew_auto_club.sql

-- 1. Ensure clubs table has index on name and college
CREATE INDEX IF NOT EXISTS idx_clubs_name_college ON public.clubs(name, college);
