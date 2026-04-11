import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PAGE_META = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Resumen operativo del hotel",
  },
  "/rooms": {
    title: "Habitaciones",
    subtitle: "Estado, disponibilidad y ocupación",
  },
  "/reservations": {
    title: "Reservas",
    subtitle: "Seguimiento de entradas y salidas",
  },
  "/guests": {
    title: "Huéspedes",
    subtitle: "Información y gestión de clientes",
  },
  "/calendar": {
    title: "Calendario",
    subtitle: "Vista temporal de la operación",
  },
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSupabaseEnabled, signOut } = useAuth();
  const page = PAGE_META[location.pathname] ?? {
    title: "Panel",
    subtitle: "Gestión hotelera en tiempo real",
  };

  const today = new Date();
  const formatted = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedDate = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex shrink-0 rounded-xl border border-slate-700/80 bg-slate-900/60 p-2.5 text-slate-300 shadow-lg shadow-slate-950/20 transition hover:border-slate-600 hover:bg-slate-800/80 hover:text-white md:hidden"
          aria-label="Abrir menú"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="hidden h-10 w-px bg-slate-700/70 md:block" />

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Hotelus PMS
              </p>
              <h1 className="truncate text-base font-semibold text-white md:text-xl">
                {page.title}
              </h1>
            </div>
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">
            {page.subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/55 px-3 py-2 text-sm text-slate-300 shadow-lg shadow-slate-950/20 md:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-200">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Hoy
            </p>
            <p className="whitespace-nowrap text-sm font-medium text-slate-200">
              {formattedDate}
            </p>
          </div>
        </div>

        {isSupabaseEnabled ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3.5 py-2 text-sm font-medium text-slate-200 shadow-lg shadow-slate-950/20 transition hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H9m4 8H7a2 2 0 01-2-2V6a2 2 0 012-2h6"
              />
            </svg>
            Cerrar sesión
          </button>
        ) : null}

        <p className="rounded-2xl border border-slate-700/80 bg-slate-900/55 px-3 py-2 text-xs text-slate-300 shadow-lg shadow-slate-950/20 md:hidden">
          {formattedDate}
        </p>
      </div>
    </div>
  );
}
