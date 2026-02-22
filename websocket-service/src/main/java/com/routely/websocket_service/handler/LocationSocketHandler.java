package com.routely.websocket_service.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.websocket_service.modal.Location;

@Component
public class LocationSocketHandler extends TextWebSocketHandler {
	private final ObjectMapper objectMapper = new ObjectMapper();
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;
	
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    String payload = message.getPayload();
	    System.out.println("Received: " + payload);

	    Location newLocation = objectMapper.readValue(payload, Location.class);
	    String id = newLocation.getId().toString();
	    System.out.println("Key : " + id);

	    Location existingLocation = (Location) redisTemplate.opsForValue().get(id);

	    boolean shouldUpdate = false;

	    if (existingLocation == null || (existingLocation != null && existingLocation.getAccuracy() == null)) {
	        shouldUpdate = true;
	    } else if (newLocation.getAccuracy() <= existingLocation.getAccuracy()) {
	        shouldUpdate = true;
	    }

	    if (shouldUpdate) {
	        redisTemplate.opsForValue().set(id, newLocation);
	        System.out.println("Updated Redis with more accurate location for driverId=" + id);
	    } else {
	        System.out.println("Skipped update, existing location is more accurate for driverId=" + id);
	    }

	    Location saved = (Location) redisTemplate.opsForValue().get(id);
	    if (saved != null) {
	        System.out.println("Final stored location -> driverId=" + id+ ", accuracy=" + saved.getAccuracy());
	    }

	    session.sendMessage(new TextMessage("ACK from server"));
	}

}
