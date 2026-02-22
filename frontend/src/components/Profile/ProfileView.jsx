import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ApiEndpoints from "../../utils/ApiConfig/ApiEndpoints";
import { BackendService } from "../../utils/ApiConfig/ApiMiddleWare"; 
import { clearAuthSession } from "../../store/authCacheSlice";
import "./Profile.css";

export default function ProfileView() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.authCache?.user);

  // Vehicles state: attempt to pull from user object -> fallback to localStorage -> empty array
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Form state
  const initialForm = { id: null, type: "auto", model: "", registrationNo: "", capacity: "3" };
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isDriver = user?.isDriver === true || user?.isDriver === "true";

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await BackendService(ApiEndpoints.fetchVehicles);
      if (response.data) {
        setVehicles(response.data);
      }
    } catch (err) {
      console.warn("Failed to load vehicles from backend.", err);
    } finally {
      setLoadingVehicles(false);
    }
  };


  const handleLogout = async () => {
    try {
      const response = await BackendService(ApiEndpoints.logout);
      if (response?.data) {
        dispatch(clearAuthSession());
      } else {
        console.warn("Auth status response is empty or malformed:", response);
      }
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
    }
  };

  // Form handlers
  const openAddForm = () => {
    setForm(initialForm);
    setIsEditing(false);
    setShowForm(true);
    setError(null);
  };

  const closeAddForm = () => {
    setForm(initialForm);
    setIsEditing(false);
    setShowForm(false);
    setError(null);
  };

  const openEditForm = (vehicle) => {
    setForm({
      id: vehicle.id ?? vehicle._id ?? vehicle.registrationNo ?? Date.now().toString(),
      type: vehicle.type || "auto",
      model: vehicle.model || "",
      registrationNo: vehicle.registrationNo || "",
      capacity: vehicle.capacity || "",
    });
    setIsEditing(true);
    setShowForm(true);
    setError(null);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setShowForm(false);
    setIsEditing(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "type") {
        if (value === "bike") updated.capacity = 1;
        else updated.capacity = 3;
      }
      return updated;
    });
  };


  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!form.type || !form.model.trim() || !form.registrationNo.trim()) {
      setError("Please fill required fields: type, model, registration number.");
      return;
    }

    setSaving(true);

    try {
      const response = await BackendService(ApiEndpoints.addVehicle, form);
      if (response.data) {
        setVehicles(response.data);
        closeAddForm();
      }
    }
    catch (err) {
      console.log(err);
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    const confirmed = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmed) return;
    try {
      const body = {
        id: vehicleId
      }
      const response = await BackendService(ApiEndpoints.deleteVehicle, body);
      if (response.data) {
        setVehicles(response.data);
        closeAddForm();
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!form.type || !form.model.trim() || !form.registrationNo.trim()) {
      setError("Please fill required fields: type, model, registration number.");
      return;
    }

    setSaving(true);

    try {
      const response = await BackendService(ApiEndpoints.updateVehicle, form);
      if (response.data) {
        setVehicles(response.data);
        closeAddForm();
      }
    }
    catch (err) {
      console.log(err);
    }
    finally {
      setSaving(false);
    }
  }

  const handleSaveAndUpdateVehicle = (e) => {
    if (isEditing) handleUpdateVehicle(e);
    else handleSaveVehicle(e);
  }

  return (
    <div className="profile-modern-container">
      {/* Header */}
      <header className="profile-modern-header">
        <div className="profile-modern-info">
          <h1>{user?.name || "User"}</h1>
          <p className="muted">{user?.email || "—"}</p>
          <p className="profile-muted">📱 {user?.mobileNo || "—"}</p>
        </div>
      </header>

      {/* Actions */}
      <section className="profile-modern-actions">
        <p className="profile-muted">
          Manage your Routely account, bookings, and preferences.
        </p>
        <div className="profile-modern-btn-group">
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {/* Vehicle Section - only for Drivers */}
      {isDriver && (
        <section className="profile-modern-vehicle">
          <div className="vehicle-header">
            <div>
              <h2>🚗 Vehicle Management</h2>
              <p className="profile-muted">
                Add and manage your vehicle details for driving with Routely.
              </p>
            </div>
            <div>
              <button className="btn btn-secondary" onClick={openAddForm}>
                + Add Vehicle
              </button>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="vehicle-list">
            {loadingVehicles ? (
              <p className="profile-muted small">Loading vehicles…</p>
            ) : vehicles.length === 0 ? (
              <p className="profile-muted small">No vehicles found. Add one to get started.</p>
            ) : (
              vehicles.map((v) => {
                const key = v.id ?? v._id ?? v.registrationNo;
                return (
                  <div key={key} className="vehicle-card">
                    <div className="vehicle-main">
                      <div className="vehicle-type">{(v.type || "auto").toUpperCase()}</div>
                      <div className="vehicle-details">
                        <div className="vehicle-model">{v.model || "Unknown model"}</div>
                        <div className="vehicle-meta">
                          <span>Reg: {v.registrationNo || "—"}</span>
                          <span>Capacity: {v.capacity || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="vehicle-actions">
                      <button className="btn btn-ghost" onClick={() => openEditForm(v)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(key)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <form className="vehicle-form" onSubmit={handleSaveAndUpdateVehicle}>
              <h3>{isEditing ? "Edit Vehicle" : "Add Vehicle"}</h3>

              <label className="field">
                <div className="field-label">Vehicle Type</div>
                <select name="type" value={form.type} onChange={handleChange} required>
                  <option value="auto">Auto</option>
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </label>

              <label className="field">
                <div className="field-label">Model</div>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g., TVS King / Honda Activa / Maruti Alto"
                  required
                />
              </label>

              <label className="field">
                <div className="field-label">Registration No.</div>
                <input
                  name="registrationNo"
                  value={form.registrationNo}
                  onChange={handleChange}
                  placeholder="e.g., MH12AB1234"
                  required
                />
              </label>

              <label className="field">
                <div className="field-label">Capacity (seats)</div>
                <input
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  // placeholder="e.g., 3"
                  disabled
                  type="number"
                  min="1"
                />
              </label>

              {error && <div className="form-error">{error}</div>}

              <div className="vehicle-form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? (isEditing ? "Updating…" : "Saving…") : isEditing ? "Update Vehicle" : "Add Vehicle"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
