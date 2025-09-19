import React, { useEffect, useState } from "react";
import ProfileView from "./ProfileView";
import LoginView from "./LoginView";
import "./Profile.css";
import { useSelector } from "react-redux";

export default function Profile() {
  const isLoggedIn = useSelector((state) => state?.auth?.isLoggedIn);

  return (
    <div className="app-modern-container">
      {isLoggedIn ? (
        <ProfileView  />
      ) : (
        <LoginView />
      )}
    </div>
  );
}
