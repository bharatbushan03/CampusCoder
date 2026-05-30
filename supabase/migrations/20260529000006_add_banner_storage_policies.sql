-- Configure the public event banner bucket with admin-only writes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read event banners" ON storage.objects;
CREATE POLICY "Public can read event banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Admins can upload event banners" ON storage.objects;
CREATE POLICY "Admins can upload event banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND public.is_admin_or_organizer());

DROP POLICY IF EXISTS "Admins can update event banners" ON storage.objects;
CREATE POLICY "Admins can update event banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND public.is_admin_or_organizer())
  WITH CHECK (bucket_id = 'banners' AND public.is_admin_or_organizer());

DROP POLICY IF EXISTS "Admins can delete event banners" ON storage.objects;
CREATE POLICY "Admins can delete event banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND public.is_admin_or_organizer());
