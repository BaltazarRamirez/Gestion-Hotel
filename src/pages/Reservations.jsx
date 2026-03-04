import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createReservation,
  getReservations,
  updateReservation,
} from "../services/reservations.service";
import { getGuests } from "../services/guests.service";
import { getRooms, updateRoom } from "../services/rooms.service";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateShort, shortReservationId } from "../utils/formatDate";
import { PageLoader } from "../components/Spinner";
import { RESERVATION_STATUS_CONFIG } from "../constants/statuses";
import { isoTodayLocal } from "../utils/date";

export default function Reservations() {
  const location = useLocation();
  const today = isoTodayLocal();
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const initialOpenId = location.state?.openReservationId ?? null;
  const [selectedId, setSelectedId] = useState(initialOpenId);
  const [formError, setFormError] = useState("");
  const [checkInAskReservation, setCheckInAskReservation] = useState(null);
  const [checkInError, setCheckInError] = useState("");
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [form, setForm] = useState({
    guestId: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    status: "Confirmed",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getReservations(), getGuests(), getRooms()])
      .then(([res, g, rms]) => {
        setReservations(res);
        setGuests(g);
        setRooms(rms);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!location.state?.openReservationId) return;
    if (typeof window.history.replaceState !== "function") return;
    window.history.replaceState({}, "", location.pathname);
  }, [location.pathname, location.state?.openReservationId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return reservations.find((r) => String(r.id) === String(selectedId)) ?? null;
  }, [reservations, selectedId]);

  const guestById = useMemo(() => {
    const map = new Map();
    guests.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  const roomById = useMemo(() => {
    const map = new Map();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      const guestName = guestById.get(r.guestId)?.fullName?.toLowerCase() ?? "";
      const roomNumber = roomById.get(r.roomId)?.number?.toLowerCase() ?? "";
      const resId = (r.id || "").toLowerCase();
      const shortId = shortReservationId(r.id).toLowerCase();
      const matchesQuery =
        !q ||
        guestName.includes(q) ||
        roomNumber.includes(q) ||
        resId.includes(q) ||
        shortId.includes(q);
      const matchesStatus =
        statusFilter === "All" || r.status === statusFilter;
      const matchesFrom = !dateFrom || r.checkIn >= dateFrom;
      const matchesTo = !dateTo || r.checkIn <= dateTo;
      let matchesQuick = true;
      if (quickFilter === "arrivals") {
        matchesQuick = r.checkIn === today && r.status !== "Cancelled";
      } else if (quickFilter === "departures") {
        matchesQuick =
          r.checkOut === today &&
          (r.status === "CheckedIn" || r.status === "CheckedOut");
      }
      return (
        matchesQuery &&
        matchesStatus &&
        matchesFrom &&
        matchesTo &&
        matchesQuick
      );
    });
  }, [
    reservations,
    query,
    statusFilter,
    guestById,
    roomById,
    dateFrom,
    dateTo,
    quickFilter,
    today,
  ]);

  const todayStats = useMemo(() => {
    const arrivals = reservations.filter(
      (r) => r.checkIn === today && r.status !== "Cancelled"
    ).length;
    const departures = reservations.filter(
      (r) =>
        r.checkOut === today &&
        (r.status === "CheckedIn" || r.status === "CheckedOut")
    ).length;
    return { arrivals, departures };
  }, [reservations, today]);

  function openDetail(r) {
    setSelectedId(r.id);
    setIsDetailOpen(true);
  }

  function openDuplicate(r) {
    const nights =
      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
      (1000 * 60 * 60 * 24);
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const startIso = start.toISOString().slice(0, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + (nights > 0 ? Math.round(nights) : 1));
    const endIso = end.toISOString().slice(0, 10);
    setForm({
      guestId: r.guestId,
      roomId: String(r.roomId),
      checkIn: startIso,
      checkOut: endIso,
      status: "Confirmed",
    });
    setFormError("");
    setIsDetailOpen(false);
    setSelectedId(null);
    setIsCreateOpen(true);
  }

  function exportCSV() {
    const headers = ["Nº", "Huésped", "Habitación", "Check-in", "Check-out", "Estado"];
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map((r) => [
      shortReservationId(r.id),
      guestById.get(r.guestId)?.fullName ?? "",
      roomById.get(r.roomId)?.number ?? "",
      r.checkIn,
      r.checkOut,
      RESERVATION_STATUS_CONFIG[r.status]?.label ?? r.status,
    ]);
    const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reservas-${today}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handlePrint() {
    window.print();
  }


  async function handleCreateReservation(e) {
    e.preventDefault();
    setFormError("");

    if (!form.guestId) return setFormError("Seleccioná un huésped");
    if (!form.roomId) return setFormError("Falta la habitación");
    if (!form.checkIn) return setFormError("Falta la fecha de check-in");
    if (!form.checkOut) return setFormError("Falta la fecha de check-out");
    if (form.checkOut < form.checkIn)
      return setFormError("El check-out no puede ser antes del check-in");

    const roomId = String(form.roomId);

    const hasOverlap = reservations.some((r) => {
      if (String(r.roomId) !== roomId) return false;
      if (r.status === "Cancelled" || r.status === "CheckedOut") return false;

      const existingStart = r.checkIn;
      const existingEnd = r.checkOut;

      return !(
        existingEnd <= form.checkIn || existingStart >= form.checkOut
      );
    });

    if (hasOverlap) {
      return setFormError(
        "La habitación ya está reservada en ese rango de fechas"
      );
    }

    const payload = {
      ...form,
      roomId,
      hotelId: "hotel-1",
    };

    const created = await createReservation(payload);

    if (created.status === "CheckedIn") {
      await updateRoom(created.roomId, { status: "Ocupada" });
    }
    setReservations((prev) => [created, ...prev]);

    setForm({
      guestId: "",
      roomId: "",
      checkIn: "",
      checkOut: "",
      status: "Confirmed",
    });
    setIsCreateOpen(false);
  }

  async function handleUpdateStatus(id, newStatus, extraPatch = {}) {
    const current = reservations.find((r) => String(r.id) === String(id));
    if (!current) return;

    const patch = { ...extraPatch, status: newStatus };
    const idStr = String(id);
    setReservations((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, ...patch } : r))
    );

    const updated = await updateReservation(id, patch);
    if (updated) {
      setReservations((prev) =>
        prev.map((r) => (String(r.id) === idStr ? { ...r, ...updated } : r))
      );
    }

    if (newStatus === "CheckedIn") {
      await updateRoom(current.roomId, { status: "Ocupada" });
    } else if (newStatus === "CheckedOut") {
      await updateRoom(current.roomId, { status: "Limpieza" });
    } else if (newStatus === "Cancelled") {
      await updateRoom(current.roomId, { status: "Disponible" });
    }
  }

  function openCheckInAsk(reservation) {
    setCheckInError("");
    setCheckInAskReservation(reservation);
  }

  async function confirmCheckIn(paidAtCheckIn) {
    if (!checkInAskReservation) return;
    const id = checkInAskReservation.id;
    setCheckInError("");
    try {
      await handleUpdateStatus(id, "CheckedIn", { paidAtCheckIn });
      setCheckInAskReservation(null);
    } catch (err) {
      console.error("Error al hacer check-in:", err);
      setCheckInError(err?.message ?? "No se pudo actualizar la reserva. Intentá de nuevo.");
    }
  }

  async function handleAddCharge(e) {
    e.preventDefault();
    if (!selected) return;

    const formData = new FormData(e.currentTarget);
    const concept = String(formData.get("concept") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const amount = Number(amountRaw);

    if (!concept) return;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const nextCharge = {
      id: crypto.randomUUID(),
      concept,
      amount,
      date: new Date().toISOString().slice(0, 10),
    };

    const nextSelected = {
      ...selected,
      charges: [...(selected.charges ?? []), nextCharge],
    };

    setReservations((prev) =>
      prev.map((r) => (r.id === selected.id ? nextSelected : r))
    );

    await updateReservation(selected.id, { charges: nextSelected.charges });
    e.currentTarget.reset();
  }

  async function handleRemoveCharge(chargeId) {
    if (!selected) return;
    const nextCharges = (selected.charges ?? []).filter((c) => c.id !== chargeId);
    const nextSelected = { ...selected, charges: nextCharges };

    setReservations((prev) =>
      prev.map((r) => (r.id === selected.id ? nextSelected : r))
    );

    await updateReservation(selected.id, { charges: nextCharges });
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Reservas</h2>
          <p className="text-sm text-slate-400">Gestiona reservas, estados y fechas</p>
          <p className="mt-1 text-xs text-slate-500">{filtered.length} reserva(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            Exportar CSV
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            Imprimir
          </button>
          <button
            onClick={() => {
              setFormError("");
              setIsCreateOpen(true);
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            + Nueva reserva
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500">Resumen de hoy:</span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5">
          <span className="text-slate-400">Llegadas</span>
          <span className="font-semibold text-blue-400">{todayStats.arrivals}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5">
          <span className="text-slate-400">Salidas</span>
          <span className="font-semibold text-amber-400">{todayStats.departures}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setQuickFilter("all")}
          className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
            quickFilter === "all"
              ? "bg-blue-600 text-white"
              : "border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickFilter("arrivals");
            setDateFrom(today);
            setDateTo(today);
          }}
          className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
            quickFilter === "arrivals"
              ? "bg-blue-600 text-white"
              : "border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Llegadas hoy
        </button>
        <button
          type="button"
          onClick={() => {
            setQuickFilter("departures");
            setDateFrom(today);
            setDateTo(today);
          }}
          className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
            quickFilter === "departures"
              ? "bg-blue-600 text-white"
              : "border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Salidas hoy
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por huésped, habitación o nº reserva..."
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="All">Todos los estados</option>
            <option value="Confirmed">Confirmada</option>
            <option value="CheckedIn">Check-in</option>
            <option value="CheckedOut">Check-out</option>
            <option value="Cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_220px]">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-16">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-16">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              setDateFrom(today);
              setDateTo(today);
            }}
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
          >
            Hoy
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-700 bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Nº</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Huésped</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Habitación</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Check-in</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Check-out</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Importe estimado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-700/80 last:border-0 hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  #{shortReservationId(r.id)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-100">
                  {guestById.get(r.guestId)?.fullName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {roomById.get(r.roomId)?.number ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">{formatDateShort(r.checkIn)}</td>
                <td className="px-4 py-3 text-slate-300">{formatDateShort(r.checkOut)}</td>
                <td className="px-4 py-3 text-slate-300">
                  {(() => {
                    const room = roomById.get(r.roomId);
                    if (!room) return "—";
                    const price = Number(room.price) || 0;
                    const nights =
                      (new Date(r.checkOut).getTime() -
                        new Date(r.checkIn).getTime()) /
                      (1000 * 60 * 60 * 24);
                    const total = nights > 0 ? nights * price : price;
                    return new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: room.currency || "ARS",
                      maximumFractionDigits: 0,
                    }).format(total);
                  })()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={r.status} variant="reservation" />
                    {r.status === "CheckedIn" && (
                      <span
                        className={
                          r.paidAtCheckIn
                            ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                            : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300"
                        }
                      >
                        {r.paidAtCheckIn ? "Pago" : "Pendiente de pago"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap space-x-2 px-4 py-3">
                  <button
                    onClick={() => openDetail(r)}
                    className="rounded-lg bg-blue-600/80 px-2 py-1 text-xs text-white hover:bg-blue-500"
                  >
                    Detalle
                  </button>
                  <button
                    onClick={() => openDuplicate(r)}
                    className="rounded-lg bg-slate-500/80 px-2 py-1 text-xs text-white hover:bg-slate-400"
                  >
                    Duplicar
                  </button>
                  {r.status === "Confirmed" && (
                    <>
                      <button
                        onClick={() => openCheckInAsk(r)}
                        className="rounded-lg bg-emerald-600/80 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                      >
                        Check-in
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(r.id, "Cancelled")}
                        className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {r.status === "CheckedIn" && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, "CheckedOut")}
                      className="rounded-lg bg-slate-500/80 px-2 py-1 text-xs text-white hover:bg-slate-400"
                    >
                      Check-out
                    </button>
                  )}

                </td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay reservas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={isCreateOpen}
        title="Nueva reserva"
        onClose={() => setIsCreateOpen(false)}
      >
  {formError ? (
    <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {formError}
    </div>
  ) : null}
  <form className="space-y-3" onSubmit={handleCreateReservation}>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs text-slate-400">Huésped</span>
        <select
          value={form.guestId}
          onChange={(e) => setForm((p) => ({ ...p, guestId: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">Seleccionar huésped...</option>
          {guests.map((g) => (
            <option key={g.id} value={g.id}>
              {g.fullName}
            </option>
          ))}
        </select>
      </label>


      <label className="space-y-1">
        <span className="text-xs text-slate-400">Habitación</span>
        <select
          value={form.roomId}
          onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">Seleccionar habitación...</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number} — {r.type}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs text-slate-400">Check-in</span>
        <input
          type="date"
          value={form.checkIn}
          onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-slate-400">Check-out</span>
        <input
          type="date"
          value={form.checkOut}
          onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </label>
    </div>
    <label className="space-y-1">
      <span className="text-xs text-slate-400">Estado</span>
      <select
        value={form.status}
        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="Confirmed">Confirmada</option>
        <option value="CheckedIn">Check-in</option>
        <option value="CheckedOut">Check-out</option>
        <option value="Cancelled">Cancelada</option>
      </select>
    </label>

    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={() => setIsCreateOpen(false)}
        className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Crear
      </button>
    </div>
  </form>
</Modal>

      <Modal
        open={!!checkInAskReservation}
        title="Check-in"
        onClose={() => {
          setCheckInAskReservation(null);
          setCheckInError("");
        }}
      >
        {checkInAskReservation && (
          <div className="space-y-4">
            {checkInError && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {checkInError}
              </div>
            )}
            <p className="text-slate-200">
              ¿El huésped ya pagó? Esto definirá si se suma a ingresos y si se muestra como &quot;Pago&quot; o &quot;Pendiente de pago&quot;.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckInAskReservation(null)}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmCheckIn(false)}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                No, pendiente de pago
              </button>
              <button
                type="button"
                onClick={() => confirmCheckIn(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Sí, está pago
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isDetailOpen}
        title="Detalle de reserva"
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedId(null);
        }}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDuplicate(selected)}
                className="rounded-xl border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600"
              >
                Duplicar reserva
              </button>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Huésped</p>
                  <p className="font-medium text-slate-100">
                    {guestById.get(selected.guestId)?.fullName ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={selected.status} variant="reservation" />
                  {selected.status === "CheckedIn" && (
                    <span
                      className={
                        selected.paidAtCheckIn
                          ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                          : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300"
                      }
                    >
                      {selected.paidAtCheckIn ? "Pago" : "Pendiente de pago"}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Habitación</p>
                  <p className="font-medium text-slate-100">
                    {roomById.get(selected.roomId)?.number ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fechas</p>
                  <p className="font-medium text-slate-100">
                    {formatDateShort(selected.checkIn)} → {formatDateShort(selected.checkOut)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Cargos</h4>
                <p className="text-sm text-slate-300">
                  Total:{" "}
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: roomById.get(selected.roomId)?.currency || "ARS",
                    maximumFractionDigits: 0,
                  }).format(
                    (selected.charges ?? []).reduce(
                      (acc, c) => acc + (Number(c.amount) || 0),
                      0
                    )
                  )}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {(selected.charges ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Todavía no hay cargos.</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.charges ?? []).map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-600 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">{c.concept}</p>
                          <p className="text-xs text-slate-500">{c.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-100">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency:
                                roomById.get(selected.roomId)?.currency || "ARS",
                              maximumFractionDigits: 0,
                            }).format(c.amount)}
                          </p>
                          <button
                            onClick={() => handleRemoveCharge(c.id)}
                            className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <form
                onSubmit={handleAddCharge}
                className="mt-3 grid gap-2 md:grid-cols-[1fr_160px_120px]"
              >
                <input
                  name="concept"
                  placeholder="Concepto (ej: minibar)"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <input
                  name="amount"
                  placeholder="Importe"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Agregar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sin reserva seleccionada.</p>
        )}
      </Modal>

    </div>
  );
}
