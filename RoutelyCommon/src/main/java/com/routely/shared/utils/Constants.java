package com.routely.shared.utils;

public class Constants {
    // **********   REDIS KEY Mapping (snake_case)   ************
	public static final String REDIS_PENDING_RIDE_KEYS = "redis_pending_ride_keys"; //All the ride_id which are yet to assign drivers.
	public static final String REDIS_DRIVER_GEO_KEY = "drivers:geo:locations";  //Help to get actor_id(driver_id) around specific km
	public static final String REDIS_RIDE_DATA = "data";
	public static final String REDIS_RIDE_STATUS = "status";
	//Redis key prefix
	public static final String REDIS_USER_LOCATION_PREFIX = "user_location:";
	public static final String REDIS_DRIVER_LOCATION_PREFIX = "driver_location:";  //Driver location against actor_id
	public static final String REDIS_RIDE_DATA_PREFIX = "ride_data:";     //RideRequest pojo against ride_id.
	public static final String REDIS_DRIVER_RIDE_POOL_PREFIX = "driver_ride_pool:";
	public static final String REDIS_DRIVER_DECLINED_RIDES_PREFIX = "driver_declined_rides:";
	public static final String REDIS_DRIVER_ACCEPTED_RIDES_PREFIX = "driver_accepted_rides:";
	public static final String REDIS_DRIVER_CANCELLED_RIDES_PREFIX = "driver_cancelled_rides:";
	//Ride Status
	public static final String REDIS_RIDE_STATUS_WAITING_FOR_DRIVER = "ride_waiting_for_driver";
	public static final String REDIS_RIDE_STATUS_ACCEPTED = "ride_accepted";
	public static final String REDIS_RIDE_STATUS_DRIVER_ARRIVED = "ride_driver_arrived";
	public static final String REDIS_RIDE_STATUS_ON_TRIP = "ride_on_trip";
	
	
	
	// *************  Kafka Event Mapping (SCREAMING_SNAKE_CASE)   *************
    public static final String EVENT_RIDE_REQUESTED = "RIDE_REQUESTED";
    public static final String EVENT_RIDE_ACCEPTED = "RIDE_ACCEPTED";
    public static final String EVENT_ON_TRIP = "RIDE_ON_TRIP";
    public static final String EVENT_DRIVER_ARRIVED = "DRIVER_ARRIVED";
    public static final String EVENT_RIDE_CANCELLED = "RIDE_CANCELLED";
	public static final String EVENT_STATE_TRANSFER = "STATE_TRANSFER";
	public static final String EVENT_STATE_ACKNOWLEDGE = "STATE_ACKNOWLEDGE";
	public static final String EVENT_RIDE_COMPLETED = "RIDE_COMPLETED";
    
    //*************   Kafka Topic Names  *************
    public static final String ROUTELY_TRIP_TOPIC = "ROUTELY_TRIP";
	public static final String ROUTELY_STATE_TOPIC = "ROUTELY_STATE_TOPIC";    

    // *************    Websocket To Frontend Identifier  *************
    public static final String RIDE_OFFERED = "RIDE_OFFERED"; //Ride offerred to frontend   
    public static final String RIDE_REQUESTS = "RIDE_REQUESTS"; //All the ride request offered to driver
    public static final String RIDE_ACCEPTED = "RIDE_ACCEPTED";
	public static final String STATE_CHANGE = "STATE_CHANGE"; //To notify actors about state change
	public static final String DRIVER_LOCATION_SYNCED = "DRIVER_LOCATION_SYNCED"; 
	public static final String USER_LOCATION_SYNCED = "USER_LOCATION_SYNCED";
	public static final String RIDE_ACCEPTED_BY_DRIVER = "RIDE_ACCEPTED_BY_DRIVER"; //message for user from driver
	public static final String AVAILABLE_DRIVERS = "AVAILABLE_DRIVERS";
	public static final String ENABLE_DRIVER_ARRIVED_BUTTON = "ENABLE_DRIVER_ARRIVED_BUTTON";
	
	//*************   Frontend To WebSocket Identifier  *************
	public static final String DRIVER_LOCATION_PUSH = "DRIVER_LOCATION_PUSH"; 
	public static final String USER_LOCATION_PUSH = "USER_LOCATION_PUSH";
	public static final String DRIVER_DECLINED_OFFER = "DRIVER_DECLINED_OFFER";
    
    //*************   Identifier of actor_id while connecting and disconnecting a actor   *************
    public static final String ID = "ID";
    
    
    //*************    Backend Identifier   *************
	public static final String ROUTELY_FRONTEND = "ROUTELY_FRONTEND";


    

	
	
	
	
	//need to think for better names and usability
	public static final String DRIVER_ARRIVED = "DRIVER_ARRIVED";

};