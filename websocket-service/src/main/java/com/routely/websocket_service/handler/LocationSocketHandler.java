package com.routely.websocket_service.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.websocket_service.modal.DriverLocation;

@Component
public class LocationSocketHandler extends TextWebSocketHandler {
	private final ObjectMapper objectMapper = new ObjectMapper();
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;
	
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    String payload = message.getPayload();
	    System.out.println("Received: " + payload);

	    DriverLocation newLocation = objectMapper.readValue(payload, DriverLocation.class);
	    String key = newLocation.getDriverId();
	    System.out.println("Key : " + key);

	    DriverLocation existingLocation = (DriverLocation) redisTemplate.opsForValue().get(key);

	    boolean shouldUpdate = false;

	    if (existingLocation == null || (existingLocation != null && existingLocation.getAccuracy() == null)) {
	        shouldUpdate = true;
	    } else if (newLocation.getAccuracy() <= existingLocation.getAccuracy()) {
	        shouldUpdate = true;
	    }

	    if (shouldUpdate) {
	        redisTemplate.opsForValue().set(key, newLocation);
	        System.out.println("Updated Redis with more accurate location for driverId=" + newLocation.getDriverId());
	    } else {
	        System.out.println("Skipped update, existing location is more accurate for driverId=" + newLocation.getDriverId());
	    }

	    DriverLocation saved = (DriverLocation) redisTemplate.opsForValue().get(key);
	    if (saved != null) {
	        System.out.println("Final stored location -> driverId=" + saved.getDriverId() + ", accuracy=" + saved.getAccuracy());
	    }

	    session.sendMessage(new TextMessage("ACK from server"));
	}

}
