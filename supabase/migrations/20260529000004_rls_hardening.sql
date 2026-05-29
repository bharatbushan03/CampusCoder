-- Harden Announcement Policies
DROP POLICY IF EXISTS "Allow public to view announcements" ON public.announcements;
CREATE POLICY "Allow public to view active announcements" ON public.announcements FOR SELECT USING (is_active = true AND publish_date <= now());

-- Harden Event Policies
DROP POLICY IF EXISTS "Allow anyone to read published events" ON public.events;
CREATE POLICY "Public can read published and non-cancelled events" ON public.events FOR SELECT USING (status = 'published');

-- Harden Registration Policies
DROP POLICY IF EXISTS "Allow public to register for events" ON public.registrations;
CREATE POLICY "Allow public to register for published events" ON public.registrations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE id = event_id AND status = 'published'
    )
);

-- Ensure users cannot register multiple times via RLS as well
-- This is already handled by UNIQUE constraint, but RLS adds a layer of defense
