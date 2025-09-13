package com.routely.ingestin_service.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.ingestin_service.modal.DriverLocation;

@Component
public class LocationSocketHandler extends TextWebSocketHandler {
	private final ObjectMapper objectMapper = new ObjectMapper();
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;
	
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    	String payload = message.getPayload();
        System.out.println("Received: " + payload);
        // TODO: Parse JSON {driverId, lat, lng} and store in Redis
        DriverLocation location = objectMapper.readValue(payload, DriverLocation.class);
        String key = "driver:" + location.getDriverId();
        System.out.println("Key : " + key);
        System.out.println(location.getDriverId());
        redisTemplate.opsForValue().set(key, location);
        location = (DriverLocation) redisTemplate.opsForValue().get(key);
        System.out.println(location.getDriverId());
        
        try {
			
        	System.out.println("Get the name from cloud - " + redisTemplate.opsForValue().get("name"));
		} catch (Exception e) {
			e.printStackTrace();
		}
        session.sendMessage(new TextMessage("ACK from server"));
    }
}
