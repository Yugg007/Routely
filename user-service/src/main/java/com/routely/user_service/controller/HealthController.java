package com.routely.user_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
	@GetMapping("/test")
	public String test() {
		return "User service test endpoint";
	}
}
