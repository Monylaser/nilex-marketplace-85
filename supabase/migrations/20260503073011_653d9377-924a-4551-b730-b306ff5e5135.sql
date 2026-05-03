
-- ad_videos table
CREATE TABLE public.ad_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds NUMERIC,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_videos_read_public"
  ON public.ad_videos FOR SELECT
  USING (
    status = 'completed' AND EXISTS (
      SELECT 1 FROM public.ads a
      WHERE a.id = ad_videos.ad_id AND a.status = 'active' AND a.deleted_at IS NULL
    )
  );

CREATE POLICY "ad_videos_read_owner"
  ON public.ad_videos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ad_videos_insert_owner"
  ON public.ad_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_videos.ad_id AND a.user_id = auth.uid())
  );

CREATE POLICY "ad_videos_update_owner"
  ON public.ad_videos FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ad_videos_delete_owner"
  ON public.ad_videos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ad_videos_admin_all"
  ON public.ad_videos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_ad_videos_updated_at
  BEFORE UPDATE ON public.ad_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-videos', 'ad-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path layout is {user_id}/{ad_id}/...
CREATE POLICY "ad_videos_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-videos');

CREATE POLICY "ad_videos_storage_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ad-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ad_videos_storage_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ad-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ad_videos_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ad-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
