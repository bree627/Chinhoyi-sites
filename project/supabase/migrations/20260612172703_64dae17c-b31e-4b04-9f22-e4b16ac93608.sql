
-- Users manage files in a folder named after their own user id
CREATE POLICY "Sellers upload own id docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seller-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Sellers read own id docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'seller-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Sellers update own id docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'seller-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read all id docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'seller-ids' AND public.has_role(auth.uid(), 'admin'));
