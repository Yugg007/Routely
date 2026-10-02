package com.routely.websocket_service.handler;

import java.util.Set;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.dto.Actor;
import com.routely.shared.dto.RideEvent;
import com.routely.shared.enums.ActorType;
import com.routely.shared.enums.SessionState;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.shared.utils.SessionStateValidator;
import com.routely.websocket_service.config.JsonUtils;
import com.routely.websocket_service.dto.WsMessage;
import com.routely.websocket_service.modal.Location;
import com.routely.websocket_service.service.KafkaProducerService;
import com.routely.websocket_service.utils.GeoUtils;

@Component
public class DriverHandler {
    @Autowired private MessageHandler messageHandler;
    @Autowired private RedisHandler redisHandler;
    @Autowired private JsonUtils jsonUtils;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private KafkaProducerService kafkaProducerService;
    
    private final String DRIVER_LOCATION_SYNCED = Constants.DRIVER_LOCATION_SYNCED;
    private final String RIDE_OFFERED = Constants.RIDE_OFFERED;
    private final String RIDE_ACCEPTED = Constants.RIDE_ACCEPTED;
    private final String REDIS_DRIVER_LOCATION_PREFIX = Constants.REDIS_DRIVER_LOCATION_PREFIX;
    private final String STATE_CHANGE = Constants.STATE_CHANGE;
    private final String REDIS_RIDE_STATUS_WAITING_FOR_DRIVER = Constants.REDIS_RIDE_STATUS_WAITING_FOR_DRIVER;
    private final String REDIS_RIDE_STATUS_DRIVER_ARRIVED = Constants.REDIS_RIDE_STATUS_DRIVER_ARRIVED;
    private final String REDIS_DRIVER_RIDE_POOL_PREFIX = Constants.REDIS_DRIVER_RIDE_POOL_PREFIX;
    private final String REDIS_DRIVER_DECLINED_RIDES_PREFIX = Constants.REDIS_DRIVER_DECLINED_RIDES_PREFIX;
    private final String REDIS_DRIVER_CANCELLED_RIDES_PREFIX = Constants.REDIS_DRIVER_CANCELLED_RIDES_PREFIX;
    private final String REDIS_DRIVER_ACCEPTED_RIDES_PREFIX = Constants.REDIS_DRIVER_ACCEPTED_RIDES_PREFIX;

    public void locationUpdate(WebSocketSession session, WsMessage wsMessage) {
        Location newLoc = jsonUtils.convertValue(wsMessage.getPayload(), Location.class);
        Long id = newLoc.getId();

        if (id != null) {
            // Update the Geospatial Index for fast searching
            redisHandler.updateLocationGeo(id, newLoc.getLat(), newLoc.getLng());
            
            // Optional: Update metadata if needed
            redisHandler.setValue(REDIS_DRIVER_LOCATION_PREFIX + id, newLoc);
            
            messageHandler.sendMessage(session, DRIVER_LOCATION_SYNCED, "Location Synced");
            sendRideToDriver(session, id, newLoc);
        }
    }

    public void sendRideToDriver(WebSocketSession session, Long driverId, Location loc) {
        // 1. Get all ride IDs waiting for a driver
    	Set<Object> pendingIds = redisHandler.getAllPendingRideIds();
    	for (Object rideIdObj : pendingIds) {
    		Long rideId = Long.valueOf(rideIdObj.toString());
    		String status = redisHandler.getRideStatus(rideId);
    		if(REDIS_RIDE_STATUS_WAITING_FOR_DRIVER.equals(status)) {
    			RideRequest rideRequest = redisHandler.getRideData(rideId);
    			if(attemptRideOffer(driverId, session, rideRequest)) {
    				System.out.println("Requesting ride to driver:" + driverId + ":" + rideId);
    				break;
    			}
    		}
    	}
	    }

		public List<Long> findNearbyDriverIds(String lat, String lng, double radiusKm) {
			if (lat == null || lat.isBlank() || lng == null || lng.isBlank()) {
				return List.of();
			}

			try {
				return redisHandler.findNearbyDriverIds(
						Double.parseDouble(lat), Double.parseDouble(lng), radiusKm);
			} catch (NumberFormatException exception) {
				return List.of();
			}
		}

