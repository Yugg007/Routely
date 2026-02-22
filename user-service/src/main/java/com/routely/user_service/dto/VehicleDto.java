package com.routely.user_service.dto;

import com.routely.user_service.model.Vehicle;

public class VehicleDto {
	private Long id;
	private String email;
	private String type;
	private String model;
	private String registrationNo;
	private Integer capacity;

	public VehicleDto(Vehicle pojo) {
		// TODO Auto-generated constructor stub
		this.capacity = pojo.getCapacity();
		this.type = pojo.getType();
		this.model = pojo.getModel();
		this.registrationNo = pojo.getRegistrationNo();
		this.id = pojo.getId();
	}
	
	public VehicleDto() {}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public String getRegistrationNo() {
		return registrationNo;
	}

	public void setRegistrationNo(String registrationNo) {
		this.registrationNo = registrationNo;
	}

	public Integer getCapacity() {
		return capacity;
	}

	public void setCapacity(Integer capacity) {
		this.capacity = capacity;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

}
