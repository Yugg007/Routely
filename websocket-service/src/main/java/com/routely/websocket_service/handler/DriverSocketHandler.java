package com.routely.websocket_service.handler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.routely.shared.dto.Actor;
import com.routely.shared.dto.RideEvent;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.websocket_service.config.JsonUtils;
import com.routely.websocket_service.dto.WsMessage;

@Component
public class DriverSocketHandler extends TextWebSocketHandler {
	@Autowired
	private DriverHandler driverHandler;
	
	@Autowired
	private JsonUtils jsonUtils;

	private final String ID = Constants.ID;
	
	private final String DRIVER_LOCATION_PUSH = Constants.DRIVER_LOCATION_PUSH;
	private final String DRIVER_ARRIVED = Constants.DRIVER_ARRIVED;
	private final String DRIVER_DECLINED_OFFER = Constants.DRIVER_DECLINED_OFFER;
	
	private final Map<Long, WebSocketSession> onlineDrivers = new ConcurrentHashMap<>();

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    String payload = message.getPayload();
	    System.out.println("Received: " + payload);
	    
		WsMessage wsMessage = jsonUtils.fromJson(message.getPayload(), WsMessage.class);
		if(wsMessage != null) {
			if(DRIVER_LOCATION_PUSH.equals(wsMessage.getType())) {
				driverHandler.locationUpdate(session, wsMessage);
			}
			else if(DRIVER_ARRIVED.equals(wsMessage.getType())) {
				driverHandler.handleDriverArrived(session, wsMessage);
			}
			else if(DRIVER_DECLINED_OFFER.equals(wsMessage.getType())) {
				driverHandler.handleRideDecline(session, wsMessage);
			}

		}
	}
	
	

	
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long driverId = getDriverIdFromSession(session);
        if(driverId != null) {
        	onlineDrivers.put(driverId, session);
        	driverHandler.sendAcknowledgement(session, "Connection established");
        	System.out.println("Driver connected: " + driverId);        	
        }
    }
	
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long driverId = getDriverIdFromSession(session);
        if(driverId != null && onlineDrivers.containsKey(driverId)) {
        	onlineDrivers.remove(driverId);
        	driverHandler.removeDriverDetailFromCache(Long.valueOf(driverId));
        	System.out.println("Driver disconnected: " + driverId);
        }
    }


    private Long getDriverIdFromSession(WebSocketSession session) {
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
	
	public void sendRideRequest(RideRequest rideRequest) {		
		driverHandler.addRideRequestToCache(rideRequest);
		for(Map.Entry<Long, WebSocketSession> driver : onlineDrivers.entrySet()) {
			driverHandler.attemptRideOffer(driver.getKey(), driver.getValue(), rideRequest);
		}
		
	}

	public void handleStateChange(Actor event) {
		// TODO Auto-generated method stub
		WebSocketSession session = onlineDrivers.get(event.getActorId());
		driverHandler.handleStateChange(session, event);
	}

	public void handleRideCancellation(RideEvent event) {
		// TODO Auto-generated method stub
		System.out.println(event.toString());
		WebSocketSession session = onlineDrivers.get(event.getDriverId());
		driverHandler.handleRideCancellation(session, event);
		
	}

	public void handleRideAccepted(RideRequest rideRequest) {
		// TODO Auto-generated method stub
		WebSocketSession session = onlineDrivers.get(rideRequest.getDriverId());
		driverHandler.handleRideAccepted(rideRequest, session);
		
	}




	public void handleRideCompleted(RideRequest rideRequest) {
		// TODO Auto-generated method stub
		driverHandler.handleRideCompleted(rideRequest);
	}

}