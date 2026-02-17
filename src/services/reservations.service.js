import { reservations as seed } from "../data/reservations";

let reservations = [...seed];

export async function getReservations() {
  return reservations;
}

export async function createReservation(values) {
  const item = { id: crypto.randomUUID(), ...values };
  reservations = [item, ...reservations];
  return item;
}

export async function updateReservation(id, patch) {
  reservations = reservations.map((r) => (r.id === id ? { ...r, ...patch } : r));
  return reservations.find((r) => r.id === id);
}

export async function deleteReservation(id) {
  reservations = reservations.filter((r) => r.id !== id);
  return true;
}
