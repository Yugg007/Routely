import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./authCacheSlice";
import routeCacheReducer from "./routeCacheSlice";


export const store = configureStore({
    reducer : {
        authCache : userReducer,
        routeCache : routeCacheReducer
    }
})