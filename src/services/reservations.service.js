import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getCurrentHotelId } from "../lib/currentHotel";
import { reservations as seed } from "../data/reservations";
import { HOTEL_ID, STORAGE_KEYS } from "../constants/app";
import { readJson, writeJson } from "./localStore";

function normalizeReservation(r) {
  return {
    ...r,
    roomId: String(r.roomId ?? ""),
    paidAtCheckIn: Boolean(r.paidAtCheckIn),
    charges: Array.isArray(r.charges) ? r.charges : [],
  };
}

function loadOrSeedReservations() {
  const stored = readJson(STORAGE_KEYS.reservations);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeReservation);

  const seeded = seed.map((r) => normalizeReservation({ ...r, roomId: String(r.roomId) }));
  writeJson(STORAGE_KEYS.reservations, seeded);
  return seeded;
}

let reservationsMemory = loadOrSeedReservations();

function persistReservations() {
  writeJson(STORAGE_KEYS.reservations, reservationsMemory);
}

function rowToReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    guestId: row.guest_id,
    roomId: row.room_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    hotelId: row.hotel_id ?? HOTEL_ID,
    charges: Array.isArray(row.charges) ? row.charges : [],
    paidAtCheckIn: Boolean(row.paid_at_check_in),
  };
}

export async function getReservations() {
  if (isSupabaseEnabled) {
    const hotelId = getCurrentHotelId();
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("check_in", { ascending: false });
    if (error) {
      console.error("[reservations.service] Supabase error:", error);
      throw new Error(error.message || "Error al cargar reservas");
    }
    return (data ?? []).map(rowToReservation);
  }
  return reservationsMemory;
}

export async function createReservation(values) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        hotel_id: getCurrentHotelId(),
        guest_id: values.guestId,
        room_id: values.roomId,
        check_in: values.checkIn,
        check_out: values.checkOut,
        status: values.status ?? "Confirmed",
        charges: values.charges ?? [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToReservation(data);
  }
  const item = {
    id: crypto.randomUUID(),
    hotelId: HOTEL_ID,
    guestId: values.guestId,
    roomId: String(values.roomId),
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    status: values.status ?? "Confirmed",
    charges: values.charges ?? [],
    paidAtCheckIn: Boolean(values.paidAtCheckIn),
  };
  reservationsMemory = [item, ...reservationsMemory];
  persistReservations();
  return item;
}

export async function updateReservation(id, patch) {
  if (isSupabaseEnabled) {
    const payload = {};
    if (patch.guestId !== undefined) payload.guest_id = patch.guestId;
    if (patch.roomId !== undefined) payload.room_id = patch.roomId;
    if (patch.checkIn !== undefined) payload.check_in = patch.checkIn;
    if (patch.checkOut !== undefined) payload.check_out = patch.checkOut;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.charges !== undefined) payload.charges = patch.charges;
    if (patch.paidAtCheckIn !== undefined)
      payload.paid_at_check_in = Boolean(patch.paidAtCheckIn);
    const { data, error } = await supabase
      .from("reservations")
      .update(payload)
      .eq("id", id)
      .eq("hotel_id", getCurrentHotelId())
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToReservation(data);
  }
  reservationsMemory = reservationsMemory.map((r) => {
    if (r.id !== id) return r;
    return normalizeReservation({
      ...r,
      ...patch,
      paidAtCheckIn:
        patch.paidAtCheckIn !== undefined ? Boolean(patch.paidAtCheckIn) : Boolean(r.paidAtCheckIn),
    });
  });
  persistReservations();
  return reservationsMemory.find((r) => r.id === id) ?? null;
}

export async function deleteReservation(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id)
      .eq("hotel_id", getCurrentHotelId());
    if (error) throw new Error(error.message);
    return true;
  }
  reservationsMemory = reservationsMemory.filter((r) => r.id !== id);
  persistReservations();
  return true;
}
