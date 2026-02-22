package com.routely.user_service.dto;

import java.util.Set;

import com.routely.shared.enums.SessionState;
import com.routely.user_service.model.User;
import com.routely.user_service.model.Vehicle;

public class AuthResponse {
	private Long id;
	private String name;
	private String email;
	private String mobileNo;
	private String isDriver;
	private String message;
	private boolean authStatus = false;
	private String jwtToken;
	private Set<Vehicle> vehicles;
	private SessionState actorState;

	public AuthResponse(String message) {
		super();
		this.message = message;
	}

	public AuthResponse() {
		this.actorState = SessionState.IDLE;
	}

	public AuthResponse(User user, String message, SessionState actorState) {
		this.id = user.getId();
		this.name = user.getName();
		this.email = user.getEmail();
		this.mobileNo = user.getMobileNo();
		this.isDriver = user.getIsDriver();
		this.message = message;
		this.authStatus = true;
		this.actorState = actorState;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getJwtToken() {
		return jwtToken;
	}

	public void setJwtToken(String jwtToken) {
		this.jwtToken = jwtToken;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getMobileNo() {
		return mobileNo;
	}

	public void setMobileNo(String mobileNo) {
		this.mobileNo = mobileNo;
	}

	public boolean isAuthStatus() {
		return authStatus;
	}

	public void setAuthStatus(boolean authStatus) {
		this.authStatus = authStatus;
	}

	public String getIsDriver() {
		return isDriver;
	}

	public void setIsDriver(String isDriver) {
		this.isDriver = isDriver;
	}

	public Set<Vehicle> getVehicles() {
		return vehicles;
	}

	public void setVehicles(Set<Vehicle> vehicles) {
		this.vehicles = vehicles;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public SessionState getActorState() {
		return actorState;
	}

	public void setActorState(SessionState actorState) {
		this.actorState = actorState;
	}

}