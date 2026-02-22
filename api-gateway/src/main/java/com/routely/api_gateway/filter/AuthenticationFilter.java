package com.routely.api_gateway.filter;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.routely.api_gateway.utils.JwtUtil;

import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    // List of routes to skip authentication
    private static final List<String> openApiEndpoints = List.of(
            "/users/login",
            "/users/register",
            "/public/**",
            "/ws/location"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        System.out.println("Path to hit - "+ path);

        // Skip auth for open endpoints
        if (true || isOpenApiEndpoint(path)) {
            return chain.filter(exchange);
        }

        // Get token from Cookie or Authorization header
        String token = extractToken(exchange);

        if (token == null || !jwtUtil.validateToken(token)) {
            logger.warn("Unauthorized access to {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }

    private boolean isOpenApiEndpoint(String path) {
        return openApiEndpoints.stream().anyMatch(path::startsWith);
    }

    private String extractToken(ServerWebExchange exchange) {
        // 1. From Cookie
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("RoutelyToken");
        if (cookie != null) {
            return cookie.getValue();
        }

        // 2. From Authorization header
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
