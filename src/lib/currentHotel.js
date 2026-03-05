/**
 * Hotel actual del usuario logueado (multi-tenant).
 * Lo setea AuthContext cuando carga el perfil; los servicios lo usan para filtrar por hotel_id.
 */
let currentHotelId = "hotel-1";

export function getCurrentHotelId() {
  return currentHotelId;
}

export function setCurrentHotelId(hotelId) {
  if (hotelId != null && hotelId !== "") {
    currentHotelId = String(hotelId);
  }
}
