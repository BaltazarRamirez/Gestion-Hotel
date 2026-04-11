import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReservations } from "../services/reservations.service";
import { getGuests } from "../services/guests.service";
import { getRooms, updateRoom } from "../services/rooms.service";
import { updateReservation } from "../services/reservations.service";
import { StatusBadge } from "../components/StatusBadge";
import { RoomQuickView } from "../components/RoomQuickView";
import { formatDateShort } from "../utils/formatDate";
import { PageLoader } from "../components/Spinner";
import { isoTodayLocal } from "../utils/date";
import { useAuth } from "../contexts/AuthContext";

const DAYS_TO_SHOW = 7;
const VIEW_WEEK = "week";
const VIEW_MONTH = "month";

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function Calendar() {
  const navigate = useNavigate();
  const { isSupabaseEnabled, session, profileLoaded } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [quickViewRoom, setQuickViewRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_WEEK);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const canFetch = !isSupabaseEnabled || (Boolean(session) && profileLoaded);

  useEffect(() => {
    if (!canFetch) return;
    setLoadError(null);
    Promise.all([getReservations(), getRooms(), getGuests()])
      .then(([res, rms, g]) => {
        setReservations(res);
        setRooms(rms);
        setGuests(g);
      })
      .catch((err) => setLoadError(err?.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }, [canFetch]);

  async function handleUpdateRoom(roomId, patch) {
    await updateRoom(roomId, patch);
    const next = await getRooms();
    setRooms(next);
  }

  async function handleUpdateReservation(id, patch) {
    await updateReservation(id, patch);
    const next = await getReservations();
    setReservations(next);
  }

  function handleViewReservation(res) {
    setQuickViewRoom(null);
    navigate("/reservations", { state: { openReservationId: res.id } });
  }

  const [startDate, setStartDate] = useState(() => new Date());

  const days = useMemo(() => {
    if (viewMode === VIEW_MONTH) {
      const y = monthDate.getFullYear();
      const m = monthDate.getMonth();
      const last = new Date(y, m + 1, 0);
      const result = [];
      for (let d = 1; d <= last.getDate(); d++) {
        const date = new Date(y, m, d);
        const iso = date.toISOString().slice(0, 10);
        result.push({
          iso,
          label: date.toLocaleDateString("es-AR", {
            weekday: "short",
            day: "2-digit",
          }),
        });
      }
      return result;
    }
    const result = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      result.push({
        iso,
        label: d.toLocaleDateString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
      });
    }
    return result;
  }, [viewMode, startDate, monthDate]);

  const guestById = useMemo(() => {
    const map = new Map();
    guests.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  function reservationFor(roomId, dayIso) {
    return reservations.find((r) => {
      if (r.roomId !== roomId) return false;
      return r.checkIn <= dayIso && dayIso < r.checkOut;
    });
  }

  const todayIso = isoTodayLocal();
  const roomStats = useMemo(
    () => ({
      available: rooms.filter((room) => room.status === "Disponible").length,
      occupied: rooms.filter((room) => room.status === "Ocupada").length,
      cleaning: rooms.filter((room) => room.status === "Limpieza").length,
    }),
    [rooms]
  );

  const visibleReservationCount = useMemo(() => {
    if (!days.length) return 0;
    const firstVisibleDay = days[0].iso;
    const lastVisibleDay = days[days.length - 1].iso;

    return reservations.filter(
      (reservation) =>
        reservation.checkIn <= lastVisibleDay &&
        reservation.checkOut > firstVisibleDay
    ).length;
  }, [days, reservations]);

  const periodLabel = useMemo(() => {
    if (viewMode === VIEW_MONTH) {
      return capitalize(
        monthDate.toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        })
      );
    }

    if (!days.length) return "";

    const firstDay = new Date(`${days[0].iso}T00:00:00`);
    const lastDay = new Date(`${days[days.length - 1].iso}T00:00:00`);

    return `${capitalize(
      firstDay.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      })
    )} - ${capitalize(
      lastDay.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    )}`;
  }, [days, monthDate, viewMode]);

  if (loading) return <PageLoader />;
  if (loadError) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-300">
        <p className="font-medium">Error al cargar</p>
        <p className="mt-1 text-sm">{loadError}</p>
      </div>
    );
  }

  function navPrev() {
    if (viewMode === VIEW_MONTH) {
      const d = new Date(monthDate);
      d.setMonth(d.getMonth() - 1);
      setMonthDate(d);
    } else {
      const d = new Date(startDate);
      d.setDate(d.getDate() - DAYS_TO_SHOW);
      setStartDate(d);
    }
  }
  function navNext() {
    if (viewMode === VIEW_MONTH) {
      const d = new Date(monthDate);
      d.setMonth(d.getMonth() + 1);
      setMonthDate(d);
    } else {
      const d = new Date(startDate);
      d.setDate(d.getDate() + DAYS_TO_SHOW);
      setStartDate(d);
    }
  }
  function goToday() {
    const d = new Date();
    setStartDate(d);
    setMonthDate(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Calendario de habitaciones</h2>
          <p className="text-sm text-slate-400">
            {viewMode === VIEW_MONTH ? "Vista mensual" : "Vista semanal"} de ocupación por habitación
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex rounded-2xl border border-slate-700/80 bg-slate-900/55 p-1 shadow-lg shadow-slate-950/20">
            <button
              onClick={() => setViewMode(VIEW_WEEK)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                viewMode === VIEW_WEEK
                  ? "bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-cyan-500/15 text-white shadow-md shadow-violet-950/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode(VIEW_MONTH)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                viewMode === VIEW_MONTH
                  ? "bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-cyan-500/15 text-white shadow-md shadow-violet-950/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mes
            </button>
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/45 p-4 shadow-lg shadow-slate-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reservas visibles</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{visibleReservationCount}</p>
          <p className="mt-1 text-sm text-slate-400">Dentro del rango mostrado</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">Disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-100">{roomStats.available}</p>
          <p className="mt-1 text-sm text-emerald-200/70">Habitaciones listas para reservar</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 shadow-lg shadow-rose-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-rose-300/70">Ocupadas</p>
          <p className="mt-2 text-2xl font-semibold text-rose-100">{roomStats.occupied}</p>
          <p className="mt-1 text-sm text-rose-200/70">Con huésped alojado</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-lg shadow-amber-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300/70">Limpieza</p>
          <p className="mt-2 text-2xl font-semibold text-amber-100">{roomStats.cleaning}</p>
          <p className="mt-1 text-sm text-amber-200/70">Pendientes de preparación</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={navPrev}
          className="action-btn action-btn-neutral"
        >
          {viewMode === VIEW_MONTH ? "← Mes anterior" : "← Semana anterior"}
        </button>
        <button
          onClick={goToday}
          className="action-btn action-btn-info"
        >
          Hoy
        </button>
        <button
          onClick={navNext}
          className="action-btn action-btn-neutral"
        >
          {viewMode === VIEW_MONTH ? "Mes siguiente →" : "Semana siguiente →"}
        </button>
        <span className="rounded-2xl border border-slate-700/80 bg-slate-900/45 px-3 py-2 text-sm text-slate-200 shadow-lg shadow-slate-950/10 backdrop-blur-sm">
          {periodLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/35 p-3 shadow-lg shadow-slate-950/10 backdrop-blur-sm">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Leyenda</span>
        <StatusBadge status="Confirmed" variant="reservation" />
        <StatusBadge status="CheckedIn" variant="reservation" />
        <StatusBadge status="CheckedOut" variant="reservation" />
        <StatusBadge status="Cancelled" variant="reservation" />
        <StatusBadge status="Disponible" variant="room" />
      </div>

      <div className="app-scrollbar overflow-auto rounded-2xl border border-slate-700 bg-slate-800/80">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="border-b border-slate-700 bg-slate-800">
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-slate-800 px-3 py-3 text-left font-medium text-slate-300">
                Habitación
              </th>
              {days.map((d) => (
                <th
                  key={d.iso}
                  className={`sticky top-0 z-20 px-3 py-3 text-left font-medium ${
                    d.iso === todayIso
                      ? "bg-blue-600/30 text-blue-200"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-slate-700/80">
                <td
                  className="sticky left-0 z-10 cursor-pointer bg-slate-800/95 px-3 py-3 hover:bg-slate-700/50"
                  onClick={() => setQuickViewRoom(room)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setQuickViewRoom(room);
                    }
                  }}
                >
                  <div className="flex min-w-[180px] flex-col gap-2">
                    <div>
                      <p className="font-medium text-slate-100 transition-colors hover:text-blue-300">
                        {room.number} · {room.type}
                      </p>
                      <p className="text-xs text-slate-500">Abrir vista rápida</p>
                    </div>
                    <StatusBadge status={room.status} variant="room" />
                  </div>
                </td>
                {days.map((d) => {
                  const res = reservationFor(room.id, d.iso);
                  return (
                    <td
                      key={d.iso}
                      className={`min-w-[170px] px-2 py-2 align-top ${
                        d.iso === todayIso ? "bg-blue-500/5" : ""
                      }`}
                    >
                      {res ? (
                        <button
                          type="button"
                          onClick={() => handleViewReservation(res)}
                          className="group block w-full rounded-xl border border-slate-600/80 bg-slate-700/45 p-2 text-left shadow-md shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-slate-700/70"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="line-clamp-2 text-[11px] font-medium text-slate-200 group-hover:text-white">
                              {guestById.get(res.guestId)?.fullName ?? res.guestId}
                            </span>
                            <StatusBadge
                              status={res.status}
                              variant="reservation"
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDateShort(res.checkIn)} →{" "}
                            {formatDateShort(res.checkOut)}
                          </p>
                        </button>
                      ) : (
                        <div className="min-h-[58px] rounded-xl border border-dashed border-slate-700/60 bg-slate-900/10" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RoomQuickView
        open={Boolean(quickViewRoom)}
        room={quickViewRoom}
        reservations={reservations}
        guests={guests}
        onClose={() => setQuickViewRoom(null)}
        onUpdateRoom={handleUpdateRoom}
        onUpdateReservation={handleUpdateReservation}
        onViewReservation={handleViewReservation}
      />
    </div>
  );
}

