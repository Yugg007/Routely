import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { storeLogin } from "./store/authCacheSlice";


import "./App.css";
import Dashboard from "./Component/Dashboard/Dashboard";
import Navbar from "./Component/Navbar/Navbar";
import Profile from "./Component/Profile/Profile";
import { BackendService } from "./Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "./Utils/Api's/ApiEndpoints";
import Help from "./Component/Help";
import { useDispatch, useSelector } from "react-redux";

export default function App() {
  const dispatch = useDispatch();

  const authStatus = async () => {
    try {
      const response = await BackendService(ApiEndpoints.authStatus);
      if (response?.data) {
        dispatch(storeLogin(response.data));
      } else {
        console.warn("Auth status response is empty or malformed:", response);
      }
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
    }
  }

  useEffect(() => {
    authStatus();
  }, [dispatch ]);

  return (
    <Router>
      <div className="app-container">
        {/* ✅ Fixed Navbar */}
        <Navbar />

        {/* ✅ Route-based content */}
        <div className="app-content">
          <Routes>
            <Route exact path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </div>
        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Routely. All rights reserved.</p>
            <div className="footer-links">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
