import { useEffect, useMemo, useState } from "react";
import { createReservation, getReservations } from "../services/reservations.service";
import { getGuests } from "../services/guests.service";


const STATUS_LABEL = {
  Confirmed: "Confirmada",
  CheckedIn: "Check-in",
  CheckedOut: "Check-out",
  Cancelled: "Cancelada",
};

function StatusBadge({ status }) {
  const styles = {
    Confirmed: "bg-blue-100 text-blue-700",
    CheckedIn: "bg-green-100 text-green-700",
    CheckedOut: "bg-gray-200 text-gray-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [guests, setGuests] = useState([]);


  const [form, setForm] = useState({
  guestId: "",
  roomNumber: "",
  checkIn: "",
  checkOut: "",
  status: "Confirmed",
});



  useEffect(() => {
    getReservations().then(setReservations);
    getGuests().then(setGuests);
  }, []);

  const guestById = useMemo(() => {
  const map = new Map();
  guests.forEach((g) => map.set(g.id, g));
  return map;
}, [guests]);

  const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();

  return reservations.filter((r) => {
    // obtenemos el nombre del huésped desde el guestId
    const guestName =
      guestById.get(r.guestId)?.fullName?.toLowerCase() ?? "";

    const matchesQuery =
      !q ||
      guestName.includes(q) ||
      r.roomNumber.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "All" || r.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
}, [reservations, query, statusFilter, guestById]);


  async function handleCreateReservation(e) {
  e.preventDefault();
  setFormError("");

  if (!form.guestId) return setFormError("Seleccioná un huésped");
  if (!form.roomNumber.trim()) return setFormError("Falta el número de habitación");
  if (!form.checkIn) return setFormError("Falta la fecha de check-in");
  if (!form.checkOut) return setFormError("Falta la fecha de check-out");
  if (form.checkOut < form.checkIn)
    return setFormError("El check-out no puede ser antes del check-in");

  const created = await createReservation(form);
  setReservations((prev) => [created, ...prev]);

  setForm({
    guestName: "",
    roomNumber: "",
    checkIn: "",
    checkOut: "",
    status: "Confirmed",
  });
  setIsCreateOpen(false);
}

function handleUpdateStatus(id, newStatus) {
  setReservations((prev) =>
    prev.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    )
  );
}


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reservas</h2>
          <p className="text-sm text-gray-500">Gestiona reservas, estados y fechas</p>
          <p className="mt-1 text-xs text-gray-400">{filtered.length} reserva(s)</p>
        </div>

        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          + Nueva reserva
        </button>

      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border bg-white p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por huésped o habitación..."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="rounded-2xl border bg-white p-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="All">Todos los estados</option>
            <option value="Confirmed">Confirmada</option>
            <option value="CheckedIn">Check-in</option>
            <option value="CheckedOut">Check-out</option>
            <option value="Cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Huésped</th>
              <th className="px-4 py-3 text-left font-medium">Habitación</th>
              <th className="px-4 py-3 text-left font-medium">Check-in</th>
              <th className="px-4 py-3 text-left font-medium">Check-out</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>

            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50/70">
                <td className="px-4 py-3 font-medium">
                  {guestById.get(r.guestId)?.fullName ?? "—"}
                </td>
                <td className="px-4 py-3">{r.roomNumber}</td>
                <td className="px-4 py-3">{r.checkIn}</td>
                <td className="px-4 py-3">{r.checkOut}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap space-x-2">

                  {r.status === "Confirmed" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(r.id, "CheckedIn")}
                        className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                      >
                        Check-in
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(r.id, "Cancelled")}
                        className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {r.status === "CheckedIn" && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, "CheckedOut")}
                      className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                    >
                      Check-out
                    </button>
                  )}

                </td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
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
    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {formError}
    </div>
  ) : null}

  <form className="space-y-3" onSubmit={handleCreateReservation}>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs text-gray-600">Huésped</span>
        <select
          value={form.guestId}
          onChange={(e) => setForm((p) => ({ ...p, guestId: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm"
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
        <span className="text-xs text-gray-600">Habitación</span>
        <input
          value={form.roomNumber}
          onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Ej: 101"
        />
      </label>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs text-gray-600">Check-in</span>
        <input
          type="date"
          value={form.checkIn}
          onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs text-gray-600">Check-out</span>
        <input
          type="date"
          value={form.checkOut}
          onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
    </div>

    <label className="space-y-1">
      <span className="text-xs text-gray-600">Estado</span>
      <select
        value={form.status}
        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        className="w-full rounded-xl border px-3 py-2 text-sm"
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
        className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
      >
        Cancelar
      </button>

      <button
        type="submit"
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
      >
        Crear
      </button>
    </div>
  </form>
</Modal>

    </div>
  );
}
