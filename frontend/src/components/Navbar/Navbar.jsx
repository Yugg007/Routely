import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="rd-navbar" role="banner">
      <div className="rd-nav-inner">
        <div className="rd-brand">
          <div className="rd-logo">🚖</div>
          <div className="rd-title">Routely</div>
        </div>

        <nav className="rd-topnav" aria-label="Main navigation">
          <NavLink to="/" className="rd-nav-btn">Home</NavLink>
          <NavLink to="/profile" className="rd-nav-btn">Profile</NavLink>
          <NavLink to="/help" className="rd-nav-btn">Help</NavLink>
        </nav>

        <div className="rd-actions">
          <button className="rd-profile">AJ</button>
        </div>
      </div>
    </header>
  );
}
