
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS strike_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "banner_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'banner-images');

CREATE POLICY "banner_images_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "banner_images_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "banner_images_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));
