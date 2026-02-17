import { rooms as seedRooms } from "../data/rooms";

let rooms = [...seedRooms];

export async function getRooms() {
  return rooms;
}

export async function createRoom(newRoom) {
  const room = {
    id: crypto.randomUUID(),
    ...newRoom,
    price: Number(newRoom.price),
  };

  rooms = [room, ...rooms];
  return room;
}
