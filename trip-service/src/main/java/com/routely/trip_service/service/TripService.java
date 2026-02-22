package com.routely.trip_service.service;

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
import com.routely.shared.dto.RideCancelledEvent;
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
	private final String EVENT_RIDE_CANCELLED_BY_USER = Constants.EVENT_RIDE_CANCELLED_BY_USER;
	private final String EVENT_RIDE_CANCELLED_BY_DRIVER = Constants.EVENT_RIDE_CANCELLED_BY_DRIVER;
	private final String EVENT_RIDE_ACCEPTED = Constants.EVENT_RIDE_ACCEPTED;
    private final String EVENT_ON_TRIP = Constants.EVENT_ON_TRIP;
    private final String EVENT_RIDE_REQUEST = Constants.EVENT_RIDE_REQUESTED;
    private final String STATE_TRANSFER = Constants.STATE_TRANSFER;
	

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
		
	    Optional<Ride> activeRide = rideRepository.findActiveRideForUpdate(request.getUserId(), 
	        List.of(RideStatus.MATCHING, RideStatus.ACCEPTED, RideStatus.ON_TRIP));

	    if (activeRide.isPresent()) {
	        throw new IllegalStateException("User already has an active ride session.");
	    }
	    
	    ride.setCreatedOn(LocalDateTime.now());
		rideRepository.save(ride);

		request.setRideId(ride.getRideId());

		try {
			Actor userCurrState = makeActor(ride.getUserId(), SessionState.MATCHING, ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_REQUEST);
            outbox.setAggregateId(ride.getRideId().toString());
            outbox.setEventType(STATE_TRANSFER);
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
			Actor userCurrState = makeActor(userId, SessionState.WAITING_FOR_DRIVER, ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_ACCEPTED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

	    try {            
	    	Actor driverCurrState = makeActor(driverId, SessionState.ACCEPTED, ActorType.DRIVER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_RIDE_ACCEPTED);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(driverCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
	    
	    kafkaService.sendDriverDetailToUser(request);

		return AcceptRideResult.success(rideId, driverId);
	}

	private Actor makeActor(Long id, SessionState state, ActorType type) {
		Actor currState = new Actor();
		currState.setActorId(id);
		currState.setActorState(state);
		currState.setActorType(type);
		return currState;
	}

	@Transactional(readOnly = true)
	public Optional<Ride> getUserCurrentRide(Long userId) {
        // Define what "Current" means to avoid returning an old finished ride.
        List<RideStatus> activeStatuses = List.of(
            RideStatus.MATCHING, 
            RideStatus.ACCEPTED, 
            RideStatus.ON_TRIP
        );

        return rideRepository.findTopByUserIdAndStatusInOrderByCreatedOnDesc(userId, activeStatuses);
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
	    
	    RideCancelledEvent rideCancelledEvent = new RideCancelledEvent();
	    rideCancelledEvent.setDriverId(driverId);
	    rideCancelledEvent.setUserId(userId);
	    rideCancelledEvent.setRideId(rideId);
	    
	    if(ActorType.DRIVER.equals(actorType)) {
	    	handleRideCancelledEvent(userId, driverId, rideId, EVENT_RIDE_CANCELLED_BY_DRIVER, SessionState.MATCHING, SessionState.IDLE);
	    	rideCancelledEvent.setCancelledBy(ActorType.DRIVER);
	    }
	    else {
	    	handleRideCancelledEvent(userId, driverId, rideId, EVENT_RIDE_CANCELLED_BY_USER, SessionState.IDLE, SessionState.IDLE);
	    	rideCancelledEvent.setCancelledBy(ActorType.USER);
	    }
	    
	    kafkaService.handleRideCancellationEvent(EVENT_RIDE_CANCELLED, rideCancelledEvent);
	}

	private void handleRideCancelledEvent(Long userId, Long driverId, Long rideId, String eventType, SessionState userState, SessionState driverState) throws JsonProcessingException {
		// TODO Auto-generated method stub
		Actor userCurrState = makeActor(userId, userState, ActorType.USER);
		OutboxEvent outbox1 = new OutboxEvent();
		outbox1.setAggregateType(eventType);
		outbox1.setAggregateId(rideId.toString());
		outbox1.setEventType(STATE_TRANSFER);
		outbox1.setPayload(objectMapper.writeValueAsString(userCurrState));
		
		outboxRepository.save(outbox1);
		
		if(driverId == null) {
			Actor driverCurrState = makeActor(driverId, driverState, ActorType.DRIVER);
			OutboxEvent outbox2 = new OutboxEvent();
			outbox2.setAggregateType(eventType);
			outbox2.setAggregateId(rideId.toString());
			outbox2.setEventType(STATE_TRANSFER);
			outbox2.setPayload(objectMapper.writeValueAsString(driverCurrState));
			
			outboxRepository.save(outbox2);			
		}
	}

	public Optional<Ride> getDriverCurrentRide(Long driverId) {
		// TODO Auto-generated method stub
        List<RideStatus> activeStatuses = List.of(
                RideStatus.ACCEPTED, 
                RideStatus.ON_TRIP
            );

            return rideRepository.findTopByDriverIdAndStatusInOrderByCreatedOnDesc(driverId, activeStatuses);
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
			Actor userCurrState = makeActor(ride.getUserId(), SessionState.ON_TRIP, ActorType.USER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_ON_TRIP);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(userCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

	    try {            
	    	Actor driverCurrState = makeActor(ride.getDriverId(), SessionState.ON_TRIP, ActorType.DRIVER);
            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType(EVENT_ON_TRIP);
            outbox.setAggregateId(rideId.toString());
            outbox.setEventType(STATE_TRANSFER);
            outbox.setPayload(objectMapper.writeValueAsString(driverCurrState));

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            // Tip: Never let JSON serialization fail silently
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

        return true;
    }
}
