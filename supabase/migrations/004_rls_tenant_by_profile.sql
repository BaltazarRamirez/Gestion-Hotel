-- RLS por hotel: cada usuario solo ve/edita filas de su hotel (el hotel_id de su perfil).
-- Ejecutá esto DESPUÉS de 003_profiles_and_tenant.sql.

-- Función auxiliar: hotel_id del usuario actual (columna id de profiles = auth.uid())
CREATE OR REPLACE FUNCTION public.my_hotel_id()
RETURNS text AS $$
  SELECT COALESCE(
    (SELECT p.hotel_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1),
    'hotel-1'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Reemplazar políticas de 002 por políticas que filtran por hotel del usuario

-- ROOMS
DROP POLICY IF EXISTS "authenticated_select_rooms" ON public.rooms;
CREATE POLICY "authenticated_select_rooms" ON public.rooms
  FOR SELECT TO authenticated USING (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_insert_rooms" ON public.rooms;
CREATE POLICY "authenticated_insert_rooms" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_update_rooms" ON public.rooms;
CREATE POLICY "authenticated_update_rooms" ON public.rooms
  FOR UPDATE TO authenticated USING (hotel_id = public.my_hotel_id()) WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_delete_rooms" ON public.rooms;
CREATE POLICY "authenticated_delete_rooms" ON public.rooms
  FOR DELETE TO authenticated USING (hotel_id = public.my_hotel_id());

-- GUESTS
DROP POLICY IF EXISTS "authenticated_select_guests" ON public.guests;
CREATE POLICY "authenticated_select_guests" ON public.guests
  FOR SELECT TO authenticated USING (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_insert_guests" ON public.guests;
CREATE POLICY "authenticated_insert_guests" ON public.guests
  FOR INSERT TO authenticated WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_update_guests" ON public.guests;
CREATE POLICY "authenticated_update_guests" ON public.guests
  FOR UPDATE TO authenticated USING (hotel_id = public.my_hotel_id()) WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_delete_guests" ON public.guests;
CREATE POLICY "authenticated_delete_guests" ON public.guests
  FOR DELETE TO authenticated USING (hotel_id = public.my_hotel_id());

-- RESERVATIONS
DROP POLICY IF EXISTS "authenticated_select_reservations" ON public.reservations;
CREATE POLICY "authenticated_select_reservations" ON public.reservations
  FOR SELECT TO authenticated USING (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_insert_reservations" ON public.reservations;
CREATE POLICY "authenticated_insert_reservations" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_update_reservations" ON public.reservations;
CREATE POLICY "authenticated_update_reservations" ON public.reservations
  FOR UPDATE TO authenticated USING (hotel_id = public.my_hotel_id()) WITH CHECK (hotel_id = public.my_hotel_id());

DROP POLICY IF EXISTS "authenticated_delete_reservations" ON public.reservations;
CREATE POLICY "authenticated_delete_reservations" ON public.reservations
  FOR DELETE TO authenticated USING (hotel_id = public.my_hotel_id());
