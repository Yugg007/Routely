import React, { useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { RIDE_TYPES } from "../Functionality";
import STATE from '../../../constants/States';

const USER_STATES = STATE.USER_STATES;

// 1. Move static styles outside the component to prevent any re-allocation
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  gestureHandling: "greedy", // Better for mobile UX
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

const GoogleMapComponent = React.memo(({ center, mapRef, pickup, drop, routePath, drivers, actorState }) => {

const isOnTrip = actorState === USER_STATES.ON_TRIP
// PICKUP: A simple, bright green circle with a white border
  const pickupIcon = useMemo(() => {
    if (!window.google) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: "#22c55e", // Bright Green (Success/Start)
      fillOpacity: 1,
      strokeWeight: 3,
      strokeColor: "#ffffff", // White border makes it pop
      scale: 8,
    };
  }, []);

  // 🏁DROP-OFF: A "Backwards P" shape that looks like a Map Pin
  const dropIcon = useMemo(() => {
    if (!window.google) return null;
    return {
      path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: "#ef4444", // Bright Red (Stop/End)
      fillOpacity: 1,
      strokeWeight: 3,
      strokeColor: "#ffffff",
      scale: 6,
    };
  }, []);

  const polylineOptions = useMemo(() => ({
    strokeColor: "#4A63E7",
    strokeWeight: 5,
    strokeOpacity: 0.8,
    lineJoin: "round"
  }), []);

  // 3. Optimized "Auto-fit" Logic
  // Automatically adjust zoom to show both pickup and drop-off
  useEffect(() => {
    if (mapRef.current && pickup && drop) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(drop);
      mapRef.current.fitBounds(bounds, 100); // 100px padding
    }
  }, [pickup, drop, mapRef]);

  const showDriver = actorState !== USER_STATES.MATCHING && actorState !== USER_STATES.WAITING_FOR_DRIVER;
  const driverEmoji = RIDE_TYPES[0]?.emoji || "🚗";

  // 4. Custom Marker for Drivers (Native Marker is faster than OverlayView for lists)
  const renderDrivers = useCallback(() => {
    if (!showDriver || !drivers) return null;
    
    return drivers.map((driver) => (
      <Marker
        key={driver.id || `${driver.lat}-${driver.lng}`}
        position={{ lat: driver.lat, lng: driver.lng }}
        // Optimization: Use a label for the emoji instead of a heavy OverlayView
        label={{
          text: driverEmoji,
          fontSize: "24px"
        }}
        icon={{
          path: window.google?.maps?.SymbolPath?.CIRCLE,
          fillOpacity: 0, // Hide the actual marker circle, show only emoji
          strokeWeight: 0,
          scale: 10
        }}
      />
    ));
  }, [drivers, showDriver, driverEmoji]);

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={14}
      onLoad={(map) => (mapRef.current = map)}
      options={MAP_OPTIONS}
    >
      {pickup && (
        <Marker 
          position={pickup} 
          icon={pickupIcon}
        />
      )}

      {drop && (
        <Marker 
          position={drop} 
          icon={dropIcon}
        />
      )}

      {routePath && (
        <Polyline
          path={routePath}
          options={polylineOptions}
        />
      )}

      {!isOnTrip && renderDrivers()}
    </GoogleMap>
  );
});

export default GoogleMapComponent;