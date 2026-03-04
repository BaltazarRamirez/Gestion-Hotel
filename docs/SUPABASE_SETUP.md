# Conectar el PMS a Supabase

## 1. Crear proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta (o iniciá sesión).
2. **New project** → elegí nombre, contraseña de base de datos y región.
3. Esperá a que el proyecto esté listo.

## 2. Ejecutar el esquema SQL

1. En el panel del proyecto, abrí **SQL Editor**.
2. Creá una **New query**.
3. Copiá y pegá todo el contenido del archivo:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. Ejecutá la query (Run). Deberías ver las tablas `rooms`, `guests` y `reservations` creadas.

## 3. Obtener URL y clave anónima

1. En el panel del proyecto, entrá a **Settings** (ícono de engranaje) → **API**.
2. Ahí vas a ver:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** (una clave larga)

## 4. Configurar variables en el proyecto

1. En la **raíz del proyecto** (misma carpeta donde está `package.json`), creá un archivo que se llame **exactamente** `.env` (no `.env.txt`, no `.env.example`).
2. Adentro del archivo, **solo** estas dos líneas (reemplazá por tus valores, sin espacios alrededor del `=`):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **VITE_SUPABASE_URL**: en Supabase → **Settings** (ícono engranaje) → **API** → en "Project URL" copiá la URL (ej: `https://xxxxx.supabase.co`).
- **VITE_SUPABASE_ANON_KEY**: en la misma pantalla, en **Project API keys**, usá la clave que dice **anon** / **public** (es una clave larga que suele empezar con `eyJ...`). No uses la "service_role" ni "secret"; esa es solo para el backend.

Importante: los nombres tienen que ser **exactamente** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (con el prefijo `VITE_`), si no Vite no las expone al navegador.

3. Reiniciá el servidor de desarrollo (`npm run dev`). La app va a usar Supabase en lugar de datos en memoria.

## 5. (Opcional) Cargar datos de prueba

Podés insertar datos de prueba desde el SQL Editor:

```sql
-- Insertar habitaciones (reemplazá los uuid si querés)
insert into public.rooms (id, hotel_id, number, type, status, price, currency)
values
  (gen_random_uuid(), 'hotel-1', '101', 'Simple', 'Disponible', 50000, 'ARS'),
  (gen_random_uuid(), 'hotel-1', '102', 'Doble', 'Ocupada', 90000, 'ARS'),
  (gen_random_uuid(), 'hotel-1', '103', 'Suite', 'Limpieza', 120000, 'ARS');

-- Insertar huéspedes
insert into public.guests (id, hotel_id, full_name, email, phone)
values
  (gen_random_uuid(), 'hotel-1', 'Juan Pérez', 'juan@mail.com', '+54 381 555-111'),
  (gen_random_uuid(), 'hotel-1', 'María Gómez', 'maria@mail.com', '+54 381 555-222');

-- Para reservas necesitás los id de habitaciones y huéspedes que devolvió el insert anterior.
-- Ejemplo (reemplazá ROOM_ID_101, GUEST_ID_JUAN por ids reales de tu base):
-- insert into public.reservations (hotel_id, guest_id, room_id, check_in, check_out, status)
-- values ('hotel-1', 'GUEST_ID_JUAN', 'ROOM_ID_101', '2026-02-25', '2026-02-28', 'Confirmed');
```

O creá habitaciones y huéspedes desde la propia app una vez conectada.

## Sin variables de entorno

Si **no** creás `.env` o no definís `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, la app sigue funcionando con **datos en memoria** (los de `src/data/*.js`), sin tocar la base.

## Si el build falla por "tslib" (Vite 8 beta)

Con Vite 8 (Rolldown) a veces falla el build por la dependencia `tslib` de Supabase. Este proyecto incluye un alias en `vite.config.js` para resolverlo, pero si en tu entorno llegara a fallar:

- **Desarrollo**: `npm run dev` funciona bien con Supabase.
- **Producción**: podés bajar a Vite 5 para hacer el build:  
  `npm install vite@5 @vitejs/plugin-react@4 --save-dev`  
  Luego `npm run build`. Si más adelante actualizás Vite, probá de nuevo el build.

## Los huéspedes (o datos) no se guardan en Supabase

1. **Confirmá que la app usa Supabase**: Si no tenés el `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, la app usa datos en memoria y nada se escribe en la base. Reiniciá el servidor (`npm run dev`) después de crear o cambiar el `.env`.

2. **Permisos y RLS**: Ejecutá en el **SQL Editor** de Supabase el contenido del archivo `supabase/migrations/002_fix_guests_rls.sql`. Ese script da permisos al rol `anon` y crea políticas para que los inserts funcionen.

3. **Errores**: Si al crear un huésped ves un mensaje de error en rojo (toast o en el modal), copiá el texto. Suele ser por RLS, tabla inexistente o columnas incorrectas. Si no ves error pero no aparece en Supabase, abrí las DevTools del navegador (F12) → pestaña **Console** y buscá `[guests.service] Supabase insert error`.

## Login activo pero no se cargan los datos

Si configuraste Supabase y el **login funciona** pero al entrar al Dashboard (o a Reservas, Habitaciones, etc.) **no aparecen los datos**:

1. **Ejecutá de nuevo el script RLS** (incluye ahora permisos GRANT):
   - En Supabase → **SQL Editor** → **New query**.
   - Copiá y pegá **todo** el contenido de `supabase/migrations/002_rls_authenticated.sql`.
   - Run. No debería dar error; si dice "relation public.rooms does not exist", primero tenés que crear las tablas (ver paso 2 de esta guía con el esquema inicial).
2. **Comprobá que hay datos**: En Supabase → **Table Editor** → elegí `rooms`, `guests` o `reservations`. Si están vacías, no vas a ver nada en la app. Insertá datos de prueba (sección 5 de esta guía) o creá habitaciones/huéspedes desde la app.
3. **Si ves un mensaje de error en rojo** en la app, copiá el texto. Si no ves error pero las listas están vacías, abrí las **DevTools** del navegador (F12) → pestaña **Console** y buscá líneas que digan `[reservations.service] Supabase error:` o similar; ahí aparece el motivo (permiso denegado, tabla inexistente, etc.).

La app ya **no filtra por hotel_id** al leer: muestra todos los registros que RLS permita. Los nuevos que crees desde la app se guardan con `hotel_id = 'hotel-1'`.

## Multi-tenant (varios hoteles)

El esquema usa `hotel_id` en todas las tablas (por defecto `'hotel-1'`). Los servicios filtran por ese valor. Cuando agregues autenticación, podés hacer que cada usuario tenga un `hotel_id` y usarlo en las consultas.
