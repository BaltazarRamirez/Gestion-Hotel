import { useLocation } from "react-router-dom";

const TITLES = {
  "/dashboard": "Dashboard",
  "/rooms": "Habitaciones",
  "/reservations": "Reservas",
  "/guests": "Huéspedes",
  "/calendar": "Calendario",
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? "Panel";

  const today = new Date();
  const formatted = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 md:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Hotelus PMS
          </p>
          <h1 className="truncate text-base font-semibold text-slate-100 md:text-lg">{title}</h1>
        </div>
      </div>

      <p className="hidden shrink-0 rounded-lg bg-slate-700/60 px-3 py-1.5 text-xs text-slate-300 sm:block">
        {formatted}
      </p>
    </div>
  );
}
