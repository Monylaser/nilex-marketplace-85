-- Per-user appearance & accessibility preferences
CREATE TABLE IF NOT EXISTS public.user_appearance_settings (
  user_id UUID PRIMARY KEY,
  dark_mode TEXT NOT NULL DEFAULT 'system' CHECK (dark_mode IN ('light','dark','system')),
  font_size TEXT NOT NULL DEFAULT 'md' CHECK (font_size IN ('sm','md','lg','xl')),
  layout_style TEXT NOT NULL DEFAULT 'grid' CHECK (layout_style IN ('grid','list')),
  density TEXT NOT NULL DEFAULT 'comfortable' CHECK (density IN ('comfortable','compact')),
  language TEXT NOT NULL DEFAULT 'en',
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appearance_select_own"
  ON public.user_appearance_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "appearance_insert_own"
  ON public.user_appearance_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "appearance_update_own"
  ON public.user_appearance_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "appearance_admin_all"
  ON public.user_appearance_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_user_appearance_set_updated_at
  BEFORE UPDATE ON public.user_appearance_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();