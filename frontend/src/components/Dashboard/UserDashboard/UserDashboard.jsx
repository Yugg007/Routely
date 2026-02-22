// Dashboard.jsx
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "../Dashboard.css";
import { GoogleMap, Marker, OverlayView, Polyline, useJsApiLoader } from "@react-google-maps/api";

import {
  initGoogleServices,
  reverseGeocode,
  searchPlaces,
  geocodePlaceId,
  computeGoogleRoute,
} from "../Functionality";

import { useDispatch, useSelector } from "react-redux";
import { cacheRoute } from "../../../store/routeCacheSlice";
import { BackendService } from "../../../utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "../../../utils/ApiConfig/ApiEndpoints";
import useWebSocket from "react-use-websocket";
import Property from "../../../constants/Property";
import Data from "../../../constants/Data";
import STATE from "../../../constants/States";
import Constants from "../../../constants/Constant";
import WebSocketAction from "../../../constants/WebSocketAction";
import GoogleMapComponent from "./GoogleMapComponent";
import SideBar from "./SideBar";
import { ACTOR_STATE, ID, setAuthSession, updateUserWorkflowState } from "../../../store/authCacheSlice";
import { useLazySocket } from "../../WebSocketHandler/useLazySocket";
const WS_URL = Property.User_WS_URL;

const driversTempLocation = Data.Drivers_Temp_Location;
const FALLBACK = Data.USER_FALLBACK;
const UserLocationPingInterval = Constants.USER_LOCATION_PING_INTERVAL;
const UserMapLibrarys = Constants.MAP_LIBRARYS;
const USER_WEBSOCKET_ACTIONS = WebSocketAction.USER_WEBSOCKET_ACTIONS;
const USER_STATES = STATE.USER_STATES;

