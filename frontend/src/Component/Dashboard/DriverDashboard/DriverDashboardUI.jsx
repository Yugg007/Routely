import React from "react";
import "./DriverDashboard.css";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "400px" };
const center = { lat: 12.9716, lng: 77.5946 };
const DriverDashboardUI = ({
  driverState,
  isOnline,
  currentPosition,
  socketConnected,
  incomingRides,
  acceptCountdown,
  activeRide,
  loading,
  error,
  goOnline,
  goOffline,
  acceptIncomingRide,
  declineIncomingRide,
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });
  return (
    <div className="driver-dashboard">
      <header>
        <h2>Driver Dashboard</h2>
        <div>
          <span>Socket: {socketConnected ? "Connected" : "Disconnected"}</span>
          <button onClick={isOnline ? goOffline : goOnline} disabled={loading}>
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>
      </header>

      <main>
        <section className="location">
          {currentPosition ? (
            <>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={12}
              >
                <Marker position={currentPosition} />
              </GoogleMap>
              <p>
                Lat: {currentPosition.lat.toFixed(6)}, Lng:{" "}
                {currentPosition.lng.toFixed(6)}
              </p>
            </>
          ) : (
            <p>No location available</p>
          )}
        </section>

        <section className="rides">
          {incomingRides && incomingRides.length > 0 ? (
            incomingRides.map((ride, index) => (
              <div className="incoming" key={index}>
                <h3>New Ride Request</h3>
                <p>Passenger: {ride?.name}</p>
                <p>Pickup: {ride?.startAddress}</p>
                <p>Dropoff: {ride?.endAddress}</p>
                <p>Accept in {ride.acceptCountdown}s</p>
                <button onClick={() => acceptIncomingRide(ride)} disabled={loading}>
                  Accept
                </button>
                <button onClick={() => declineIncomingRide(ride)} disabled={loading}>
                  Decline
                </button>
              </div>
            ))
          ) : (
            <p>No incoming rides</p>
          )}


          {activeRide && (
            <div className="active">
              <h3>Active Ride</h3>
              <p>Passenger: {activeRide.passenger?.name}</p>
              <p>Pickup: {activeRide.pickup?.address}</p>
              <p>Dropoff: {activeRide.dropoff?.address}</p>
            </div>
          )}
        </section>

        {error && <div className="error">{error}</div>}
      </main>
    </div>
  );
};

export default DriverDashboardUI;
