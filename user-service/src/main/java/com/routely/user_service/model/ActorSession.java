package com.routely.user_service.model;

import com.routely.shared.enums.SessionState;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "actor_sessions")
public class ActorSession {
	@Id
	private Long actorId;

	@Enumerated(EnumType.STRING)
	@Column(name = "actor_state", nullable = false, length = 30)
	private SessionState actorState;

	public ActorSession(Long actorId, SessionState actorState) {
		// TODO Auto-generated constructor stub
		this.actorId = actorId;
		this.actorState = actorState;
	}

	public ActorSession() {
		super();
		// TODO Auto-generated constructor stub
	}

	public Long getActorId() {
		return actorId;
	}

	public void setActorId(Long actorId) {
		this.actorId = actorId;
	}

	public SessionState getActorState() {
		return actorState;
	}

	public void setActorState(SessionState actorState) {
		this.actorState = actorState;
	}

}