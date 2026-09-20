import React, { useState, useEffect, useRef, useMemo, useCallback, act } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket from "react-use-websocket";
import { BackendService } from "../../../utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "../../../utils/ApiConfig/ApiEndpoints";
import Property from "../../../constants/Property";
import Data from "../../../constants/Data";
import Constants from "../../../constants/Constant";
import WebSocketAction from "../../../constants/WebSocketAction";
import STATE from "../../../constants/States";
import { ACTOR_STATE, ID, updateUserWorkflowState } from "../../../store/authCacheSlice";
import { useLazySocket } from "../../WebSocketHandler/useLazySocket";

const WS_URL = Property.Driver_WS_URL;
const DRIVER_STATES = STATE.DRIVER_STATES;
const DEFAULT_ACCEPT_SECONDS = Constants.DRIVER_DEFAULT_ACCEPT_SECONDS;
const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;

import "./DriverDashboard.css";
import ActiveRide from "./hooks/ActiveRide/ActiveRide";
import RideRequestOverlay from "./hooks/RideRequestOverlay/RideRequestOverlay";
import GMap from "./hooks/GMap/GMap";
import DriverTripStartModal from "./hooks/DriverTripStartModal/DriverTripStartModal";
import IncomingRides from "./hooks/IncomingRides/IncomingRides";
import { haversineDistanceKm } from "../Functionality";
import { set } from "lodash";
import { FaS } from "react-icons/fa6";
import DriverTripCompleteModal from "./hooks/DriverTripCompleteModal/DriverTripCompleteModal";
import DriverNavbar from "./hooks/Navbar/DriverNavbar";





export default function DriverDashboard() {
  const dispatch = useDispatch();
  const id = useSelector(ID);
  const actorState = useSelector(ACTOR_STATE);

  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [rideOffered, setRideOffered] = useState(null);
  const [incomingRides, setIncomingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [error, setError] = useState(null);
  const [showDriverActionButton, setShowDriverActionButton] = useState(true);

  const lastSentPos = useRef({ lat: 0, lng: 0, timestamp: 0 });
  const locationWatchId = useRef(null);
  const acceptTimer = useRef(null);

  // Optimization: Stable reference for state changes
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch]);

  const isDriverBusy = useCallback(() => {
    const busyStates = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED, DRIVER_STATES.ON_TRIP];
    return busyStates.includes(actorState);
  })
