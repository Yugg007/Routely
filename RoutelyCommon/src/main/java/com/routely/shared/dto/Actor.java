package com.routely.shared.dto;

import com.routely.shared.enums.ActorType;
import com.routely.shared.enums.SessionState;

public class Actor {
	SessionState actorState;
	Long actorId;
	ActorType actorType;

	public Long getActorId() {
		return actorId;
	}

	public void setActorId(Long actorId) {
		this.actorId = actorId;
	}

	public ActorType getActorType() {
		return actorType;
	}

	public void setActorType(ActorType actorType) {
		this.actorType = actorType;
	}

	public SessionState getActorState() {
		return actorState;
	}

	public void setActorState(SessionState actorState) {
		this.actorState = actorState;
	}

	public Actor(SessionState actorState, Long actorId, ActorType actorType) {
		super();
		this.actorState = actorState;
		this.actorId = actorId;
		this.actorType = actorType;
	}

	public Actor() {
		super();
		// TODO Auto-generated constructor stub
	}

}
