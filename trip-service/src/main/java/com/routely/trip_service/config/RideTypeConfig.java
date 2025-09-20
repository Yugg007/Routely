package com.routely.trip_service.config;

//RideTypeConfig.java
import java.util.Map;

import com.routely.trip_service.model.RideType;

public class RideTypeConfig {
	public static final Map<String, RideType> RIDE_TYPES = Map.of(
			"bike", new RideType("bike", "Bike", 20, 6, 2),
			"auto", new RideType("auto", "Auto", 30, 8, 4), 
			"car", new RideType("car", "Car", 50, 10, 6), 
			"premier", new RideType("premier", "Premier", 120, 18, 8));
}
