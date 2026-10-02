package com.routely.user_service.config;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.enums.SessionState;

@Configuration
public class RedisHandler {
	private String STATE_KEY = "user_state:";
	@Autowired
	private RedisTemplate<String, Object> redisTemplate;
	
	@Autowired
	private ObjectMapper objectMapper;


	public Object getValue(String key) {
		return redisTemplate.opsForValue().get(key);
	}

	public void setValue(String key, Object value) {
		redisTemplate.opsForValue().set(key, value);
	}
	
	public void setValue(String key, Object value, Integer duration) {
		redisTemplate.opsForValue().set(key, value, duration, TimeUnit.MINUTES);
	}
	
	public void setStateValue(Long id, SessionState sessionState) {
		String key = STATE_KEY + id;
		setValue(key, sessionState, 5);
	}
	
	
	public SessionState getStateValue(Long id) {
	    String key = STATE_KEY + id;
	    Object value = getValue(key);
	    
	    if (value == null) return null;
	    
	    // If it's already the right type, just return it
	    if (value instanceof SessionState) {
	        return (SessionState) value;
	    }
	    
	    // If it's a Map (common with JSON serializers), convert it
	    return objectMapper.convertValue(value, SessionState.class);
	}
}
