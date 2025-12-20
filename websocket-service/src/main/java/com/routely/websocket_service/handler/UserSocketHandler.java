package com.routely.websocket_service.handler;

import java.io.IOException;
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
import com.routely.websocket_service.modal.UserLocation;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class UserSocketHandler extends TextWebSocketHandler {
	private final ObjectMapper objectMapper = new ObjectMapper();
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;
	
	private final Map<String, WebSocketSession> onlineUsers = new ConcurrentHashMap<>();
	
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
		System.out.println("Message from user - " + message.toString());
		UserLocation userLocation = objectMapper.readValue(message.getPayload(), UserLocation.class);
		
		List<DriverLocation> driversWithin3Km = findDriversInRadius(userLocation.getLat(), userLocation.getLng(), 3.0);
		
		 String responseJson = objectMapper.writeValueAsString(driversWithin3Km);
	    
		session.sendMessage(new TextMessage(responseJson));
	}
	
	public List<DriverLocation> findDriversInRadius(double userLat, double userLng, double radiusKm) {
	    List<DriverLocation> nearbyDrivers = new ArrayList<>();

	    // Get all keys for drivers
	    Set<String> keys = redisTemplate.keys("driverLocation:*");

	    if (keys != null) {
	        for (String key : keys) {
	            DriverLocation driverLoc = (DriverLocation) redisTemplate.opsForValue().get(key);
	            if (driverLoc == null) continue;

	            double driverLat = driverLoc.getLat();
	            double driverLng = driverLoc.getLng();

	            double distance = GeoUtils.distanceInMeters(userLat, userLng, driverLat, driverLng);
	            distance = 1;
	            if (distance <= radiusKm) {
	                // extract driverId from key: driver:<driverId>:location
	                nearbyDrivers.add((DriverLocation) redisTemplate.opsForValue().get(key));
	            }
	        }
	    }

	    return nearbyDrivers;
	}
	
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String id = getDriverIdFromSession(session);
        System.out.println("ID to connect - " + id);
        if(StringUtils.isNotBlank(id)) {
        	onlineUsers.put(id, session);
        	System.out.println("User connected: " + id);        	
        }
    }
	
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String id = getDriverIdFromSession(session);
        System.out.println("ID to connect - " + id);
        if(StringUtils.isNotBlank(id) && onlineUsers.containsKey(id)) {
        	onlineUsers.remove(id);        	
        	System.out.println("User disconnected: " + id);
        }
    }


    private String getDriverIdFromSession(WebSocketSession session) {
		// TODO Auto-generated method stub
		return (String) session.getAttributes().get("ID");
	}	


	public void sendAcceptedRideToUser(RideRequest tripRequest) {
		// TODO Auto-generated method stub
		String userId = tripRequest.getUser_id().toString();
		if(onlineUsers.containsKey(userId)) {
			WebSocketSession session = onlineUsers.get(userId);
			try {
				String res = objectMapper.writeValueAsString(tripRequest);
				session.sendMessage(new TextMessage(res));
			} catch (Exception e) {				
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}		
	}

}
