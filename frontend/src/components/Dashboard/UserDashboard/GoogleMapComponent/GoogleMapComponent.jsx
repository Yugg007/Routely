import { useMemo, useCallback, useEffect, useRef } from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { RIDE_TYPES } from "../../Functionality";
import STATE from "../../../../constants/States";
import Data from "../../../../constants/Data";
import "./GoogleMapComponent.css";

const USER_STATES = STATE.USER_STATES;

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const FALLBACK_MAP_CENTER = Data.USER_FALLBACK;

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "greedy",
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const GoogleMapComponent = ({
    locationRef,
    mapRef,
    actorState,
  }) => {
    const { center, pickup, drop, routePath, drivers, rideDriver } =
      locationRef.current || {};

    console.log("RideDriver in GoogleMapComponent:", rideDriver);
    const driverLabel =
      [rideDriver?.name, rideDriver?.driverName].find(
        (name) => typeof name === "string" && name.trim(),
      )?.trim() || "Your Driver";
    const isMatching = actorState === USER_STATES.MATCHING;
    const isWaitingForDriver = actorState === USER_STATES.WAITING_FOR_DRIVER;
    const isOnTrip = actorState === USER_STATES.ON_TRIP;
    const hasFittedWaitingDriverRef = useRef(false);

    const driverEmoji =  "🚗";//RIDE_TYPES[0]?.emoji ||

    const pickupIcon = useMemo(() => {
      if (!window.google) return null;

      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: "#16a34a",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 9,
      };
    }, []);

    const dropIcon = useMemo(() => {
      if (!window.google) return null;

      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: "#dc2626",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 9,
      };
    }, []);

    const driverIcon = useMemo(() => {
      if (!window.google) return null;

      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillOpacity: 0,
        strokeWeight: 0,
        scale: 10,
      };
    }, []);

    const routeOptions = useMemo(
      () => ({
        strokeColor: "#2563eb",
        strokeWeight: 6,
        strokeOpacity: 0.9,
        geodesic: true,
        lineJoin: "round",
      }),
      [],
    );

    const routeOutlineOptions = useMemo(
      () => ({
        strokeColor: "#ffffff",
        strokeWeight: 10,
        strokeOpacity: 0.9,
        geodesic: true,
        lineJoin: "round",
      }),
      [],
    );

    /*
     * -----------------------------
     * AUTO FIT
     * -----------------------------
     */

    useEffect(() => {
      if (!isWaitingForDriver) {
        hasFittedWaitingDriverRef.current = false;
      }

      if (!mapRef.current || !window.google) return;

      if (isWaitingForDriver && !rideDriver) {
        if (pickup) {
          mapRef.current.panTo(pickup);
          mapRef.current.setZoom(17);
        }
        return;
      }

      if (isWaitingForDriver && hasFittedWaitingDriverRef.current) return;

      if (isWaitingForDriver) {
        hasFittedWaitingDriverRef.current = true;
      }

      const bounds = new window.google.maps.LatLngBounds();

      if (isWaitingForDriver) {
        if (rideDriver) {
          bounds.extend({ lat: rideDriver.lat, lng: rideDriver.lng });
        }
        if (pickup) bounds.extend(pickup);
      } else if (isOnTrip) {
        if (pickup) bounds.extend(pickup);
        if (drop) bounds.extend(drop);
      } else {
        if (pickup) bounds.extend(pickup);
        if (drop) bounds.extend(drop);
      }

      if (!bounds.isEmpty()) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        if (ne.lat() === sw.lat() && ne.lng() === sw.lng()) {
          mapRef.current.panTo(ne);
          mapRef.current.setZoom(17);
        } else {
          mapRef.current.fitBounds(bounds, 100);
        }
      }
    }, [
      pickup,
      drop,
      rideDriver,
      actorState,
      isWaitingForDriver,
      isOnTrip,
      mapRef,
    ]);

    /*
     * -----------------------------
     * DRIVER MARKERS
     * -----------------------------
     */

    const renderDrivers = useCallback(() => {
      if (!drivers?.length) return null;

      return drivers.map((driver) => (
        <Marker
          key={driver.id || `${driver.lat}-${driver.lng}`}
          position={{
            lat: driver.lat,
            lng: driver.lng,
          }}
          icon={driverIcon}
          label={{
            text: driverEmoji,
            fontSize: "24px",
          }}
        />
      ));
    }, [drivers, driverIcon, driverEmoji]);

    const renderRideDriver = useCallback(() => {
      if (!rideDriver) return null;

      return (
        <Marker
          key={rideDriver.id || `${rideDriver.lat}-${rideDriver.lng}`}
          position={{
            lat: rideDriver.lat,
            lng: rideDriver.lng,
          }}
          icon={driverIcon}
          label={{
            text: driverEmoji,
            fontSize: "26px",
          }}
        />
      );
    }, [rideDriver, driverIcon, driverEmoji]);

    /*
     * -----------------------------
     * RECENTER
     * -----------------------------
     */

    const handleRecenter = () => {
      if (!mapRef.current) return;

      let position = pickup;

      if (isWaitingForDriver || isOnTrip) {
        position = rideDriver
          ? {
              lat: rideDriver.lat,
              lng: rideDriver.lng,
            }
          : pickup;
      }

      if (position) {
        mapRef.current.panTo(position);
        mapRef.current.setZoom(17);
      }
    };

    /*
     * -----------------------------
     * UI STATE
     * -----------------------------
     */

    const getStatusText = () => {
      if (isMatching) return "Finding your driver";
      if (isWaitingForDriver) return driverLabel + " is on the way";
      if (isOnTrip) return "You're on your way";
      return "";
    };

    const getStatusIcon = () => {
      if (isMatching) return "🔎";
      if (isWaitingForDriver) return "🚗";
      if (isOnTrip) return "🛣️";
      return "";
    };

    return (
      <div className="ride-map">
        {/* MAP */}

        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center || pickup || FALLBACK_MAP_CENTER}
          zoom={center || pickup ? 14 : 12}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={MAP_OPTIONS}
        >
          {/* PICKUP */}

          {pickup && (
            <Marker
              position={pickup}
              icon={pickupIcon}
              label={{
                text: "A",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "700",
              }}
            />
          )}

          {/* DESTINATION */}

          {drop && (
            <Marker
              position={drop}
              icon={dropIcon}
              label={{
                text: "B",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "700",
              }}
            />
          )}

          {/* ROUTE OUTLINE */}

          {routePath?.length > 0 && (
            <Polyline path={routePath} options={routeOutlineOptions} />
          )}

          {/* ROUTE */}

          {routePath?.length > 0 && (
            <Polyline path={routePath} options={routeOptions} />
          )}

          {/* AVAILABLE DRIVERS */}

          {isMatching && renderDrivers()}

          {/* SELECTED DRIVER */}

          {(isWaitingForDriver || isOnTrip) && renderRideDriver()}
        </GoogleMap>

        {/* TOP STATUS */}

        {(isMatching || isWaitingForDriver || isOnTrip) && (
          <div className="ride-status-pill">
            <span className="ride-status-icon">{getStatusIcon()}</span>

            <span>{getStatusText()}</span>

            {isMatching && <span className="status-loader" />}
          </div>
        )}

        {/* RECENTER */}

        {(isWaitingForDriver || isOnTrip) && (
          <button
            className="recenter-button"
            onClick={handleRecenter}
            aria-label="Recenter map"
          >
            ◎
          </button>
        )}

        {/* BOTTOM SHEET */}
        {(isMatching || isWaitingForDriver || isOnTrip) && (
          <section className="ride-bottom-sheet" aria-label="Ride details">
            <div className="sheet-header">
              <div className="sheet-state-icon" aria-hidden="true">
                {getStatusIcon()}
              </div>
              <div className="sheet-heading">
                <span className="sheet-eyebrow">
                  {isMatching
                    ? "RIDE REQUEST"
                    : isWaitingForDriver
                      ? "DRIVER ARRIVAL"
                      : "CURRENT TRIP"}
                </span>
                <h3>{getStatusText()}</h3>
                <p>
                  {isMatching
                    ? "Looking for the closest available driver"
                    : isWaitingForDriver
                      ? "Your driver is heading to the pickup point"
                      : "Your destination and trip route"}
                </p>
              </div>
              {isMatching ? (
                <div className="search-animation" aria-label="Searching">
                  <span />
                  <span />
                  <span />
                </div>
              ) : rideDriver?.eta ? (
                <div
                  className="eta"
                  aria-label={`Estimated time ${rideDriver.eta} minutes`}
                >
                  <strong>{rideDriver.eta}</strong>
                  <span>min</span>
                </div>
              ) : null}
            </div>

            {(isWaitingForDriver || isOnTrip) && (
              <div className="driver-card">
                {/* <div className="driver-avatar" aria-hidden="true">
                  {driverEmoji}
                </div> */}
                <div className="driver-details">
                  <strong>{driverLabel}</strong>
                  <div className="driver-meta">
                    <span>★ {rideDriver?.rating || '5'}</span>
                    <span>{rideDriver?.vehicleNumber || '5372'}</span>
                    {!rideDriver && <span>Driver details loading</span>}
                  </div>
                </div>
                {rideDriver && (
                  <span
                    className="driver-live-indicator"
                    aria-label="Live location"
                  />
                )}
              </div>
            )}

            <div className="location-section" aria-label="Trip locations">
              <div className="route-heading">
                <span>TRIP ROUTE</span>
                {isOnTrip && (
                  <span className="route-live-label">IN PROGRESS</span>
                )}
              </div>
              <div className="location-row">
                <div className="location-marker pickup-marker">A</div>
                <div className="location-content">
                  <span>Pickup</span>
                  <strong>{pickup?.label || "Pickup location"}</strong>
                </div>
              </div>
              <div className="location-line" />
              <div className="location-row">
                <div className="location-marker drop-marker">B</div>
                <div className="location-content">
                  <span>Destination</span>
                  <strong>{drop?.label || "Your destination"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

export default GoogleMapComponent;
