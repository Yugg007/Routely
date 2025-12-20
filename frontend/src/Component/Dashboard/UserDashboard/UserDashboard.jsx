// Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import "../Dashboard.css";
import { GoogleMap, Marker, OverlayView, Polyline, useJsApiLoader } from "@react-google-maps/api";

import {
  RIDE_TYPES,
  calcFare,
  formatINR,
  initGoogleServices,
  reverseGeocode,
  searchPlaces,
  geocodePlaceId,
  computeGoogleRoute,
} from "../Functionality";

import { useDispatch, useSelector } from "react-redux";
import { cacheRoute } from "../../../store/routeCacheSlice";
import { BackendService } from "../../../Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "../../../Utils/Api's/ApiEndpoints";
import useWebSocket from "react-use-websocket";

const driversTemp = [
  { lat: 19.1082, lng: 72.8775, icon: "🚘" }, // NE
  { lat: 19.1055, lng: 72.8748, icon: "🛺" }, // SW
  { lat: 19.1090, lng: 72.8752, icon: "🚘" }, // N
  { lat: 19.1060, lng: 72.8780, icon: "🚘" }, // E
  { lat: 19.1075, lng: 72.8735, icon: "🛺" }, // W
  { lat: 19.1100, lng: 72.8768, icon: "🚘" }, // far NE
  { lat: 19.1045, lng: 72.8765, icon: "🚘" }, // far S
  { lat: 19.1078, lng: 72.8790, icon: "🚘" }, // far E
  { lat: 19.1095, lng: 72.8738, icon: "🛺" }, // NW
  { lat: 19.1068, lng: 72.8742, icon: "🚘" }, // SW close
];


