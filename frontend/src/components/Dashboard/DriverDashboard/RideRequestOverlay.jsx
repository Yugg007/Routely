import React from 'react'
import "./DriverDashboardUI.css";


const RideRequestOverlay = ({ ride, onAccept, onDecline, countdown, loading }) => (
  <div className="ride-request-card floating-overlay">
    <div className="card-header">
      <span className="pulse-icon"></span>
      <h3>New Ride Request</h3>
      <div className="timer-circle">{countdown}s</div>
    </div>
    <div className="card-body">
      <div className="location-row"><strong>From:</strong> {ride?.startAddress}</div>
      <div className="location-row"><strong>To:</strong> {ride?.endAddress}</div>
      <div className="price-tag">₹{ride?.fare || "---"}</div>
    </div>
    <div className="card-footer">
      <button className="btn-decline" onClick={() => onDecline(ride)} disabled={loading}>Decline</button>
      <button className="btn-accept" onClick={() => onAccept(ride)} disabled={loading}>Accept Ride</button>
    </div>
  </div>
);

export default RideRequestOverlay