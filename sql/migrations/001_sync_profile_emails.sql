-- Sync Supabase Auth emails into public.profiles.
-- Run this once in the Supabase SQL Editor.

BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles AS profiles
SET email = users.email
FROM auth.users AS users
WHERE profiles.id = users.id
  AND profiles.email IS DISTINCT FROM users.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, alias)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'alias'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
