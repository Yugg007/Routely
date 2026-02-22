package com.routely.shared.dto;

import com.routely.shared.enums.ActorType;

public class RideCancelledEvent {
	private Long userId;
	private Long rideId;
	private Long driverId;
	private ActorType cancelledBy;

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
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

	public ActorType getCancelledBy() {
		return cancelledBy;
	}

	public void setCancelledBy(ActorType cancelledBy) {
		this.cancelledBy = cancelledBy;
	}

	public RideCancelledEvent() {
		super();
		// TODO Auto-generated constructor stub
	}

	public RideCancelledEvent(Long userId, Long rideId, Long driverId, ActorType cancelledBy) {
		super();
		this.userId = userId;
		this.rideId = rideId;
		this.driverId = driverId;
		this.cancelledBy = cancelledBy;
	}

	@Override
	public String toString() {
		return "RideCancelledEvent [userId=" + userId + ", rideId=" + rideId + ", driverId=" + driverId
				+ ", cancelledBy=" + cancelledBy + "]";
	}
	
	

}
