import {
  RESERVATION_STATUS,
  ROOM_STATUS,
  isActiveReservationStatus,
} from "../constants/statuses";

/**
 * Devuelve la reserva vigente para una habitación en una fecha dada.
 * - CheckedIn tiene prioridad y se considera vigente siempre.
 * - Confirmed se considera vigente si hoy está dentro de [checkIn, checkOut).
 */
export function getCurrentReservationForRoom(reservations, roomId, todayIso) {
  const targetRoomId = String(roomId);
  return reservations.find((reservation) => {
    if (String(reservation.roomId) !== targetRoomId) return false;
    if (!isActiveReservationStatus(reservation.status)) return false;
    if (reservation.status === RESERVATION_STATUS.CheckedIn) return true;
    return reservation.checkIn <= todayIso && todayIso < reservation.checkOut;
  });
}

/**
 * Mapea el estado de reserva al estado de habitación que corresponde.
 */
export function roomStatusFromReservationStatus(reservationStatus) {
  if (reservationStatus === RESERVATION_STATUS.CheckedIn) {
    return ROOM_STATUS.Ocupada;
  }
  if (reservationStatus === RESERVATION_STATUS.CheckedOut) {
    return ROOM_STATUS.Limpieza;
  }
  if (reservationStatus === RESERVATION_STATUS.Cancelled) {
    return ROOM_STATUS.Disponible;
  }
  return null;
}
