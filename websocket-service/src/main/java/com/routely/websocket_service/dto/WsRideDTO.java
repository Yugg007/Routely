package com.routely.websocket_service.dto;

public class WsRideDTO {
	private Long rideId;
	private Long driverId;
	private Long userId;

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

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public WsRideDTO(Long rideId, Long driverId, Long userId) {
		super();
		this.rideId = rideId;
		this.driverId = driverId;
		this.userId = userId;
	}

	public WsRideDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
}
