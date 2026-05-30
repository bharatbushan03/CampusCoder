-- Harden Announcement Policies
DROP POLICY IF EXISTS "Allow public to view announcements" ON public.announcements;
CREATE POLICY "Allow public to view active announcements" ON public.announcements FOR SELECT USING (is_active = true AND publish_date <= now());

-- Harden Event Policies
DROP POLICY IF EXISTS "Allow anyone to read published events" ON public.events;
DROP POLICY IF EXISTS "Public can read published and non-cancelled events" ON public.events;
CREATE POLICY "Public can read public event states" ON public.events
    FOR SELECT
    USING (status IN ('published', 'completed', 'cancelled'));

-- Event owners should only be exposed for events that are public.
DROP POLICY IF EXISTS "Allow anyone to read event owners details" ON public.event_owners;
DROP POLICY IF EXISTS "Public can read owners for public events" ON public.event_owners;
CREATE POLICY "Public can read owners for public events" ON public.event_owners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_owners.event_id
              AND events.status IN ('published', 'completed', 'cancelled')
        )
    );

-- Harden Registration Policies
DROP POLICY IF EXISTS "Allow public to register for events" ON public.registrations;
CREATE POLICY "Allow public to register for published events" ON public.registrations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE id = event_id
          AND status = 'published'
          AND (registration_deadline IS NULL OR registration_deadline > now())
          AND date >= current_date
    )
);

-- Ensure users cannot register multiple times via RLS as well
-- This is already handled by UNIQUE constraint, but RLS adds a layer of defense
