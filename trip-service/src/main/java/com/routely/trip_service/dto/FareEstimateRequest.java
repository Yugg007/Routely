package com.routely.trip_service.dto;

public class FareEstimateRequest {
	private double pickupLat;
	private double pickupLng;
	private double dropLat;
	private double dropLng;
	private String rideTypeId; // e.g. "bike", "car", etc.
	private String rideType;

	private Double distanceKm;
	private Double durationMin;



	public Double getDurationMin() {
		return durationMin;
	}

	public void setDurationMin(Double durationMin) {
		this.durationMin = durationMin;
	}

	public String getRideType() {
		return rideType;
	}
	
	public void setRideType(String rideType) {
		this.rideType = rideType;
	}
	public double getPickupLat() {
		return pickupLat;
	}

	public void setPickupLat(double pickupLat) {
		this.pickupLat = pickupLat;
	}

	public double getPickupLng() {
		return pickupLng;
	}

	public void setPickupLng(double pickupLng) {
		this.pickupLng = pickupLng;
	}

	public double getDropLat() {
		return dropLat;
	}

	public void setDropLat(double dropLat) {
		this.dropLat = dropLat;
	}

	public double getDropLng() {
		return dropLng;
	}

	public void setDropLng(double dropLng) {
		this.dropLng = dropLng;
	}

	public String getRideTypeId() {
		return rideTypeId;
	}

	public void setRideTypeId(String rideTypeId) {
		this.rideTypeId = rideTypeId;
	}

	public Double getDistanceKm() {
		return distanceKm;
	}

	public void setDistanceKm(Double distanceKm) {
		this.distanceKm = distanceKm;
	}
}
