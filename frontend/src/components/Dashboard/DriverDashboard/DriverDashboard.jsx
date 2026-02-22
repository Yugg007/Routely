import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket from "react-use-websocket";
import { BackendService } from "../../../utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "../../../utils/ApiConfig/ApiEndpoints";
import DriverDashboardUI from "./DriverDashboardUI";
import Property from "../../../constants/Property";
import Data from "../../../constants/Data";
import Constants from "../../../constants/Constant";
import WebSocketAction from "../../../constants/WebSocketAction";
import STATE from "../../../constants/States";
import { ACTOR_STATE, ID, setAuthSession, updateUserWorkflowState, USER } from "../../../store/authCacheSlice";
import { useLazySocket } from "../../WebSocketHandler/useLazySocket";

const WS_URL = Property.Driver_WS_URL;
const DRIVER_STATES = STATE.DRIVER_STATES;
const DEFAULT_ACCEPT_SECONDS = Constants.DRIVER_DEFAULT_ACCEPT_SECONDS;
const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;

export default function DriverDashboard() {
  const dispatch = useDispatch();
  const id = useSelector(ID);
  const actorState = useSelector(ACTOR_STATE);

  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [incomingRides, setIncomingRides] = useState([]);
  const [acceptCountdown, setAcceptCountdown] = useState(DEFAULT_ACCEPT_SECONDS);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastSentPos = useRef({ lat: 0, lng: 0, timestamp: 0 });
  const locationWatchId = useRef(null);
  const acceptTimer = useRef(null);

  // Optimization: Stable reference for state changes
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch]);

  // Optimization: Clear timer with a reusable cleanup
  const clearAcceptTimer = useCallback(() => {
    if (acceptTimer.current) {
      clearInterval(acceptTimer.current);
      acceptTimer.current = null;
    }
  }, []);

  const resetAndStartTimer = useCallback(() => {
    clearAcceptTimer();
    setAcceptCountdown(DEFAULT_ACCEPT_SECONDS);
    acceptTimer.current = setInterval(() => {
      setAcceptCountdown(prev => {
        if (prev <= 1) {
          clearAcceptTimer();
          setIncomingRides([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearAcceptTimer]);

  const handleWebSocketResponseMessage = useCallback((event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      console.log(`[WS RECV] Type: ${type}`, payload);
      if (type === STATE.STATE_CHANGE) {
        handleStateChange(payload);
      } else if (type === DRIVER_WEBSOCKET_ACTIONS.RIDE_REQUEST || type === DRIVER_WEBSOCKET_ACTIONS.RIDE_OFFERED) {
        // Check busy state against the latest actorState
        const busyStates = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED, DRIVER_STATES.IN_PROGRESS];
        if (!busyStates.includes(actorState)) {
          setIncomingRides([payload]);
          resetAndStartTimer();
        }
      }
    } catch (e) { console.error("WS Error", e); }
  }, []);

  const onMessageReceived = useCallback((event) => {
    handleWebSocketResponseMessage(event);
  }, [handleWebSocketResponseMessage]); // Stable reference

  const { handleWebSocketRequestMessage, startConnection, stopConnection, readyState } = useLazySocket(onMessageReceived, WS_URL);


  // --- Optimized Location Logic (The Google "Battery-Friendly" Way) ---
  const sendLocation = useCallback((coords) => {
    const now = Date.now();
    const dist = Math.hypot(coords.lat - lastSentPos.current.lat, coords.lng - lastSentPos.current.lng);

    // SDE 3 Strategy: Only send if moved > 20 meters OR 30 seconds passed
    const SIGNIFICANT_DISTANCE = 0.0002;
    const SIGNIFICANT_TIME = 30000;

    if (dist > SIGNIFICANT_DISTANCE || (now - lastSentPos.current.timestamp) > SIGNIFICANT_TIME) {
      const payload = { id, ...coords, state: actorState };
      if (readyState === 1) {
        handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.DRIVER_LOCATION_PUSH, payload);
      } else {
        BackendService(ApiEndpoints.pingLocation, payload).catch(() => { });
      }
      lastSentPos.current = { ...coords, timestamp: now };
    }
  }, [id, actorState, readyState, handleWebSocketRequestMessage]);

  const startLocationWatch = useCallback(() => {
    if (locationWatchId.current) return; // Already watching

    locationWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setCurrentPosition(newCoords);
        sendLocation(newCoords);
      },
      () => setError("GPS Signal Lost"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [sendLocation]);

  const stopLocationWatch = useCallback(() => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  }, []);

  // --- Component Lifecycle ---
  useEffect(() => {
    if (isOnline) startLocationWatch();
    else stopLocationWatch();
    return () => stopLocationWatch();
  }, [isOnline, startLocationWatch, stopLocationWatch]);

  const acceptIncomingRide = async (ride) => {
    if (!ride || loading) return;
    setLoading(true);
    try {
      const response = await BackendService(ApiEndpoints.acceptRide, {
        rideId: ride.rideId, driverId: id, userId: ride.userId
      });
      if (response.data) {
        setIncomingRides([]);
        clearAcceptTimer();
        setActiveRide(ride);
        handleStateChange(DRIVER_STATES.ACCEPTED);
      }
    } catch (err) {
      setError("Ride no longer available.");
    } finally {
      setLoading(false);
    }
  };

  const declineIncomingRide = (ride) => {
    setIncomingRides([]);
    clearAcceptTimer();
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.DECLINE_TRIP, { rideId: ride.rideId, driverId: id });
  }

  const goOnline = () => {
    setIsOnline(true);
    startConnection();
  };
  const goOffline = () => { 
    setIsOnline(false); 
    setIncomingRides([]);
    stopConnection();
  };

  return (
    <DriverDashboardUI
      actorState={actorState}
      isOnline={isOnline}
      currentPosition={currentPosition}
      socketConnected={readyState === 1}
      incomingRides={incomingRides}
      acceptCountdown={acceptCountdown}
      activeRide={activeRide}
      setActiveRide={setActiveRide}
      loading={loading}
      error={error}
      goOnline={goOnline}
      goOffline={goOffline}
      acceptIncomingRide={acceptIncomingRide}
      declineIncomingRide={declineIncomingRide}
      handleWebSocketRequestMessage={handleWebSocketRequestMessage}
    />
  );
}

