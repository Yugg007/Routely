package com.routely.user_service.dto;

import com.routely.user_service.model.User;

public class AuthResponse {
	private String name;
    private String email;
    private String mobileNo;
    private String isDriver;
    private String message;
    private boolean authStatus = false;
    private String jwtToken;
    
	public AuthResponse(String message) {
		super();
		this.message = message;
	}
	
	public AuthResponse(AuthRequest authRequest, String message) {
		this.name = authRequest.getName();
		this.email = authRequest.getEmail();
		this.mobileNo = authRequest.getMobileNo();
		this.isDriver = authRequest.getIsDriver();
		this.message = message;
		this.authStatus = true;
	}
    
	public AuthResponse() {
		// TODO Auto-generated constructor stub
	}

	public AuthResponse(User user, String message) {
		this.name = user.getName();
		this.email = user.getEmail();
		this.mobileNo = user.getMobileNo();
		this.isDriver = user.getIsDriver();
		this.message = message;
		this.authStatus = true;
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

}