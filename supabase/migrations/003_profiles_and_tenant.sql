-- Cada usuario tiene su propio hotel: tabla profiles con hotel_id.
-- Ejecutá esto en Supabase → SQL Editor para que cada uno vea solo sus datos.
-- Si ya tenés una tabla profiles con otra estructura, se reemplaza por esta.

-- Eliminar tabla anterior si existe (así la columna "id" queda bien definida)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Tabla de perfiles: un registro por usuario con su hotel_id
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id text NOT NULL DEFAULT 'hotel-1',
  created_at timestamptz DEFAULT now()
);

-- RLS: cada usuario solo puede ver y actualizar su propio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
CREATE POLICY "users_select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- El rol authenticated puede insertar (solo para el trigger; el trigger corre como owner)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Trigger: al crear un usuario, crear su perfil con un hotel_id único (cada uno su base)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, hotel_id)
  VALUES (NEW.id, 'hotel-' || NEW.id::text)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Perfiles para usuarios que ya existían: hotel_id único por usuario
-- (ejecutá una sola vez; si ya tenés perfiles, actualizá hotel_id para que no compartan datos)
INSERT INTO public.profiles (id, hotel_id)
SELECT id, 'hotel-' || id::text FROM auth.users
ON CONFLICT (id) DO UPDATE SET hotel_id = 'hotel-' || EXCLUDED.id::text;
