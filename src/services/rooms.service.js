import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getCurrentHotelId } from "../lib/currentHotel";
import { rooms as seedRooms } from "../data/rooms";
import { DEFAULT_CURRENCY, HOTEL_ID, STORAGE_KEYS } from "../constants/app";
import { readJson, writeJson } from "./localStore";

function normalizeRoom(r) {
  return {
    ...r,
    id: String(r.id ?? ""),
    price: Number(r.price ?? 0),
    currency: r.currency ?? DEFAULT_CURRENCY,
  };
}

function loadOrSeedRooms() {
  const stored = readJson(STORAGE_KEYS.rooms);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeRoom);

  const seeded = seedRooms.map((r) => normalizeRoom({ ...r, id: String(r.id) }));
  writeJson(STORAGE_KEYS.rooms, seeded);
  return seeded;
}

let roomsMemory = loadOrSeedRooms();

function persistRooms() {
  writeJson(STORAGE_KEYS.rooms, roomsMemory);
}

function rowToRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    status: row.status,
    price: Number(row.price),
    currency: row.currency ?? DEFAULT_CURRENCY,
    hotelId: row.hotel_id ?? HOTEL_ID,
  };
}

export async function getRooms() {
  if (isSupabaseEnabled) {
    const hotelId = getCurrentHotelId();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("number");
    if (error) {
      console.error("[rooms.service] Supabase error:", error);
      throw new Error(error.message || "Error al cargar habitaciones");
    }
    return (data ?? []).map(rowToRoom);
  }
  return roomsMemory;
}

export async function createRoom(newRoom) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        hotel_id: getCurrentHotelId(),
        number: newRoom.number,
        type: newRoom.type ?? "Simple",
        status: newRoom.status ?? "Disponible",
        price: Number(newRoom.price),
        currency: newRoom.currency ?? DEFAULT_CURRENCY,
      })
      .select("id, number, type, status, price, currency, hotel_id")
      .single();
    if (error) throw new Error(error.message);
    return rowToRoom(data);
  }
  const numericIds = roomsMemory.map((r) => Number(r.id)).filter(Number.isFinite);
  const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
  const room = {
    id: String(nextId),
    hotelId: HOTEL_ID,
    ...newRoom,
    price: Number(newRoom.price),
    currency: newRoom.currency ?? DEFAULT_CURRENCY,
  };
  roomsMemory = [room, ...roomsMemory];
  persistRooms();
  return room;
}

export async function updateRoom(id, patch) {
  if (isSupabaseEnabled) {
    const payload = {};
    if (patch.number !== undefined) payload.number = patch.number;
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.price !== undefined) payload.price = Number(patch.price);
    if (patch.currency !== undefined) payload.currency = patch.currency;
    const { data, error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", id)
      .eq("hotel_id", getCurrentHotelId())
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToRoom(data);
  }
  roomsMemory = roomsMemory.map((room) =>
    room.id === String(id)
      ? normalizeRoom({
          ...room,
          ...patch,
          price: patch.price !== undefined ? Number(patch.price) : room.price,
        })
      : room
  );
  persistRooms();
  return roomsMemory.find((room) => room.id === String(id)) ?? null;
}

export async function deleteRoom(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id)
      .eq("hotel_id", getCurrentHotelId());
    if (error) throw new Error(error.message);
    return true;
  }
  roomsMemory = roomsMemory.filter((room) => room.id !== String(id));
  persistRooms();
  return true;
}
