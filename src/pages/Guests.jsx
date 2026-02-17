import { useEffect, useMemo, useState } from "react";
import { createGuest, deleteGuest, getGuests, updateGuest } from "../services/guests.service";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, description, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });

  useEffect(() => {
    getGuests().then(setGuests);
  }, []);

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

    // Validación simple: email único
    const email = form.email.trim().toLowerCase();
    const exists = guests.some((g) => {
      if (editing && g.id === editing.id) return false;
      return g.email.trim().toLowerCase() === email;
    });
    if (exists) return setError("Ya existe un huésped con ese email");

    if (editing) {
      const updated = await updateGuest(editing.id, form);
      setGuests((prev) => prev.map((g) => (g.id === editing.id ? updated : g)));
    } else {
      const created = await createGuest(form);
      setGuests((prev) => [created, ...prev]);
    }

    setOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteGuest(deleting.id);
    setGuests((prev) => prev.filter((g) => g.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Huéspedes</h2>
          <p className="text-sm text-gray-500">Gestiona la información de huéspedes</p>
          <p className="mt-1 text-xs text-gray-400">{filtered.length} huésped(es)</p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          + Nuevo huésped
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border bg-white p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50/70">
                <td className="px-4 py-3 font-medium">{g.fullName}</td>
                <td className="px-4 py-3">{g.email}</td>
                <td className="px-4 py-3">{g.phone}</td>
                <td className="px-4 py-3 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => openEdit(g)}
                    className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleting(g)}
                    className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
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
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="text-xs text-gray-600">Nombre completo</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Ej: Juan Pérez"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-gray-600">Email</span>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="juan@mail.com"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-gray-600">Teléfono</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2 text-sm"
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
              className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
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
          deleting ? `¿Seguro que querés eliminar a ${deleting.fullName}?` : ""
        }
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
