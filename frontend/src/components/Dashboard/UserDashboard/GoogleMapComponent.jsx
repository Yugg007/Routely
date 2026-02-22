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

  // 2. Stable Icon Definitions (Use useMemo to prevent re-instantiating SVG paths)
  const pickupIcon = useMemo(() => ({
    path: window.google?.maps?.SymbolPath?.CIRCLE,
    fillColor: "#000",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#fff",
    scale: 7,
  }), []);

  const dropIcon = useMemo(() => ({
    path: "M 0,0 10,0 10,10 0,10 Z",
    fillColor: "#4A63E7",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#fff",
    scale: 1.5,
    anchor: window.google ? new window.google.maps.Point(5, 5) : null,
  }), []);

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

      {renderDrivers()}
    </GoogleMap>
  );
});

export default GoogleMapComponent;