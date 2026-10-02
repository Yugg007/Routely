// Dashboard.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import "../Dashboard.css";
import {
  GoogleMap,
  Marker,
  OverlayView,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

import {
  initGoogleServices,
  reverseGeocode,
  searchPlaces,
  geocodePlaceId,
  computeGoogleRoute,
} from "../Functionality";

import { useDispatch, useSelector } from "react-redux";
import { BackendService } from "../../../utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "../../../utils/ApiConfig/ApiEndpoints";
import Property from "../../../constants/Property";
import Data from "../../../constants/Data";
import STATE from "../../../constants/States";
import Constants from "../../../constants/Constant";
import WebSocketAction from "../../../constants/WebSocketAction";
import GoogleMapComponent from "./GoogleMapComponent/GoogleMapComponent";
import SideBar from "./SideBar/SideBar";
import {
  ACTOR_STATE,
  ID,
  updateUserWorkflowState,
} from "../../../store/authCacheSlice";
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
  console.log("UserDashboard: actorState = ", actorState, "id = ", id);
  const routeCache = useSelector((state) => state?.routeCache?.routes || {});
  const [, setMapRevision] = useState(0);

  const refreshMap = useCallback(() => {
    setMapRevision((revision) => revision + 1);
  }, []);

  const handleStateChange = useCallback(
    (newState) => {
      dispatch(updateUserWorkflowState(newState));
    },
    [dispatch, updateUserWorkflowState],
  );

  // Map and location states
  const locationRef = useRef({
    center: null,
    pickup: null,
    drop: null,
    routePath: null,
    drivers: driversTempLocation,
    rideDriver: null,
  });

  //Search and UI Suggestions states
  const [search, setSearch] = useState({
    pickupQuery: "",
    dropQuery: "",
    pickupSuggestions: [],
    dropSuggestions: [],
  });

  // Ride details and status states
  const [ride, setRide] = useState({
    rideTypeId: "car",
    distanceKm: 0,
    etaMin: 0,
    estimatedFare: 0,
  });

  const mapRef = useRef(null);
  const serviceRef = useRef(null);
  const geocoderRef = useRef(null);
  const matchTimer = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: UserMapLibrarys,
  });

  const updateLocationRef = useCallback((driverPayload) => {
    if (!driverPayload) return;

    const prev = locationRef.current;

    // Log previous state
    console.log("Previous location ref:", prev);

    locationRef.current = {
      ...prev,
      rideDriver: {
        ...prev.rideDriver,
        ...driverPayload,
      },
    };
    // alert("Driver location updated: " + JSON.stringify(locationRef.current.rideDriver));
    refreshMap();
  }, [refreshMap]);

  const handleWebSocketResponseMessage = useCallback(
    (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        // Log using a structured format for easier debugging in production
        console.debug(`[WS RECV] Type: ${type}`, payload);

        switch (type) {
          case "DriverLocationAround3Km":
          case USER_WEBSOCKET_ACTIONS.AVAILABLE_DRIVERS:
            if (Array.isArray(payload)) {
              // Update location only if we have driver data
              locationRef.current.drivers = payload;
              refreshMap();
            }
            break;

          case USER_WEBSOCKET_ACTIONS.DRIVER_LOCATION_SYNCED:
            console.log("Driver location synced payload: ", payload);
            if (Array.isArray(payload) && payload.length > 0) {
              updateLocationRef(payload[0]);
            } else if (payload && typeof payload === "object") {
              updateLocationRef(payload);
            }
            break;

          case USER_WEBSOCKET_ACTIONS.USER_LOCATION_SYNCED:
            break;

          case STATE.STATE_CHANGE:
            handleStateChange(payload);
            break;

          case "ERROR":
            console.error(
              `[WS] Server error: ${payload?.code || "UNKNOWN_ERROR"}`,
              payload,
            );
            break;

          default:
            console.warn(`[WS] Unhandled message type: ${type}`);
        }
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
      }
    },
    [handleStateChange, refreshMap, updateLocationRef],
  ); // Ensure all external functions used inside are in dependencies

  const onMessageReceived = useCallback(
    (event) => {
      handleWebSocketResponseMessage(event);
    },
    [handleWebSocketResponseMessage],
  ); // Stable reference

  const {
    handleWebSocketRequestMessage,
    startConnection,
  } = useLazySocket(onMessageReceived, WS_URL);

  const calculateFare = async (dKm, dMin, type) => {
    try {
      const response = await BackendService(ApiEndpoints.estimateFare, {
        distanceKm: dKm,
        durationMin: dMin,
        rideType: type,
      });
      if (response.data?.estimatedFare) {
        setRide((prev) => ({
          ...prev,
          estimatedFare: response.data.estimatedFare,
        }));
      }
    } catch (error) {
      console.error("Fare error:", error);
    }
  };

  // Update logic example for computing a route
  const setValuesToStates = useCallback(
    (path, dkm, mins, bounds) => {
      locationRef.current.routePath = path;
      refreshMap();
      setRide((prev) => ({
        ...prev,
        distanceKm: Number(dkm.toFixed(2)),
        etaMin: mins,
      }));

      setTimeout(() => {
        if (mapRef.current && bounds) {
          try {
            mapRef.current.fitBounds(bounds);
          } catch (e) {
            console.error("Map bounds error", e);
          }
        }
      }, 80);

      // We pass the current rideTypeId from the state
      calculateFare(dkm, mins, ride.rideTypeId);
    },
    [ride.rideTypeId, refreshMap],
  );

  // init google services for address suggestion and forward/reverse geocoding(lat/lng ↔ address)
  useEffect(() => {
    if (
      isLoaded &&
      window.google &&
      !serviceRef.current &&
      !geocoderRef.current
    ) {
      const { autocompleteService, geocoder } = initGoogleServices();
      serviceRef.current = autocompleteService;
      geocoderRef.current = geocoder;
      startConnection();
    }
  }, [isLoaded]);

  const pickAndDropLocationUpdateRequired = () => {
    if (
      actorState === USER_STATES.IDLE ||
      actorState == null ||
      actorState === USER_STATES.ON_TRIP
    )
      return true;
    return false;
  };
  const getCurrentLocationAndAddress = useCallback(() => {
    if (navigator.geolocation && isLoaded) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        };

        if (pickAndDropLocationUpdateRequired()) {
          let newPickUp = locationRef.current.pickup
            ? locationRef.current.pickup
            : loc;
          let newCenter = locationRef.current.center || loc;

          locationRef.current.center = newCenter;
          locationRef.current.pickup = newPickUp;
          refreshMap();

          setSearch((prev) => ({
            ...prev,
            pickupQuery: newPickUp.label || "Your location",
          }));

          reverseGeocode(geocoderRef.current, loc, (addr) => {
            let newPickUpQuery = search.pickupQuery || addr;
            let newLabel = locationRef.current.pickup?.label || addr;

            setSearch((prev) => ({ ...prev, pickupQuery: newPickUpQuery }));
            locationRef.current.pickup = { ...newPickUp, label: newLabel };
            refreshMap();
          });
        } else {
          let newCenter = locationRef.current.center || loc;
          locationRef.current.center = newCenter;
          refreshMap();
        }
      });
    }
  }, [isLoaded, id, refreshMap]);

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
      let shoulEmit = now - lastEmitTime.current >= UserLocationPingInterval;
      lastEmitTime.current = now;
      if (locationRef.current.pickup && shoulEmit) {
        const payload = { id, ...locationRef.current.pickup };
        handleWebSocketRequestMessage(
          USER_WEBSOCKET_ACTIONS.USER_LOCATION_PUSH,
          payload,
        );
      }
    }, UserLocationPingInterval);

    return () => {
      if (matchTimer.current) clearInterval(matchTimer.current);
    };
  }, []);

  const { pickup, drop } = locationRef.current;

  useEffect(() => {
    if (!pickup || !drop || !isLoaded) return;

    const key = `${pickup.lat},${pickup.lng}_${drop.lat},${drop.lng}_${ride.rideTypeId}`;
    if (routeCache[key]) {
      const { routePath, distanceKm, durationMin, bounds } = routeCache[key];
      setValuesToStates(routePath, distanceKm, durationMin, bounds);
      return;
    }

    computeGoogleRoute(
      pickup,
      drop,
      ride.rideTypeId,
      (path, dkm, mins, bounds) => {
        setValuesToStates(path, dkm, mins, bounds);
      },
      (dkm, mins, path) => {
        setValuesToStates(path, dkm, mins, null);
      },
    );
  }, [pickup, drop, ride.rideTypeId, isLoaded]);

  // D. Handle Place Search Suggestions
  function handlePlaceSearch(input, type) {
    const currentSuggestion = locationRef.current.pickup
      ? {
          id: "__me__",
          label: `Use my location — ${locationRef.current.pickup.label || "Your location"}`,
        }
      : null;

    searchPlaces(
      serviceRef.current,
      input,
      locationRef.current.center,
      currentSuggestion,
      (results) => {
        console.log("Place search results: ", results);
        setSearch((prev) => ({
          ...prev,
          [type === "pickup" ? "pickupSuggestions" : "dropSuggestions"]:
            results,
        }));
      },
    );
  }

  function handleBlur(type) {
    setTimeout(() => {
      setSearch((prev) => ({
        ...prev,
        [type === "pickup" ? "pickupSuggestions" : "dropSuggestions"]: [],
      }));
    }, 180);
  }

  function selectSuggestion(s, type) {
    // Handle "Use my location" selection
    if (s.id === "__me__") {
      if (!locationRef.current.pickup) return;

      if (type === "pickup") {
        setSearch((prev) => ({
          ...prev,
          pickupQuery: locationRef.current.pickup.label,
          pickupSuggestions: [],
        }));
        locationRef.current.center = locationRef.current.pickup;
        refreshMap();
      } else {
        setSearch((prev) => ({
          ...prev,
          dropQuery: locationRef.current.pickup.label,
          dropSuggestions: [],
        }));
        locationRef.current.drop = locationRef.current.pickup;
        refreshMap();
      }
      return;
    }

    // Handle Google Places API selection
    geocodePlaceId(geocoderRef.current, s.id, (loc) => {
      if (type === "pickup") {
        locationRef.current.pickup = loc;
        locationRef.current.center = loc;
        refreshMap();
        setSearch((prev) => ({
          ...prev,
          pickupQuery: loc.label,
          pickupSuggestions: [],
        }));
      } else {
        locationRef.current.drop = loc;
        refreshMap();
        setSearch((prev) => ({
          ...prev,
          dropQuery: loc.label,
          dropSuggestions: [],
        }));
}
    });
  }

  const driverLocationIntervalRef = useRef(null);

  useEffect(() => {
    if (driverLocationIntervalRef.current) {
      clearInterval(driverLocationIntervalRef.current);
      driverLocationIntervalRef.current = null;
    }

    if (
      actorState === USER_STATES.WAITING_FOR_DRIVER &&
      ride &&
      ride.status === "ACCEPTED"
    ) {
      const syncDriverLocation = async () => {
        try {
          handleWebSocketRequestMessage(
            USER_WEBSOCKET_ACTIONS.DRIVER_LOCATION_SYNCED,
            {
              driverId: ride.driverId,
            },
          );
        } catch (err) {
          console.error("Error updating driver position:", err);
        }
      };

      // Initial fetch immediately
      syncDriverLocation();

      driverLocationIntervalRef.current = setInterval(
        syncDriverLocation,
        10000,
      );
    }

    // Cleanup interval on state change or unmount
    return () => {
      if (driverLocationIntervalRef.current) {
        clearInterval(driverLocationIntervalRef.current);
        driverLocationIntervalRef.current = null;
      }
    };
  }, [actorState, ride?.status, ride?.driverId, handleWebSocketRequestMessage]);

  return (
    <main className="rd-main" role="main">
      {/* Map */}
      <div className="rd-map" aria-label="Map area">
        {loadError ? (
          <div className="rd-map-fallback rd-map-error" role="alert">
            Map unavailable. Check your connection and Google Maps configuration.
          </div>
        ) : isLoaded ? (
          <GoogleMapComponent
            locationRef={locationRef}
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
        locationRef={locationRef}
        handlePlaceSearch={handlePlaceSearch}
        selectSuggestion={selectSuggestion}
        handleBlur={handleBlur}
      />
    </main>
  );
};

export default UserDashboard;
