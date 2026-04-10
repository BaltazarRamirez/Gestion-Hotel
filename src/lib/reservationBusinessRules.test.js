import { describe, expect, it } from "vitest";
import { RESERVATION_STATUS, ROOM_STATUS } from "../constants/statuses";
import {
  getCurrentReservationForRoom,
  roomStatusFromReservationStatus,
} from "./reservationBusinessRules";

describe("getCurrentReservationForRoom", () => {
  it("devuelve CheckedIn de la habitacion aunque la fecha no coincida", () => {
    const reservations = [
      {
        id: "r1",
        roomId: "2",
        status: RESERVATION_STATUS.CheckedIn,
        checkIn: "2026-04-01",
        checkOut: "2026-04-05",
      },
    ];

    const result = getCurrentReservationForRoom(reservations, 2, "2026-04-10");
    expect(result?.id).toBe("r1");
  });

  it("ignora reservas canceladas o checked out", () => {
    const reservations = [
      {
        id: "r-cancelled",
        roomId: 1,
        status: RESERVATION_STATUS.Cancelled,
        checkIn: "2026-04-10",
        checkOut: "2026-04-12",
      },
      {
        id: "r-checkedout",
        roomId: 1,
        status: RESERVATION_STATUS.CheckedOut,
        checkIn: "2026-04-10",
        checkOut: "2026-04-12",
      },
    ];

    const result = getCurrentReservationForRoom(reservations, 1, "2026-04-11");
    expect(result).toBeUndefined();
  });

  it("toma Confirmed solo dentro del rango [checkIn, checkOut)", () => {
    const reservation = {
      id: "r2",
      roomId: 7,
      status: RESERVATION_STATUS.Confirmed,
      checkIn: "2026-04-10",
      checkOut: "2026-04-12",
    };

    expect(getCurrentReservationForRoom([reservation], 7, "2026-04-10")?.id).toBe("r2");
    expect(getCurrentReservationForRoom([reservation], 7, "2026-04-11")?.id).toBe("r2");
    expect(getCurrentReservationForRoom([reservation], 7, "2026-04-12")).toBeUndefined();
  });

  it("compara roomId sin romper por tipos number/string", () => {
    const reservations = [
      {
        id: "r3",
        roomId: "101",
        status: RESERVATION_STATUS.Confirmed,
        checkIn: "2026-04-01",
        checkOut: "2026-04-30",
      },
    ];

    const result = getCurrentReservationForRoom(reservations, 101, "2026-04-15");
    expect(result?.id).toBe("r3");
  });
});

describe("roomStatusFromReservationStatus", () => {
  it("mapea CheckedIn a Ocupada", () => {
    expect(roomStatusFromReservationStatus(RESERVATION_STATUS.CheckedIn)).toBe(
      ROOM_STATUS.Ocupada,
    );
  });

  it("mapea CheckedOut a Limpieza", () => {
    expect(roomStatusFromReservationStatus(RESERVATION_STATUS.CheckedOut)).toBe(
      ROOM_STATUS.Limpieza,
    );
  });

  it("mapea Cancelled a Disponible", () => {
    expect(roomStatusFromReservationStatus(RESERVATION_STATUS.Cancelled)).toBe(
      ROOM_STATUS.Disponible,
    );
  });

  it("retorna null para estados sin transicion de habitacion", () => {
    expect(roomStatusFromReservationStatus(RESERVATION_STATUS.Confirmed)).toBeNull();
  });
});
