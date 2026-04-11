/**
 * Estados de reserva y habitación centralizados.
 * Usar estos valores en lugar de strings sueltos.
 */

export const RESERVATION_STATUS = {
  Confirmed: "Confirmed",
  CheckedIn: "CheckedIn",
  CheckedOut: "CheckedOut",
  Cancelled: "Cancelled",
};

export const ROOM_STATUS = {
  Disponible: "Disponible",
  Ocupada: "Ocupada",
  Limpieza: "Limpieza",
};

/** Valores para reserva (para selects y filtros) */
export const RESERVATION_STATUS_VALUES = Object.values(RESERVATION_STATUS);

/** Valores para habitación */
export const ROOM_STATUS_VALUES = Object.values(ROOM_STATUS);

/** Config para StatusBadge: reserva */
export const RESERVATION_STATUS_CONFIG = {
  [RESERVATION_STATUS.Confirmed]: {
    label: "Confirmada",
    classes:
      "border-blue-400/25 bg-gradient-to-r from-blue-500/18 to-cyan-500/12 text-blue-100 shadow-blue-950/20",
    dotClass: "bg-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.6)]",
  },
  [RESERVATION_STATUS.CheckedIn]: {
    label: "Check-in",
    classes:
      "border-emerald-400/25 bg-gradient-to-r from-emerald-500/18 to-teal-500/12 text-emerald-100 shadow-emerald-950/20",
    dotClass: "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.6)]",
  },
  [RESERVATION_STATUS.CheckedOut]: {
    label: "Check-out",
    classes:
      "border-slate-400/20 bg-gradient-to-r from-slate-500/14 to-slate-400/8 text-slate-200 shadow-slate-950/20",
    dotClass: "bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.35)]",
  },
  [RESERVATION_STATUS.Cancelled]: {
    label: "Cancelada",
    classes:
      "border-rose-400/25 bg-gradient-to-r from-rose-500/18 to-red-500/12 text-rose-100 shadow-rose-950/20",
    dotClass: "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.55)]",
  },
};

/** Config para StatusBadge: habitación */
export const ROOM_STATUS_CONFIG = {
  [ROOM_STATUS.Disponible]: {
    label: "Disponible",
    classes:
      "border-emerald-400/25 bg-gradient-to-r from-emerald-500/18 to-teal-500/12 text-emerald-100 shadow-emerald-950/20",
    dotClass: "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.6)]",
  },
  [ROOM_STATUS.Ocupada]: {
    label: "Ocupada",
    classes:
      "border-rose-400/25 bg-gradient-to-r from-rose-500/18 to-red-500/12 text-rose-100 shadow-rose-950/20",
    dotClass: "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.55)]",
  },
  [ROOM_STATUS.Limpieza]: {
    label: "Limpieza",
    classes:
      "border-amber-400/25 bg-gradient-to-r from-amber-500/18 to-orange-500/12 text-amber-100 shadow-amber-950/20",
    dotClass: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.55)]",
  },
};

/** Reserva considerada "activa" (no cancelada ni ya salida) */
export function isActiveReservationStatus(status) {
  return (
    status !== RESERVATION_STATUS.Cancelled &&
    status !== RESERVATION_STATUS.CheckedOut
  );
}

/** Reservas activas para una habitación */
export function getActiveReservationsForRoom(roomId, reservations) {
  return reservations.filter(
    (r) =>
      r.roomId === roomId && isActiveReservationStatus(r.status)
  );
}

/** Reservas activas para un huésped */
export function getActiveReservationsForGuest(guestId, reservations) {
  return reservations.filter(
    (r) =>
      r.guestId === guestId && isActiveReservationStatus(r.status)
  );
}
