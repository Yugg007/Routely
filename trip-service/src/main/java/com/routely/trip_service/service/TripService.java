package com.routely.trip_service.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.Optional;

import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.dto.Actor;
import com.routely.shared.dto.RideEvent;
import com.routely.shared.enums.ActorType;
import com.routely.shared.enums.RideStatus;
import com.routely.shared.enums.SessionState;
import com.routely.shared.utils.Constants;
import com.routely.trip_service.dto.AcceptRideResult;
import com.routely.trip_service.dto.RidePinResponse;
import com.routely.trip_service.dto.TripRequest;
import com.routely.trip_service.model.OutboxEvent;
import com.routely.trip_service.model.Ride;
import com.routely.trip_service.repository.OutboxRepository;
import com.routely.trip_service.repository.RideRepository;
import com.routely.trip_service.utils.PinUtil;

@Service
public class TripService {
	@Autowired
	private KafkaService kafkaService;

	@Autowired
	private RideRepository rideRepository;
	
	@Autowired
	private ObjectMapper objectMapper;
	
	@Autowired
	private OutboxRepository outboxRepository;
	
	private final String ROUTELY_FRONTEND = Constants.ROUTELY_FRONTEND;
	private final String EVENT_RIDE_CANCELLED = Constants.EVENT_RIDE_CANCELLED;
	private final String EVENT_RIDE_ACCEPTED = Constants.EVENT_RIDE_ACCEPTED;
	private final String EVENT_RIDE_COMPLETED = Constants.EVENT_RIDE_COMPLETED;
    private final String EVENT_ON_TRIP = Constants.EVENT_ON_TRIP;
    private final String EVENT_RIDE_REQUEST = Constants.EVENT_RIDE_REQUESTED;
    private final String EVENT_STATE_TRANSFER = Constants.EVENT_STATE_TRANSFER;	