export default function UserDashboard() {
  const dispatch = useDispatch();
  const routeCache = useSelector((state) => state?.routeCache?.routes || {});
  const user = useSelector((state) => state?.authCache?.user || null);
  console.log("User from store:", user);
  
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
  const [estimatedFare, setEstimatedFare] = useState(0);

  const [drivers, setDrivers] = useState(driversTemp);

  const mapRef = useRef(null);
  const serviceRef = useRef(null);
  const geocoderRef = useRef(null);
  const matchTimer = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const WS_URL = "wss://localhost:8002/ws/user-socket";

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log("WebSocket connected"),
    onClose: () => console.log("WebSocket disconnected"),
    onError: (err) => console.error("WebSocket error", err),
    shouldReconnect: () => true, // auto reconnect
  });

  // init google services for address suggestion and forward/reverse geocoding(lat/lng ↔ address)
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
        console.log("Got current location:", loc);
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

  useEffect(() => {
    if (pickup && isLoaded) {
      sendMessage(JSON.stringify(pickup));
    }
  }, [pickup, isLoaded]);

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const socketDriver = JSON.parse(lastMessage.data); // converts JSON string → array of objects
      console.log("Drivers list:", drivers);

      // setDrivers(socketDriver);

      // // Example: access first driver's lat/lng
      // if (socketDriver.length > 0) {
      //   console.log("First driver:", socketDriver[0].lat, socketDriver[0].lng);
      // }
      // handleSocketMessage(msg);
    } catch (e) {
      console.warn("Invalid WebSocket message", lastMessage.data);
    }
  }, [lastMessage]);

  const savedToRouteCache = (path, dkm, mins, bounds) => {
    const data = {
      routePath: path,
      distanceKm: dkm,
      durationMin: mins,
      bounds: bounds
    };

    dispatch(cacheRoute({ pickup, drop, rideTypeId, data }));
  }

  const setValuesToStates = (path, dkm, mins, bounds) => {
    setRoutePath(path);
    setDistanceKm(Number(dkm.toFixed(2)));
    setEtaMin(mins);
    setTimeout(() => {
      if (mapRef.current && bounds) {
        try {
          mapRef.current.fitBounds(bounds);
        } catch (e) { }
      }
    }, 80);
    calculateFare(dkm, mins, "car");
  }

  // compute route
  useEffect(() => {
    if (!pickup || !drop || !isLoaded || !window.google) {
      return;
    }


    const key = `${pickup.lat},${pickup.lng}_${drop.lat},${drop.lng}_${rideTypeId}`;
    if (routeCache[key]) {
      console.log("Route from cache:", routeCache[key]);
      const { routePath, distanceKm, durationMin, bounds } = routeCache[key];
      setValuesToStates(routePath, distanceKm, durationMin, bounds);
      return;
    }

    computeGoogleRoute(
      pickup,
      drop,
      rideTypeId,
      (path, dkm, mins, bounds) => {
        setValuesToStates(path, dkm, mins, bounds);
        savedToRouteCache(path, dkm, mins, bounds);
      },
      (dkm, mins, path) => {
        setValuesToStates(path, dkm, mins, null);
        savedToRouteCache(path, dkm, mins, null);
      }
    );
  }, [pickup, drop, isLoaded]);

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
      console.log("Geocoded placeId", s.id, "to", loc);
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

  const requestRide = async () => {
    if (!pickup || !drop) {
      setStatus("Please set pickup and drop locations.");
      return;
    }

    const body = {
      startAddress: pickup.label,
      startLat: String(pickup.lat),
      startLng: String(pickup.lng),
      endAddress: drop.label,
      endLat: String(drop.lat),
      endLng: String(drop.lng),
      rideType: rideTypeId,
      user_id: user?.userId,
      userMobNo: user?.mobileNo,
      name : user?.name
    }

    console.log("Requesting ride with body:", body);

    console.log("Requesting ride:", { pickup, drop, rideTypeId });
    console.log("Pick up query and drop query:", pickupQuery, dropQuery);

    try {
      const response = await BackendService(ApiEndpoints.requestRide, body);
      if (response.data) {
        // setFindingDriver(true);
        // setMatchedDriver(null);
        // setStatus("Searching for nearby drivers...");
      }
    }
    catch (e) {
      console.error("Error requesting ride:", e);
      setStatus("Failed to request ride. Please try again.");
      return;
    }

    // setFindingDriver(true);
    // setMatchedDriver(null);
    // setStatus("Searching for nearby drivers...");

    // clearTimeout(matchTimer.current);
    // matchTimer.current = setTimeout(() => {
    //   const d = {
    //     name: "Mohit Sharma",
    //     vehicle: "Toyota Innova • KA05AB1234",
    //     eta: etaMin,
    //     phone: "+91 98xxxxxxx",
    //   };
    //   setMatchedDriver(d);
    //   setFindingDriver(false);
    //   setStatus("Driver matched — arriving soon");
    // }, 1400);
  }

  function cancelRide() {
    clearTimeout(matchTimer.current);
    setMatchedDriver(null);
    setFindingDriver(false);
    setStatus("");
  }

  const calculateFare = async (distanceKm, durationMin, chosenRide) => {
    console.log("Calculating fare for", distanceKm, "km,", durationMin, "min, ride:", chosenRide);

    try {
      const body = {
        distanceKm,
        durationMin,
        rideType: chosenRide
      }
      const response = await BackendService(ApiEndpoints.estimateFare, body);
      if (response.data && response.data?.estimatedFare) {
        setEstimatedFare(response.data.estimatedFare);
      }

    } catch (error) {
      console.error("Error fetching fare estimate:", error);
    }
    finally {
      return 0;
    }

  }
  const chosenRide = RIDE_TYPES.find((r) => r.id === rideTypeId) || RIDE_TYPES[2];

  function handleBlur(type) {
    setTimeout(() => {
      if (type === "pickup") setPickupSuggestions([]);
      else setDropSuggestions([]);
    }, 180);
  }

  useEffect(() => {
    return () => clearTimeout(matchTimer.current);
  }, [pickup, drop]);


  return (
    <main className="rd-main" role="main">
      {/* Map */}
      <div className="rd-map" aria-label="Map area">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={14}
            onLoad={(map) => (mapRef.current = map)}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "transit",
                  elementType: "labels.icon",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.icon",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "administrative",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            }}
          >
            {/* Pickup marker */}
            {pickup && <Marker position={{ lat: pickup.lat, lng: pickup.lng }} />}

            {/* Drop marker */}
            {drop && <Marker position={{ lat: drop.lat, lng: drop.lng }} />}

            {/* Route path */}
            {routePath && (
              <Polyline
                path={routePath}
                options={{ strokeColor: "#4A63E7", strokeWeight: 6 }}
              />
            )}

            {/* Driver cars (emoji only) */}
            {drivers.map((driver, index) => (
              <OverlayView
                key={index}
                position={{ lat: driver.lat, lng: driver.lng }}
                mapPaneName={OverlayView.MARKER_LAYER}
              >
                <div style={{ fontSize: "28px" }}>{RIDE_TYPES[0]?.emoji}</div>
              </OverlayView>
            ))}
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
                  <div className="rd-medium-name">{rt.name}</div>
                  <div className="rd-medium-sub">{rt.base} + {rt.per_km}/km*</div>
                  {/* <div className="rd-medium-meta">
                  </div> */}
                  {/* <div className="rd-medium-right">{rt.eta_min}m</div> */}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="rd-summary">
          <div className="rd-dist"><div className="rd-dist-label">Distance</div><div className="rd-dist-value">{distanceKm ? `${distanceKm} km` : "—"}</div></div>
          <div className="rd-fare"><div className="rd-fare-label">Est. Fare</div><div className="rd-fare-value">{estimatedFare ? formatINR(estimatedFare) : "—"}</div></div>
          <div className="rd-eta"><div className="rd-eta-label">ETA</div><div className="rd-eta-value">{etaMin ? `${etaMin} min` : "—"}</div></div>
        </div>

        {/* Actions */}
        <div className="rd-cta-row">
          <button className="btn btn-ghost" onClick={() => { setDrop(null); setDropQuery(""); setDropSuggestions([]); setStatus(""); setRoutePath(null); }}>Reset</button>
          <button className="btn btn-primary btn-request" disabled={!(pickup && drop) || findingDriver} onClick={requestRide}>{findingDriver ? "Searching…" : "Request Ride"}</button>
          {matchedDriver && <button className="btn btn-success" onClick={() => setStatus("Driver on the way!")}>Driver Arriving</button>}
        </div>

        {status && <div className="rd-status">{status}</div>}
      </aside>
    </main>
  );
}
