// Functionality.js
// Core business logic for Routely Dashboard (Google Maps implementation)

export const RIDE_TYPES = [
  { id: "bike", name: "Bike", emoji: "🚲", base: 20, per_km: 6, eta_min: 2 },
  { id: "auto", name: "Auto", emoji: "🛺", base: 30, per_km: 8, eta_min: 4 },
  { id: "car", name: "Car", emoji: "🚗", base: 50, per_km: 10, eta_min: 6 },
  { id: "premier", name: "Premier", emoji: "🚘", base: 120, per_km: 18, eta_min: 8 },
];

// ----------------- Utilities -----------------
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calcFare(distanceKm, rideType) {
  return Math.max(1, Math.round(rideType.base + rideType.per_km * distanceKm));
}

export function formatINR(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function travelModeForRide(id) {
  if (id === "bike") return window.google ? window.google.maps.TravelMode.BICYCLING : "BICYCLING";
  return window.google ? window.google.maps.TravelMode.DRIVING : "DRIVING";
}

// ----------------- Google APIs -----------------
export function initGoogleServices() {
  if (window.google) {
    return {
      autocompleteService: new window.google.maps.places.AutocompleteService(),
      geocoder: new window.google.maps.Geocoder(),
    };
  }
  return { autocompleteService: null, geocoder: null };
}

export function reverseGeocode(geocoder, loc, callback) {
  if (!geocoder) return;
  geocoder.geocode({ location: { lat: loc.lat, lng: loc.lng } }, (results, status) => {
    if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
      callback(results[0].formatted_address);
    }
  });
}

export function searchPlaces(service, input, center, currentSuggestion, cb) {
  if (!input || !service) {
    cb(currentSuggestion ? [currentSuggestion] : []);
    return;
  }

  const request = { input };
  if (center && window.google) {
    request.location = new window.google.maps.LatLng(center.lat, center.lng);
    request.radius = 50000;
  }

  service.getPlacePredictions(request, (predictions, status) => {
    let results = [];
    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
      results = predictions.map((p) => ({ id: p.place_id, label: p.description }));
    }
    if (currentSuggestion) results = [currentSuggestion, ...results];
    cb(results);
  });
}

export function geocodePlaceId(geocoder, placeId, cb) {
  if (!geocoder) return;
  geocoder.geocode({ placeId }, (results, status) => {
    if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
      cb({
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng(),
        label: results[0].formatted_address,
      });
    }
  });
}

export function computeGoogleRoute(pickup, drop, rideTypeId, cb, fallbackCb) {
  const ds = new window.google.maps.DirectionsService();
  const mode = travelModeForRide(rideTypeId);

  const request = {
    origin: { lat: pickup.lat, lng: pickup.lng },
    destination: { lat: drop.lat, lng: drop.lng },
    travelMode: mode,
    provideRouteAlternatives: true,
  };

  ds.route(request, (result, status) => {
    if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.length) {
      let best = null;
      let bestDist = Infinity;
      result.routes.forEach((r) => {
        const legs = r.legs || [];
        let totalMeters = 0;
        let totalSec = 0;
        legs.forEach((leg) => {
          if (leg.distance?.value) totalMeters += leg.distance.value;
          if (leg.duration?.value) totalSec += leg.duration.value;
        });
        if (totalMeters < bestDist) {
          bestDist = totalMeters;
          best = { route: r, totalMeters, totalSec };
        }
      });

      if (best) {
        const path = (best.route.overview_path || []).map((p) => ({
          lat: p.lat(),
          lng: p.lng(),
        }));
        cb(path, best.totalMeters / 1000, Math.max(1, Math.round(best.totalSec / 60)), best.route.bounds);
        return;
      }
    }

    // fallback
    const dkm = haversineDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
    const mins = Math.max(1, Math.ceil(dkm / 1.6));
    fallbackCb(dkm, mins, [
      { lat: pickup.lat, lng: pickup.lng },
      { lat: drop.lat, lng: drop.lng },
    ]);
  });
}
