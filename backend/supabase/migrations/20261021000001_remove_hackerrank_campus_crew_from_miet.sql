-- Migration: Permanently remove hackerrankcampuscrew club from MIET
-- Location: backend/supabase/migrations/20261021000001_remove_hackerrank_campus_crew_from_miet.sql

DELETE FROM public.clubs
WHERE slug = 'hackerrankcampuscrew'
   OR (name ILIKE '%hackerrank%' AND college = 'MIET')
   OR id = '00000000-0000-0000-0000-000000000004';
