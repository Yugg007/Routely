package com.routely.trip_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class VerifyPinRequest {
    
    @NotNull(message = "Ride ID is required")
    private Long rideId;

    @NotBlank(message = "PIN cannot be empty")
    @Size(min = 4, max = 6, message = "PIN must be 4-6 digits")
    private String pin;

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

	public VerifyPinRequest(@NotNull(message = "Ride ID is required") Long rideId,
			@NotBlank(message = "PIN cannot be empty") @Size(min = 4, max = 6, message = "PIN must be 4-6 digits") String pin) {
		super();
		this.rideId = rideId;
		this.pin = pin;
	}

	public VerifyPinRequest() {
		super();
		// TODO Auto-generated constructor stub
	}
}