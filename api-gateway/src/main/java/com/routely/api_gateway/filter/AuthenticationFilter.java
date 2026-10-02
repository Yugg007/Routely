package com.routely.api_gateway.filter;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.routely.shared.utils.AesUtil;
import com.routely.shared.utils.JwtUtil;

import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

	private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

	// List of routes to skip authentication
	private static final List<String> OPEN_PATHS = List.of(
			"/users/login", 
			"/users/register", 
			"/public/**",
			"/ws/location");

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		String path = exchange.getRequest().getURI().getPath();

		if (isOpen(path)) {
			return chain.filter(exchange);
		}

		String token = extractToken(exchange);
		if(token != null) {
			try {
				token = AesUtil.decrypt(token);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		// token == null → no credential supplied at all
		// !isValid → expired, tampered, or wrong signature
		if (token == null || !JwtUtil.isValid(token)) {
			logger.warn("Unauthorized request to {}", path);
			exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
			return exchange.getResponse().setComplete();
		}

		return chain.filter(exchange);
	}

	private boolean isOpen(String path) {
		return OPEN_PATHS.stream().anyMatch(pattern -> {
			if (pattern.endsWith("/**")) {
				String prefix = pattern.substring(0, pattern.length() - 3);
				return path.startsWith(prefix); // "/public/**" → startsWith("/public")
			}
			return path.equals(pattern); // exact match for "/users/login" etc.
		});
	}

	private String extractToken(ServerWebExchange exchange) {
		// 1. Cookie takes priority (browser clients)
		HttpCookie cookie = exchange.getRequest().getCookies().getFirst("RoutelyToken");
		if (cookie != null) {
			return cookie.getValue();
		}

		// 2. Authorization header (mobile / service-to-service)
		String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}

		return null;
	}

	@Override
	public int getOrder() {
		return -2; // Ensure runs before LoggingFilter
	}
}
