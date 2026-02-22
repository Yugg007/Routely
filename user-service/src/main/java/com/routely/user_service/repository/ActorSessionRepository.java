package com.routely.user_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.routely.shared.enums.SessionState;
import com.routely.user_service.model.ActorSession;

import jakarta.transaction.Transactional;


public interface ActorSessionRepository extends JpaRepository<ActorSession, Long>{
	
	Optional<ActorSession> findByActorId(Long id);
	
	@Query("SELECT s.actorState from ActorSession s WHERE s.actorId = :id")
	SessionState getCurrentState(@Param("id") Long id);
	
	@Modifying
	@Transactional
	@Query("UPDATE ActorSession s SET s.actorState = :state WHERE s.actorId = :id")
	int updateStateOnly(@Param("id") Long id, @Param("state") SessionState actorState);
 
}
