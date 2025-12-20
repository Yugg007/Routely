package com.routely.trip_service.model;

import com.routely.trip_service.service.TripService.RideStatus;

import jakarta.persistence.*;

@Entity
@Table(name = "rides")
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increment
    @Column(name = "ride_id")
    private Long rideId;

    @Column(name = "start_address", nullable = false)
    private String startAddress;

    @Column(name = "start_lat", nullable = false)
    private String startLat;

    @Column(name = "start_lng", nullable = false)
    private String startLng;

    @Column(name = "end_address", nullable = false)
    private String endAddress;

    @Column(name = "end_lat", nullable = false)
    private String endLat;

    @Column(name = "end_lng", nullable = false)
    private String endLng;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_mob_no", length = 15)
    private String userMobNo;

    @Column(name = "ride_type")
    private String rideType;
    
    @Enumerated(EnumType.STRING)
    private RideStatus status;

    @Column(name = "name")
    private String name;
    
    private Long driverId;

    public Long getDriverId() {
		return driverId;
	}

	public void setDriverId(Long driverId) {
		this.driverId = driverId;
	}

	// ✅ Constructors
    public Ride() {}

    public Ride(Long rideId, String startAddress, String startLat, String startLng, String endAddress, String endLat,
			String endLng, Long userId, String userMobNo, String rideType, RideStatus status, String name) {
		super();
		this.rideId = rideId;
		this.startAddress = startAddress;
		this.startLat = startLat;
		this.startLng = startLng;
		this.endAddress = endAddress;
		this.endLat = endLat;
		this.endLng = endLng;
		this.userId = userId;
		this.userMobNo = userMobNo;
		this.rideType = rideType;
		this.status = status;
		this.name = name;
	}

	// ✅ Getters & Setters
    public Long getRideId() {
        return rideId;
    }

    public void setRideId(Long rideId) {
        this.rideId = rideId;
    }

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

	public RideStatus getStatus() {
		return status;
	}

	public void setStatus(RideStatus pending) {
		this.status = pending;
	}
}
