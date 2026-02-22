package com.routely.websocket_service.utils;

import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

	private final String SECRET = "your_256bit_super_secret_key_for_jwt_token_here"; // must be 32+ chars

	private SecretKey getSecretKey() {
		return Keys.hmacShaKeyFor(SECRET.getBytes());
	}

	public String extractId(String token) {
	    return Jwts.parserBuilder()
	               .setSigningKey(getSecretKey()) // same secret you used to sign JWT
	               .build()
	               .parseClaimsJws(token)
	               .getBody()
	               .getSubject();
	}
}