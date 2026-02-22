import React from "react";
import { useSelector } from "react-redux";
import ProfileView from "./ProfileView";
import LoginView from "./LoginView";
import "./Profile.css";
import { IS_AUTHENTICATED } from "../../store/authCacheSlice";

export default function Profile() {
  const isAuthenticated = useSelector(IS_AUTHENTICATED);

  return (
    <main className="profile-page-wrapper">
      <div className="app-modern-container">
      {isAuthenticated ? (
        <ProfileView />
      ) : (
        <LoginView />
      )}
      </div>
    </main>
  );
}