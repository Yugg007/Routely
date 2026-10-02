import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import Constants from '../../../../../constants/Constant';
import Data from '../../../../../constants/Data';
import { haversineDistanceKm } from '../../../Functionality';
import "./GMap.css";
const DriverMapLibraries = Constants.MAP_LIBRARYS;
const FALLBACK_MAP_CENTER = Data.USER_FALLBACK;

const GMap = ({ currentPosition, activeDestination }) => {
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [isFollowMode, setIsFollowMode] = useState(true);
    const mapRef = useRef(null);
    const lastRouteRequestRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: DriverMapLibraries,
    });

    // Fetch Route Logic
    const calculateRoute = useCallback(async () => {
        const hasCurrentPosition = Number.isFinite(currentPosition?.lat) && Number.isFinite(currentPosition?.lng);
        const hasDestination = Number.isFinite(activeDestination?.lat) && Number.isFinite(activeDestination?.lng);

        if (!isLoaded || !hasCurrentPosition || !hasDestination) {
            setDirectionsResponse(null);
            return;
        }

        const destinationKey = `${activeDestination.lat},${activeDestination.lng}`;
        const previousRequest = lastRouteRequestRef.current;
        if (
            previousRequest?.destinationKey === destinationKey &&
            haversineDistanceKm(
                previousRequest.origin.lat,
                previousRequest.origin.lng,
                currentPosition.lat,
                currentPosition.lng,
            ) < 0.15
        ) {
            return;
        }
        lastRouteRequestRef.current = { origin: currentPosition, destinationKey };

        const directionsService = new window.google.maps.DirectionsService();
        try {
            const result = await directionsService.route({
                origin: { lat: currentPosition.lat, lng: currentPosition.lng },
                destination: { lat: activeDestination.lat, lng: activeDestination.lng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            });
            if (result.status === 'OK') setDirectionsResponse(result);
        } catch (error) {
            console.warn("Route failed:", error);
        }
    }, [isLoaded, activeDestination?.lat, activeDestination?.lng, currentPosition?.lat, currentPosition?.lng]);

    useEffect(() => { calculateRoute(); }, [calculateRoute]);

    // Auto-Centering / Bounds Logic
    const adjustBounds = useCallback(() => {
        if (!mapRef.current || !currentPosition || !isFollowMode) return;

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(currentPosition);
        
        if (activeDestination?.lat) {
            bounds.extend({ lat: activeDestination.lat, lng: activeDestination.lng });
            mapRef.current.fitBounds(bounds, { top: 70, bottom: 250, left: 50, right: 50 });
        } else {
            mapRef.current.panTo(currentPosition);
        }
    }, [currentPosition, activeDestination, isFollowMode]);

    useEffect(() => { adjustBounds(); }, [adjustBounds]);

    // Manual Intervention Logic
    const onDragStart = () => setIsFollowMode(false);
    
    const handleRecenter = () => {
        setIsFollowMode(true);
        if (currentPosition) mapRef.current.panTo(currentPosition);
    };

    if (loadError) return <div className="map-error">Error loading maps</div>;
    if (!isLoaded) return <div className="loading-screen">Initializing Map...</div>;

    return (
        <div className="map-wrapper" style={{ position: 'relative', height: '100%', width: '100%' }}>
            <GoogleMap
                mapContainerClassName="map-container"
                onLoad={(map) => (mapRef.current = map)}
                onDragStart={onDragStart} // Detect when driver manually moves map
                center={currentPosition || FALLBACK_MAP_CENTER}
                zoom={15}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false, // Cleaner UI
                    gestureHandling: "greedy",
                    styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
                }}
            >
                {currentPosition && (
                    <Marker
                        position={currentPosition}
                        label={{
                            text: "🚗",
                            fontSize: "24px"
                        }}
                        icon={{
                            url: "/car-icon.png",
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 20),
                        }}
                        zIndex={10}
                    />
                )}

                {activeDestination?.lat && (
                    <Marker
                        position={{ lat: activeDestination.lat, lng: activeDestination.lng }}
                        label={{
                            text: activeDestination.label || "Destination",
                            color: "black",
                            className: "map-label-bg"
                        }}
                    />
                )}

                {directionsResponse && (
                    <DirectionsRenderer
                        directions={directionsResponse}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: "#2196F3", strokeWeight: 6 }
                        }}
                    />
                )}
            </GoogleMap>

            {!currentPosition && (
                <div className="gps-status-pill" role="status">
                    Waiting for your location
                </div>
            )}

            {/* Recenter Button Overlay */}
            {!isFollowMode && (
                <button className="recenter-btn" onClick={handleRecenter}>
                   <span className="icon">🎯</span> Recenter
                </button>
            )}
        </div>
    );
}

export default React.memo(GMap);