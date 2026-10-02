import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

import { RIDE_TYPES, formatINR } from "../../Functionality";
import ApiEndpoints from '../../../../utils/ApiConfig/ApiEndpoints';
import { BackendService } from '../../../../utils/ApiConfig/ApiMiddleWare';
import ConfirmModal from '../../../Utility/ConfirmModal/ConfirmModal';
import STATE from '../../../../constants/States';

import "./SideBar.css";
import ToastMessage from '../../../Utility/ToastMessage/ToastMessage';
import { useDispatch, useSelector } from 'react-redux';
import { ACTOR_STATE, updateUserWorkflowState, USER } from '../../../../store/authCacheSlice';

const CANCEL_MODAL_CONTENT = {
    MATCHING: {
        title: "Stop Searching?",
        message: "Are you sure you want to stop looking for a driver? You might lose your spot in the queue.",
        confirmText: "Stop Searching",
        cancelText: "Keep Searching"
    },
    WAITING_FOR_DRIVER: {
        title: "Cancel This Ride?",
        message: "A driver is already on their way to you. Canceling now may result in a cancellation fee.",
        confirmText: "Cancel Ride",
        cancelText: "Don't Cancel"
    },
    DEFAULT: {
        title: "Cancel Request?",
        message: "Are you sure you want to cancel this request?",
        confirmText: "Yes, Cancel",
        cancelText: "Go Back"
    }
};

const USER_STATES = STATE.USER_STATES;

