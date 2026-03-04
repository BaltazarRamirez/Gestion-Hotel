const DEFAULT_HOTEL_ID = "hotel-1";

export const reservations = [
  {
    id: "r1",
    guestId: "g1",
    roomId: 1,
    checkIn: "2026-02-18",
    checkOut: "2026-02-21",
    status: "Confirmed", // Confirmed | CheckedIn | CheckedOut | Cancelled
    hotelId: DEFAULT_HOTEL_ID,
    charges: [],
  },
  {
    id: "r2",
    guestId: "g2",
    roomId: 2,
    checkIn: "2026-02-17",
    checkOut: "2026-02-19",
    status: "CheckedIn",
    hotelId: DEFAULT_HOTEL_ID,
    charges: [],
    paidAtCheckIn: false,
  },
  {
    id: "r3",
    guestId: "g3",
    roomId: 3,
    checkIn: "2026-02-20",
    checkOut: "2026-02-22",
    status: "Cancelled",
    hotelId: DEFAULT_HOTEL_ID,
    charges: [],
  },
];
