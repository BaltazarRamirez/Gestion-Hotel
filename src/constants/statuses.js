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
    classes: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  [RESERVATION_STATUS.CheckedIn]: {
    label: "Check-in",
    classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  [RESERVATION_STATUS.CheckedOut]: {
    label: "Check-out",
    classes: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  },
  [RESERVATION_STATUS.Cancelled]: {
    label: "Cancelada",
    classes: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
};

/** Config para StatusBadge: habitación */
export const ROOM_STATUS_CONFIG = {
  [ROOM_STATUS.Disponible]: {
    label: "Disponible",
    classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  [ROOM_STATUS.Ocupada]: {
    label: "Ocupada",
    classes: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
  [ROOM_STATUS.Limpieza]: {
    label: "Limpieza",
    classes: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
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
