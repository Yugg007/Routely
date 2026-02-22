import React, { useEffect, useState, useMemo, useCallback  } from 'react';
import { debounce } from 'lodash';


import { RIDE_TYPES, formatINR } from "../Functionality";
import ApiEndpoints from '../../../utils/ApiConfig/ApiEndpoints';
import { BackendService } from '../../../utils/ApiConfig/ApiMiddleWare';
import ConfirmModal from '../../Utility/ConfirmModal/ConfirmModal';
import STATE from '../../../constants/States';

import "./SideBar.css";
import ToastMessage from '../../Utility/ToastMessage/ToastMessage';
import { useDispatch, useSelector } from 'react-redux';
import { ACTOR_STATE, ID, updateUserWorkflowState, USER } from '../../../store/authCacheSlice';

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
    location,
    setLocation,
    handlePlaceSearch,
    selectSuggestion,
    handleBlur
}) => {

  const dispatch = useDispatch();
  const id = useSelector(ID);
  const actorState = useSelector(ACTOR_STATE);
  const user = useSelector(USER);

  
  const handleStateChange = useCallback((newState) => {
    dispatch(updateUserWorkflowState(newState));
  }, [dispatch, updateUserWorkflowState]);     

    const isMatching = actorState === "MATCHING";
    const isDriverFound = actorState === "WAITING_FOR_DRIVER";
    const isFrozen = isMatching || isDriverFound;
    // const [isFrozen, setIsFrozen] = useState(false);

    const [booking, setBooking] = useState({
        status: "",
        findingDriver: (actorState === "MATCHING") || false,
        matchedDriver: (actorState === "WAITING_FOR_DRIVER") || null
    });

    // Destructure for cleaner JSX usage
    // const { pickupQuery, dropQuery, pickupSuggestions, dropSuggestions } = search;
    const [pickupQuery, setPickupQuery] = useState(search.pickupQuery || "");
    const [dropQuery, setDropQuery] = useState(search.dropQuery || "");
    const pickupSuggestions = search.pickupSuggestions || [];
    const dropSuggestions = search.dropSuggestions || [];
    const { rideTypeId, distanceKm, estimatedFare, etaMin } = ride;
    const { pickup, drop } = location;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rideId, setRideId] = useState(null);

    const [toast, setToast] = useState({ show: false, message: 'i am message', type: 'info' });

    const chosenRide = RIDE_TYPES.find((r) => r.id === ride.rideTypeId) || RIDE_TYPES[2];

    // Helper to reset specifically the search/drop fields
    const handleReset = () => {
        setSearch(prev => ({
            ...prev,
            dropQuery: "",
            dropSuggestions: []
        }));
        // Note: You may need to pass a setLocation prop if you want to nullify drop/routePath here
    };

    // E. Request Ride API Call
    const requestRide = async () => {
        if (!location.pickup || !location.drop) {
            setBooking(prev => ({ ...prev, status: "Please set pickup and drop locations." }));
            return;
        }

        const body = {
            startAddress: location.pickup.label,
            startLat: String(location.pickup.lat),
            startLng: String(location.pickup.lng),
            endAddress: location.drop.label,
            endLat: String(location.drop.lat),
            endLng: String(location.drop.lng),
            rideType: ride.rideTypeId,
            userId: user?.id,
            userMobNo: user?.mobileNo,
            name: user?.name
        };

        try {
            const response = await BackendService(ApiEndpoints.requestRide, body);
            if (response.data) {
                setBooking({
                    status: "Searching for nearby drivers...",
                    findingDriver: true,
                    matchedDriver: null
                });
                handleStateChange("MATCHING");
                setRideId(response.data); // Store rideId for potential cancellation                

            }
        } catch (e) {
            setBooking(prev => ({ ...prev, status: "Failed to request ride. Try again." }));
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
                }
                const responseDrop = {
                    lat: parseFloat(rideData.endLat),
                    lng: parseFloat(rideData.endLng),
                    label: rideData.endAddress
                }
                setLocation(prev => ({
                    ...prev,
                    pickup: responsePickUp,
                    drop: responseDrop
                }));
                setPickupQuery(responsePickUp.label);
                setDropQuery(responseDrop.label);
                setRideId(rideData.rideId); // Store rideId for potential cancellation
            }
        } catch (e) {
            setBooking(prev => ({ ...prev, status: "Failed to fetch ride details." }));
        }

    }

    useEffect(() => {
        if (isFrozen && rideId == null) {
            fetchRideDetails();
        }

    }, [isFrozen, rideId]);

    const [pin, setPin] = useState(null);
    const [estimateTimeToDriverArrival, setEstimateTimeToDriverArrival] = useState("-");

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
        if (isDriverFound && pin == null && rideId != null) {
            fetchPin();
        }
    }, [isDriverFound, rideId]);

    const debouncedPlaceSearch = useMemo(
        () => debounce((query, type) => {
            if (type === "pickup") {
                setSearch(prev => ({ ...prev, pickupQuery: query }));
            } else {
                setSearch(prev => ({ ...prev, dropQuery: query }));
            }
            handlePlaceSearch(query, type);
        }, 500), // 500ms delay
        []
    );

    const cancelRide = async () => {
        const body = { rideId: parseInt(rideId), userId: user?.id };
        try {
            const response = await BackendService(ApiEndpoints.cancelRide, body);
            if (response.data) {
                setBooking({
                    status: "Ride request cancelled.",
                    findingDriver: false,
                    matchedDriver: null
                });
                setRideId(null);
                handleStateChange("IDLE"); // Reset state to allow new bookings
            }
            setToast({
                show: true,
                message: "Ride cancelled successfully.",
                type: "success"
            });
        } catch (e) {
            console.error("Failed to cancel ride:", e);
        }
    }

    useEffect(() => {
        return () => {
            debouncedPlaceSearch.cancel();
        };
    }, [debouncedPlaceSearch]);

    useEffect(() => {
        if (search.pickupQuery !== pickupQuery) {
            setPickupQuery(search.pickupQuery);
        }
        if (search.dropQuery !== dropQuery) {
            setDropQuery(search.dropQuery);
        }
    }, [search])

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
                {isDriverFound && (
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

                {/* SDE3: Action Logic implementation */}
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
                    {isDriverFound && (
                        <div className="rd-cta-row">
                            {/* Phase 3: WAITING FOR DRIVER */}
                            {isDriverFound && (
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