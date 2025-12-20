package com.routely.trip_service.dto;

public class AcceptRideRequest {
	private String startAddress;
	private String startLat;
	private String startLng;
	private String endAddress;
	private String endLat;
	private String endLng;
	private Long user_id;
	private String userMobNo;
	private Long ride_id;
	private String rideType;
	private String name;
	
	
	private Long driver_id;
	private String driverName;
	private String driverMobNo;
	
	
	public String getStartAddress() {
		return startAddress;
	}
	public void setStartAddress(String startAddress) {
		this.startAddress = startAddress;
	}
	public String getStartLat() {
		return startLat;
	}
	public void setStartLat(String startLat) {
		this.startLat = startLat;
	}
	public String getStartLng() {
		return startLng;
	}
	public void setStartLng(String startLng) {
		this.startLng = startLng;
	}
	public String getEndAddress() {
		return endAddress;
	}
	public void setEndAddress(String endAddress) {
		this.endAddress = endAddress;
	}
	public String getEndLat() {
		return endLat;
	}
	public void setEndLat(String endLat) {
		this.endLat = endLat;
	}
	public String getEndLng() {
		return endLng;
	}
	public void setEndLng(String endLng) {
		this.endLng = endLng;
	}
	public Long getUser_id() {
		return user_id;
	}
	public void setUser_id(Long user_id) {
		this.user_id = user_id;
	}
	public String getUserMobNo() {
		return userMobNo;
	}
	public void setUserMobNo(String userMobNo) {
		this.userMobNo = userMobNo;
	}
	public Long getRide_id() {
		return ride_id;
	}
	public void setRide_id(Long ride_id) {
		this.ride_id = ride_id;
	}
	public String getRideType() {
		return rideType;
	}
	public void setRideType(String rideType) {
		this.rideType = rideType;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public Long getDriver_id() {
		return driver_id;
	}
	public void setDriver_id(Long driver_id) {
		this.driver_id = driver_id;
	}
	public String getDriverName() {
		return driverName;
	}
	public void setDriverName(String driverName) {
		this.driverName = driverName;
	}
	public String getDriverMobNo() {
		return driverMobNo;
	}
	public void setDriverMobNo(String driverMobNo) {
		this.driverMobNo = driverMobNo;
	}
	
}
