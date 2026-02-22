package com.routely.websocket_service.handler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.dto.Actor;
import com.routely.shared.dto.RideCancelledEvent;
import com.routely.shared.enums.SessionState;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.shared.utils.SessionStateValidator;
import com.routely.websocket_service.config.JsonUtils;
import com.routely.websocket_service.dto.WsMessage;
import com.routely.websocket_service.modal.Location;
import com.routely.websocket_service.modal.UserLocation;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class UserSocketHandler extends TextWebSocketHandler {
	
	@Autowired
	private UserHandler userHandler;
	@Autowired
	private JsonUtils jsonUtils;
	
	private final Map<Long, WebSocketSession> onlineUsers = new ConcurrentHashMap<>();
	
	private final String AVAILABLE_DRIVER = Constants.AVAILABLE_DRIVER;
	private final String USER_LOCATION_PUSH = Constants.USER_LOCATION_PUSH;
	private final String ID = Constants.ID;
	
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
		System.out.println("Message from user - " + message.toString() + ", Time" + LocalDateTime.now());
		
		WsMessage wsMessage = jsonUtils.fromJson(message.getPayload(), WsMessage.class);
		if(wsMessage != null) {
			if(AVAILABLE_DRIVER.equals(wsMessage.getType())) {
				userHandler.availableDriver(wsMessage, session);
			}
			else if(USER_LOCATION_PUSH.equals(wsMessage.getType())) {
				userHandler.locationUpdate(wsMessage, session);
			}
		}
	}
	
	
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long id = getUserIdFromSession(session);
        System.out.println("ID to connect - " + id);
        if(id != null) {
        	onlineUsers.put(id, session);
        	System.out.println("User connected: " + id);        	
        }
    }
	
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long id = getUserIdFromSession(session);
        System.out.println("ID to connect - " + id);
        if(id != null && onlineUsers.containsKey(id)) {
        	onlineUsers.remove(id);        	
        	System.out.println("User disconnected: " + id);
        }
    }


    private Long getUserIdFromSession(WebSocketSession session) {
        try {
        	Object idAttr = session.getAttributes().get(ID); // Use a specific key
        	
        	if (idAttr instanceof Long) {
        		return (Long) idAttr;
        	}
            return Long.parseLong(idAttr.toString());
        } catch (NumberFormatException e) {
            e.printStackTrace();
        }
        return null;
    }


	public void sendAcceptedRideToUser(RideRequest rideRequest) {
		// TODO Auto-generated method stub
		Long userId = rideRequest.getUserId();
		if(onlineUsers.containsKey(userId)) {
			WebSocketSession session = onlineUsers.get(userId);
			userHandler.sendAcceptedRideToUser(rideRequest.getRideId(), session);
		}		
	}


	public void handleStateChange(Actor event) {
		// TODO Auto-generated method stub
		WebSocketSession session = onlineUsers.get(event.getActorId());
		userHandler.handleStateChange(session, event);		
	}


	public void handleRideCancellation(RideCancelledEvent event) {
		// TODO Auto-generated method stub
		System.out.println(event.toString());
		
	}

}
