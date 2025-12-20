
package com.routely.trip_service.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.routely.trip_service.model.Ride;

import jakarta.persistence.LockModeType;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long>{
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Ride r WHERE r.rideId = :rideId")
    Optional<Ride> findByIdForUpdate(@Param("rideId") Long rideId);
}
