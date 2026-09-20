package com.routely.websocket_service.service;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import com.routely.shared.dto.Actor;
import com.routely.shared.dto.RideCancelledEvent;
import com.routely.shared.enums.ActorType;
import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;
import com.routely.websocket_service.handler.DriverSocketHandler;
import com.routely.websocket_service.handler.UserSocketHandler;

@Service
public class KafkaService {
	@Autowired
	private DriverSocketHandler driverSocketHandler;
	@Autowired
	private UserSocketHandler userSocketHandler;
	@Autowired
	private ObjectMapper objectMapper;

	private final static String ROUTELY_TRIP_TOPIC = Constants.ROUTELY_TRIP_TOPIC;
	private final static String ROUTELY_USER_STATE_TOPIC = Constants.ROUTELY_USER_STATE_TOPIC;
	private final static String EVENT_RIDE_ACCEPTED = Constants.EVENT_RIDE_ACCEPTED;
	private final static String EVENT_RIDE_REQUESTED = Constants.EVENT_RIDE_REQUESTED;
	private final static String STATE_TRANSFER = Constants.STATE_TRANSFER;
	private final String EVENT_RIDE_CANCELLED = Constants.EVENT_RIDE_CANCELLED;
	private final String EVENT_RIDE_CANCELLED_BY_USER = Constants.EVENT_RIDE_CANCELLED_BY_USER;
	private final String EVENT_RIDE_CANCELLED_BY_DRIVER = Constants.EVENT_RIDE_CANCELLED_BY_DRIVER;

	/**
	 * Consume message from Kafka (Consumer). This will be auto-started by Spring.
	 */

	@KafkaListener(topics = ROUTELY_TRIP_TOPIC, groupId = "trip-service-group")
	public void tripConsumer(ConsumerRecord<String, String> record) {
		try {
			String key = record.key();
			String value = record.value();

			System.out.println("Consumed Key: " + key);
			System.out.println("Consumed Value: " + value);


			// Deserialize JSON based on key
			if (EVENT_RIDE_REQUESTED.equals(key)) {
				RideRequest rideRequest = preprocessing(value);
				driverSocketHandler.sendRideRequest(rideRequest);
			} 
			else if (EVENT_RIDE_ACCEPTED.equals(key)) {
				RideRequest rideRequest = preprocessing(value);
				userSocketHandler.sendAcceptedRideToUser(rideRequest);

			}
			else if(EVENT_RIDE_CANCELLED.equals(key)) {
				RideCancelledEvent event = objectMapper.readValue(value, RideCancelledEvent.class);
				if(EVENT_RIDE_CANCELLED_BY_DRIVER.equals(value)) {
					driverSocketHandler.handleRideCancellation(event);
				}
				else {
					userSocketHandler.handleRideCancellation(event);
				}
			}
			
			else {
				System.out.println("Unknown key: " + key);
			}

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@KafkaListener(topics = ROUTELY_USER_STATE_TOPIC, groupId = "state-service-group")
	public void stateConsumer(ConsumerRecord<String, String> record) {
		try {
			String key = record.key();
			String value = record.value();

			System.out.println("Consumed Key: " + key);
			System.out.println("Consumed Value: " + value);
			ObjectMapper map = new ObjectMapper();
			if (STATE_TRANSFER.equals(key)) {
				Actor event = map.readValue(value, Actor.class);
				if (ActorType.USER.equals(event.getActorType())) {
					userSocketHandler.handleStateChange(event);
				} 
				else if (ActorType.DRIVER.equals(event.getActorType())) {
					driverSocketHandler.handleStateChange(event);
				}
			}

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private RideRequest preprocessing(String value) throws InvalidProtocolBufferException {
		RideRequest.Builder builder = com.routely.shared.model.RideRequest.newBuilder();

		JsonFormat.parser()
			.ignoringUnknownFields()
			.merge(value, builder);

		return builder.build();
	}

}
