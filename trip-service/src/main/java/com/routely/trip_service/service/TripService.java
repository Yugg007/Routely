package com.routely.trip_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.routely.trip_service.dto.AcceptRideResult;
import com.routely.trip_service.dto.TripRequest;
import com.routely.trip_service.model.Ride;
import com.routely.trip_service.repository.RideRepository;

@Service
public class TripService {
	@Autowired
	private KafkaService kafkaService;

	@Autowired
	private RideRepository rideRepository;

	public enum RideStatus {
		PENDING, ACCEPTED, CANCELLED
	}

	public void requestRide(TripRequest request) {
		// TODO Auto-generated method stub

		Ride ride = new Ride();
		ride.setRideType(request.getRideType());
		ride.setEndAddress(request.getEndAddress());
		ride.setEndLat(request.getEndLat());
		ride.setEndLng(request.getEndLng());
		ride.setStartAddress(request.getStartAddress());
		ride.setStartLat(request.getStartLat());
		ride.setStartLng(request.getStartLng());
		ride.setUserId(request.getUser_id());
		ride.setUserMobNo(request.getUserMobNo());
		ride.setName(request.getName());
		ride.setStatus(RideStatus.PENDING);

		rideRepository.save(ride);

		request.setRide_id(ride.getRideId());
		try {
			kafkaService.sendTripRequest(request);
		} catch (Exception e) {
			// TODO: handle exception
			e.printStackTrace();
		}
		return;
	}

	@Transactional
	public AcceptRideResult acceptRide(Long rideId, Long driverId) {

		// Pessimistic lock the ride row
		Ride ride = rideRepository.findByIdForUpdate(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));

		if (ride.getStatus() == RideStatus.PENDING) {
			ride.setStatus(RideStatus.ACCEPTED);
			ride.setDriverId(driverId);
			rideRepository.save(ride);
			return AcceptRideResult.success(rideId, driverId);
		}

		if (driverId.equals(ride.getDriverId())) {
			return AcceptRideResult.alreadyAcceptedBySameDriver(rideId, driverId);
		} else {
			return AcceptRideResult.failed(rideId, driverId, ride.getDriverId());
		}
	}
}
