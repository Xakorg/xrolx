-- Lock down storage.objects for the gallery bucket. All access via server fns + service role.
CREATE POLICY "No direct client access to gallery bucket"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id <> 'gallery')
  WITH CHECK (bucket_id <> 'gallery');
