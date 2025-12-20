package com.routely.trip_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
//FareEstimationController.java
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.routely.trip_service.dto.FareEstimateRequest;
import com.routely.trip_service.dto.FareEstimateResponse;
import com.routely.trip_service.service.FareEstimationService;

@RestController
public class FareEstimationController {

	@Autowired
	private FareEstimationService service;

	@PostMapping("/user/estimateFare")
	public FareEstimateResponse estimateFare(@RequestBody FareEstimateRequest request) {
		return service.estimateFare(request);
	}
}
