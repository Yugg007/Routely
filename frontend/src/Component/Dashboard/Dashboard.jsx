// Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import "./Dashboard.css";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

import {
  RIDE_TYPES,
  calcFare,
  formatINR,
  initGoogleServices,
  reverseGeocode,
  searchPlaces,
  geocodePlaceId,
  computeGoogleRoute,
} from "./Functionality";

export default function Dashboard() {
  const FALLBACK = { lat: 12.9716, lng: 77.5946 };

  const [center, setCenter] = useState(FALLBACK);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropQuery, setDropQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [rideTypeId, setRideTypeId] = useState("car");
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  const [status, setStatus] = useState("");
  const [findingDriver, setFindingDriver] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState(null);
  const [routePath, setRoutePath] = useState(null);

  const mapRef = useRef(null);
  const serviceRef = useRef(null);
  const geocoderRef = useRef(null);
  const matchTimer = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // init google services
  useEffect(() => {
    if (isLoaded && window.google) {
      const { autocompleteService, geocoder } = initGoogleServices();
      serviceRef.current = autocompleteService;
      geocoderRef.current = geocoder;
    }
  }, [isLoaded]);

  // set pickup = current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" };
        setPickup(loc);
        setPickupQuery(loc.label);
        setCenter(loc);

        reverseGeocode(geocoderRef.current, loc, (addr) => {
          setPickup((p) => ({ ...p, label: addr }));
          setPickupQuery(addr);
        });
      });
    }
  }, [isLoaded]);

  // compute route
  useEffect(() => {
    if (!pickup || !drop || !isLoaded || !window.google) {
      setRoutePath(null);
      return;
    }

    computeGoogleRoute(
      pickup,
      drop,
      rideTypeId,
      (path, dkm, mins, bounds) => {
        setRoutePath(path);
        setDistanceKm(Number(dkm.toFixed(2)));
        setEtaMin(mins);

        setTimeout(() => {
          if (mapRef.current && bounds) {
            try {
              mapRef.current.fitBounds(bounds);
            } catch (e) {}
          }
        }, 80);
      },
      (dkm, mins, path) => {
        setDistanceKm(Number(dkm.toFixed(2)));
        setEtaMin(mins);
        setRoutePath(path);
      }
    );
  }, [pickup, drop, rideTypeId, isLoaded]);

  // handle place search
  function handlePlaceSearch(input, type) {
    const currentSuggestion = pickup
      ? { id: "__me__", label: `Use my location — ${pickup.label || "Your location"}` }
      : null;

    searchPlaces(serviceRef.current, input, center, currentSuggestion, (results) => {
      if (type === "pickup") setPickupSuggestions(results);
      else setDropSuggestions(results);
    });
  }

  // select suggestion
  function selectSuggestion(s, type) {
    if (s.id === "__me__") {
      if (!pickup) return;
      if (type === "pickup") {
        setPickup(pickup);
        setPickupQuery(pickup.label);
        setPickupSuggestions([]);
        setCenter(pickup);
      } else {
        setDrop(pickup);
        setDropQuery(pickup.label);
        setDropSuggestions([]);
        setCenter(pickup);
      }
      return;
    }

    geocodePlaceId(geocoderRef.current, s.id, (loc) => {
      if (type === "pickup") {
        setPickup(loc);
        setPickupQuery(loc.label);
        setPickupSuggestions([]);
        setCenter(loc);
      } else {
        setDrop(loc);
        setDropQuery(loc.label);
        setDropSuggestions([]);
        setCenter(loc);
      }
    });
  }

  function requestRide() {
    if (!pickup || !drop) {
      setStatus("Please set pickup and drop locations.");
      return;
    }
    setFindingDriver(true);
    setMatchedDriver(null);
    setStatus("Searching for nearby drivers...");

    clearTimeout(matchTimer.current);
    matchTimer.current = setTimeout(() => {
      const d = {
        name: "Mohit Sharma",
        vehicle: "Toyota Innova • KA05AB1234",
        eta: etaMin,
        phone: "+91 98xxxxxxx",
      };
      setMatchedDriver(d);
      setFindingDriver(false);
      setStatus("Driver matched — arriving soon");
    }, 1400);
  }

  function cancelRide() {
    clearTimeout(matchTimer.current);
    setMatchedDriver(null);
    setFindingDriver(false);
    setStatus("");
  }

  const chosenRide = RIDE_TYPES.find((r) => r.id === rideTypeId) || RIDE_TYPES[2];
  const fare = distanceKm ? calcFare(distanceKm, chosenRide) : 0;

  function handleBlur(type) {
    setTimeout(() => {
      if (type === "pickup") setPickupSuggestions([]);
      else setDropSuggestions([]);
    }, 180);
  }

  useEffect(() => {
    return () => clearTimeout(matchTimer.current);
  }
  , [pickup, drop]);

  return (
    <main className="rd-main" role="main">
      {/* Map */}
      <div className="rd-map" aria-label="Map area">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={14}
            options={{ disableDefaultUI: true, clickableIcons: false }}
            onLoad={(map) => (mapRef.current = map)}
          >
            {pickup && <Marker position={{ lat: pickup.lat, lng: pickup.lng }} />}
            {drop && <Marker position={{ lat: drop.lat, lng: drop.lng }} />}
            {routePath && <Polyline path={routePath} options={{ strokeColor: "#4A63E7", strokeWeight: 6 }} />}
          </GoogleMap>
        ) : (
          <div className="rd-map-fallback">Map loading…</div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="rd-card rd-booking" aria-labelledby="booking-title">
        <h2 id="booking-title" className="rd-card-title">Where to?</h2>

        {/* Pickup */}
        <label className="rd-label">Pickup</label>
        <div className="rd-field">
          <input
            type="text"
            placeholder="Enter pickup"
            value={pickupQuery}
            onChange={(e) => {
              setPickupQuery(e.target.value);
              handlePlaceSearch(e.target.value, "pickup");
            }}
            onBlur={() => handleBlur("pickup")}
          />
        </div>
        {pickupSuggestions.length > 0 && (
          <ul className="rd-suggestions" role="listbox">
            {pickupSuggestions.map((s, i) => (
              <li key={s.id} role="option" onClick={() => selectSuggestion(s, "pickup")}>{s.label}</li>
            ))}
          </ul>
        )}

        {/* Drop-off */}
        <label className="rd-label">Drop-off</label>
        <div className="rd-field">
          <input
            type="text"
            placeholder="Enter destination"
            value={dropQuery}
            onChange={(e) => {
              setDropQuery(e.target.value);
              handlePlaceSearch(e.target.value, "drop");
            }}
            onBlur={() => handleBlur("drop")}
          />
        </div>
        {dropSuggestions.length > 0 && (
          <ul className="rd-suggestions" role="listbox">
            {dropSuggestions.map((s, i) => (
              <li key={s.id} role="option" onClick={() => selectSuggestion(s, "drop")}>{s.label}</li>
            ))}
          </ul>
        )}

        {/* Ride selection */}
        <div className="rd-section">
          <div className="rd-section-title">Choose transport</div>
          <div className="rd-mediums">
            {RIDE_TYPES.map((rt) => {
              const selected = rt.id === rideTypeId;
              return (
                <button key={rt.id} className={`rd-medium ${selected ? "selected" : ""}`} onClick={() => setRideTypeId(rt.id)}>
                  <div className="rd-medium-emoji">{rt.emoji}</div>
                  <div className="rd-medium-meta">
                    <div className="rd-medium-name">{rt.name}</div>
                    <div className="rd-medium-sub">{rt.base} + {rt.per_km}/km</div>
                  </div>
                  <div className="rd-medium-right">{rt.eta_min}m</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="rd-summary">
          <div className="rd-dist"><div className="rd-dist-label">Distance</div><div className="rd-dist-value">{distanceKm ? `${distanceKm} km` : "—"}</div></div>
          <div className="rd-fare"><div className="rd-fare-label">Est. Fare</div><div className="rd-fare-value">{fare ? formatINR(fare) : "—"}</div></div>
          <div className="rd-eta"><div className="rd-eta-label">ETA</div><div className="rd-eta-value">{etaMin ? `${etaMin} min` : "—"}</div></div>
        </div>

        {/* Actions */}
        <div className="rd-cta-row">
          <button className="btn btn-ghost" onClick={() => {setDrop(null); setDropQuery(""); setDropSuggestions([]); setStatus(""); setRoutePath(null); }}>Reset</button>
          <button className="btn btn-primary btn-request" disabled={!(pickup && drop) || findingDriver} onClick={requestRide}>{findingDriver ? "Searching…" : "Request Ride"}</button>
          {matchedDriver && <button className="btn btn-success" onClick={() => setStatus("Driver on the way!")}>Driver Arriving</button>}
        </div>

        {status && <div className="rd-status">{status}</div>}
      </aside>
    </main>
  );
}
