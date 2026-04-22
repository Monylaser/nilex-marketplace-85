CREATE TABLE IF NOT EXISTS public.ai_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai logs"
ON public.ai_generation_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai logs"
ON public.ai_generation_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_log_user_day ON public.ai_generation_log (user_id, created_at);