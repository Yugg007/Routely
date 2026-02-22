package com.routely.shared.utils;

public class Constants {
    // 1. REDIS KEY PREFIXES (snake_case)
    // Used for: redisTemplate.opsForValue().set(DRIVER_LOC_PREFIX + id, ...)
    public static final String DRIVER_LOC_PREFIX = "driver:location:";
    public static final String RIDE_DATA_PREFIX = "ride:data:";
    public static final String DRIVER_SEEN_PREFIX = "driver:seen:";
    
    // 2. REDIS TOPICS / STREAMS
    public static final String TRIP_STREAM = "stream:trip:requests";
    public static final String STATE_TOPIC = "topic:state:transfer";

    // 3. WEBSOCKET / FRONTEND EVENTS (SCREAMING_SNAKE_CASE)
    // These match exactly what the Frontend listener looks for
    public static final String EVENT_RIDE_REQUESTED = "RIDE_REQUESTED";
    public static final String EVENT_RIDE_ACCEPTED = "RIDE_ACCEPTED";
    public static final String EVENT_ON_TRIP = "RIDE_ON_TRIP";
    public static final String EVENT_DRIVER_ARRIVED = "DRIVER_ARRIVED";
    public static final String EVENT_RIDE_CANCELLED = "EVENT_RIDE_CANCELLED";
    public static final String EVENT_RIDE_CANCELLED_BY_USER = "EVENT_RIDE_CANCELLED_BY_USER";
    public static final String EVENT_RIDE_CANCELLED_BY_DRIVER = "EVENT_RIDE_CANCELLED_BY_DRIVER";
    public static final String EVENT_LOCATION_UPDATE = "LOCATION_UPDATE";
    public static final String RIDE_OFFERED = "RIDE_OFFERED";
    public static final String ID = "ID";

    // 4. STATUS VALUES
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    
    public static final String ROUTELY_TRIP_TOPIC = "ROUTELY_TRIP";
	public static final String ROUTELY_TRIP_STATE_TOPIC = "ROUTELY_TRIP_STATE_TOPIC";
	public static final String ROUTELY_USER_STATE_TOPIC = "ROUTELY_USER_STATE_TOPIC";
	public static final String STATE_TRANSFER = "STATE_TRANSFER";
	public static final String BULK_STATE_TRANSFER = "BULK_STATE_TRANSFER";
	public static final String STATE_CHANGE = "STATE_CHANGE";
	
	
	
	
	//need to think for better names
	public static final String DRIVER_LOCATION_PUSH = "DRIVER_LOCATION_PUSH"; 
	public static final String DRIVER_LOCATION_SYNC = "DRIVER_LOCATION_SYNC"; 
	public static final String LOCATION_PREFIX = "Location:";
	public static final String DRIVER_LOCATION_PREFIX = "DRIVER_LOCATION_PREFIX";
	public static final String USER_LOCATION_PREFIX = "USER_LOCATION_PREFIX";
	public static final String DRIVER_ARRIVED = "DRIVER_ARRIVED";
	public static final String DRIVER_DECLINED = "DRIVER_DECLINED_TRIP";
	public static final String ROUTELY_FRONTEND = "ROUTELY_FRONTEND";
	
	
	//frontend
	public static final String RIDE_ACCEPTED_BY_DRIVER = "RIDE_ACCEPTED_BY_DRIVER";
	public static final String AVAILABLE_DRIVER = "AVAILABLE_DRIVER";
	public static final String USER_LOCATION_PUSH = "USER_LOCATION_PUSH";
	public static final String USER_LOCATION_SYNC = "USER_LOCATION_SYNC";
	public static final String OFFER_RIDE_TO_DRIVER = null;
	
}