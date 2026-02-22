package com.routely.trip_service.dto;


public class AcceptRideResult {

    private boolean success;
    private String message;
    private Long rideId;
    private Long driverId;
    private Long acceptedBy;

    public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public Long getRideId() {
		return rideId;
	}

	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}

	public Long getDriverId() {
		return driverId;
	}

	public void setDriverId(Long driverId) {
		this.driverId = driverId;
	}

	public Long getAcceptedBy() {
		return acceptedBy;
	}

	public void setAcceptedBy(Long acceptedBy) {
		this.acceptedBy = acceptedBy;
	}

	public static AcceptRideResult success(Long rideId, Long driverId) {
        AcceptRideResult r = new AcceptRideResult();
        r.success = true;
        r.message = "Ride accepted successfully";
        r.rideId = rideId;
        r.driverId = driverId;
        r.acceptedBy = driverId;
        return r;
    }

    public static AcceptRideResult failed(Long rideId, Long driverId, Long acceptedBy) {
        AcceptRideResult r = new AcceptRideResult();
        r.success = false;
        r.message = "Ride already accepted by another driver";
        r.rideId = rideId;
        r.driverId = driverId;
        r.acceptedBy = acceptedBy;
        return r;
    }

    public static AcceptRideResult alreadyAcceptedBySameDriver(Long rideId, Long driverId) {
        AcceptRideResult r = new AcceptRideResult();
        r.success = true;
        r.message = "Ride already accepted by you";
        r.rideId = rideId;
        r.driverId = driverId;
        r.acceptedBy = driverId;
        return r;
    }
}
