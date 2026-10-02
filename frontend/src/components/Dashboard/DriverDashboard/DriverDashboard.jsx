import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { haversineDistanceKm } from "../Functionality";

const WS_URL = Property.Driver_WS_URL;
const DRIVER_STATES = STATE.DRIVER_STATES;
const DEFAULT_ACCEPT_SECONDS = Constants.DRIVER_DEFAULT_ACCEPT_SECONDS;
const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;

import "./DriverDashboard.css";

import GMap from "./hooks/GMap/GMap";
import ActiveRide from "./hooks/ActiveRide/ActiveRide";
import RideRequestOverlay from "./hooks/RideRequestOverlay/RideRequestOverlay";
import DriverTripStartModal from "./hooks/DriverTripStartModal/DriverTripStartModal";
import IncomingRides from "./hooks/IncomingRides/IncomingRides";
import DriverTripCompleteModal from "./hooks/DriverTripCompleteModal/DriverTripCompleteModal";
import DriverNavbar from "./hooks/Navbar/DriverNavbar";


export default function DriverDashboard() {
  const dispatch = useDispatch();
  const id = useSelector(ID);
  const actorState = useSelector(ACTOR_STATE);
  const user = useSelector((state) => state?.authCache?.user);


  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [rideOffered, setRideOffered] = useState(null);
  const [incomingRides, setIncomingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [error, setError] = useState(null);
  const [driverActionEnabled, setDriverActionEnabled] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState(null);

  const lastSentPos = useRef(null);
  const locationWatchId = useRef(null);
  const acceptTimer = useRef(null);

  // Optimization: Stable reference for state changes
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch]);

  const isDriverBusy = useCallback(() => {
    const busyStates = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED, DRIVER_STATES.ON_TRIP];
    return busyStates.includes(actorState);
  }, [actorState]);

  const handleRideOffered = useCallback((ride) => {
    if (!ride?.rideId) return;
    setRideOffered((current) =>
      current?.rideId === ride.rideId ? current : ride,
    );
  }, []);

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
          setDriverActionEnabled(true);
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
  }, [handleRideOffered, handleStateChange]);

  const onMessageReceived = useCallback((event) => {
    handleWebSocketResponseMessage(event);
  }, [handleWebSocketResponseMessage]); // Stable reference

  const { handleWebSocketRequestMessage, startConnection, stopConnection, readyState } = useLazySocket(onMessageReceived, WS_URL);


  // --- Optimized Location Logic (The Google "Battery-Friendly" Way) ---
  const sendLocation = useCallback((coords) => {
    const now = Date.now();
    const previousPosition = lastSentPos.current;
    const distanceMeters = previousPosition
      ? haversineDistanceKm(previousPosition.lat, previousPosition.lng, coords.lat, coords.lng) * 1000
      : Infinity;

    // Send the first fix, then send after 20 meters of movement or 30 seconds.
    const SIGNIFICANT_DISTANCE_METERS = 20;
    const SIGNIFICANT_TIME = 30000;

    if (!previousPosition || distanceMeters > SIGNIFICANT_DISTANCE_METERS || (now - previousPosition.timestamp) > SIGNIFICANT_TIME) {
      const payload = { id, ...coords, state: actorState, name: user?.name, mobileNo: user?.mobileNo };
      if (readyState === 1) {
        // console.log("Sending location via WebSocket: ", payload);
        handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.DRIVER_LOCATION_PUSH, payload);
      } else {
        BackendService(ApiEndpoints.pingLocation, payload).catch(() => { });
      }
      lastSentPos.current = { ...coords, timestamp: now };
    }
  }, [id, actorState, user?.name, user?.mobileNo, readyState, handleWebSocketRequestMessage]);

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
    if (isOnline) {
      startLocationWatch();
    }
    else stopLocationWatch();
    return () => stopLocationWatch();
  }, [isOnline, startLocationWatch, stopLocationWatch]);

  const acceptIncomingRide = async (ride) => {
    if (!ride || acceptingRideId) return;
    setAcceptingRideId(ride.rideId);
    try {
      const response = await BackendService(ApiEndpoints.acceptRide, {
        rideId: ride.rideId, driverId: id, userId: ride.userId
      });
      if (response.data) {
        console.log("Ride accepted successfully: ", response.data);
        setRideOffered(null);
        setActiveRide(ride);
        setIncomingRides(prev => prev.filter(rd => rd.rideId !== ride.rideId));
        setDriverActionEnabled(false);
        handleStateChange(DRIVER_STATES.ACCEPTED);
      }
    } catch (err) {
      setError("Ride no longer available.");
    } finally {
      setAcceptingRideId(null);
    }
  };

  const declineIncomingRide = (ride) => {
    console.log("Declining ride offer: ", ride.rideId);
    setRideOffered(null);
    setIncomingRides((rides) => rides.filter((item) => item.rideId !== ride.rideId));
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.DRIVER_DECLINED_OFFER, { rideId: ride.rideId, driverId: id });
  }

  const handleCancelRide = useCallback(async () => {
    if (!activeRide) return;
    try {
      const response = await BackendService(ApiEndpoints.driverCancelRide, { rideId: activeRide.rideId, driverId: id, userId: activeRide.userId });
      if (response.data) {
        setActiveRide(null);
        setRideOffered(null);
          setDriverActionEnabled(false);
        handleStateChange(DRIVER_STATES.IDLE);
        setIsOnline(true);
        startConnection();
        console.log("Ride cancelled successfully: ", response.data);
      }
    } catch (error) {
      console.error("Failed to cancel ride: ", error);

    }
  }, [activeRide, id, handleStateChange, startConnection]);

  const goOnline = useCallback(() => {
    setIsOnline(true);
    startConnection();
  }, [startConnection]);

  const goOffline = useCallback(() => {
    setIsOnline(false);
    console.log("Going offline. Clearing ride offers and stopping WebSocket connection.");
    setRideOffered(null);
    setIncomingRides([]);
    stopConnection();
  }, [stopConnection]);

  useEffect(() => {
    if (isDriverBusy()) {
      goOnline();
    }
  }, [actorState, goOnline, isDriverBusy]);



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
      label: isHeadingToPickup ? activeRide.startAddress : activeRide.endAddress,
      lng: parseFloat(isHeadingToPickup ? activeRide.startLng : activeRide.endLng)
    };
    const distanceMeters = currentPosition
      ? haversineDistanceKm(
          currentPosition.lat,
          currentPosition.lng,
          response.lat,
          response.lng,
        ) * 1000
      : null;
    return { ...response, distanceMeters };
  }, [actorState, activeRide, currentPosition]);

  const showDriverActionButton =
    driverActionEnabled ||
    (destination?.distanceMeters != null && destination.distanceMeters <= 200);

  // Optimization: Wrap callbacks passed to children to prevent their re-render
  const onTripStartedHandler = useCallback(() => {
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.START_TRIP, {
      rideId: activeRide?.rideId,
      driverId: activeRide?.driverId
    });
    setDriverActionEnabled(false);
    handleStateChange(DRIVER_STATES.ON_TRIP);
    setOpenPinModal(false);
  }, [handleWebSocketRequestMessage, handleStateChange, activeRide]);

  const onTripCompletedHandler = useCallback(() => {
    setOpenRideCompleteModal(false);
    setActiveRide(null);
    setDriverActionEnabled(false);
    handleStateChange(DRIVER_STATES.IDLE);
  }, [handleStateChange]);

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
  }, [id]);

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
          <div className="offline-panel">
            <span className="offline-status-mark" aria-hidden="true" />
            <div className="offline-copy">
              <span className="offline-eyebrow">DRIVER STATUS</span>
              <h2>You’re offline</h2>
              <p>Go online when you’re ready to receive ride requests.</p>
              <button className="driver-primary-action" onClick={goOnline}>
                Go online
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-flow">
          {/* SECTION 1: MAP */}
          <section className="map-section">
            <GMap currentPosition={currentPosition} activeDestination={destination} />
            
            {/* The Floating Ride Offer Overlay */}
            {rideOffered && (
              <RideRequestOverlay
                ride={rideOffered}
                setRideOffered={setRideOffered}
                onAccept={acceptIncomingRide}
                onDecline={declineIncomingRide}
                setIncomingRides={setIncomingRides}
                isAccepting={acceptingRideId === rideOffered.rideId}
              />
            )}
          </section>

          {/* SECTION 2: ACTIVE RIDE (Pushes content down) */}
          {activeRide && (
            <section className="active-ride-area">
              <ActiveRide
                  activeRide={activeRide}
                  actorState={actorState}
                  handleWebSocketRequestMessage={handleWebSocketRequestMessage}
                  setOpenPinModal={setOpenPinModal}
                  setOpenRideCompleteModal={setOpenRideCompleteModal}
                  showDriverActionButton={showDriverActionButton}
                  handleCancelRide={handleCancelRide}
                />
            </section>
          )}

          {/* SECTION 3: INCOMING POOL (Grows the page height) */}
          {incomingRides.length > 0 && (
            <section className="incoming-rides-area">
              <IncomingRides
                incomingRides={incomingRides}
                onAccept={acceptIncomingRide}
                onDecline={declineIncomingRide}
                acceptingRideId={acceptingRideId}
              />
            </section>
          )}
        </div>
      )}

      {/* Modals & Toasts */}
      <DriverTripStartModal isOpen={openPinModal} rideId={activeRide?.rideId} onTripStarted={onTripStartedHandler} onClose={onClosePinModal} />
      <DriverTripCompleteModal
        isOpen={openRideCompleteModal}
        ride={activeRide}
        totalFare={activeRide?.fare ?? activeRide?.estimatedFare ?? "0.00"}
        onTripCompleted={onTripCompletedHandler}
        onClose={onCloseRideCompleteModal}
      />
      {error && <div className="toast-error notification"><strong>Error</strong>{error}</div>}
    </div>
  );
}