import React from 'react';

const IncomingRides = ({ incomingRides = [], onAccept, onDecline }) => {
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
            
            {/* 1. Header with Name and Badge */}
            <div className="card-header">
              <div className="user-info">
                <p className="passenger-name">User name : {ride.name}</p>
                <p className={`ride-type-badge ${ride.rideType}`}>
                  Ride Type : {ride.rideType.toUpperCase()}
                </p>
              <div className="fare-display">Fare : ₹{ride.fare}</div>
              </div>
            </div>
            
            <div className="card-body">
              {/* 2. Visual Track with Address logic */}
              <div className="location-track">
                <div className="track-icons">
                  {/* <div className="dot start"></div>
                  <div className="line"></div>
                  <div className="dot end"></div> */}
                </div>
                <div className="track-details">
                  <div className="location-point">
                    <label>PICKUP</label>
                    <p className="address-text">{ride.startAddress}</p>
                  </div>
                  <div className="location-point">
                    <label>DESTINATION</label>
                    <p className="address-text">{ride.endAddress}</p>
                  </div>
                </div>
              </div>

              {/* 3. New: Contact Info Row */}
              <div className="contact-info">
                <span>📞 {ride.userMobNo}</span>
              </div>
            </div>

            {/* 4. Action Buttons passed from parent */}
            <div className="card-actions">
              <button 
                className="btn-decline" 
                onClick={() => onDecline(ride)}
              >
                Decline
              </button>
              <button 
                className="btn-accept" 
                onClick={() => onAccept(ride)}
              >
                Accept & Go
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomingRides;