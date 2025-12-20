import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useWebSocket from "react-use-websocket";
import { BackendService } from "../../../Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "../../../Utils/Api's/ApiEndpoints";
import DriverDashboardUI from "./DriverDashboardUI";
import "./DriverDashboard.css";

const DRIVER_STATES = {
  OFFLINE: "OFFLINE",
  ONLINE_IDLE: "ONLINE_IDLE",
  REQUESTED: "REQUESTED",
  EN_ROUTE_TO_PICKUP: "EN_ROUTE_TO_PICKUP",
  ARRIVED_PICKUP: "ARRIVED_PICKUP",
  IN_RIDE: "IN_RIDE",
  COMPLETED: "COMPLETED",
};

const DEFAULT_ACCEPT_SECONDS = 20;
const LOCATION_PING_INTERVAL = 5000;

export default function DriverDashboard() {
  const auth = useSelector((state) => state.authCache);

  const [driverState, setDriverState] = useState(DRIVER_STATES.OFFLINE);
  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [incomingRides, setIncomingRides] = useState([]);
  const [acceptCountdown, setAcceptCountdown] = useState(DEFAULT_ACCEPT_SECONDS);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locationWatchId = useRef(null);
  const pingInterval = useRef(null);
  const acceptTimer = useRef(null);

  // ---------------- WebSocket ----------------
  const WS_URL = "wss://localhost:8002/ws/driver-socket";

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log("WebSocket connected"),
    onClose: () => console.log("WebSocket disconnected"),
    onError: (err) => console.error("WebSocket error", err),
    shouldReconnect: () => true, // auto reconnect
  });

  const socketConnected = readyState === 1;

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = lastMessage.data;
      try {
        const parsedMsg = JSON.parse(msg);
        setIncomingRides((prevRides) => {
          const exists = prevRides.some((ride) => ride.ride_id === parsedMsg.ride_id);
          if (exists) {
            return prevRides;
          }
          return [...prevRides, parsedMsg];
        });
        setDriverState(DRIVER_STATES.REQUESTED);
        setAcceptCountdown(DEFAULT_ACCEPT_SECONDS);
        startAcceptTimer();
      } catch (error) {

      }
      console.log("WebSocket message received:", msg);
    } catch (e) {
      console.warn("Invalid WebSocket message", lastMessage.data);
    }
  }, [lastMessage]);
  // ---------------- Lifecycle ----------------
  // useEffect(() => {
  //   window.addEventListener("beforeunload", cleanup);

  //   // Mock test ride
  //   const testRideTimer = setTimeout(() => {
  //     let testRide ={
  //       rideId: "RIDE123",
  //       pickup: { lat: 12.9716, lng: 77.5946, address: "Bengaluru" },
  //       dropoff: { lat: 12.9352, lng: 77.6245, address: "Koramangala" },
  //       passenger: { name: "Test User" },
  //     }
  //     setIncomingRides([testRide]);
  //     setDriverState(DRIVER_STATES.REQUESTED);
  //     startAcceptTimer();
  //   }, 5000);

  //   return () => {
  //     cleanup();
  //     clearTimeout(testRideTimer);
  //     window.removeEventListener("beforeunload", cleanup);
  //   };
  // }, []);

  // const cleanup = () => {
  //   clearAcceptTimer();
  //   clearPingInterval();
  //   stopLocationWatch();
  // };

  // ---------------- Location ----------------
  const startLocationWatch = () => {
    if (!("geolocation" in navigator)) return;

    if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);

    locationWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        if (true || coords.accuracy < 100) {
          setCurrentPosition(coords);
          sendLocationToServer(coords);
          return true;
        }
      },
      (err) => setError("Failed to get location: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return false;
  };

  const stopLocationWatch = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  };

  const startPingInterval = () => {
    if (!currentPosition) return;
    clearPingInterval();
    pingInterval.current = setInterval(() => {
      console.log("Ping date - ", new Date());
      if (currentPosition) sendLocationToServer(currentPosition);
    }, LOCATION_PING_INTERVAL);
  };

  const clearPingInterval = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  };

  const sendLocationToServer = async (coords) => {
    const { user } = auth;
    const payload = {
      driverId: user?.userId,
      lat: coords.lat,
      lng: coords.lng,
      timestamp: Date.now(),
      accuracy: coords.accuracy || 0,
    };
    console.log("Sending location to server:", payload);
    if (socketConnected) {
      sendMessage(JSON.stringify(payload));
    } else {
      try {
        await BackendService(ApiEndpoints.pingLocation, payload);
      } catch { }
    }
  };

  // ---------------- Ride Request ----------------
  // const handleSocketMessage = (msg) => {
  //   const { type, payload } = msg;
  //   switch (type) {
  //     case "ride_request":
  //       setIncomingRide(payload);
  //       setDriverState(DRIVER_STATES.REQUESTED);
  //       setAcceptCountdown(DEFAULT_ACCEPT_SECONDS);
  //       startAcceptTimer();
  //       break;
  //     case "ride_cancelled":
  //       if (incomingRide?.rideId === payload.rideId) clearIncomingRequest();
  //       if (activeRide?.rideId === payload.rideId) {
  //         setActiveRide(null);
  //         setDriverState(DRIVER_STATES.ONLINE_IDLE);
  //       }
  //       break;
  //     default:
  //       break;
  //   }
  // };

  const startAcceptTimer = () => {
    clearAcceptTimer();
    acceptTimer.current = setInterval(() => {
      setAcceptCountdown((prev) => {
        if (prev <= 1) {
          declineIncomingRide("timeout");
          return DEFAULT_ACCEPT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearAcceptTimer = () => {
    if (acceptTimer.current) {
      clearInterval(acceptTimer.current);
      acceptTimer.current = null;
    }
  };

  // const clearIncomingRequest = () => {
  //   clearAcceptTimer();
  //   setIncomingRide(null);
  //   setAcceptCountdown(DEFAULT_ACCEPT_SECONDS);
  //   setDriverState(DRIVER_STATES.ONLINE_IDLE);
  // };

  const acceptIncomingRide = async (ride) => {
    if (!ride) return;
    setLoading(true);
    try {
	// private Long driver_id;
	// private String driverName;
	// private String driverMobNo;

      const body = {
        ...ride,
        driver_id: auth.user?.userId,
        driverName: auth.user?.name,
        driverMobNo: auth.user?.mobileNo
      }

      const response = await BackendService(ApiEndpoints.acceptRide, body);
      console.log("Accept ride response:", response);
      // setActiveRide(incomingRide);
      // setIncomingRide(null);
      // setDriverState(DRIVER_STATES.EN_ROUTE_TO_PICKUP);

    } finally {
      setLoading(false);
    }
  };

  const declineIncomingRide = async (reason = "driver_declined") => {
    // if (!incomingRide) return;
    // try {
    //   await BackendService(ApiEndpoints.declineRide, { rideId: incomingRide.rideId, reason });
    // } finally {
    //   clearIncomingRequest();
    // }
  };

  // ---------------- Online / Offline ----------------
  const goOnline = async () => {
    const { user } = auth;
    if (!user) return;
    setLoading(true);
    try {
      startLocationWatch();
      startPingInterval();
      await BackendService(ApiEndpoints.driverGoOnline, { driverId: user.id });
      setIsOnline(true);
      setDriverState(DRIVER_STATES.ONLINE_IDLE);
    } finally {
      setLoading(false);
    }
  };

  const goOffline = async () => {
    const { user } = auth;
    setLoading(true);
    try {
      await BackendService(ApiEndpoints.driverGoOffline, { driverId: user?.id });
    } finally {
      cleanup();
      setIsOnline(false);
      setDriverState(DRIVER_STATES.OFFLINE);
      setActiveRide(null);
      setIncomingRides([]);
      setLoading(false);
    }
  };

  return (
    <DriverDashboardUI
      driverState={driverState}
      isOnline={isOnline}
      currentPosition={currentPosition}
      socketConnected={socketConnected}
      incomingRides={incomingRides}
      acceptCountdown={acceptCountdown}
      activeRide={activeRide}
      loading={loading}
      error={error}
      goOnline={goOnline}
      goOffline={goOffline}
      acceptIncomingRide={acceptIncomingRide}
      declineIncomingRide={declineIncomingRide}
    />
  );
}
