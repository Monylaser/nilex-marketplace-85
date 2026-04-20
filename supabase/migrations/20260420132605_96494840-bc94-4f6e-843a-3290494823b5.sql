
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.ad_status AS ENUM ('draft', 'pending', 'active', 'sold', 'expired', 'rejected');
CREATE TYPE public.ad_condition AS ENUM ('new', 'used', 'refurbished');
CREATE TYPE public.boost_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');

-- ============= PROFILES (mirrors auth.users) =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  governorate TEXT,
  city TEXT,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phone_verified_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ DEFAULT now(),
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============= USER ROLES (separate table for security) =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============= REFERENCE TABLES =============
CREATE TABLE public.governorates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  cities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  subcategories_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cars (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL UNIQUE,
  models_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.boost_packages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.badges (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  min_points INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT,
  condition_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= ADS =============
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory TEXT,
  governorate TEXT NOT NULL,
  city TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  condition ad_condition NOT NULL DEFAULT 'used',
  views INTEGER NOT NULL DEFAULT 0,
  status ad_status NOT NULL DEFAULT 'pending',
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  boosted_until TIMESTAMPTZ,
  boost_package_id BIGINT REFERENCES public.boost_packages(id) ON DELETE SET NULL,
  images_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_ads_user ON public.ads(user_id);
CREATE INDEX idx_ads_category ON public.ads(category_id);
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_ads_gov ON public.ads(governorate);
CREATE INDEX idx_ads_created ON public.ads(created_at DESC);
CREATE INDEX idx_ads_boosted ON public.ads(is_boosted, boosted_until);

-- ============= BOOST TRANSACTIONS =============
CREATE TABLE public.boost_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  package_id BIGINT NOT NULL REFERENCES public.boost_packages(id),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_id TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_free_trial BOOLEAN NOT NULL DEFAULT false,
  status boost_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_boost_tx_user ON public.boost_transactions(user_id);
CREATE INDEX idx_boost_tx_ad ON public.boost_transactions(ad_id);

-- ============= POINTS =============
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_point_tx_user ON public.point_transactions(user_id);

-- ============= USER BADGES =============
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- ============= MESSAGES =============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_sender ON public.messages(sender_id);
CREATE INDEX idx_msg_receiver ON public.messages(receiver_id);
CREATE INDEX idx_msg_ad ON public.messages(ad_id);

-- ============= RATINGS =============
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rater_id, rated_id, ad_id)
);

-- ============= FAVORITES =============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ad_id)
);
CREATE INDEX idx_fav_user ON public.favorites(user_id);

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data_json JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_via_json JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, is_read);

-- ============= BANNERS =============
CREATE TABLE public.banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  link TEXT,
  position TEXT NOT NULL DEFAULT 'home_top',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  clicks INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= SETTINGS =============
CREATE TABLE public.settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  group_name TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= SAVED SEARCHES =============
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_user ON public.saved_searches(user_id);

-- ============= updated_at trigger =============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ads_updated BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_governorates_updated BEFORE UPDATE ON public.governorates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cars_updated BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= AUTO-CREATE PROFILE + role + points on signup =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.user_points (user_id, points, lifetime_points, level) VALUES (NEW.id, 0, 0, 1);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= ENABLE RLS ON ALL TABLES =============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============

-- profiles: anyone authenticated can read, owner can update; admins do anything
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: user reads own; only admins manage
CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Reference tables: public read, admin write
CREATE POLICY "gov_read" ON public.governorates FOR SELECT USING (true);
CREATE POLICY "gov_admin" ON public.governorates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "cat_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat_admin" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "cars_read" ON public.cars FOR SELECT USING (true);
CREATE POLICY "cars_admin" ON public.cars FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "bp_read" ON public.boost_packages FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bp_admin" ON public.boost_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "badges_read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges_admin" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ads: active visible to all; owner full control on own; admin full
CREATE POLICY "ads_read_active" ON public.ads FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "ads_read_own" ON public.ads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ads_insert_own" ON public.ads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ads_update_own" ON public.ads FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ads_delete_own" ON public.ads FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ads_admin_all" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- boost_transactions: owner only; admin all
CREATE POLICY "boost_tx_own" ON public.boost_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "boost_tx_insert" ON public.boost_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "boost_tx_admin" ON public.boost_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_points: owner read; system writes (via triggers/edge functions); admin all
CREATE POLICY "points_read_own" ON public.user_points FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "points_admin" ON public.user_points FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ptx_read_own" ON public.point_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ptx_admin" ON public.point_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_badges: anyone can read (public profile); admin writes
CREATE POLICY "ub_read" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "ub_admin" ON public.user_badges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- messages: only sender or receiver
CREATE POLICY "msg_read" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "msg_send" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "msg_update_receiver" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());
CREATE POLICY "msg_admin" ON public.messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ratings: public read; rater inserts own
CREATE POLICY "rate_read" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "rate_insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());
CREATE POLICY "rate_update_own" ON public.ratings FOR UPDATE TO authenticated USING (rater_id = auth.uid());
CREATE POLICY "rate_delete_own" ON public.ratings FOR DELETE TO authenticated USING (rater_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- favorites: owner only
CREATE POLICY "fav_own" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notifications: owner only
CREATE POLICY "notif_own_read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_admin" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- banners: public read of active; admin manage
CREATE POLICY "banner_read" ON public.banners FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "banner_admin" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- settings: public read; admin write
CREATE POLICY "set_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "set_admin" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- saved_searches: owner
CREATE POLICY "saved_own" ON public.saved_searches FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
