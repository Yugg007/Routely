package com.routely.websocket_service.service;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;
import com.routely.websocket_service.dto.RideRequest;
import com.routely.websocket_service.handler.DriverSocketHandler;
import com.routely.websocket_service.handler.UserSocketHandler;

@Service
public class KafkaService {
	@Autowired
	private DriverSocketHandler driverSocketHandler;
	@Autowired
	private UserSocketHandler userSocketHandler;
    private final Gson gson = new Gson();
    
    /**
     * Consume message from Kafka (Consumer).
     * This will be auto-started by Spring.
     */
   
    @KafkaListener(topics = "Routely", groupId = "trip-service-group")
    public void consume(ConsumerRecord<String, String> record) {
        try {
            String key = record.key();
            String value = record.value();

            System.out.println("Consumed Key: " + key);
            System.out.println("Consumed Value: " + value);

            RideRequest tripRequest = gson.fromJson(value, RideRequest.class);
            // Deserialize JSON based on key
            if ("TripRequest".equals(key)) {
                driverSocketHandler.sendRideRequest(tripRequest);
            } else if ("AcceptedTrip".equals(key)) {
            	userSocketHandler.sendAcceptedRideToUser(tripRequest);
                // handle accepted trip
            } else {
                System.out.println("Unknown key: " + key);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }    

}