const SideBar = React.memo(({
    search,
    setSearch,
    ride,
    setRide,
    locationRef,
    handlePlaceSearch,
    selectSuggestion,
    handleBlur
}) => {

  const dispatch = useDispatch();
  const actorState = useSelector(ACTOR_STATE);
  const user = useSelector(USER);

  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]);     

    const isMatching = actorState === "MATCHING";
    const isWaitingForDriver = actorState === "WAITING_FOR_DRIVER";
    const isOnTrip = actorState === USER_STATES.ON_TRIP;
    const isFrozen = isMatching || isWaitingForDriver || isOnTrip;

    const [pickupQuery, setPickupQuery] = useState(search.pickupQuery || "");
    const [dropQuery, setDropQuery] = useState(search.dropQuery || "");
    const pickupSuggestions = search.pickupSuggestions || [];
    const dropSuggestions = search.dropSuggestions || [];
    const { rideTypeId, distanceKm, estimatedFare, etaMin } = ride;
    const { pickup, drop } = locationRef.current || {};
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rideId, setRideId] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // Helper to reset search and clear location ref drop/routePath
    const handleReset = () => {
        setSearch(prev => ({
            ...prev,
            dropQuery: "",
            dropSuggestions: []
        }));
        setDropQuery("");
        if (locationRef.current) {
            locationRef.current.drop = null;
            locationRef.current.routePath = null;
        }
    };

    // Request Ride API Call reading directly from locationRef.current
    const requestRide = async () => {
        const currentLocation = locationRef.current || {};
        const pickup = currentLocation.pickup;
        const drop = currentLocation.drop;

        if (!pickup || !drop) {
            setToast({
                show: true,
                message: "Please set pickup and drop locations.",
                type: "warning"
            });
            return;
        }

        const body = {
            startAddress: pickup.label,
            startLat: String(pickup.lat),
            startLng: String(pickup.lng),
            endAddress: drop.label,
            endLat: String(drop.lat),
            endLng: String(drop.lng),
            rideType: ride.rideTypeId,
            userId: user?.id,
            userMobNo: user?.mobileNo,
            name: user?.name,
            fare: estimatedFare
        };

        try {
            const response = await BackendService(ApiEndpoints.requestRide, body);
            if (response.data) {
                handleStateChange("MATCHING");
                setRideId(response.data);
            }
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.message || "Failed to request ride. Try again.",
                type: "error",
            });
        }
    };

    const fetchRideDetails = async () => {
        try {
            const response = await BackendService(ApiEndpoints.userRideDetails, { userId: user?.id });
            if (response.data) {
                const rideData = response.data;
                const responsePickUp = {
                    lat: parseFloat(rideData.startLat),
                    lng: parseFloat(rideData.startLng),
                    label: rideData.startAddress
                };
                const responseDrop = {
                    lat: parseFloat(rideData.endLat),
                    lng: parseFloat(rideData.endLng),
                    label: rideData.endAddress
                };

                // Safely update specific properties on locationRef.current
                if (locationRef.current) {
                    locationRef.current.pickup = responsePickUp;
                    locationRef.current.drop = responseDrop;
                }

                setPickupQuery(responsePickUp.label);
                setDropQuery(responseDrop.label);
                setRide(prev => ({
                    ...prev,
                    driverId: rideData.driverId,
                    status: rideData.status,
                    userId: rideData.userId
                }));
                setRideId(rideData.rideId);
            }
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.message || "Failed to restore ride details.",
                type: "error",
            });
        }
    };

    useEffect(() => {
        if (isFrozen && rideId == null) {
            fetchRideDetails();
        }
    }, [isFrozen, rideId]);

    const [pin, setPin] = useState(null);

    const fetchPin = async () => {
        try {
            const response = await BackendService(ApiEndpoints.getPinDetails, { rideId });
            if (response.data) {
                setPin(response.data.pin);
            }   
        } catch (e) {
            console.error("Failed to fetch PIN:", e);
        }
    };

    useEffect(() => {
        if (isWaitingForDriver && pin == null && rideId != null) {
            fetchPin();
        }
    }, [isWaitingForDriver, rideId]);

    const debouncedPlaceSearch = useMemo(
        () => debounce((query, type) => {
            if (type === "pickup") {
                setSearch(prev => ({ ...prev, pickupQuery: query }));
            } else {
                setSearch(prev => ({ ...prev, dropQuery: query }));
            }
            handlePlaceSearch(query, type);
        }, 500),
        []
    );

    const cancelRide = async () => {
        const body = { rideId: parseInt(rideId), userId: user?.id };
        try {
            const response = await BackendService(ApiEndpoints.cancelRide, body);
            if (response.data) {
                setRideId(null);
                handleStateChange("IDLE");
            }
            setToast({
                show: true,
                message: "Ride cancelled successfully.",
                type: "success"
            });
        } catch (e) {
            console.error("Failed to cancel ride:", e);
        }
    };

    useEffect(() => {
        return () => {
            debouncedPlaceSearch.cancel();
        };
    }, [debouncedPlaceSearch]);

    useEffect(() => {
        if (search.pickupQuery !== pickupQuery) {
            setPickupQuery(search.pickupQuery || "");
        }
        if (search.dropQuery !== dropQuery) {
            setDropQuery(search.dropQuery || "");
        }
    }, [search]);

    return (
        <>
            <aside className="rd-card rd-booking" aria-labelledby="booking-title">
                <h2 id="booking-title" className="rd-card-title">Where to?</h2>
                {/* Parent Container with conditional class for global styling */}
                <div className={`ride-booking-container ${isFrozen ? "frozen-mode" : ""}`}>

                    {/* Pickup Section */}
                    <div className="rd-group">
                        <label className="rd-label">Pickup</label>
                        <div className="rd-field">
                            <input
                                type="text"
                                placeholder="Enter pickup"
                                value={pickupQuery}
                                disabled={isFrozen} // FREEZE APPLIED
                                onChange={(e) => {
                                    setPickupQuery(e.target.value);
                                    debouncedPlaceSearch(e.target.value, "pickup");
                                }}
                                onBlur={() => handleBlur("pickup")}
                                style={{ cursor: isFrozen ? 'not-allowed' : 'text' }}
                            />
                        </div>
                        {/* Hide suggestions if frozen to prevent interaction */}
                        {!isFrozen && pickupSuggestions.length > 0 && (
                            <ul className="rd-suggestions" role="listbox">
                                {pickupSuggestions.map((s) => (
                                    <li key={s.id} role="option" onClick={() => selectSuggestion(s, "pickup")}>
                                        {s.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Drop-off Section */}
                    <div className="rd-group">
                        <label className="rd-label">Drop-off</label>
                        <div className="rd-field">
                            <input
                                type="text"
                                placeholder="Enter destination"
                                value={dropQuery}
                                disabled={isFrozen} // FREEZE APPLIED
                                onChange={(e) => {
                                    setDropQuery(e.target.value);
                                    debouncedPlaceSearch(e.target.value, "drop");
                                }}
                                onBlur={() => handleBlur("drop")}
                                style={{ cursor: isFrozen ? 'not-allowed' : 'text' }}
                            />
                        </div>
                        {!isFrozen && dropSuggestions.length > 0 && (
                            <ul className="rd-suggestions" role="listbox">
                                {dropSuggestions.map((s) => (
                                    <li key={s.id} role="option" onClick={() => selectSuggestion(s, "drop")}>
                                        {s.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Ride selection Section */}
                    <div className="rd-section">
                        <div className="rd-section-title">Choose transport</div>
                        <div className="rd-mediums">
                            {RIDE_TYPES.map((rt) => {
                                const selected = rt.id === rideTypeId;
                                return (
                                    <button
                                        key={rt.id}
                                        disabled={isFrozen} // FREEZE APPLIED
                                        className={`rd-medium ${selected ? "selected" : ""} ${isFrozen ? "disabled-btn" : ""}`}
                                        onClick={() => setRide(prev => ({ ...prev, rideTypeId: rt.id }))}
                                        style={{ cursor: isFrozen ? 'not-allowed' : 'pointer' }}
                                    >
                                        <div className="rd-medium-emoji">{rt.emoji}</div>
                                        <div className="rd-medium-name">{rt.name}</div>
                                        <div className="rd-medium-sub">{rt.base} + {rt.per_km}/km*</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="rd-summary">
                    <div className="rd-summary-item">
                        <span className="rd-sum-label">Distance : </span>
                        <span className="rd-sum-value">{distanceKm ? `${distanceKm} km` : "—"}</span>
                    </div>
                    <div className="rd-summary-item">
                        <span className="rd-sum-label">Est. Fare : </span>
                        <span className="rd-sum-value">{estimatedFare ? formatINR(estimatedFare) : "—"}</span>
                    </div>
                    <div className="rd-summary-item">
                        <span className="rd-sum-label">ETA : </span>
                        <span className="rd-sum-value">{etaMin ? `${etaMin} min` : "—"}</span>
                    </div>
                </div>

                {/* Action Buttons */}

                {/* Dynamic Info Panel (PIN & ETA) */}
                {isWaitingForDriver && (
                    <div className="ride-info-card">
                        <div className="info-item">
                            <span className="info-label">RIDE PIN</span>
                            <span className="info-value">{pin}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">ETA</span>
                            <span className="info-value">2 MIN</span>
                        </div>
                    </div>
                )}

                {isOnTrip && (
                    <div className="ride-info-card">
                        <div className="info-item">
                            <span className="info-label">ON Trip</span>
                        </div>
                    </div>
                )}

                <div className="rd-cta-row">
                    {/* Phase 1: IDLE STATE */}
                    {!isFrozen && (
                        <>
                            <button className="btn btn-ghost" onClick={handleReset}>Reset</button>
                            <button
                                className="btn btn-primary btn-request"
                                disabled={!(pickup && drop)}
                                onClick={requestRide}
                            >
                                Request Ride
                            </button>
                        </>
                    )}

                    {/* Phase 2: MATCHING STATE */}
                    {isMatching && (
                        <>
                            <button className="btn btn-primary loading" disabled>Searching...</button>
                            <button className="btn btn-danger-outline" onClick={() => setShowCancelModal(true)}>
                                Cancel Ride
                            </button>
                        </>
                    )}

                    {/* Phase 3: WAITING FOR DRIVER (Found) */}
                    {isWaitingForDriver && (
                        <div className="rd-cta-row">
                            {/* Phase 3: WAITING FOR DRIVER */}
                            {isWaitingForDriver && (
                                <>
                                    <button className="btn-success-fixed" disabled>
                                        <span>✓</span> Driver Found!
                                    </button>
                                    <button className="btn-danger-outline" onClick={() => setShowCancelModal(true)}>
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </aside>
            <ConfirmModal
                isOpen={showCancelModal}
                title={CANCEL_MODAL_CONTENT[actorState]?.title || CANCEL_MODAL_CONTENT.DEFAULT.title}
                message={CANCEL_MODAL_CONTENT[actorState]?.message || CANCEL_MODAL_CONTENT.DEFAULT.message}
                confirmText={CANCEL_MODAL_CONTENT[actorState]?.confirmText || CANCEL_MODAL_CONTENT.DEFAULT.confirmText}
                cancelText={CANCEL_MODAL_CONTENT[actorState]?.cancelText || CANCEL_MODAL_CONTENT.DEFAULT.cancelText}
                onConfirm={() => {
                    cancelRide();
                    setShowCancelModal(false);
                }}
                onCancel={() => setShowCancelModal(false)}
                type="danger"
            />


            <ToastMessage
                isVisible={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </>

    );
});

export default SideBar;