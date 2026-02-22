import { createSlice } from "@reduxjs/toolkit";

const routeCacheSlice = createSlice({
  name: "routeCache",
  initialState: {
    routes : {
        "i am key" : "i am value"
    }, // { "<pickup_lat>,<pickup_lng>_<drop_lat>,<drop_lng>_<rideTypeId>": { path, distanceKm, durationMin, bounds } }
  },
  reducers: {
    cacheRoute: (state, action) => {
      const { pickup, drop, rideTypeId, data } = action.payload;
      const key = `${pickup.lat},${pickup.lng}_${drop.lat},${drop.lng}_${rideTypeId}`;
      state.routes[key] = data;
    }
    },
});


export const { cacheRoute } = routeCacheSlice.actions;

export default routeCacheSlice.reducer; 