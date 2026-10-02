package com.routely.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security config for the API Gateway.
 *
 * Auth is enforced by AuthenticationFilter (GlobalFilter), not here.
 * Spring Security's only job in this gateway is:
 *   - disable CSRF (stateless — JWT in cookie)
 *   - disable form login / HTTP basic (not a user-facing app)
 *   - permit all exchanges (AuthFilter handles 401/403)
 *
 * CORS is configured solely in application.yml (spring.cloud.gateway.globalcors).
 * Do NOT add a CorsConfigurationSource bean — it conflicts with the YAML config
 * and causes double-CORS headers, breaking preflight requests.
 */
@Configuration
@EnableWebFluxSecurity
public class SpringSecurity {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
                .build();
    }
}