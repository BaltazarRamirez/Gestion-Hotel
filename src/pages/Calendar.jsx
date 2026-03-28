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

  const periodLabel =
    viewMode === VIEW_MONTH
      ? monthDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Calendario de habitaciones</h2>
          <p className="text-sm text-slate-400">
            {viewMode === VIEW_MONTH ? "Vista mensual" : "Vista semanal"} de ocupación por habitación
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex rounded-xl border border-slate-600 bg-slate-800/80 p-1">
            <button
              onClick={() => setViewMode(VIEW_WEEK)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                viewMode === VIEW_WEEK ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode(VIEW_MONTH)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                viewMode === VIEW_MONTH ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mes
            </button>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={navPrev}
          className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          {viewMode === VIEW_MONTH ? "← Mes anterior" : "← Semana anterior"}
        </button>
        <button
          onClick={goToday}
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
        >
          Hoy
        </button>
        <button
          onClick={navNext}
          className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          {viewMode === VIEW_MONTH ? "Mes siguiente →" : "Semana siguiente →"}
        </button>
        {viewMode === VIEW_MONTH && periodLabel && (
          <span className="rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm capitalize text-slate-300">
            {periodLabel}
          </span>
        )}
      </div>
      <div className="overflow-auto rounded-2xl border border-slate-700 bg-slate-800/80">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="border-b border-slate-700 bg-slate-800">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-800 px-3 py-2 text-left font-medium text-slate-300">
                Habitación
              </th>
              {days.map((d) => (
                <th
                  key={d.iso}
                  className={`px-3 py-2 text-left font-medium ${
                    d.iso === todayIso
                      ? "bg-blue-600/30 text-blue-200"
                      : "text-slate-300"
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
                  className="sticky left-0 z-10 cursor-pointer bg-slate-800/90 px-3 py-2 font-medium text-slate-100 hover:bg-slate-700/50 hover:text-blue-300"
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
                  {room.number} · {room.type}
                </td>
                {days.map((d) => {
                  const res = reservationFor(room.id, d.iso);
                  return (
                    <td
                      key={d.iso}
                      className={`px-3 py-2 align-top ${
                        d.iso === todayIso ? "bg-blue-500/5" : ""
                      }`}
                    >
                      {res ? (
                        <div className="space-y-1 rounded-xl border border-slate-600 bg-slate-700/50 p-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-200">
                              {guestById.get(res.guestId)?.fullName ?? res.guestId}
                            </span>
                            <StatusBadge
                              status={res.status}
                              variant="reservation"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {formatDateShort(res.checkIn)} →{" "}
                            {formatDateShort(res.checkOut)}
                          </p>
                        </div>
                      ) : null}
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

