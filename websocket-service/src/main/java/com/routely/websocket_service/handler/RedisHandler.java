package com.routely.websocket_service.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.domain.geo.Metrics;
import org.springframework.stereotype.Component;

import com.routely.shared.model.RideRequest;
import com.routely.shared.utils.Constants;

@Component
public class RedisHandler {
	
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Keys for optimized structures
	private String STATE_KEY = "user_state:";
    private static final String REDIS_DRIVER_GEO_KEY = Constants.REDIS_DRIVER_GEO_KEY;
    private static final String REDIS_PENDING_RIDE_KEYS = Constants.REDIS_PENDING_RIDE_KEYS;
    private static final String REDIS_RIDE_DATA_PREFIX = Constants.REDIS_RIDE_DATA_PREFIX;
    private static final String DATA = Constants.REDIS_RIDE_DATA;
    private static final String STATUS = Constants.REDIS_RIDE_STATUS;
    private static final String REDIS_RIDE_STATUS_WAITING_FOR_DRIVER = Constants.REDIS_RIDE_STATUS_WAITING_FOR_DRIVER;

    
    // --- GEOSPATIAL OPERATIONS ---
    public void updateLocationGeo(Long id, double lat, double lng) {
        // Adds/Updates driver coordinates in a spatial index (O(log N))
        redisTemplate.opsForGeo().add(REDIS_DRIVER_GEO_KEY, new Point(lng, lat), id.toString());
    }

    public List<Long> findNearbyDriverIds(double lat, double lng, double radiusInKm) {
        // Fast spatial search using Redis native GEO radius (O(log N + M))
        Circle circle = new Circle(new Point(lng, lat), new Distance(radiusInKm, Metrics.KILOMETERS));
        GeoResults<RedisGeoCommands.GeoLocation<Object>> results = redisTemplate.opsForGeo().radius(REDIS_DRIVER_GEO_KEY, circle);
        
        List<Long> ids = new ArrayList<>();
        if (results != null) {
            results.forEach(res -> ids.add(Long.valueOf(res.getContent().getName().toString())));
        }
        return ids;
    }

    public void addRideToQueue(RideRequest ride) {
        // Store the actual object in a Hash (O(1)) instead of a massive JSON List
        String rideKey = REDIS_RIDE_DATA_PREFIX + ride.getRideId();
        redisTemplate.opsForHash().put(rideKey, DATA, ride);      					// key -> data -> ridepojo
        updateRideStatus(ride.getRideId(), REDIS_RIDE_STATUS_WAITING_FOR_DRIVER);  // key -> status -> currentRideStatus
        
        // Push ID to a list for dispatching (Atomic Queue)
        redisTemplate.opsForSet().add(REDIS_PENDING_RIDE_KEYS, ride.getRideId());
    }

    public Set<Object> getAllPendingRideIds() {
    	return redisTemplate.opsForSet().members(REDIS_PENDING_RIDE_KEYS);
    }

    public RideRequest getRideData(Long rideId) {
        return (RideRequest) redisTemplate.opsForHash().get(REDIS_RIDE_DATA_PREFIX + rideId, DATA);
    }
    
    public String getRideStatus(Long rideId) {
        return (String) redisTemplate.opsForHash().get(REDIS_RIDE_DATA_PREFIX + rideId, STATUS);
    }   

    public void removeDriverData(Long driverId) {
        redisTemplate.opsForGeo().remove(REDIS_DRIVER_GEO_KEY, driverId.toString());
    }

    // Legacy support for single value keys (e.g., driver metadata)
    public Object getValue(String key) { return redisTemplate.opsForValue().get(key); }
    public void setValue(String key, Object value) { redisTemplate.opsForValue().set(key, value); }
    public void delete(String key) { redisTemplate.delete(key); }

    public void updateRideStatus(Long rideId, String status) {
        // Atomic update of a single field in a Hash
        redisTemplate.opsForHash().put(REDIS_RIDE_DATA_PREFIX + rideId, STATUS, status);
    }

    public void removeRideFromQueue(Long rideId) {
        // O(N) where N is number of elements, but very fast for small queues
        redisTemplate.opsForHash().delete(REDIS_PENDING_RIDE_KEYS, rideId);
    }

    public void deleteRideData(Long rideId) {
        redisTemplate.delete(REDIS_RIDE_DATA_PREFIX + rideId);
    }
    
    
    
    public Long addToRedisSet(String key, String value) {
        return redisTemplate.opsForSet().add(key, value);
    }

    public Set<Object> getFromRedisSet(String key) {
        return redisTemplate.opsForSet().members(key);
    }

    public void removeFromRedisSet(String key, String toRemove) {
        redisTemplate.opsForSet().remove(key, toRemove);
    } 
    
    public boolean isInRedisSet(String key, String value) {
        Boolean exists = redisTemplate.opsForSet().isMember(key, value);
        return Boolean.TRUE.equals(exists);
    }
    
    public Long sizeOfRedisSet(String key) {
        if (key == null || key.isEmpty()) {
            return 0L;
        }
        
        Long size = redisTemplate.opsForSet().size(key);
        return size != null ? size : 0L;
    }

    public void putInList(String key, String value) {
        redisTemplate.opsForList().rightPush(key, value);
    }

    public String getFirstFromList(String key) {
        return (String) redisTemplate.opsForList().index(key, 0);
    }
    
    public List<Object> getFromList(String key) {
    	return redisTemplate.opsForList().range(key, 0, -1);
    }

    public void deleteFromList(String key, String value) {
        redisTemplate.opsForList().remove(key, 0, value);
    }

    public boolean isInList(String key, String value) {
        Long index = redisTemplate.opsForList().indexOf(key, value);
        return index != null && index >= 0;
    } 
    public void deleteStateValue(Long id) {
        String key = STATE_KEY + id;
        redisTemplate.delete(key);
    }
    
}