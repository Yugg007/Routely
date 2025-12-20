package com.routely.trip_service.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.routely.trip_service.dto.AcceptRideRequest;
import com.routely.trip_service.dto.AcceptRideResult;
import com.routely.trip_service.dto.TripRequest;
import com.routely.trip_service.service.KafkaService;
import com.routely.trip_service.service.TripService;

@RestController
public class TripController {
	@Autowired
	private TripService tripService;
	@Autowired
	private KafkaService kafkaService;

	private Logger logger = LoggerFactory.getLogger(TripController.class);

	@PostMapping("/user/requestRide")
	public ResponseEntity<String> requestRide(@RequestBody TripRequest request) throws Exception {
		try {
			tripService.requestRide(request);
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while requesting ride", e.getLocalizedMessage());
			return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
					.body("Error occured while requesting ride" + e.getLocalizedMessage());
		}
		return ResponseEntity.ok("Ride requested.");

	}

	@PostMapping("/driver/acceptRide")
	public ResponseEntity<AcceptRideResult> acceptRide(@RequestBody AcceptRideRequest request) throws Exception {
		AcceptRideResult response = new AcceptRideResult();
		try {
			response = tripService.acceptRide(request.getRide_id(), request.getDriver_id());
			if(response.isSuccess()) {
				kafkaService.sendDriverDetailToUser(request);
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while requesting ride", e.getLocalizedMessage());
		}
		return ResponseEntity.ok(response);

	}

}
