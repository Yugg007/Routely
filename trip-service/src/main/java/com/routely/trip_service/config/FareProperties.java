package com.routely.trip_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "fare")
public class FareProperties {
	private double base;
	private double perKm;
	private double perMinute;
	private double booking;
	private double minBookingCharge;
	private double maxBookingCharge;

	public double getMinBookingCharge() {
		return minBookingCharge;
	}

	public void setMinBookingCharge(double minBookingCharge) {
		this.minBookingCharge = minBookingCharge;
	}

	public double getMaxBookingCharge() {
		return maxBookingCharge;
	}

	public void setMaxBookingCharge(double maxBookingCharge) {
		this.maxBookingCharge = maxBookingCharge;
	}

	public double getBase() {
		return base;
	}

	public void setBase(double base) {
		this.base = base;
	}

	public double getPerKm() {
		return perKm;
	}

	public void setPerKm(double perKm) {
		this.perKm = perKm;
	}

	public double getPerMinute() {
		return perMinute;
	}

	public void setPerMinute(double perMinute) {
		this.perMinute = perMinute;
	}

	public double getBooking() {
		return booking;
	}

	public void setBooking(double booking) {
		this.booking = booking;
	}
}