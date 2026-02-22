import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./DriverDashboardUI.css";

import RideRequestOverlay from "./RideRequestOverlay";
import ActiveRide from "./ActiveRide";
import GMap from "./GMap/GMap";
import DriverTripStartModal from "./DriverTripStartModal/DriverTripStartModal";
import State from "../../../constants/States";
import WebSocketAction from "../../../constants/WebSocketAction";
import { BackendService } from "../../../utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "../../../utils/ApiConfig/ApiEndpoints";
import { useDispatch, useSelector } from "react-redux";
import { ID, updateUserWorkflowState } from "../../../store/authCacheSlice";

const DRIVER_STATES = State.DRIVER_STATES;
const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;

const DriverDashboardUI = React.memo(({
  actorState, isOnline, currentPosition, socketConnected,
  incomingRides, acceptCountdown, activeRide, setActiveRide, loading, error,
  goOnline, goOffline, acceptIncomingRide, declineIncomingRide, handleWebSocketRequestMessage
}) => {

  const dispatch = useDispatch();

  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]);
  const id = useSelector(ID);

  const [openPinModal, setOpenPinModal] = useState(false);

  // Optimization: Derived state instead of useEffect. 
  // Calculating this during render is faster than a second render via useEffect.
  const destination = useMemo(() => {
    if (!activeRide) return null;

    // Use the coordinates based on the journey phase
    const isHeadingToPickup = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED].includes(actorState);

    return {
      lat: parseFloat(isHeadingToPickup ? activeRide.startLat : activeRide.endLat),
      lng: parseFloat(isHeadingToPickup ? activeRide.startLng : activeRide.endLng)
    };
  }, [actorState, activeRide]);

  const canGoOffline = useMemo(() => {
    const restricted = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED, DRIVER_STATES.ON_TRIP];
    return !restricted.includes(actorState);
  }, [actorState]);

  // Optimization: Wrap callbacks passed to children to prevent their re-render
  const onTripStartedHandler = useCallback(() => {
    handleWebSocketRequestMessage(DRIVER_WEBSOCKET_ACTIONS.START_TRIP, {
      rideId: activeRide?.rideId,
      driverId: activeRide?.driverId
    });
    handleStateChange(DRIVER_STATES.ON_TRIP);
    setOpenPinModal(false);
  }, [handleWebSocketRequestMessage, activeRide]);

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
    if (activeRide == null) {
      fetchActiveRideDetails();
    }
  }, [activeRide]);

  return (
    <div className={`driver-app-container state-${actorState?.toLowerCase()}`}>
      <nav className="dashboard-nav">
        <div className="status-indicator">
          <div className={`dot ${socketConnected ? "online" : "offline"}`} />
          <span className="state-label">{actorState?.replace(/_/g, " ")}</span>
        </div>

        <button
          className={`toggle-btn ${isOnline ? "btn-off" : "btn-on"}`}
          onClick={isOnline ? goOffline : goOnline}
          disabled={loading || (isOnline && !canGoOffline)}
        >
          {loading ? "..." : isOnline ? "GO OFFLINE" : "GO ONLINE"}
        </button>
      </nav>

      <main className="main-content">
        <div className="map-wrapper">
          {/* GMap should be memoized internally to handle currentPosition updates smoothly */}
          <GMap currentPosition={currentPosition} activeDestination={destination} />

          {incomingRides.length > 0 && (
            <RideRequestOverlay
              ride={incomingRides[0]}
              onAccept={acceptIncomingRide}
              onDecline={declineIncomingRide}
              countdown={acceptCountdown}
              loading={loading}
            />
          )}
        </div>

        {activeRide && (
          <ActiveRide
            activeRide={activeRide}
            actorState={actorState}
            handleWebSocketRequestMessage={handleWebSocketRequestMessage}
            setOpenPinModal={setOpenPinModal}
          />
        )}

        <DriverTripStartModal
          isOpen={openPinModal}
          rideId={activeRide?.rideId}
          onTripStarted={onTripStartedHandler}
          onClose={useCallback(() => setOpenPinModal(false), [])}
        />
      </main>

      {error && <div className="toast-error">{error}</div>}
    </div>
  );
});
export default DriverDashboardUI;
