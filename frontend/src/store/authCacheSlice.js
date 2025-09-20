import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  authStatus: false, // renamed for clarity
};

const userSlice = createSlice({
  name: "AuthDetail",
  initialState,
  reducers: {
    storeLogin: (state, action) => {
      if (!action.payload) {
        console.warn("⚠️ storeLogin called without payload");
        return;
      }
      state.user = action.payload;
      state.isLoggedIn = true
    },
    storeLogout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { storeLogin, storeLogout } = userSlice.actions;

export default userSlice.reducer;
