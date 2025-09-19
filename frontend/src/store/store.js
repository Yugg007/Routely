import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./feature";


export const store = configureStore({
    reducer : {
        auth : userReducer
    }
})