	@Transactional
	public Long requestRide(TripRequest request) {
		// TODO Auto-generated method stub
		// 1. SELECT FOR UPDATE (Pessimistic Lock) on the user's recent rides
	    // This blocks other threads from creating a ride for this specific user simultaneously
		Ride ride = new Ride();
		ride.setRideType(request.getRideType());
		ride.setEndAddress(request.getEndAddress());
		ride.setEndLat(request.getEndLat());
		ride.setEndLng(request.getEndLng());
		ride.setStartAddress(request.getStartAddress());
		ride.setStartLat(request.getStartLat());
		ride.setStartLng(request.getStartLng());
		ride.setUserId(request.getUserId());
		ride.setUserMobNo(request.getUserMobNo());
		ride.setName(request.getName());
		ride.setStatus(RideStatus.MATCHING);
		ride.setUserId(request.getUserId());
		ride.setCreatedBy(ROUTELY_FRONTEND);
		ride.setOtpPin(PinUtil.generateSecurePin());
		ride.setFare(request.getFare());
		
	    Optional<Ride> activeRide = rideRepository.findActiveRideForUpdate(request.getUserId(), 
	        List.of(RideStatus.MATCHING, RideStatus.ACCEPTED, RideStatus.ON_TRIP));

	    if (activeRide.isPresent()) {
	        throw new IllegalStateException("User already has an active ride session.");
	    }
	    
	    ride.setCreatedOn(LocalDateTime.now());
		rideRepository.save(ride);

		request.setRideId(ride.getRideId());

		try {
			Actor userCurrState = new Actor(SessionState.MATCHING, ride.getUserId(), ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_REQUEST);
            outbox.setAggregateId(ride.getRideId().toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }		
		
		kafkaService.sendTripRequest(request);
		
		return ride.getRideId();
	}

	@Transactional
	public AcceptRideResult acceptRide(TripRequest request) {
		Long rideId = request.getRideId();
		Long driverId = request.getDriverId();
		Long userId = request.getUserId();

		int updatedRows = rideRepository.atomicAcceptRide(
	            rideId, driverId, RideStatus.ACCEPTED, RideStatus.MATCHING, LocalDateTime.now()
			    );
		
		if (updatedRows == 0) {
//	        log.info("Driver {} lost the race for ride {}", driverId, rideId);
	        throw new IllegalStateException("Ride is no longer available.");
	    }

	
		try {
			Actor userCurrState = new Actor(SessionState.WAITING_FOR_DRIVER, userId, ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_ACCEPTED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

	    try {            
	    	Actor driverCurrState = new Actor(SessionState.ACCEPTED, driverId, ActorType.DRIVER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_ACCEPTED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(driverCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
	    
	    kafkaService.sendDriverDetailToUser(request);

		return AcceptRideResult.success(rideId, driverId);
	}


	@Transactional(readOnly = true)
	public Ride getUserCurrentRide(Long userId) {
        // Define what "Current" means to avoid returning an old finished ride.
        List<RideStatus> activeStatuses = List.of(
            RideStatus.MATCHING, 
            RideStatus.ACCEPTED, 
            RideStatus.ON_TRIP
        );

        Optional<Ride> ride = rideRepository.findTopByUserIdAndStatusInOrderByCreatedOnDesc(userId, activeStatuses);
        if(ride.isPresent()) {
        	return ride.get();
        }
        return null;
	}

	@Transactional
	public void cancelRide(TripRequest request, ActorType actorType) throws JsonProcessingException {
		Long rideId = request.getRideId();
		Long userId = request.getUserId();
		Long driverId = request.getDriverId();
		
		if(userId == null || rideId == null) {
			throw new IllegalArgumentException("Required identifiers (userId or rideId) are missing.");
		}
	    // Define which states allow cancellation
	    List<RideStatus> allowedStates = List.of(RideStatus.MATCHING, RideStatus.ACCEPTED);
	    
	    //Define ride status after cancellation
	    RideStatus statusToUpdate = RideStatus.CANCELLED;
	    if(ActorType.DRIVER.equals(actorType)) {
	    	statusToUpdate = RideStatus.MATCHING;
	    }
	    
	    // Perform the atomic update
	    int rowsAffected = rideRepository.atomicCancel(
	        rideId, 
	        userId, 
	        statusToUpdate, 
	        allowedStates
	    );

	    // If 0 rows were updated, it means:
	    // 1. The rideId doesn't belong to this userId (Security check passed!)
	    // 2. The ride is already ON_TRIP, COMPLETED, or already CANCELLED.
	    if (rowsAffected == 0) {
	        throw new IllegalStateException("Unable to cancel ride. It may be in progress, already cancelled, or invalid.");
	    }
	    
	    RideEvent rideCancelledEvent = new RideEvent();
	    rideCancelledEvent.setDriverId(driverId);
	    rideCancelledEvent.setUserId(userId);
	    rideCancelledEvent.setRideId(rideId);
	    
	    if(ActorType.DRIVER.equals(actorType)) {
	    	handleRideCancelledEvent(userId, driverId, rideId, ActorType.DRIVER, SessionState.MATCHING, SessionState.IDLE);
	    	rideCancelledEvent.setCancelledBy(ActorType.DRIVER);
	    }
	    else {
	    	handleRideCancelledEvent(userId, driverId, rideId, ActorType.USER, SessionState.IDLE, SessionState.IDLE);
	    	rideCancelledEvent.setCancelledBy(ActorType.USER);
	    }
	    
	    kafkaService.handleRideCancellationEvent(EVENT_RIDE_CANCELLED, rideCancelledEvent);
	}

	private void handleRideCancelledEvent(Long userId, Long driverId, Long rideId, ActorType eventType, SessionState userState, SessionState driverState) throws JsonProcessingException {
		// TODO Auto-generated method stub
		Actor userCurrState = new Actor(userState, userId, ActorType.USER);
		OutboxEvent outbox1 = new OutboxEvent();
		outbox1.setAggregateType(eventType.toString());
		outbox1.setAggregateId(rideId.toString());
		outbox1.setEventType(EVENT_STATE_TRANSFER);
		outbox1.setPayload(objectMapper.writeValueAsString(userCurrState));
		
		outboxRepository.save(outbox1);
		
		if(driverId != null) {
			Actor driverCurrState = new Actor(driverState, driverId, ActorType.DRIVER);
			OutboxEvent outbox2 = new OutboxEvent();
			outbox2.setAggregateType(eventType.toString());
			outbox2.setAggregateId(rideId.toString());
			outbox2.setEventType(EVENT_STATE_TRANSFER);
			outbox2.setPayload(objectMapper.writeValueAsString(driverCurrState));
			
			outboxRepository.save(outbox2);			
		}
	}

	public Ride getDriverCurrentRide(Long driverId) {
		// TODO Auto-generated method stub
        List<RideStatus> activeStatuses = List.of(
                RideStatus.ACCEPTED, 
                RideStatus.ON_TRIP
            );

        Optional<Ride> ride =  rideRepository.findTopByDriverIdAndStatusInOrderByCreatedOnDesc(driverId, activeStatuses);
        if(ride.isPresent()) {
        	return ride.get();
        }
        return null;
	}

	public RidePinResponse getRidePin(TripRequest request) {
	    Ride ride = rideRepository.findById(request.getRideId())
	        .orElseThrow(() -> new ResourceNotFoundException("Ride not found"));
	        
	    return new RidePinResponse(
	        ride.getRideId(),
	        ride.getOtpPin(),
	        "Please share this PIN with your driver."
	    );
	}

	@Transactional
    public boolean startTripWithPin(Long rideId, String pin) {
        // Atomic check: Verify PIN + Check if state is 'DRIVER_ARRIVED'
        int rowsUpdated = rideRepository.verifyPinAndStartTrip(rideId, pin, RideStatus.ACCEPTED);

        if (rowsUpdated == 0) {
            return false;
        }
        
        Ride ride = rideRepository.findById(rideId)
    	        .orElseThrow(() -> new ResourceNotFoundException("Ride not found"));
    	
		try {
			Actor userCurrState = new Actor(SessionState.ON_TRIP, ride.getUserId(), ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_ON_TRIP);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

	    try {            
	    	Actor driverCurrState = new Actor(SessionState.ON_TRIP, ride.getDriverId(), ActorType.DRIVER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_ON_TRIP);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(driverCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

        return true;
    }

	public String completeRide(TripRequest request) throws Exception {
		Long rideId = request.getRideId();
		Long driverId = request.getDriverId();
		Long userId = request.getUserId();

		int updatedRows = rideRepository.atomicCompleteRide(
	            rideId, driverId, RideStatus.COMPLETED, RideStatus.ON_TRIP, LocalDateTime.now()
			    );
		
		if (updatedRows == 0) {
//	        log.info("Driver {} lost the race for ride {}", driverId, rideId);
	        throw new IllegalStateException("Not able to complete a ride");
	    }

	
		try {
			Actor userCurrState = new Actor(SessionState.IDLE, userId, ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_COMPLETED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

	    try {            
	    	Actor driverCurrState = new Actor(SessionState.IDLE, driverId, ActorType.DRIVER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_COMPLETED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(EVENT_STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(driverCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
	    
	    kafkaService.sendRideCompletedDetailToRedis(request);

		return "Ride Completed...";
	}
}
