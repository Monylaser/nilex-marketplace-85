ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "category_icons_public_read" ON storage.objects;
CREATE POLICY "category_icons_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'category-icons');

DROP POLICY IF EXISTS "category_icons_admin_insert" ON storage.objects;
CREATE POLICY "category_icons_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "category_icons_admin_update" ON storage.objects;
CREATE POLICY "category_icons_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "category_icons_admin_delete" ON storage.objects;
CREATE POLICY "category_icons_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));