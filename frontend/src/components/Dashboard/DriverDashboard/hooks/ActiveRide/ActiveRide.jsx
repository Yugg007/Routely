import React, { useMemo, useCallback } from 'react';
import "./ActiveRide.css";
import WebSocketAction from '../../../../../constants/WebSocketAction';
import STATE from '../../../../../constants/States';
import { useDispatch } from 'react-redux';
import { updateUserWorkflowState } from '../../../../../store/authCacheSlice';

const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;
const DRIVER_STATES = STATE.DRIVER_STATES;

const ActiveRide = ({
  activeRide,
  actorState,
  handleWebSocketRequestMessage,
  setOpenPinModal,
  setOpenRideCompleteModal,
  showDriverActionButton,
  handleCancelRide
}) => {
  const dispatch = useDispatch();
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]);

  // 1. Define the State Machine Logic
  const stateConfig = useMemo(() => {
    const configs = {
      [DRIVER_STATES.ACCEPTED]: {
        label: "MARK AS ARRIVED",
        visible: !!showDriverActionButton, // Only show if driver is close enough to pickup
        action: () => {
          handleWebSocketRequestMessage(
            DRIVER_WEBSOCKET_ACTIONS.DRIVER_ARRIVED,
            { rideId: activeRide?.rideId, driverId: activeRide?.driverId }
          );
          handleStateChange(DRIVER_STATES.DRIVER_ARRIVED);
        },
        showCancel: true
      },
      [DRIVER_STATES.DRIVER_ARRIVED]: {
        label: "START TRIP",
        visible: true,
        action: () => setOpenPinModal(true),
        showCancel: true
      },
      [DRIVER_STATES.ON_TRIP]: {
        label: "COMPLETE RIDE & COLLECT",
        visible: showDriverActionButton, // Show if driver is close enough to destination
        action: () => setOpenRideCompleteModal(true),
        showCancel: false
      }
    };
    return configs[actorState] || null;
  }, [actorState, showDriverActionButton, activeRide, handleWebSocketRequestMessage, setOpenPinModal, setOpenRideCompleteModal]);

  // Safe Handler
  const handleAction = useCallback(() => {
    if (!activeRide?.rideId || !stateConfig?.action) {
      console.warn("Action triggered without valid ride data or configuration");
      return;
    }
    stateConfig.action();
  }, [activeRide, stateConfig]);

  if (!activeRide) return null;

  return (
    <div className="active-ride-tray shadow-animation">
      <div className="tray-header">
        <div className="passenger-meta">
          <span className="ride-badge">LIVE RIDE #{activeRide?.rideId}</span>
          <h4>{activeRide.name || "Passenger"}</h4>
        </div>
        {activeRide.userMobNo && (
          <a href={`tel:${activeRide.userMobNo}`} className="contact-action">
            📞 Call
          </a>
        )}
      </div>

      <div className="address-display">
        <div className="dot-line-container">
          <div className="dot green"></div>
          <div className="line"></div>
          <div className="dot red"></div>
        </div>
        <div className="address-text">
          <div className="addr pickup">
            <small>PICKUP</small>
            <p>{activeRide.startAddress}</p>
          </div>
          <div className="addr dropoff">
            <small>DESTINATION</small>
            <p>{activeRide.endAddress}</p>
          </div>
        </div>
      </div>

      {/* Conditional Button Rendering based on State Machine */}
      {stateConfig?.visible && (
        <div className="button-container">
          
          <button
            className={`btn-status-update state-${actorState.toLowerCase()}`}
            onClick={handleAction}
          >
            {stateConfig.label}
          </button>

          {stateConfig.showCancel && (
            <button 
              className="btn-cancel" 
              onClick={handleCancelRide}
            >
                Cancel Ride
            </button>
          )}
          
        </div>
      )}
    </div>
  );
};

// Use React.memo for the tray as it's often inside a frequently re-rendering Dashboard
export default React.memo(ActiveRide);