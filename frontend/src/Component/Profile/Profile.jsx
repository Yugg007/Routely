import React, { useEffect, useState } from 'react';
import './Profile.css';
import ProfileView from './ProfileView';
import LoginView from './LoginView';

export default function Profile({ isLoggedIn, onLogin, handleLogout }) {
  const [isChecking, setIsChecking] = useState(false);  
  const [user, setUser] = useState(null);

  const handleLogin = (email) => {
    onLogin(email);
  };


  if (isChecking) {
    return (
      <div className="routely-page">
        <div className="routely-loader" aria-live="polite">Checking authentication…</div>
      </div>
    );
  }

  return (
    <div className="routely-page">
      {isLoggedIn ? (
        <ProfileView user={user} onLogout={handleLogout} />
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </div>
  );
}

