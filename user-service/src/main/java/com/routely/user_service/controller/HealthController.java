package com.routely.user_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/actuator")
public class HealthController {
	@GetMapping("/health")
	public String test() {
		return "User service test endpoint";
	}
}
