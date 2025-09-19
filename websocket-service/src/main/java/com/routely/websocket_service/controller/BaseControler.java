package com.routely.websocket_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BaseControler {
	@GetMapping("/test")
	public String  test() {
		return "Testing ingestion service";
	}
}
