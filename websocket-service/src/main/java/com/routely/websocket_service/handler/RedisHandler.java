package com.routely.websocket_service.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.domain.geo.Metrics;
import org.springframework.stereotype.Component;

import com.routely.shared.model.RideRequest;

@Component
public class RedisHandler {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Keys for optimized structures
    private static final String DRIVER_GEO_KEY = "drivers:locations";
    private static final String PENDING_RIDES_KEY = "rides:pending_queue";
    private static final String RIDE_DATA_PREFIX = "ride_data:";
    private static final String DRIVER_SEEN_PREFIX = "driver:seen:";
    private static final String DATA = "data";
    private static final String STATUS = "status";

    // --- GEOSPATIAL OPERATIONS ---
    public void updateLocationGeo(Long id, double lat, double lng) {
        // Adds/Updates driver coordinates in a spatial index (O(log N))
        redisTemplate.opsForGeo().add(DRIVER_GEO_KEY, new Point(lng, lat), id.toString());
    }

    public List<Long> findNearbyDriverIds(double lat, double lng, double radiusInKm) {
        // Fast spatial search using Redis native GEO radius (O(log N + M))
        Circle circle = new Circle(new Point(lng, lat), new Distance(radiusInKm, Metrics.KILOMETERS));
        GeoResults<RedisGeoCommands.GeoLocation<Object>> results = redisTemplate.opsForGeo().radius(DRIVER_GEO_KEY, circle);
        
        List<Long> ids = new ArrayList<>();
        if (results != null) {
            results.forEach(res -> ids.add(Long.valueOf(res.getContent().getName().toString())));
        }
        return ids;
    }

    // --- ATOMIC RIDE MANAGEMENT ---
    public void addRideToQueue(RideRequest ride) {
        // Store the actual object in a Hash (O(1)) instead of a massive JSON List
        String rideKey = RIDE_DATA_PREFIX + ride.getRideId();
        redisTemplate.opsForHash().put(rideKey, DATA, ride);
        
        // Push ID to a list for dispatching (Atomic Queue)
        redisTemplate.opsForSet().add(PENDING_RIDES_KEY, ride.getRideId());
    }

    public Set<Object> getAllPendingRideIds() {
    	return redisTemplate.opsForSet().members(PENDING_RIDES_KEY);
    }

    public RideRequest getRideData(Long rideId) {
        return (RideRequest) redisTemplate.opsForHash().get(RIDE_DATA_PREFIX + rideId, DATA);
    }

    // --- DRIVER OFFER TRACKING ---
    public boolean markRideAsSeenByDriver(Long driverId, Long rideId) {
        // Uses a Set to ensure we don't offer the same ride twice (O(1))
        String key = DRIVER_SEEN_PREFIX + driverId;
        return redisTemplate.opsForSet().add(key, rideId.toString()) > 0;
    }

    public void removeDriverData(Long driverId) {
        redisTemplate.delete(DRIVER_SEEN_PREFIX + driverId);
        redisTemplate.opsForGeo().remove(DRIVER_GEO_KEY, driverId.toString());
    }

    // Legacy support for single value keys (e.g., driver metadata)
    public Object getValue(String key) { return redisTemplate.opsForValue().get(key); }
    public void setValue(String key, Object value) { redisTemplate.opsForValue().set(key, value); }
    public void delete(String key) { redisTemplate.delete(key); }

    public void updateRideStatus(Long rideId, String status) {
        // Atomic update of a single field in a Hash
        redisTemplate.opsForHash().put(RIDE_DATA_PREFIX + rideId, STATUS, status);
    }

    public void removeRideFromQueue(Long rideId) {
        // O(N) where N is number of elements, but very fast for small queues
        redisTemplate.opsForHash().delete(PENDING_RIDES_KEY, rideId);
    }

    public void deleteRideData(Long rideId) {
        redisTemplate.delete(RIDE_DATA_PREFIX + rideId);
    }
}