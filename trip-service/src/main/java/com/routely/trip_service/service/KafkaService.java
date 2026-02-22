package com.routely.trip_service.service;

import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.InvalidProtocolBufferException;
import com.routely.shared.dto.RideCancelledEvent;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.shared.utils.RideUtil;
import com.routely.trip_service.dto.TripRequest;

@Service
public class KafkaService {

	@Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
	
	@Autowired
	private ObjectMapper objectMapper;
	
    private final static String ROUTELY_TRIP_TOPIC = Constants.ROUTELY_TRIP_TOPIC;
	private final String ROUTELY_TRIP_STATE_TOPIC = Constants.ROUTELY_TRIP_STATE_TOPIC;
    private final static String EVENT_RIDE_ACCEPTED = Constants.EVENT_RIDE_ACCEPTED;
    private final static String EVENT_RIDE_REQUESTED = Constants.EVENT_RIDE_REQUESTED;

    private <T> void setIfPresent(T value, Consumer<T> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }
    
    String preprocessing(TripRequest request) throws InvalidProtocolBufferException {
    	RideRequest.Builder builder = RideRequest.newBuilder();
    	setIfPresent(request.getStartAddress(), builder::setStartAddress);
    	setIfPresent(request.getStartLat(),      builder::setStartLat);
    	setIfPresent(request.getStartLng(),      builder::setStartLng);
    	setIfPresent(request.getEndAddress(),    builder::setEndAddress);
    	setIfPresent(request.getEndLat(),        builder::setEndLat);
    	setIfPresent(request.getEndLng(),        builder::setEndLng);
    	setIfPresent(request.getUserId(),        builder::setUserId);
    	setIfPresent(request.getUserMobNo(),     builder::setUserMobNo);
    	setIfPresent(request.getName(),          builder::setName);
    	setIfPresent(request.getDriverId(),      builder::setDriverId);
    	setIfPresent(request.getDriverName(),    builder::setDriverName);
    	setIfPresent(request.getDriverMobNo(),   builder::setDriverMobNo);
    	setIfPresent(request.getRideId(),        builder::setRideId);
    	setIfPresent(request.getRideType(),      builder::setRideType);

    	RideRequest req = builder.build();
		return RideUtil.toJson(req);
    }

    /**
     * Send message to Kafka (Producer).
     */
    public void sendTripRequest(TripRequest request) {
		try {
			String json = preprocessing(request);
			kafkaTemplate.send(ROUTELY_TRIP_TOPIC, EVENT_RIDE_REQUESTED, json);
			System.out.printf("✅ Produced message: key=%s value=%s%n", EVENT_RIDE_REQUESTED, json);
		} catch (InvalidProtocolBufferException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    public void sendDriverDetailToUser(TripRequest request) {
		try {
			String json = preprocessing(request);
			kafkaTemplate.send(ROUTELY_TRIP_TOPIC, EVENT_RIDE_ACCEPTED, json);
			System.out.printf("✅ Produced message: key=%s value=%s%n", EVENT_RIDE_ACCEPTED, json);
		} catch (InvalidProtocolBufferException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    public void handleOutboxEvent(String key, String payload) {
    	kafkaTemplate.send(ROUTELY_TRIP_STATE_TOPIC, key, payload);    	
    }

	public void handleRideCancellationEvent(String eventKey, String eventType) {
		// TODO Auto-generated method stub
		kafkaTemplate.send(ROUTELY_TRIP_STATE_TOPIC, eventKey, eventType);
	}

	public void handleRideCancellationEvent(String key, RideCancelledEvent rideCancelledEvent) throws JsonProcessingException {
		// TODO Auto-generated method stub
		String payload = objectMapper.writeValueAsString(rideCancelledEvent);
		kafkaTemplate.send(ROUTELY_TRIP_TOPIC, key, payload);
		
	}
    
}
