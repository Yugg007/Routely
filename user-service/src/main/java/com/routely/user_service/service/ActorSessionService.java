package com.routely.user_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routely.shared.dto.Actor;
import com.routely.shared.enums.SessionState;
import com.routely.shared.utils.ActorStateManagement;
import com.routely.user_service.model.ActorSession;
import com.routely.user_service.repository.ActorSessionRepository;

import jakarta.transaction.Transactional;

@Service
public class ActorSessionService {

    private final KafkaProducerService kafkaProducerService;
	@Autowired
	private ActorSessionRepository actorSessionRepository; 
	
	@Autowired
	private ObjectMapper objectMapper;

    ActorSessionService(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

	@Transactional
	public SessionState updateSessionState(Long id, SessionState state) {
	    // 1. Attempt the update first (efficient)
	    int rowsAffected = actorSessionRepository.updateStateOnly(id, state);

	    // 2. If 0 rows affected, the actor doesn't exist yet; perform an Upsert
	    if (rowsAffected == 0) {
	        actorSessionRepository.save(new ActorSession(id, SessionState.IDLE));
	        return SessionState.IDLE;
	    }
	    
	    return state;
	}
	
	public void moveToNextState(Actor currState) {
		System.out.println("Before update : " + currState.toString());
		SessionState nextState = ActorStateManagement.nextState(currState.getActorState(), currState.getActorType());
		currState.setActorState(nextState);
		updateSessionState(currState.getActorId(), nextState);
		System.out.println("After update : " + currState.toString());
	}

	public SessionState getActorState(Long id) {
		// TODO Auto-generated method stub
		try {
			return actorSessionRepository.getCurrentState(id);
			
		} catch (Exception e) {
			// TODO: handle exception
			e.printStackTrace();
		}
		return SessionState.IDLE;
	}
	
	public void handleStateChangeEvent(Long id, SessionState state) {
		SessionState updatedState = updateSessionState(id, state);
		if(updatedState != null) {
			
		}
		
	}

	public void handleStateChangeEvent(String payload) throws JsonMappingException, JsonProcessingException {
		// TODO Auto-generated method stub
		Actor actor = objectMapper.readValue(payload, Actor.class);
		updateSessionState(actor.getActorId(), actor.getActorState());
		System.out.println("Handling state change");
		kafkaProducerService.produceStateChangeEvent(payload);
		
	}
}
