import React from 'react'
import "./RideRequestOverlay.css";

const RideRequestOverlay = ({ ride, setRideOffered, onAccept, onDecline, activeRide, setIncomingRides }) => {

  const handleCrossButtonClick = () => {
    setIncomingRides(prevRides => {
      const isDuplicate = prevRides.some(r => r.rideId === ride.rideId);
      if (isDuplicate) {
        return prevRides; 
      }
      setRideOffered(null); // Close the overlay
      return [...prevRides, ride];
    });
  };

  return (
    <div className="ride-request-card floating-overlay">
      {/* 1. Added the Cross Button here */}
      <button className="close-btn" onClick={handleCrossButtonClick}>
        &times;
      </button>

      <div className="card-header">
        <span className="pulse-icon"></span>
        <h3>New Ride Request</h3>
      </div>
      <div className="card-body">
        <div className="location-row"><strong>From:</strong> {ride?.startAddress}</div>
        <div className="location-row"><strong>To:</strong> {ride?.endAddress}</div>
        <div className="price-tag">₹{ride?.fare || "---"}</div>
      </div>
      <div className="card-footer">
        <button className="btn-decline" onClick={() => onDecline(ride)}>Decline</button>
        <button className="btn-accept" onClick={() => onAccept(ride)}>Accept Ride</button>
      </div>
    </div>
  )
};

export default RideRequestOverlay;