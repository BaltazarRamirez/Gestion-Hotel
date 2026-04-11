import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import AppBackground from "../components/AppBackground";
import Header from "../components/Header";
import { isSupabaseEnabled } from "../lib/supabase";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rooms", label: "Habitaciones" },
  { to: "/reservations", label: "Reservas" },
  { to: "/guests", label: "Huéspedes" },
  { to: "/calendar", label: "Calendario" },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full">
      <AppBackground />

      {/* Backdrop móvil: fondo oscuro bien visible cuando el menú está abierto */}
      <div
        className="no-print fixed inset-0 z-40 bg-black/80 md:hidden"
        aria-hidden={!sidebarOpen}
        style={{
          pointerEvents: sidebarOpen ? "auto" : "none",
          opacity: sidebarOpen ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR: drawer en móvil, columna fija en md+ */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-700/80 bg-transparent px-4 py-5 transition-transform duration-200 ease-out md:z-10 md:w-[240px] md:translate-x-0 md:px-5 md:py-6 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-center
         md:mb-6">
        <img
          src="/hotelus-logo.png"
          alt="Hotelus"
          className="h-16 w-auto object-contain md:h-20 scale-200"
          width={200}
          height={80}
        />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 md:hidden"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-1",
                  isActive
                    ? "border-violet-400/35 bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-cyan-500/15 text-white shadow-lg shadow-violet-900/25 backdrop-blur-sm"
                    : "border-transparent text-slate-400 hover:border-violet-400/20 hover:bg-gradient-to-r hover:from-violet-500/16 hover:via-fuchsia-500/10 hover:to-blue-500/12 hover:text-slate-100 hover:shadow-lg hover:shadow-violet-950/10 hover:backdrop-blur-sm",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        
        <p
          className={`mt-2 rounded-lg px-2 py-1 text-[10px] font-medium ${
            isSupabaseEnabled
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
          title={
            isSupabaseEnabled
              ? "Los datos se guardan en Supabase"
              : "Datos en memoria"
          }
        >
          {isSupabaseEnabled ? "● Conectado" : "○ Datos en memoria"}
        </p>
      </aside>

      {/* CONTENT */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col md:ml-[240px]">
        <header className="no-print sticky top-0 z-20 border-b border-slate-700/70 bg-slate-900/45 px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

