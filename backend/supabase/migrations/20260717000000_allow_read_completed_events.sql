-- Allow public read access to completed events for the archive page
-- This policy allows the anon key (browser) to read events with status = 'completed'

CREATE POLICY "Allow public read access to completed events"
ON public.events
FOR SELECT
USING (status = 'completed');