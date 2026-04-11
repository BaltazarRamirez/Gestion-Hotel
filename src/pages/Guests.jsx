import { useEffect, useMemo, useState } from "react";
import {
  createGuest,
  deleteGuest,
  getGuests,
  updateGuest,
} from "../services/guests.service";
import { getReservations } from "../services/reservations.service";
import { getActiveReservationsForGuest } from "../constants/statuses";
import { Modal } from "../components/Modal";
import { ConfirmModal } from "../components/ConfirmModal";
import { Toast } from "../components/Toast";
import { PageLoader } from "../components/Spinner";
import { useAuth } from "../contexts/AuthContext";

export default function Guests() {
  const { isSupabaseEnabled, session, profileLoaded } = useAuth();
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const canFetch = !isSupabaseEnabled || (Boolean(session) && profileLoaded);

  useEffect(() => {
    if (!canFetch) return;
    setLoadError(null);
    Promise.all([getGuests(), getReservations()])
      .then(([g, r]) => {
        setGuests(g);
        setReservations(r);
      })
      .catch((err) => setLoadError(err?.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }, [canFetch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (!q) return true;
      return (
        g.fullName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q)
      );
    });
  }, [guests, query]);

  function openCreate() {
    setError("");
    setEditing(null);
    setForm({ fullName: "", email: "", phone: "" });
    setOpen(true);
  }

  function openEdit(g) {
    setError("");
    setEditing(g);
    setForm({ fullName: g.fullName, email: g.email, phone: g.phone });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) return setError("Falta el nombre completo");
    if (!form.email.trim()) return setError("Falta el email");

    const email = form.email.trim().toLowerCase();
    const exists = guests.some((g) => {
      if (editing && g.id === editing.id) return false;
      return g.email.trim().toLowerCase() === email;
    });
    if (exists) return setError("Ya existe un huésped con ese email");

    try {
      if (editing) {
        const updated = await updateGuest(editing.id, form);
        setGuests((prev) => prev.map((g) => (g.id === editing.id ? updated : g)));
        setToast({ message: "Huésped actualizado", type: "success" });
      } else {
        const created = await createGuest(form);
        setGuests((prev) => [created, ...prev]);
        setToast({ message: "Huésped creado", type: "success" });
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err?.message ?? "Error al guardar");
      setToast({ message: err?.message ?? "Error al guardar", type: "error" });
    }
  }

  const blockDeleteGuest =
    deleting &&
    getActiveReservationsForGuest(deleting.id, reservations).length > 0;

  async function confirmDelete() {
    if (!deleting) return;
    const active = getActiveReservationsForGuest(deleting.id, reservations);
    if (active.length > 0) {
      setDeleting(null);
      return;
    }
    try {
      await deleteGuest(deleting.id);
      setGuests((prev) => prev.filter((g) => g.id !== deleting.id));
      setDeleting(null);
      setToast({ message: "Huésped eliminado", type: "success" });
    } catch (err) {
      setToast({ message: err?.message ?? "Error al eliminar", type: "error" });
      setDeleting(null);
    }
  }

  if (loading) return <PageLoader />;
  if (loadError) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-300">
        <p className="font-medium">Error al cargar</p>
        <p className="mt-1 text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Huéspedes</h2>
          <p className="text-sm text-slate-400">Gestiona la información de huéspedes</p>
          <p className="mt-1 text-xs text-slate-500">{filtered.length} huésped(es)</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-cyan-500/15 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-900/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/40 hover:from-violet-500/38 hover:via-blue-500/24 hover:to-cyan-500/18 hover:shadow-violet-900/25"
        >
          + Nuevo huésped
        </button>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>
      <div className="app-scrollbar overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="border-b border-slate-700 bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b border-slate-700/80 last:border-0 hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-slate-100">{g.fullName}</td>
                <td className="px-4 py-3 text-slate-300">{g.email}</td>
                <td className="px-4 py-3 text-slate-300">{g.phone}</td>
                <td className="whitespace-nowrap space-x-2 px-4 py-3">
                  <button
                    onClick={() => openEdit(g)}
                    className="action-btn action-btn-info action-btn-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(g)}
                    className="action-btn action-btn-danger action-btn-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay huéspedes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={open}
        title={editing ? `Editar huésped` : "Nuevo huésped"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      >
        {error ? (
          <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Nombre completo</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Ej: Juan Pérez"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Email</span>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="juan@mail.com"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Teléfono</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="+54 381 ..."
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="action-btn action-btn-neutral"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="action-btn action-btn-info"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Eliminar huésped"
        description={
          deleting
            ? blockDeleteGuest
              ? `${deleting.fullName} tiene reservas activas. Cancelá las reservas antes de eliminarlo.`
              : `¿Seguro que querés eliminar a ${deleting.fullName}?`
            : ""
        }
        confirmLabel={blockDeleteGuest ? "Cerrar" : "Eliminar"}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
