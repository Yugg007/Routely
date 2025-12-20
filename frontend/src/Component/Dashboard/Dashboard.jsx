import React from "react";
import { useSelector } from "react-redux";
import UserDashboard from "./UserDashboard/UserDashboard";
import DriverDashboard from "./DriverDashboard/DriverDashboard";

const Dashboard = () => {
  const user = useSelector((state) => state?.authCache?.user);
  const isLoggedIn = useSelector((state) => state?.authCache?.isLoggedIn);

  console.log("user - ", user);

  // 🔹 Still checking auth? Show loader
  if (!isLoggedIn || user === undefined) {
    return <div>Loading dashboard...</div>; // replace with spinner if you have one
  }

  return user?.isDriver === "true" ? <DriverDashboard /> : <UserDashboard />;
};

export default Dashboard;
