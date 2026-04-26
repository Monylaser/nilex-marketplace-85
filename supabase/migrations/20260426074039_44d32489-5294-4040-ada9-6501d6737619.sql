-- Raw view events
CREATE TABLE public.ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  viewer_id uuid,
  device text,
  governorate text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_views_ad_created ON public.ad_views(ad_id, created_at DESC);
CREATE INDEX idx_ad_views_viewer ON public.ad_views(viewer_id) WHERE viewer_id IS NOT NULL;

ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_views_insert_any ON public.ad_views
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY ad_views_read_owner ON public.ad_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_views.ad_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Daily rollup
CREATE TABLE public.ad_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  date date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  unique_views integer NOT NULL DEFAULT 0,
  inquiries integer NOT NULL DEFAULT 0,
  favorites integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ad_id, date)
);

CREATE INDEX idx_ad_stats_ad_date ON public.ad_stats(ad_id, date DESC);

ALTER TABLE public.ad_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_stats_read_owner ON public.ad_stats
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_stats.ad_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY ad_stats_admin_all ON public.ad_stats
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ad_stats_updated_at
  BEFORE UPDATE ON public.ad_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic upsert helper
CREATE OR REPLACE FUNCTION public.increment_ad_stats(
  _ad_id uuid,
  _views int DEFAULT 0,
  _unique_views int DEFAULT 0,
  _inquiries int DEFAULT 0,
  _favorites int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ad_stats (ad_id, date, views, unique_views, inquiries, favorites)
  VALUES (_ad_id, CURRENT_DATE, _views, _unique_views, _inquiries, _favorites)
  ON CONFLICT (ad_id, date) DO UPDATE SET
    views = ad_stats.views + EXCLUDED.views,
    unique_views = ad_stats.unique_views + EXCLUDED.unique_views,
    inquiries = ad_stats.inquiries + EXCLUDED.inquiries,
    favorites = ad_stats.favorites + EXCLUDED.favorites,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_stats(uuid, int, int, int, int) TO anon, authenticated;