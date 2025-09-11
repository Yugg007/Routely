// RoutelyDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import "./Dashboard.css";

/**
 * Laptop-optimized Routely Dashboard
 * - Top sticky navbar
 * - Map area uses remaining height (100% of space beneath navbar)
 * - Floating booking form (pickup default = current location)
 *
 * NOTE: This component uses a nice SVG placeholder map. If you want a real
 * map later, mount Mapbox/Google inside the element with class `rd-map-svg`
 * (see comment in code).
 */

/* ------------------ Mock data ------------------ */
const MOCK_PLACES = [
  { id: 1, label: "Home — K.R. Puram, Bangalore", lat: 12.978, lng: 77.640 },
  { id: 2, label: "Work — MG Road, Bangalore", lat: 12.9719, lng: 77.6412 },
  { id: 3, label: "Airport — Kempegowda Int'l", lat: 13.1986, lng: 77.7066 },
  { id: 4, label: "Whitefield, Bangalore", lat: 12.9697, lng: 77.7490 },
];

/* Transport options */
const RIDE_TYPES = [
  { id: "bike", name: "Bike", emoji: "🚲", base: 20, per_km: 6, eta_min: 2 },
  { id: "auto", name: "Auto", emoji: "🛺", base: 30, per_km: 8, eta_min: 4 },
  { id: "car", name: "Car", emoji: "🚗", base: 50, per_km: 10, eta_min: 6 },
  { id: "premier", name: "Premier", emoji: "🚘", base: 120, per_km: 18, eta_min: 8 },
];

/* ------------------ Helpers ------------------ */
const toFixedNoSci = (n, d = 2) => Number(n.toFixed(d));

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function metersPerDegreeLat() {
  return 111320; // approx
}
function metersPerDegreeLon(latDeg) {
  return 111320 * Math.cos((latDeg * Math.PI) / 180);
}

/* Simple fare function */
function calcFare(distanceKm, rideType) {
  const base = rideType.base;
  const per = rideType.per_km;
  const dynamic = Math.max(0, distanceKm - 2) * 0.05 * (per * distanceKm);
  return Math.max(1, Math.round(base + per * distanceKm + dynamic));
}

