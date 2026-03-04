import { useEffect, useMemo, useState } from "react";

import { ConfirmModal } from "../components/ConfirmModal";
import { Modal } from "../components/Modal";
import { PageLoader } from "../components/Spinner";
import { RoomQuickView } from "../components/RoomQuickView";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import {
  getActiveReservationsForRoom,
  ROOM_STATUS,
  ROOM_STATUS_VALUES,
} from "../constants/statuses";
import { getGuests } from "../services/guests.service";
import { getReservations, updateReservation } from "../services/reservations.service";
import { createRoom, deleteRoom, getRooms, updateRoom } from "../services/rooms.service";

function CreateRoomModal({
  open,
  title,
  initialValues,
  roomStatusValues,
  error,
  onCancel,
  onSubmit,
}) {
  const defaultForm = {
    number: "",
    type: "Simple",
    status: roomStatusValues?.[0] ?? ROOM_STATUS.Disponible,
    price: "",
  };

  const [form, setForm] = useState(initialValues ?? defaultForm);

  useEffect(() => {
    if (open) setForm(initialValues ?? defaultForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      {error ? (
        <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.number.trim() || !String(form.price).trim()) return;
          onSubmit({
            ...form,
            number: form.number.trim(),
            price: Number(form.price),
          });
        }}
      >
        <input
          placeholder="Número (ej: 201)"
          value={form.number}
          onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />

        <input
          placeholder="Precio"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />

        <select
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option>Simple</option>
          <option>Doble</option>
          <option>Triple</option>
          <option>Cuádruple</option>
          <option>Suite</option>
        </select>

        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {(roomStatusValues ?? ROOM_STATUS_VALUES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState("");

  const [deletingRoom, setDeletingRoom] = useState(null);
  const [quickViewRoom, setQuickViewRoom] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([getRooms(), getReservations(), getGuests()])
      .then(([rms, res, g]) => {
        setRooms(rms);
        setReservations(res);
        setGuests(g);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesQuery =
        !q ||
        String(room.number).toLowerCase().includes(q) ||
        String(room.type).toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || room.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rooms, query, statusFilter]);

  const blockDeleteRoom =
    deletingRoom &&
    getActiveReservationsForRoom(deletingRoom.id, reservations).length > 0;

  async function confirmDelete() {
    if (!deletingRoom) return;

    const active = getActiveReservationsForRoom(deletingRoom.id, reservations);
    if (active.length > 0) {
      setToast({
        message: "No se puede eliminar: la habitación tiene reservas activas.",
        type: "error",
      });
      setDeletingRoom(null);
      return;
    }

    try {
      await deleteRoom(deletingRoom.id);
      setRooms((prev) => prev.filter((r) => r.id !== deletingRoom.id));
      setToast({ message: "Habitación eliminada", type: "success" });
    } catch (err) {
      setToast({ message: err?.message ?? "Error al eliminar", type: "error" });
    } finally {
      setDeletingRoom(null);
    }
  }

  async function handleSubmitRoom(values) {
    setFormError("");

    const nextNumber = values.number.trim();
    const exists = rooms.some((r) => {
      if (editingRoom && r.id === editingRoom.id) return false;
      return String(r.number).trim() === nextNumber;
    });
    if (exists) return setFormError(`Ya existe la habitación ${nextNumber}`);

    try {
      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, values);
        setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? updated : r)));
        setToast({ message: `Habitación ${nextNumber} actualizada`, type: "success" });
      } else {
        const created = await createRoom(values);
        setRooms((prev) => [created, ...prev]);
        setToast({ message: `Habitación ${nextNumber} creada`, type: "success" });
      }
      setIsCreateOpen(false);
      setEditingRoom(null);
    } catch (err) {
      setFormError(err?.message ?? "No se pudo guardar");
      setToast({ message: err?.message ?? "No se pudo guardar", type: "error" });
    }
  }

  async function handleQuickViewUpdateRoom(roomId, patch) {
    const updated = await updateRoom(roomId, patch);
    setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));
  }

  async function handleQuickViewUpdateReservation(id, patch) {
    const updated = await updateReservation(id, patch);
    setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Habitaciones</h2>
          <p className="text-sm text-slate-400">
            Gestiona las habitaciones del hotel y su disponibilidad
          </p>
          <p className="mt-1 text-xs text-slate-500">{rooms.length} habitación(es)</p>
        </div>

        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          onClick={() => {
            setFormError("");
            setEditingRoom(null);
            setIsCreateOpen(true);
          }}
        >
          + Nueva habitación
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <input
            placeholder="Buscar por número o tipo..."
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
          <select
            className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Todos los estados</option>
            {ROOM_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80">
        <table className="w-full min-w-[400px] text-sm">
          <thead className="border-b border-slate-700 bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">
                Habitación
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">
                Acciones
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">
                Precio
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredRooms.map((room) => (
              <tr
                key={room.id}
                className="border-b border-slate-700/80 last:border-0 hover:bg-slate-700/30"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setQuickViewRoom(room)}
                    className="font-medium text-slate-100 hover:text-blue-400"
                  >
                    {room.number}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-300">{room.type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={room.status} variant="room" />
                </td>
                <td className="flex items-center gap-1 px-4 py-3">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-600/80 px-2 py-1 text-xs text-white hover:bg-slate-500"
                    onClick={() => setQuickViewRoom(room)}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600/80 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                    onClick={() => {
                      setFormError("");
                      setEditingRoom(room);
                      setIsCreateOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingRoom(room)}
                    className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                  >
                    Eliminar
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-300">${room.price}</td>
              </tr>
            ))}

            {filteredRooms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay habitaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deletingRoom)}
        title="Eliminar habitación"
        description={
          deletingRoom
            ? blockDeleteRoom
              ? `La habitación ${deletingRoom.number} tiene reservas activas. Cancelá o reasigná las reservas antes de eliminarla.`
              : `¿Seguro que querés eliminar la habitación ${deletingRoom.number}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel={blockDeleteRoom ? "Cerrar" : "Eliminar"}
        onCancel={() => setDeletingRoom(null)}
        onConfirm={confirmDelete}
      />

      <CreateRoomModal
        open={isCreateOpen}
        title={editingRoom ? `Editar habitación ${editingRoom.number}` : "Nueva habitación"}
        initialValues={
          editingRoom
            ? {
                number: editingRoom.number,
                type: editingRoom.type,
                status: editingRoom.status,
                price: String(editingRoom.price),
              }
            : { number: "", type: "Simple", status: ROOM_STATUS.Disponible, price: "" }
        }
        roomStatusValues={ROOM_STATUS_VALUES}
        error={formError}
        onCancel={() => {
          setIsCreateOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleSubmitRoom}
      />

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <RoomQuickView
        open={Boolean(quickViewRoom)}
        room={quickViewRoom}
        reservations={reservations}
        guests={guests}
        onClose={() => setQuickViewRoom(null)}
        onUpdateRoom={handleQuickViewUpdateRoom}
        onUpdateReservation={handleQuickViewUpdateReservation}
        onEditRoom={(room) => {
          setQuickViewRoom(null);
          setFormError("");
          setEditingRoom(room);
          setIsCreateOpen(true);
        }}
      />
    </div>
  );
}
