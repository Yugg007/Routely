import React, { useMemo, useCallback } from 'react';
import "./DriverDashboardUI.css";
import WebSocketAction from '../../../constants/WebSocketAction';
import STATE from '../../../constants/States';
import { useDispatch } from 'react-redux';
import { updateUserWorkflowState } from '../../../store/authCacheSlice';

const DRIVER_WEBSOCKET_ACTIONS = WebSocketAction.DRIVER_WEBSOCKET_ACTIONS;
const DRIVER_STATES = STATE.DRIVER_STATES;

const ActiveRide = ({ 
  activeRide, 
  actorState, 
  handleWebSocketRequestMessage, 
  setOpenPinModal
}) => {
    const dispatch = useDispatch();
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]); 

    let backendShow = true;

  // 1. Define the State Machine Logic
  const stateConfig = useMemo(() => {
    const configs = {
      [DRIVER_STATES.ACCEPTED]: {
        label: "MARK AS ARRIVED",
        visible: !!backendShow, // Only show if backend allows
        action: () => {
            handleWebSocketRequestMessage(
                DRIVER_WEBSOCKET_ACTIONS.DRIVER_ARRIVED, 
                { rideId: activeRide?.rideId, driverId: activeRide?.driverId }
            );
            handleStateChange(DRIVER_STATES.DRIVER_ARRIVED);
        }
      },
      [DRIVER_STATES.DRIVER_ARRIVED]: {
        label: "START TRIP",
        visible: true,
        action: () => setOpenPinModal(true)
      },
      [DRIVER_STATES.ON_TRIP]: {
        label: "COMPLETE RIDE & COLLECT",
        visible: true,
        action: () => handleWebSocketRequestMessage(
          DRIVER_WEBSOCKET_ACTIONS.COMPLETE_TRIP, 
          { rideId: activeRide?.rideId, driverId: activeRide?.driverId }
        )
      }
    };
    return configs[actorState] || null;
  }, [actorState, backendShow, activeRide, handleWebSocketRequestMessage, setOpenPinModal]);

  // 2. Safe Handler
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

      {/* 3. Conditional Button Rendering based on State Machine */}
      {stateConfig?.visible && (
        <button 
          className={`btn-status-update state-${actorState.toLowerCase()}`} 
          onClick={handleAction}
        >
          {stateConfig.label}
        </button>
      )}
    </div>
  );
};

// Use React.memo for the tray as it's often inside a frequently re-rendering Dashboard
export default React.memo(ActiveRide);