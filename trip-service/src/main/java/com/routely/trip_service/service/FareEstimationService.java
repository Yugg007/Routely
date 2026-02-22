package com.routely.trip_service.service;

import org.springframework.beans.factory.annotation.Autowired;
//FareEstimationService.java
import org.springframework.stereotype.Service;

import com.routely.trip_service.config.FareProperties;
import com.routely.trip_service.config.RideTypeConfig;
import com.routely.trip_service.dto.FareEstimateRequest;
import com.routely.trip_service.dto.FareEstimateResponse;
import com.routely.trip_service.model.RideType;
import com.routely.trip_service.utils.DistanceUtils;

@Service
public class FareEstimationService {
	
	@Autowired
	private FareProperties fareProperties;
	
	public FareEstimateResponse estimateFare(FareEstimateRequest request) {
		
		double distanceKm = request.getDistanceKm();
		double durationMin = request.getDurationMin();
		
		double baseFare = fareProperties.getBase();
		
		double distanceComponent = fareProperties.getPerKm() * distanceKm;
		double timeComponent = fareProperties.getPerMinute() * durationMin;
		
		double routeFees = 0; //sum of tolls, airport_fee, congestion_charge
		double bookingFee = fareProperties.getBooking();
		
		double rawFare = baseFare + distanceComponent + timeComponent + routeFees + bookingFee;
		
		double multiplier = 1.3; // = surge_multiplier * time_of_day_multiplier * zone_multiplier * weather_multiplier
		
		double fareBeforePromo = rawFare * multiplier;

		// Step 3: Calculate fare
//		double estimatedFare = rideType.getBaseFare() + (rideType.getPerKmRate() * distanceKm);
		double estimatedFare = 50 + (3 * distanceKm);

		FareEstimateResponse res = new FareEstimateResponse();
		res.setRideType(request.getRideType());
		res.setDistanceKm(Math.round(distanceKm * 100.0) / 100.0);
		res.setDurationMin(durationMin);
		res.setBaseFare(50);
		res.setPerKmRate(3);
		res.setEstimatedFare(Math.round(estimatedFare));
		res.setFormattedFare("₹" + Math.round(estimatedFare));
		res.setCurrency("INR");
		res.setMessage("Estimated using fallback Haversine formula");

		return res;
	}

//	public FareEstimateResponse estimateFare(FareEstimateRequest req) {
//		RideType rideType = RideTypeConfig.RIDE_TYPES.get(req.getRideTypeId());
//		if (rideType == null) {
//			throw new IllegalArgumentException("Invalid ride type: " + req.getRideTypeId());
//		}
//
//		//Estimate distanceKm, durationMin
//		double distanceKm = DistanceUtils.haversineDistance(req.getPickupLat(), req.getPickupLng(), req.getDropLat(),
//				req.getDropLng());
//
//		int durationMin = Math.max(1, (int) Math.ceil(distanceKm / 1.6));
//
//		double baseFare = fareProperties.getBase();
//		
//		double distanceComponent = fareProperties.getPerKm() * distanceKm;
//		double timeComponent = fareProperties.getPerMinute() * durationMin;
//		
//		double routeFees = 0; //sum of tolls, airport_fee, congestion_charge
//		double bookingFee = fareProperties.getBooking();
//		
//		double rawFare = baseFare + distanceComponent + timeComponent + routeFees + bookingFee;
//		
//		double multiplier = 1.3; // = surge_multiplier * time_of_day_multiplier * zone_multiplier * weather_multiplier
//		
//		double fareBeforePromo = rawFare * multiplier;
//
//		// Step 3: Calculate fare
//		double estimatedFare = rideType.getBaseFare() + (rideType.getPerKmRate() * distanceKm);
//
//		FareEstimateResponse res = new FareEstimateResponse();
//		res.setRideType(rideType.getName());
//		res.setDistanceKm(Math.round(distanceKm * 100.0) / 100.0);
//		res.setDurationMin(durationMin);
//		res.setBaseFare(rideType.getBaseFare());
//		res.setPerKmRate(rideType.getPerKmRate());
//		res.setEstimatedFare(Math.round(estimatedFare));
//		res.setFormattedFare("₹" + Math.round(estimatedFare));
//		res.setCurrency("INR");
//		res.setMessage("Estimated using fallback Haversine formula");
//
//		return res;
//	}
}
