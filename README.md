# Hotelus PMS (demo) — Gestión hotelera

Aplicación web tipo **PMS** para gestionar **habitaciones, reservas y huéspedes**, pensada como proyecto de portfolio.

## Qué incluye

- **Dashboard** con ocupación e ingresos (Recharts)
- **Habitaciones** con “quick view” para acciones rápidas
- **Reservas** con filtros, export CSV, impresión y detalle con cargos
- **Calendario** semanal/mensual por habitación
- **Huéspedes** con ABM básico
- **Modo offline** (sin Supabase): datos en memoria + persistencia en `localStorage`
- **Modo Supabase** (opcional): persistencia en base de datos

## Stack

- React + React Router
- Vite
- Tailwind CSS
- Supabase (opcional)

## Requisitos

- Node.js \(recomendado: LTS\)

## Instalación y uso

```bash
npm install
npm run dev
```

## Conectar Supabase (opcional)

- Copiá `.env.example` a `.env`
- Completá las variables y reiniciá el server

Guía paso a paso: `docs/SUPABASE_SETUP.md`.

## Build (producción)

```bash
npm run lint
npm run build
npm run preview
```

## Deploy rápido (Vercel / Netlify)

- **Vercel**
  - Importá el repo
  - **Build command**: `npm run build`
  - **Output directory**: `dist`
  - (Si usás Supabase) agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno

- **Netlify**
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Variables de entorno: iguales a Vercel

## Notas

- Si no configurás `.env`, la app funciona igual en modo offline (ideal para demo/entrevista).
- Si querés multi-tenant más adelante, todo está filtrado por `hotel_id` en Supabase.
