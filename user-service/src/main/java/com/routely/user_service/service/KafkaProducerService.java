package com.routely.user_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.routely.shared.utils.Constants;


@Service
public class KafkaProducerService {
	@Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
	
	private final String ROUTELY_USER_STATE_TOPIC = Constants.ROUTELY_USER_STATE_TOPIC;
	private final String STATE_TRANSFER = Constants.STATE_TRANSFER;
	
	public void produceStateChangeEvent(String payload) {
		kafkaTemplate.send(ROUTELY_USER_STATE_TOPIC, STATE_TRANSFER, payload);
	}

}
