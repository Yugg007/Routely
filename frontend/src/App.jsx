import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import "./App.css";
import Dashboard from "./Component/Dashboard/Dashboard";
import Navbar from "./Component/Navbar/Navbar";
import Profile from "./Component/Profile/Profile";
import { BackendService } from "./Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "./Utils/Api's/ApiEndpoints";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authStatus = async () => {
    const response = await BackendService(ApiEndpoints.authStatus);
    if (response && response.data) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }

  const onLogin = (email) => {
    localStorage.setItem("email", email);
    setIsLoggedIn(true);
  }

  const handleLogout = async () => {
    const response = await BackendService(ApiEndpoints.logout, {});
    if (response) {
      alert("Logged out successfully.");
      setIsLoggedIn(false);
      localStorage.removeItem("email");
    }
  }

  useEffect(() => {
    authStatus();
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* ✅ Fixed Navbar */}
        <Navbar />

        {/* ✅ Route-based content */}
        <div className="app-content">
          <Routes>
            <Route exact path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile isLoggedIn={isLoggedIn} onLogin={onLogin} handleLogout={handleLogout}/>} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}
