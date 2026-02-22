package com.routely.websocket_service.handler;

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
import com.routely.websocket_service.dto.WsRideDTO;
import com.routely.websocket_service.modal.Location;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class DriverHandler {
    @Autowired private MessageHandler messageHandler;
    @Autowired private RedisHandler redisHandler;
    @Autowired private JsonUtils jsonUtils;
    
    private final String DRIVER_LOCATION_SYNC = Constants.DRIVER_LOCATION_SYNC;
    private final String RIDE_OFFERED = Constants.RIDE_OFFERED;
    private final String DRIVER_LOCATION_PREFIX = Constants.DRIVER_LOCATION_PREFIX;
    private final String STATE_CHANGE = Constants.STATE_CHANGE;

    public void locationUpdate(WebSocketSession session, WsMessage wsMessage) {
        Location newLoc = jsonUtils.convertValue(wsMessage.getPayload(), Location.class);
        Long id = newLoc.getId();

        if (id != null) {
            // Update the Geospatial Index for fast searching
            redisHandler.updateLocationGeo(id, newLoc.getLat(), newLoc.getLng());
            
            // Optional: Update metadata if needed
            redisHandler.setValue(DRIVER_LOCATION_PREFIX + id, newLoc);
            
            messageHandler.sendMessage(session, DRIVER_LOCATION_SYNC, "Location Synced");
            sendRideToDriver(session, id);
        }
    }

    public void sendRideToDriver(WebSocketSession session, Long driverId) {
        // 1. Get all ride IDs waiting for a driver
        Set<Object> pendingIds = redisHandler.getAllPendingRideIds();

        for (Object rideIdObj : pendingIds) {
            Long rideId = Long.valueOf(rideIdObj.toString());

            // 2. Atomic check: Has this driver already been offered this ride?
            if (redisHandler.markRideAsSeenByDriver(driverId, rideId)) {
                RideRequest request = redisHandler.getRideData(rideId);
                
                // 3. Distance check using the index or direct calc
                if (request != null) {
                    messageHandler.sendMessage(session, RIDE_OFFERED, request);
                }
            }
        }
    }

    public void removeDriverDetailFromCache(Long driverId) {
        redisHandler.removeDriverData(driverId);
        redisHandler.delete(DRIVER_LOCATION_PREFIX + driverId);
    }

    public void handleDriverArrived(WebSocketSession session, WsMessage wsMessage) {
    	WsRideDTO wsRideDTO = jsonUtils.convertValue(wsMessage.getPayload(), WsRideDTO.class);
        Long rideId = wsRideDTO.getRideId();
        // 1. Update the state in the Redis Hash
        redisHandler.updateRideStatus(rideId, "DRIVER_ARRIVED");
        
        // 2. Fetch ride data to get passenger session/ID
        RideRequest ride = redisHandler.getRideData(rideId);
        
        // 3. Notify Passenger (Logic for finding user session would go here)
        messageHandler.sendMessage(session, "STATUS_UPDATE", "Driver has arrived at your location.");
    }

    /**
     * SDE3 Approach: Atomic addition to the global pending queue.
     */
    public void addRideRequestToCache(RideRequest rideRequest) {
        // This ensures no other thread is fetching/parsing a list; it just pushes to Redis.
        redisHandler.addRideToQueue(rideRequest);
    }

    /**
     * SDE3 Approach: Record that a specific driver was notified about a specific ride.
     * Prevents redundant WebSocket messages.
     */
    public void rideOfferedToDriver(Long driverId, RideRequest rideRequest, WebSocketSession session) {
        redisHandler.markRideAsSeenByDriver(driverId, rideRequest.getRideId());
		messageHandler.sendMessage(session, RIDE_OFFERED, rideRequest);
    }

    /**
     * SDE3 Approach: Use GeoUtils for high-precision distance checking.
     * Instead of iterating, we check if the driver's current indexed position is within radius.
     */
    public boolean isDriverDistanceInRange(Long driverId, RideRequest rideRequest, WebSocketSession session) {
        Location loc = (Location) redisHandler.getValue(DRIVER_LOCATION_PREFIX + driverId);
        if (loc == null) return false;

        double distance = GeoUtils.distanceInMeters(
            rideRequest.getStartLat(), rideRequest.getStartLng(),
            loc.getLat(), loc.getLng()
        );

        return distance <= 3000; // 3km threshold
    }

	public void handleStateChange(WebSocketSession session, Actor event) {
		// TODO Auto-generated method stub
		if(session != null && SessionStateValidator.isValidStateForActor(event.getActorType(), event.getActorState())) {
			messageHandler.sendMessage(session, STATE_CHANGE, event.getActorState());
		}
	}
}