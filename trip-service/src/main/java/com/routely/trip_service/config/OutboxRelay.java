package com.routely.trip_service.config;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.routely.trip_service.model.OutboxEvent;
import com.routely.trip_service.repository.OutboxRepository;
import com.routely.trip_service.service.KafkaService;

import jakarta.transaction.Transactional;

@Component
public class OutboxRelay {

	@Autowired
	private OutboxRepository outboxRepository;
	
	@Autowired
	private KafkaService kafkaService;
	
	private Logger log = LoggerFactory.getLogger(OutboxRelay.class);
	


	@Scheduled(fixedDelay = 1000) // Polls every 1 second
	@Transactional
	public void publishEvents() {
		List<OutboxEvent> unprocessedEvents = outboxRepository.findByProcessedFalseOrderByCreatedAtAsc();

		for (OutboxEvent event : unprocessedEvents) {
			try {
				// Use aggregateId (rideId) or userId as the Kafka Key
				// to ensure partition ordering
				kafkaService.handleOutboxEvent(event.getEventType(), event.getPayload());

				event.setProcessed(true);
				event.setProcessedAt(LocalDateTime.now());
				outboxRepository.save(event);
				log.info("Published event: {} for ID: {}", event.getEventType(), event.getAggregateId());
			} catch (Exception e) {
				log.error("Failed to publish outbox event: {}", event.getId(), e);
				// We DON'T set processed=true, so it will retry on next poll
			}
		}
	}
}