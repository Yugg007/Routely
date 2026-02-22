package com.routely.trip_service.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.routely.shared.enums.RideStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rides")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
	@Column(name = "status", length = 30)
	private RideStatus status;

	@Column(name = "name")
	private String name;

	@Column(name = "driver_id")
	private Long driverId;

	@CreatedBy
	@Column(name = "created_by", updatable = false, length = 30)
	private String createdBy; // Changed to String

	@CreatedDate
	@Column(name = "created_on", updatable = false)
	private LocalDateTime createdOn;

	@LastModifiedBy
	@Column(name = "updated_by", length = 30)
	private String updatedBy; // Changed to String

	@LastModifiedDate
	@Column(name = "updated_on")
	private LocalDateTime updatedOn;

	@Column(name = "otp_pin", length = 6)
	private String otpPin;

	@Column(name = "is_pin_verified")
	private boolean isPinVerified = false;

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

	public RideStatus getStatus() {
		return status;
	}

	public void setStatus(RideStatus status) {
		this.status = status;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Long getDriverId() {
		return driverId;
	}

	public void setDriverId(Long driverId) {
		this.driverId = driverId;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public LocalDateTime getCreatedOn() {
		return createdOn;
	}

	public void setCreatedOn(LocalDateTime createdOn) {
		this.createdOn = createdOn;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}

	public LocalDateTime getUpdatedOn() {
		return updatedOn;
	}

	public void setUpdatedOn(LocalDateTime updatedOn) {
		this.updatedOn = updatedOn;
	}

	public String getOtpPin() {
		return otpPin;
	}

	public void setOtpPin(String otpPin) {
		this.otpPin = otpPin;
	}

	public boolean isPinVerified() {
		return isPinVerified;
	}

	public void setPinVerified(boolean isPinVerified) {
		this.isPinVerified = isPinVerified;
	}

	public Ride() {
		super();
		// TODO Auto-generated constructor stub
	}

	public Ride(Long rideId, String startAddress, String startLat, String startLng, String endAddress, String endLat,
			String endLng, Long userId, String userMobNo, String rideType, RideStatus status, String name,
			Long driverId, String createdBy, LocalDateTime createdOn, String updatedBy, LocalDateTime updatedOn,
			String otpPin, boolean isPinVerified) {
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
		this.driverId = driverId;
		this.createdBy = createdBy;
		this.createdOn = createdOn;
		this.updatedBy = updatedBy;
		this.updatedOn = updatedOn;
		this.otpPin = otpPin;
		this.isPinVerified = isPinVerified;
	}

}
