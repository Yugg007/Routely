package com.routely.user_service.dto;

public class AuthRequest {
	private String email;
	private String password;
	private String mobileNo;
	private String name;
	private String isDriver;


	public String getIsDriver() {
		return isDriver;
	}

	public void setIsDriver(String isDriver) {
		this.isDriver = isDriver;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getMobileNo() {
		return mobileNo;
	}

	public void setMobileNo(String mobileNo) {
		this.mobileNo = mobileNo;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
