package com.routely.user_service.config;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;

@Configuration
public class RedisHandler {
	@Autowired
	private RedisTemplate<String, Object> redisTemplate;


	public Object getValue(String key) {
		return redisTemplate.opsForValue().get(key);
	}

	public void setValue(String key, Object value) {
		redisTemplate.opsForValue().set(key, value);
	}
	
	public void setValue(String key, Object value, Integer duration) {
		redisTemplate.opsForValue().set(key, value, duration, TimeUnit.MINUTES);
	}
}
