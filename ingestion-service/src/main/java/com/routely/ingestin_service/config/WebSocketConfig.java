package com.routely.ingestin_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.routely.ingestin_service.handler.LocationSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    	
        registry.addHandler(locationSocketHandler(), "/ws/location")
                .setAllowedOrigins("*"); // adjust for security
    }
    
    @Bean
    public LocationSocketHandler locationSocketHandler() {
        return new LocationSocketHandler();
    }    
}
