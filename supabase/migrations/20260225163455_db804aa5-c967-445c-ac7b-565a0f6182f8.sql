-- Rename bucket from galvanikbau to galvanek_bau
-- Step 1: Update storage paths in existing objects
UPDATE storage.objects SET bucket_id = 'galvanek_bau' WHERE bucket_id = 'galvanikbau';

-- Step 2: Rename the bucket
UPDATE storage.buckets SET id = 'galvanek_bau', name = 'galvanek_bau' WHERE id = 'galvanikbau';

-- Step 3: Drop old policies and recreate with new bucket name
DROP POLICY IF EXISTS "galvanikbau_select" ON storage.objects;
DROP POLICY IF EXISTS "galvanikbau_insert" ON storage.objects;
DROP POLICY IF EXISTS "galvanikbau_update" ON storage.objects;
DROP POLICY IF EXISTS "galvanikbau_delete" ON storage.objects;

CREATE POLICY "galvanek_bau_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'galvanek_bau' AND auth.uid() IS NOT NULL);

CREATE POLICY "galvanek_bau_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'galvanek_bau' AND auth.uid() IS NOT NULL);

CREATE POLICY "galvanek_bau_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'galvanek_bau' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'galvanek_bau' AND auth.uid() IS NOT NULL);

CREATE POLICY "galvanek_bau_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'galvanek_bau' AND (public.is_admin() OR auth.uid() = owner));