-- 1) Verifications table
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  documents_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

CREATE INDEX IF NOT EXISTS verifications_user_idx ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS verifications_status_idx ON public.verifications(status);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY ver_read_own ON public.verifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY ver_insert_own ON public.verifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ver_admin_all ON public.verifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_verifications_updated
  BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Phone OTP table
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_user_idx ON public.phone_otps(user_id, created_at DESC);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Owner can read their own OTP rows (no code value leaks; only hash stored)
CREATE POLICY otp_read_own ON public.phone_otps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Inserts/updates happen via SECURITY DEFINER edge functions; no client policies needed.

-- 3) Cached level on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_level SMALLINT NOT NULL DEFAULT 0;

-- 4) Sync trigger: keep profiles.verification_level = max approved level
CREATE OR REPLACE FUNCTION public.sync_verification_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  max_level SMALLINT;
BEGIN
  uid := COALESCE(NEW.user_id, OLD.user_id);
  SELECT COALESCE(MAX(level), 0) INTO max_level
  FROM public.verifications
  WHERE user_id = uid AND status = 'approved'
    AND (expires_at IS NULL OR expires_at > now());
  UPDATE public.profiles SET verification_level = max_level WHERE id = uid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_verification_level
  AFTER INSERT OR UPDATE OR DELETE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_verification_level();