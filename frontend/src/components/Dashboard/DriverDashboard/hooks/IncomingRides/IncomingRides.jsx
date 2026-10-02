import React from 'react';
import "./IncomingRides.css";

const IncomingRides = ({
  incomingRides = [],
  onAccept,
  onDecline,
  acceptingRideId,
}) => {
  if (incomingRides.length === 0) {
    return (
      <div className="no-rides-state">
        <p>No new requests at the moment. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div className="incoming-rides-shell">
      <h2 className="section-title">Incoming Requests ({incomingRides.length})</h2>
      <div className="incoming-rides-grid">
        {incomingRides.map((ride) => (
          <div key={ride.rideId} className="incoming-ride-card">
            <div className="incoming-card-header">
              <div className="user-info">
                <p className="passenger-name">{ride.name || "Passenger"}</p>
                <p className={`ride-type-badge ${ride.rideType || "ride"}`}>
                  {ride.rideType?.toUpperCase() || "RIDE"}
                </p>
              </div>
              <div className="fare-display">
                <span>FARE</span>
                <strong>₹{ride.fare ?? "--"}</strong>
              </div>
            </div>
            
            <div className="card-body">
              <div className="location-track">
                <div className="track-icons">
                  <div className="dot start"></div>
                  <div className="line"></div>
                  <div className="dot end"></div>
                </div>
                <div className="track-details">
                  <div className="location-point">
                    <label>PICKUP</label>
                    <p className="address-text">{ride.startAddress || "Pickup location"}</p>
                  </div>
                  <div className="location-point">
                    <label>DESTINATION</label>
                    <p className="address-text">{ride.endAddress || "Destination"}</p>
                  </div>
                </div>
              </div>

              {ride.userMobNo && (
                <a className="incoming-contact" href={`tel:${ride.userMobNo}`}>
                  {ride.userMobNo}
                </a>
              )}
            </div>

            <div className="card-actions">
              <button
                className="btn-decline"
                onClick={() => onDecline?.(ride)}
                disabled={Boolean(acceptingRideId)}
              >
                Decline
              </button>
              <button
                className="btn-accept"
                onClick={() => onAccept?.(ride)}
                disabled={Boolean(acceptingRideId)}
              >
                {acceptingRideId === ride.rideId ? "Accepting..." : "Accept ride"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomingRides;