package com.routely.websocket_service.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import com.routely.shared.dto.Actor;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.shared.utils.SessionStateValidator;
import com.routely.websocket_service.config.JsonUtils;
import com.routely.websocket_service.dto.WsMessage;
import com.routely.websocket_service.modal.Location;
import com.routely.websocket_service.modal.UserLocation;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class UserHandler {
	
    @Autowired 
    private RedisHandler redisHandler;
    
	@Autowired
	private MessageHandler messageHandler;
	
	@Autowired
	private JsonUtils jsonUtils;
	
	private final String RIDE_ACCEPTED_BY_DRIVER = Constants.RIDE_ACCEPTED_BY_DRIVER;
	private final String AVAILABLE_DRIVER = Constants.AVAILABLE_DRIVER;
	private final String USER_LOCATION_PREFIX = Constants.USER_LOCATION_PREFIX;
	private final String DRIVER_LOCATION_PREFIX = Constants.DRIVER_LOCATION_PREFIX;
	private final String USER_LOCATION_SYNC = Constants.USER_LOCATION_SYNC;
	private final String STATE_CHANGE = Constants.STATE_CHANGE;

    public List<Location> findDriversInRadius(double userLat, double userLng, double radiusKm) {
        // 1. Get ONLY the IDs of nearby drivers from Redis spatial index
        List<Long> nearbyIds = redisHandler.findNearbyDriverIds(userLat, userLng, radiusKm);
        
        List<Location> drivers = new ArrayList<>();
        
        // 2. Fetch metadata for only the relevant drivers
        for (Long id : nearbyIds) {
            Location loc = (Location) redisHandler.getValue(DRIVER_LOCATION_PREFIX + id);
            if (loc != null) drivers.add(loc);
        }
        
        return drivers;
    }

    public void removeRideFromOffered(RideRequest rideRequest) {
        // 1. Remove from the global pending List
        redisHandler.removeRideFromQueue(rideRequest.getRideId());
        
        // 2. Remove the actual Data Hash to free up memory
        redisHandler.deleteRideData(rideRequest.getRideId());
    }

	public void sendAcceptedRideToUser(long rideId, WebSocketSession session) {
		// TODO Auto-generated method stub
		RideRequest rideRequest = redisHandler.getRideData(rideId);
		removeRideFromOffered(rideRequest);
		messageHandler.sendMessage(session, RIDE_ACCEPTED_BY_DRIVER, rideRequest);
		
	}

	public void availableDriver(WsMessage wsMessage, WebSocketSession session) {
		// TODO Auto-generated method stub
		Location location = jsonUtils.convertValue(wsMessage.getPayload(), Location.class);
		List<Location> availableDrivers = findDriversInRadius(location.getLat(), location.getLng(), 3.0);
		messageHandler.sendMessage(session, AVAILABLE_DRIVER, availableDrivers);	
	}

	public void locationUpdate(WsMessage wsMessage, WebSocketSession session) {
		// TODO Auto-generated method stub
		Location newLoc = jsonUtils.convertValue(wsMessage.getPayload(), Location.class);
		Long id = newLoc.getId();
		
		if (id != null) {
			// Update the Geospatial Index for fast searching
//			redisHandler.updateLocationGeo(id, newLoc.getLat(), newLoc.getLng());
			
			// Optional: Update metadata if needed
			redisHandler.setValue(USER_LOCATION_PREFIX + id, newLoc);
			
			messageHandler.sendMessage(session, USER_LOCATION_SYNC, "Location Synced");
			availableDriver(wsMessage, session);
		}
	}

	public void handleStateChange(WebSocketSession session, Actor event) {
		// TODO Auto-generated method stub
		if(session != null && SessionStateValidator.isValidStateForActor(event.getActorType(), event.getActorState())) {
			messageHandler.sendMessage(session, STATE_CHANGE, event.getActorState());
		}
		
	}
}