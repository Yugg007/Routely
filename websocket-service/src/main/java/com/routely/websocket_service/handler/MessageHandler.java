package com.routely.websocket_service.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.RideUtil;
import com.routely.websocket_service.dto.WsMessage;

@Component
public class MessageHandler {
	@Autowired
	private ObjectMapper objectMapper;
	public void sendMessage(WebSocketSession session, String type, Object payload) {
		try {
	        Object finalPayload = payload;
	        // Check if the payload is our Protobuf RideRequest
	        if (payload instanceof RideRequest) {
	            String protoJson = RideUtil.toJson((RideRequest) payload);
	            // Convert the Proto-JSON string into a Jackson JsonNode so it nests correctly
	            finalPayload = objectMapper.readTree(protoJson);
	        }

	        WsMessage message = new WsMessage(type, finalPayload);
	        String jsonMessage = objectMapper.writeValueAsString(message);
	        
	        session.sendMessage(new TextMessage(jsonMessage));
	        
	    } catch (Exception e) {
	        System.err.println("❌ Failed to send WebSocket message: " + e.getMessage());
	        e.printStackTrace();
	    }
	}

}
