import React, { useMemo } from 'react';
import STATE from '../../../../../constants/States';
import "./DriverNavbar.css";

const DRIVER_STATES = STATE.DRIVER_STATES;

const DriverNavbar = React.memo(({
  socketConnected,
  actorState,
  isOnline,
  goOnline,
  goOffline
}) => {

  const displayState = useMemo(() => {
    if (!socketConnected) return "CONNECTING";
    if (actorState === DRIVER_STATES.IDLE) {
      return isOnline ? "ONLINE" : "OFFLINE";
    }
    // Keeps it short: "ON TRIP" instead of "ON_TRIP"
    return actorState.replace(/_/g, ' ');
  }, [actorState, isOnline, socketConnected]);

  const canGoOffline = useMemo(() => {
    const restricted = [DRIVER_STATES.ACCEPTED, DRIVER_STATES.DRIVER_ARRIVED, DRIVER_STATES.ON_TRIP];
    return !restricted.includes(actorState);
  }, [actorState]);

  return (
    <nav className="dashboard-nav compact-nav">
      <div className="nav-left">
        <div className={`status-badge-mini ${isOnline ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          <span className="state-label">{displayState}</span>
        </div>
      </div>

      <div className="nav-right">
        <button
          className={`compact-toggle ${isOnline ? "mode-off" : "mode-on"}`}
          onClick={isOnline ? goOffline : goOnline}
          disabled={(isOnline && !canGoOffline)}
        >
          <span className="power-icon">⏻</span>
          <span className="btn-text">{isOnline ? "OFFLINE" : "GO ONLINE"}</span>
        </button>
      </div>
    </nav>
  );
});

export default DriverNavbar;