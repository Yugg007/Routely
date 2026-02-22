package com.routely.websocket_service.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.websocket_service.modal.UserLocation;
@Component
public class JsonUtils {

	@Autowired
    private ObjectMapper objectMapper;
    /**
     * Converts a JSON string into a specific Java Object.
     * @param json The JSON payload (String)
     * @param clazz The Target Class (e.g., WsMessage.class)
     */
    public <T> T fromJson(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            // SDE3 Tip: Log context so you know WHICH JSON failed
            throw new RuntimeException("Failed to convert JSON to " + clazz.getSimpleName(), e);
        }
    }

    /**
     * Converts a Java Object into a JSON string.
     */
    public String toJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert " + object.getClass().getSimpleName() + " to JSON", e);
        }
    }

	public <T> T convertValue(Object payload, Class<T> clazz) {
        return objectMapper.convertValue(payload, clazz);
	}
}