const UserDashboard = () => {
  const dispatch = useDispatch();
  const id = useSelector(ID);
  const actorState = useSelector(ACTOR_STATE);
  const routeCache = useSelector((state) => state?.routeCache?.routes || {});

  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]);


  // Map and location states
  const [location, setLocation] = useState({
    center: FALLBACK,
    pickup: null,
    drop: null,
    routePath: null,
    drivers: driversTempLocation
  });

  //Search and UI Suggestions states
  const [search, setSearch] = useState({
    pickupQuery: "",
    dropQuery: "",
    pickupSuggestions: [],
    dropSuggestions: []
  });

  // Ride details and status states
  const [ride, setRide] = useState({
    rideTypeId: "car",
    distanceKm: 0,
    etaMin: 0,
    estimatedFare: 0
  });

  const mapRef = useRef(null);
  const serviceRef = useRef(null);
  const geocoderRef = useRef(null);
  const matchTimer = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: UserMapLibrarys,
  });

  const handleWebSocketResponseMessage = useCallback((event) => {
    try {
      const { type, payload } = JSON.parse(event.data);

      // Log using a structured format for easier debugging in production
      console.debug(`[WS RECV] Type: ${type}`, payload);

      switch (type) {
        case 'DriverLocationAround3Km':
        case USER_WEBSOCKET_ACTIONS.AVAILABLE_DRIVER:
          if (Array.isArray(payload)) {
            // Update location only if we have driver data
            setLocation(prev => ({
              ...prev,
              drivers: payload
            }));
          }
          break;
        case USER_WEBSOCKET_ACTIONS.USER_LOCATION_SYNC:
          break;

        case STATE.STATE_CHANGE:
          handleStateChange(payload);
          break;

        case 'ERROR':
          setBooking(prev => ({
            ...prev,
            status: `Error Code: ${payload?.code || 'UNKNOWN_ERROR'}`
          }));
          break;

        default:
          console.warn(`[WS] Unhandled message type: ${type}`);
      }
    } catch (error) {
      console.error("[WS] Failed to parse message:", error);
    }
  }, [handleStateChange]); // Ensure all external functions used inside are in dependencies


  const onMessageReceived = useCallback((event) => {
    handleWebSocketResponseMessage(event);
  }, [handleWebSocketResponseMessage]); // Stable reference

  const { handleWebSocketRequestMessage, startConnection, stopConnection, readyState } = useLazySocket(onMessageReceived, WS_URL);


  const calculateFare = async (dKm, dMin, type) => {
    try {
      const response = await BackendService(ApiEndpoints.estimateFare, {
        distanceKm: dKm,
        durationMin: dMin,
        rideType: type
      });
      if (response.data?.estimatedFare) {
        setRide(prev => ({ ...prev, estimatedFare: response.data.estimatedFare }));
      }
    } catch (error) {
      console.error("Fare error:", error);
    }
  };

  // Update logic example for computing a route
  const setValuesToStates = useCallback((path, dkm, mins, bounds) => {
    setLocation(prev => ({ ...prev, routePath: path }));
    setRide(prev => ({
      ...prev,
      distanceKm: Number(dkm.toFixed(2)),
      etaMin: mins
    }));

    setTimeout(() => {
      if (mapRef.current && bounds) {
        try {
          mapRef.current.fitBounds(bounds);
        } catch (e) { console.error("Map bounds error", e); }
      }
    }, 80);

    // We pass the current rideTypeId from the state
    calculateFare(dkm, mins, ride.rideTypeId);
  }, [ride.rideTypeId]);


  // init google services for address suggestion and forward/reverse geocoding(lat/lng ↔ address)
  useEffect(() => {
    if (isLoaded && window.google && !serviceRef.current && !geocoderRef.current) {
      const { autocompleteService, geocoder } = initGoogleServices();
      serviceRef.current = autocompleteService;
      geocoderRef.current = geocoder;
      startConnection();
    }
  }, [isLoaded]);

  const pickAndDropLocationUpdateRequired = () => {
    if (actorState === USER_STATES.IDLE) return true;
    return false;
  }
  const getCurrentLocationAndAddress = useCallback(() => {
    if (navigator.geolocation && isLoaded) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" };

        if (pickAndDropLocationUpdateRequired()) {
          setLocation(prev => ({ ...prev, center: loc, pickup: loc }));
          setSearch(prev => ({ ...prev, pickupQuery: loc.label }));

          reverseGeocode(geocoderRef.current, loc, (addr) => {
            setSearch(prev => ({ ...prev, pickupQuery: addr }));
            setLocation(prev => ({ ...prev, pickup: { ...loc, label: addr } }));
          });
        }
        else {
          setLocation(prev => ({ ...prev, center: loc }));
        }
      });
    }
  }, [isLoaded, id]);

  // A. Get current location on load
  useEffect(() => {
    getCurrentLocationAndAddress();
  }, [isLoaded]);

  // B. WebSocket: Ping server when pickup changes
  const lastEmitTime = useRef(Date.now());

  useEffect(() => {

    if (matchTimer.current) clearInterval(matchTimer.current);

    matchTimer.current = setInterval(() => {
      let now = Date.now();
      let shoulEmit = (now - lastEmitTime.current) >= UserLocationPingInterval;
      lastEmitTime.current = now;
      if (location.pickup && shoulEmit) {
        const payload = { id, ...location.pickup };
        handleWebSocketRequestMessage(USER_WEBSOCKET_ACTIONS.USER_LOCATION_PUSH, payload);
      }
    }, UserLocationPingInterval);

    return () => {
      if (matchTimer.current) clearInterval(matchTimer.current);
    };

  }, [location.pickup]);

  useEffect(() => {
    if (!location.pickup || !location.drop || !isLoaded) return;

    const key = `${location.pickup.lat},${location.pickup.lng}_${location.drop.lat},${location.drop.lng}_${ride.rideTypeId}`;

    if (routeCache[key]) {
      const { routePath, distanceKm, durationMin, bounds } = routeCache[key];
      setValuesToStates(routePath, distanceKm, durationMin, bounds);
      return;
    }

    computeGoogleRoute(
      location.pickup,
      location.drop,
      ride.rideTypeId,
      (path, dkm, mins, bounds) => {
        setValuesToStates(path, dkm, mins, bounds);
      },
      (dkm, mins, path) => {
        setValuesToStates(path, dkm, mins, null);
      }
    );
  }, [location.drop, ride.rideTypeId, isLoaded]);

  // D. Handle Place Search Suggestions
  function handlePlaceSearch(input, type) {
    const currentSuggestion = location.pickup
      ? { id: "__me__", label: `Use my location — ${location.pickup.label || "Your location"}` }
      : null;

    searchPlaces(serviceRef.current, input, location.center, currentSuggestion, (results) => {
      setSearch(prev => ({
        ...prev,
        [type === "pickup" ? "pickupSuggestions" : "dropSuggestions"]: results
      }));
    });
  }

  function handleBlur(type) {
    setTimeout(() => {
      setSearch(prev => ({
        ...prev,
        [type === "pickup" ? "pickupSuggestions" : "dropSuggestions"]: []
      }));
    }, 180);
  }

  function selectSuggestion(s, type) {
    // Handle "Use my location" selection
    if (s.id === "__me__") {
      if (!location.pickup) return;

      if (type === "pickup") {
        // If setting pickup to current location (already in state)
        setSearch(prev => ({
          ...prev,
          pickupQuery: location.pickup.label,
          pickupSuggestions: []
        }));
        setLocation(prev => ({ ...prev, center: location.pickup }));
      } else {
        // If setting drop to the current location coordinates
        setSearch(prev => ({
          ...prev,
          dropQuery: location.pickup.label,
          dropSuggestions: []
        }));
        setLocation(prev => ({ ...prev, drop: location.pickup }));
      }
      return;
    }

    // Handle Google Places API selection
    geocodePlaceId(geocoderRef.current, s.id, (loc) => {
      if (type === "pickup") {
        // Update location and search objects for Pickup
        setLocation(prev => ({
          ...prev,
          pickup: loc,
          center: loc
        }));
        setSearch(prev => ({
          ...prev,
          pickupQuery: loc.label,
          pickupSuggestions: []
        }));
      } else {
        // Update location and search objects for Drop
        setLocation(prev => ({
          ...prev,
          drop: loc
        }));
        setSearch(prev => ({
          ...prev,
          dropQuery: loc.label,
          dropSuggestions: []
        }));
        // Note: We usually don't move the center for the drop-off 
        // so the user can still see their pickup point.
      }
    });
  }

  return (
    <main className="rd-main" role="main">
      {/* Map */}
      <div className="rd-map" aria-label="Map area">
        {isLoaded ? (
          <GoogleMapComponent
            center={location.center}
            pickup={location.pickup}
            drop={location.drop}
            routePath={location.routePath}
            drivers={location.drivers}
            mapRef={mapRef}
            actorState={actorState}
          />

        ) : (
          <div className="rd-map-fallback">Map loading…</div>
        )}
      </div>

      <SideBar
        // Pass objects instead of 15 individual props
        search={search}
        setSearch={setSearch}
        ride={ride}
        setRide={setRide}
        location={location}
        setLocation={setLocation}
        handlePlaceSearch={handlePlaceSearch}
        selectSuggestion={selectSuggestion}
        handleBlur={handleBlur}
      />
    </main>
  );
};

export default UserDashboard;