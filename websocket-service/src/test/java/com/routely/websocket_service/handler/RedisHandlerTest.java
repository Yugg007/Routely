package com.routely.websocket_service.handler;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import com.routely.shared.utils.Constants;

@ExtendWith(MockitoExtension.class)
class RedisHandlerTest {
    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private SetOperations<String, Object> setOperations;
    @Mock
    private HashOperations<String, Object, Object> hashOperations;
    @Mock
    private ValueOperations<String, Object> valueOperations;

    private RedisHandler redisHandler;

    @BeforeEach
    void setUp() {
        redisHandler = new RedisHandler();
        ReflectionTestUtils.setField(redisHandler, "redisTemplate", redisTemplate);
    }

    @Test
    void removesPendingRideFromSet() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        redisHandler.removeRideFromQueue(42L);

        verify(setOperations).remove(Constants.REDIS_PENDING_RIDE_KEYS, 42L);
    }

    @Test
    void acceptsRideForOnlyOneDriver() {
        String rideKey = Constants.REDIS_RIDE_DATA_PREFIX + 42L;
        String claimKey = "ride_accept_claim:42";
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(hashOperations.get(rideKey, Constants.REDIS_RIDE_STATUS))
                .thenReturn(Constants.REDIS_RIDE_STATUS_WAITING_FOR_DRIVER);
        when(valueOperations.setIfAbsent(claimKey, "7", 24, TimeUnit.HOURS)).thenReturn(true);
        when(valueOperations.setIfAbsent(claimKey, "8", 24, TimeUnit.HOURS)).thenReturn(false);
        when(valueOperations.get(claimKey)).thenReturn("7");

        assertTrue(redisHandler.claimRideAcceptance(42L, 7L));
        assertFalse(redisHandler.claimRideAcceptance(42L, 8L));

        verify(hashOperations).put(rideKey, Constants.REDIS_RIDE_STATUS, Constants.REDIS_RIDE_STATUS_ACCEPTED);
        verify(valueOperations).setIfAbsent(claimKey, "8", 24, TimeUnit.HOURS);
    }
}