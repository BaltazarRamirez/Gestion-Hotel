/**
 * Formatea una fecha ISO (YYYY-MM-DD) a español corto: "25 feb 2026"
 * @param {string} isoDate - Fecha en formato YYYY-MM-DD
 * @returns {string}
 */
export function formatDateShort(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Número corto de reserva para mostrar (últimos 6 caracteres del id)
 * @param {string} id
 * @returns {string}
 */
export function shortReservationId(id) {
  if (!id) return "—";
  return id.length > 6 ? id.slice(-6).toUpperCase() : id.toUpperCase();
}
