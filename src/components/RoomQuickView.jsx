import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { formatDateShort } from "../utils/formatDate";
import { isoTodayLocal } from "../utils/date";
import {
  RESERVATION_STATUS,
  ROOM_STATUS,
  isActiveReservationStatus,
} from "../constants/statuses";

function getCurrentReservation(reservations, roomId, todayIso) {
  return reservations.find((r) => {
    if (r.roomId !== roomId) return false;
    if (!isActiveReservationStatus(r.status)) return false;
    if (r.status === RESERVATION_STATUS.CheckedIn) return true;
    return r.checkIn <= todayIso && todayIso < r.checkOut;
  });
}

export function RoomQuickView({
  open,
  room,
  reservations = [],
  guests = [],
  onClose,
  onUpdateRoom,
  onUpdateReservation,
  onEditRoom,
  onViewReservation,
}) {
  const todayIso = isoTodayLocal();
  const guestById = useMemo(() => {
    const map = new Map();
    guests.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  const currentRes = useMemo(
    () => (room ? getCurrentReservation(reservations, room.id, todayIso) : null),
    [reservations, room, todayIso]
  );

  const [checkInAskReservation, setCheckInAskReservation] = useState(null);

  if (!room) return null;

  async function handleStatusChange(newStatus) {
    if (onUpdateRoom) await onUpdateRoom(room.id, { status: newStatus });
    onClose();
  }

  async function handleReservationStatus(reservationId, newStatus, extraPatch = {}) {
    const patch = { ...extraPatch, status: newStatus };
    if (onUpdateReservation) await onUpdateReservation(reservationId, patch);
    if (onUpdateRoom) {
      if (newStatus === RESERVATION_STATUS.CheckedIn)
        await onUpdateRoom(room.id, { status: ROOM_STATUS.Ocupada });
      if (newStatus === RESERVATION_STATUS.CheckedOut)
        await onUpdateRoom(room.id, { status: ROOM_STATUS.Limpieza });
      if (newStatus === RESERVATION_STATUS.Cancelled)
        await onUpdateRoom(room.id, { status: ROOM_STATUS.Disponible });
    }
    setCheckInAskReservation(null);
    onClose();
  }

  function openCheckInAsk() {
    if (currentRes) setCheckInAskReservation(currentRes);
  }

  async function confirmCheckIn(paidAtCheckIn) {
    if (!checkInAskReservation) return;
    await handleReservationStatus(checkInAskReservation.id, RESERVATION_STATUS.CheckedIn, {
      paidAtCheckIn,
    });
  }

  return (
    <>
      <Modal open={open} title={`Habitación ${room.number}`} onClose={onClose}>
        <div className="space-y-4 text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-600 bg-slate-700/50 p-3">
            <div>
              <p className="text-xs text-slate-500">Tipo · Precio</p>
              <p className="font-medium text-slate-100">
                {room.type} · ${room.price}
              </p>
            </div>
            <StatusBadge status={room.status} variant="room" />
          </div>

          {currentRes ? (
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-3">
              <p className="text-xs text-slate-500">Reserva actual</p>
              <p className="font-medium text-slate-100">
                {guestById.get(currentRes.guestId)?.fullName ?? "—"}
              </p>
              <p className="text-sm text-slate-400">
                {formatDateShort(currentRes.checkIn)} → {formatDateShort(currentRes.checkOut)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={currentRes.status} variant="reservation" />
                {currentRes.status === RESERVATION_STATUS.CheckedIn && (
                  <span
                    className={
                      currentRes.paidAtCheckIn
                        ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300"
                    }
                  >
                    {currentRes.paidAtCheckIn ? "Pago" : "Pendiente de pago"}
                  </span>
                )}

                {currentRes.status === RESERVATION_STATUS.Confirmed && (
                  <>
                    <button
                      type="button"
                      onClick={openCheckInAsk}
                      className="action-btn action-btn-success action-btn-sm"
                    >
                      Check-in
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleReservationStatus(currentRes.id, RESERVATION_STATUS.Cancelled)
                      }
                      className="action-btn action-btn-danger action-btn-sm"
                    >
                      Cancelar reserva
                    </button>
                  </>
                )}

                {currentRes.status === RESERVATION_STATUS.CheckedIn && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReservationStatus(currentRes.id, RESERVATION_STATUS.CheckedOut)
                    }
                    className="action-btn action-btn-neutral action-btn-sm"
                  >
                    Check-out
                  </button>
                )}

                {onViewReservation ? (
                  <button
                    type="button"
                    onClick={() => onViewReservation(currentRes)}
                    className="action-btn action-btn-info action-btn-sm"
                  >
                    Ver detalle
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-600 bg-slate-700/30 p-3">
              <p className="text-sm text-slate-500">Sin reserva activa</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-slate-600 pt-3">
            <span className="w-full text-xs text-slate-500">Estado de la habitación</span>

            {room.status === ROOM_STATUS.Limpieza && (
              <button
                type="button"
                onClick={() => handleStatusChange(ROOM_STATUS.Disponible)}
                className="action-btn action-btn-success"
              >
                Limpieza lista
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStatusChange(ROOM_STATUS.Disponible)}
              className="action-btn action-btn-success"
            >
              Disponible
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(ROOM_STATUS.Limpieza)}
              className="action-btn action-btn-warning"
            >
              En limpieza
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(ROOM_STATUS.Ocupada)}
              className="action-btn action-btn-danger"
            >
              Ocupada
            </button>
          </div>

          {onEditRoom ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onEditRoom(room);
                  onClose();
                }}
                className="action-btn action-btn-info"
              >
                Editar habitación
              </button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(checkInAskReservation)}
        title="Check-in"
        onClose={() => setCheckInAskReservation(null)}
      >
        {checkInAskReservation ? (
          <div className="space-y-4">
            <p className="text-slate-200">
              ¿El huésped ya pagó? Se mostrará como &quot;Pago&quot; o &quot;Pendiente de
              pago&quot; y se sumará a ingresos si está pago.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckInAskReservation(null)}
                className="action-btn action-btn-neutral"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmCheckIn(false)}
                className="action-btn action-btn-warning"
              >
                No, pendiente
              </button>
              <button
                type="button"
                onClick={() => confirmCheckIn(true)}
                className="action-btn action-btn-success"
              >
                Sí, está pago
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
