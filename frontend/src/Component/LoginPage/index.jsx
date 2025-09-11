import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaArrowRight, FaIdBadge } from "react-icons/fa";
import { RiLockPasswordLine } from "react-icons/ri";
import { BackendService } from '../../Utils/Api\'s/ApiMiddleWare';
import ApiEndpoints from '../../Utils/Api\'s/ApiEndpoints';
import './style.css';
import ProfileSection from "./ProfileSection";
import Storage from "../../Utils/Storage";

const LoginPage = ({ isLoggerIn, setIsLoggedIn, user, setUser, authStatus }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Test@1234");
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    try {
      const userPayload = {
        username,
        email,
        password,
        firstName: name
      };

      const response = await BackendService(
        isLogin ? ApiEndpoints.login : ApiEndpoints.register,
        userPayload
      );

      if (response?.data) {
        Storage.setStorageData("username", response?.data.username);
        setUser(response.data);
        setIsLoggedIn(true);
      } else {
        alert("Login/Register failed. Please check credentials.");
      }
    } catch (err) {
      console.error("Login/Register Error:", err);
      alert("Something went wrong.");
    }
  };

  useEffect(() => {
    if (user == null) {
      authStatus();
    }
  }, [user]);

  return (
    <>
      {isLoggerIn ? (
        <div className="profile-wrapper">
          <ProfileSection user={user} setUser={setUser} />
        </div>
      ) : (
        <div className="auth-wrapper">
          <div className="auth-card">
            <h2>{isLogin ? "Login to Continue" : "Create an Account"}</h2>

            <div className="input-group">
              <FaEnvelope className="icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>



            {!isLogin && (
              <div className="input-group">
                <FaUser className="icon" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            {!isLogin && (
              <div className="input-group">
                <FaIdBadge className="icon" />
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <RiLockPasswordLine className="icon" />
              <input
                type="text"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={handleSubmit}>
              {isLogin ? "Login" : "Register"} <FaArrowRight />
            </button>

            <p className="toggle-text">
              {isLogin ? "Don't have an account?" : "Already a user?"}{" "}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// const ProfileSection = ({ user }) => {
//   console.log(user)
//   return (
//     <div className="profile-card">
//       <h2 className="profile-name">{user?.personInfos?.firstName || user.username}</h2>
//       <p className="profile-email">{user?.email}</p>

//       <div className="profile-info">
//         <p><strong>Skills:</strong> {user?.personInfos?.skills || "N/A"}</p>
//         <p><strong>Education:</strong> {user?.personInfos?.education || "N/A"}</p>
//         <p><strong>Description:</strong> {user?.personInfos?.description || "N/A"}</p>
//       </div>
//     </div>
//   );
// };

export default LoginPage;
