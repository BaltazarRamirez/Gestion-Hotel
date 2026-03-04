/**
 * @typedef {Object} Room
 * @property {number} id
 * @property {string} number
 * @property {string} type
 * @property {"Disponible" | "Ocupada" | "Limpieza"} status
 * @property {number} price
 * @property {string} currency
 * @property {string} hotelId
 */

/**
 * @typedef {Object} Guest
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} hotelId
 */

/**
 * @typedef {Object} Charge
 * @property {string} id
 * @property {string} concept
 * @property {number} amount
 * @property {string} date // ISO
 */

/**
 * @typedef {Object} Reservation
 * @property {string} id
 * @property {string} guestId
 * @property {number} roomId
 * @property {string} checkIn
 * @property {string} checkOut
 * @property {"Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled"} status
 * @property {string} hotelId
 * @property {Charge[]} charges
 */

