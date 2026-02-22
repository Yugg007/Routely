package com.routely.user_service.service;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.routely.shared.utils.Constants;

@Service
public class KafkaConsumerService {
	@Autowired
	private ActorSessionService actorSessionService;

	private final static String ROUTELY_TRIP_STATE_TOPIC = Constants.ROUTELY_TRIP_STATE_TOPIC;
	private final static String STATE_TRANSFER = Constants.STATE_TRANSFER;

	/**
	 * Consume message from Kafka (Consumer). This will be auto-started by Spring.
	 * @throws JsonProcessingException 
	 * @throws JsonMappingException 
	 */

	@KafkaListener(topics = ROUTELY_TRIP_STATE_TOPIC, groupId = "trip-service-group")
	public void consume(ConsumerRecord<String, String> record) throws JsonMappingException, JsonProcessingException {
		String key = record.key();
		String value = record.value();
		
		System.out.println("Consumed Key: " + key);
		System.out.println("Consumed Value: " + value);
		
		if (STATE_TRANSFER.equals(key)) {
			actorSessionService.handleStateChangeEvent(value);
		}
	}

}
