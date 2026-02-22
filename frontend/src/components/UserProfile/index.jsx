import React, { useEffect, useState } from 'react';
import './UserProfile.css';
import { useParams } from 'react-router-dom';
import { BackendService } from '../../Utils/Api\'s/ApiMiddleWare';
import ApiEndpoints from '../../Utils/Api\'s/ApiEndpoints';

const UserProfile = () => {
  const { uname } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {

    try {
      const body = {
        username: uname
      }
      const response = await BackendService(ApiEndpoints.fetchUserByUsername, body);

      if (response?.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uname]);

  if (loading) {
    return <p className="no-data">Loading user data...</p>;
  }

  const imageUrl = "https://picsum.photos/300/200";

  return (
    <>
      {!user ? (
        <p className="no-data">No user data available.</p>
      ) : (
        <div className="profile-container">
          <h2 className="profile-title">User Profile</h2>
          <img
            className="centered-image"
            src={imageUrl}
            alt="Random from Unsplash"
          />

          <div className="profile-grid">
            <div className="profile-field">
              <label>User ID:</label>
              <p>{user?.id}</p>
            </div>

            <div className="profile-field">
              <label>Username:</label>
              <p>{user?.username}</p>
            </div>

            <div className="profile-field">
              <label>Email:</label>
              <p>{user?.email}</p>
            </div>

            {user?.firstName && (
              <div className="profile-field">
                <label>First Name:</label>
                <p>{user?.firstName}</p>
              </div>
            )}

            {user?.education && (
              <div className="profile-field">
                <label>Education:</label>
                <p>{user?.education}</p>
              </div>
            )}

            {user?.skills && (
              <div className="profile-field">
                <label>Skills:</label>
                <p>{user?.skills}</p>
              </div>
            )}
          </div>

          {user?.description && (
            <div className="profile-description">
              <label>Description:</label>
              <p>{user?.description}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserProfile;
