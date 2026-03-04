-- Permisos para usuarios autenticados (después del login).
-- Ejecutá este script en Supabase → SQL Editor si al iniciar sesión no se cargan los datos.

-- Dar permisos al rol authenticated sobre las tablas (necesario además de RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;

-- Habilitar RLS en las tablas (si no está ya)
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para rol 'authenticated': permitir SELECT, INSERT, UPDATE, DELETE

-- ROOMS
DROP POLICY IF EXISTS "authenticated_select_rooms" ON public.rooms;
CREATE POLICY "authenticated_select_rooms" ON public.rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_rooms" ON public.rooms;
CREATE POLICY "authenticated_insert_rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_rooms" ON public.rooms;
CREATE POLICY "authenticated_update_rooms" ON public.rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_rooms" ON public.rooms;
CREATE POLICY "authenticated_delete_rooms" ON public.rooms FOR DELETE TO authenticated USING (true);

-- GUESTS
DROP POLICY IF EXISTS "authenticated_select_guests" ON public.guests;
CREATE POLICY "authenticated_select_guests" ON public.guests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_guests" ON public.guests;
CREATE POLICY "authenticated_insert_guests" ON public.guests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_guests" ON public.guests;
CREATE POLICY "authenticated_update_guests" ON public.guests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_guests" ON public.guests;
CREATE POLICY "authenticated_delete_guests" ON public.guests FOR DELETE TO authenticated USING (true);

-- RESERVATIONS
DROP POLICY IF EXISTS "authenticated_select_reservations" ON public.reservations;
CREATE POLICY "authenticated_select_reservations" ON public.reservations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_reservations" ON public.reservations;
CREATE POLICY "authenticated_insert_reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_reservations" ON public.reservations;
CREATE POLICY "authenticated_update_reservations" ON public.reservations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_reservations" ON public.reservations;
CREATE POLICY "authenticated_delete_reservations" ON public.reservations FOR DELETE TO authenticated USING (true);
