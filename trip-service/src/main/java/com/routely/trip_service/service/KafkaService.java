package com.routely.trip_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.google.gson.Gson;
import com.routely.trip_service.dto.AcceptRideRequest;
import com.routely.trip_service.dto.TripRequest;

@Component
public class KafkaService {

	@Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    private final String topic = "Routely";
    private final Gson gson = new Gson();


    /**
     * Send message to Kafka (Producer).
     */
    public void sendTripRequest(TripRequest request) {
    	String key = "TripRequest";
    	String json = gson.toJson(request);
        kafkaTemplate.send(topic, key, json);
        System.out.printf("✅ Produced message: key=%s value=%s%n", key, json);
    }
    
    public void sendDriverDetailToUser(AcceptRideRequest request) {
    	String key = "AcceptedTrip";
    	String json = gson.toJson(request);
        kafkaTemplate.send(topic, key, json);
        System.out.printf("✅ Produced message: key=%s value=%s%n", key, json);
    }
}
