
-- account_type on profiles
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('person','gym');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'person';

-- special_events
CREATE TABLE IF NOT EXISTS public.special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  capacity INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS special_events_host_idx ON public.special_events(host_id);
CREATE INDEX IF NOT EXISTS special_events_date_idx ON public.special_events(event_date);

GRANT SELECT ON public.special_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_events TO authenticated;
GRANT ALL ON public.special_events TO service_role;

ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are public" ON public.special_events
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR auth.uid() = host_id);

CREATE POLICY "Hosts insert own events" ON public.special_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts update own events" ON public.special_events
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts delete own events" ON public.special_events
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

CREATE TRIGGER touch_special_events BEFORE UPDATE ON public.special_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- event_signups
CREATE TABLE IF NOT EXISTS public.event_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.special_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_signups_event_idx ON public.event_signups(event_id);
CREATE INDEX IF NOT EXISTS event_signups_user_idx ON public.event_signups(user_id);

GRANT SELECT ON public.event_signups TO anon;
GRANT SELECT, INSERT, DELETE ON public.event_signups TO authenticated;
GRANT ALL ON public.event_signups TO service_role;

ALTER TABLE public.event_signups ENABLE ROW LEVEL SECURITY;

-- Public can read signup rows (to count attendees); user can see own; host sees all for their events.
CREATE POLICY "Signups readable by anyone for counts" ON public.event_signups
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users sign themselves up" ON public.event_signups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cancel own signup" ON public.event_signups
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.special_events e WHERE e.id = event_id AND e.host_id = auth.uid()
  ));
