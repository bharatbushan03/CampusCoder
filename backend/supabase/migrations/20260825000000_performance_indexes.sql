-- Database Performance Indexes & Concurrency Optimizations
-- Migration: 20260825000000_performance_indexes.sql

-- 1. Profiles Table Indexes
-- Eliminates Seq Scan on profiles when looking up users by email during auth/signup/forgot-password/admin
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. Events Table Indexes
-- Optimizes event listings, featured queries, archive, and workshop filters
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events(status, date);
CREATE INDEX IF NOT EXISTS idx_events_type_status ON public.events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- 3. Registrations Table Indexes
-- Optimizes student dashboard lookup (by email) and admin event attendee sorting
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(lower(email));
CREATE INDEX IF NOT EXISTS idx_registrations_event_registered ON public.registrations(event_id, registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_attendance_status ON public.registrations(attendance_status);

-- 4. Event Owners Table Indexes
-- Eliminates Seq Scan on foreign key event_id during event details joins and cascade operations
CREATE INDEX IF NOT EXISTS idx_event_owners_event_id ON public.event_owners(event_id);

-- 5. Announcements Table Indexes
-- Optimizes active announcements query on homepage and event pages
CREATE INDEX IF NOT EXISTS idx_announcements_active_created ON public.announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_event_id ON public.announcements(event_id);

-- 6. Community Links Table Indexes
-- Optimizes active community links query
CREATE INDEX IF NOT EXISTS idx_community_links_active_platform ON public.community_links(is_active, platform ASC);

-- 7. Showcase Projects Table Indexes
-- Optimizes showcase grid filtering, featured sorting, and student portfolio lookup
CREATE INDEX IF NOT EXISTS idx_showcase_status_featured_created ON public.showcase_projects(status, featured DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_author_id ON public.showcase_projects(author_id);

-- 8. Atomic Increment Function for Showcase Project Stars (Concurrency-safe)
-- Prevents read-modify-write lost update race conditions during simultaneous user likes
CREATE OR REPLACE FUNCTION public.increment_project_stars(target_project_id uuid)
RETURNS integer AS $$
DECLARE
    new_stars integer;
BEGIN
    UPDATE public.showcase_projects
    SET stars = coalesce(stars, 0) + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_project_id
    RETURNING stars INTO new_stars;

    RETURN new_stars;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
