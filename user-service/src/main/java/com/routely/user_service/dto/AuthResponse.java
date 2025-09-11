package com.routely.user_service.dto;


public class AuthResponse {
    private String email;
    private String message;
    private boolean success;
    private String jwtToken;
    
    public AuthResponse(String message, boolean success, String email) {
		super();
		this.email = email;
		this.message = message;
		this.success = success;
	}
    
	public AuthResponse() {
		// TODO Auto-generated constructor stub
	}

	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
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
}