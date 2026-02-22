package com.routely.websocket_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.routely.shared.model.RideRequest;


@RestController
@RequestMapping("/internal")
public class RideController {
	
	@PostMapping("/requestRide")
	public ResponseEntity<String> requestRide(@RequestBody RideRequest rideRequest){
		System.out.print("Request came on internal controller.");
		return ResponseEntity.ok("Ride broadcasted");
	}
	
	@GetMapping("/test")
	public ResponseEntity<String> test(){
		System.out.print("Testing -  came on internal controller for test endpoint.");
		return ResponseEntity.ok("Security breach");
	}	

}
