-- Esquema inicial para el PMS. Ejecutá esto en Supabase → SQL Editor si aún no tenés las tablas.

-- Habitaciones
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id text NOT NULL DEFAULT 'hotel-1',
  number text NOT NULL,
  type text NOT NULL DEFAULT 'Simple',
  status text NOT NULL DEFAULT 'Disponible',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ARS'
);

-- Huéspedes
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id text NOT NULL DEFAULT 'hotel-1',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT ''
);

-- Reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id text NOT NULL DEFAULT 'hotel-1',
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'Confirmed',
  charges jsonb DEFAULT '[]'::jsonb,
  paid_at_check_in boolean DEFAULT false
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guests_hotel ON public.guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON public.reservations(check_in);
