package com.routely.websocket_service.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.websocket_service.dto.RideRequest;
import com.routely.websocket_service.modal.DriverLocation;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class DriverSocketHandler extends TextWebSocketHandler {
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Map<String, WebSocketSession> onlineDrivers = new ConcurrentHashMap<>();
	
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    String payload = message.getPayload();
	    System.out.println("Received: " + payload);

	    DriverLocation newLocation = objectMapper.readValue(payload, DriverLocation.class);
	    String key = "driverLocation:" + newLocation.getDriverId();
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

	    session.sendMessage(new TextMessage("ACK from server -> Driver location updated."));
	}
	
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String driverId = getDriverIdFromSession(session);
        if(StringUtils.isNotBlank(driverId)) {
        	onlineDrivers.put(driverId, session);
        	System.out.println("Driver connected: " + driverId);        	
        }
    }
	
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String driverId = getDriverIdFromSession(session);
        if(StringUtils.isNotBlank(driverId) && onlineDrivers.containsKey(driverId)) {
        	onlineDrivers.remove(driverId);        	
        	System.out.println("Driver disconnected: " + driverId);
        }
    }


    private String getDriverIdFromSession(WebSocketSession session) {
		// TODO Auto-generated method stub
		return (String) session.getAttributes().get("ID");
	}

	private Map<String, WebSocketSession> getOnlineDrivers() {
        return onlineDrivers;
    }
	
	public void sendRideRequest(RideRequest rideRequest) {
		String userLat = rideRequest.getStartLat();
		String userLng = rideRequest.getStartLng();
		
		for(Map.Entry<String, WebSocketSession> driver : onlineDrivers.entrySet()) {
			try {				
				String key = "driverLocation:" + driver.getKey();
				WebSocketSession session = driver.getValue();
				DriverLocation existingLocation = (DriverLocation) redisTemplate.opsForValue().get(key);
				if(existingLocation != null) {
					double driverLat = existingLocation.getLat();
					double driverLng = existingLocation.getLng();
					double disMeters = GeoUtils.distanceInMeters(userLat, userLng, driverLat, driverLng);
					if(disMeters < 3000 || true) {
						String res = objectMapper.writeValueAsString(rideRequest);
						session.sendMessage(new TextMessage(res));
					}
				}
			} catch (Exception e) {
				// TODO: handle exception
				e.printStackTrace();
			}
			
		}
		
	}
}
