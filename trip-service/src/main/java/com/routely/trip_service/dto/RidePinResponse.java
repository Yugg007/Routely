package com.routely.trip_service.dto;

public class RidePinResponse {
	private Long rideId;
	private String pin; // The 4-digit OTP
	private String instructions; // e.g., "Share this with your driver to start the trip"

	public Long getRideId() {
		return rideId;
	}

	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}

	public String getPin() {
		return pin;
	}

	public void setPin(String pin) {
		this.pin = pin;
	}

	public String getInstructions() {
		return instructions;
	}

	public void setInstructions(String instructions) {
		this.instructions = instructions;
	}

	public RidePinResponse(Long rideId, String pin, String instructions) {
		super();
		this.rideId = rideId;
		this.pin = pin;
		this.instructions = instructions;
	}

	public RidePinResponse() {
		super();
		// TODO Auto-generated constructor stub
	}

}