/* format INR */
function formatINR(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ------------------ Component ------------------ */
export default function Dashboard() {
  // fallback center (Bengaluru)
  const FALLBACK = { lat: 12.9715987, lng: 77.5945627 };

  const [center, setCenter] = useState(FALLBACK); // map center (pickup)
  const [pickup, setPickup] = useState({ ...FALLBACK, label: "Current location" });
  const [drop, setDrop] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [rideTypeId, setRideTypeId] = useState(() => localStorage.getItem("routely_ride") || "car");
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  const [status, setStatus] = useState(""); // status text for overlays
  const [findingDriver, setFindingDriver] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState(null);

  const svgRef = useRef(null);
  const searchTimer = useRef(null);
  const matchTimer = useRef(null);

  /* --- get current location on mount --- */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter({ lat, lng });
          setPickup({ lat, lng, label: "Current location" });
          setStatus("Using your current location");
        },
        (err) => {
          console.warn("Geolocation failed:", err?.message);
          setStatus("Location not available — using fallback city center");
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    } else {
      setStatus("Geolocation not supported — using fallback city center");
    }

    return () => {
      clearTimeout(searchTimer.current);
      clearTimeout(matchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- compute derived values when pickup/drop/ride change --- */
  useEffect(() => {
    if (!drop) {
      setDistanceKm(0);
      setEtaMin(0);
      return;
    }
    const dkm = haversineDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
    setDistanceKm(Number(dkm.toFixed(2)));
    const rt = RIDE_TYPES.find((r) => r.id === rideTypeId) || RIDE_TYPES[2];
    const estEta = Math.max(rt.eta_min, Math.ceil(dkm / 1.6)); // rough
    setEtaMin(estEta);
    localStorage.setItem("routely_ride", rideTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drop, pickup, rideTypeId]);

  /* --- debounce search suggestions --- */
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = query.trim().toLowerCase();
      const results = MOCK_PLACES.filter((p) => p.label.toLowerCase().includes(q));
      // If no local result, add a synthetic "search place" suggestion
      const extended = results.length ? results : [{ id: "s", label: `Search: "${query}"`, lat: pickup.lat + 0.02, lng: pickup.lng + 0.02 }];
      setSuggestions(extended);
    }, 240);
    return () => clearTimeout(searchTimer.current);
  }, [query, pickup.lat, pickup.lng]);

  /* --- swap pickup & drop --- */
  function swap() {
    if (!drop) return;
    const prevPickup = { ...pickup };
    setPickup({ lat: drop.lat, lng: drop.lng, label: drop.label || "Drop location" });
    setDrop({ lat: prevPickup.lat, lng: prevPickup.lng, label: prevPickup.label || "Pickup location" });
    setStatus("Swapped pickup & destination");
  }

  /* --- select suggestion --- */
  function chooseSuggestion(s) {
    setDrop({ lat: s.lat, lng: s.lng, label: s.label });
    setQuery("");
    setSuggestions([]);
    setStatus(`Selected ${s.label}`);
  }

  /* --- request ride (simulated) --- */
  function requestRide() {
    if (!drop) {
      setStatus("Please enter a drop-off location.");
      return;
    }
    setFindingDriver(true);
    setStatus("Searching for drivers nearby…");
    setMatchedDriver(null);

    matchTimer.current = setTimeout(() => {
      const rt = RIDE_TYPES.find((r) => r.id === rideTypeId) || RIDE_TYPES[2];
      const d = {
        name: "Mohit Sharma",
        vehicle: "Toyota Innova • KA05AB1234",
        eta: etaMin,
        phone: "+91 98xxxxxxx",
      };
      setMatchedDriver(d);
      setFindingDriver(false);
      setStatus("Driver matched — arriving soon");
    }, 1600);
  }

  function cancelRide() {
    setFindingDriver(false);
    setMatchedDriver(null);
    setStatus("Ride cancelled");
    clearTimeout(matchTimer.current);
  }

  /* --- projection to SVG coords (viewBox 1000 x 600) --- */
  function projectLatLngToSvg(lat, lng) {
    // center at pickup (center)
    const vbW = 1000;
    const vbH = 600;
    const padding = 80;
    const centerX = vbW / 2;
    const centerY = vbH / 2;

    const mPerDegLat = metersPerDegreeLat();
    const mPerDegLon = metersPerDegreeLon(center.lat);

    // deltas in meters
    const dx = (lng - center.lng) * mPerDegLon;
    const dy = (lat - center.lat) * mPerDegLat;

    // compute a sensible max range so points are visible
    const dxAbs = Math.abs(dx);
    const dyAbs = Math.abs(dy);
    const maxRange = Math.max(1000, dxAbs * 1.6, dyAbs * 1.6, 4000); // meters
    const pixelPerMeter = (vbW / 2 - padding) / maxRange;

    const px = centerX + dx * pixelPerMeter;
    const py = centerY - dy * pixelPerMeter;

    return { x: px, y: py };
  }

  /* --- get ride type details --- */
  const chosenRide = RIDE_TYPES.find((r) => r.id === rideTypeId) || RIDE_TYPES[2];
  const fare = distanceKm ? calcFare(distanceKm, chosenRide) : 0;

  /* --- small UI helpers --- */
  const placeHolderText = pickup && pickup.label ? pickup.label : "Current location";

  return (
    <div >
      {/* Main area — map occupies remaining height */}
      <main className="rd-main" role="main">
        {/* Map container (SVG placeholder) */}
        <div className="rd-map" aria-label="Map area">
          {/* Replace this SVG with a real map (Mapbox/Leaflet/Google) by mounting inside .rd-map */}
          <svg ref={svgRef} viewBox="0 0 1000 600" className="rd-map-svg" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#f8fbff"/>
                <stop offset="1" stopColor="#eef6ff"/>
              </linearGradient>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="18" floodColor="#1e293b" floodOpacity="0.06"/>
              </filter>
            </defs>

            <rect x="0" y="0" width="1000" height="600" fill="url(#sky)"/>
            {/* grid / rivers / land shapes decorative */}
            <g opacity="0.06">
              <path d="M50 520 C 160 420, 260 360, 360 360 S 560 300, 720 220 900 200, 980 120" stroke="#4A63E7" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M40 420 C 140 360, 240 300, 360 280" stroke="#36D399" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </g>

            {/* compute marker positions */}
            {(() => {
              const pick = { lat: pickup.lat, lng: pickup.lng };
              const pickPt = projectLatLngToSvg(pick.lat, pick.lng);
              const dropPt = drop ? projectLatLngToSvg(drop.lat, drop.lng) : null;

              return (
                <g>
                  {/* route line */}
                  {dropPt && (
                    <path
                      d={`M ${pickPt.x} ${pickPt.y} L ${dropPt.x} ${dropPt.y}`}
                      stroke="#4A63E7"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                      strokeOpacity="0.96"
                    />
                  )}

                  {/* pickup marker (center) */}
                  <g transform={`translate(${pickPt.x}, ${pickPt.y})`} filter="url(#soft)">
                    <circle r="14" fill="#fff" stroke="#4A63E7" strokeWidth="4"/>
                    <circle r="6" fill="#4A63E7"/>
                  </g>

                  {/* drop marker */}
                  {dropPt && (
                    <g transform={`translate(${dropPt.x}, ${dropPt.y})`} >
                      <circle r="12" fill="#fff" stroke="#36D399" strokeWidth="3"/>
                      <text x="18" y="6" fontSize="12" fill="#0f172a" fontWeight="700">{drop.label ? drop.label.split("—")[0] : "Drop"}</text>
                    </g>
                  )}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Floating booking card */}
        <aside className="rd-card rd-booking" aria-labelledby="booking-title">
          <h2 id="booking-title" className="rd-card-title">Where to?</h2>

          <label className="rd-label">Pickup</label>
          <div className="rd-field">
            <input
              type="text"
              value={placeHolderText}
              readOnly
              aria-label="Pickup location (current location)"
              title="Current location (click to allow location access in browser)"
              onClick={() => {
                // hint: click to re-get geolocation
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current location" });
                      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude});
                      setStatus("Updated to current location");
                    },
                    () => setStatus("Unable to access current location"),
                    { enableHighAccuracy: false, timeout: 6000 }
                  );
                } else {
                  setStatus("Geolocation not supported");
                }
              }}
            />
            <button className="icon-swap" aria-label="Swap pickup and drop" onClick={swap}>⇅</button>
          </div>

          <label className="rd-label">Drop-off</label>
          <div className="rd-field">
            <input
              type="search"
              placeholder="Enter destination or landmark"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search drop-off location"
            />
          </div>

          {suggestions.length > 0 && (
            <ul className="rd-suggestions" role="listbox" aria-label="Suggestions">
              {suggestions.map((s) => (
                <li key={s.id} role="option" onClick={() => chooseSuggestion(s)}>{s.label}</li>
              ))}
            </ul>
          )}

          <div className="rd-section">
            <div className="rd-section-title">Choose transport</div>
            <div className="rd-mediums">
              {RIDE_TYPES.map((rt) => {
                const selected = rt.id === rideTypeId;
                return (
                  <button
                    key={rt.id}
                    className={`rd-medium ${selected ? "selected" : ""}`}
                    onClick={() => setRideTypeId(rt.id)}
                    aria-pressed={selected}
                  >
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

          <div className="rd-summary">
            <div className="rd-dist">
              <div className="rd-dist-label">Distance</div>
              <div className="rd-dist-value">{distanceKm ? `${distanceKm} km` : "—"}</div>
            </div>
            <div className="rd-fare">
              <div className="rd-fare-label">Est. Fare</div>
              <div className="rd-fare-value">{fare ? formatINR(fare) : "—"}</div>
            </div>
            <div className="rd-eta">
              <div className="rd-eta-label">ETA</div>
              <div className="rd-eta-value">{distanceKm ? `${etaMin} min` : "—"}</div>
            </div>
          </div>

          <div className="rd-cta-row">
            <button className="btn btn-ghost" onClick={() => { setDrop(null); setQuery(""); setSuggestions([]); setStatus(""); }}>Reset</button>

            {!findingDriver && !matchedDriver && (
              <button className="btn btn-primary" onClick={requestRide}>Request Ride</button>
            )}

            {findingDriver && (
              <button className="btn btn-loading" disabled>Searching…</button>
            )}

            {matchedDriver && (
              <button className="btn btn-success" onClick={() => setStatus("Driver on the way!")}>Driver Arriving</button>
            )}
          </div>

          {/* extra help */}
          <div className="rd-help">
            <small>Tip: Click Pickup to refresh your current location. Map is illustrative — connect a real map for routing.</small>
          </div>
        </aside>

        {/* bottom-right matched driver / live card */}
        {(findingDriver || matchedDriver) && (
          <div className="rd-live">
            <div className="rd-live-left">
              <div className="rd-live-title">{findingDriver ? "Finding driver…" : "Driver matched"}</div>
              <div className="rd-live-sub">{matchedDriver ? matchedDriver.name + " • " + matchedDriver.vehicle : "Looking for drivers nearby"}</div>
            </div>
            <div className="rd-live-actions">
              {matchedDriver ? (
                <>
                  <button className="btn btn-ghost" onClick={() => setStatus("Called driver")}>Call</button>
                  <button className="btn btn-danger" onClick={cancelRide}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={cancelRide}>Cancel</button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// export default Dashboard