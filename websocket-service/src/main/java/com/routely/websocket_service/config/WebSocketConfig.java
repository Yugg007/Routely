package com.routely.websocket_service.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.routely.websocket_service.handler.DriverSocketHandler;
import com.routely.websocket_service.handler.LocationSocketHandler;
import com.routely.websocket_service.handler.UserSocketHandler;
import com.routely.websocket_service.interceptor.AuthHandshakeInterceptor;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Autowired
    private DriverSocketHandler driverSocketHandler;

    @Autowired
    private LocationSocketHandler locationSocketHandler;

    @Autowired
    private UserSocketHandler userSocketHandler;

    @Autowired
    private AuthHandshakeInterceptor authHandshakeInterceptor;
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

		registry.addHandler(locationSocketHandler, "/ws/location").setAllowedOrigins("*");

		registry.addHandler(driverSocketHandler, "/ws/driver-socket").setAllowedOrigins("*").addInterceptors(authHandshakeInterceptor);

		registry.addHandler(userSocketHandler, "/ws/user-socket").setAllowedOrigins("*").addInterceptors(authHandshakeInterceptor);

	}
}