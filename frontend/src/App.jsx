import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Static Imports
import Dashboard from "./components/Dashboard/Dashboard";
import Profile from "./components/Profile/Profile";
import Help from "./components/Help";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer";

import { IS_AUTHENTICATED, setAuthSession, USER } from "./store/authCacheSlice";
import { BackendService } from "./utils/ApiConfig/ApiMiddleWare";
import ApiEndpoints from "./utils/ApiConfig/ApiEndpoints";

import "./App.css";

/**
 * ProtectedRoute: Logic-based component for Route Security.
 * SDE3 Tip: Decoupling the protection logic makes testing easier.
 */
const ProtectedRoute = ({ isAuthenticated, isChecking, children }) => {
  if (isChecking) {
    return (
      <div className="app-init-loader">
        <div className="spinner"></div>
        <p>Initializing Session...</p>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/profile" replace />;
};

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector(USER);
  const isAuthenticated = useSelector(IS_AUTHENTICATED);
  
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await BackendService(ApiEndpoints.authStatus);
        if (response?.data) {
          dispatch(setAuthSession(response.data));
        }
      } catch (error) {
        // Log errors to an external monitoring service in production (e.g., Sentry)
        console.error("Critical: Session verification failed", error);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [dispatch]);

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="app-content">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isChecking={isChecking}>
                <Dashboard user={user} />
              </ProtectedRoute>
            }
          />
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          
          {/* Default Catch-all: Ensures users don't land on dead pages */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}