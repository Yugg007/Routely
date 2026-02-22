// src/hooks/useMapsLoader.js
import { useJsApiLoader } from "@react-google-maps/api";
import { MAPS_CONFIG } from "../config/mapsConfig";

/**
 * SDE3 Note: We centralize the loader here. 
 * If we need to add a localization (language) or 
 * a premium plan ID later, we change it in one file.
 */
export const useMapsLoader = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAPS_CONFIG.libraries,
  });

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
  }

  return { isLoaded, loadError };
};