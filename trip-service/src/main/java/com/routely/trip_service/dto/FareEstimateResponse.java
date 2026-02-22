package com.routely.trip_service.dto;

//FareEstimateResponse.java
public class FareEstimateResponse {
	private String rideType; // Car, Bike, Auto
	private double distanceKm; // 12.4
	private Double durationMin; // 25
	private double baseFare; // 50
	private double perKmRate; // 10
	private double estimatedFare; // 174
	private String formattedFare; // ₹174
	private String currency; // INR
	private String message; // fallback or live estimate

	public String getRideType() {
		return rideType;
	}

	public void setRideType(String rideType) {
		this.rideType = rideType;
	}

	public double getDistanceKm() {
		return distanceKm;
	}

	public void setDistanceKm(double distanceKm) {
		this.distanceKm = distanceKm;
	}

	public Double getDurationMin() {
		return durationMin;
	}

	public void setDurationMin(Double durationMin) {
		this.durationMin = durationMin;
	}

	public double getBaseFare() {
		return baseFare;
	}

	public void setBaseFare(double baseFare) {
		this.baseFare = baseFare;
	}

	public double getPerKmRate() {
		return perKmRate;
	}

	public void setPerKmRate(double perKmRate) {
		this.perKmRate = perKmRate;
	}

	public double getEstimatedFare() {
		return estimatedFare;
	}

	public void setEstimatedFare(double estimatedFare) {
		this.estimatedFare = estimatedFare;
	}

	public String getFormattedFare() {
		return formattedFare;
	}

	public void setFormattedFare(String formattedFare) {
		this.formattedFare = formattedFare;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}
