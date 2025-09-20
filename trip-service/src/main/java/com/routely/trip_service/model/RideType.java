package com.routely.trip_service.model;

//RideType.java
public class RideType {
	private String id;
	private String name;
	private double baseFare;
	private double perKmRate;
	private int etaMin;

	public RideType(String id, String name, double baseFare, double perKmRate, int etaMin) {
		this.id = id;
		this.name = name;
		this.baseFare = baseFare;
		this.perKmRate = perKmRate;
		this.etaMin = etaMin;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
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

	public int getEtaMin() {
		return etaMin;
	}

	public void setEtaMin(int etaMin) {
		this.etaMin = etaMin;
	}
}
