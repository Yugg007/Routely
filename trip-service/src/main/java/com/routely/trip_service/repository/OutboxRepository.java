package com.routely.trip_service.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.routely.trip_service.model.OutboxEvent;

public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {
    // Find oldest unprocessed events first to maintain order
    List<OutboxEvent> findByProcessedFalseOrderByCreatedAtAsc();
}