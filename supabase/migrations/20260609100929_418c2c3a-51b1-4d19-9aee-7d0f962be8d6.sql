
-- Roles enum and table (separate from profiles to avoid privilege escalation)
CREATE TYPE public.app_role AS ENUM ('host', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Classes
CREATE TYPE public.booking_type AS ENUM ('scheduled', 'on_request');

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  activity TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  duration_min INT NOT NULL DEFAULT 60,
  booking_type public.booking_type NOT NULL DEFAULT 'scheduled',
  start_at TIMESTAMPTZ,
  capacity INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX classes_activity_idx ON public.classes (activity);
CREATE INDEX classes_start_at_idx ON public.classes (start_at);
CREATE INDEX classes_host_idx ON public.classes (host_id);

GRANT SELECT ON public.classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active classes are publicly readable" ON public.classes
  FOR SELECT TO anon, authenticated USING (is_active = true OR auth.uid() = host_id);
CREATE POLICY "Hosts can insert their own classes" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id AND public.has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update their own classes" ON public.classes
  FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their own classes" ON public.classes
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Bookings
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'requested', 'cancelled', 'declined');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.booking_status NOT NULL,
  message TEXT,
  preferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_customer_idx ON public.bookings (customer_id);
CREATE INDEX bookings_class_idx ON public.bookings (class_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customer can see their bookings; host can see bookings for their classes
CREATE POLICY "Customers view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Hosts view bookings for their classes" ON public.bookings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.host_id = auth.uid())
  );
CREATE POLICY "Customers create their own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers cancel own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Hosts update bookings for their classes" ON public.bookings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.host_id = auth.uid())
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_classes BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_bookings BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
