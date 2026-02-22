// src/config/mapsConfig.js
export const MAPS_CONFIG = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries: ["places", "geometry", "drawing"], // Static array to prevent reloads
};