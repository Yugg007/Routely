package com.routely.api_gateway.utils;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
	@Autowired
	private AesUtil aesUtil;

    private final String SECRET_KEY = "your_256bit_super_secret_key_for_jwt_token_here"; // should come from config

	private SecretKey getSecretKey() {
		return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
	}
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(getSecretKey()).parseClaimsJws(aesUtil.decrypt(token));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody();
    }
}