	public void removeDriverDetailFromCache(Long driverId) {
        redisHandler.removeDriverData(driverId);
        redisHandler.delete(REDIS_DRIVER_LOCATION_PREFIX + driverId);
    }

    public void handleDriverArrived(WebSocketSession session, WsMessage wsMessage) throws JsonProcessingException {
    	RideEvent rideEvent = jsonUtils.convertValue(wsMessage.getPayload(), RideEvent.class);
        Long rideId = rideEvent.getRideId();
        Long driverId = rideEvent.getDriverId();
        redisHandler.updateRideStatus(rideId, REDIS_RIDE_STATUS_DRIVER_ARRIVED);
        Actor actor = new Actor(SessionState.DRIVER_ARRIVED, driverId, ActorType.DRIVER);
        String payload = objectMapper.writeValueAsString(actor);
        kafkaProducerService.produceStateChangeEvent(payload);
    }

    /**
     * Atomic addition to the global pending queue.
     */
    public void addRideRequestToCache(RideRequest rideRequest) {
        redisHandler.addRideToQueue(rideRequest);
    }


    public boolean isDriverDistanceInRange(Long driverId, RideRequest rideRequest) {
        Location loc = (Location) redisHandler.getValue(REDIS_DRIVER_LOCATION_PREFIX + driverId);
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

	public void sendAcknowledgement(WebSocketSession session, String msg) {
		// TODO Auto-generated method stub
		messageHandler.sendMessage(session, "ACKNOWLEDGE", msg);		
	}

	public boolean handleRideAccepted(RideRequest rideRequest, WebSocketSession session) {
		if (!redisHandler.claimRideAcceptance(rideRequest.getRideId(), rideRequest.getDriverId())) {
			return false;
		}
		redisHandler.clearRideOfferForDriver(rideRequest.getDriverId(), rideRequest.getRideId());
		
		String driverAcceptedRidesKey = REDIS_DRIVER_ACCEPTED_RIDES_PREFIX + rideRequest.getDriverId();
		redisHandler.addToRedisSet(driverAcceptedRidesKey, String.valueOf(rideRequest.getRideId()));
		
		messageHandler.sendMessage(session, RIDE_ACCEPTED, rideRequest);
		return true;
	}
	
	public boolean attemptRideOffer(Long driverId, WebSocketSession session, RideRequest rideRequest) {
		// TODO Auto-generated method stub
		if(rideRequest != null && isDriverDistanceInRange(driverId, rideRequest)) {
			String ride_id = String.valueOf(rideRequest.getRideId());		
			
			String driverDeclinedRides = REDIS_DRIVER_DECLINED_RIDES_PREFIX + driverId;
			boolean isRideDeclinedByDriver = redisHandler.isInRedisSet(driverDeclinedRides, ride_id);
			
			String driverCancelledRides = REDIS_DRIVER_CANCELLED_RIDES_PREFIX + driverId;
			boolean isRideCancelledByDriver = redisHandler.isInRedisSet(driverCancelledRides, ride_id);
			
			String driverAcceptedRidesKey = REDIS_DRIVER_ACCEPTED_RIDES_PREFIX + driverId;
			boolean isRideAcceptedByDriver = redisHandler.isInRedisSet(driverAcceptedRidesKey, ride_id);
			Long rideAcceptedPoolSize = redisHandler.sizeOfRedisSet(driverAcceptedRidesKey);

			if(!isRideDeclinedByDriver && !isRideCancelledByDriver && !isRideAcceptedByDriver) {
				
				String driverRidePoolKey = REDIS_DRIVER_RIDE_POOL_PREFIX + driverId;
				boolean isInList = redisHandler.isInList(driverRidePoolKey, ride_id);
				
				if(!isInList) {
					Long driverRidePoolSize = redisHandler.sizeOfRedisList(driverRidePoolKey);
					if(driverRidePoolSize < 2) {
						redisHandler.putInList(driverRidePoolKey, ride_id);
					}				
				}
				
				if(rideAcceptedPoolSize < 2) {
					int result = redisHandler.getFromList(driverRidePoolKey).indexOf(ride_id);
					boolean shouldOffer = (rideAcceptedPoolSize == result);
					if(shouldOffer && redisHandler.tryOfferRideToDriver(driverId, rideRequest.getRideId())) {
						messageHandler.sendMessage(session, RIDE_OFFERED, rideRequest);
						return true;
					}
				}				
					
			}

		}
			
		return false;
	}

	public void handleRideDecline(WebSocketSession session, WsMessage wsMessage) {
		// TODO Auto-generated method stub
		RideEvent rideEvent = jsonUtils.convertValue(wsMessage.getPayload(), RideEvent.class);
		
		//Put into ride_id driver decline set
		String driverDeclinedRides = REDIS_DRIVER_DECLINED_RIDES_PREFIX + rideEvent.getDriverId();
    	redisHandler.addToRedisSet(driverDeclinedRides, String.valueOf(rideEvent.getRideId()));
		redisHandler.clearRideOfferForDriver(rideEvent.getDriverId(), rideEvent.getRideId());
    	
    	//get current location of driver
    	String driverLocationKey = REDIS_DRIVER_LOCATION_PREFIX + rideEvent.getDriverId();
    	Location loc = (Location) redisHandler.getValue(driverLocationKey);
    	
    	// remove from drive ride pool too
		String driverRidePoolKey = REDIS_DRIVER_RIDE_POOL_PREFIX + rideEvent.getDriverId();
		redisHandler.deleteFromList(driverRidePoolKey, String.valueOf(rideEvent.getRideId()));
    	
		//Offering new ride to driver
    	sendRideToDriver(session, rideEvent.getDriverId(), loc);
	}

	public void handleRideCancellation(WebSocketSession session, RideEvent rideEvent) {
		// TODO Auto-generated method stub
		//Put into ride_id driver decline set
		String driverCancelledRides = REDIS_DRIVER_CANCELLED_RIDES_PREFIX + rideEvent.getDriverId();
    	redisHandler.addToRedisSet(driverCancelledRides, String.valueOf(rideEvent.getRideId()));
		redisHandler.clearRideOfferForDriver(rideEvent.getDriverId(), rideEvent.getRideId());
    	
    	//get current location of driver
    	String driverLocationKey = REDIS_DRIVER_LOCATION_PREFIX + rideEvent.getDriverId();
    	Location loc = (Location) redisHandler.getValue(driverLocationKey);
    	
    	//update ride status to waiting for driver
    	redisHandler.updateRideStatus(rideEvent.getRideId(), REDIS_RIDE_STATUS_WAITING_FOR_DRIVER);
		redisHandler.releaseRideAcceptance(rideEvent.getRideId());
		redisHandler.removeFromRedisSet(
				REDIS_DRIVER_ACCEPTED_RIDES_PREFIX + rideEvent.getDriverId(),
				String.valueOf(rideEvent.getRideId()));
		redisHandler.deleteFromList(
				REDIS_DRIVER_RIDE_POOL_PREFIX + rideEvent.getDriverId(),
				String.valueOf(rideEvent.getRideId()));
    	
		//Offering new ride to driver
    	sendRideToDriver(session, rideEvent.getDriverId(), loc);
	}
	
	public void handleRideCompleted(RideRequest rideRequest) {
		// TODO Auto-generated method stub
		Long rideId = rideRequest.getRideId();
		Long driverId = rideRequest.getDriverId();
		
		//remove userstate
		redisHandler.deleteStateValue(driverId);
		
		//remove ride from pending
		redisHandler.removeRideFromQueue(rideId);
		
		//remove ride data from redis
		//remove connection bw user and ride
		String driverAcceptedRidesKey = REDIS_DRIVER_ACCEPTED_RIDES_PREFIX + driverId;
		redisHandler.removeFromRedisSet(driverAcceptedRidesKey, String.valueOf(rideRequest.getRideId()));
		redisHandler.deleteFromList(
				REDIS_DRIVER_RIDE_POOL_PREFIX + driverId,
				String.valueOf(rideRequest.getRideId()));
		redisHandler.deleteRideData(rideId);
	}
};