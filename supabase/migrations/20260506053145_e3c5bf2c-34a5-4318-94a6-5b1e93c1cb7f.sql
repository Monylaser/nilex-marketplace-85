ALTER TYPE ad_status ADD VALUE IF NOT EXISTS 'flagged';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS moderated_by uuid;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS moderated_at timestamptz;