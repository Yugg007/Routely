package com.routely.user_service.controller.utils;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.routely.shared.utils.JwtUtil;
import com.routely.user_service.dto.AuthResponse;

import io.jsonwebtoken.Claims;

@Component
public class JwtUtilHelper {

	public String generateToken(AuthResponse authResponse) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("name", authResponse.getName());
		claims.put("email", authResponse.getEmail());
		claims.put("mobileNo", authResponse.getMobileNo());
		claims.put("isDriver", authResponse.getIsDriver());
		
		return JwtUtil.issue(authResponse.getId().toString(), claims);
	}

	public AuthResponse extractClaims(String token) {
		AuthResponse authResponse = new AuthResponse();
		Claims claims = JwtUtil.getClaims(token);
		authResponse.setName((String) claims.get("name"));
		authResponse.setEmail((String) claims.get("email"));
		authResponse.setMobileNo((String) claims.get("mobileNo"));
		authResponse.setIsDriver((String) claims.get("isDriver"));
		authResponse.setId(Long.parseLong(claims.getSubject()));
		return authResponse;
	}
	
	public String extractUsername(String token) {
		Claims claims = JwtUtil.getClaims(token);
		return (String) claims.get("email");
	}
}