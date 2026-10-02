package com.routely.shared.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;


import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

/**
 * Static utility for JWT operations — issue, parse, read claims.
 * No domain knowledge. No framework dependency.
 *
 * Usage:
 *   String token  = JwtUtil.issue("42", Map.of("role", "DRIVER"), secret);
 *   Optional<Claims> claims = JwtUtil.parse(token, secret);
 */
public class JwtUtil {

	private static final String SECRET = "your_256bit_super_secret_key_for_jwt_token_here"; // must be 32+ chars
	private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours

    // ── Issue ─────────────────────────────────────────────────────────────────

    /**
     * Issues a signed JWT.
     *
     * @param subject     stable entity ID (e.g. user ID as string)
     * @param extraClaims any additional key-value pairs to embed
     * @param secret      HMAC secret — at least 32 UTF-8 bytes, never hardcoded
     * @param ttl         how long the token stays valid
     * @return compact JWS (header.payload.signature)
     */
    public static String issue(String subject, Map<String, Object> extraClaims) {
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(extraClaims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /** Convenience overload — no extra claims. */
    public static String issue(String subject) {
        return issue(subject, Map.of());
    }

    /**
     * Verifies signature + expiry and returns all claims.
     * Returns empty on ANY failure — expired, tampered, malformed, wrong key.
     */
    public static Optional<Claims> parse(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return Optional.of(claims);
        } catch (JwtException e) {
            return Optional.empty();
        }
    }

    /** Returns true iff signature is valid and token is not expired. */
    public static boolean isValid(String token) {
        return parse(token).isPresent();
    }


    /** Extracts the subject from already-parsed claims. */
    public static String getSubject(Claims claims) {
        return claims.getSubject();
    }
    
    public static String getSubject(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return getSubject(claims);
        } catch (JwtException e) {
            return null;
        }
    }

    /**
     * Extracts a typed claim value.
     * Returns empty if the key is absent or the value can't be cast to {@code type}.
     */
    public static <T> Optional<T> getClaim(Claims claims, String key, Class<T> type) {
        try {
            return Optional.ofNullable(claims.get(key, type));
        } catch (ClassCastException e) {
            return Optional.empty();
        }
    }
    public static Claims getClaims(String token) {
        try {
            return  Jwts.parserBuilder()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ClassCastException e) {
            return null;
        }
    }

    private static SecretKey signingKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }
}