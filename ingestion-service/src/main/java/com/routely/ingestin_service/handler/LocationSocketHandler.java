package com.routely.ingestin_service.handler;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class LocationSocketHandler extends TextWebSocketHandler {
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        System.out.println("Received: " + message.getPayload());
        // TODO: Parse JSON {driverId, lat, lng} and store in Redis
        session.sendMessage(new TextMessage("ACK from server"));
    }
}
