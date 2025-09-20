import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./authCacheSlice";
import routeCacheReducer from "./routeCacheSlice";


export const store = configureStore({
    reducer : {
        auth : userReducer,
        routeCache : routeCacheReducer
    }
})