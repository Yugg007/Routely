import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ApiEndpoints from "../../Utils/Api's/ApiEndpoints";
import { BackendService } from "../../Utils/Api's/ApiMiddleWare";
import { storeLogout } from "../../store/feature";

export default function ProfileView() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user);
  
  useEffect(() => {
    console.log("user - ", user);
  },[user])

  const isDriver = user?.isDriver === true || user?.isDriver === "true";

  const handleLogout = async () => {
    try {
      const response = await BackendService(ApiEndpoints.logout);

      if (response?.data) {
        dispatch(storeLogout());
      } else {
        console.warn("Auth status response is empty or malformed:", response);
      }
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
    }
  }

  return (
    <div className="profile-modern-container">
      {/* Header */}
      <header className="profile-modern-header">
        <div className="profile-modern-info">
          <h1>{user?.name || "User"}</h1>
          <p>{user?.email || "—"}</p>
          <p className="profile-muted">📱 {user?.mobileNo || "—"}</p>
        </div>
      </header>

      {/* Actions */}
      <section className="profile-modern-actions">
        <p className="profile-muted">
          Manage your Routely account, bookings, and preferences.
        </p>
        <div className="profile-modern-btn-group">
          {/* <button
            className="btn btn-primary"
            onClick={() => alert("Edit profile")}
          >
            Edit Profile
          </button> */}
          {/* <button className="btn btn-ghost" onClick={handleLogout}> */}
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {/* Vehicle Section - only for Drivers */}
      {isDriver && (
        <section className="profile-modern-vehicle">
          <h2>🚗 Vehicle Management</h2>
          <p className="profile-muted">
            Add and manage your vehicle details for driving with Routely.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => alert("Add vehicle flow here")}
          >
            Add Vehicle
          </button>
        </section>
      )}
    </div>
  );
}
