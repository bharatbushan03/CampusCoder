-- Prevent duplicate registrations for same event and email.
ALTER TABLE public.registrations
  ADD CONSTRAINT unique_event_email UNIQUE (event_id, email);
