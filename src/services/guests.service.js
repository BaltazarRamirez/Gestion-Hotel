import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { guests as seed } from "../data/guests";
import { HOTEL_ID, STORAGE_KEYS } from "../constants/app";
import { readJson, writeJson } from "./localStore";

function loadOrSeedGuests() {
  const stored = readJson(STORAGE_KEYS.guests);
  if (Array.isArray(stored) && stored.length > 0) return stored;

  const seeded = [...seed];
  writeJson(STORAGE_KEYS.guests, seeded);
  return seeded;
}

let guestsMemory = loadOrSeedGuests();

function persistGuests() {
  writeJson(STORAGE_KEYS.guests, guestsMemory);
}

function rowToGuest(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    hotelId: row.hotel_id ?? HOTEL_ID,
  };
}

export async function getGuests() {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("full_name");
    if (error) {
      console.error("[guests.service] Supabase error:", error);
      throw new Error(error.message || "Error al cargar huéspedes");
    }
    return (data ?? []).map(rowToGuest);
  }
  return guestsMemory;
}

export async function createGuest(values) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("guests")
      .insert({
        hotel_id: HOTEL_ID,
        full_name: values.fullName,
        email: values.email,
        phone: values.phone ?? "",
      })
      .select("id, full_name, email, phone, hotel_id")
      .single();
    if (error) {
      console.error("[guests.service] Supabase insert error:", error);
      throw new Error(error.message || "Error al crear huésped en la base de datos");
    }
    return rowToGuest(data);
  }
  const item = {
    id: crypto.randomUUID(),
    hotelId: HOTEL_ID,
    fullName: values.fullName,
    email: values.email,
    phone: values.phone ?? "",
  };
  guestsMemory = [item, ...guestsMemory];
  persistGuests();
  return item;
}

export async function updateGuest(id, patch) {
  if (isSupabaseEnabled) {
    const payload = {};
    if (patch.fullName !== undefined) payload.full_name = patch.fullName;
    if (patch.email !== undefined) payload.email = patch.email;
    if (patch.phone !== undefined) payload.phone = patch.phone;
    const { data, error } = await supabase
      .from("guests")
      .update(payload)
      .eq("id", id)
      .eq("hotel_id", HOTEL_ID)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToGuest(data);
  }
  guestsMemory = guestsMemory.map((g) =>
    g.id === id ? { ...g, ...patch } : g
  );
  persistGuests();
  return guestsMemory.find((g) => g.id === id) ?? null;
}

export async function deleteGuest(id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", id)
      .eq("hotel_id", HOTEL_ID);
    if (error) throw new Error(error.message);
    return true;
  }
  guestsMemory = guestsMemory.filter((g) => g.id !== id);
  persistGuests();
  return true;
}
