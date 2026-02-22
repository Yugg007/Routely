package com.routely.trip_service.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_outbox")
public class OutboxEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// e.g., "RIDE_CANCELLED"
	@Column(nullable = false)
	private String aggregateType;

	// The specific ID of the ride or user
	@Column(nullable = false)
	private String aggregateId;

	// e.g., "STATE_TRANSFER"
	@Column(nullable = false)
	private String eventType;

	@Column(columnDefinition = "TEXT", nullable = false)
	private String payload;

	@Column(nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(nullable = false)
	private boolean processed = false;

	// For auditing and cleanup jobs
	private LocalDateTime processedAt;

	// Capture why it failed (if it did)
	@Column(columnDefinition = "TEXT")
	private String lastError;

	// Useful if you want to retry specific messages
	private int retryCount = 0;

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public String getAggregateType() {
		return aggregateType;
	}

	public void setAggregateType(String aggregateType) {
		this.aggregateType = aggregateType;
	}

	public String getAggregateId() {
		return aggregateId;
	}

	public void setAggregateId(String aggregateId) {
		this.aggregateId = aggregateId;
	}

	public String getEventType() {
		return eventType;
	}

	public void setEventType(String eventType) {
		this.eventType = eventType;
	}

	public String getPayload() {
		return payload;
	}

	public void setPayload(String payload) {
		this.payload = payload;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public boolean isProcessed() {
		return processed;
	}

	public void setProcessed(boolean processed) {
		this.processed = processed;
	}

	public OutboxEvent() {
		super();
		// TODO Auto-generated constructor stub
	}


	public LocalDateTime getProcessedAt() {
		return processedAt;
	}

	public void setProcessedAt(LocalDateTime processedAt) {
		this.processedAt = processedAt;
	}

	public String getLastError() {
		return lastError;
	}

	public void setLastError(String lastError) {
		this.lastError = lastError;
	}

	public int getRetryCount() {
		return retryCount;
	}

	public void setRetryCount(int retryCount) {
		this.retryCount = retryCount;
	}

	public OutboxEvent(UUID id, String aggregateType, String aggregateId, String eventType,
			String payload, LocalDateTime createdAt, boolean processed, LocalDateTime processedAt, String lastError,
			int retryCount) {
		super();
		this.id = id;
		this.aggregateType = aggregateType;
		this.aggregateId = aggregateId;
		this.eventType = eventType;
		this.payload = payload;
		this.createdAt = createdAt;
		this.processed = processed;
		this.processedAt = processedAt;
		this.lastError = lastError;
		this.retryCount = retryCount;
	}

}