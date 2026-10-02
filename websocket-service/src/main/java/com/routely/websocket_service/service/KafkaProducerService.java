package com.routely.websocket_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.routely.shared.utils.Constants;

@Service
public class KafkaProducerService {
	@Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
	
	private final String ROUTELY_STATE_TOPIC = Constants.ROUTELY_STATE_TOPIC;
	private final String EVENT_STATE_TRANSFER = Constants.EVENT_STATE_TRANSFER;
	private final String EVENT_STATE_ACKNOWLEDGE = Constants.EVENT_STATE_ACKNOWLEDGE;
	
	public void produceStateChangeEvent(String payload) {
		kafkaTemplate.send(ROUTELY_STATE_TOPIC, EVENT_STATE_TRANSFER, payload);
		kafkaTemplate.send(ROUTELY_STATE_TOPIC, EVENT_STATE_ACKNOWLEDGE, payload);
	}

}