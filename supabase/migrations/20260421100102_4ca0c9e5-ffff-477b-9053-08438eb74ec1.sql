ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_sound_muted boolean NOT NULL DEFAULT false;