const handleRideOffered = useCallback((ride) => {
  // We use the setter for incomingRides to get the MOST RECENT state 
  // without needing it in the dependency array.
  setIncomingRides((prevPool) => {
    const isPresentInPool = prevPool.some(r => r.rideId === ride.rideId);

    if (!isPresentInPool) {
      // If it's not in the pool, check if we should show the overlay
      setRideOffered((currentVisibleRide) => {
        if (currentVisibleRide?.rideId !== ride.rideId) {
          return ride;
        }
        return currentVisibleRide;
      });
    }
    
    // Return the pool (unchanged here, or you can add logic to add it to pool)
    return prevPool;
  });
}, []); // Dependency array is now empty and stable

  const handleWebSocketResponseMessage = useCallback((event) => {
    try {
      console.debug("[WS] Message received: ", event.data);
      const { type, payload } = JSON.parse(event.data);

      // Log using a structured format for easier debugging in production
      console.log(`[WS RECV] Type: ${type}`, payload);
      switch (type) {
        case STATE.STATE_CHANGE:
          handleStateChange(payload);
          break;
        case DRIVER_WEBSOCKET_ACTIONS.RIDE_OFFERED:
          handleRideOffered(payload);
          break;
        case DRIVER_WEBSOCKET_ACTIONS.ENABLE_DRIVER_ARRIVED_BUTTON:
          setShowDriverArrived(true);
          break;
        case DRIVER_WEBSOCKET_ACTIONS.RIDE_ACCEPTED:
          fetchActiveRideDetails();
          break;
        case DRIVER_WEBSOCKET_ACTIONS.ACKNOWLEDGE:
          console.log("[WS] Server ACK: ", payload);
          break;
        case DRIVER_WEBSOCKET_ACTIONS.DRIVER_LOCATION_SYNCED:
          console.log("[WS] Server confirms location sync: ", payload);
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


  // --- Optimized Location Logic (The Google "Battery-Friendly" Way) ---
  const sendLocation = useCallback((coords) => {
    const now = Date.now();
    const dist = Math.hypot(coords.lat - lastSentPos.current.lat, coords.lng - lastSentPos.current.lng);

    // Only send if moved > 20 meters OR 30 seconds passed
    const SIGNIFICANT_DISTANCE = 0.0002;
    const SIGNIFICANT_TIME = 30000;

    if (dist > SIGNIFICANT_DISTANCE || (now - lastSentPos.current.timestamp) > SIGNIFICANT_TIME) {
      const payload = { id, ...coords, state: actorState };
      if (readyState === 1) {
        // console.log("Sending location via WebSocket: ", payload);
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
    if (isOnline && readyState === 1) {
      startLocationWatch();
    }
    else stopLocationWatch();
    return () => stopLocationWatch();
  }, [readyState, startLocationWatch, stopLocationWatch]);

  const acceptIncomingRide = async (ride) => {
    if (!ride) return;
    try {
      const response = await BackendService(ApiEndpoints.acceptRide, {
        rideId: ride.rideId, driverId: id, userId: ride.userId
      });
      if (response.data) {
        console.log("Ride accepted successfully: ", response.data); S
        setRideOffered(null);
        setActiveRide(ride);
        setIncomingRides(prev => prev.filter(rd => rd.rideId !== ride.rideId));
        handleStateChange(DRIVER_STATES.ACCEPTED);
      }
    } catch (err) {
      setError("Ride no longer available.");
    }
  };

  const declineIncomingRide = (ride) => {
    console.log("Declining ride offer: ", ride.rideId);
    setRideOffered(null);
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.DRIVER_DECLINED_OFFER, { rideId: ride.rideId, driverId: id });
  }

  const handleCancelRide = useCallback(async () => {
    if (!activeRide) return;
    try {
      const response = await BackendService(ApiEndpoints.driverCancelRide, { rideId: activeRide.rideId, driverId: id, userId: activeRide.userId });
      if (response.data) {
        setActiveRide(null);
        setRideOffered(null);
        handleStateChange(DRIVER_STATES.IDLE);
        goOnline();
        console.log("Ride cancelled successfully: ", response.data);
      }
    } catch (error) {
      console.error("Failed to cancel ride: ", error);

    }
  }, [activeRide, id, handleWebSocketRequestMessage, handleStateChange]);

  const goOnline = () => {
    setIsOnline(true);
    startConnection();
  };
  const goOffline = () => {
    setIsOnline(false);
    console.log("Going offline. Clearing ride offers and stopping WebSocket connection.");
    setRideOffered(null);
    stopConnection();
  };

  useEffect(() => {
    if (isDriverBusy()) {
      goOnline();
    }
  }, [actorState])



  //Dashboard UI start
  const socketConnected = readyState == 1;
  const [openPinModal, setOpenPinModal] = useState(false);
  const [openRideCompleteModal, setOpenRideCompleteModal] = useState(false);

  // Optimization: Derived state instead of useEffect. 
  // Calculating this during render is faster than a second render via useEffect.
  const destination = useMemo(() => {
    if (!activeRide) return null;

    // Use the coordinates based on the journey phase
    const isHeadingToPickup = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED].includes(actorState);

    const response = {
      lat: parseFloat(isHeadingToPickup ? activeRide.startLat : activeRide.endLat),
      destinationLabel: isHeadingToPickup ? activeRide.startAddress : activeRide.endAddress,
      lng: parseFloat(isHeadingToPickup ? activeRide.startLng : activeRide.endLng)
    };
    const dist = haversineDistanceKm(currentPosition?.lat, currentPosition?.lng, response?.lat, response?.lng) * 1000;
    // setShowDriverActionButton((dist && dist < 200) || false);
    return response;
  }, [actorState, activeRide, currentPosition]);

  // Optimization: Wrap callbacks passed to children to prevent their re-render
  const onTripStartedHandler = useCallback(() => {
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.START_TRIP, {
      rideId: activeRide?.rideId,
      driverId: activeRide?.driverId
    });
    handleStateChange(DRIVER_STATES.ON_TRIP);
    setOpenPinModal(false);
  }, [handleWebSocketRequestMessage, activeRide]);

  const onTripCompletedHandler = useCallback(() => {
    console.log("Trip completed callback triggered");
  }, []);

  const fetchActiveRideDetails = useCallback(async () => {
    try {
      const payload = { driverId: id }
      const response = await BackendService(ApiEndpoints.driverRideDetails, payload);
      if (response.data) {
        setActiveRide(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch active ride details:", err);
      setError("Failed to fetch active ride details.");
    }
  }, []);

  useEffect(() => {
    if (activeRide == null && isDriverBusy()) {
      fetchActiveRideDetails();
    }
  }, [activeRide, actorState, fetchActiveRideDetails]);

  const onClosePinModal = useCallback(() => setOpenPinModal(false), []);
  const onCloseRideCompleteModal = useCallback(() => setOpenRideCompleteModal(false), []);

 return (
    <div className={`dashboard-root driver-dashboard state-${actorState?.toLowerCase()}`}>
      <DriverNavbar
        socketConnected={socketConnected}
        actorState={actorState}
        isOnline={isOnline}
        goOnline={goOnline}
        goOffline={goOffline}
      />

      {!isOnline ? (
        <div className="offline-hero">
          <div className="card">
            <h2>Go online to accept the ride...</h2>
            <p className="text-muted">You will see new requests here once you are active.</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-flow">
          {/* SECTION 1: MAP */}
          <section className="map-section">
            <GMap currentPosition={currentPosition} activeDestination={destination} />
            
            {/* The Floating Ride Offer Overlay */}
            {rideOffered && (
              <div className="offer-overlay floating-overlay">
                <RideRequestOverlay
                  ride={rideOffered}
                  setRideOffered={setRideOffered}
                  onAccept={acceptIncomingRide}
                  onDecline={declineIncomingRide}
                  activeRide={activeRide}
                  setIncomingRides={setIncomingRides}
                />
              </div>
            )}
          </section>

          {/* SECTION 2: ACTIVE RIDE (Pushes content down) */}
          {activeRide && (
            <section className="active-ride-area">
              <div className="card">
                <ActiveRide
                  activeRide={activeRide}
                  actorState={actorState}
                  handleWebSocketRequestMessage={handleWebSocketRequestMessage}
                  setOpenPinModal={setOpenPinModal}
                  setOpenRideCompleteModal={setOpenRideCompleteModal}
                  showDriverActionButton={showDriverActionButton}
                  handleCancelRide={handleCancelRide}
                />
              </div>
            </section>
          )}

          {/* SECTION 3: INCOMING POOL (Grows the page height) */}
          {incomingRides.length > 0 && (
            <section className="incoming-rides-area">
              <IncomingRides incomingRides={incomingRides} />
            </section>
          )}
        </div>
      )}

      {/* Modals & Toasts */}
      <DriverTripStartModal isOpen={openPinModal} rideId={activeRide?.rideId} onTripStarted={onTripStartedHandler} onClose={onClosePinModal} />
      <DriverTripCompleteModal isOpen={openRideCompleteModal} ride={activeRide} onTripCompleted={onTripCompletedHandler} onClose={onCloseRideCompleteModal} />
      {error && <div className="toast-error notification"><strong>Error</strong>{error}</div>}
    </div>
  );
}