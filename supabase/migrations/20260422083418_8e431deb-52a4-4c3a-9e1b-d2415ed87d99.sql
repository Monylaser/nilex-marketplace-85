-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns to ads
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS embedding vector(768),
  ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;

-- 3. Vector index (ivfflat with cosine)
CREATE INDEX IF NOT EXISTS ads_embedding_idx
  ON public.ads USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Embedding queue
CREATE TABLE IF NOT EXISTS public.search_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  attempts int NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_queue_pending_idx
  ON public.search_queue (status, created_at) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS search_queue_ad_pending_uniq
  ON public.search_queue (ad_id) WHERE status IN ('pending','processing');

ALTER TABLE public.search_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_admin_all" ON public.search_queue
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Search analytics
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  query text NOT NULL,
  results_count int NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'ai', -- ai | keyword
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_analytics_query_idx ON public.search_analytics (lower(query));
CREATE INDEX IF NOT EXISTS search_analytics_created_idx ON public.search_analytics (created_at DESC);

ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_self" ON public.search_analytics
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "analytics_insert_anon" ON public.search_analytics
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "analytics_admin_read" ON public.search_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Trigger: enqueue ad whenever searchable fields change
CREATE OR REPLACE FUNCTION public.enqueue_ad_embedding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.title IS DISTINCT FROM OLD.title OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.category_id IS DISTINCT FROM OLD.category_id OR
     NEW.subcategory IS DISTINCT FROM OLD.subcategory THEN
    INSERT INTO public.search_queue (ad_id) VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ads_enqueue_embedding ON public.ads;
CREATE TRIGGER ads_enqueue_embedding
AFTER INSERT OR UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.enqueue_ad_embedding();

-- 7. Similarity search RPC
CREATE OR REPLACE FUNCTION public.search_ads(
  query_embedding vector(768),
  match_count int DEFAULT 20,
  min_similarity float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  governorate text,
  city text,
  views int,
  is_boosted boolean,
  images_json jsonb,
  created_at timestamptz,
  category_id bigint,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id, a.title, a.price, a.governorate, a.city, a.views,
    a.is_boosted, a.images_json, a.created_at, a.category_id,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.ads a
  WHERE a.status = 'active'
    AND a.deleted_at IS NULL
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) >= min_similarity
  ORDER BY a.is_boosted DESC, a.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;