ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_chat_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_listings_enabled boolean NOT NULL DEFAULT true;