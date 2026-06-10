
-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  pet_id TEXT,
  pet_name TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- GOALS
CREATE TABLE public.goals (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  steps_target INTEGER NOT NULL DEFAULT 8000,
  water_target INTEGER NOT NULL DEFAULT 8,
  sleep_target NUMERIC NOT NULL DEFAULT 8,
  workouts_per_week INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals all" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DAILY LOGS
CREATE TABLE public.daily_logs (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  water INTEGER NOT NULL DEFAULT 0,
  sleep NUMERIC NOT NULL DEFAULT 0,
  workout BOOLEAN NOT NULL DEFAULT false,
  rewarded JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs all" ON public.daily_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PET STATE
CREATE TABLE public.pet_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  hunger INTEGER NOT NULL DEFAULT 70,
  fun INTEGER NOT NULL DEFAULT 70,
  last_decay TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_state TO authenticated;
GRANT ALL ON public.pet_state TO service_role;
ALTER TABLE public.pet_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pet all" ON public.pet_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AUTO-CREATE PROFILE + GOALS + PET on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.goals (user_id) VALUES (NEW.id);
  INSERT INTO public.pet_state (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
