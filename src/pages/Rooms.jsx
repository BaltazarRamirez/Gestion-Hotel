
import { useEffect, useMemo, useState } from "react";
import { getRooms } from "../services/rooms.service";

//Estilos para el badge de estado de la habitacion
function StatusBadge({ status }) {
  const styles = {
    Disponible: "bg-green-100 text-green-700",
    Ocupada: "bg-red-100 text-red-700",
    Limpieza: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}//Componente modal de confirmacion delete guarda el componente y consulta
function ConfirmModal({ open, title, description, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

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
//MODal de creacion de habitaciones, guarda el componente y consulta
function CreateRoomModal({ open, onCancel, onSubmit, initialValues, title, error }) {
  const [form, setForm] = useState(
  initialValues ?? { number: "", type: "Simple", status: "Disponible", price: "" }
);

  useEffect(() => {
  if (open) {
    setForm(
      initialValues ?? { number: "", type: "Simple", status: "Disponible", price: "" }
    );
  }
}, [open, initialValues]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.number || !form.price) return;

    onSubmit({
      ...form,
      price: Number(form.price),
    });

    setForm({
      number: "",
      type: "Simple",
      status: "Disponible",
      price: "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-base font-semibold">{title}</h3>
        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}


        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            placeholder="Número (ej: 201)"
            value={form.number}
            onChange={(e) =>
              setForm({ ...form, number: e.target.value })
            }
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            placeholder="Precio"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option>Simple</option>
            <option>Doble</option>
            <option>Suite</option>
          </select>

          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value })
            }
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option>Disponible</option>
            <option>Ocupada</option>
            <option>Limpieza</option>
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Guardar
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const styles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-black",
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-xl px-4 py-2 text-sm text-white shadow-lg ${styles[type]}`}>
        {message}
      </div>
    </div>
  );
}



export default function Rooms() {

  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);




  //Carga inicial de habitaciones, se simula una consulta a un servicio externo
  useEffect(() => {
    getRooms().then(setRooms);
  }, []);
  //Efecto para cerrar el toast automaticamente despues de 2 segundos cada vez que se muestra un nuevo mensaje
  useEffect(() => {
  if (!toast) return;

  const timer = setTimeout(() => {
    setToast(null);
  }, 3000);

  return () => clearTimeout(timer);
}, [toast]);

  //Buscador y filtro de habitaciones
  const filteredRooms = useMemo(() => {
  const q = query.trim().toLowerCase();
  return rooms.filter((room) => {
    const matchesQuery =
      !q ||
      room.number.toLowerCase().includes(q) ||
      room.type.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "All" || room.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
}, [rooms, query, statusFilter]);


  //Elimina el elemento seleccionado y cierra el modal de confirmacion
  function confirmDelete() {
  if (!deletingRoom) return;
  handleDelete(deletingRoom.id);
  setDeletingRoom(null);
  setToast({
  message: `Habitación eliminada`,
  type: "success",
});

}


function handleDelete(id) {
  setRooms((prev) => prev.filter((r) => r.id !== id));
}


//Agrega una nueva habitacion o edita la existente dependiendo del estado del modal, luego cierra el modal y resetea el estado de edicion
function handleSubmitRoom(values) {



  //Control de error simple para evitar habitaciones con el mismo numero
  setFormError("");

  const nextNumber = values.number.trim();
  const exists = rooms.some((r) => {
    if (editingRoom && r.id === editingRoom.id) return false; // no se compara contra sí misma
    return r.number === nextNumber;
  });

  if (exists) {
    setFormError(`Ya existe la habitación ${nextNumber}`);
    return;
  }
  //Si editingRoom tiene valor, se actualiza la habitacion existente, sino se crea una nueva habitacion con un id unico y se agrega a la lista de habitaciones
  if (editingRoom) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === editingRoom.id ? { ...r, ...values } : r 
      )
    );
    setToast({
      message: `Habitación ${values.number} actualizada`,
      type: "success",
    });

  } else {
    const room = {
      id: crypto.randomUUID(),
      ...values,
    };
    setRooms((prev) => [room, ...prev]);
    setToast({
    message: `Habitación ${values.number} creada`,
    type: "success",
  });
  }

  setIsCreateOpen(false);
  setEditingRoom(null);
}



  return (
    
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Habitaciones</h2>
            <p className="text-sm text-gray-500">
              Gestiona las habitaciones del hotel y su disponibilidad
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {rooms.length} habitación(es)
            </p>
          </div>
            

          <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          onClick={()=> {
            setFormError("");
            setEditingRoom(null);
            setIsCreateOpen(true);
          } }>
            + Nueva habitación
          </button>
        </div>
        {/* Filtros y Buscador */}
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="rounded-2xl border bg-white p-3">
            <input
              placeholder="Buscar por número o tipo..."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border bg-white p-3">
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Ocupada">Ocupada</option>
              <option value="Limpieza">Limpieza</option>
            </select>
          </div>
        </div>

        {/* Tabla de habitaciones */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">

            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Habitación</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
                <th className="px-4 py-3 text-left font-medium">Precio</th>
              </tr>
            </thead>

            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.id} className="border-b border-gray-200 last:border-0">

                  <td className="px-4 py-3 font-medium">
                    {room.number}
                  </td>

                  <td className="px-4 py-3">
                    {room.type}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={room.status} />
                  </td>

                  <td className="px-4 py-3 flex justify-start items-center gap-1">
                    <button className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100 bg-green-400"
                    onClick={() => {
                      setFormError("");
                      setEditingRoom(room);
                      setIsCreateOpen(true);
                    }}>
                      Editar
                    </button>
                    <button 
                    onClick={() => setDeletingRoom(room)}
                    className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100 bg-red-400">
                      Eliminar
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    ${room.price}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
         <ConfirmModal
          open={Boolean(deletingRoom)}
          title="Eliminar habitación"
          description={
            deletingRoom
              ? `¿Seguro que querés eliminar la habitación ${deletingRoom.number}? Esta acción no se puede deshacer.`
              : ""
          }
          onCancel={() => setDeletingRoom(null)}
          onConfirm={confirmDelete}
        />
        <CreateRoomModal
          open={isCreateOpen}
          onCancel={() => {
            setIsCreateOpen(false);
            setEditingRoom(null);
          }}
          error={formError}
          onSubmit={handleSubmitRoom}
          title={editingRoom ? `Editar habitación ${editingRoom.number}` : "Nueva habitación"}
          initialValues={
            editingRoom
              ? {
                  number: editingRoom.number,
                  type: editingRoom.type,
                  status: editingRoom.status,
                  price: String(editingRoom.price),
                }
              : null
          }
        />


             <Toast
              message={toast?.message}
              type={toast?.type}
              onClose={() => setToast(null)}
            />
 
              </div>
          );
        }
