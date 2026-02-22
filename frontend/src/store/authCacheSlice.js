import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isChecking: true, // Added to handle the "Initial Load" state
  lastUpdated: null,
};

const authSlice = createSlice({
  name: "authCache", // Match the key used in your rootReducer (store.js)
  initialState,
  reducers: {
    setAuthSession: (state, action) => {
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.lastUpdated = new Date().toISOString();
      }
      state.isChecking = false; // Auth check complete
    },
    updateUserWorkflowState: (state, action) => {
      if (state.user) {
        state.user.actorState = action.payload;
      }
    },
    clearAuthSession: () => ({ ...initialState, isChecking: false }),
  },
});

// --- SELECTORS ---
//Export these as individual named functions
export const USER = (state) => state.authCache?.user;
export const IS_AUTHENTICATED = (state) => state.authCache?.isAuthenticated;
export const ACTOR_STATE = (state) => state.authCache?.user?.actorState;
export const ID = (state) => state.authCache?.user?.id;

// --- EXPORTS ---
export const { 
  setAuthSession, 
  updateUserWorkflowState, 
  clearAuthSession 
} = authSlice.actions;

export default authSlice.reducer;