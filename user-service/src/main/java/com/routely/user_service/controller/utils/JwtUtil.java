package com.routely.user_service.controller.utils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.routely.user_service.dto.AuthResponse;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

	private final String SECRET = "your_256bit_super_secret_key_for_jwt_token_here"; // must be 32+ chars
	private final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours

	private SecretKey getSecretKey() {
		return Keys.hmacShaKeyFor(SECRET.getBytes());
	}

	// Extract username (subject) from token
	public String extractUsername(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	// Extract expiration date
	public Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	// Generic claim extractor
	public <T> T extractClaim(String token, Function<Claims, T> resolver) {
		final Claims claims = extractAllClaims(token);
		return resolver.apply(claims);
	}

	// Extract all claims
	private Claims extractAllClaims(String token) {
		return Jwts.parserBuilder().setSigningKey(getSecretKey()).build().parseClaimsJws(token).getBody();
	}

	// Check token expiration
	private boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	// Generate token with optional extra claims
	public String generateToken(String username, Map<String, Object> extraClaims) {
		JwtBuilder builder = Jwts.builder().setClaims(extraClaims).setSubject(username).setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
				.signWith(getSecretKey(), SignatureAlgorithm.HS256);

		return builder.compact();
	}


	// Validate token
	public boolean validateToken(String token, String username) {
		final String tokenUsername = extractUsername(token);
		return (tokenUsername.equals(username) && !isTokenExpired(token));
	}

	// Add a claim to existing token (returns new token)
	public String addClaim(String token, String key, Object value) {
		Claims claims = extractAllClaims(token);
		claims.put(key, value);

		return Jwts.builder().setClaims(claims).setSubject(claims.getSubject()).setIssuedAt(new Date())
				.setExpiration(claims.getExpiration()).signWith(getSecretKey(), SignatureAlgorithm.HS256).compact();
	}

	// Check if a claim exists
	public boolean hasClaim(String token, String key) {
		Claims claims = extractAllClaims(token);
		return claims.containsKey(key);
	}

	// Optional: get claim value
	public Object getClaimValue(String token, String key) {
		Claims claims = extractAllClaims(token);
		return claims.get(key);
	}

	public String generateToken(AuthResponse authResponse) {
		Map<String, String> claims = new HashMap<>();
		claims.put("name", authResponse.getName());
		claims.put("email", authResponse.getEmail());
		claims.put("mobileNo", authResponse.getMobileNo());
		claims.put("isDriver", authResponse.getIsDriver());
		
		JwtBuilder builder = Jwts.builder()
				.setClaims(claims)
				.setSubject(authResponse.getId().toString())
				.setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
				.signWith(getSecretKey(), SignatureAlgorithm.HS256);

		return builder.compact();
	}

	public AuthResponse extractClaims(String token) {
		AuthResponse authResponse = new AuthResponse();
		Claims claims = extractAllClaims(token);
		authResponse.setName((String) claims.get("name"));
		authResponse.setEmail((String) claims.get("email"));
		authResponse.setMobileNo((String) claims.get("mobileNo"));
		authResponse.setIsDriver((String) claims.get("isDriver"));
		authResponse.setId(Long.parseLong(claims.getSubject()));
		return authResponse;
	}
}