package com.routely.trip_service.dto;

public class TripRequest {
	private String startAddress;
	private String startLat;
	private String startLng;
	
	private String endAddress;
	private String endLat;
	private String endLng;
	
	private Long userId;
	private String userMobNo;
	private String name;

	private Long rideId;
	private String rideType;
	
	
	private Long driverId;
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
	public Long getUserId() {
		return userId;
	}
	public void setUserId(Long userId) {
		this.userId = userId;
	}
	public String getUserMobNo() {
		return userMobNo;
	}
	public void setUserMobNo(String userMobNo) {
		this.userMobNo = userMobNo;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public Long getRideId() {
		return rideId;
	}
	public void setRideId(Long rideId) {
		this.rideId = rideId;
	}
	public String getRideType() {
		return rideType;
	}
	public void setRideType(String rideType) {
		this.rideType = rideType;
	}
	public Long getDriverId() {
		return driverId;
	}
	public void setDriverId(Long driverId) {
		this.driverId = driverId;
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
