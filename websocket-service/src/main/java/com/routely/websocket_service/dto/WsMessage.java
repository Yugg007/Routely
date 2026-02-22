package com.routely.websocket_service.dto;

public class WsMessage {
	private String type;
	private Object payload;
	private long serverTime;
	
	public WsMessage() {
        this.serverTime = System.currentTimeMillis();
    }
    
    // Your existing constructor
    public WsMessage(String type, Object payload) {
        this(); // Calls the no-arg constructor to set serverTime
        this.type = type;
        this.payload = payload;
    }
	
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public Object getPayload() {
		return payload;
	}
	public void setPayload(Object payload) {
		this.payload = payload;
	}
	public long getServerTime() {
		return serverTime;
	}
	public void setServerTime(long serverTime) {
		this.serverTime = serverTime;
	}
	

}
