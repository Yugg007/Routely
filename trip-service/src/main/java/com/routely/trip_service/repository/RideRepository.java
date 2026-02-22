package com.routely.trip_service.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.routely.shared.enums.RideStatus;
import com.routely.trip_service.model.Ride;

import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT r FROM Ride r WHERE r.rideId = :rideId")
	Optional<Ride> findByIdForUpdate(@Param("rideId") Long rideId);

	Optional<Ride> findFirstByUserIdOrderByCreatedOnDesc(Long userId);

	@Query("SELECT r FROM Ride r WHERE r.userId = :userId " + "AND r.status != :excludedStatus "
			+ "AND r.createdOn >= :timeThreshold " + "ORDER BY r.createdOn DESC LIMIT 1")
	Optional<Ride> findLatestActiveRide(@Param("userId") Long userId,
			@Param("excludedStatus") RideStatus excludedStatus, @Param("timeThreshold") LocalDateTime timeThreshold);

	// Pessimistic Lock: Prevents two threads from checking 'active' status at once
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT r FROM Ride r WHERE r.userId = :userId AND r.status IN :activeStatuses")
	Optional<Ride> findActiveRideForUpdate(Long userId, List<RideStatus> activeStatuses);

	// Atomic Update: Ensures the status only changes if it's currently in an
	// expected state
	@Modifying
	@Query("UPDATE Ride r SET r.status = :newStatus, r.updatedOn = CURRENT_TIMESTAMP "
			+ "WHERE r.rideId = :rideId AND r.status IN :allowedOldStatuses")
	int updateStatusIfAllowed(Long rideId, RideStatus newStatus, List<RideStatus> allowedOldStatuses);

	Optional<Ride> findFirstByUserIdAndStatusNotAndCreatedOnAfterOrderByCreatedOnDesc(
	        Long userId, RideStatus status, LocalDateTime time);
	
	@Modifying
    @Transactional
    @Query("UPDATE Ride r SET r.status = :newStatus, r.updatedBy = 'USER', r.updatedOn = CURRENT_TIMESTAMP " +
           "WHERE r.rideId = :rideId AND r.userId = :userId " +
           "AND r.status IN :cancellableStatuses")
    int atomicCancel(
        @Param("rideId") Long rideId, 
        @Param("userId") Long userId, 
        @Param("newStatus") RideStatus newStatus, 
        @Param("cancellableStatuses") List<RideStatus> cancellableStatuses
    );
	
	@Modifying
	@Query("UPDATE Ride r SET r.status = :targetStatus, r.driverId = :driverId, r.updatedOn = :now " +
	       "WHERE r.rideId = :rideId AND r.status = :requiredStatus")
	int atomicAcceptRide(@Param("rideId") Long rideId, 
	                     @Param("driverId") Long driverId, 
	                     @Param("targetStatus") RideStatus targetStatus, 
	                     @Param("requiredStatus") RideStatus requiredStatus,
	                     @Param("now") LocalDateTime now);

	Optional<Ride> findTopByUserIdAndStatusInOrderByCreatedOnDesc(Long userId, List<RideStatus> activeStatuses);

	Optional<Ride> findTopByDriverIdAndStatusInOrderByCreatedOnDesc(Long driverId, List<RideStatus> activeStatuses);

	@Modifying
    @Transactional
    @Query("UPDATE Ride r SET r.status = 'ON_TRIP', r.isPinVerified = true " +
           "WHERE r.rideId = :rideId AND r.otpPin = :inputPin AND r.status = :status")
    int verifyPinAndStartTrip(@Param("rideId") Long rideId, @Param("inputPin") String inputPin, @Param("status") RideStatus accepted);
}
