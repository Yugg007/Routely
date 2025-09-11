import React, { useState, useEffect } from "react";
import { BackendService } from "../../Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "../../Utils/Api's/ApiEndpoints";
import './profile-style.css'; // CSS unchanged

const ProfileSection = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    skills: user?.skills || "",
    education: user?.education || "",
    description: user?.description || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const response = await BackendService(ApiEndpoints.updatePersonInfo, {
        ...formData,
        username: user.username, // Send username for identification
      });
      if (response?.data) {
        setUser(response.data);
        alert("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        skills: user.skills || "",
        education: user.education || "",
        description: user.description || "",
      });
    }
  }, [user]);

  if (!user) {
    return <div className="profile-card">Loading profile...</div>;
  }

  return (
    <div className="profile-card">
      <h2 className="profile-name">{user?.firstName || user?.username}</h2>
      <p className="profile-email">{user?.email}</p>

      <div className="profile-info">
        {["firstName", "skills", "education", "description"].map((field) => (
          <div key={field} className="profile-field">
            <label className="profile-label">
              {field.charAt(0).toUpperCase() + field.slice(1)}:
              {isEditing ? (
                <input
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder={`Enter your ${field}`}
                />
              ) : (
                <span className="profile-text">{formData[field] || "N/A"}</span>
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button className="btn btn-save" onClick={handleUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button className="btn btn-cancel" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
