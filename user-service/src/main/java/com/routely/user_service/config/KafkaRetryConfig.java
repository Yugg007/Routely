package com.routely.user_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

@Configuration
public class KafkaRetryConfig {

	@Bean
	public DefaultErrorHandler exponentialErrorHandler(KafkaTemplate<String, String> template) {
	    // 1. Define the Backoff logic
	    // Initial: 2s, Multiplier: 2.0, Max: 10s, Max Retries: 3
	    ExponentialBackOff backOff = new ExponentialBackOff();
	    backOff.setInitialInterval(2000L);
	    backOff.setMultiplier(2.0);
	    backOff.setMaxInterval(10000L);
	    backOff.setMaxElapsedTime(30000L); // Safety: Stop retrying this message after 30s total

	    // 2. Define the DLT Recoverer
	    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template);

	    // 3. Combine into the Handler
	    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);

	    // 4. Critical: Ensure you don't retry permanent failures
	    // Note: If you have trouble with the Class type, 
	    // you can use the more generic Exception.class check or specific ones:
	    handler.addNotRetryableExceptions(com.fasterxml.jackson.core.JsonProcessingException.class);

	    return handler;
	}
}
