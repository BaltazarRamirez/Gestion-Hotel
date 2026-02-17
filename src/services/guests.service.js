import { guests as seed } from "../data/guests";

let guests = [...seed];

export async function getGuests() {
  return guests;
}

export async function createGuest(values) {
  const item = { id: crypto.randomUUID(), ...values };
  guests = [item, ...guests];
  return item;
}

export async function updateGuest(id, patch) {
  guests = guests.map((g) => (g.id === id ? { ...g, ...patch } : g));
  return guests.find((g) => g.id === id);
}

export async function deleteGuest(id) {
  guests = guests.filter((g) => g.id !== id);
  return true;
}
