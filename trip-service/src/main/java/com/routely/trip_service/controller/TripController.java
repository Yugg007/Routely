package com.routely.trip_service.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.routely.shared.enums.ActorType;
import com.routely.trip_service.dto.AcceptRideResult;
import com.routely.trip_service.dto.RidePinResponse;
import com.routely.trip_service.dto.TripRequest;
import com.routely.trip_service.dto.VerifyPinRequest;
import com.routely.trip_service.model.Ride;
import com.routely.trip_service.service.TripService;

import jakarta.validation.Valid;

@RestController
public class TripController {
	@Autowired
	private TripService tripService;

	private Logger logger = LoggerFactory.getLogger(TripController.class);

	@PostMapping("/user/requestRide")
	public ResponseEntity<String> requestRide(@RequestBody TripRequest request) throws Exception {
		Long rideId = null;
		try {
			rideId = tripService.requestRide(request);
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while requesting ride", e.getLocalizedMessage());
			return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
					.body("Error occured while requesting ride" + e.getLocalizedMessage());
		}
		return ResponseEntity.ok(rideId.toString());
	}
	
	@PostMapping("/user/rideDetails")
	public ResponseEntity<Ride> userRideDetails(@RequestBody TripRequest request) {
		Ride ride = null;
		try {
			ride = tripService.getUserCurrentRide(request.getUserId()).get();
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while fetching ride details", e.getLocalizedMessage());
		}
		return ResponseEntity.ok(ride);
	}
	
	@PostMapping("/user/cancelRide")
	public ResponseEntity<String> cancelRide(@RequestBody TripRequest request) {
		try {
			tripService.cancelRide(request, ActorType.USER);
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while cancelling ride", e.getLocalizedMessage());
			return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
					.body("Error occured while cancelling ride" + e.getLocalizedMessage());
		}
		return ResponseEntity.ok("Ride cancelled.");
	}
	
	@PostMapping("/user/getPinDetails")
	public ResponseEntity<RidePinResponse> getPinDetails(@RequestBody TripRequest request) {
		RidePinResponse ridePinResponse = null;
		try {
			ridePinResponse = tripService.getRidePin(request);
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while cancelling ride", e.getLocalizedMessage());
		}
		return ResponseEntity.ok(ridePinResponse);
	}
	
	@PostMapping("/driver/verify-pin")
    public ResponseEntity<String> verifyAndStart(@RequestBody @Valid VerifyPinRequest request) {       
        boolean success = tripService.startTripWithPin(request.getRideId(), request.getPin());

        if (success) {
            return ResponseEntity.ok("Trip started successfully");
        } else {
            // Don't tell them WHY it failed (security), just that it failed.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid PIN or Ride State");
        }
    }

	@PostMapping("/driver/acceptRide")
	public ResponseEntity<AcceptRideResult> acceptRide(@RequestBody TripRequest request) throws Exception {
		AcceptRideResult response = new AcceptRideResult();
		try {
			response = tripService.acceptRide(request);
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while requesting ride", e.getLocalizedMessage());
		}
		return ResponseEntity.ok(response);

	}
	
	@PostMapping("/driver/rideDetails")
	public ResponseEntity<Ride> driverRideDetails(@RequestBody TripRequest request) {
		Ride ride = null;
		try {
			ride = tripService.getDriverCurrentRide(request.getDriverId()).get();
		} catch (Exception e) {
			e.printStackTrace();
			logger.info("Error occured while fetching ride details", e.getLocalizedMessage());
		}
		return ResponseEntity.ok(ride);
	}
}
