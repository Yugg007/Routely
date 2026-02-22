import { useMemo } from "react";
import { useSelector } from "react-redux";
import UserDashboard from "./UserDashboard/UserDashboard";
import DriverDashboard from "./DriverDashboard/DriverDashboard";
import { IS_AUTHENTICATED, USER } from "../../store/authCacheSlice";

const Dashboard = () => {
  const user = useSelector(USER);
  const isAuthenticated = useSelector(IS_AUTHENTICATED);

  const isDriver = useMemo(() => {
    if (!user) return false;
    return String(user.isDriver).toLowerCase() === "true" || user.isDriver === true;
  }, [user]);

  if (isAuthenticated && !user) {
    return (
      <div className="dashboard-loader-container">
        <div className="spinner"></div>
        <p>Syncing your profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dashboard-error-state">
        <h3>Access Denied</h3>
        <p>Please log in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view-wrapper">
      {isDriver ? (
        <DriverDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  );
};

export default Dashboard;