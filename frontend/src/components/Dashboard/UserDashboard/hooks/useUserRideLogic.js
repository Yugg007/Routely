// hooks/useUserRideLogic.js
export const useUserRideLogic = (user, isLoaded, routeCache) => {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    pickup: null, drop: null, drivers: Data.Drivers_Temp_Location,
    routePath: null, distanceKm: 0, etaMin: 0, estimatedFare: 0,
    findingDriver: false, status: ""
  });

  const { sendMessage } = useWebSocket(Property.User_WS_URL, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'DriverLocationAround3Km') {
        setState(prev => ({ ...prev, drivers: data.payload }));
      }
    },
    shouldReconnect: () => true,
  });

  // Effect: Initial Geolocation
  useEffect(() => {
    if (isLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current Location" };
        setState(prev => ({ ...prev, pickup: loc }));
        // Logic for reverse geocoding would go here
      });
    }
  }, [isLoaded]);

  // Effect: Sync Location to Socket
  useEffect(() => {
    if (state.pickup && isLoaded) {
      sendMessage(JSON.stringify(state.pickup));
    }
  }, [state.pickup, isLoaded, sendMessage]);

  return { state, setState, sendMessage };
};