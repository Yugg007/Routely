package com.routely.websocket_service.dto;

public class DriverStatusEvent {
    private String driverId;
    private String status;
    private String serverId;

    // IMPORTANT: JSON Deserializers need a no-args constructor
    public DriverStatusEvent() {}

    public DriverStatusEvent(String driverId, String status, String serverId) {
        this.driverId = driverId;
        this.status = status;
        this.serverId = serverId;
    }
    // Getters and Setters...

	public String getDriverId() {
		return driverId;
	}

	public void setDriverId(String driverId) {
		this.driverId = driverId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getServerId() {
		return serverId;
	}

	public void setServerId(String serverId) {
		this.serverId = serverId;
	}
}